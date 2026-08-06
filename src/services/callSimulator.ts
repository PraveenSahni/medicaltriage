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

import { buildSimulatedQueueCreateRequest, loadStaffCandidatePool, type SimulatorCandidate } from "./queueCallGenerator.js";
import { sanitizeForLog } from "../utils/logSanitizer.js";

const INTAKE_USERNAME = "intake@irisstar.tech";
const INTAKE_PASSWORD = "Intake@2026";
// Must be a real PHCC-scoped nurse identity - a HMC/SIDRA-scoped identity
// (e.g. Senior/Pediatric Triage Nurse) can't see or claim PHCC-org calls at
// all due to real multi-tenant RBAC boundaries (confirmed while testing
// this). The system only has one PHCC-scoped nurse account (layla@), so this
// loop reuses it rather than a dedicated second identity - a human logged in
// as the same account concurrently would share this session's lock/claim
// activity, which is an acceptable demo-only tradeoff.
const OTHER_NURSE_USERNAME = "layla@irisstar.tech";
const OTHER_NURSE_PASSWORD = "Layla@2026";

type CookieJar = { cookie?: string };
type Candidate = SimulatorCandidate;

function loadCandidates(): Candidate[] {
  if (process.env.SIMULATE_INCOMING_CALLS !== "true") return [];
  return loadStaffCandidatePool();
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
  const requestBody = buildSimulatedQueueCreateRequest(candidates);
  // No organizationId override - defaults to the calling session's own org
  // (single tenant, org_ist_tech), matching every other generated/claimed
  // call. A hardcoded override here previously caused generated calls to
  // land in a different org than the nurse claiming them could see.
  const r = await request(baseUrl, jar, "/api/v1/queue", {
    method: "POST",
    body: JSON.stringify(requestBody)
  });
  if (!r.ok) {
    const body = await r.json().catch(() => ({}));
    console.error("[call-simulator] failed to create call", r.status, body.error ?? body.code);
    return;
  }
  const body = await r.json();
  console.log(`[call-simulator] created ${body.item?.id} (${requestBody.istStaffId}): ${requestBody.reasonNarrative}`);
}

function pick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

/**
 * Starts the in-process simulator loop against the server's own port. Call
 * once, after app.listen() - it re-authenticates lazily on the first tick so
 * it doesn't race the server's own startup.
 */
export function startIncomingCallSimulator(baseUrl: string, callsPerTick = 2, intervalMinutes = 5): void {
  if (process.env.SIMULATE_INCOMING_CALLS !== "true") {
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
      console.error("[call-simulator] tick failed", sanitizeForLog(error));
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
        await finishOne(id).catch((error) => console.error("[call-simulator] other-nurse finish failed", sanitizeForLog(error)));
      }
      const target = minClaimed + Math.floor(Math.random() * (maxClaimed - minClaimed + 1));
      while (claimedIds.size < target) {
        const before = claimedIds.size;
        await claimOne();
        if (claimedIds.size === before) break; // nothing left to claim
      }
    } catch (error) {
      console.error("[call-simulator] other-nurse tick failed", sanitizeForLog(error));
      loggedIn = false;
    }
  }

  console.log(`[call-simulator] other-nurse activity enabled: keeps ${minClaimed}-${maxClaimed} calls in progress`);
  void maintain();
  setInterval(() => void maintain(), 60 * 1000);
}
