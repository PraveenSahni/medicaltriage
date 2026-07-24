import { prisma } from "../db.js";
import { resolvePatientAgeFromDirectory } from "../services/hrms.js";

/**
 * Refreshes queuePayload.patientAge (including biologicalSex) for every
 * existing queue row from the current HRMS resolution logic. Needed because
 * some rows were persisted before biologicalSex was added to the resolution
 * pipeline, and inserts are skip-if-exists (see seedQueueDatabaseFromInitialRecords/
 * seedBulkSyntheticQueueRecords), so those rows never picked up the fix on
 * their own.
 */
async function main() {
  const rows = await prisma.triageQueueItem.findMany({
    select: { id: true, istStaffId: true, createdAt: true, queuePayload: true }
  });

  let updated = 0;
  let unchanged = 0;
  let failed = 0;

  for (const row of rows) {
    // dependentId is stashed in queuePayload, not the FK column - the FK
    // column is always null for these rows (see queuePayloadFor's comment in
    // queueOrchestration.ts: it's an HRMS-issued id, not a Prisma Dependent
    // table row id, so it can't safely live in the FK column).
    const existingPayload = (row.queuePayload as Record<string, unknown> | null) ?? {};
    const dependentId = typeof existingPayload.dependentId === "string" ? existingPayload.dependentId : undefined;
    const resolution = resolvePatientAgeFromDirectory({
      istStaffId: row.istStaffId,
      dependentId,
      referenceDate: row.createdAt
    });
    if (!resolution.ok) {
      failed += 1;
      continue;
    }

    const existingPatientAge = (existingPayload.patientAge as Record<string, unknown> | undefined) ?? {};
    if (existingPatientAge.biologicalSex === resolution.biologicalSex && existingPatientAge.ageYears === resolution.ageYears) {
      unchanged += 1;
      continue;
    }

    const patientAge: Record<string, unknown> = {
      source: resolution.source,
      ageYears: resolution.ageYears,
      ageMonths: resolution.ageMonths,
      calculatedFrom: resolution.calculatedFrom
    };
    if (resolution.dateOfBirthIso) patientAge.dateOfBirthIso = resolution.dateOfBirthIso;
    if (resolution.biologicalSex) patientAge.biologicalSex = resolution.biologicalSex;

    const updatedPayload = JSON.parse(JSON.stringify({ ...existingPayload, patientAge }));
    await prisma.triageQueueItem.update({
      where: { id: row.id },
      data: { queuePayload: updatedPayload }
    });
    updated += 1;
  }

  console.log(JSON.stringify({ backfill: "queue-patient-age-complete", total: rows.length, updated, unchanged, failed }, null, 2));
}

main()
  .catch((error) => {
    console.error("Backfill failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
