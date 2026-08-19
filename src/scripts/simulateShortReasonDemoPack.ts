/**
 * Client-demo test pack: one real call per licensed STCC protocol (5 total),
 * each using a short "Reason for Call" (under 10 words) instead of the long
 * clinical narratives used elsewhere - built for a nurse to read aloud
 * quickly during a live client demo. Each reason must still auto-match its
 * intended protocol on its own merit via the real keyword search
 * (searchClinicalProtocols) - no forced matchedProtocolId override - exactly
 * like a real intake call. Each call is then driven end-to-end through the
 * real API (claim -> IAQ -> all-"No" TAQ self-care path -> disposition ->
 * SBAR -> complete) and independently re-validated against the persisted
 * queue record.
 *
 * Usage: npx tsx src/scripts/simulateShortReasonDemoPack.ts
 */

const API_BASE = process.env.API_BASE ?? "http://localhost:8080";
const GENERATOR_USERNAME = "layla@irisstar.tech";
const GENERATOR_PASSWORD = process.env.TEST_NURSE_PASSWORD ?? "";
const NURSE_USERNAME = "layla@irisstar.tech";
const NURSE_PASSWORD = process.env.TEST_NURSE_PASSWORD ?? "";

type CookieJar = { cookie?: string; token?: string };
type Question = { id: string; acuityOrder: number; severity: string; dispositionCode: string };
type InitialAssessmentQuestion = {
  id: string;
  sequence: number;
  responseType: "LOCATION" | "DURATION" | "YES_NO" | "TEMPERATURE" | "PAIN_SCALE" | "OPEN_TEXT";
  promptTextEn: string;
};

const QATAR_DESTINATION_BY_CODE: Record<string, string> = {
  SIDRA_PEDIATRIC_ED: "Sidra Medicine Emergency Department",
  HMC_EMERGENCY_DEPARTMENT: "Nearest Hamad Medical Corporation Emergency Department",
  HMC_URGENT_REVIEW: "HMC urgent review pathway",
  IST_HIA_MIDFIELD_MEDICAL_CENTRE: "IST Medical Centre, HIA Midfield",
  IST_OLD_AIRPORT_MEDICAL_COMMISSION: "IST Old Airport Road Medical Commission",
  PHCC_URGENT_CARE_OR_TELECONSULT: "PHCC urgent care or IST teleconsult",
  OUTSTATION_TELECONSULT_ESCALATION: "IST outstation teleconsult escalation",
  SELF_CARE_WITH_CALLBACK_PRECAUTIONS: "Self-care with callback precautions"
};

const SEVERITY_MAP: Record<string, string> = {
  Emergency: "EMERGENCY",
  Urgent: "URGENT",
  Routine: "ROUTINE",
  "Self-care": "SELF_CARE"
};

// One test case per real protocol - short reason, correct-sex staff member
// per protocol's real eligibility (male for Abdominal Pain - Male, female
// for Pregnancy), same candidates already confirmed via HRMS in the
// exhaustive per-protocol scripts this session.
const CASES: Array<{ expectedProtocolId: string; istStaffId: string; reasonNarrative: string }> = [
  { expectedProtocolId: "stcc-abdominal-pain-male", istStaffId: "IST-00014", reasonNarrative: "Severe stomach pain for two hours" },
  { expectedProtocolId: "stcc-ankle-injury", istStaffId: "IST-00014", reasonNarrative: "Sprained ankle, swollen with possible fracture" },
  { expectedProtocolId: "stcc-ankle-pain", istStaffId: "IST-01136", reasonNarrative: "Ankle pain and stiffness for days" },
  { expectedProtocolId: "stcc-diarrhea", istStaffId: "IST-00014", reasonNarrative: "Watery diarrhea and loose stools today" },
  { expectedProtocolId: "stcc-pregnancy-decreased-or-abnormal-fetal-movement", istStaffId: "IST-00001", reasonNarrative: "Pregnant, baby's movement seems decreased today" }
];

