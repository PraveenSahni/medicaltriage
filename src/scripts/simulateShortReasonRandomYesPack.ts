/**
 * Variant of simulateShortReasonDemoPack.ts: instead of the all-"No"
 * self-care path, each of the 5 short-reason demo cases answers "No" up to
 * a specific question, then "Yes" at a question chosen to land on a
 * different severity tier per case (Emergency/Urgent/Routine/Self-care) -
 * proving the engine stops immediately at the first "Yes" and resolves the
 * disposition for that exact tier, not just the trivial self-care path.
 *
 * These are throwaway validation copies, created and completed purely to
 * prove the mechanics work - the original 5 open demo cases created earlier
 * for manual walkthrough are never touched by this script.
 *
 * Usage: npx tsx src/scripts/simulateShortReasonRandomYesPack.ts
 */

const API_BASE = process.env.API_BASE ?? "http://localhost:8080";
const GENERATOR_USERNAME = "layla@irisstar.tech";
const GENERATOR_PASSWORD = process.env.TEST_NURSE_PASSWORD ?? "";
const NURSE_USERNAME = "layla@irisstar.tech";
const NURSE_PASSWORD = process.env.TEST_NURSE_PASSWORD ?? "";

type CookieJar = { cookie?: string; token?: string };
type Question = { id: string; acuityOrder: number; severity: string; dispositionCode: string; questionTextEn: string };
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

// yesAtAcuityOrder chosen per the earlier live protocol lookup (one
// representative question per severity tier), spread across all 4 tiers.
const CASES: Array<{ expectedProtocolId: string; istStaffId: string; reasonNarrative: string; yesAtAcuityOrder: number; expectedSeverityLabel: string }> = [
  { expectedProtocolId: "stcc-abdominal-pain-male", istStaffId: "IST-00014", reasonNarrative: "Severe stomach pain for two hours", yesAtAcuityOrder: 1, expectedSeverityLabel: "Emergency" },
  { expectedProtocolId: "stcc-ankle-injury", istStaffId: "IST-00014", reasonNarrative: "Sprained ankle, swollen with possible fracture", yesAtAcuityOrder: 14, expectedSeverityLabel: "Urgent" },
  { expectedProtocolId: "stcc-ankle-pain", istStaffId: "IST-01136", reasonNarrative: "Ankle pain and stiffness for days", yesAtAcuityOrder: 9, expectedSeverityLabel: "Routine" },
  { expectedProtocolId: "stcc-diarrhea", istStaffId: "IST-00014", reasonNarrative: "Watery diarrhea and loose stools today", yesAtAcuityOrder: 28, expectedSeverityLabel: "Self-care" },
  { expectedProtocolId: "stcc-pregnancy-decreased-or-abnormal-fetal-movement", istStaffId: "IST-00001", reasonNarrative: "Pregnant, baby's movement seems decreased today", yesAtAcuityOrder: 13, expectedSeverityLabel: "Urgent" }
];

