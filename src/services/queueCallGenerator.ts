/**
 * Single shared candidate/reason-generation logic for synthetic tele-triage
 * calls, consumed by two invocation points: the in-process background loop
 * (src/services/callSimulator.ts, env-gated) and the manual "Generate Calls"
 * action on the Service Manager Board (POST /api/v1/queue/simulate). Both
 * previously carried their own duplicated, drifted copy of this logic - this
 * module is the one place it now lives.
 */

import { readFileSync } from "node:fs";
import { sanitizeForLog } from "../utils/logSanitizer.js";
import path from "node:path";
import type { QueueCreateRequest } from "../types/queue.js";
import { resolveStaffProfile } from "./hrmsOracleAdapter.js";

const SEED_DATA_PATH = path.resolve(process.cwd(), "data", "generated", "ist_qatar_seed_data.json");

export type SimulatorCandidate = {
  istStaffId: string;
  department: string;
  jobTitle: string;
};

// Mirrors the real Algorithm.Gender column exactly (verified via ODBC against
// the real .mdb): "M" male-only, "F" female-only, "B" both/no restriction.
type StccGender = "M" | "F" | "B";

type ReasonTemplate = {
  text: string;
  // scoreProtocol()'s gender filter (clinicalContent.ts) correctly excludes a
  // protocol whose real Gender doesn't match the patient's HRMS sex, so every
  // template must declare which sex it was written for - "B" templates can
  // pair with any candidate, "M"/"F" ones must be paired with a matching
  // candidate or the call falls through to an unrelated, lower-confidence match.
  gender: StccGender;
};

// Covers only the 5 real STCC-sourced protocols currently in the content
// package (Abdominal Pain - Male, Diarrhea, Pregnancy - Decreased or Abnormal
// Fetal Movement, Ankle Pain, Ankle Injury) - the earlier template set was
// written for the removed 229-protocol open-source-guideline library and no
// longer matches anything real, so simulated calls never auto-matched a
// protocol. Every template below uses the vendor's own real, specific
// multi-word AlgorithmSearchWords phrases (not generic single words like
// "pain") so scoreProtocol() has a genuinely distinctive match to find, and
// crucially so that "Ankle Pain" (overuse, real keyword "ankle pain") and
// "Ankle Injury" (trauma, real keywords "ankle injury"/"broken ankle"/
// "dislocated joint") don't collide on a shared generic term. Each template
// is phrased as genuine first-person caller speech and at least one
// emergency-tier scenario is included per protocol so the disposition range
// gets exercised, not just self-care outcomes.
const REASON_TEMPLATES: ReasonTemplate[] = [
  // Abdominal Pain - Male: real Gender="M" (real keywords: "stomach pain", "severe pain", "abdominal pain", "epigastric pain", "gi symptoms")
  { text: "Sudden severe stomach pain for {duration}, feeling confused, looks pale and clammy.", gender: "M" },
  { text: "Collapsed briefly after severe stomach pain {duration} ago, now conscious but shaky and weak.", gender: "M" },
  { text: "Severe abdominal pain for {duration}, just vomited and it had blood in it.", gender: "M" },
  { text: "Epigastric pain and stomach pain that comes and goes for {duration}.", gender: "M" },
  { text: "Mild stomach pain on and off with some gi symptoms for the past {duration}.", gender: "M" },

  // Diarrhea: real Gender="B" (real keywords: "watery stools", "loose stools", "bowel movements", "food poisoning", "recent travel")
  { text: "Watery stools for {duration}, feeling weak and dizzy when standing up.", gender: "B" },
  { text: "Loose stools since {duration} ago with a little blood in the bowel movements.", gender: "B" },
  { text: "Frequent bowel movements for {duration} plus a high fever and chills.", gender: "B" },
  { text: "Mild loose stools on and off for {duration}, possibly food poisoning from recent travel.", gender: "B" },

  // Pregnancy - Decreased or Abnormal Fetal Movement: real Gender="F" (real keywords: "fetal movement", "decreased fetal movement", "baby movement", "kick count")
  { text: "I'm pregnant and I'm worried about decreased fetal movement over the past {duration}.", gender: "F" },
  { text: "Pregnant, and the baby movement has felt much less than usual since {duration} ago.", gender: "F" },
  { text: "I'm pregnant and doing a kick count - fetal movement seems way down over {duration}.", gender: "F" },
  { text: "Pregnant, haven't felt normal baby movement in {duration}.", gender: "F" },

  // Ankle Pain: real Gender="B" (real keywords: "ankle pain", "achilles tendon", "joint pain" - gradual onset, no injury)
  { text: "Ankle pain for {duration} from running, no specific injury I can think of.", gender: "B" },
  { text: "Achilles tendon soreness and ankle pain for {duration}, probably from being on my feet all day.", gender: "B" },
  { text: "Joint pain in the ankle on and off for {duration}, worse with activity.", gender: "B" },

  // Ankle Injury: real Gender="B" (real keywords: "ankle injury", "broken ankle", "dislocated joint", "bone trauma" - acute trauma)
  { text: "Twisted my ankle playing sport {duration} ago - worried it might be a broken ankle, it's swollen.", gender: "B" },
  { text: "Fell and think I have an ankle injury from {duration} ago, hurts to put weight on it.", gender: "B" },
  { text: "Ankle looks like a dislocated joint after a fall {duration} ago, very crooked.", gender: "B" },
  { text: "Ankle injury from bone trauma after a fall {duration} ago, looks bruised and swollen.", gender: "B" }
];

