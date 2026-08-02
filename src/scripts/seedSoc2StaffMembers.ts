/**
 * Seeds a handful of StaffMember rows into the target database, matching the
 * real HRMS profile data (department, job title, duty status) already
 * resolved by resolveStaffProfile() for the same istStaffIds used throughout
 * this session's test data (IST-00014, IST-01136, IST-00001) - not fabricated
 * values, the same synthetic HRMS source both ist-triage-demo and
 * ist-triage-soc2 already read from at runtime.
 *
 * This is a narrow, targeted seed (not a full staff-directory import) since
 * no bulk StaffMember import pipeline exists anywhere in this codebase - the
 * table is normally only ever populated lazily, and nothing currently does
 * that lazy creation either (confirmed: 55 queue items already created on
 * soc2 produced zero StaffMember rows).
 *
 * Usage: DATABASE_URL=... npx tsx src/scripts/seedSoc2StaffMembers.ts
 */
import { PrismaClient } from "@prisma/client";
import { resolveStaffProfile } from "../services/hrmsOracleAdapter.js";

const STAFF_IDS = ["IST-00014", "IST-01136", "IST-00001"];

async function main() {
  const prisma = new PrismaClient();
  for (const istStaffId of STAFF_IDS) {
    const profile = resolveStaffProfile(istStaffId);
    if (!profile) {
      console.log(`SKIP ${istStaffId}: no profile found in synthetic HRMS directory`);
      continue;
    }
    const row = await prisma.staffMember.upsert({
      where: { istStaffId },
      create: {
        istStaffId,
        department: profile.department ?? "Unknown",
        jobTitle: profile.jobTitle ?? "Unknown",
        dutyStatus: (profile.dutyStatus?.toUpperCase().replace(/-/g, "_") as
          | "ACTIVE"
          | "ON_LEAVE"
          | "REST_PERIOD"
          | "SUSPENDED"
          | "INACTIVE") ?? "ACTIVE",
        dateOfBirth: profile.dateOfBirthIso ? new Date(profile.dateOfBirthIso) : undefined
      },
      update: {}
    });
    console.log(`OK ${istStaffId} -> ${row.id} (${row.department}, ${row.jobTitle})`);
  }
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
