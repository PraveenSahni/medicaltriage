# Monitoring/alerting for ist-triage-qatar-new (NFR-118: "capability to
# raise alerts on increased error rates, SLA drop, performance drop").
#
# STATUS: prepared, NOT YET APPLIED - this project's assistant session is
# blocked from running `terraform apply` (a deliberate restriction, same
# reasoning as docs/operations/qatar-new-cd-setup.md). Run `terraform apply`
# yourself after reviewing the plan, then set notification_channel_ids (see
# below) so these actually page someone instead of firing silently.

variable "notification_channel_ids" {
  description = "Cloud Monitoring notification channel IDs to attach to these policies. Empty by default - deliberately not a guessed/invented paging destination. Create one (e.g. `gcloud beta monitoring channels create --channel-content-from-file=...` or via Console: Monitoring > Alerting > Notification channels) and pass its ID here via -var or a .tfvars file."
  type        = list(string)
  default     = []
}

resource "google_monitoring_alert_policy" "http_5xx_rate" {
  display_name = "Elevated 5xx rate across ist-triage-* services"
  combiner     = "OR"
  conditions {
    display_name = "5xx responses observed"
    condition_threshold {
      filter          = "resource.type=\"cloud_run_revision\" AND resource.labels.service_name=monitoring.regex.full_match(\"ist-triage-.*\") AND metric.type=\"run.googleapis.com/request_count\" AND metric.labels.response_code_class=\"5xx\""
      comparison      = "COMPARISON_GT"
      threshold_value = 0
      duration        = "60s"
      aggregations {
        alignment_period     = "300s"
        per_series_aligner   = "ALIGN_SUM"
        cross_series_reducer = "REDUCE_SUM"
      }
    }
  }
  notification_channels = var.notification_channel_ids
  documentation {
    content   = "A 5xx response was observed on one of the ist-triage-simulation/demo/soc2 Cloud Run services. Check `gcloud run services logs read <service> --region=me-central1 --project=ist-triage-qatar-new` for the underlying error."
    mime_type = "text/markdown"
  }
}

resource "google_monitoring_alert_policy" "auth_failure_spike" {
  display_name = "Authentication failure spike"
  combiner     = "OR"
  conditions {
    display_name = "Repeated 401s on /login within a short window"
    condition_threshold {
      filter          = "resource.type=\"cloud_run_revision\" AND resource.labels.service_name=monitoring.regex.full_match(\"ist-triage-.*\") AND metric.type=\"logging.googleapis.com/user/qatar_new_auth_failure_rate\""
      comparison      = "COMPARISON_GT"
      threshold_value = 10
      duration        = "300s"
      aggregations {
        alignment_period   = "300s"
        per_series_aligner = "ALIGN_RATE"
      }
    }
  }
  notification_channels = var.notification_channel_ids
  documentation {
    content   = "More than 10 failed /api/v1/auth/login attempts/sec sustained for 5 minutes on an ist-triage-* service - a real brute-force/credential-stuffing indicator, not routine user error."
    mime_type = "text/markdown"
  }
}

resource "google_logging_metric" "auth_failure_rate" {
  name   = "qatar_new_auth_failure_rate"
  filter = <<-EOT
    resource.type="cloud_run_revision"
    jsonPayload.path="/login"
    jsonPayload.method="POST"
    jsonPayload.statusCode=401
  EOT
  metric_descriptor {
    metric_kind = "DELTA"
    value_type  = "INT64"
  }
}

resource "google_monitoring_alert_policy" "cloud_sql_high_cpu" {
  display_name = "Cloud SQL (ist-triage-postgres) high CPU"
  combiner     = "OR"
  conditions {
    display_name = "CPU utilization above 80% for 5 minutes"
    condition_threshold {
      filter          = "resource.type=\"cloudsql_database\" AND resource.labels.database_id=\"ist-triage-qatar-new:ist-triage-postgres\" AND metric.type=\"cloudsql.googleapis.com/database/cpu/utilization\""
      comparison      = "COMPARISON_GT"
      threshold_value = 0.8
      duration        = "300s"
      aggregations {
        alignment_period   = "300s"
        per_series_aligner = "ALIGN_MEAN"
      }
    }
  }
  notification_channels = var.notification_channel_ids
  documentation {
    content   = "ist-triage-postgres CPU utilization has been above 80% for 5+ minutes - check for a runaway query, missing index, or genuine load growth requiring a tier bump."
    mime_type = "text/markdown"
  }
}