function pick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function fillTemplate(template: string): string {
  const duration = pick(["twenty minutes", "an hour", "two hours", "a day", "three days", "a week"]);
  return template.replace("{duration}", duration);
}

function biologicalSexMatches(gender: StccGender, sex: string | undefined): boolean {
  if (gender === "B") return true;
  if (!sex) return false;
  return (gender === "M" && sex === "male") || (gender === "F" && sex === "female");
}

let cachedStaffCandidatePool: SimulatorCandidate[] | undefined;

/**
 * Lazily loads and caches the staff candidate pool from the synthetic HRMS
 * seed file, so an on-demand caller (the manual "Generate Calls" endpoint)
 * never re-parses the ~117MB file on every click. Not gated by
 * SIMULATE_INCOMING_CALLS - that gate only governs whether the background
 * loop starts, not whether candidates can be loaded on demand.
 */
export function loadStaffCandidatePool(): SimulatorCandidate[] {
  if (cachedStaffCandidatePool) {
    return cachedStaffCandidatePool;
  }
  try {
    const raw = JSON.parse(readFileSync(SEED_DATA_PATH, "utf8"));
    const collections = raw.oracle_fusion_hcm_api.collections;
    const publicWorkers = collections.publicWorkers.items as Array<{
      PersonId: number;
      PersonNumber: string;
      AssignmentStatusType: string;
      DepartmentName: string;
      JobName: string;
    }>;
    cachedStaffCandidatePool = publicWorkers
      .filter((worker) => worker.AssignmentStatusType === "ACTIVE")
      .slice(0, 3000)
      .map((worker) => ({ istStaffId: worker.PersonNumber, department: worker.DepartmentName, jobTitle: worker.JobName }));
  } catch (error) {
    console.error("[queue-call-generator] failed to load HRMS candidate pool", sanitizeForLog(error));
    cachedStaffCandidatePool = [];
  }
  return cachedStaffCandidatePool;
}

const DEPENDENT_TARGET_PROBABILITY = 0.2;
// scoreProtocol()'s gender filter means an "M"/"F" template only produces a
// real auto-match if the actual patient (staff member or dependent) has the
// matching biologicalSex - otherwise the gender-restricted protocol is
// correctly excluded and the call falls through to an unrelated, lower-
// confidence match. This caps how many random candidates get tried before
// giving up and falling back to a "B" (both) template instead.
const MAX_GENDER_MATCH_ATTEMPTS = 40;

/**
 * Builds one synthetic queue-creation request. Picks a reason template first,
 * then a staff candidate (or one of that staff member's real dependents, via
 * resolveStaffProfile - the same HRMS resolution createQueueItem itself
 * already calls internally) whose biologicalSex actually matches the
 * template's real STCC Gender ("M"/"F"/"B") - otherwise a caller reporting
 * pregnancy could land on a male patient record and the app would (correctly)
 * filter out the gender-restricted protocol, producing a nonsensical
 * low-confidence match instead of the intended one.
 */
export function buildSimulatedQueueCreateRequest(pool: SimulatorCandidate[]): QueueCreateRequest {
  let template = pick(REASON_TEMPLATES);
  const channel = pick(["Phone", "WhatsApp", "Callback"] as const);

  let candidate: SimulatorCandidate | undefined;
  let dependentId: string | undefined;

  for (let attempt = 0; attempt < MAX_GENDER_MATCH_ATTEMPTS; attempt++) {
    const trialCandidate = pick(pool);
    const profile = resolveStaffProfile(trialCandidate.istStaffId);

    if (biologicalSexMatches(template.gender, profile?.biologicalSex)) {
      candidate = trialCandidate;
      break;
    }

    const matchingDependent = profile?.dependents.find((dependent) =>
      biologicalSexMatches(template.gender, dependent.biologicalSex)
    );
    if (matchingDependent) {
      candidate = trialCandidate;
      dependentId = matchingDependent.id;
      break;
    }
  }

  if (!candidate) {
    // No matching candidate found within the attempt budget - fall back to a
    // "B" template (always satisfiable) rather than emitting a mismatched call.
    template = pick(REASON_TEMPLATES.filter((t) => t.gender === "B"));
    candidate = pick(pool);
  }

  if (!dependentId && Math.random() < DEPENDENT_TARGET_PROBABILITY) {
    const profile = resolveStaffProfile(candidate.istStaffId);
    const eligibleDependents = profile?.dependents.filter((dependent) =>
      biologicalSexMatches(template.gender, dependent.biologicalSex)
    );
    if (eligibleDependents && eligibleDependents.length > 0) {
      dependentId = pick(eligibleDependents).id;
    }
  }

  const reasonNarrative = fillTemplate(template.text);

  return {
    istStaffId: candidate.istStaffId,
    dependentId,
    patientType: dependentId ? "Dependent" : "Staff",
    channel,
    stationCode: "DOH",
    department: candidate.department,
    jobTitle: candidate.jobTitle,
    summary: reasonNarrative,
    reasonNarrative,
    safetyFloorActive: false,
    slaMinutes: 20
  };
}
