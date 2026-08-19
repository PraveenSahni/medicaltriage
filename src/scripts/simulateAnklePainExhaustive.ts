/**
 * Exhaustive live test run for the licensed STCC protocol stcc-ankle-pain
 * (17 TAQ questions) - generates one real call per possible terminal
 * outcome: a "Yes" landing at every question index 0..16, plus the all-"No"
 * self-care path, for 18 test cases total that cover every disposition this
 * protocol can produce.
 *
 * Ankle Pain vs. Ankle Injury (stcc-ankle-injury, tested in parallel by
 * simulateAnkleInjuryExhaustive.ts) are real, confirmed vendor content that
 * overlaps heavily on shared keywords ("ankle", "achilles tendon", etc.) -
 * the vendor's own clinical definitions are the actual differentiator:
 * Ankle Pain is explicitly "Not due to a traumatic injury" (overuse/gradual
 * onset - tendonitis/arthritis), while Ankle Injury is explicitly for
 * traumatic mechanisms (sprain/fracture/twist). An earlier candidate
 * narrative that said "no injury" ironically scored HIGHER for
 * stcc-ankle-injury, because "injury" is itself one of that protocol's
 * weighted keywords - naive keyword matching doesn't understand negation.
 * The reason narrative below avoids that word entirely and was verified
 * live (via searchClinicalProtocols) to decisively auto-match this protocol
 * (score 512) over stcc-ankle-injury (score 146) - no nurse
 * guideline-override is used, matching the same no-override principle
 * established for simulateAbdominalPainMaleExhaustive.ts. If a scenario's
 * auto-match doesn't resolve to this protocol, that's reported as a real
 * failure, not silently overridden.
 *
 * After each call completes, its persisted dispositionCode/calculatedSeverity/
 * destinationName are independently re-checked against the same protocol
 * question's own data (fetched fresh) to confirm the backend recorded
 * exactly what that question defines.
 *
 * Usage: npx tsx src/scripts/simulateAnklePainExhaustive.ts
 */

const API_BASE = process.env.API_BASE ?? "http://localhost:8080";
const GENERATOR_USERNAME = "layla@irisstar.tech";
const GENERATOR_PASSWORD = process.env.TEST_NURSE_PASSWORD ?? "";
const NURSE_USERNAME = "sara@irisstar.tech";
const NURSE_PASSWORD = process.env.TEST_SECONDARY_NURSE_PASSWORD ?? "";
const PROTOCOL_ID = "stcc-ankle-pain";

// A real male IST staff member (confirmed via HRMS: biologicalSex "male",
// age 49 - within this protocol's real 18-120 age range) - reused across all
// scenarios since the protocol match must hold for the same employee/reason
// regardless of which TAQ question later resolves Yes. Deliberately a
// different staff member than simulateAnkleInjuryExhaustive.ts uses, so the
// two scripts can run concurrently without tripping the app's one-active-
// encounter-per-employee safety rule.
const CANDIDATE_IST_STAFF_ID = "IST-01136";
// Confirmed via live testing (searchClinicalProtocols) to score decisively
// higher for stcc-ankle-pain (512) than stcc-ankle-injury (146) - genuine
// non-traumatic/overuse wording (achy, arthritis-like, nothing happened to
// cause it), deliberately avoiding the word "injury" itself (see comment
// above).
const REASON_NARRATIVE =
  "Ankle pain and stiffness in the joint for several days, feels like arthritis flaring up, nothing happened to cause it.";

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

// Cookie-based auth alone does not work against the custom domain
// (triaged.irisstar.tech) - Firebase Hosting's rewrite-to-Cloud-Run proxy
// does not forward the Cookie request header (see authToken.ts /
// helpRouter.ts for the same root cause fixed for the Help page). The
// bearer token is attached too, so this script works against the custom
// domain, the direct Cloud Run URL, or localhost interchangeably.
type CookieJar = { cookie?: string; token?: string };
type Question = { id: string; acuityOrder: number; severity: string; dispositionCode: string; questionTextEn: string };
type InitialAssessmentQuestion = {
  id: string;
  sequence: number;
  responseType: "LOCATION" | "DURATION" | "YES_NO" | "TEMPERATURE" | "PAIN_SCALE" | "OPEN_TEXT";
  promptTextEn: string;
};

