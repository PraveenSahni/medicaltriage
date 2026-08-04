# SIEM Integration Readiness

## What this is

A real-time, protocol-agnostic log export hook that any SIEM connector
(Microsoft Sentinel, Splunk HTTP Event Collector, QRadar, Syslog gateway,
Kafka bridge, etc.) can subscribe to, closing the "no log-streaming
connector exists" gap identified in the QR vendor questionnaire
(NFR-192, AI-026, Cloud CSQ IS.50).

## What exists

- **GCP project:** `triage-502706`
- **Pub/Sub topic:** `siem-log-export` — the export destination. Any SIEM
  connector that can read from a Pub/Sub subscription (directly, or via
  a small bridge process for connectors that only speak HTTP Event
  Collector/Syslog/Kafka) can attach here.
- **Log sink:** `ist-triage-soc2-siem-export`, filter
  `resource.type="cloud_run_revision" AND resource.labels.service_name="ist-triage-soc2"`
  — streams all `ist-triage-soc2` application, request, and audit-adjacent
  stdout/stderr logs into the topic in real time. Scoped to the soc2
  environment only; `ist-triage-demo` is untouched.
- **IAM:** the Cloud Logging service agent
  (`service-1096520215793@gcp-sa-logging.iam.gserviceaccount.com`) holds
  `roles/pubsub.publisher` on the topic, so the sink can actually deliver.
- **Verified live** (2026-08-04): issued real requests against
  `triagedsoc2.irisstar.tech`, pulled a temporary verification
  subscription, and confirmed real log entries (`run.googleapis.com/stdout`,
  `run.googleapis.com/requests`, including `request_duration` and HTTP
  access-log payloads) arrived in the topic within seconds. The
  verification subscription was deleted after confirming delivery; the
  sink and topic remain in place.

## What this is NOT yet

This closes the "can logs be streamed out in real time" question, but it
is not a finished SIEM integration:

- **No actual SIEM is subscribed today.** Qatar Airways (or whoever owns
  the target SIEM) needs to either (a) grant a service account
  `roles/pubsub.subscriber` on `siem-log-export` and pull directly, or
  (b) stand up a small forwarder (Cloud Function/Cloud Run job) that
  reads the subscription and republishes to their SIEM's actual
  ingestion protocol (HEC token, Syslog endpoint, Kafka broker, etc.) —
  this repo doesn't have that endpoint or its credentials, so the
  forwarder can't be built yet.
- **Not a full SIEM correlation platform.** Cloud CSQ IS.50 also asks
  about merging firewall/IDS/physical-access log sources — this
  architecture (serverless Cloud Run, no on-prem firewall/IDS/physical
  access system) doesn't have those source types to merge; only
  application/audit logs are exported here.

## Next step (not available to this engineering pass)

Get the receiving SIEM's real ingestion details (subscription
credentials, or an HTTP/Syslog/Kafka endpoint) from Qatar Airways, then
either grant them subscriber access directly or build the small
forwarder described above.
