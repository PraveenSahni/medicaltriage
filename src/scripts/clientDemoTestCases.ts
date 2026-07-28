/**
 * Curated client-demo test suite - one coherent, realistic case per real
 * STCC protocol, deliberately spanning different severity tiers (Emergency,
 * Urgent, Routine, Self-care x2) so a single run showcases the full range
 * of what the Nurse Cockpit does.
 *
 * Every reason narrative here was verified live (via searchClinicalProtocols)
 * to auto-match its target protocol decisively - a real, confirmed lesson
 * from this session: two protocols (Ankle Injury/Ankle Pain) share enough
 * real vendor keywords that a plausible-sounding narrative can tie or even
 * lose to the wrong protocol (see the "jogging, no fall or twist" example
 * that tied 128/128 and matched Ankle Injury instead of Ankle Pain). Every
 * narrative below is either reused verbatim from the exhaustive test
 * scripts (already proven decisive) or independently score-checked before
 * being added here.
 *
 * Each case: creates a real call, confirms auto-match, answers every real
 * IAQ question with a scenario-consistent answer, walks the real TAQ list
 * to a chosen terminal question, and prints the resulting disposition.
 *
 * For a live client demo, all 5 calls should not appear on the board at
 * once - cases are generated one at a time with a real delay between them
 * (DELAY_BETWEEN_CASES_MS, default 60s) so a client watching the Nurse
 * Cockpit/Service Manager Board sees them arrive progressively, the way a
 * real intake queue would. Completed calls are intentionally left in the
 * queue (not deleted) so they're still there to walk through after the run
 * finishes - re-run cleanup separately (e.g. delete via the Service Manager
 * Board or the API) once the demo is done.
 *
 * Usage: npx tsx src/scripts/clientDemoTestCases.ts
 */

const API_BASE = process.env.API_BASE ?? "http://localhost:8080";
const GENERATOR_USERNAME = "intake@irisstar.tech";
const GENERATOR_PASSWORD = "Intake@2026";
const NURSE_USERNAME = "layla@irisstar.tech";
const NURSE_PASSWORD = "Layla@2026";

// Real intake calls don't all arrive at once - spacing generation out (and
// rotating across protocols, which the 5 curated cases already do simply by
// being 5 different protocols run in sequence) makes a live client demo look
// like an actual queue filling up over time instead of a burst of 5 calls
// appearing simultaneously.
const DELAY_BETWEEN_CASES_MS = Number(process.env.DELAY_BETWEEN_CASES_MS ?? 60_000);

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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

type DemoCase = {
  label: string;
  protocolId: string;
  istStaffId: string;
  reasonNarrative: string;
  iaqAnswers: Record<number, string>;
  taqTerminalMatcher: (questionTextEn: string) => boolean;
};

