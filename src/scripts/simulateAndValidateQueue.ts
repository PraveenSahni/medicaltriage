/**
 * End-to-end simulation run: generates N synthetic queue calls through the
 * real shared generator (POST /api/v1/queue/simulate, same code path as the
 * Service Manager Board's "Generate Calls" button), then drives each one
 * through the exact same sequence the Nurse Cockpit's buttons trigger -
 * claim -> vitals-unobtainable -> TAQ questions (Yes/No, answered against the
 * real protocol's own question list, with the "Yes" landing at a randomly
 * chosen question index per call, not always the first or last) ->
 * disposition -> SBAR copy -> complete - hitting the real HTTP API directly
 * (same approach as bulkProcessQueue.ts, for the same reason: no 30s
 * browser-tool timeout risk, identical backend calls/validation/safety-kernel
 * logic to a real click-through).
 *
 * After each call completes, its persisted dispositionCode/calculatedSeverity/
 * destinationName are independently re-checked against the same protocol
 * question's own data (fetched fresh from GET /api/v1/protocols/:id) to
 * confirm the backend recorded exactly what that question defines - not just
 * that the API calls returned 200.
 *
 * Usage: npx tsx src/scripts/simulateAndValidateQueue.ts [count]
 */

const API_BASE = process.env.API_BASE ?? "http://localhost:8080";
// Must be PHCC-org-scoped to match the nurse claiming these calls below -
// intake@irisstar.tech is PHCC-scoped (organizationOverrideByUserId,
// securityAdmin.ts), same as layla@irisstar.tech; khalid@ (HMC-scoped)
// would generate cross-org calls the nurse can never claim, per real
// multi-tenant RBAC boundaries (confirmed earlier this session).
const GENERATOR_USERNAME = "intake@irisstar.tech";
const GENERATOR_PASSWORD = "Intake@2026";
const NURSE_USERNAME = "layla@irisstar.tech";
const NURSE_PASSWORD = "Layla@2026";

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
type Question = { id: string; acuityOrder: number; severity: string; dispositionCode: string };
type InitialAssessmentQuestion = {
  id: string;
  sequence: number;
  responseType: "LOCATION" | "DURATION" | "YES_NO" | "TEMPERATURE" | "PAIN_SCALE" | "OPEN_TEXT";
  promptTextEn: string;
};

// A plausible answer per response type, matching the real widget choices a
// nurse would pick in InitialAssessmentQuestions.tsx - not fabricated
// clinical findings, just deterministic representative values so every
// initial assessment question in the protocol has a recorded answer.
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

type RunResult = {
  id: string;
  protocolId?: string;
  protocolTitle?: string;
  questionCount?: number;
  yesIndex?: number;
  expectedDispositionCode?: string;
  expectedSeverity?: string;
  expectedDestination?: string;
  actualDispositionCode?: string;
  actualSeverity?: string;
  actualDestination?: string;
  validated?: boolean;
  outcome: string;
};

