import { expect, test, type APIRequestContext } from "@playwright/test";
import { apiLogin, personas } from "./fixtures.js";

type QueueQuestion = {
  id: string;
  acuityOrder: number;
  severity: "Emergency" | "Urgent" | "Routine" | "Self-care";
};

type QueueItem = {
  id: string;
  istStaffId: string;
  dependentId?: string;
  patientType: "Staff" | "Dependent";
  reasonNarrative: string;
  identityValidated: boolean;
  identityValidationSource: string;
  patientAge: {
    source: "staff" | "dependent";
    ageYears: number;
    ageMonths: number;
    calculatedFrom: string;
  };
  preparedProtocol: {
    status: string;
    sourceType: string;
    releaseVersion: string;
    primaryProtocolId?: string;
    suggestions: Array<{ protocolId: string }>;
    acuityQuestionPreview: QueueQuestion[];
    ragShadow: {
      boundary: string;
      sourceReleaseVersion: string;
      cannotDecideDisposition: boolean;
      requiresNurseReview: boolean;
      prohibitedActionAcknowledgement: string[];
    };
  };
  stccProcess: {
    processName: string;
    averageDurationMinutes: string;
    visibleActionTabs: Array<{ id: string }>;
    canonicalSteps: Array<{ id: string }>;
  };
};

const severityRank: Record<QueueQuestion["severity"], number> = {
  Emergency: 0,
  Urgent: 1,
  Routine: 2,
  "Self-care": 3
};

async function queue(request: APIRequestContext): Promise<QueueItem[]> {
  const response = await request.get("/api/v1/queue");
  expect(response.status(), await response.text()).toBe(200);
  const body = await response.json();
  expect(body.source).toBe("unified-queue-orchestration");
  expect(body.count).toBe(body.queue.length);
  return body.queue;
}

