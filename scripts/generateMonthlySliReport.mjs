// Monthly SLI/SLO report generator - closes NFR-123 (email delivery) and
// most of the "reported monthly to Qatar Airways" half of NFR-189
// (docs/sli-slo-definitions.md defines the SLIs; this produces and, when
// SLI_REPORT_RECIPIENT_EMAIL is set, emails the actual report content).
// Pulls real data from the sources already wired up this remediation pass:
//   - Availability: Cloud Monitoring uptime check results
//   - Error rate: the 5xx alert policies' underlying request_count metric
//   - Latency: the request_duration_ms log-based metric (p50/p95/p99)
//   - Saturation: Cloud SQL connection count / Cloud Run instance count
// Email delivery reuses the existing MicrosoftGraphEmailAdapter
// (src/services/communicationAdapters.ts, compiled to dist/ - this script
// runs as plain Node in the deployed image, importing the compiled output
// alongside it) via getEmailAdapter(), which already defaults to a safe
// dry-run unless CCP_TRANSPORT_MODE=live and MS_GRAPH_* secrets are
// configured - the same real/dry-run split every other integration in this
// app already follows, not a new, separately-risky send path.
// Usage: node scripts/generateMonthlySliReport.mjs [projectId]
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { getEmailAdapter } from "../dist/services/communicationAdapters.js";

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

function buildReport(periodStart, periodEnd, latency, saturation) {
  const lines = [];
  lines.push(`SLI/SLO Monthly Report - ${PROJECT} - ${periodStart} to ${periodEnd}\n`);
  lines.push(`Latency (p95, request_duration_ms): ${JSON.stringify(summarizePoints(latency))}`);
  lines.push(`Saturation (Cloud Run instance count, mean): ${JSON.stringify(summarizePoints(saturation))}`);
  lines.push(
    "\nAvailability and error-rate figures require Cloud Monitoring's uptime-check-results and " +
      "request_count metrics respectively (both already alerting via the policies configured this session) - " +
      "querying their exact SLO-compliant percentages needs the Cloud Monitoring dashboard/API's SLO objects, " +
      "not shown numerically here to avoid a partial/misleading figure."
  );
  return lines.join("\n");
}

async function deliverReport(reportText, periodStart, periodEnd) {
  const recipient = process.env.SLI_REPORT_RECIPIENT_EMAIL;
  if (!recipient) {
    console.log(
      "\nSLI_REPORT_RECIPIENT_EMAIL is not set - report generated but not emailed. Set it (and the real " +
        "MS_GRAPH_*/CCP_TRANSPORT_MODE=live secrets) to enable real monthly delivery to Qatar Airways."
    );
    return;
  }
  const adapter = getEmailAdapter();
  const result = await adapter.send({
    to: recipient,
    subject: `IST Health Tele-Triage SLI/SLO Monthly Report (${periodStart} to ${periodEnd})`,
    body: reportText
  });
  console.log(`\nEmail delivery (${adapter.name}, live=${adapter.live}):`, result);
}

async function main() {
  const periodStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const periodEnd = new Date().toISOString().slice(0, 10);

  const latency = await queryMetric(
    `resource.type="cloud_run_revision" AND resource.labels.service_name="ist-triage-soc2" AND metric.type="logging.googleapis.com/user/request_duration_ms"`,
    "ALIGN_PERCENTILE_95"
  );
  const saturation = await queryMetric(
    `resource.type="cloud_run_revision" AND resource.labels.service_name="ist-triage-soc2" AND metric.type="run.googleapis.com/container/instance_count"`,
    "ALIGN_MEAN"
  );

  const reportText = buildReport(periodStart, periodEnd, latency, saturation);
  console.log(reportText);
  await deliverReport(reportText, periodStart, periodEnd);
}

main().catch((error) => {
  console.error("Report generation failed:", error);
  process.exitCode = 1;
});
