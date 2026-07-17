import request from "supertest";
import { createApp } from "../src/app.js";
import {
  callCenterSignatureFor,
  registerCallCenterAdapter,
  resetCallCenterGatewayForTests
} from "../src/services/callCenterGateway.js";
import { resetQueueStoreForTests } from "../src/services/queueOrchestration.js";
import { resetSecurityStoreForTests } from "../src/services/securityAdmin.js";
import type { CallCenterAdapter, CallCenterEvent } from "../src/types/callCenter.js";

const TEST_ADMIN_PASSWORD = "TestAdminPassword!2026";
const TEST_GATEWAY_SECRET = "test-call-center-gateway-secret";
process.env.ADMIN_PASSWORD = TEST_ADMIN_PASSWORD;
process.env.CALL_CENTER_GATEWAY_SECRET = TEST_GATEWAY_SECRET;

const app = createApp();

const scenarioIds = [
  "CCG-CAT-001",
  "CCG-SEC-001",
  "CCG-EVT-001",
  "CCG-EVT-002",
  "CCG-IDN-001",
  "CCG-CBK-001",
  "CCG-REC-001",
  "CCG-REC-002",
  "CCG-REC-003",
  "CCG-REC-004",
  "CCG-PHI-001",
  "CCG-CMD-001",
  "CCG-CMD-002",
  "CCG-FAIL-001",
  "CCG-FAIL-002",
  "CCG-RBAC-001",
  "CCG-OPS-001"
] as const;

async function agentFor(username: string, simulateRole: string) {
  const agent = request.agent(app);
  await agent
    .post("/api/v1/auth/login")
    .send({ username, password: TEST_ADMIN_PASSWORD, simulateRole })
    .expect(200);
  return agent;
}

function event(overrides: Partial<CallCenterEvent> = {}): CallCenterEvent {
  return {
    provider: "dry-run",
    providerEventId: "event-1001",
    externalCallId: "call-1001",
    eventType: "CALL_OFFERED",
    occurredAtIso: "2026-07-17T08:30:00.000Z",
    direction: "INBOUND",
    channel: "Phone",
    ani: "+97455501234",
    dnis: "IST-HEALTH-TRIAGE",
    language: "en",
    queueName: "IST-HEALTH-TRIAGE",
    istStaffId: "IST-10001",
    patientType: "Staff",
    stationCode: "DOH",
    reasonNarrative: "Twisted ankle while playing sport.",
    metadata: { providerTrace: "trace-1001" },
    ...overrides
  };
}

function postSignedEvent(payload: object) {
  return request(app)
    .post("/api/v1/integrations/call-center/events")
    .set("x-ist-call-center-signature", callCenterSignatureFor(payload))
    .send(payload);
}