test.describe.serial("API contracts from login through clinical completion", () => {
  test("API-001 exposes the intended simulation runtime and rules-first release", async ({ request }) => {
    const health = await request.get("/healthz");
    expect(health.status()).toBe(200);
    await expect(health.json()).resolves.toMatchObject({
      ok: true,
      architecture: "rules-first-ai-second",
      gcpPrimaryRegion: "me-central1",
      runtime: {
        environment: "simulation",
        dataProfile: "synthetic-e2e",
        mockMode: true,
        persistenceMode: "mock-in-memory",
        callCenterGateway: { enabled: true, provider: "dry-run" }
      }
    });

    const runtime = await request.get("/api/v1/runtime/environment");
    expect(runtime.status()).toBe(200);
    await expect(runtime.json()).resolves.toMatchObject({
      environment: "simulation",
      dataProfile: "synthetic-e2e",
      banner: { visible: true, label: "SIMULATION" }
    });
  });

  test("API-002 rejects unauthenticated queue access and invalid credentials", async ({ request }) => {
    expect((await request.get("/api/v1/auth/session")).status()).toBe(401);
    expect((await request.get("/api/v1/queue")).status()).toBe(401);
    const invalid = await request.post("/api/v1/auth/login", {
      data: { username: personas.nurse.username, password: "not-the-password" }
    });
    expect(invalid.status()).toBe(401);
    await expect(invalid.json()).resolves.toMatchObject({ error: "Authentication failed" });
  });

  test("API-003 binds the named nurse session to its assigned role", async ({ request }) => {
    await apiLogin(request, personas.nurse);
    const session = await request.get("/api/v1/auth/session");
    expect(session.status()).toBe(200);
    await expect(session.json()).resolves.toMatchObject({
      authenticated: true,
      session: {
        activeRole: "remote_triage_nurse",
        // Was asserting a stale masked email ("n****@...") that predates the
        // nurse persona's real username (layla@irisstar.tech, see
        // fixtures.ts) - maskEmail() masks all but the first character, so
        // this is the real, current expected value.
        user: { id: "usr_nurse_10001", email: "l****@irisstar.tech" }
      }
    });
  });

  test("API-004 validates every fetched queue record and its STCC/RAG lineage", async ({ request }) => {
    await apiLogin(request, personas.nurse);
    const items = await queue(request);
    expect(items.length).toBeGreaterThan(0);
    expect(new Set(items.map((item) => item.id)).size).toBe(items.length);

    for (const item of items) {
      expect(item.reasonNarrative.trim().length).toBeGreaterThan(5);
      expect(item.identityValidated).toBe(true);
      expect(item.identityValidationSource).toBe("HRMS_AUTO");
      expect(item.patientAge.ageYears).toBeGreaterThanOrEqual(0);
      expect(item.patientAge.ageMonths).toBeGreaterThanOrEqual(item.patientAge.ageYears * 12);
      expect(item.patientAge.calculatedFrom).toMatch(/^HRMS_/);
      expect(item.patientAge.source).toBe(item.patientType === "Dependent" ? "dependent" : "staff");

      expect(item.preparedProtocol.status).toBe("PREPARED");
      expect(item.preparedProtocol.releaseVersion).toBeTruthy();
      expect(new Set(item.preparedProtocol.suggestions.map((candidate) => candidate.protocolId)).size)
        .toBe(item.preparedProtocol.suggestions.length);

      const questions = item.preparedProtocol.acuityQuestionPreview;
      expect(new Set(questions.map((question) => question.id)).size).toBe(questions.length);
      expect(questions.map((question) => question.acuityOrder)).toEqual(
        [...questions].map((question) => question.acuityOrder).sort((left, right) => left - right)
      );
      expect(questions.map((question) => severityRank[question.severity])).toEqual(
        [...questions].map((question) => severityRank[question.severity]).sort((left, right) => left - right)
      );

      expect(item.preparedProtocol.ragShadow).toMatchObject({
        boundary: "APPROVED_CONTENT_ONLY",
        sourceReleaseVersion: item.preparedProtocol.releaseVersion,
        cannotDecideDisposition: true,
        requiresNurseReview: true
      });
      expect(item.preparedProtocol.ragShadow.prohibitedActionAcknowledgement).toEqual(
        expect.arrayContaining([
          "No invented questions",
          "No invented care advice",
          "No disposition decision authority",
          "No downgrade below deterministic safety floor"
        ])
      );
      expect(item.stccProcess).toMatchObject({
        processName: "Telehealth Triage Encounter",
        averageDurationMinutes: "11-13"
      });
      expect(item.stccProcess.visibleActionTabs.map((tab) => tab.id)).toEqual([
        "REASON_AND_EMERGENCY_RULE_OUT",
        "QUESTIONS",
        "DISPOSITION_AND_CARE_ADVICE",
        "SBAR_COMPLETE"
      ]);
      expect(item.stccProcess.canonicalSteps).toHaveLength(10);
    }
  });

  test("API-005 reconciles HRMS identity, protocol search, detail, and care-advice data", async ({ request }) => {
    await apiLogin(request, personas.nurse);
    const items = await queue(request);
    const child = items.find((item) => item.id === "case-10002");
    expect(child).toBeTruthy();

    const staff = await request.post("/api/v1/staff/validate", { data: { ist_staff_id: child!.istStaffId } });
    expect(staff.status()).toBe(200);
    const staffBody = await staff.json();
    expect(staffBody).toMatchObject({ valid: true, validated: true });
    expect(staffBody.profile.dependents.map((dependent: { id: string }) => dependent.id)).toContain(child!.dependentId);

    const release = await request.get("/api/v1/protocols/releases/current");
    expect(release.status()).toBe(200);
    const releaseBody = await release.json();
    expect(releaseBody.release.version).toBe(child!.preparedProtocol.releaseVersion);

    const search = await request.get("/api/v1/protocols/search", {
      params: { q: child!.reasonNarrative, ageYears: child!.patientAge.ageYears, limit: 8 }
    });
    expect(search.status()).toBe(200);
    const searchBody = await search.json();
    expect(searchBody.results.map((result: { id: string }) => result.id)).toContain(child!.preparedProtocol.primaryProtocolId);

    const protocolId = child!.preparedProtocol.primaryProtocolId!;
    const detail = await request.get(`/api/v1/protocols/${protocolId}`);
    expect(detail.status()).toBe(200);
    const detailBody = await detail.json();
    expect(detailBody.protocol.id).toBe(protocolId);
    expect(detailBody.release.version).toBe(child!.preparedProtocol.releaseVersion);
    expect(detailBody.protocol.questions.length).toBeGreaterThan(0);

    const advice = await request.get(`/api/v1/protocols/${protocolId}/care-advice`, {
      params: { dispositionCode: "SIDRA_PEDIATRIC_ED" }
    });
    expect(advice.status()).toBe(200);
    expect((await advice.json()).protocolId).toBe(protocolId);
  });

  test("API-006 enforces deterministic adult, pediatric, and stable safety outcomes", async ({ request }) => {
    await apiLogin(request, personas.nurse);
    const adult = await request.post("/api/v1/triage/calculate-score", {
      data: {
        ist_staff_id: "IST-1001",
        heart_rate: 135,
        respiratory_rate: 18,
        spo2: 91,
        temperature: 37,
        conscious_level: "A"
      }
    });
    expect(adult.status()).toBe(200);
    await expect(adult.json()).resolves.toMatchObject({
      score: 10,
      riskBand: "RED_ALERT",
      severity: "EMERGENCY",
      dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
      redAlertTriggered: true,
      patientAge: { source: "staff" }
    });

    const child = await request.post("/api/v1/triage/calculate-score", {
      data: {
        ist_staff_id: "IST-1001",
        dependent_id: "dep_ist_1001_child_02",
        heart_rate: 100,
        respiratory_rate: 45,
        spo2: 98,
        temperature: 37,
        conscious_level: "A"
      }
    });
    expect(child.status()).toBe(200);
    await expect(child.json()).resolves.toMatchObject({
      score: 10,
      severity: "EMERGENCY",
      dispositionCode: "SIDRA_PEDIATRIC_ED",
      redAlertTriggered: true,
      patientAge: { source: "dependent" }
    });

    const stable = await request.post("/api/v1/triage/calculate-score", {
      data: {
        ist_staff_id: "IST-1001",
        heart_rate: 72,
        respiratory_rate: 16,
        spo2: 98,
        temperature: 37,
        conscious_level: "A"
      }
    });
    expect(stable.status()).toBe(200);
    await expect(stable.json()).resolves.toMatchObject({
      score: 0,
      riskBand: "HOMECARE",
      dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
      redAlertTriggered: false
    });

    const manualAgeOnly = await request.post("/api/v1/triage/calculate-score", {
      data: {
        age_years: 35,
        heart_rate: 72,
        respiratory_rate: 16,
        spo2: 98,
        temperature: 37,
        conscious_level: "A"
      }
    });
    expect(manualAgeOnly.status()).toBe(400);
    await expect(manualAgeOnly.json()).resolves.toMatchObject({ error: "ist_staff_id is required" });
  });

  test("API-007 enforces call-control permissions and exposes provider-neutral status", async ({ request }) => {
    await apiLogin(request, personas.integrationAdmin);
    const gateway = await request.get("/api/v1/call-center/status");
    expect(gateway.status()).toBe(200);
    await expect(gateway.json()).resolves.toMatchObject({
      gateway: {
        architecture: "provider-neutral-call-center-gateway",
        configuredProvider: "dry-run",
        persistence: "mock-in-memory",
        recordingRegion: "me-central1",
        rawRecordingRagEligible: false
      }
    });

    await request.post("/api/v1/auth/logout");
    await apiLogin(request, personas.intake);
    const denied = await request.post("/api/v1/call-center/queue/case-10002/command", {
      data: { action: "ANSWER", provider: "dry-run" }
    });
    expect(denied.status()).toBe(403);
  });

  test("API-008 executes a complete callback-to-SBAR journey and validates every write", async ({ request }) => {
    await apiLogin(request, personas.nurse);
    const callback = await request.post("/api/v1/call-center/queue/case-10002/command", {
      data: { action: "ANSWER", provider: "dry-run" }
    });
    expect(callback.status(), await callback.text()).toBe(200);
    const callbackBody = await callback.json();
    expect(callbackBody).toMatchObject({
      item: { id: "case-10002", status: "IN_PROCESS", lockedBy: "usr_nurse_10001" },
      call: { status: "CONNECTED" }
    });

    const score = await request.post("/api/v1/triage/calculate-score", {
      data: {
        ist_staff_id: "IST-1001",
        dependent_id: "dep_ist_1001_child_02",
        heart_rate: 118,
        respiratory_rate: 42,
        spo2: 91,
        temperature: 38.2,
        conscious_level: "A"
      }
    });
    expect(score.status()).toBe(200);
    const scoreBody = await score.json();

    const context = await request.patch("/api/v1/queue/case-10002/context", {
      data: {
        identityValidated: true,
        vitals: { heartRate: 118, respiratoryRate: 42, spo2: 91, temperature: 38.2, consciousLevel: "alert" },
        matchedProtocolId: "phase1-rules-first-protocol",
        calculatedSeverity: scoreBody.severity === "HOMECARE" ? "SELF_CARE" : scoreBody.severity,
        dispositionCode: scoreBody.dispositionCode,
        destinationName: scoreBody.destinationName,
        clinicalApproval: { approvedBy: "E2E nurse", approvalType: "e2e" },
        sbarCopied: true
      }
    });
    expect(context.status(), await context.text()).toBe(200);

    const complete = await request.post("/api/v1/triage/complete", {
      headers: { accept: "application/json" },
      data: {
        encounter_id: "case-10002",
        ist_staff_id: "IST-1001",
        nurse_id: "usr_nurse_10001",
        patient_name: "Dependent child",
        patient_age_years: 3,
        chief_complaint: "Fever with fast breathing reported by parent.",
        subjective: "Parent reports fever and fast breathing.",
        objective: "HR 118, RR 42, SpO2 91, Temp 38.2, AVPU alert.",
        assessment: `Rules-first severity ${scoreBody.severity}.`,
        recommendation: scoreBody.destinationName,
        final_disposition_code: scoreBody.dispositionCode,
        routing_destination: scoreBody.destinationName,
        safety_rationale: scoreBody.routingRationale,
        custom_aviation_tags: []
      }
    });
    expect(complete.status(), await complete.text()).toBe(200);
    const completeBody = await complete.json();
    expect(completeBody.notePayload).toContain("SBAR");
    expect(completeBody.notePayload).toContain("ملخص الحالة السريرية");
    expect(completeBody.clipboardOptimized).toBe(true);

    const move = await request.post("/api/v1/queue/case-10002/move", {
      data: { toStatus: "COMPLETED", toStage: "SBAR", reason: "E2E nurse-approved closure" }
    });
    expect(move.status(), await move.text()).toBe(200);
    await expect(move.json()).resolves.toMatchObject({ item: { id: "case-10002", status: "COMPLETED", currentStage: "SBAR" } });

    const writeback = await request.post("/api/v1/emr/writeback/case-10002", {
      data: { dryRun: true, isDraft: true }
    });
    expect(writeback.status(), await writeback.text()).toBe(200);
    const writebackBody = await writeback.json();
    expect(writebackBody).toBeTruthy();

    const finalItem = await request.get("/api/v1/queue/case-10002");
    expect(finalItem.status()).toBe(200);
    await expect(finalItem.json()).resolves.toMatchObject({
      item: {
        status: "COMPLETED",
        sbarCopied: true,
        clinicalApproval: { approvedBy: "E2E nurse" },
        dispositionCode: scoreBody.dispositionCode
      }
    });
  });
});