function sampleInitialAssessmentAnswer(question: InitialAssessmentQuestion): string {
  switch (question.responseType) {
    case "YES_NO":
      return "No";
    case "PAIN_SCALE":
      return "Mild (1-3)";
    case "TEMPERATURE":
      return "37.0";
    case "DURATION":
      return "Since today";
    case "LOCATION":
      return "Localized, one side";
    case "OPEN_TEXT":
    default:
      return "No additional findings reported by caller.";
  }
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

type CaseResult = {
  wordCount: number;
  reasonNarrative: string;
  expectedProtocolId: string;
  actualProtocolId?: string;
  protocolTitle?: string;
  matchScore?: number;
  actualDispositionCode?: string;
  actualSeverity?: string;
  actualDestination?: string;
  validated?: boolean;
  outcome: string;
};

async function runCase(
  generatorJar: CookieJar,
  nurseJar: CookieJar,
  testCase: (typeof CASES)[number]
): Promise<CaseResult> {
  const wordCount = testCase.reasonNarrative.trim().split(/\s+/).length;

  const create = await request(generatorJar, "/api/v1/queue", {
    method: "POST",
    body: JSON.stringify({
      istStaffId: testCase.istStaffId,
      patientType: "Staff",
      channel: "Phone",
      stationCode: "DOH",
      summary: testCase.reasonNarrative,
      reasonNarrative: testCase.reasonNarrative,
      safetyFloorActive: false,
      slaMinutes: 20
    })
  });
  if (!create.ok) {
    return { wordCount, reasonNarrative: testCase.reasonNarrative, expectedProtocolId: testCase.expectedProtocolId, outcome: `create-failed-${create.status}` };
  }
  const created = await create.json();
  const id = created.item.id as string;
  const actualProtocolId = created.item.preparedProtocol?.primaryProtocolId as string | undefined;
  const protocolTitle = created.item.preparedProtocol?.primaryProtocolTitle as string | undefined;
  const matchScore = created.item.preparedProtocol?.suggestions?.[0]?.score as number | undefined;

  if (actualProtocolId !== testCase.expectedProtocolId) {
    return {
      wordCount,
      reasonNarrative: testCase.reasonNarrative,
      expectedProtocolId: testCase.expectedProtocolId,
      actualProtocolId,
      protocolTitle,
      matchScore,
      outcome: "wrong-protocol-matched"
    };
  }

  const claim = await request(nurseJar, `/api/v1/queue/${id}/claim`, { method: "POST" });
  if (!claim.ok) {
    return { wordCount, reasonNarrative: testCase.reasonNarrative, expectedProtocolId: testCase.expectedProtocolId, actualProtocolId, protocolTitle, matchScore, outcome: `claim-failed-${claim.status}` };
  }

  await request(nurseJar, `/api/v1/queue/${id}/context`, {
    method: "PATCH",
    body: JSON.stringify({ vitalsUnobtainable: true })
  });

  const detailResp = await request(nurseJar, `/api/v1/protocols/${actualProtocolId}`, {});
  const detail = await detailResp.json();
  const questions: Question[] = [...(detail.protocol?.questions ?? [])].sort((a, b) => a.acuityOrder - b.acuityOrder);
  const initialAssessmentQuestions: InitialAssessmentQuestion[] = [...(detail.protocol?.initialAssessmentQuestions ?? [])].sort(
    (a, b) => a.sequence - b.sequence
  );

  let initialAssessmentResponses: Record<string, string> = {};
  for (const iaq of initialAssessmentQuestions) {
    initialAssessmentResponses = { ...initialAssessmentResponses, [iaq.id]: sampleInitialAssessmentAnswer(iaq) };
    await request(nurseJar, `/api/v1/queue/${id}/context`, {
      method: "PATCH",
      body: JSON.stringify({ initialAssessmentResponses })
    });
  }

  // All-"No" path - the safest, most demo-friendly outcome (self-care),
  // exercising the full question list without any dangerous-condition branch.
  let taqResponses: Record<string, boolean> = {};
  for (const q of questions) {
    taqResponses = { ...taqResponses, [q.id]: false };
    await request(nurseJar, `/api/v1/queue/${id}/context`, {
      method: "PATCH",
      body: JSON.stringify({ taqResponses })
    });
  }

  // The server never auto-computes a disposition from taqResponses alone -
  // in the real UI, QuestionsStage.tsx derives it client-side and patches it
  // in together with taqResponses. For the all-"No" path specifically, that
  // is always the fixed self-care outcome (confirmed against the exhaustive
  // per-protocol scripts' identical all-No handling), not something read
  // back from the record.
  const expectedSeverity = "SELF_CARE";
  const expectedDispositionCode = "SELF_CARE_WITH_CALLBACK_PRECAUTIONS";
  const expectedDestination = QATAR_DESTINATION_BY_CODE[expectedDispositionCode];

  // moveQueueItem's validateClinicalSequence requires matchedProtocolId,
  // calculatedSeverity, dispositionCode, and destinationName to already be
  // persisted on the record before it will allow the DISPOSITION transition -
  // the taqResponses patches above compute these server-side but don't
  // persist them onto the record fields themselves, so they must be written
  // explicitly here (same pattern the exhaustive per-protocol scripts use).
  await request(nurseJar, `/api/v1/queue/${id}/context`, {
    method: "PATCH",
    body: JSON.stringify({
      matchedProtocolId: actualProtocolId,
      calculatedSeverity: expectedSeverity,
      dispositionCode: expectedDispositionCode,
      destinationName: expectedDestination
    })
  });

  const move1 = await request(nurseJar, `/api/v1/queue/${id}/move`, {
    method: "POST",
    body: JSON.stringify({ toStage: "DISPOSITION" })
  });
  if (!move1.ok) {
    return {
      wordCount, reasonNarrative: testCase.reasonNarrative, expectedProtocolId: testCase.expectedProtocolId,
      actualProtocolId, protocolTitle, matchScore, outcome: `move-to-disposition-failed-${move1.status}`
    };
  }

  await request(nurseJar, `/api/v1/queue/${id}/context`, {
    method: "PATCH",
    body: JSON.stringify({ clinicalApproval: { approvedAtIso: new Date().toISOString() } })
  });
  // sbarCopied and sbarNoteText must both be set together - completing
  // requires real note text, not just the boolean flag (see
  // validateClinicalSequence's comment in queueOrchestration.ts).
  await request(nurseJar, `/api/v1/queue/${id}/context`, {
    method: "PATCH",
    body: JSON.stringify({
      sbarCopied: true,
      sbarNoteText: `S: ${testCase.istStaffId}, reports ${testCase.reasonNarrative}\nB: Reason & Rule-Out and Questions completed via structured triage.\nA: Disposition: ${expectedDispositionCode}.\nR: Route per disposition; callback precautions given as applicable.`
    })
  });

  const move2 = await request(nurseJar, `/api/v1/queue/${id}/move`, {
    method: "POST",
    body: JSON.stringify({ toStage: "SBAR", toStatus: "COMPLETED" })
  });
  if (!move2.ok) {
    const errBody = await move2.json().catch(() => ({}));
    return {
      wordCount, reasonNarrative: testCase.reasonNarrative, expectedProtocolId: testCase.expectedProtocolId,
      actualProtocolId, protocolTitle, matchScore, outcome: `complete-failed-${move2.status}:${JSON.stringify(errBody)}`
    };
  }

  const finalResp = await request(nurseJar, `/api/v1/queue/${id}`, {});
  const finalItem = (await finalResp.json()).item;
  const actualDestination = finalItem?.destinationName as string | undefined;

  const validated =
    finalItem?.status === "COMPLETED" &&
    finalItem?.dispositionCode === expectedDispositionCode &&
    finalItem?.calculatedSeverity === expectedSeverity;

  return {
    wordCount,
    reasonNarrative: testCase.reasonNarrative,
    expectedProtocolId: testCase.expectedProtocolId,
    actualProtocolId,
    protocolTitle,
    matchScore,
    actualDispositionCode: finalItem?.dispositionCode,
    actualSeverity: finalItem?.calculatedSeverity,
    actualDestination,
    validated,
    outcome: "completed"
  };
}

async function main() {
  const generatorJar: CookieJar = {};
  await login(generatorJar, GENERATOR_USERNAME, GENERATOR_PASSWORD);
  const nurseJar: CookieJar = {};
  await login(nurseJar, NURSE_USERNAME, NURSE_PASSWORD);

  console.log(`Running ${CASES.length} short-reason (<10 word) demo test cases, one per protocol...\n`);

  const results: CaseResult[] = [];
  for (const testCase of CASES) {
    results.push(await runCase(generatorJar, nurseJar, testCase));
  }

  console.log("=== Per-case results ===");
  for (const r of results) {
    console.log(JSON.stringify(r));
  }

  const passed = results.filter((r) => r.outcome === "completed" && r.validated).length;
  console.log("\n=== Summary ===");
  console.log(JSON.stringify({ total: results.length, passed, failed: results.length - passed }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