const CASES: DemoCase[] = [
  {
    label: "Case 1 - Abdominal Pain (Male) - EMERGENCY",
    protocolId: "stcc-abdominal-pain-male",
    istStaffId: "IST-00014", // male, 36y
    reasonNarrative: "Severe abdominal pain and stomach pain for two hours, epigastric pain that comes and goes.",
    iaqAnswers: {
      1: "Upper middle of the abdomen, epigastric area.",
      2: "No, it doesn't radiate anywhere else.",
      3: "Started about two hours ago.",
      4: "Came on gradually.",
      5: "Comes and goes - has pain right now.",
      6: "Severe - about 8 out of 10, doubled over.",
      7: "No, first time having pain like this.",
      8: "Not sure, maybe something he ate.",
      9: "Nothing seems to help.",
      10: "No fever, no vomiting, no diarrhea."
    },
    taqTerminalMatcher: (q) => q.includes("SEVERE pain (e.g., excruciating) AND [2] present > 1 hour")
  },
  {
    label: "Case 2 - Ankle Injury - URGENT",
    protocolId: "stcc-ankle-injury",
    istStaffId: "IST-01136", // male, 49y
    reasonNarrative:
      "I sprained my ankle after twisting it playing sport, it is swollen with a possible fracture and I heard a crack.",
    iaqAnswers: {
      1: "Twisted it landing awkwardly playing football.",
      2: "About 2 hours ago.",
      3: "Outside of the right ankle.",
      4: "Swollen, some bruising starting to show.",
      5: "Can put a little weight on it but it's very painful.",
      6: "Swelling is about the size of a golf ball.",
      7: "Yes - severe, about 8 out of 10, can't really walk on it.",
      8: "Had a tetanus shot about 3 years ago.",
      9: "No other symptoms.",
      10: "No."
    },
    taqTerminalMatcher: (q) => q.includes("SEVERE pain (e.g., excruciating) AND [2] not improved 2 hours after pain medicine/ice packs")
  },
  {
    label: "Case 3 - Ankle Pain - ROUTINE",
    protocolId: "stcc-ankle-pain",
    istStaffId: "IST-00001", // female, 29y
    reasonNarrative:
      "Ankle pain and stiffness in the joint for several days, feels like arthritis flaring up, nothing happened to cause it.",
    iaqAnswers: {
      1: "About a week ago, gradually - nothing happened to cause it.",
      2: "The joint area of the left ankle, mostly the outer side.",
      3: "Moderate - about 5 out of 10, worse by end of day.",
      4: "No recent work or exercise.",
      5: "Feels like arthritis flaring up - had joint issues before.",
      6: "No swelling, no fever, no rash - just the ache and stiffness.",
      7: "No."
    },
    taqTerminalMatcher: (q) => q.includes("chronic symptom")
  },
  {
    label: "Case 4 - Diarrhea - SELF-CARE",
    protocolId: "stcc-diarrhea",
    istStaffId: "IST-00014", // male, 36y
    reasonNarrative:
      "Watery stools and loose bowel movements for a day, feeling weak and dizzy, possibly food poisoning from recent travel.",
    iaqAnswers: {
      1: "Mild - only 2 to 3 more stools than normal today.",
      2: "Started about a day ago.",
      3: "Watery, yellowish, no blood or mucous.",
      4: "No vomiting.",
      5: "Some mild crampy abdomen pain.",
      6: "Mild - about 2 out of 10.",
      7: "N/A, no vomiting.",
      8: "Dry mouth a little, no dizziness now, urinated a few hours ago.",
      9: "Traveled abroad last week, possibly something eaten there.",
      10: "No antibiotics.",
      11: "No fever, no blood in stool.",
      12: "No."
    },
    taqTerminalMatcher: (q) => q.includes("MILD to MODERATE diarrhea (e.g., 1-6 times")
  },
  {
    label: "Case 5 - Pregnancy Fetal Movement - SELF-CARE (reassurance)",
    protocolId: "stcc-pregnancy-decreased-or-abnormal-fetal-movement",
    istStaffId: "IST-00001", // female, 29y
    reasonNarrative:
      "I'm pregnant and doing a kick count, the baby's fetal movement seems decreased today compared to usual.",
    iaqAnswers: {
      1: "Felt slightly less today, but has felt some movement in the last hour.",
      2: "Due date is in about 6 weeks.",
      3: "34 weeks pregnant, pregnancy has been going well.",
      4: "No specialist visits, no complications so far.",
      5: "No other symptoms - no pain, fever, bleeding, or leaking fluid."
    },
    taqTerminalMatcher: (q) => q.includes("baby moving normally OR normal kick count")
  }
];