async function processCall(jar: CookieJar, id: string): Promise<RunResult> {
  const claim = await request(jar, `/api/v1/queue/${id}/claim`, { method: "POST" });
  if (!claim.ok) return { id, outcome: `claim-failed-${claim.status}` };

  await request(jar, `/api/v1/queue/${id}/context`, {
    method: "PATCH",
    body: JSON.stringify({ vitalsUnobtainable: true })
  });

  const itemResp = await request(jar, `/api/v1/queue/${id}`, {});
  const item = (await itemResp.json()).item;
  const protocolId = item?.preparedProtocol?.primaryProtocolId as string | undefined;
  const protocolTitle = item?.preparedProtocol?.primaryProtocolTitle as string | undefined;
  if (!protocolId) {
    await request(jar, `/api/v1/queue/${id}/release`, { method: "POST" });
    return { id, outcome: "no-protocol-matched" };
  }

  const detailResp = await request(jar, `/api/v1/protocols/${protocolId}`, {});
  const detail = await detailResp.json();
  const questions: Question[] = [...(detail.protocol?.questions ?? [])].sort(
    (a, b) => a.acuityOrder - b.acuityOrder
  );
  if (questions.length === 0) {
    await request(jar, `/api/v1/queue/${id}/release`, { method: "POST" });
    return { id, outcome: "no-questions", protocolId, protocolTitle };
  }

  // Record an answer for every Initial Assessment Question the protocol
  // defines, matching what InitialAssessmentQuestions.tsx persists in the
  // real UI (one PATCH per question, building up the same accumulated map).
  const initialAssessmentQuestions: InitialAssessmentQuestion[] = [...(detail.protocol?.initialAssessmentQuestions ?? [])].sort(
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

  // Randomly chosen "Yes" position across the protocol's real question list -
  // not always first or last - so the 10-record run exercises a spread of
  // acuity levels, matching how a real caller could answer "Yes" at any point.
  const yesIndex = Math.floor(Math.random() * questions.length);
  const question = questions[yesIndex];

  const expectedSeverity = SEVERITY_MAP[question.severity] ?? question.severity;
  const expectedDestination = QATAR_DESTINATION_BY_CODE[question.dispositionCode] ?? question.dispositionCode;

  // Record every TAQ answer up to and including the terminal one - "No" for
  // each question skipped over, matching exactly what QuestionsStage.tsx
  // persists via taqResponses in the real Cockpit UI, not just the single
  // terminal question id.
  let taqResponses: Record<string, boolean> = {};
  for (let i = 0; i < yesIndex; i++) {
    taqResponses = { ...taqResponses, [questions[i].id]: false };
    await request(jar, `/api/v1/queue/${id}/context`, {
      method: "PATCH",
      body: JSON.stringify({ taqResponses })
    });
  }
  taqResponses = { ...taqResponses, [question.id]: true };

  const update = await request(jar, `/api/v1/queue/${id}/context`, {
    method: "PATCH",
    body: JSON.stringify({
      matchedProtocolId: protocolId,
      calculatedSeverity: expectedSeverity,
      dispositionCode: question.dispositionCode,
      destinationName: expectedDestination,
      clinicalApproval: { terminalQuestionId: question.id },
      taqResponses
    })
  });
  if (!update.ok) {
    return {
      id,
      outcome: `context-update-failed-${update.status}`,
      protocolId,
      protocolTitle,
      questionCount: questions.length,
      yesIndex
    };
  }

  const move1 = await request(jar, `/api/v1/queue/${id}/move`, {
    method: "POST",
    body: JSON.stringify({ toStage: "DISPOSITION" })
  });
  if (!move1.ok) {
    const body = await move1.json().catch(() => ({}));
    await request(jar, `/api/v1/queue/${id}/release`, { method: "POST" });
    return {
      id,
      outcome: `move-to-disposition-failed-${move1.status}:${body.code ?? ""}`,
      protocolId,
      protocolTitle,
      questionCount: questions.length,
      yesIndex
    };
  }

  await request(jar, `/api/v1/queue/${id}/context`, {
    method: "PATCH",
    body: JSON.stringify({ clinicalApproval: { terminalQuestionId: question.id, approvedAtIso: new Date().toISOString() } })
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
    return {
      id,
      outcome: `complete-failed-${move2.status}:${body.code ?? ""}`,
      protocolId,
      protocolTitle,
      questionCount: questions.length,
      yesIndex
    };
  }

  // Independent post-completion validation: re-fetch the completed queue item
  // and re-fetch the protocol's own question data fresh (not reusing the
  // in-memory `question` object above), then compare.
  const finalResp = await request(jar, `/api/v1/queue/${id}`, {});
  const finalItem = (await finalResp.json()).item;
  const revalidateResp = await request(jar, `/api/v1/protocols/${protocolId}`, {});
  const revalidateDetail = await revalidateResp.json();
  const revalidateQuestion: Question | undefined = (revalidateDetail.protocol?.questions ?? []).find(
    (q: Question) => q.id === question.id
  );

  const expectedFromSource = {
    dispositionCode: revalidateQuestion?.dispositionCode,
    severity: revalidateQuestion ? SEVERITY_MAP[revalidateQuestion.severity] ?? revalidateQuestion.severity : undefined,
    destination: revalidateQuestion
      ? QATAR_DESTINATION_BY_CODE[revalidateQuestion.dispositionCode] ?? revalidateQuestion.dispositionCode
      : undefined
  };

  const validated =
    finalItem?.dispositionCode === expectedFromSource.dispositionCode &&
    finalItem?.calculatedSeverity === expectedFromSource.severity &&
    finalItem?.destinationName === expectedFromSource.destination &&
    finalItem?.status === "COMPLETED";

  return {
    id,
    outcome: "completed",
    protocolId,
    protocolTitle,
    questionCount: questions.length,
    yesIndex,
    expectedDispositionCode: expectedFromSource.dispositionCode,
    expectedSeverity: expectedFromSource.severity,
    expectedDestination: expectedFromSource.destination,
    actualDispositionCode: finalItem?.dispositionCode,
    actualSeverity: finalItem?.calculatedSeverity,
    actualDestination: finalItem?.destinationName,
    validated
  };
}

async function main() {
  const count = Number(process.argv[2] ?? 10);

  const generatorJar: CookieJar = {};
  await login(generatorJar, GENERATOR_USERNAME, GENERATOR_PASSWORD);

  console.log(`Generating ${count} synthetic queue calls via POST /api/v1/queue/simulate ...`);
  const generatedIds: string[] = [];
  let generateAttempts = 0;
  while (generatedIds.length < count && generateAttempts < count * 4) {
    generateAttempts++;
    const generated = await generateOneCall(generatorJar);
    if (generated) generatedIds.push(generated.id);
  }
  console.log(`Generated ${generatedIds.length}/${count} calls (${generateAttempts} attempts).`);

  const nurseJar: CookieJar = {};
  await login(nurseJar, NURSE_USERNAME, NURSE_PASSWORD);

  const results: RunResult[] = [];
  for (const id of generatedIds) {
    try {
      results.push(await processCall(nurseJar, id));
    } catch (error) {
      results.push({ id, outcome: `exception:${error instanceof Error ? error.message : String(error)}` });
      await request(nurseJar, `/api/v1/queue/${id}/release`, { method: "POST" }).catch(() => {});
    }
  }

  console.log("\n=== Per-call results ===");
  for (const r of results) {
    console.log(
      JSON.stringify(
        {
          id: r.id,
          protocolTitle: r.protocolTitle,
          questionCount: r.questionCount,
          yesAtQuestionIndex: r.yesIndex,
          dispositionCode: r.actualDispositionCode,
          severity: r.actualSeverity,
          destination: r.actualDestination,
          validatedAgainstProtocol: r.validated,
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
        requested: count,
        generated: generatedIds.length,
        completed: completed.length,
        validatedAgainstProtocol: validated.length,
        failedValidation: completed.length - validated.length,
        failures: results.filter((r) => r.outcome !== "completed").map((r) => ({ id: r.id, outcome: r.outcome }))
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error("Simulation run failed", error);
  process.exitCode = 1;
});
