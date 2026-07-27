/**
 * Single shared candidate/reason-generation logic for synthetic tele-triage
 * calls, consumed by two invocation points: the in-process background loop
 * (src/services/callSimulator.ts, env-gated) and the manual "Generate Calls"
 * action on the Service Manager Board (POST /api/v1/queue/simulate). Both
 * previously carried their own duplicated, drifted copy of this logic - this
 * module is the one place it now lives.
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import type { QueueCreateRequest } from "../types/queue.js";
import { resolveStaffProfile } from "./hrmsOracleAdapter.js";

const SEED_DATA_PATH = path.resolve(process.cwd(), "data", "generated", "ist_qatar_seed_data.json");

export type SimulatorCandidate = {
  istStaffId: string;
  department: string;
  jobTitle: string;
};

const REASON_TEMPLATES = [
  "Severe stomach pain that started {duration} ago, {vomit}.",
  "Bad headache for {duration}, {light}.",
  "Twisted {joint} while playing sport {duration} ago.",
  "Sore throat and mild fever for {duration}, no trouble breathing.",
  "Dizziness and lightheadedness since {duration} ago, {faint}.",
  "Cough with fever for {duration}, {breath}.",
  "Rash on {bodyPart} that started {duration} ago, {itch}.",
  "Lower back pain after lifting something {duration} ago.",
  "Ankle swelling and pain after a fall {duration} ago.",
  "Constipation for {duration}, {blood}.",
  "Anxiety and trouble sleeping for the past {duration}.",
  "Ear pain and reduced hearing since {duration} ago.",
  "Mild chest tightness after exercise {duration} ago, resolved now.",
  "Vomiting since {duration} ago, {vomit2}.",
  "Toothache and jaw pain for {duration}.",
  // Licensed STCC "Abdominal Pain - Male" protocol coverage.
  "Sudden severe stomach pain for {duration}, feeling confused, looks pale and clammy.",
  "Collapsed briefly after severe stomach pain {duration} ago, now conscious but shaky and weak.",
  "Severe belly pain for {duration}, just vomited and it had blood in it.",
  "Noticed black, tarry-looking stools since {duration} ago plus abdominal discomfort."
];

function pick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function fillTemplate(template: string): string {
  const duration = pick(["twenty minutes", "an hour", "two hours", "a day", "three days", "a week"]);
  const vomit = pick(["vomited once", "no vomiting so far", "feels nauseous too"]);
  const light = pick(["light sensitivity", "no visual changes", "worse when standing"]);
  const joint = pick(["ankle", "knee", "wrist", "shoulder"]);
  const faint = pick(["nearly fainted once", "no loss of consciousness", "feels weak"]);
  const breath = pick(["no shortness of breath", "mild shortness of breath", "breathing feels normal"]);
  const bodyPart = pick(["the arm", "the leg", "the chest", "the back"]);
  const itch = pick(["itchy", "not itchy", "mildly itchy"]);
  const blood = pick(["noticed a little blood", "no bleeding", "some straining"]);
  const vomit2 = pick(["greenish in color", "just food", "with a bit of blood"]);
  return template
    .replace("{duration}", duration)
    .replace("{vomit}", vomit)
    .replace("{light}", light)
    .replace("{joint}", joint)
    .replace("{faint}", faint)
    .replace("{breath}", breath)
    .replace("{bodyPart}", bodyPart)
    .replace("{itch}", itch)
    .replace("{blood}", blood)
    .replace("{vomit2}", vomit2);
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
    console.error("[queue-call-generator] failed to load HRMS candidate pool", error);
    cachedStaffCandidatePool = [];
  }
  return cachedStaffCandidatePool;
}

const DEPENDENT_TARGET_PROBABILITY = 0.2;

/**
 * Builds one synthetic queue-creation request. Picks a staff candidate, and
 * with a small probability targets one of that staff member's real
 * dependents (via resolveStaffProfile - the same HRMS resolution
 * createQueueItem itself already calls internally), so both staff- and
 * dependent-targeted calls are generated, matching what the backend already
 * fully supports end-to-end.
 */
export function buildSimulatedQueueCreateRequest(pool: SimulatorCandidate[]): QueueCreateRequest {
  const candidate = pick(pool);
  const reasonNarrative = fillTemplate(pick(REASON_TEMPLATES));
  const channel = pick(["Phone", "WhatsApp", "Callback"] as const);

  let dependentId: string | undefined;
  if (Math.random() < DEPENDENT_TARGET_PROBABILITY) {
    const profile = resolveStaffProfile(candidate.istStaffId);
    if (profile && profile.dependents.length > 0) {
      dependentId = pick(profile.dependents).id;
    }
  }

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
