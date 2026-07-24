/**
 * Continuous mock tele-triage call generator, run in-process by the API
 * server itself (see src/index.ts) rather than as a separate standalone
 * script - a standalone script dies independently of the server (confirmed:
 * it kept running after the server was restarted, then silently stopped on
 * its own), which defeats the point of a background call simulator. Tying it
 * to the server's own lifecycle means it starts when the server starts and
 * stops when the server stops, with no separate process to lose track of.
 *
 * Enabled via SIMULATE_INCOMING_CALLS=true (off by default - never runs
 * during tests or a default dev/prod boot).
 */

import { readFileSync } from "node:fs";
import path from "node:path";

const INTAKE_USERNAME = "intake@irisstar.tech";
const INTAKE_PASSWORD = "Intake@2026";
// A second, real PHCC-scoped nurse identity (usr_nurse2_10001) - a
// HMC/SIDRA-scoped identity (e.g. Senior Triage Nurse) can't see or claim
// PHCC-org calls at all due to real multi-tenant RBAC boundaries, so it
// could only ever grab the one pre-existing cross-org edge-case record
// (confirmed while testing this). This identity shares the same PHCC
// organization as the main demo nurse, so it can claim the same queue.
const OTHER_NURSE_USERNAME = "nurse2@irisstar.tech";
const OTHER_NURSE_PASSWORD = "Nurse2@2026";
const SEED_DATA_PATH = path.resolve(process.cwd(), "data", "generated", "ist_qatar_seed_data.json");

type CookieJar = { cookie?: string };

type Candidate = {
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
  "Toothache and jaw pain for {duration}."
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

function loadCandidates(): Candidate[] {
  if (!process.env.SIMULATE_INCOMING_CALLS) return [];
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
    return publicWorkers
      .filter((worker) => worker.AssignmentStatusType === "ACTIVE")
      .slice(0, 3000)
      .map((worker) => ({ istStaffId: worker.PersonNumber, department: worker.DepartmentName, jobTitle: worker.JobName }));
  } catch (error) {
    console.error("[call-simulator] failed to load HRMS candidate pool", error);
    return [];
  }
}

async function request(baseUrl: string, jar: CookieJar, requestPath: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  if (jar.cookie) headers.set("Cookie", jar.cookie);
  const response = await fetch(`${baseUrl}${requestPath}`, { ...init, headers });
  const setCookie = response.headers.get("set-cookie");
  if (setCookie) jar.cookie = setCookie.split(";")[0];
  return response;
}

async function login(baseUrl: string, jar: CookieJar, username: string, password: string): Promise<void> {
  const r = await request(baseUrl, jar, "/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password })
  });
  if (!r.ok) throw new Error(`[call-simulator] login failed for ${username}: ${r.status}`);
}

async function createOneCall(baseUrl: string, jar: CookieJar, candidates: Candidate[]): Promise<void> {
  const candidate = pick(candidates);
  const reasonNarrative = fillTemplate(pick(REASON_TEMPLATES));
  const channel = pick(["Phone", "WhatsApp", "Callback"]);
  const r = await request(baseUrl, jar, "/api/v1/queue", {
    method: "POST",
    body: JSON.stringify({
      istStaffId: candidate.istStaffId,
      organizationId: "org_phcc",
      patientType: "Staff",
      channel,
      stationCode: "DOH",
      department: candidate.department,
      jobTitle: candidate.jobTitle,
      summary: reasonNarrative,
      reasonNarrative,
      slaMinutes: 20
    })
  });
  if (!r.ok) {
    const body = await r.json().catch(() => ({}));
    console.error("[call-simulator] failed to create call", r.status, body.error ?? body.code);
    return;
  }
  const body = await r.json();
  console.log(`[call-simulator] created ${body.item?.id} (${candidate.istStaffId}): ${reasonNarrative}`);
}

/**
 * Starts the in-process simulator loop against the server's own port. Call
 * once, after app.listen() - it re-authenticates lazily on the first tick so
 * it doesn't race the server's own startup.
 */
export function startIncomingCallSimulator(baseUrl: string, callsPerTick = 2, intervalMinutes = 5): void {
  if (!process.env.SIMULATE_INCOMING_CALLS) {
    return;
  }
  const candidates = loadCandidates();
  if (candidates.length === 0) {
    console.error("[call-simulator] no HRMS candidates loaded - simulator disabled");
    return;
  }
  const jar: CookieJar = {};
  let loggedIn = false;

  async function tick() {
    try {
      if (!loggedIn) {
        await login(baseUrl, jar, INTAKE_USERNAME, INTAKE_PASSWORD);
        loggedIn = true;
      }
      const count = Math.max(1, callsPerTick + Math.round(Math.random() * 2 - 1));
      for (let i = 0; i < count; i++) {
        await createOneCall(baseUrl, jar, candidates);
      }
    } catch (error) {
      console.error("[call-simulator] tick failed", error);
      loggedIn = false;
    }
  }

  console.log(
    `[call-simulator] enabled: ~${callsPerTick} calls every ${intervalMinutes} min, tied to this server process`
  );
  void tick();
  setInterval(() => void tick(), intervalMinutes * 60 * 1000);

  startOtherNurseActivitySimulator(baseUrl);
}

