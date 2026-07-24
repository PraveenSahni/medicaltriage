import { readFileSync } from "node:fs";
import path from "node:path";
import { seedBulkSyntheticQueueRecords, type BulkSyntheticCandidate } from "../services/queueOrchestration.js";
import { prisma } from "../db.js";

const SEED_DATA_PATH = path.resolve(process.cwd(), "data", "generated", "ist_qatar_seed_data.json");

type OracleWorker = {
  PersonId: number;
  PersonNumber: string;
  AssignmentStatusType: string;
  DepartmentName: string;
  JobName: string;
};

type OracleWorkerDetail = {
  PersonId: number;
  DateOfBirth: string;
  Gender: string;
};

function ageFromDateOfBirth(dateOfBirthIso: string, referenceDate = new Date()): number {
  const dob = new Date(dateOfBirthIso);
  let years = referenceDate.getUTCFullYear() - dob.getUTCFullYear();
  const monthDiff = referenceDate.getUTCMonth() - dob.getUTCMonth();
  if (monthDiff < 0 || (monthDiff === 0 && referenceDate.getUTCDate() < dob.getUTCDate())) {
    years -= 1;
  }
  return years;
}

/**
 * Builds the real HRMS candidate pool this bulk seed draws from - active,
 * adult (18-65) staff with known age+sex, joined from the same mock Oracle
 * Fusion HCM file the live app's hrmsOracleAdapter.ts reads (publicWorkers +
 * workers, joined by PersonId). Not fabricated ids: every candidate is a real
 * person number that resolveStaffProfile()/hydrateRecordIdentity() will
 * validate exactly like a genuine incoming call.
 */
function loadCandidates(): BulkSyntheticCandidate[] {
  const raw = JSON.parse(readFileSync(SEED_DATA_PATH, "utf8"));
  const collections = raw.oracle_fusion_hcm_api.collections;
  const publicWorkers: OracleWorker[] = collections.publicWorkers.items;
  const workers: OracleWorkerDetail[] = collections.workers.items;
  const workerByPersonId = new Map(workers.map((worker) => [worker.PersonId, worker]));

  const candidates: BulkSyntheticCandidate[] = [];
  for (const worker of publicWorkers) {
    if (worker.AssignmentStatusType !== "ACTIVE") continue;
    const detail = workerByPersonId.get(worker.PersonId);
    if (!detail?.DateOfBirth || !detail.Gender) continue;
    const ageYears = ageFromDateOfBirth(detail.DateOfBirth);
    if (ageYears < 18 || ageYears > 65) continue;
    candidates.push({
      istStaffId: worker.PersonNumber,
      department: worker.DepartmentName,
      jobTitle: worker.JobName,
      ageYears,
      biologicalSex: detail.Gender === "F" ? "female" : detail.Gender === "M" ? "male" : "unknown"
    });
    if (candidates.length >= 2000) break;
  }
  return candidates;
}

async function main() {
  const candidates = loadCandidates();
  const recordsPerProtocol = Number(process.argv[2] ?? 1);
  const summary = await seedBulkSyntheticQueueRecords(candidates, recordsPerProtocol);
  console.log(JSON.stringify({ seed: "bulk-synthetic-queue-complete", candidatePoolSize: candidates.length, ...summary }, null, 2));
}

main()
  .catch((error) => {
    console.error("Bulk synthetic queue seed failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