describe("Provider-neutral call-center gateway integration", () => {
  beforeEach(() => {
    resetQueueStoreForTests();
    resetSecurityStoreForTests();
    resetCallCenterGatewayForTests();
  });

  it("CCG-CAT-001 keeps every maintained scenario ID unique", () => {
    expect(new Set(scenarioIds).size).toBe(scenarioIds.length);
  });

  it("CCG-SEC-001 rejects unsigned or forged provider events", async () => {
    const response = await request(app)
      .post("/api/v1/integrations/call-center/events")
      .set("x-ist-call-center-signature", "0".repeat(64))
      .send(event())
      .expect(401);

    expect(response.body.code).toBe("CALL_CENTER_SIGNATURE_INVALID");
  });

  it("CCG-EVT-001 persists a signed incoming event and creates an HRMS-validated queue case", async () => {
    const response = await postSignedEvent(event()).expect(202);

    expect(response.body.receipt).toMatchObject({
      providerEventId: "event-1001",
      processStatus: "PROCESSED",
      duplicate: false,
      session: {
        provider: "dry-run",
        externalCallId: "call-1001",
        status: "OFFERED",
        requiresIdentityResolution: false
      }
    });
    expect(response.body.receipt.session.queueItemId).toEqual(expect.any(String));

    const nurse = await agentFor("nurse@irisstar.tech", "remote_triage_nurse");
    const queue = await nurse.get("/api/v1/queue").expect(200);
    expect(queue.body.queue).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: response.body.receipt.session.queueItemId,
          istStaffId: "IST-10001",
          identityValidated: true,
          identityValidationSource: "HRMS_AUTO",
          reasonNarrative: "Twisted ankle while playing sport."
        })
      ])
    );
  });

  it("CCG-EVT-002 returns the same session for a duplicate provider event without adding another queue case", async () => {
    const payload = event();
    const first = await postSignedEvent(payload).expect(202);
    const duplicate = await postSignedEvent(payload).expect(200);

    expect(duplicate.body.receipt.duplicate).toBe(true);
    expect(duplicate.body.receipt.session.id).toBe(first.body.receipt.session.id);
    expect(duplicate.body.receipt.session.queueItemId).toBe(first.body.receipt.session.queueItemId);
  });

  it("CCG-IDN-001 holds an unidentified caller outside the clinical queue", async () => {
    const payload = event({
      providerEventId: "event-unidentified",
      externalCallId: "call-unidentified",
      istStaffId: undefined
    });
    const response = await postSignedEvent(payload).expect(202);

    expect(response.body.receipt.session).toMatchObject({
      requiresIdentityResolution: true,
      status: "OFFERED"
    });
    expect(response.body.receipt.session.queueItemId).toBeUndefined();
  });

  it("CCG-CBK-001 creates a callback queue case from a normalized callback request", async () => {
    const payload = event({
      providerEventId: "event-callback",
      externalCallId: "call-callback",
      eventType: "CALLBACK_REQUESTED",
      direction: "OUTBOUND",
      channel: "Callback",
      callbackTargetRef: "employee-contact-primary"
    });
    const response = await postSignedEvent(payload).expect(202);

    expect(response.body.receipt.session).toMatchObject({
      channel: "Callback",
      direction: "OUTBOUND",
      status: "WAITING_CALLBACK"
    });
    expect(response.body.receipt.session.queueItemId).toEqual(expect.any(String));
  });

  it("CCG-REC-001 rejects recording retention before the approved notice is played", async () => {
    const payload = event({
      providerEventId: "event-recording-notice",
      externalCallId: "call-recording-notice",
      eventType: "RECORDING_AVAILABLE",
      recording: {
        purpose: "SERVICE_QUALITY_AND_SAFETY",
        noticePlayed: false,
        noticeVersion: "NOTICE-1",
        consentStatus: "GRANTED",
        storageRegion: "me-central1",
        objectRef: "gs://ist-call-recordings/call-recording-notice.wav",
        ragEligible: false
      }
    });
    const response = await postSignedEvent(payload).expect(409);
    expect(response.body.code).toBe("RECORDING_NOTICE_REQUIRED");
  });

  it("CCG-REC-002 rejects recording retention after consent is declined", async () => {
    const payload = event({
      providerEventId: "event-recording-consent",
      externalCallId: "call-recording-consent",
      eventType: "RECORDING_AVAILABLE",
      recording: {
        purpose: "SERVICE_QUALITY_AND_SAFETY",
        noticePlayed: true,
        noticeVersion: "NOTICE-1",
        consentStatus: "DECLINED",
        storageRegion: "me-central1",
        objectRef: "gs://ist-call-recordings/call-recording-consent.wav",
        ragEligible: false
      }
    });
    const response = await postSignedEvent(payload).expect(409);
    expect(response.body.code).toBe("RECORDING_CONSENT_REQUIRED");
  });

  it("CCG-REC-003 rejects recording metadata outside the GCP Doha region", async () => {
    const payload = {
      ...event({ providerEventId: "event-recording-region", externalCallId: "call-recording-region" }),
      eventType: "RECORDING_AVAILABLE",
      recording: {
        purpose: "SERVICE_QUALITY_AND_SAFETY",
        noticePlayed: true,
        noticeVersion: "NOTICE-1",
        consentStatus: "GRANTED",
        storageRegion: "europe-west1",
        objectRef: "gs://ist-call-recordings/call-recording-region.wav",
        ragEligible: false
      }
    };
    const response = await postSignedEvent(payload).expect(400);
    expect(response.body.code).toBe("CALL_CENTER_EVENT_INVALID");
  });

  it("CCG-REC-004 rejects attempts to make a raw recording eligible for clinical RAG", async () => {
    const payload = {
      ...event({ providerEventId: "event-recording-rag", externalCallId: "call-recording-rag" }),
      eventType: "RECORDING_AVAILABLE",
      recording: {
        purpose: "SERVICE_QUALITY_AND_SAFETY",
        noticePlayed: true,
        noticeVersion: "NOTICE-1",
        consentStatus: "GRANTED",
        storageRegion: "me-central1",
        objectRef: "gs://ist-call-recordings/call-recording-rag.wav",
        ragEligible: true
      }
    };
    const response = await postSignedEvent(payload).expect(400);
    expect(response.body.code).toBe("CALL_CENTER_EVENT_INVALID");
  });

  it("CCG-PHI-001 exposes only a masked ANI through the operational session API", async () => {
    await postSignedEvent(event()).expect(202);
    const integrationAdmin = await agentFor("integration@irisstar.tech", "integration_administrator");
    const response = await integrationAdmin.get("/api/v1/call-center/sessions").expect(200);

    expect(response.body.sessions[0].aniMasked).toBe("+97******234");
    expect(JSON.stringify(response.body)).not.toContain("+97455501234");
  });

  it("CCG-CMD-001 atomically claims and answers an incoming queue call", async () => {
    const nurse = await agentFor("nurse@irisstar.tech", "remote_triage_nurse");
    const response = await nurse
      .post("/api/v1/call-center/queue/case-10002/command")
      .send({ action: "ANSWER", provider: "dry-run" })
      .expect(200);

    expect(response.body.item).toMatchObject({
      id: "case-10002",
      lockedBy: "usr_nurse_10001",
      status: "IN_PROCESS"
    });
    expect(response.body.call).toMatchObject({ status: "CONNECTED", channel: "Phone" });
  });

  it("CCG-CMD-002 connects a callback request with an outbound call session", async () => {
    const payload = event({
      providerEventId: "event-callback-command",
      externalCallId: "call-callback-command",
      eventType: "CALLBACK_REQUESTED",
      direction: "OUTBOUND",
      channel: "Callback",
      callbackTargetRef: "employee-contact-primary"
    });
    const offered = await postSignedEvent(payload).expect(202);
    const nurse = await agentFor("nurse@irisstar.tech", "remote_triage_nurse");
    const response = await nurse
      .post(`/api/v1/call-center/queue/${offered.body.receipt.session.queueItemId}/command`)
      .send({ action: "START_CALLBACK", provider: "dry-run" })
      .expect(200);

    expect(response.body.call).toMatchObject({
      direction: "OUTBOUND",
      channel: "Callback",
      status: "CONNECTED"
    });
  });

  it("CCG-FAIL-001 does not take a queue lock when the requested adapter is not configured", async () => {
    const nurse = await agentFor("nurse@irisstar.tech", "remote_triage_nurse");
    const rejected = await nurse
      .post("/api/v1/call-center/queue/case-10002/command")
      .send({ action: "ANSWER", provider: "not-configured" })
      .expect(503);
    expect(rejected.body.code).toBe("CALL_CENTER_ADAPTER_UNAVAILABLE");

    const item = await nurse.get("/api/v1/queue/case-10002").expect(200);
    expect(item.body.item.lockedBy).toBeUndefined();
  });

  it("CCG-FAIL-002 releases the queue lock when a configured provider rejects the command", async () => {
    const rejectingAdapter: CallCenterAdapter = {
      key: "rejecting",
      displayName: "Rejecting test adapter",
      async execute() {
        return {
          accepted: false,
          providerCommandId: "rejecting-command-1",
          status: "FAILED",
          occurredAtIso: "2026-07-17T08:31:00.000Z",
          failureCode: "PROVIDER_BUSY"
        };
      },
      async health() {
        return { ok: false, detail: "Provider is intentionally unavailable for the rollback test." };
      }
    };
    registerCallCenterAdapter(rejectingAdapter);

    const nurse = await agentFor("nurse@irisstar.tech", "remote_triage_nurse");
    const rejected = await nurse
      .post("/api/v1/call-center/queue/case-10002/command")
      .send({ action: "ANSWER", provider: "rejecting" })
      .expect(502);
    expect(rejected.body.code).toBe("PROVIDER_BUSY");

    const item = await nurse.get("/api/v1/queue/case-10002").expect(200);
    expect(item.body.item.lockedBy).toBeUndefined();
  });

  it("CCG-RBAC-001 denies intake-only users access to call-control commands", async () => {
    const intake = await agentFor("intake@irisstar.tech", "call_intake_coordinator");
    await intake
      .post("/api/v1/call-center/queue/case-10002/command")
      .send({ action: "ANSWER", provider: "dry-run" })
      .expect(403);
  });

  it("CCG-OPS-001 reports the active provider, persistence mode, and recording boundary", async () => {
    const integrationAdmin = await agentFor("integration@irisstar.tech", "integration_administrator");
    const response = await integrationAdmin.get("/api/v1/call-center/status").expect(200);

    expect(response.body.gateway).toMatchObject({
      architecture: "provider-neutral-call-center-gateway",
      configuredProvider: "dry-run",
      recordingRegion: "me-central1",
      rawRecordingRagEligible: false
    });
    expect(response.body.gateway.providers).toEqual(
      expect.arrayContaining([expect.objectContaining({ key: "dry-run", ok: true })])
    );
  });
});