/**
 * Keeps 2-5 calls perpetually claimed and worked by a second, real signed-in
 * identity ("Senior Triage Nurse") - so the "IN PROGRESS" / locked-by-another
 * -nurse card state has something genuinely live to show at all times, for
 * visibility into that part of the UI without needing a second manual
 * browser session running.
 */
function startOtherNurseActivitySimulator(baseUrl: string, minClaimed = 2, maxClaimed = 5): void {
  const jar: CookieJar = {};
  let loggedIn = false;
  const claimedIds = new Set<string>();

  async function claimOne(): Promise<void> {
    const listResp = await request(baseUrl, jar, "/api/v1/queue", {});
    const list = await listResp.json();
    const candidate = (list.queue ?? []).find(
      (item: any) =>
        (item.status === "INCOMING" || item.status === "IN_PROCESS") &&
        !item.lockedBy &&
        !claimedIds.has(item.id) &&
        item.organizationCode === "PHCC"
    );
    if (!candidate) return;
    const r = await request(baseUrl, jar, `/api/v1/queue/${candidate.id}/claim`, { method: "POST" });
    if (r.ok) {
      claimedIds.add(candidate.id);
      console.log(`[call-simulator] other-nurse claimed ${candidate.id}`);
    }
  }

  async function finishOne(id: string): Promise<void> {
    // Complete it properly (context -> disposition -> SBAR) rather than just
    // releasing the lock, so the Completed tab's activity looks genuine too.
    await request(baseUrl, jar, `/api/v1/queue/${id}/context`, {
      method: "PATCH",
      body: JSON.stringify({ vitalsUnobtainable: true })
    });
    const detailResp = await request(baseUrl, jar, `/api/v1/queue/${id}`, {});
    const detail = await detailResp.json();
    const protocolId = detail.item?.preparedProtocol?.primaryProtocolId;
    await request(baseUrl, jar, `/api/v1/queue/${id}/context`, {
      method: "PATCH",
      body: JSON.stringify({
        matchedProtocolId: protocolId,
        calculatedSeverity: "SELF_CARE",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        destinationName: "Self-care with callback precautions"
      })
    });
    const move1 = await request(baseUrl, jar, `/api/v1/queue/${id}/move`, {
      method: "POST",
      body: JSON.stringify({ toStage: "DISPOSITION" })
    });
    if (!move1.ok) {
      await request(baseUrl, jar, `/api/v1/queue/${id}/release`, { method: "POST" });
      return;
    }
    await request(baseUrl, jar, `/api/v1/queue/${id}/context`, {
      method: "PATCH",
      body: JSON.stringify({ clinicalApproval: { approvedAtIso: new Date().toISOString() }, sbarCopied: true })
    });
    await request(baseUrl, jar, `/api/v1/queue/${id}/move`, {
      method: "POST",
      body: JSON.stringify({ toStage: "SBAR", toStatus: "COMPLETED" })
    });
    console.log(`[call-simulator] other-nurse completed ${id}`);
  }

  async function maintain() {
    try {
      if (!loggedIn) {
        await login(baseUrl, jar, OTHER_NURSE_USERNAME, OTHER_NURSE_PASSWORD);
        loggedIn = true;
      }
      // Occasionally finish one of the calls already in progress, so the
      // pool turns over instead of the same 5 calls staying locked forever.
      if (claimedIds.size > 0 && Math.random() < 0.4) {
        const ids = Array.from(claimedIds);
        const id = pick(ids);
        claimedIds.delete(id);
        await finishOne(id).catch((error) => console.error("[call-simulator] other-nurse finish failed", error));
      }
      const target = minClaimed + Math.floor(Math.random() * (maxClaimed - minClaimed + 1));
      while (claimedIds.size < target) {
        const before = claimedIds.size;
        await claimOne();
        if (claimedIds.size === before) break; // nothing left to claim
      }
    } catch (error) {
      console.error("[call-simulator] other-nurse tick failed", error);
      loggedIn = false;
    }
  }

  console.log(`[call-simulator] other-nurse activity enabled: keeps ${minClaimed}-${maxClaimed} calls in progress`);
  void maintain();
  setInterval(() => void maintain(), 60 * 1000);
}
