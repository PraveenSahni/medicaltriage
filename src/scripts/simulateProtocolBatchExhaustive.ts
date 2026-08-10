/**
 * Exhaustive live test run across a BATCH of protocols (not just one): for
 * each protocol in the batch, generates one real call per possible terminal
 * outcome - a "Yes" landing at every question index, plus the all-"No" path
 * - same approach validated earlier for the single licensed STCC protocol
 * (simulateAbdominalPainMaleExhaustive.ts), generalized to any protocol and
 * run protocol-by-protocol in controlled batches (per user's explicit
 * choice: exhaustive coverage, ~10 protocols per batch, not all 229 at once).
 *
 * Each call is generated through the real shared generator (POST
 * /api/v1/queue/simulate) purely to obtain a real HRMS-validated staff/
 * dependent record, then the nurse explicitly selects the target protocol
 * via PATCH /context's matchedProtocolId (the nurse guideline-override
 * mechanism added to ProtocolMatchPanel.tsx), forcing every call onto that
 * protocol regardless of its own auto-matched reason text.
 *
 * Per user's explicit instruction, the reason narrative for each scenario is
 * NOT a verbatim quote of the internal question criteria text - it is
 * naturalized into a caller-style sentence (markers like "[1]"/"AND"/
 * parenthetical exceptions stripped, wrapped in one of several varied
 * caller-voice openers) so different employees/dependents across the batch
 * read like distinct real callers describing the same clinical situation in
 * their own words, not the raw internal question wording.
 *
 * After each call completes, its persisted dispositionCode/calculatedSeverity/
 * destinationName are independently re-checked against the same protocol
 * question's own data (fetched fresh) to confirm the backend recorded
 * exactly what that question defines.
 *
 * Usage: npx tsx src/scripts/simulateProtocolBatchExhaustive.ts <startIndex> <count> [--skip=id1,id2]
 *   Protocols are taken from GET /api/v1/protocols in their natural (id-sorted)
 *   order; startIndex/count select a slice of that list as one batch.
 */

const API_BASE = process.env.API_BASE ?? "http://localhost:8080";
const GENERATOR_USERNAME = "layla@irisstar.tech";
const GENERATOR_PASSWORD = "Layla@2026";
// Remote Triage Nurses alternate scenario-by-scenario (not always the same
// nurse claiming every test call) - both are PHCC-org-scoped so either can
// claim any call the intake account generates, matching real multi-nurse
// queue distribution rather than one nurse doing all the work.
const NURSES = [
  { username: "layla@irisstar.tech", password: "Layla@2026" },
  { username: "sara@irisstar.tech", password: "Sara@2026" }
];

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

// Bearer token attached alongside the cookie - Firebase Hosting's rewrite-
// to-Cloud-Run proxy does not forward the Cookie header on the custom
// domain (triaged.irisstar.tech), so cookie-only auth silently fails there.
type CookieJar = { cookie?: string; token?: string };
type Question = { id: string; acuityOrder: number; severity: string; dispositionCode: string; questionTextEn: string };
type InitialAssessmentQuestion = {
  id: string;
  sequence: number;
  responseType: "LOCATION" | "DURATION" | "YES_NO" | "TEMPERATURE" | "PAIN_SCALE" | "OPEN_TEXT";
  promptTextEn: string;
};
type ProtocolSummary = { id: string; titleEn: string; questionCount: number };

// Genuine first-person caller speech - "Reason for Call - in the caller's own
// words" must read like something a real person actually said on the phone,
// not a third-person narrator/system summary ("Caller reports:", "According
// to the caller:") describing them from the outside. Each opener is a
// colon-style lead-in that stays grammatically coherent regardless of the
// clause fragment that follows (screening-question source text doesn't
// always reduce cleanly to a subject-verb-agreeing sentence), rather than
// openers like "I have..." that only work for some fragment shapes.
const CALLER_OPENERS = [
  "I'm calling because",
  "Here's what's going on:",
  "I wanted to mention",
  "I'm worried because",
  "The reason I'm calling is",
  "What's happening is"
];

