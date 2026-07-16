import request from "supertest";
import { createApp } from "../src/app.js";
import {
  buildCernerDocumentReference,
  buildEpicDocumentReference,
  encodeSbarNote,
  verifyPatientConsent
} from "../src/integration/fhirWriteback.js";

const TEST_ADMIN_PASSWORD = "TestAdminPassword!2026";

describe("EMR/FHIR writeback gateway", () => {
  const originalEnv = { ...process.env };
  const originalFetch = global.fetch;

  afterEach(() => {
    process.env = { ...originalEnv };
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it("encodes the bilingual SBAR note as safe HTML base64", () => {
    const encoded = encodeSbarNote("SBAR\n<script>alert('x')</script>");
    const decoded = Buffer.from(encoded, "base64").toString("utf8");

    expect(decoded).toContain("<!doctype html>");
    expect(decoded).toContain("IST Tech Tele-Triage SBAR Note");
    expect(decoded).toContain("&lt;script&gt;alert(&#39;x&#39;)&lt;/script&gt;");
  });

  it("builds the Cerner Millennium DocumentReference as a final progress note", () => {
    const payload = buildCernerDocumentReference("28163400000", "enc-100", "triage-nurse-1", "YmFzZTY0");

    expect(payload).toMatchObject({
      resourceType: "DocumentReference",
      status: "current",
      docStatus: "final",
      type: {
        coding: [expect.objectContaining({ system: "http://loinc.org", code: "11506-3" })]
      },
      subject: {
        reference: "Patient/28163400000",
        identifier: expect.objectContaining({
          system: "https://fhir.moph.gov.qa/CodeSystem/IdentifierTypes",
          value: "28163400000"
        })
      },
      context: {
        encounter: [expect.objectContaining({ reference: "Encounter/enc-100" })]
      }
    });
    expect(payload.content[0]?.attachment.contentType).toBe("text/html;charset=utf-8");
  });

  it("builds the Epic Sidra DocumentReference as a draft clinical nurse note", () => {
    const payload = buildEpicDocumentReference("28163400000", "enc-child", "remote-triage-nurse", "YmFzZTY0", true);

    expect(payload.docStatus).toBe("preliminary");
    expect(payload.category?.[0]?.coding[0]).toMatchObject({ code: "clinical-note" });
    expect(payload.type.coding[0]).toMatchObject({ system: "http://loinc.org", code: "34746-8" });
  });

  it("verifies active QHIE consent from a FHIR Bundle response", async () => {
    process.env.MOCK_MODE = "false";
    process.env.QHIE_BASE_URL = "https://qhie.example/fhir";
    global.fetch = jest.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        resourceType: "Bundle",
        entry: [{ resource: { resourceType: "Consent", status: "active" } }]
      })
    })) as unknown as typeof fetch;

    await expect(verifyPatientConsent("28163400000", "token")).resolves.toBe(true);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: "/fhir/Consent" }),
      expect.objectContaining({
        headers: expect.objectContaining({ authorization: "Bearer token" })
      })
    );
  });

  it("exposes an authenticated dry-run writeback endpoint in mock mode", async () => {
    process.env.MOCK_MODE = "true";
    process.env.ADMIN_PASSWORD = TEST_ADMIN_PASSWORD;
    const app = createApp();
    const agent = request.agent(app);

    const login = await agent
      .post("/api/v1/auth/login")
      .send({
        username: "nurse@irisstar.tech",
        password: TEST_ADMIN_PASSWORD,
        simulateRole: "remote_triage_nurse"
      })
      .expect(200);

    expect(login.body.accessToken).toEqual(expect.any(String));

    const response = await agent
      .post("/api/v1/emr/writeback/enc-mock-001")
      .send({ dryRun: true, patientId: "28163400000", practitionerId: "remote-triage-nurse" })
      .expect(200);

    expect(response.body).toMatchObject({
      encounterId: "enc-mock-001",
      status: "dry-run",
      target: "CERNER_MILLENNIUM",
      consentChecked: true,
      consentGranted: true,
      fallback: "none"
    });
    expect(response.body.payloadSummary).toMatchObject({
      resourceType: "DocumentReference",
      docStatus: "final",
      typeCode: "11506-3"
    });
  });
});
