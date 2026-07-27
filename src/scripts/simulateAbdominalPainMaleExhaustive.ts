/**
 * Exhaustive live test run for the single licensed STCC protocol
 * (stcc-abdominal-pain-male, 30 TAQ questions) - generates one real call per
 * possible terminal outcome: a "Yes" landing at every question index 0..29,
 * plus the all-"No" self-care path, for 31 test cases total that cover every
 * disposition this protocol can produce.
 *
 * Each call is generated through the real shared generator (POST
 * /api/v1/queue/simulate, same as the Service Manager Board's "Generate
 * Calls" button) purely to obtain a real HRMS-validated staff record, then
 * the nurse explicitly selects this protocol via PATCH /context's
 * matchedProtocolId (the same nurse-guideline-override mechanism added to
 * ProtocolMatchPanel.tsx) - forcing every call onto this one protocol
 * regardless of what its own reason narrative happened to auto-match, so the
 * full 30-question decision tree is exercised deterministically rather than
 * relying on chance.
 *
 * After each call completes, its persisted dispositionCode/calculatedSeverity/
 * destinationName are independently re-checked against the same protocol
 * question's own data (fetched fresh) to confirm the backend recorded
 * exactly what that question defines.
 *
 * Usage: npx tsx src/scripts/simulateAbdominalPainMaleExhaustive.ts
 */

const API_BASE = process.env.API_BASE ?? "http://localhost:8080";
const GENERATOR_USERNAME = "intake@irisstar.tech";
const GENERATOR_PASSWORD = "Intake@2026";
const NURSE_USERNAME = "layla@irisstar.tech";
const NURSE_PASSWORD = "Layla@2026";
const PROTOCOL_ID = "stcc-abdominal-pain-male";

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

type CookieJar = { cookie?: string };
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
}

async function generateOneCall(jar: CookieJar): Promise<{ id: string } | undefined> {
  const r = await request(jar, "/api/v1/queue/simulate", { method: "POST" });
  if (!r.ok) return undefined;
  const body = await r.json();
  return { id: body.item.id as string };
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
  outcome: string;
};

async function processScenario(
  jar: CookieJar,
  id: string,
  questions: Question[],
  yesIndex: number
): Promise<CaseResult> {
  const scenario = yesIndex === -1 ? "all-No (self-care)" : `Yes at question ${yesIndex + 1} of ${questions.length}`;

  const claim = await request(jar, `/api/v1/queue/${id}/claim`, { method: "POST" });
  if (!claim.ok) return { id, scenario, yesIndex, outcome: `claim-failed-${claim.status}` };

  await request(jar, `/api/v1/queue/${id}/context`, {
    method: "PATCH",
    body: JSON.stringify({ vitalsUnobtainable: true })
  });

  // Force this call onto the one licensed STCC protocol via the nurse
  // guideline-override mechanism, regardless of what its own reason
  // narrative auto-matched to.
  const forcedMatch = await request(jar, `/api/v1/queue/${id}/context`, {
    method: "PATCH",
    body: JSON.stringify({ matchedProtocolId: PROTOCOL_ID })
  });
  if (!forcedMatch.ok) {
    return { id, scenario, yesIndex, outcome: `force-protocol-failed-${forcedMatch.status}` };
  }

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
  if (yesIndex === -1) {
    update = await request(jar, `/api/v1/queue/${id}/context`, {
      method: "PATCH",
      body: JSON.stringify({
        matchedProtocolId: PROTOCOL_ID,
        calculatedSeverity: "SELF_CARE",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        destinationName: QATAR_DESTINATION_BY_CODE.SELF_CARE_WITH_CALLBACK_PRECAUTIONS,
        taqResponses
      })
    });
  } else {
    const question = questions[yesIndex];
    taqResponses = { ...taqResponses, [question.id]: true };
    const expectedSeverity = SEVERITY_MAP[question.severity] ?? question.severity;
    const expectedDestination = QATAR_DESTINATION_BY_CODE[question.dispositionCode] ?? question.dispositionCode;
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

  await request(jar, `/api/v1/queue/${id}/context`, {
    method: "PATCH",
    body: JSON.stringify({ sbarCopied: true })
  });

  const move2 = await request(jar, `/api/v1/queue/${id}/move`, {
    method: "POST",
    body: JSON.stringify({ toStage: "SBAR", toStatus: "COMPLETED" })
  });
  if (!move2.ok) {
    const body = await move2.json().catch(() => ({}));
    return { id, scenario, yesIndex, outcome: `complete-failed-${move2.status}:${body.code ?? ""}` };
  }

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
    Object.keys(finalItem?.taqResponses ?? {}).length === (yesIndex === -1 ? questions.length : yesIndex + 1) &&
    Object.keys(finalItem?.initialAssessmentResponses ?? {}).length === initialAssessmentQuestions.length;

  return {
    id,
    scenario,
    yesIndex,
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
  console.log(`Protocol ${PROTOCOL_ID} has ${questions.length} TAQ questions - running ${questions.length + 1} exhaustive scenarios.`);

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
      results.push(await processScenario(nurseJar, generated.id, questions, yesIndex));
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
