/**
 * Minimal 2-case UAT suite: one self-care/routine case (Ankle Pain, no
 * trauma) and one urgent/trauma case (Ankle Injury), using the exact IAQ
 * responses handed to the user for sign-off review. Creates real queue
 * items end-to-end (create -> claim -> answer every real IAQ -> walk TAQ to
 * the expected terminal question -> advance to DISPOSITION) and leaves both
 * on the board afterward for manual walkthrough - nothing is deleted.
 *
 * Usage: npx tsx src/scripts/uatTwoCaseSuite.ts
 */

const API_BASE = process.env.API_BASE ?? "http://localhost:8080";
const GENERATOR_USERNAME = "layla@irisstar.tech";
const GENERATOR_PASSWORD = process.env.TEST_NURSE_PASSWORD ?? "";
const NURSE_USERNAME = "layla@irisstar.tech";
const NURSE_PASSWORD = process.env.TEST_NURSE_PASSWORD ?? "";

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

async function login(jar: CookieJar, username: string, password: string): Promise<void> {
  const r = await request(jar, "/api/v1/auth/login", { method: "POST", body: JSON.stringify({ username, password }) });
  if (!r.ok) throw new Error(`Login failed for ${username}: ${r.status}`);
  const body = (await r.json()) as { accessToken?: string };
  jar.token = body.accessToken;
}

type UatCase = {
  label: string;
  protocolId: string;
  istStaffId: string;
  reasonNarrative: string;
  iaqAnswers: Record<number, string>;
  taqTerminalMatcher: (questionTextEn: string) => boolean;
};

const CASES: UatCase[] = [
  {
    label: "UAT Case 1 - Ankle Pain - ROUTINE / self-care",
    protocolId: "stcc-ankle-pain",
    istStaffId: "IST-01136", // male, 49y
    reasonNarrative:
      "Ankle pain and stiffness in the joint for several days, feels like arthritis flaring up, nothing happened to cause it.",
    iaqAnswers: {
      1: "About 5 days ago, came on gradually.",
      2: "Around the ankle joint, mostly on the outside.",
      3: "Moderate, about a 4 out of 10 - I can still walk but it slows me down.",
      4: "No, nothing new - I haven't changed my routine.",
      5: "Nothing happened, it feels like arthritis flaring up.",
      6: "No swelling, no fever, no calf pain, no rash.",
      7: "N/A - male patient."
    },
    taqTerminalMatcher: (q) => q.includes("chronic symptom")
  },
  {
    label: "UAT Case 2 - Ankle Injury - URGENT",
    protocolId: "stcc-ankle-injury",
    istStaffId: "IST-00014", // male, 36y (different staff, avoids one-active-encounter conflict)
    reasonNarrative:
      "I sprained my ankle after twisting it playing sport, it is swollen with a possible fracture and I heard a crack.",
    iaqAnswers: {
      1: "Twisted it playing football, landed awkwardly.",
      2: "About two hours ago.",
      3: "Lateral side of the right ankle.",
      4: "Swollen and bruised, looks slightly deformed compared to the other side.",
      5: "No - can't put any weight on it or walk at all.",
      6: "Covers the whole ankle joint, about 4 inches across.",
      7: "Severe, about 8 out of 10 - can't do anything, can't walk.",
      8: "Skin isn't broken, but it's probably been 10 years since my last booster.",
      9: "Some numbness in my toes, and it feels colder than the other foot.",
      10: "N/A - male patient."
    },
    taqTerminalMatcher: (q) => q.includes("SEVERE pain (e.g., excruciating) AND [2] not improved 2 hours after pain medicine/ice packs")
  }
];

