/**
 * Continuous mock tele-triage call generator: creates a random number of new
 * INCOMING queue calls at a fixed interval, via the same POST /api/v1/queue
 * endpoint the real call-intake coordinator UI uses - so the Nurse Cockpit's
 * Open Calls tab keeps receiving fresh, realistic calls to work through live,
 * for observing the end-to-end flow rather than a one-shot bulk seed.
 *
 * Usage: npx tsx src/scripts/simulateIncomingCalls.ts [callsPerTick] [intervalMinutes]
 * Defaults: 2 calls every 5 minutes. Runs forever - stop with Ctrl+C.
 */

import { readFileSync } from "node:fs";
import path from "node:path";

const API_BASE = process.env.API_BASE ?? "http://localhost:8080";
const INTAKE_USERNAME = "layla@irisstar.tech";
const INTAKE_PASSWORD = "Layla@2026";
const SEED_DATA_PATH = path.resolve(process.cwd(), "data", "generated", "ist_qatar_seed_data.json");

const CALLS_PER_TICK = Number(process.argv[2] ?? 2);
const INTERVAL_MINUTES = Number(process.argv[3] ?? 5);

// Bearer token attached alongside the cookie - Firebase Hosting's rewrite-
// to-Cloud-Run proxy does not forward the Cookie header on the custom
// domain (triaged.irisstar.tech), so cookie-only auth silently fails there.
type CookieJar = { cookie?: string; token?: string };

async function request(jar: CookieJar, path: string, init: RequestInit = {}, attempt = 1): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  if (jar.cookie) headers.set("Cookie", jar.cookie);
  if (jar.token) headers.set("Authorization", `Bearer ${jar.token}`);
  try {
    const response = await fetch(`${API_BASE}${path}`, { ...init, headers });
    const setCookie = response.headers.get("set-cookie");
    if (setCookie) jar.cookie = setCookie.split(";")[0];
    return response;
  } catch (error) {
    if (attempt < 4) {
      await new Promise((resolve) => setTimeout(resolve, attempt * 500));
      return request(jar, path, init, attempt + 1);
    }
    throw error;
  }
}

async function login(jar: CookieJar): Promise<void> {
  const r = await request(jar, "/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify({ username: INTAKE_USERNAME, password: INTAKE_PASSWORD })
  });
  if (!r.ok) throw new Error(`Login failed: ${r.status}`);
  const body = (await r.json()) as { accessToken?: string };
  jar.token = body.accessToken;
}

type Candidate = {
  istStaffId: string;
  department: string;
  jobTitle: string;
};

function loadCandidates(): Candidate[] {
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
}

// A spread of realistic caller narratives, deliberately not copied from any
// licensed STCC text (see abdominalPainMaleTestCases() for the same rule) -
// plain-language complaints that will search-match one of the 229 real
// protocols currently loaded, so the simulated call plays through genuine
// content just like a real incoming call would.
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

function pick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

async function createOneCall(jar: CookieJar, candidates: Candidate[]): Promise<{ id?: string; status: number; error?: string }> {
  const candidate = pick(candidates);
  const reasonNarrative = fillTemplate(pick(REASON_TEMPLATES));
  const channel = pick(["Phone", "WhatsApp", "Callback"]);
  const r = await request(jar, "/api/v1/queue", {
    method: "POST",
    body: JSON.stringify({
      istStaffId: candidate.istStaffId,
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
    return { status: r.status, error: body.error ?? body.code };
  }
  const body = await r.json();
  return { id: body.item?.id, status: r.status };
}

async function main() {
  const jar: CookieJar = {};
  await login(jar);
  const candidates = loadCandidates();
  console.log(
    JSON.stringify({
      simulator: "started",
      candidatePoolSize: candidates.length,
      callsPerTick: CALLS_PER_TICK,
      intervalMinutes: INTERVAL_MINUTES
    })
  );

  async function tick() {
    const results = [];
    // Vary the count a little around the target so it doesn't feel
    // mechanically identical every cycle (e.g. "2 every 5 min" becomes
    // "1-3 every 5 min" in practice).
    const count = Math.max(1, CALLS_PER_TICK + Math.round(Math.random() * 2 - 1));
    for (let i = 0; i < count; i++) {
      results.push(await createOneCall(jar, candidates));
    }
    console.log(
      JSON.stringify({
        tick: new Date().toISOString(),
        created: results.filter((r) => r.id).length,
        results
      })
    );
  }

  await tick();
  setInterval(() => {
    tick().catch((error) => console.error("Tick failed", error));
  }, INTERVAL_MINUTES * 60 * 1000);
}

main().catch((error) => {
  console.error("Simulator failed to start", error);
  process.exitCode = 1;
});