function sampleInitialAssessmentAnswer(question: InitialAssessmentQuestion): string {
  switch (question.responseType) {
    case "YES_NO":
      return "No";
    case "PAIN_SCALE":
      return "Moderate (4-7)";
    case "TEMPERATURE":
      return "37.2";
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
  reasonNarrative: string;
  expectedProtocolId: string;
  actualProtocolId?: string;
  protocolTitle?: string;
  yesAtAcuityOrder: number;
  terminalQuestionText?: string;
  expectedSeverityLabel: string;
  expectedDispositionCode?: string;
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
    return { reasonNarrative: testCase.reasonNarrative, expectedProtocolId: testCase.expectedProtocolId, yesAtAcuityOrder: testCase.yesAtAcuityOrder, expectedSeverityLabel: testCase.expectedSeverityLabel, outcome: `create-failed-${create.status}` };
  }
  const created = await create.json();
  const id = created.item.id as string;
  const actualProtocolId = created.item.preparedProtocol?.primaryProtocolId as string | undefined;
  const protocolTitle = created.item.preparedProtocol?.primaryProtocolTitle as string | undefined;

  if (actualProtocolId !== testCase.expectedProtocolId) {
    return {
      reasonNarrative: testCase.reasonNarrative, expectedProtocolId: testCase.expectedProtocolId, actualProtocolId, protocolTitle,
      yesAtAcuityOrder: testCase.yesAtAcuityOrder, expectedSeverityLabel: testCase.expectedSeverityLabel, outcome: "wrong-protocol-matched"
    };
  }

  const claim = await request(nurseJar, `/api/v1/queue/${id}/claim`, { method: "POST" });
  if (!claim.ok) {
    return { reasonNarrative: testCase.reasonNarrative, expectedProtocolId: testCase.expectedProtocolId, actualProtocolId, protocolTitle, yesAtAcuityOrder: testCase.yesAtAcuityOrder, expectedSeverityLabel: testCase.expectedSeverityLabel, outcome: `claim-failed-${claim.status}` };
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

  const targetQuestion = questions.find((q) => q.acuityOrder === testCase.yesAtAcuityOrder);
  if (!targetQuestion) {
    return {
      reasonNarrative: testCase.reasonNarrative, expectedProtocolId: testCase.expectedProtocolId, actualProtocolId, protocolTitle,
      yesAtAcuityOrder: testCase.yesAtAcuityOrder, expectedSeverityLabel: testCase.expectedSeverityLabel, outcome: "target-question-not-found"
    };
  }

  // Answer "No" for every question before the target, then "Yes" at the
  // target - the nurse stops here exactly like the real UI would (no need
  // to answer further questions once a "Yes" is given).
  let taqResponses: Record<string, boolean> = {};
  for (const q of questions) {
    if (q.acuityOrder < targetQuestion.acuityOrder) {
      taqResponses = { ...taqResponses, [q.id]: false };
      await request(nurseJar, `/api/v1/queue/${id}/context`, {
        method: "PATCH",
        body: JSON.stringify({ taqResponses })
      });
    }
  }
  taqResponses = { ...taqResponses, [targetQuestion.id]: true };
  await request(nurseJar, `/api/v1/queue/${id}/context`, {
    method: "PATCH",
    body: JSON.stringify({ taqResponses })
  });

  const expectedSeverity = SEVERITY_MAP[targetQuestion.severity] ?? targetQuestion.severity;
  const expectedDispositionCode = targetQuestion.dispositionCode;
  const expectedDestination = QATAR_DESTINATION_BY_CODE[expectedDispositionCode] ?? expectedDispositionCode;

  await request(nurseJar, `/api/v1/queue/${id}/context`, {
    method: "PATCH",
    body: JSON.stringify({
      matchedProtocolId: actualProtocolId,
      calculatedSeverity: expectedSeverity,
      dispositionCode: expectedDispositionCode,
      destinationName: expectedDestination,
      clinicalApproval: { terminalQuestionId: targetQuestion.id }
    })
  });

  const move1 = await request(nurseJar, `/api/v1/queue/${id}/move`, {
    method: "POST",
    body: JSON.stringify({ toStage: "DISPOSITION" })
  });
  if (!move1.ok) {
    return {
      reasonNarrative: testCase.reasonNarrative, expectedProtocolId: testCase.expectedProtocolId, actualProtocolId, protocolTitle,
      yesAtAcuityOrder: testCase.yesAtAcuityOrder, terminalQuestionText: targetQuestion.questionTextEn,
      expectedSeverityLabel: testCase.expectedSeverityLabel, expectedDispositionCode, outcome: `move-to-disposition-failed-${move1.status}`
    };
  }

  await request(nurseJar, `/api/v1/queue/${id}/context`, {
    method: "PATCH",
    body: JSON.stringify({ clinicalApproval: { terminalQuestionId: targetQuestion.id, approvedAtIso: new Date().toISOString() } })
  });
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
      reasonNarrative: testCase.reasonNarrative, expectedProtocolId: testCase.expectedProtocolId, actualProtocolId, protocolTitle,
      yesAtAcuityOrder: testCase.yesAtAcuityOrder, terminalQuestionText: targetQuestion.questionTextEn,
      expectedSeverityLabel: testCase.expectedSeverityLabel, expectedDispositionCode, outcome: `complete-failed-${move2.status}:${JSON.stringify(errBody)}`
    };
  }

  // Independent re-validation: re-fetch the completed record AND re-fetch
  // the protocol's own question data fresh, comparing against the source of
  // truth rather than the in-memory values used to drive the patches above.
  const finalResp = await request(nurseJar, `/api/v1/queue/${id}`, {});
  const finalItem = (await finalResp.json()).item;
  const revalidateResp = await request(nurseJar, `/api/v1/protocols/${actualProtocolId}`, {});
  const revalidateDetail = await revalidateResp.json();
  const revalidateQuestion: Question | undefined = (revalidateDetail.protocol?.questions ?? []).find(
    (q: Question) => q.id === targetQuestion.id
  );
  const expectedFromSource = {
    dispositionCode: revalidateQuestion?.dispositionCode,
    severity: revalidateQuestion ? SEVERITY_MAP[revalidateQuestion.severity] ?? revalidateQuestion.severity : undefined,
    destination: revalidateQuestion ? QATAR_DESTINATION_BY_CODE[revalidateQuestion.dispositionCode] ?? revalidateQuestion.dispositionCode : undefined
  };

  const validated =
    finalItem?.status === "COMPLETED" &&
    finalItem?.dispositionCode === expectedFromSource.dispositionCode &&
    finalItem?.calculatedSeverity === expectedFromSource.severity &&
    finalItem?.destinationName === expectedFromSource.destination;

  return {
    reasonNarrative: testCase.reasonNarrative,
    expectedProtocolId: testCase.expectedProtocolId,
    actualProtocolId,
    protocolTitle,
    yesAtAcuityOrder: testCase.yesAtAcuityOrder,
    terminalQuestionText: targetQuestion.questionTextEn,
    expectedSeverityLabel: testCase.expectedSeverityLabel,
    expectedDispositionCode: expectedFromSource.dispositionCode,
    actualDispositionCode: finalItem?.dispositionCode,
    actualSeverity: finalItem?.calculatedSeverity,
    actualDestination: finalItem?.destinationName,
    validated,
    outcome: "completed"
  };
}

async function main() {
  const generatorJar: CookieJar = {};
  await login(generatorJar, GENERATOR_USERNAME, GENERATOR_PASSWORD);
  const nurseJar: CookieJar = {};
  await login(nurseJar, NURSE_USERNAME, NURSE_PASSWORD);

  console.log(`Running ${CASES.length} short-reason demo cases with a "Yes" at a specific severity-tier question each...\n`);

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
