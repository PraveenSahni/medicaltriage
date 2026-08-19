/**
 * Exhaustive business cases for patient routing/disposition logic.
 *
 * `src/services/dispositionRouter.ts` (`resolveDisposition()` / `routeBySeverity()`)
 * is the single place a patient's destination is decided. This script drives
 * every real branch of that if-chain through the real API
 * (`POST /api/v1/triage/encounters/evaluate`), asserts the resulting
 * dispositionCode/severity/trace match what the code should produce, and
 * prints a PASS/FAIL summary - the same exhaustive-coverage convention as
 * the protocol-matching exhaustive scripts (simulateAnkleInjuryExhaustive.ts
 * etc.), applied to the routing layer instead of protocol matching.
 *
 * Real staff records used below come from src/services/hrmsOracleAdapter.ts's
 * synthetic Oracle Fusion HCM mirror - not invented ids.
 *
 * This pack is an API client only. It is not imported by, compiled into, or
 * executed by the application runtime.
 *
 * Usage:
 *   API_BASE=https://approved-test-host \
 *   TEST_NURSE_USERNAME=test-user@example.invalid \
 *   TEST_NURSE_PASSWORD=... \
 *   npx tsx tests/packs/disposition-routing/dispositionRoutingBusinessCases.ts
 */

function requireTestSetting(name: "API_BASE" | "TEST_NURSE_USERNAME" | "TEST_NURSE_PASSWORD"): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is required. Supply it only for an approved test environment.`);
  }
  return value.replace(/\/$/, "");
}

const API_BASE = requireTestSetting("API_BASE");
const NURSE_USERNAME = requireTestSetting("TEST_NURSE_USERNAME");
const NURSE_PASSWORD = requireTestSetting("TEST_NURSE_PASSWORD");

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

type EvaluateBody = Record<string, unknown>;

type BusinessCase = {
  label: string;
  branch: string;
  body: EvaluateBody;
  expectStatus: number;
  // Only checked when expectStatus === 200.
  expectDispositionCode?: string;
  expectSeverity?: string;
  expectTraceRuleId?: string;
};

const NURSE_ID = "nurse-layla";

const CASES: BusinessCase[] = [
  {
    label: "Case 1 - Emergency, pediatric dependent -> Sidra Pediatric ED",
    branch: "routeBySeverity: severity===Emergency && pediatricAge(request)",
    body: {
      istStaffId: "IST-1001",
      dependentId: "dep_ist_1001_child_02", // age 3
      nurseId: NURSE_ID,
      symptoms: {
        chiefComplaint: "Child has severe shortness of breath and altered consciousness.",
        narrative: "Sudden onset difficulty breathing, unresponsive to voice for a moment."
      },
      aviationContext: {}
    },
    expectStatus: 200,
    expectDispositionCode: "SIDRA_PEDIATRIC_ED",
    expectSeverity: "Emergency"
  },
  {
    label: "Case 2 - Emergency, adult -> nearest HMC Emergency Department",
    branch: "routeBySeverity: severity===Emergency (non-pediatric)",
    body: {
      istStaffId: "IST-2205",
      nurseId: NURSE_ID,
      symptoms: {
        chiefComplaint: "Chest pain and sweating for the last 20 minutes.",
        narrative: "Chest tightness with diaphoresis, feels unwell."
      },
      aviationContext: {}
    },
    expectStatus: 200,
    expectDispositionCode: "HMC_EMERGENCY_DEPARTMENT",
    expectSeverity: "Emergency"
  },
  {
    label: "Case 3 - Outstation staff, non-emergency -> IST teleconsult escalation",
    branch: "routeBySeverity: aviation.outstationEscalationRequired",
    body: {
      istStaffId: "IST-3003",
      nurseId: NURSE_ID,
      symptoms: { chiefComplaint: "Mild cough for one day, no other symptoms." },
      aviationContext: { crewRole: "ground_staff", outstation: true, stationCode: "DXB" }
    },
    expectStatus: 200,
    expectDispositionCode: "OUTSTATION_TELECONSULT_ESCALATION",
    expectSeverity: "Urgent",
    expectTraceRuleId: "AVIATION_OUTSTATION_GATE"
  },
  {
    label: "Case 4 - Occupational/commission visit -> IST Old Airport Road Medical Commission",
    branch: "routeBySeverity: aviationContext.occupationalOrCommissionVisit",
    body: {
      istStaffId: "IST-90001",
      nurseId: NURSE_ID,
      symptoms: { chiefComplaint: "Routine occupational medical check-up, feeling well." },
      aviationContext: { crewRole: "flight_deck", occupationalOrCommissionVisit: true }
    },
    expectStatus: 200,
    expectDispositionCode: "IST_OLD_AIRPORT_MEDICAL_COMMISSION"
  },
  {
    label: "Case 5 - Safety-sensitive crew, fit-to-fly not cleared -> IST Medical Centre, HIA Midfield",
    branch: "routeBySeverity: aviation.fitToFlyStatus !== \"cleared\"",
    body: {
      istStaffId: "IST-10001",
      nurseId: NURSE_ID,
      symptoms: { chiefComplaint: "Feeling dizzy before today's duty, no other symptoms." },
      aviationContext: { crewRole: "cabin_crew", onDuty: false }
    },
    expectStatus: 200,
    expectDispositionCode: "IST_HIA_MIDFIELD_MEDICAL_CENTRE",
    expectTraceRuleId: "AVIATION_FIT_TO_FLY_SYMPTOM_GATE"
  },
  {
    label: "Case 6 - Sickness leave requested, non safety-sensitive -> IST Medical Centre, HIA Midfield",
    branch: "routeBySeverity: aviationContext.sicknessLeaveRequested",
    body: {
      istStaffId: "IST-3003",
      nurseId: NURSE_ID,
      symptoms: { chiefComplaint: "Sore throat, requesting sickness leave validation." },
      aviationContext: { crewRole: "ground_staff", sicknessLeaveRequested: true }
    },
    expectStatus: 200,
    expectDispositionCode: "IST_HIA_MIDFIELD_MEDICAL_CENTRE"
  },
  {
    label: "Case 7 - Mock rules floor: Urgent keyword, no protocol -> HMC urgent review pathway",
    branch: "routeBySeverity: severity===\"Urgent\" (no protocolDispositionCode)",
    body: {
      istStaffId: "IST-2205",
      nurseId: NURSE_ID,
      symptoms: { chiefComplaint: "High fever and dizziness for two days." },
      aviationContext: {}
    },
    expectStatus: 200,
    expectDispositionCode: "HMC_URGENT_REVIEW",
    expectSeverity: "Urgent",
    expectTraceRuleId: "STCC_MOCK_URGENT_REVIEW"
  },
  {
    label: "Case 8 - Mock rules floor: Routine keyword -> PHCC urgent care / teleconsult",
    branch: "routeBySeverity: severity===\"Routine\"",
    body: {
      istStaffId: "IST-2205",
      nurseId: NURSE_ID,
      symptoms: { chiefComplaint: "Sore throat and cough for two days, otherwise well." },
      aviationContext: {}
    },
    expectStatus: 200,
    expectDispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT",
    expectSeverity: "Routine",
    expectTraceRuleId: "STCC_MOCK_ROUTINE_REVIEW"
  },
  {
    label: "Case 9 - No red-flag match at all -> self-care with callback precautions",
    branch: "routeBySeverity: fallback",
    body: {
      istStaffId: "IST-2205",
      nurseId: NURSE_ID,
      symptoms: { chiefComplaint: "Feeling a little tired today, no other symptoms." },
      aviationContext: {}
    },
    expectStatus: 200,
    expectDispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
    expectSeverity: "Self-care"
  },
  {
    label: "Case 10 - Vaccination reaction tag, still routes on Routine keyword",
    branch: "aviationRules: AVIATION_VACCINATION_REACTION_GATE (does not change the destination)",
    body: {
      istStaffId: "IST-3003",
      nurseId: NURSE_ID,
      symptoms: { chiefComplaint: "Mild rash on the arm since yesterday, otherwise well." },
      aviationContext: { crewRole: "ground_staff", recentVaccinationHours: 24 }
    },
    expectStatus: 200,
    expectDispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT",
    expectSeverity: "Routine",
    expectTraceRuleId: "AVIATION_VACCINATION_REACTION_GATE"
  },
  {
    label: "Case 11 - AI recommendation below the rules floor is blocked (logged, not honored)",
    branch: "resolveDisposition: aiDowngradeBlocked",
    body: {
      istStaffId: "IST-2205",
      nurseId: NURSE_ID,
      symptoms: { chiefComplaint: "High fever and dizziness for two days." },
      aviationContext: {},
      aiRecommendationSeverity: "Routine"
    },
    expectStatus: 200,
    expectDispositionCode: "HMC_URGENT_REVIEW",
    expectSeverity: "Urgent",
    expectTraceRuleId: "AI_DOWNGRADE_BLOCKED_BY_RULES_ENGINE"
  },
  {
    label: "Case 12 - Clinician downgrade below the floor without the override code is rejected",
    branch: "resolveDisposition: clinicianDowngradeBelowFloor without CLINICIAN_OVERRIDE_DOWN_BLOCKED -> 400",
    body: {
      istStaffId: "IST-2205",
      nurseId: NURSE_ID,
      symptoms: { chiefComplaint: "High fever and dizziness for two days." },
      aviationContext: {},
      clinicianFinalSeverity: "Self-care"
    },
    expectStatus: 400
  },
  {
    label: "Case 13 - Clinician downgrade below the floor, properly justified, is flagged not blocked",
    branch: "resolveDisposition: clinicianDowngradeBelowFloor with CLINICIAN_OVERRIDE_DOWN_BLOCKED + rationale",
    body: {
      istStaffId: "IST-2205",
      nurseId: NURSE_ID,
      symptoms: { chiefComplaint: "High fever and dizziness for two days." },
      aviationContext: {},
      clinicianFinalSeverity: "Self-care",
      clinicianOverrideReasonCode: "CLINICIAN_OVERRIDE_DOWN_BLOCKED",
      clinicianOverrideRationale: "Patient vitals reassessed as normal on scene by attending physician; fever resolved."
    },
    expectStatus: 200,
    expectDispositionCode: "HMC_URGENT_REVIEW",
    expectSeverity: "Urgent",
    expectTraceRuleId: "CLINICIAN_OVERRIDE_DOWN_BELOW_RULES_FLOOR_FLAGGED"
  }
];

type CaseResult = { label: string; branch: string; pass: boolean; detail: string };

async function runCase(jar: CookieJar, businessCase: BusinessCase): Promise<CaseResult> {
  const response = await request(jar, "/api/v1/triage/encounters/evaluate", {
    method: "POST",
    body: JSON.stringify(businessCase.body)
  });

  if (response.status !== businessCase.expectStatus) {
    const text = await response.text().catch(() => "");
    return {
      label: businessCase.label,
      branch: businessCase.branch,
      pass: false,
      detail: `expected HTTP ${businessCase.expectStatus}, got ${response.status}: ${text.slice(0, 200)}`
    };
  }

  if (businessCase.expectStatus !== 200) {
    return { label: businessCase.label, branch: businessCase.branch, pass: true, detail: `HTTP ${response.status} as expected` };
  }

  const body = (await response.json()) as {
    decision?: { dispositionCode?: string; severity?: string; destinationName?: string; trace?: Array<{ ruleId: string; matched: boolean }> };
  };
  const decision = body.decision;
  const problems: string[] = [];

  if (businessCase.expectDispositionCode && decision?.dispositionCode !== businessCase.expectDispositionCode) {
    problems.push(`dispositionCode: expected ${businessCase.expectDispositionCode}, got ${decision?.dispositionCode}`);
  }
  if (businessCase.expectSeverity && decision?.severity !== businessCase.expectSeverity) {
    problems.push(`severity: expected ${businessCase.expectSeverity}, got ${decision?.severity}`);
  }
  if (businessCase.expectTraceRuleId) {
    const traceHit = decision?.trace?.some((t) => t.ruleId === businessCase.expectTraceRuleId && t.matched);
    if (!traceHit) {
      problems.push(`trace: expected matched rule ${businessCase.expectTraceRuleId}, not found`);
    }
  }

  return {
    label: businessCase.label,
    branch: businessCase.branch,
    pass: problems.length === 0,
    detail:
      problems.length === 0
        ? `dispositionCode=${decision?.dispositionCode} severity=${decision?.severity} destination="${decision?.destinationName}"`
        : problems.join("; ")
  };
}

async function main() {
  const jar: CookieJar = {};
  await login(jar, NURSE_USERNAME, NURSE_PASSWORD);

  console.log(`Running ${CASES.length} disposition-routing business cases against ${API_BASE}\n`);

  const results: CaseResult[] = [];
  for (const businessCase of CASES) {
    const result = await runCase(jar, businessCase);
    results.push(result);
    console.log(`${result.pass ? "PASS" : "FAIL"} - ${result.label}`);
    console.log(`   branch: ${result.branch}`);
    console.log(`   ${result.detail}\n`);
  }

  const failed = results.filter((r) => !r.pass);
  console.log("=".repeat(70));
  console.log(`${results.length - failed.length}/${results.length} business cases passed.`);
  if (failed.length > 0) {
    console.log(`Failed: ${failed.map((f) => f.label).join(", ")}`);
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error("Disposition routing business-case run failed", error);
  process.exitCode = 1;
});