async function runCase(generatorJar: CookieJar, nurseJar: CookieJar, demoCase: DemoCase): Promise<void> {
  console.log(`\n${"=".repeat(70)}`);
  console.log(demoCase.label);
  console.log("=".repeat(70));
  console.log(`Reason for Call: "${demoCase.reasonNarrative}"`);

  const create = await request(generatorJar, "/api/v1/queue", {
    method: "POST",
    body: JSON.stringify({
      istStaffId: demoCase.istStaffId,
      patientType: "Staff",
      channel: "Phone",
      stationCode: "DOH",
      summary: demoCase.reasonNarrative,
      reasonNarrative: demoCase.reasonNarrative,
      safetyFloorActive: false,
      slaMinutes: 20
    })
  });
  if (!create.ok) {
    console.log("FAILED to create call:", create.status);
    return;
  }
  const createBody = await create.json();
  const id = createBody.item.id as string;
  const matched = createBody.item.preparedProtocol?.primaryProtocolId as string | undefined;
  const suggestions = createBody.item.preparedProtocol?.suggestions as
    | Array<{ protocolId: string; score: number }>
    | undefined;

  console.log(
    `Auto-matched: ${matched} ${matched === demoCase.protocolId ? "(correct)" : "(WRONG - expected " + demoCase.protocolId + ")"}`
  );
  console.log("Top candidates:", JSON.stringify(suggestions?.slice(0, 2)));

  if (matched !== demoCase.protocolId) {
    console.log("Skipping rest of this case - auto-match did not resolve to the target protocol.");
    await request(generatorJar, `/api/v1/queue/${id}`, { method: "DELETE" }).catch(() => {});
    return;
  }

  await request(nurseJar, `/api/v1/queue/${id}/claim`, { method: "POST" });
  await request(nurseJar, `/api/v1/queue/${id}/context`, {
    method: "PATCH",
    body: JSON.stringify({ vitalsUnobtainable: true })
  });

  const detailResp = await request(nurseJar, `/api/v1/protocols/${demoCase.protocolId}`, {});
  const detail = await detailResp.json();
  const iaq = [...(detail.protocol?.initialAssessmentQuestions ?? [])].sort(
    (a: { sequence: number }, b: { sequence: number }) => a.sequence - b.sequence
  );

  console.log(`\nInitial Assessment Questions (${iaq.length}):`);
  let iaqResponses: Record<string, string> = {};
  for (const q of iaq) {
    const answer = demoCase.iaqAnswers[q.sequence] ?? "No additional findings.";
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
  const terminalIndex = taq.findIndex((q: { questionTextEn: string }) => demoCase.taqTerminalMatcher(q.questionTextEn));
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
      matchedProtocolId: demoCase.protocolId,
      calculatedSeverity: terminalQuestion.severity.toUpperCase().replace("-", "_"),
      dispositionCode: terminalQuestion.dispositionCode,
      clinicalApproval: { terminalQuestionId: terminalQuestion.id },
      taqResponses
    })
  });

  // Advance the real stage (not just the context fields) so the call shows
  // up correctly on the Kanban board's "Disposition & Advice" column with
  // its real disposition, ready to walk through live - left here
  // deliberately (not completed/deleted) so it's still on the board for the
  // demo after this script finishes.
  await request(nurseJar, `/api/v1/queue/${id}/move`, {
    method: "POST",
    body: JSON.stringify({ toStage: "DISPOSITION" })
  }).catch(() => {});

  const finalResp = await request(nurseJar, `/api/v1/queue/${id}`, {});
  const finalItem = (await finalResp.json()).item;

  console.log(
    `\nResult: Disposition = ${finalItem?.dispositionCode} | Severity = ${finalItem?.calculatedSeverity}`
  );
  console.log(`Left on the board (currentStage: ${finalItem?.currentStage}) for the live demo.`);
}

async function main() {
  const generatorJar: CookieJar = {};
  await login(generatorJar, GENERATOR_USERNAME, GENERATOR_PASSWORD);

  const nurseJar: CookieJar = {};
  await login(nurseJar, NURSE_USERNAME, NURSE_PASSWORD);

  console.log(
    `Running ${CASES.length} client-demo test cases against ${API_BASE}, ${DELAY_BETWEEN_CASES_MS / 1000}s apart\n`
  );

  for (let i = 0; i < CASES.length; i++) {
    await runCase(generatorJar, nurseJar, CASES[i]);
    if (i < CASES.length - 1) {
      console.log(`\n(waiting ${DELAY_BETWEEN_CASES_MS / 1000}s before generating the next case...)`);
      await sleep(DELAY_BETWEEN_CASES_MS);
    }
  }

  console.log(`\n${"=".repeat(70)}`);
  console.log("All demo cases complete.");
}

main().catch((error) => {
  console.error("Demo test run failed", error);
  process.exitCode = 1;
});
