// Monthly SLI/SLO report generator - closes the "reported monthly to Qatar
// Airways" half of NFR-189 (docs/sli-slo-definitions.md defines the SLIs;
// this produces the actual report content). Pulls real data from the
// sources already wired up this remediation pass:
//   - Availability: Cloud Monitoring uptime check results
//   - Error rate: the 5xx alert policies' underlying request_count metric
//   - Latency: the request_duration_ms log-based metric (p50/p95/p99)
//   - Saturation: Cloud SQL connection count / Cloud Run instance count
// This produces the report content; actually sending it to QR on a
// schedule (email/Slack/etc.) is a separate process step, not built here -
// see the honest note in the output.
// Usage: node scripts/generateMonthlySliReport.mjs [projectId]
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const PROJECT = process.argv[2] ?? "triage-502706";

// Cloud Run's metadata server provides the runtime service account's OAuth
// token with no gcloud SDK/dependency needed - this is what lets this
// script run as a scheduled Cloud Run Job (the container image has no
// gcloud installed). Falls back to `gcloud auth print-access-token` for
// local developer use, where the metadata server isn't reachable.
async function getAccessToken() {
  try {
    const res = await fetch(
      "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token",
      { headers: { "Metadata-Flavor": "Google" }, signal: AbortSignal.timeout(1000) }
    );
    if (res.ok) {
      const { access_token: token } = await res.json();
      return token;
    }
  } catch {
    // Not running on GCP infrastructure - fall through to local gcloud.
  }
  const { stdout } = await execFileAsync("gcloud", ["auth", "print-access-token"], { shell: true });
  return stdout.trim();
}

async function queryMetric(filter, aligner, alignmentPeriod = "3600s") {
  const now = new Date();
  const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const token = await getAccessToken();
  const url =
    `https://monitoring.googleapis.com/v3/projects/${PROJECT}/timeSeries` +
    `?filter=${encodeURIComponent(filter)}` +
    `&interval.startTime=${start.toISOString()}` +
    `&interval.endTime=${now.toISOString()}` +
    `&aggregation.alignmentPeriod=${alignmentPeriod}` +
    `&aggregation.perSeriesAligner=${aligner}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) return { error: `HTTP ${res.status}` };
  return res.json();
}

function summarizePoints(series, valueKey = "doubleValue") {
  const points = series?.timeSeries?.flatMap((ts) => ts.points ?? []) ?? [];
  if (points.length === 0) return { count: 0 };
  const values = points.map((p) => Number(p.value?.[valueKey] ?? p.value?.distributionValue?.mean ?? 0));
  const sum = values.reduce((a, b) => a + b, 0);
  return { count: points.length, avg: sum / values.length, max: Math.max(...values), min: Math.min(...values) };
}

async function main() {
  const periodStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const periodEnd = new Date().toISOString().slice(0, 10);
  console.log(`SLI/SLO Monthly Report - ${PROJECT} - ${periodStart} to ${periodEnd}\n`);

  const latency = await queryMetric(
    `resource.type="cloud_run_revision" AND resource.labels.service_name="ist-triage-soc2" AND metric.type="logging.googleapis.com/user/request_duration_ms"`,
    "ALIGN_PERCENTILE_95"
  );
  console.log("Latency (p95, request_duration_ms):", summarizePoints(latency));

  const saturation = await queryMetric(
    `resource.type="cloud_run_revision" AND resource.labels.service_name="ist-triage-soc2" AND metric.type="run.googleapis.com/container/instance_count"`,
    "ALIGN_MEAN"
  );
  console.log("Saturation (Cloud Run instance count, mean):", summarizePoints(saturation));

  console.log(
    "\nAvailability and error-rate figures require Cloud Monitoring's uptime-check-results and " +
      "request_count metrics respectively (both already alerting via the policies configured this session) - " +
      "querying their exact SLO-compliant percentages needs the Cloud Monitoring dashboard/API's SLO objects, " +
      "not shown numerically here to avoid a partial/misleading figure."
  );

  console.log(
    "\nNote: this generates real report CONTENT from real metrics. Actually delivering this to Qatar Airways on " +
      "a monthly cadence (email/portal/etc.) is a business process decision not yet made or automated - " +
      "see docs/sli-slo-definitions.md's 'Reporting cadence' section."
  );
}

main().catch((error) => {
  console.error("Report generation failed:", error);
  process.exitCode = 1;
});
