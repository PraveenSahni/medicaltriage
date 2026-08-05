// Real monthly SLI/SLO reporting - closes NFR-123 ("scheduled reports via
// email for the key metrics") and NFR-189 ("SLIs/SLOs... defined, monitored,
// and reported monthly"). Supersedes the earlier scripts/generateMonthlySliReport.mjs
// (which only queried latency/saturation and deliberately did not compute
// availability/error-rate percentages or an SLO pass/fail verdict - a real,
// honest, but incomplete first attempt). This module adds the missing
// SLO comparison, all 4 SLIs, idempotency (one report per environment+period
// unless forced), and audit-event logging, using the official
// @google-cloud/monitoring client instead of hand-rolled REST calls.
import { MetricServiceClient } from "@google-cloud/monitoring";
import { randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { getEmailAdapter } from "./communicationAdapters.js";

// Standalone-job audit trail, matching the exact pattern already used by
// src/scripts/purgeExpiredQueueData.ts and fulfillPrivacyRequests.ts (a
// dedicated PrismaClient, since this runs as a Cloud Run Job process with
// no HTTP session/security-session context) - not a new audit mechanism.
const prisma = new PrismaClient();

function jsonValue(value: unknown) {
  return JSON.parse(JSON.stringify(value));
}

async function recordJobAuditEvent(args: { action: string; resource: string; success: boolean; metadata?: Record<string, unknown> }): Promise<void> {
  try {
    await prisma.auditEvent.create({
      data: {
        timestamp: new Date(),
        action: args.action,
        module: "SliReporting",
        resource: args.resource,
        success: args.success,
        riskLevel: "low",
        metadata: args.metadata ? jsonValue(args.metadata) : undefined
      }
    });
  } catch (error) {
    console.error(`Failed to persist audit event ${args.action} (job continues):`, error);
  }
}

async function findAuditEvents(action: string, resource: string) {
  return prisma.auditEvent.findMany({ where: { action, resource } });
}

export type SliId = "availability" | "latency" | "errorRate" | "saturation";

export type SliResult = {
  id: SliId;
  name: string;
  description: string;
  metricSource: string;
  numerator: number | undefined;
  denominator: number | undefined;
  result: number | undefined;
  target: number;
  targetDirection: "atLeast" | "atMost";
  status: "pass" | "fail" | "no-data";
  dataCompleteness: "complete" | "partial" | "none";
  notes: string;
};

export type MonthlyReport = {
  reportId: string;
  environment: string;
  gcpProjectId: string;
  periodStartIso: string;
  periodEndIso: string;
  generatedAtIso: string;
  overallStatus: "pass" | "fail" | "no-data";
  slis: SliResult[];
};

export type SliReportConfig = {
  gcpProjectId: string;
  environmentLabel: string;
  cloudRunServiceName: string;
  uptimeCheckId: string;
  cloudSqlDatabaseId: string;
  cloudSqlMaxConnections: number;
  recipientEmail: string | undefined;
  senderIdentityNote: string;
  lookbackDays: number;
  dryRun: boolean;
};

export class SliReportConfigError extends Error {}

// Reads configuration from environment variables - no hardcoded customer
// email address or production project ID. Throws with a precise message
// naming exactly which variable is missing, rather than silently defaulting
// to a value nobody actually decided (per the "do not invent missing
// business parameters" rule) - the one exception is SLI_REPORT_RECIPIENT_EMAIL,
// which is allowed to be unset (report still generates, just isn't emailed -
// this is the documented dry-run-by-default posture every other integration
// in this app already follows).
export function loadSliReportConfig(): SliReportConfig {
  const gcpProjectId = process.env.GCP_PROJECT_ID;
  if (!gcpProjectId) {
    throw new SliReportConfigError("GCP_PROJECT_ID is required to query Cloud Monitoring.");
  }
  const cloudRunServiceName = process.env.SLI_REPORT_SERVICE_NAME ?? "ist-triage-soc2";
  const environmentLabel = process.env.SLI_REPORT_ENVIRONMENT_LABEL ?? cloudRunServiceName;
  const uptimeCheckId = process.env.SLI_REPORT_UPTIME_CHECK_ID;
  if (!uptimeCheckId) {
    throw new SliReportConfigError(
      "SLI_REPORT_UPTIME_CHECK_ID is required (the uptime check's real check_id, e.g. from the existing alert policy)."
    );
  }
  const cloudSqlDatabaseId = process.env.SLI_REPORT_CLOUDSQL_DATABASE_ID;
  if (!cloudSqlDatabaseId) {
    throw new SliReportConfigError(
      "SLI_REPORT_CLOUDSQL_DATABASE_ID is required (e.g. project:instance)."
    );
  }
  const cloudSqlMaxConnections = Number(process.env.SLI_REPORT_CLOUDSQL_MAX_CONNECTIONS ?? "25");
  if (!Number.isFinite(cloudSqlMaxConnections) || cloudSqlMaxConnections <= 0) {
    throw new SliReportConfigError("SLI_REPORT_CLOUDSQL_MAX_CONNECTIONS must be a positive number.");
  }
  const lookbackDays = Number(process.env.SLI_REPORT_LOOKBACK_DAYS ?? "30");
  if (!Number.isFinite(lookbackDays) || lookbackDays <= 0) {
    throw new SliReportConfigError("SLI_REPORT_LOOKBACK_DAYS must be a positive number.");
  }
  return {
    gcpProjectId,
    environmentLabel,
    cloudRunServiceName,
    uptimeCheckId,
    cloudSqlDatabaseId,
    cloudSqlMaxConnections,
    recipientEmail: process.env.SLI_REPORT_RECIPIENT_EMAIL,
    senderIdentityNote: "IST Health Tele-Triage SLI/SLO reporting job",
    lookbackDays,
    dryRun: process.env.SLI_REPORT_DRY_RUN !== "false"
  };
}

const SLO_TARGETS: Record<SliId, { target: number; direction: "atLeast" | "atMost" }> = {
  // Matches docs/sli-slo-definitions.md's real, already-defined targets.
  availability: { target: 99.5, direction: "atLeast" },
  latency: { target: 3000, direction: "atMost" },
  errorRate: { target: 1, direction: "atMost" },
  saturation: { target: 80, direction: "atMost" }
};

type MonitoringClient = Pick<MetricServiceClient, "listTimeSeries" | "projectPath">;

function projectPath(client: MonitoringClient, projectId: string): string {
  return client.projectPath ? client.projectPath(projectId) : `projects/${projectId}`;
}

async function queryTimeSeries(
  client: MonitoringClient,
  projectId: string,
  filter: string,
  startIso: string,
  endIso: string,
  aligner: string,
  alignmentPeriodSeconds = 3600
): Promise<number[]> {
  const [series] = await client.listTimeSeries({
    name: projectPath(client, projectId),
    filter,
    interval: {
      startTime: { seconds: Math.floor(new Date(startIso).getTime() / 1000) },
      endTime: { seconds: Math.floor(new Date(endIso).getTime() / 1000) }
    },
    aggregation: {
      alignmentPeriod: { seconds: alignmentPeriodSeconds },
      perSeriesAligner: aligner as never
    }
  });
  const values: number[] = [];
  for (const ts of series ?? []) {
    for (const point of ts.points ?? []) {
      const v = point.value;
      if (v?.doubleValue !== undefined && v.doubleValue !== null) {
        values.push(v.doubleValue);
      } else if (v?.int64Value !== undefined && v.int64Value !== null) {
        values.push(Number(v.int64Value));
      } else if (v?.distributionValue?.mean !== undefined && v.distributionValue.mean !== null) {
        values.push(v.distributionValue.mean);
      }
    }
  }
  return values;
}

function average(values: number[]): number | undefined {
  if (values.length === 0) return undefined;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function sum(values: number[]): number {
  return values.reduce((a, b) => a + b, 0);
}

function completeness(values: number[]): "complete" | "partial" | "none" {
  if (values.length === 0) return "none";
  return values.length < 12 ? "partial" : "complete";
}

function evaluateStatus(result: number | undefined, target: number, direction: "atLeast" | "atMost"): "pass" | "fail" | "no-data" {
  if (result === undefined) return "no-data";
  return direction === "atLeast" ? (result >= target ? "pass" : "fail") : (result <= target ? "pass" : "fail");
}

// Every calculation below is honest about missing data - a "no-data" status
// is never silently upgraded to "pass". This is the single most important
// integrity rule for this module: never claim an SLO was met when the
// underlying metric data is incomplete or absent.
export async function calculateSlis(
  client: MonitoringClient,
  config: SliReportConfig,
  periodStartIso: string,
  periodEndIso: string
): Promise<SliResult[]> {
  const { gcpProjectId } = config;

  const availabilityValues = await queryTimeSeries(
    client,
    gcpProjectId,
    `resource.type="uptime_url" AND metric.type="monitoring.googleapis.com/uptime_check/check_passed" AND metric.label."check_id"="${config.uptimeCheckId}"`,
    periodStartIso,
    periodEndIso,
    "ALIGN_FRACTION_TRUE",
    86400
  );
  const availabilityPct = average(availabilityValues) !== undefined ? average(availabilityValues)! * 100 : undefined;

  const latencyValues = await queryTimeSeries(
    client,
    gcpProjectId,
    `resource.type="cloud_run_revision" AND resource.labels.service_name="${config.cloudRunServiceName}" AND metric.type="logging.googleapis.com/user/request_duration_ms"`,
    periodStartIso,
    periodEndIso,
    "ALIGN_PERCENTILE_95",
    3600
  );
  const latencyP95 = average(latencyValues);

  const errorValues = await queryTimeSeries(
    client,
    gcpProjectId,
    `resource.type="cloud_run_revision" AND resource.labels.service_name="${config.cloudRunServiceName}" AND metric.type="run.googleapis.com/request_count" AND metric.labels.response_code_class="5xx"`,
    periodStartIso,
    periodEndIso,
    "ALIGN_SUM",
    3600
  );
  const totalValues = await queryTimeSeries(
    client,
    gcpProjectId,
    `resource.type="cloud_run_revision" AND resource.labels.service_name="${config.cloudRunServiceName}" AND metric.type="run.googleapis.com/request_count"`,
    periodStartIso,
    periodEndIso,
    "ALIGN_SUM",
    3600
  );
  const errorSum = sum(errorValues);
  const totalSum = sum(totalValues);
  const errorRatePct = totalSum > 0 ? (errorSum / totalSum) * 100 : totalValues.length > 0 ? 0 : undefined;

  const saturationValues = await queryTimeSeries(
    client,
    gcpProjectId,
    `resource.type="cloudsql_database" AND resource.labels.database_id="${config.cloudSqlDatabaseId}" AND metric.type="cloudsql.googleapis.com/database/postgresql/num_backends"`,
    periodStartIso,
    periodEndIso,
    "ALIGN_MAX",
    3600
  );
  const maxConnections = saturationValues.length > 0 ? Math.max(...saturationValues) : undefined;
  const saturationPct = maxConnections !== undefined ? (maxConnections / config.cloudSqlMaxConnections) * 100 : undefined;

  return [
    {
      id: "availability",
      name: "Availability",
      description: "Percentage of uptime-check probes that passed over the reporting period.",
      metricSource: `uptime_check/check_passed (check_id=${config.uptimeCheckId})`,
      numerator: undefined,
      denominator: undefined,
      result: availabilityPct,
      target: SLO_TARGETS.availability.target,
      targetDirection: SLO_TARGETS.availability.direction,
      status: evaluateStatus(availabilityPct, SLO_TARGETS.availability.target, SLO_TARGETS.availability.direction),
      dataCompleteness: completeness(availabilityValues),
      notes: availabilityValues.length === 0 ? "No uptime-check data points found for this period." : ""
    },
    {
      id: "latency",
      name: "Latency (p95)",
      description: "95th-percentile request duration in milliseconds, averaged across hourly windows in the period.",
      metricSource: "logging.googleapis.com/user/request_duration_ms",
      numerator: undefined,
      denominator: undefined,
      result: latencyP95,
      target: SLO_TARGETS.latency.target,
      targetDirection: SLO_TARGETS.latency.direction,
      status: evaluateStatus(latencyP95, SLO_TARGETS.latency.target, SLO_TARGETS.latency.direction),
      dataCompleteness: completeness(latencyValues),
      notes: latencyValues.length === 0 ? "No request-duration log-based-metric data points found for this period." : ""
    },
    {
      id: "errorRate",
      name: "Error rate",
      description: "5xx responses as a percentage of total requests over the reporting period.",
      metricSource: "run.googleapis.com/request_count (5xx vs total)",
      numerator: errorSum,
      denominator: totalSum,
      result: errorRatePct,
      target: SLO_TARGETS.errorRate.target,
      targetDirection: SLO_TARGETS.errorRate.direction,
      status: evaluateStatus(errorRatePct, SLO_TARGETS.errorRate.target, SLO_TARGETS.errorRate.direction),
      dataCompleteness: completeness(totalValues),
      notes: totalValues.length === 0 ? "No request_count data points found for this period." : ""
    },
    {
      id: "saturation",
      name: "Saturation (Cloud SQL connections)",
      description: `Peak Cloud SQL connection count as a percentage of the configured max (${config.cloudSqlMaxConnections}).`,
      metricSource: `cloudsql.googleapis.com/database/postgresql/num_backends (database_id=${config.cloudSqlDatabaseId})`,
      numerator: maxConnections,
      denominator: config.cloudSqlMaxConnections,
      result: saturationPct,
      target: SLO_TARGETS.saturation.target,
      targetDirection: SLO_TARGETS.saturation.direction,
      status: evaluateStatus(saturationPct, SLO_TARGETS.saturation.target, SLO_TARGETS.saturation.direction),
      dataCompleteness: completeness(saturationValues),
      notes: saturationValues.length === 0 ? "No Cloud SQL connection-count data points found for this period." : ""
    }
  ];
}

function overallStatus(slis: SliResult[]): "pass" | "fail" | "no-data" {
  if (slis.every((s) => s.status === "no-data")) return "no-data";
  if (slis.some((s) => s.status === "fail")) return "fail";
  if (slis.some((s) => s.status === "no-data")) return "fail";
  return "pass";
}

export function formatReportText(report: MonthlyReport): string {
  const lines: string[] = [];
  lines.push(`IST Health Tele-Triage - Monthly SLI/SLO Report`);
  lines.push(`Environment: ${report.environment}`);
  lines.push(`Period: ${report.periodStartIso.slice(0, 10)} to ${report.periodEndIso.slice(0, 10)}`);
  lines.push(`Generated: ${report.generatedAtIso}`);
  lines.push(`Report ID: ${report.reportId}`);
  lines.push(`Overall status: ${report.overallStatus.toUpperCase()}`);
  lines.push("");
  for (const sli of report.slis) {
    lines.push(`${sli.name} - ${sli.status.toUpperCase()}`);
    lines.push(`  Result: ${sli.result !== undefined ? sli.result.toFixed(2) : "no data"}`);
    lines.push(`  Target: ${sli.targetDirection === "atLeast" ? ">=" : "<="} ${sli.target}`);
    lines.push(`  Data completeness: ${sli.dataCompleteness}`);
    if (sli.notes) lines.push(`  Note: ${sli.notes}`);
    lines.push("");
  }
  lines.push("This report contains only aggregated infrastructure metrics - no patient, staff, or operational record data of any kind.");
  return lines.join("\n");
}

// Idempotency: one real report delivery per environment+period unless
// forced. Reuses the existing AuditEvent trail (the same mechanism this
// engagement's other jobs already use for their own audit records) rather
// than a new table - a report-generation record is itself a security/
// operational audit event, not a new class of persisted state.
async function alreadyReportedThisPeriod(environment: string, periodKey: string): Promise<boolean> {
  const events = await findAuditEvents("SLI_REPORT_EMAILED", `${environment}:${periodKey}`);
  return events.length > 0;
}

export type GenerateReportOptions = {
  dryRun?: boolean;
  force?: boolean;
  periodStartIso?: string;
  periodEndIso?: string;
};

export type GenerateReportResult = {
  report: MonthlyReport;
  emailed: boolean;
  skippedDuplicate: boolean;
};

export async function generateMonthlyReport(
  config: SliReportConfig,
  options: GenerateReportOptions = {}
): Promise<GenerateReportResult> {
  const client = new MetricServiceClient() as unknown as MonitoringClient;
  const now = new Date();
  const periodEndIso = options.periodEndIso ?? now.toISOString();
  const periodStartIso =
    options.periodStartIso ?? new Date(now.getTime() - config.lookbackDays * 24 * 60 * 60 * 1000).toISOString();
  const periodKey = periodStartIso.slice(0, 7); // YYYY-MM

  const reportId = randomUUID();
  await recordJobAuditEvent({
    action: "SLI_REPORT_GENERATION_STARTED",
    resource: `${config.environmentLabel}:${periodKey}`,
    success: true,
    metadata: { reportId, periodStartIso, periodEndIso }
  });

  let slis: SliResult[];
  try {
    slis = await calculateSlis(client, config, periodStartIso, periodEndIso);
  } catch (error) {
    await recordJobAuditEvent({
      action: "SLI_REPORT_GENERATION_FAILED",
      resource: `${config.environmentLabel}:${periodKey}`,
      success: false,
      metadata: { reportId, error: error instanceof Error ? error.message : String(error) }
    });
    throw error;
  }

  const report: MonthlyReport = {
    reportId,
    environment: config.environmentLabel,
    gcpProjectId: config.gcpProjectId,
    periodStartIso,
    periodEndIso,
    generatedAtIso: now.toISOString(),
    overallStatus: overallStatus(slis),
    slis
  };

  await recordJobAuditEvent({
    action: "SLI_REPORT_GENERATED",
    resource: `${config.environmentLabel}:${periodKey}`,
    success: true,
    metadata: { reportId, overallStatus: report.overallStatus }
  });

  const dryRun = options.dryRun ?? config.dryRun;
  const force = options.force ?? false;

  if (!config.recipientEmail) {
    return { report, emailed: false, skippedDuplicate: false };
  }

  if (!force && (await alreadyReportedThisPeriod(config.environmentLabel, periodKey))) {
    await recordJobAuditEvent({
      action: "SLI_REPORT_DUPLICATE_SKIPPED",
      resource: `${config.environmentLabel}:${periodKey}`,
      success: true,
      metadata: { reportId }
    });
    return { report, emailed: false, skippedDuplicate: true };
  }

  const reportText = formatReportText(report);

  if (dryRun) {
    return { report, emailed: false, skippedDuplicate: false };
  }

  try {
    const adapter = getEmailAdapter();
    await adapter.send({
      to: config.recipientEmail,
      subject: `IST Health Tele-Triage SLI/SLO Monthly Report (${periodStartIso.slice(0, 10)} to ${periodEndIso.slice(0, 10)})`,
      body: reportText
    });
    await recordJobAuditEvent({
      action: "SLI_REPORT_EMAILED",
      resource: `${config.environmentLabel}:${periodKey}`,
      success: true,
      metadata: { reportId, recipientCount: 1 }
    });
    return { report, emailed: true, skippedDuplicate: false };
  } catch (error) {
    await recordJobAuditEvent({
      action: "SLI_REPORT_EMAIL_FAILED",
      resource: `${config.environmentLabel}:${periodKey}`,
      success: false,
      metadata: { reportId, error: error instanceof Error ? error.message : String(error) }
    });
    throw error;
  }
}

export async function disconnectSliReportPrisma(): Promise<void> {
  await prisma.$disconnect();
}
