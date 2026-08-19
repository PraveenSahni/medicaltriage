/**
 * Creates a batch of synthetic demo queue calls that sit at the "Questions"
 * (PROTOCOL) stage - protocol matched, identity/vitals gates satisfied, but
 * zero TAQ answers recorded yet - so the Cockpit's Questions tab has a real
 * backlog to demo/QA against for each of the 5 real STCC protocols currently
 * loaded.
 *
 * Reuses the same real-HRMS-record + forced-protocol-match pattern already
 * proven in simulateProtocolBatchExhaustive.ts, but stops right after the
 * matchedProtocolId PATCH instead of driving every case through to
 * completion.
 *
 * Usage: API_BASE=https://triaged.irisstar.tech npx tsx src/scripts/seedQuestionsStageBacklog.ts [countPerProtocol]
 */

const API_BASE = process.env.API_BASE ?? "http://localhost:8080";
const GENERATOR_USERNAME = "layla@irisstar.tech";
const GENERATOR_PASSWORD = process.env.TEST_NURSE_PASSWORD ?? "";
const NURSES = [
  { username: "layla@irisstar.tech", password: process.env.TEST_NURSE_PASSWORD ?? "" },
  { username: "sara@irisstar.tech", password: process.env.TEST_SECONDARY_NURSE_PASSWORD ?? "" }
];

const TARGET_PROTOCOL_TITLES = [
  "Abdominal Pain - Male",
  "Diarrhea",
  "Pregnancy - Decreased or Abnormal Fetal Movement",
  "Ankle Pain",
  "Ankle Injury"
];

type CookieJar = { cookie?: string; token?: string };
type ProtocolSummary = { id: string; titleEn: string; questionCount: number };

const CALLER_OPENERS = [
  "I'm calling because",
  "Here's what's going on:",
  "I wanted to mention",
  "I'm worried because",
  "The reason I'm calling is",
  "What's happening is"
];

const DURATIONS = ["twenty minutes", "an hour", "two hours", "a day", "three days", "a week"];

function reasonNarrativeFor(protocolTitle: string, seed: number): string {
  const opener = CALLER_OPENERS[seed % CALLER_OPENERS.length];
  const duration = DURATIONS[seed % DURATIONS.length];
  return `${opener} symptoms consistent with ${protocolTitle.toLowerCase()} that started about ${duration} ago.`;
}

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

async function login(jar: CookieJar, username: string, password: string): Promise<void> {
  const r = await request(jar, "/api/v1/auth/login", { method: "POST", body: JSON.stringify({ username, password }) });
  if (!r.ok) throw new Error(`Login failed for ${username}: ${r.status}`);
  const body = (await r.json()) as { accessToken?: string };
  jar.token = body.accessToken;
}

type CaseResult = { id: string; protocolId: string; outcome: string };

async function createOneQuestionsStageCase(
  generatorJar: CookieJar,
  jar: CookieJar,
  protocolId: string,
  protocolTitle: string,
  seed: number
): Promise<CaseResult> {
  let genResp = await request(generatorJar, "/api/v1/queue/simulate", { method: "POST" });
  for (let retry = 0; genResp.status === 429 && retry < 6; retry++) {
    await new Promise((resolve) => setTimeout(resolve, 3000 * (retry + 1)));
    genResp = await request(generatorJar, "/api/v1/queue/simulate", { method: "POST" });
  }
  if (!genResp.ok) return { id: "unknown", protocolId, outcome: `generate-failed-${genResp.status}` };
  const genBody = await genResp.json();
  const id = genBody.item.id as string;

  const claim = await request(jar, `/api/v1/queue/${id}/claim`, { method: "POST" });
  if (!claim.ok) return { id, protocolId, outcome: `claim-failed-${claim.status}` };

  const reasonNarrative = reasonNarrativeFor(protocolTitle, seed);
  const contextResp = await request(jar, `/api/v1/queue/${id}/context`, {
    method: "PATCH",
    body: JSON.stringify({
      reasonNarrative,
      identityValidated: true,
      vitalsUnobtainable: true,
      matchedProtocolId: protocolId
    })
  });
  if (!contextResp.ok) {
    const body = await contextResp.json().catch(() => ({}));
    return { id, protocolId, outcome: `context-update-failed-${contextResp.status}:${JSON.stringify(body)}` };
  }

  const move = await request(jar, `/api/v1/queue/${id}/move`, {
    method: "POST",
    body: JSON.stringify({ toStage: "PROTOCOL" })
  });
  if (!move.ok) {
    const body = await move.json().catch(() => ({}));
    return { id, protocolId, outcome: `move-to-protocol-failed-${move.status}:${JSON.stringify(body)}` };
  }

  return { id, protocolId, outcome: "created" };
}