// Screening-question lead-ins ("Is there...", "Has there been...") read as a
// question posed back at the caller, not something the caller would say
// about themselves - stripped so the remaining clause reads as a first-
// person statement instead.
const QUESTION_LEAD_IN_PATTERN =
  /^(is there|is the|is a|is this|has there been|has the|did the|does the|are there|was there|for the in-person clinician,?\s*)/i;

function naturalizeCriteria(raw: string): string {
  let text = raw
    .replace(/\[\d+\]/g, "")
    .replace(/\s+AND\s+/gi, " and ")
    .replace(/\(Exception[^)]*\)/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
  text = text.replace(QUESTION_LEAD_IN_PATTERN, "").trim();
  // The source text is often a screening question and may still end in "?" -
  // a caller describing their own symptoms wouldn't end on a question mark.
  text = text.replace(/\?+$/, "");
  return text.toLowerCase();
}

function reasonNarrativeFor(protocolTitle: string, criteriaText: string | undefined, scenarioSeed: number): string {
  const opener = CALLER_OPENERS[scenarioSeed % CALLER_OPENERS.length];
  if (!criteriaText) {
    return `${opener} mild, intermittent symptoms consistent with ${protocolTitle.toLowerCase()}, with none of the more serious warning signs present.`;
  }
  return `${opener} ${naturalizeCriteria(criteriaText)}.`;
}

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

type CaseResult = {
  id: string;
  protocolId: string;
  scenario: string;
  outcome: string;
  validated?: boolean;
  sbarAligned?: boolean;
  nurse?: string;
};

