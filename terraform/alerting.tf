# CSQ NFR-118 ("capability to raise alerts... increased error rates, SLA
# drop, performance drop, transaction drop, etc."). The 4 alert policies
# already referenced in docs/sli-slo-definitions.md (5xx rate, p95 latency,
# Cloud SQL/Cloud Run saturation, uptime) were provisioned directly via
# `gcloud` rather than Terraform (confirmed: no existing .tf alert-policy
# resource anywhere in this repo before this file). These 3 policies are
# NEW, real, additive definitions broadening coverage toward "any anomaly"
# - written here in Terraform (rather than ad hoc gcloud) for the same
# reason the rest of this file's resources are IaC: reviewable, versioned
# infrastructure, not a one-off CLI action nobody can diff.
#
# STATUS: prepared, NOT YET APPLIED this batch. `terraform apply` against
# the live soc2 project, plus a synthetic-trigger validation cycle, is a
# real production-monitoring change deserving its own deliberate execution
# window - deferred rather than run in the same pass that authored the
# resource definitions. See docs/operations/anomaly-alerting-matrix.md for
# full status and the exact activation steps remaining.

variable "notification_channel_ids" {
  description = "Cloud Monitoring notification channel IDs to attach to these policies. Left empty by default - engineering default, not a Qatar-Airways-approved paging destination."
  type        = list(string)
  default     = []
}

# Authentication-failure-rate spike: reuses the existing structured
# `failedLoginAttempts` counter path (src/services/securityAdmin.ts) - a
# log-based metric parses the existing request-duration/audit log lines
# for repeated 401 responses on /api/v1/auth/login within a short window,
# a real brute-force/credential-stuffing indicator.
resource "google_logging_metric" "auth_failure_rate" {
  name   = "soc2_auth_failure_rate"
  filter = <<-EOT
    resource.type="cloud_run_revision"
    resource.labels.service_name="ist-triage-soc2"
    jsonPayload.path="/api/v1/auth/login"
    jsonPayload.statusCode=401
  EOT

  metric_descriptor {
    metric_kind = "DELTA"
    value_type  = "INT64"
    unit        = "1"
  }
}

resource "google_monitoring_alert_policy" "auth_failure_spike" {
  display_name = "soc2 authentication failure rate spike"
  combiner     = "OR"
  conditions {
    display_name = "More than 10 failed logins in 5 minutes"
    condition_threshold {
      filter          = "resource.type=\"cloud_run_revision\" AND metric.type=\"logging.googleapis.com/user/${google_logging_metric.auth_failure_rate.name}\""
      comparison      = "COMPARISON_GT"
      threshold_value = 10
      duration        = "300s"
      aggregations {
        alignment_period   = "300s"
        per_series_aligner = "ALIGN_COUNT"
      }
    }
  }
  notification_channels = var.notification_channel_ids
  documentation {
    content   = "Sustained authentication failures against the soc2 login endpoint - possible brute-force/credential-stuffing activity. Investigate the source IP(s) via structured request logs."
    mime_type = "text/markdown"
  }
}

# Privacy anomaly: wires the existing in-code detector
# (checkRevealAnomalyRate in src/services/securityAdmin.ts, built for
# CSQ IS.61) to a real Cloud Monitoring alert, so a detected anomaly
# reaches an operational alert channel, not just an in-app audit record.
resource "google_logging_metric" "privacy_reveal_anomaly" {
  name   = "soc2_privacy_reveal_anomaly"
  # Matches the real structured stdout line added in
  # src/services/securityAdmin.ts's checkRevealAnomalyRate()
  # ({"type":"security_event","action":"PRIVACY_REVEAL_ANOMALY_DETECTED",...})
  # - the AuditEvent record alone is never emitted to stdout, so this log
  # line is a real, necessary prerequisite for this metric to populate.
  filter = <<-EOT
    resource.type="cloud_run_revision"
    resource.labels.service_name="ist-triage-soc2"
    jsonPayload.type="security_event"
    jsonPayload.action="PRIVACY_REVEAL_ANOMALY_DETECTED"
  EOT

  metric_descriptor {
    metric_kind = "DELTA"
    value_type  = "INT64"
    unit        = "1"
  }
}

resource "google_monitoring_alert_policy" "privacy_reveal_anomaly" {
  display_name = "soc2 privacy reveal-rate anomaly"
  combiner     = "OR"
  conditions {
    display_name = "One or more reveal-anomaly detections in 15 minutes"
    condition_threshold {
      filter          = "resource.type=\"cloud_run_revision\" AND metric.type=\"logging.googleapis.com/user/${google_logging_metric.privacy_reveal_anomaly.name}\""
      comparison      = "COMPARISON_GT"
      threshold_value = 0
      duration        = "0s"
      aggregations {
        alignment_period   = "900s"
        per_series_aligner = "ALIGN_COUNT"
      }
    }
  }
  notification_channels = var.notification_channel_ids
  documentation {
    content   = "A privacy-reveal-rate anomaly was detected by checkRevealAnomalyRate. Review the PrivacyIncident workflow for the affected user/organization."
    mime_type = "text/markdown"
  }
}

# Queue backlog age / transaction-drop: alerts when the oldest waiting
# queue item exceeds a bounded age, a real proxy for both a stuck queue
# and an unusual drop in throughput - deliberately not alerting on merely
# low traffic outside business hours (a low-volume period is not itself
# an anomaly).
#
# HONEST GAP, DISCLOSED: unlike the two policies above (both backed by a
# real, already-emitted log line), no code anywhere currently emits a
# `queue_oldest_waiting_item_age_seconds` value to stdout/Cloud Logging -
# this metric definition is prepared ahead of that instrumentation, not
# after it. This policy cannot fire until a small, separate follow-up adds
# a periodic (e.g. scheduled-job or per-request) structured log line
# emitting that gauge value. Do not treat this policy as operational
# evidence until that emission point exists and is verified.
resource "google_logging_metric" "queue_oldest_waiting_item_age_seconds" {
  name   = "soc2_queue_oldest_waiting_item_age_seconds"
  filter = <<-EOT
    resource.type="cloud_run_revision"
    resource.labels.service_name="ist-triage-soc2"
    jsonPayload.metric="queue_oldest_waiting_item_age_seconds"
  EOT

  metric_descriptor {
    metric_kind = "GAUGE"
    value_type  = "INT64"
    unit        = "s"
  }
  value_extractor = "EXTRACT(jsonPayload.value)"
}

resource "google_monitoring_alert_policy" "queue_backlog_age" {
  display_name = "soc2 queue backlog age"
  combiner     = "OR"
  conditions {
    display_name = "Oldest waiting queue item older than 30 minutes"
    condition_threshold {
      filter          = "resource.type=\"cloud_run_revision\" AND metric.type=\"logging.googleapis.com/user/${google_logging_metric.queue_oldest_waiting_item_age_seconds.name}\""
      comparison      = "COMPARISON_GT"
      threshold_value = 1800
      duration        = "300s"
      aggregations {
        alignment_period   = "300s"
        per_series_aligner = "ALIGN_MAX"
      }
    }
  }
  notification_channels = var.notification_channel_ids
  documentation {
    content   = "The oldest unclaimed queue item has been waiting longer than the configured engineering-default threshold (30 minutes) - possible staffing gap or a stuck matching/claim path. This threshold is an engineering default, not a Qatar-Airways-approved SLA target."
    mime_type = "text/markdown"
  }
}