async function main() {
  const countPerProtocol = Number(process.argv[2] ?? 20);
  // Optional per-protocol override for topping up specific protocols only,
  // e.g. TARGET_COUNTS='{"Diarrhea":6,"Ankle Injury":11}' - used to fill
  // gaps left by earlier rate-limited runs without over-creating for
  // protocols that already reached their target count.
  const targetCounts: Record<string, number> = process.env.TARGET_COUNTS ? JSON.parse(process.env.TARGET_COUNTS) : {};

  const generatorJar: CookieJar = {};
  await login(generatorJar, GENERATOR_USERNAME, GENERATOR_PASSWORD);
  const nurseJars: CookieJar[] = [];
  for (const nurse of NURSES) {
    const jar: CookieJar = {};
    await login(jar, nurse.username, nurse.password);
    nurseJars.push(jar);
  }

  const listResp = await request(nurseJars[0], "/api/v1/protocols?limit=1000", {});
  const listBody = await listResp.json();
  const allProtocols: ProtocolSummary[] = listBody.protocols.map((p: any) => ({
    id: p.id,
    titleEn: p.titleEn,
    questionCount: p.questionCount
  }));

  const targets = TARGET_PROTOCOL_TITLES.map((title) => allProtocols.find((p) => p.titleEn === title)).filter(
    (p): p is ProtocolSummary => Boolean(p)
  );
  console.log(`Resolved ${targets.length}/${TARGET_PROTOCOL_TITLES.length} target protocols:`);
  console.log(targets.map((p) => `${p.titleEn} (${p.id})`).join("\n"));
  const missing = TARGET_PROTOCOL_TITLES.filter((title) => !targets.some((p) => p.titleEn === title));
  if (missing.length > 0) {
    console.warn(`WARNING: could not resolve these protocol titles, skipping: ${missing.join(", ")}`);
  }

  const allResults: CaseResult[] = [];
  let seed = 0;
  for (const protocol of targets) {
    const thisCount = targetCounts[protocol.titleEn] ?? countPerProtocol;
    let createdForProtocol = 0;
    for (let i = 0; i < thisCount; i++) {
      seed++;
      const nurseJar = nurseJars[seed % nurseJars.length];
      try {
        const result = await createOneQuestionsStageCase(generatorJar, nurseJar, protocol.id, protocol.titleEn, seed);
        allResults.push(result);
        if (result.outcome === "created") createdForProtocol++;
      } catch (error) {
        allResults.push({
          id: "unknown",
          protocolId: protocol.id,
          outcome: `exception:${error instanceof Error ? error.message : String(error)}`
        });
      }
    }
    console.log(`  ${protocol.titleEn}: ${createdForProtocol}/${thisCount} created`);
  }

  const created = allResults.filter((r) => r.outcome === "created");
  const failures = allResults.filter((r) => r.outcome !== "created");
  console.log("\n=== Summary ===");
  console.log(
    JSON.stringify(
      {
        totalAttempted: allResults.length,
        created: created.length,
        failed: failures.length,
        failures: failures.map((f) => ({ protocolId: f.protocolId, outcome: f.outcome }))
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error("Seed run failed", error);
  process.exitCode = 1;
});
