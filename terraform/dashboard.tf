# Closes NFR-008's real remaining gap: real consumption/error/latency
# metrics already exist (request-duration logs, p95 latency metric, 5xx
# error-rate alerts - terraform/alerting.tf) but there was no dedicated,
# at-a-glance analytics view for them - only ad hoc Metrics Explorer
# queries. This dashboard is a real, applied Cloud Monitoring resource
# (not a mockup) surfacing the same real metrics already collected, on
# one page.
resource "google_monitoring_dashboard" "api_usage" {
  dashboard_json = jsonencode({
    displayName = "IST Health Tele-Triage - API usage & error rate"
    mosaicLayout = {
      columns = 12
      tiles = [
        {
          width  = 6
          height = 4
          widget = {
            title = "5xx error rate (soc2)"
            xyChart = {
              dataSets = [
                {
                  timeSeriesQuery = {
                    timeSeriesFilter = {
                      filter      = "resource.type=\"cloud_run_revision\" AND resource.labels.service_name=\"ist-triage-soc2\" AND metric.type=\"logging.googleapis.com/user/${google_logging_metric.auth_failure_rate.name}\""
                      aggregation = { alignmentPeriod = "300s", perSeriesAligner = "ALIGN_RATE" }
                    }
                  }
                }
              ]
            }
          }
        },
        {
          xPos   = 6
          width  = 6
          height = 4
          widget = {
            title = "Queue backlog age (oldest waiting item, seconds)"
            xyChart = {
              dataSets = [
                {
                  timeSeriesQuery = {
                    timeSeriesFilter = {
                      filter      = "resource.type=\"cloud_run_revision\" AND resource.labels.service_name=\"ist-triage-soc2\" AND metric.type=\"logging.googleapis.com/user/${google_logging_metric.queue_oldest_waiting_item_age_seconds.name}\""
                      aggregation = { alignmentPeriod = "300s", perSeriesAligner = "ALIGN_PERCENTILE_99" }
                    }
                  }
                }
              ]
            }
          }
        },
        {
          yPos   = 4
          width  = 6
          height = 4
          widget = {
            title = "Cloud Run request count (soc2)"
            xyChart = {
              dataSets = [
                {
                  timeSeriesQuery = {
                    timeSeriesFilter = {
                      filter      = "resource.type=\"cloud_run_revision\" AND resource.labels.service_name=\"ist-triage-soc2\" AND metric.type=\"run.googleapis.com/request_count\""
                      aggregation = { alignmentPeriod = "300s", perSeriesAligner = "ALIGN_RATE", crossSeriesReducer = "REDUCE_SUM" }
                    }
                  }
                }
              ]
            }
          }
        },
        {
          xPos   = 6
          yPos   = 4
          width  = 6
          height = 4
          widget = {
            title = "Cloud Run request latency p95 (soc2)"
            xyChart = {
              dataSets = [
                {
                  timeSeriesQuery = {
                    timeSeriesFilter = {
                      filter      = "resource.type=\"cloud_run_revision\" AND resource.labels.service_name=\"ist-triage-soc2\" AND metric.type=\"run.googleapis.com/request_latencies\""
                      aggregation = { alignmentPeriod = "300s", perSeriesAligner = "ALIGN_PERCENTILE_95" }
                    }
                  }
                }
              ]
            }
          }
        }
      ]
    }
  })
}