async function processScenario(
  generatorJar: CookieJar,
  jar: CookieJar,
  protocolId: string,
  protocolTitle: string,
  questions: Question[],
  iaqs: InitialAssessmentQuestion[],
  yesIndex: number,
  scenarioSeed: number
): Promise<CaseResult> {
  const scenario = yesIndex === -1 ? "all-No (self-care)" : `Yes at question ${yesIndex + 1} of ${questions.length}`;

  const genResp = await request(generatorJar, "/api/v1/queue/simulate", { method: "POST" });
  if (!genResp.ok) return { id: "unknown", protocolId, scenario, outcome: `generate-failed-${genResp.status}` };
  const genBody = await genResp.json();
  const id = genBody.item.id as string;
  const istStaffId = genBody.item.istStaffId as string;

  const claim = await request(jar, `/api/v1/queue/${id}/claim`, { method: "POST" });
  if (!claim.ok) return { id, protocolId, scenario, outcome: `claim-failed-${claim.status}` };

  const criteriaText = yesIndex === -1 ? undefined : questions[yesIndex].questionTextEn;
  const reasonNarrative = reasonNarrativeFor(protocolTitle, criteriaText, scenarioSeed);
  await request(jar, `/api/v1/queue/${id}/context`, {
    method: "PATCH",
    body: JSON.stringify({ reasonNarrative, vitalsUnobtainable: true })
  });

  const forcedMatch = await request(jar, `/api/v1/queue/${id}/context`, {
    method: "PATCH",
    body: JSON.stringify({ matchedProtocolId: protocolId })
  });
  if (!forcedMatch.ok) return { id, protocolId, scenario, outcome: `force-protocol-failed-${forcedMatch.status}` };

  let initialAssessmentResponses: Record<string, string> = {};
  for (const iaq of iaqs) {
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
  let expectedDestination: string;
  let expectedSeverity: string;
  if (yesIndex === -1) {
    expectedSeverity = "SELF_CARE";
    expectedDispositionCode = "SELF_CARE_WITH_CALLBACK_PRECAUTIONS";
    expectedDestination = QATAR_DESTINATION_BY_CODE.SELF_CARE_WITH_CALLBACK_PRECAUTIONS;
    update = await request(jar, `/api/v1/queue/${id}/context`, {
      method: "PATCH",
      body: JSON.stringify({
        matchedProtocolId: protocolId,
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
        matchedProtocolId: protocolId,
        calculatedSeverity: expectedSeverity,
        dispositionCode: expectedDispositionCode,
        destinationName: expectedDestination,
        clinicalApproval: { terminalQuestionId: question.id },
        taqResponses
      })
    });
  }
  if (!update.ok) {
    const body = await update.json().catch(() => ({}));
    return { id, protocolId, scenario, outcome: `context-update-failed-${update.status}:${body.code ?? ""}` };
  }

  const move1 = await request(jar, `/api/v1/queue/${id}/move`, {
    method: "POST",
    body: JSON.stringify({ toStage: "DISPOSITION" })
  });
  if (!move1.ok) {
    const body = await move1.json().catch(() => ({}));
    await request(jar, `/api/v1/queue/${id}/release`, { method: "POST" });
    return { id, protocolId, scenario, outcome: `move-to-disposition-failed-${move1.status}:${body.code ?? ""}` };
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

  // Actually generate the real SBAR note (POST /api/v1/triage/complete, the
  // same endpoint CompletionStage.tsx calls) rather than just flipping
  // sbarCopied - a completed call is not properly tested unless the compiled
  // note is checked to actually reference the correct disposition/destination.
  const chiefComplaint = reasonNarrative;
  const sbarResp = await request(jar, "/api/v1/triage/complete", {
    method: "POST",
    body: JSON.stringify({
      ist_staff_id: istStaffId,
      chief_complaint: chiefComplaint,
      final_disposition_code: expectedDispositionCode,
      routing_destination: expectedDestination
    })
  });
  let sbarNoteText: string | undefined;
  let sbarAligned = false;
  if (sbarResp.ok) {
    const sbarBody = await sbarResp.json().catch(() => undefined);
    sbarNoteText = sbarBody?.notePayload as string | undefined;
    sbarAligned = Boolean(
      sbarNoteText &&
        sbarNoteText.includes(expectedDispositionCode) &&
        sbarNoteText.includes(expectedDestination) &&
        sbarNoteText.includes(chiefComplaint)
    );
  }

  await request(jar, `/api/v1/queue/${id}/context`, {
    method: "PATCH",
    body: JSON.stringify({ sbarCopied: true, ...(sbarNoteText ? { sbarNoteText } : {}) })
  });

  const move2 = await request(jar, `/api/v1/queue/${id}/move`, {
    method: "POST",
    body: JSON.stringify({ toStage: "SBAR", toStatus: "COMPLETED" })
  });
  if (!move2.ok) {
    const body = await move2.json().catch(() => ({}));
    return { id, protocolId, scenario, outcome: `complete-failed-${move2.status}:${body.code ?? ""}` };
  }

  const finalResp = await request(jar, `/api/v1/queue/${id}`, {});
  const finalItem = (await finalResp.json()).item;
  const revalidateResp = await request(jar, `/api/v1/protocols/${protocolId}`, {});
  const revalidateDetail = await revalidateResp.json();
  const revalidateQuestion: Question | undefined =
    yesIndex === -1 ? undefined : (revalidateDetail.protocol?.questions ?? []).find((q: Question) => q.id === questions[yesIndex].id);

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

  // The compiled note is also cross-checked against the same finalItem's
  // persisted fields (not just the request we sent it), so a bug that let
  // the note diverge from what was actually saved would still be caught.
  const sbarMatchesPersistedRecord = Boolean(
    sbarNoteText && finalItem?.dispositionCode && sbarNoteText.includes(finalItem.dispositionCode) &&
      finalItem?.destinationName && sbarNoteText.includes(finalItem.destinationName)
  );

  const validated =
    finalItem?.matchedProtocolId === protocolId &&
    finalItem?.dispositionCode === expectedFromSource.dispositionCode &&
    finalItem?.calculatedSeverity === expectedFromSource.severity &&
    finalItem?.destinationName === expectedFromSource.destination &&
    finalItem?.status === "COMPLETED" &&
    sbarAligned &&
    sbarMatchesPersistedRecord;

  return { id, protocolId, scenario, outcome: "completed", validated, sbarAligned };
}

async function main() {
  const startIndex = Number(process.argv[2] ?? 0);
  const count = Number(process.argv[3] ?? 10);
  const skipArg = process.argv.find((a) => a.startsWith("--skip="));
  const skipIds = new Set((skipArg ? skipArg.slice("--skip=".length) : "").split(",").filter(Boolean));

  const generatorJar: CookieJar = {};
  await login(generatorJar, GENERATOR_USERNAME, GENERATOR_PASSWORD);
  const nurseJars: CookieJar[] = [];
  for (const nurse of NURSES) {
    const jar: CookieJar = {};
    await login(jar, nurse.username, nurse.password);
    nurseJars.push(jar);
  }
  const nurseJar = nurseJars[0];

  const listResp = await request(nurseJar, "/api/v1/protocols?limit=1000", {});
  const listBody = await listResp.json();
  const allProtocols: ProtocolSummary[] = listBody.protocols.map((p: any) => ({
    id: p.id,
    titleEn: p.titleEn,
    questionCount: p.questionCount
  }));
  const batch = allProtocols.slice(startIndex, startIndex + count).filter((p) => !skipIds.has(p.id));

  console.log(`Batch: protocols [${startIndex}, ${startIndex + count}) of ${allProtocols.length} total.`);
  console.log(batch.map((p) => `${p.id} (${p.questionCount}q)`).join(", "));

  const allResults: CaseResult[] = [];
  let scenarioSeed = 0;
  for (const protocol of batch) {
    const detailResp = await request(nurseJar, `/api/v1/protocols/${protocol.id}`, {});
    const detail = await detailResp.json();
    const questions: Question[] = [...(detail.protocol?.questions ?? [])].sort((a: Question, b: Question) => a.acuityOrder - b.acuityOrder);
    const iaqs: InitialAssessmentQuestion[] = [...(detail.protocol?.initialAssessmentQuestions ?? [])].sort(
      (a, b) => a.sequence - b.sequence
    );
    if (questions.length === 0) {
      allResults.push({ id: "n/a", protocolId: protocol.id, scenario: "n/a", outcome: "no-questions-skipped" });
      continue;
    }

    const scenarios: number[] = [...questions.map((_, index) => index), -1];
    for (const yesIndex of scenarios) {
      scenarioSeed++;
      // Alternate which Remote Triage Nurse claims each scenario, rather
      // than one nurse processing every test call.
      const nurseIndex = scenarioSeed % NURSES.length;
      const chosenNurseJar = nurseJars[nurseIndex];
      const chosenNurseLabel = NURSES[nurseIndex].username;
      try {
        const result = await processScenario(
          generatorJar,
          chosenNurseJar,
          protocol.id,
          protocol.titleEn,
          questions,
          iaqs,
          yesIndex,
          scenarioSeed
        );
        allResults.push({ ...result, nurse: chosenNurseLabel });
      } catch (error) {
        allResults.push({
          id: "unknown",
          protocolId: protocol.id,
          scenario: `yesIndex=${yesIndex}`,
          outcome: `exception:${error instanceof Error ? error.message : String(error)}`
        });
      }
    }
    const protocolResults = allResults.filter((r) => r.protocolId === protocol.id && r.outcome === "completed");
    const protocolValidated = protocolResults.filter((r) => r.validated);
    console.log(
      `  ${protocol.id}: ${protocolResults.length}/${scenarios.length} completed, ${protocolValidated.length}/${protocolResults.length} validated`
    );
  }

  const completed = allResults.filter((r) => r.outcome === "completed");
  const validated = completed.filter((r) => r.validated);
  const failures = allResults.filter((r) => r.outcome !== "completed");
  const byNurse: Record<string, number> = {};
  for (const r of completed) {
    if (r.nurse) byNurse[r.nurse] = (byNurse[r.nurse] ?? 0) + 1;
  }

  const sbarAligned = completed.filter((r) => r.sbarAligned);

  console.log("\n=== Batch Summary ===");
  console.log(
    JSON.stringify(
      {
        protocolsInBatch: batch.length,
        totalScenarios: allResults.length,
        completed: completed.length,
        validated: validated.length,
        failedValidation: completed.length - validated.length,
        sbarAligned: sbarAligned.length,
        sbarMisaligned: completed.length - sbarAligned.length,
        completedByNurse: byNurse,
        failures: failures.map((f) => ({ protocolId: f.protocolId, scenario: f.scenario, outcome: f.outcome }))
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error("Batch simulation run failed", error);
  process.exitCode = 1;
});