async function runCase(generatorJar: CookieJar, nurseJar: CookieJar, uatCase: UatCase): Promise<void> {
  console.log(`\n${"=".repeat(70)}`);
  console.log(uatCase.label);
  console.log("=".repeat(70));
  console.log(`Reason for Call: "${uatCase.reasonNarrative}"`);

  const create = await request(generatorJar, "/api/v1/queue", {
    method: "POST",
    body: JSON.stringify({
      istStaffId: uatCase.istStaffId,
      patientType: "Staff",
      channel: "Phone",
      stationCode: "DOH",
      summary: uatCase.reasonNarrative,
      reasonNarrative: uatCase.reasonNarrative,
      safetyFloorActive: false,
      slaMinutes: 20
    })
  });
  if (!create.ok) {
    console.log("FAILED to create call:", create.status, await create.text());
    return;
  }
  const createBody = await create.json();
  const id = createBody.item.id as string;
  const matched = createBody.item.preparedProtocol?.primaryProtocolId as string | undefined;
  const suggestions = createBody.item.preparedProtocol?.suggestions as
    | Array<{ protocolId: string; score: number }>
    | undefined;

  console.log(
    `Auto-matched: ${matched} ${matched === uatCase.protocolId ? "(correct)" : "(WRONG - expected " + uatCase.protocolId + ")"}`
  );
  console.log("Top candidates:", JSON.stringify(suggestions?.slice(0, 2)));

  if (matched !== uatCase.protocolId) {
    console.log("Skipping rest of this case - auto-match did not resolve to the target protocol.");
    await request(generatorJar, `/api/v1/queue/${id}`, { method: "DELETE" }).catch(() => {});
    return;
  }

  await request(nurseJar, `/api/v1/queue/${id}/claim`, { method: "POST" });
  await request(nurseJar, `/api/v1/queue/${id}/context`, {
    method: "PATCH",
    body: JSON.stringify({ vitalsUnobtainable: true })
  });

  const detailResp = await request(nurseJar, `/api/v1/protocols/${uatCase.protocolId}`, {});
  const detail = await detailResp.json();
  const iaq = [...(detail.protocol?.initialAssessmentQuestions ?? [])].sort(
    (a: { sequence: number }, b: { sequence: number }) => a.sequence - b.sequence
  );

  console.log(`\nInitial Assessment Questions (${iaq.length}):`);
  let iaqResponses: Record<string, string> = {};
  for (const q of iaq) {
    const answer = uatCase.iaqAnswers[q.sequence] ?? "No additional findings.";
    iaqResponses = { ...iaqResponses, [q.id]: answer };
    console.log(`  Q${q.sequence}. ${q.promptTextEn}\n     -> ${answer}`);
  }
  await request(nurseJar, `/api/v1/queue/${id}/context`, {
    method: "PATCH",
    body: JSON.stringify({ initialAssessmentResponses: iaqResponses })
  });

  const taq = [...(detail.protocol?.questions ?? [])].sort(
    (a: { acuityOrder: number }, b: { acuityOrder: number }) => a.acuityOrder - b.acuityOrder
  );
  const terminalIndex = taq.findIndex((q: { questionTextEn: string }) => uatCase.taqTerminalMatcher(q.questionTextEn));
  if (terminalIndex === -1) {
    console.log("FAILED: could not find the expected terminal TAQ question in this protocol's real question list.");
    await request(nurseJar, `/api/v1/queue/${id}/release`, { method: "POST" }).catch(() => {});
    return;
  }
  const terminalQuestion = taq[terminalIndex];

  let taqResponses: Record<string, boolean> = {};
  for (let i = 0; i < terminalIndex; i++) {
    taqResponses = { ...taqResponses, [taq[i].id]: false };
  }
  taqResponses = { ...taqResponses, [terminalQuestion.id]: true };

  console.log(
    `\nTAQ path: No to questions 1-${terminalIndex}, Yes at Q${terminalIndex + 1}: "${terminalQuestion.questionTextEn}"`
  );

  await request(nurseJar, `/api/v1/queue/${id}/context`, {
    method: "PATCH",
    body: JSON.stringify({
      matchedProtocolId: uatCase.protocolId,
      calculatedSeverity: terminalQuestion.severity.toUpperCase().replace("-", "_"),
      dispositionCode: terminalQuestion.dispositionCode,
      clinicalApproval: { terminalQuestionId: terminalQuestion.id },
      taqResponses
    })
  });

  await request(nurseJar, `/api/v1/queue/${id}/move`, {
    method: "POST",
    body: JSON.stringify({ toStage: "DISPOSITION" })
  }).catch(() => {});

  const finalResp = await request(nurseJar, `/api/v1/queue/${id}`, {});
  const finalItem = (await finalResp.json()).item;

  console.log(`\nResult: Disposition = ${finalItem?.dispositionCode} | Severity = ${finalItem?.calculatedSeverity}`);
  console.log(`Left on the board (currentStage: ${finalItem?.currentStage}) for UAT walkthrough.`);
}

async function main() {
  const generatorJar: CookieJar = {};
  await login(generatorJar, GENERATOR_USERNAME, GENERATOR_PASSWORD);

  const nurseJar: CookieJar = {};
  await login(nurseJar, NURSE_USERNAME, NURSE_PASSWORD);

  console.log(`Running ${CASES.length} UAT test cases against ${API_BASE}\n`);

  for (const uatCase of CASES) {
    await runCase(generatorJar, nurseJar, uatCase);
  }

  console.log(`\n${"=".repeat(70)}`);
  console.log("Both UAT cases complete.");
}

main().catch((error) => {
  console.error("UAT suite run failed", error);
  process.exitCode = 1;
});