function sampleInitialAssessmentAnswer(question: InitialAssessmentQuestion): string {
  switch (question.responseType) {
    case "YES_NO":
      return "No";
    case "PAIN_SCALE":
      return "Moderate (4-7)";
    case "TEMPERATURE":
      return "37.2";
    case "DURATION":
      return "Since yesterday";
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

async function generateOneCall(
  jar: CookieJar
): Promise<{ id: string; istStaffId: string; preparedProtocolId?: string } | undefined> {
  const r = await request(jar, "/api/v1/queue", {
    method: "POST",
    body: JSON.stringify({
      istStaffId: CANDIDATE_IST_STAFF_ID,
      patientType: "Staff",
      channel: "Phone",
      stationCode: "DOH",
      summary: REASON_NARRATIVE,
      reasonNarrative: REASON_NARRATIVE,
      safetyFloorActive: false,
      slaMinutes: 20
    })
  });
  if (!r.ok) return undefined;
  const body = await r.json();
  return {
    id: body.item.id as string,
    istStaffId: body.item.istStaffId as string,
    preparedProtocolId: body.item.preparedProtocol?.primaryProtocolId as string | undefined
  };
}

type CaseResult = {
  id: string;
  scenario: string;
  yesIndex: number;
  terminalQuestionText?: string;
  expectedDispositionCode?: string;
  expectedSeverity?: string;
  expectedDestination?: string;
  actualDispositionCode?: string;
  actualSeverity?: string;
  actualDestination?: string;
  validated?: boolean;
  sbarAligned?: boolean;
  careAdviceCount?: number;
  supplementalCount?: number;
  outcome: string;
};

async function processScenario(
  jar: CookieJar,
  id: string,
  istStaffId: string,
  preparedProtocolId: string | undefined,
  questions: Question[],
  yesIndex: number,
  supplementalCount: number
): Promise<CaseResult> {
  const scenario = yesIndex === -1 ? "all-No (self-care)" : `Yes at question ${yesIndex + 1} of ${questions.length}`;

  // The real auto-match (keyword search against the genuine reason
  // narrative) must resolve to this protocol on its own - no override. A
  // caller only ever reaches this protocol's TAQ list because their actual
  // complaint matched it, so a test that forces the match while using an
  // unrelated reason would validate a scenario that could never happen for
  // a real patient.
  if (preparedProtocolId !== PROTOCOL_ID) {
    return { id, scenario, yesIndex, outcome: `auto-match-failed:got-${preparedProtocolId ?? "NO_MATCH"}` };
  }

  const claim = await request(jar, `/api/v1/queue/${id}/claim`, { method: "POST" });
  if (!claim.ok) return { id, scenario, yesIndex, outcome: `claim-failed-${claim.status}` };

  await request(jar, `/api/v1/queue/${id}/context`, {
    method: "PATCH",
    body: JSON.stringify({ vitalsUnobtainable: true })
  });

  const iaqResp = await request(jar, `/api/v1/protocols/${PROTOCOL_ID}`, {});
  const iaqDetail = await iaqResp.json();
  const initialAssessmentQuestions: InitialAssessmentQuestion[] = [...(iaqDetail.protocol?.initialAssessmentQuestions ?? [])].sort(
    (a, b) => a.sequence - b.sequence
  );
  let initialAssessmentResponses: Record<string, string> = {};
  for (const iaq of initialAssessmentQuestions) {
    initialAssessmentResponses = { ...initialAssessmentResponses, [iaq.id]: sampleInitialAssessmentAnswer(iaq) };
    await request(jar, `/api/v1/queue/${id}/context`, {
      method: "PATCH",
      body: JSON.stringify({ initialAssessmentResponses })
    });
  }

  let taqResponses: Record<string, boolean> = {};
  for (let i = 0; i < (yesIndex === -1 ? questions.length : yesIndex); i++) {
    taqResponses = { ...taqResponses, [questions[i].id]: false };
    await request(jar, `/api/v1/queue/${id}/context`, {
      method: "PATCH",
      body: JSON.stringify({ taqResponses })
    });
  }

  let update: Response;
  let expectedDispositionCode: string;
  let expectedSeverity: string;
  let expectedDestination: string;
  if (yesIndex === -1) {
    expectedSeverity = "SELF_CARE";
    expectedDispositionCode = "SELF_CARE_WITH_CALLBACK_PRECAUTIONS";
    expectedDestination = QATAR_DESTINATION_BY_CODE.SELF_CARE_WITH_CALLBACK_PRECAUTIONS;
    update = await request(jar, `/api/v1/queue/${id}/context`, {
      method: "PATCH",
      body: JSON.stringify({
        matchedProtocolId: PROTOCOL_ID,
        calculatedSeverity: expectedSeverity,
        dispositionCode: expectedDispositionCode,
        destinationName: expectedDestination,
        taqResponses
      })
    });
  } else {
    const question = questions[yesIndex];
    taqResponses = { ...taqResponses, [question.id]: true };
    expectedSeverity = SEVERITY_MAP[question.severity] ?? question.severity;
    expectedDispositionCode = question.dispositionCode;
    expectedDestination = QATAR_DESTINATION_BY_CODE[question.dispositionCode] ?? question.dispositionCode;
    update = await request(jar, `/api/v1/queue/${id}/context`, {
      method: "PATCH",
      body: JSON.stringify({
        matchedProtocolId: PROTOCOL_ID,
        calculatedSeverity: expectedSeverity,
        dispositionCode: question.dispositionCode,
        destinationName: expectedDestination,
        clinicalApproval: { terminalQuestionId: question.id },
        taqResponses
      })
    });
  }
  if (!update.ok) {
    const body = await update.json().catch(() => ({}));
    return { id, scenario, yesIndex, outcome: `context-update-failed-${update.status}:${body.code ?? ""}` };
  }

  const move1 = await request(jar, `/api/v1/queue/${id}/move`, {
    method: "POST",
    body: JSON.stringify({ toStage: "DISPOSITION" })
  });
  if (!move1.ok) {
    const body = await move1.json().catch(() => ({}));
    await request(jar, `/api/v1/queue/${id}/release`, { method: "POST" });
    return { id, scenario, yesIndex, outcome: `move-to-disposition-failed-${move1.status}:${body.code ?? ""}` };
  }

  await request(jar, `/api/v1/queue/${id}/context`, {
    method: "PATCH",
    body: JSON.stringify({
      clinicalApproval: {
        terminalQuestionId: yesIndex === -1 ? undefined : questions[yesIndex].id,
        approvedAtIso: new Date().toISOString()
      }
    })
  });

  // Real completion path: actually generate the SBAR note AND fit-to-fly
  // recommendation via the same /triage/complete endpoint the
  // CompletionStage.tsx "Copy SBAR" button calls, not just flip the
  // sbarCopied flag - the completion gate now requires a real persisted
  // sbarNoteText (queueOrchestration.ts fix), and a scenario is not "perfect
  // case history" unless the compiled note actually reflects this scenario's
  // own reason/disposition/destination, with fitToFlyStatus persisted the
  // same way the real UI does.
  const sbarResp = await request(jar, "/api/v1/triage/complete", {
    method: "POST",
    body: JSON.stringify({
      ist_staff_id: istStaffId,
      chief_complaint: REASON_NARRATIVE,
      final_disposition_code: expectedDispositionCode,
      routing_destination: expectedDestination
    })
  });
  let sbarNoteText: string | undefined;
  let sbarAligned = false;
  let fitToFlyStatus: string | undefined;
  if (sbarResp.ok) {
    const sbarBody = await sbarResp.json().catch(() => undefined);
    sbarNoteText = sbarBody?.notePayload as string | undefined;
    fitToFlyStatus = sbarBody?.fitToFlyStatus as string | undefined;
    sbarAligned = Boolean(
      sbarNoteText && sbarNoteText.includes(expectedDispositionCode) && sbarNoteText.includes(expectedDestination)
    );
  }

  await request(jar, `/api/v1/queue/${id}/context`, {
    method: "PATCH",
    body: JSON.stringify({
      sbarCopied: true,
      ...(sbarNoteText ? { sbarNoteText } : {}),
      ...(fitToFlyStatus ? { fitToFlyStatus } : {})
    })
  });

  const move2 = await request(jar, `/api/v1/queue/${id}/move`, {
    method: "POST",
    body: JSON.stringify({ toStage: "SBAR", toStatus: "COMPLETED" })
  });
  if (!move2.ok) {
    const body = await move2.json().catch(() => ({}));
    return { id, scenario, yesIndex, outcome: `complete-failed-${move2.status}:${body.code ?? ""}` };
  }

  // Care advice presence - part of "case history is perfect and visible on
  // frontend" (DispositionStage.tsx renders this from the same endpoint).
  const careAdviceCount = yesIndex === -1
    ? 0
    : ((await (await request(
        jar,
        `/api/v1/protocols/${PROTOCOL_ID}/care-advice?positiveQuestionIds=${encodeURIComponent(questions[yesIndex].id)}`,
        {}
      )).json().catch(() => ({ careAdvice: [] }))).careAdvice ?? []).length;

  const finalResp = await request(jar, `/api/v1/queue/${id}`, {});
  const finalItem = (await finalResp.json()).item;
  const revalidateResp = await request(jar, `/api/v1/protocols/${PROTOCOL_ID}`, {});
  const revalidateDetail = await revalidateResp.json();
  const revalidateQuestion: Question | undefined =
    yesIndex === -1
      ? undefined
      : (revalidateDetail.protocol?.questions ?? []).find((q: Question) => q.id === questions[yesIndex].id);

  const expectedFromSource =
    yesIndex === -1
      ? {
          dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
          severity: "SELF_CARE",
          destination: QATAR_DESTINATION_BY_CODE.SELF_CARE_WITH_CALLBACK_PRECAUTIONS
        }
      : {
          dispositionCode: revalidateQuestion?.dispositionCode,
          severity: revalidateQuestion ? SEVERITY_MAP[revalidateQuestion.severity] ?? revalidateQuestion.severity : undefined,
          destination: revalidateQuestion
            ? QATAR_DESTINATION_BY_CODE[revalidateQuestion.dispositionCode] ?? revalidateQuestion.dispositionCode
            : undefined
        };

  const validated =
    finalItem?.matchedProtocolId === PROTOCOL_ID &&
    finalItem?.dispositionCode === expectedFromSource.dispositionCode &&
    finalItem?.calculatedSeverity === expectedFromSource.severity &&
    finalItem?.destinationName === expectedFromSource.destination &&
    finalItem?.status === "COMPLETED" &&
    Boolean(finalItem?.sbarNoteText) &&
    sbarAligned &&
    Object.keys(finalItem?.taqResponses ?? {}).length === (yesIndex === -1 ? questions.length : yesIndex + 1) &&
    Object.keys(finalItem?.initialAssessmentResponses ?? {}).length === initialAssessmentQuestions.length;

  return {
    id,
    scenario,
    yesIndex,
    sbarAligned,
    careAdviceCount,
    supplementalCount,
    terminalQuestionText: yesIndex === -1 ? undefined : questions[yesIndex].questionTextEn,
    expectedDispositionCode: expectedFromSource.dispositionCode,
    expectedSeverity: expectedFromSource.severity,
    expectedDestination: expectedFromSource.destination,
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

  const detailResp = await request(nurseJar, `/api/v1/protocols/${PROTOCOL_ID}`, {});
  const detail = await detailResp.json();
  const questions: Question[] = [...(detail.protocol?.questions ?? [])].sort((a: Question, b: Question) => a.acuityOrder - b.acuityOrder);
  const supplementalCount: number = (detail.protocol?.supplementals ?? []).length;
  console.log(
    `Protocol ${PROTOCOL_ID} has ${questions.length} TAQ questions and ${supplementalCount} supplementals - running ${questions.length + 1} exhaustive scenarios.`
  );

  // Every possible terminal outcome: Yes at each question index 0..N-1, plus
  // the all-No self-care path (-1).
  const scenarios: number[] = [...questions.map((_, index) => index), -1];

  const results: CaseResult[] = [];
  for (const yesIndex of scenarios) {
    const generated = await generateOneCall(generatorJar);
    if (!generated) {
      results.push({ id: "unknown", scenario: `yesIndex=${yesIndex}`, yesIndex, outcome: "generate-failed" });
      continue;
    }
    try {
      results.push(
        await processScenario(
          nurseJar,
          generated.id,
          generated.istStaffId,
          generated.preparedProtocolId,
          questions,
          yesIndex,
          supplementalCount
        )
      );
    } catch (error) {
      results.push({
        id: generated.id,
        scenario: `yesIndex=${yesIndex}`,
        yesIndex,
        outcome: `exception:${error instanceof Error ? error.message : String(error)}`
      });
      await request(nurseJar, `/api/v1/queue/${generated.id}/release`, { method: "POST" }).catch(() => {});
    }
  }

  console.log("\n=== Per-scenario results ===");
  for (const r of results) {
    console.log(
      JSON.stringify(
        {
          id: r.id,
          scenario: r.scenario,
          terminalQuestion: r.terminalQuestionText,
          dispositionCode: r.actualDispositionCode,
          severity: r.actualSeverity,
          destination: r.actualDestination,
          validated: r.validated,
          outcome: r.outcome
        },
        null,
        0
      )
    );
  }

  const completed = results.filter((r) => r.outcome === "completed");
  const validated = completed.filter((r) => r.validated);
  console.log("\n=== Summary ===");
  console.log(
    JSON.stringify(
      {
        totalScenarios: scenarios.length,
        completed: completed.length,
        validated: validated.length,
        failedValidation: completed.length - validated.length,
        failures: results.filter((r) => r.outcome !== "completed").map((r) => ({ id: r.id, scenario: r.scenario, outcome: r.outcome }))
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error("Exhaustive simulation run failed", error);
  process.exitCode = 1;
});
