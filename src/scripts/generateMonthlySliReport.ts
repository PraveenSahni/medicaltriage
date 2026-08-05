/**
 * Monthly SLI/SLO report generation entry point - closes NFR-123/NFR-189.
 * Runs as the `generate-monthly-sli-report-soc2` Cloud Run Job
 * (terraform/main.tf), triggered monthly by Cloud Scheduler, and can also
 * be invoked manually for a dry-run preview.
 *
 * Usage:
 *   npx tsx src/scripts/generateMonthlySliReport.ts
 *   npx tsx src/scripts/generateMonthlySliReport.ts --dry-run
 *   npx tsx src/scripts/generateMonthlySliReport.ts --force
 */
import { generateMonthlyReport, loadSliReportConfig, formatReportText, disconnectSliReportPrisma } from "../services/sliReportService.js";

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const force = process.argv.includes("--force");

  const config = loadSliReportConfig();
  console.log(
    `Generating monthly SLI/SLO report for ${config.environmentLabel} (project ${config.gcpProjectId}). ` +
      `Mode: ${dryRun || config.dryRun ? "DRY RUN (no email sent)" : "LIVE"}${force ? ", FORCED (bypassing duplicate-period check)" : ""}`
  );

  const result = await generateMonthlyReport(config, { dryRun, force });
  console.log(formatReportText(result.report));
  console.log(
    result.skippedDuplicate
      ? "\nSkipped: a report for this environment/period was already emailed. Use --force to resend."
      : result.emailed
        ? "\nReport emailed successfully."
        : config.recipientEmail
          ? "\nReport generated but not emailed (dry-run mode)."
          : "\nReport generated but not emailed - SLI_REPORT_RECIPIENT_EMAIL is not configured."
  );
}

main()
  .catch((error) => {
    console.error("Monthly SLI report generation failed:", error);
    process.exitCode = 1;
  })
  .finally(() => disconnectSliReportPrisma());
