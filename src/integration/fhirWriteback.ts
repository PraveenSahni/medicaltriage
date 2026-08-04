import type {
  AcuityDispositionCode,
  OverrideStatusFlag,
  Prisma,
  TriageSeverity
} from "@prisma/client";
import { isMockMode, shouldUseDatabasePersistence } from "../config/runtime.js";
import { prisma } from "../db.js";
import { assertHumanApprovalForExport } from "../services/safetyKernel.js";
import { organizationWhereClause } from "../services/tenantScope.js";
import type { AuthenticatedSession } from "../types/security.js";

export const MOPH_ADDRESS_BUILDING_NUMBER_EXTENSION =
  "https://fhir.moph.gov.qa/StructureDefinition/AddressBuildingNumber";
export const MOPH_ADDRESS_STREET_NUMBER_EXTENSION =
  "https://fhir.moph.gov.qa/StructureDefinition/AddressStreetNumber";
export const MOPH_IDENTIFIER_TYPE_SYSTEM = "https://fhir.moph.gov.qa/CodeSystem/IdentifierTypes";
export const LOINC_SYSTEM = "http://loinc.org";
export const FHIR_JSON_CONTENT_TYPE = "application/fhir+json";

type FhirCoding = {
  system: string;
  code: string;
  display?: string;
};

type FhirCodeableConcept = {
  coding: FhirCoding[];
  text?: string;
};

type FhirReference = {
  reference: string;
  display?: string;
  identifier?: {
    system: string;
    value: string;
  };
};

export type FhirDocumentReference = {
  resourceType: "DocumentReference";
  status: "current";
  docStatus: "preliminary" | "final";
  identifier: Array<{ system: string; value: string }>;
  category?: FhirCodeableConcept[];
  type: FhirCodeableConcept;
  subject: FhirReference;
  date: string;
  author: FhirReference[];
  authenticator?: FhirReference;
  custodian?: { display: string };
  content: Array<{
    attachment: {
      contentType: "text/html;charset=utf-8";
      language: "en-QA";
      data: string;
      title: string;
      creation: string;
    };
  }>;
  context: {
    encounter: FhirReference[];
    facilityType?: FhirCodeableConcept;
  };
  securityLabel: FhirCodeableConcept[];
};

export type FhirDestination = "CERNER_MILLENNIUM" | "EPIC_SIDRA";
export type WritebackStatus = "dry-run" | "sent" | "consent-denied" | "fallback-clipboard" | "failed";

export type ExecuteWritebackOptions = {
  isDraft?: boolean;
  practitionerId?: string;
  patientId?: string;
  qhieAccessToken?: string;
  emrAccessToken?: string;
  dryRun?: boolean;
  // Closes part of NFR-116/117/150 (request-ID propagation across service
  // boundaries): threaded from the inbound request's own correlation id
  // (src/middleware/requestId.ts) into the outbound QHIE/EMR calls below, so
  // a single request can be traced through this app's own logs AND into
  // whatever the downstream FHIR endpoint logs against the same header.
  requestId?: string;
};

export type WritebackResult = {
  encounterId: string;
  status: WritebackStatus;
  target: FhirDestination;
  endpoint: string;
  consentChecked: boolean;
  consentGranted: boolean;
  fallback: "none" | "clipboard";
  auditPersisted: boolean;
  payloadSummary: {
    resourceType: "DocumentReference";
    docStatus: "preliminary" | "final";
    typeCode: string;
    categoryCodes: string[];
    payloadSizeBytes: number;
    attachmentSizeBytes: number;
  };
  providerResponse?: {
    status: number;
    resourceId?: string;
  };
  message: string;
};

type EncounterForWriteback = Awaited<ReturnType<typeof loadEncounterForWriteback>>;
type NoteSource = {
  id: string;
  finalDispositionCode: AcuityDispositionCode;
  clipboardPayload: unknown;
};

function jsonValue(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function endpointBaseFor(destination: FhirDestination): string | undefined {
  if (destination === "EPIC_SIDRA") {
    return process.env.SIDRA_EPIC_FHIR_BASE_URL ?? process.env.EPIC_FHIR_BASE_URL ?? process.env.FHIR_BASE_URL;
  }

  return (
    process.env.HMC_CERNER_FHIR_BASE_URL ??
    process.env.PHCC_CERNER_FHIR_BASE_URL ??
    process.env.CERNER_FHIR_BASE_URL ??
    process.env.ORACLE_HEALTH_BASE_URL ??
    process.env.EMR_BASE_URL ??
    process.env.FHIR_BASE_URL
  );
}

function writebackEndpoint(destination: FhirDestination): string {
  const base = endpointBaseFor(destination);
  if (!base) {
    if (isMockMode()) {
      return `mock://${destination}/DocumentReference`;
    }
    throw new Error(`FHIR base URL is required before live ${destination} writeback.`);
  }

  return new URL("DocumentReference", base.endsWith("/") ? base : `${base}/`).toString();
}

function tokenFor(destination: FhirDestination, explicitToken?: string): string | undefined {
  if (explicitToken) {
    return explicitToken;
  }
  if (destination === "EPIC_SIDRA") {
    return process.env.SIDRA_EPIC_ACCESS_TOKEN ?? process.env.EPIC_FHIR_ACCESS_TOKEN ?? process.env.FHIR_ACCESS_TOKEN;
  }
  return process.env.HMC_CERNER_ACCESS_TOKEN ?? process.env.CERNER_FHIR_ACCESS_TOKEN ?? process.env.FHIR_ACCESS_TOKEN;
}

function qhieBaseUrl(): string | undefined {
  return process.env.QHIE_FHIR_BASE_URL ?? process.env.QHIE_BASE_URL;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function htmlFromSbar(sbarNote: string): string {
  const escaped = escapeHtml(sbarNote);
  return [
    "<!doctype html>",
    '<html lang="en-QA">',
    "<head>",
    '<meta charset="utf-8" />',
    "<title>IST Tech Tele-Triage SBAR Note</title>",
    "</head>",
    "<body>",
    "<article>",
    "<h1>IST Tech Tele-Triage SBAR Note</h1>",
    "<pre>",
    escaped,
    "</pre>",
    "</article>",
    "</body>",
    "</html>"
  ].join("");
}

export function encodeSbarNote(sbarNote: string): string {
  return Buffer.from(htmlFromSbar(sbarNote), "utf8").toString("base64");
}

function patientReference(patientId: string): FhirReference {
  return {
    reference: `Patient/${patientId}`,
    identifier: {
      system: MOPH_IDENTIFIER_TYPE_SYSTEM,
      value: patientId
    }
  };
}

function practitionerReference(practitionerId: string): FhirReference {
  return {
    reference: `Practitioner/${practitionerId}`,
    display: practitionerId
  };
}

function confidentialityLabels(): FhirCodeableConcept[] {
  return [
    {
      coding: [
        {
          system: "http://terminology.hl7.org/CodeSystem/v3-Confidentiality",
          code: "R",
          display: "Restricted"
        }
      ],
      text: "Restricted clinical tele-triage note"
    }
  ];
}

function clinicalNoteAttachment(base64Data: string, createdAt: string) {
  return {
    attachment: {
      contentType: "text/html;charset=utf-8" as const,
      language: "en-QA" as const,
      data: base64Data,
      title: "Bilingual SOAP/SBAR tele-triage note",
      creation: createdAt
    }
  };
}

export function buildCernerDocumentReference(
  patientId: string,
  encounterId: string,
  practitionerId: string,
  base64Data: string
): FhirDocumentReference {
  const now = new Date().toISOString();
  const practitioner = practitionerReference(practitionerId);
  return {
    resourceType: "DocumentReference",
    status: "current",
    docStatus: "final",
    identifier: [{ system: "https://ist.tech.qa/fhir/document-reference", value: `${encounterId}-sbar` }],
    category: [
      {
        coding: [{ system: "urn:cerner:code-set:72", code: "PROGRESS_NOTE", display: "Progress Note" }],
        text: "Cerner Millennium clinical note"
      }
    ],
    type: {
      coding: [{ system: LOINC_SYSTEM, code: "11506-3", display: "Progress note" }],
      text: "Progress Note"
    },
    subject: patientReference(patientId),
    date: now,
    author: [practitioner],
    authenticator: practitioner,
    custodian: { display: "HMC / PHCC Oracle Cerner Millennium" },
    content: [clinicalNoteAttachment(base64Data, now)],
    context: {
      encounter: [{ reference: `Encounter/${encounterId}` }],
      facilityType: {
        coding: [{ system: "http://terminology.hl7.org/CodeSystem/v3-RoleCode", code: "HOSP", display: "Hospital" }]
      }
    },
    securityLabel: confidentialityLabels()
  };
}

function epicNoteTypeFor(practitionerId: string): FhirCodeableConcept {
  const normalized = practitionerId.toLowerCase();
  const nurseLike = normalized.includes("nurse") || normalized.includes("rn") || normalized.includes("triage");
  return nurseLike
    ? {
        coding: [{ system: LOINC_SYSTEM, code: "34746-8", display: "Nurse note" }],
        text: "Nurse Note"
      }
    : {
        coding: [{ system: LOINC_SYSTEM, code: "34111-5", display: "Emergency department Note" }],
        text: "Emergency Department Note"
      };
}

export function buildEpicDocumentReference(
  patientId: string,
  encounterId: string,
  practitionerId: string,
  base64Data: string,
  isDraft: boolean
): FhirDocumentReference {
  const now = new Date().toISOString();
  const practitioner = practitionerReference(practitionerId);
  return {
    resourceType: "DocumentReference",
    status: "current",
    docStatus: isDraft ? "preliminary" : "final",
    identifier: [{ system: "https://ist.tech.qa/fhir/document-reference", value: `${encounterId}-sbar` }],
    category: [
      {
        coding: [
          {
            system: "http://hl7.org/fhir/us/core/CodeSystem/us-core-documentreference-category",
            code: "clinical-note",
            display: "Clinical Note"
          }
        ],
        text: "Clinical Note"
      }
    ],
    type: epicNoteTypeFor(practitionerId),
    subject: patientReference(patientId),
    date: now,
    author: [practitioner],
    authenticator: isDraft ? undefined : practitioner,
    custodian: { display: "Sidra Medicine Epic" },
    content: [clinicalNoteAttachment(base64Data, now)],
    context: {
      encounter: [{ reference: `Encounter/${encounterId}` }],
      facilityType: {
        coding: [{ system: "http://terminology.hl7.org/CodeSystem/v3-RoleCode", code: "PEDHOSP", display: "Pediatric hospital" }]
      }
    },
    securityLabel: confidentialityLabels()
  };
}

export async function verifyPatientConsent(patientId: string, accessToken: string, requestId?: string): Promise<boolean> {
  const baseUrl = qhieBaseUrl();
  if (!baseUrl || !accessToken) {
    if (isMockMode()) {
      return true;
    }
    throw new Error("QHIE consent verification requires QHIE_BASE_URL and QHIE_ACCESS_TOKEN in live mode.");
  }

  const consentUrl = new URL("Consent", baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`);
  consentUrl.searchParams.set("patient", patientId);
  const response = await fetch(consentUrl, {
    method: "GET",
    headers: {
      accept: FHIR_JSON_CONTENT_TYPE,
      authorization: `Bearer ${accessToken}`,
      ...(requestId ? { "x-request-id": requestId } : {})
    }
  });

  if (!response.ok) {
    throw new Error(`QHIE consent check failed with HTTP ${response.status}.`);
  }

  const payload = (await response.json()) as { resourceType?: string; status?: string; entry?: unknown[] };
  if (payload.resourceType === "Consent") {
    return payload.status === "active";
  }

  return Array.isArray(payload.entry)
    ? payload.entry.some((entry) => {
        const resource = (entry as { resource?: { resourceType?: string; status?: string } }).resource;
        return resource?.resourceType === "Consent" && resource.status === "active";
      })
    : false;
}

export const checkQHIEConsent = verifyPatientConsent;

async function loadEncounterForWriteback(encounterId: string, session?: AuthenticatedSession) {
  if (!shouldUseDatabasePersistence()) {
    return undefined;
  }

  // Tenant-scoped: a user can only trigger EMR writeback for encounters in
  // their own organization (previously findUnique by id alone - cross-tenant
  // writeback was possible, per the SOC 2 review). A cross-tenant id fails
  // identically to a nonexistent one.
  return prisma.aviationTriageEncounter.findFirst({
    where: { id: encounterId, ...(organizationWhereClause(session) ?? {}) },
    include: {
      staffMember: true,
      dependent: true
    }
  });
}

function ageFromDateOfBirth(dateOfBirth?: Date | null): number | undefined {
  if (!dateOfBirth) {
    return undefined;
  }
  const today = new Date();
  let age = today.getUTCFullYear() - dateOfBirth.getUTCFullYear();
  const monthDelta = today.getUTCMonth() - dateOfBirth.getUTCMonth();
  if (monthDelta < 0 || (monthDelta === 0 && today.getUTCDate() < dateOfBirth.getUTCDate())) {
    age -= 1;
  }
  return age;
}

function patientAgeYears(encounter: NonNullable<EncounterForWriteback>): number | undefined {
  if (encounter.dependent) {
    return ageFromDateOfBirth(encounter.dependent.dateOfBirth) ?? encounter.dependent.age;
  }
  return ageFromDateOfBirth(encounter.staffMember.dateOfBirth);
}

function dispositionSeverity(dispositionCode: AcuityDispositionCode): TriageSeverity {
  if (dispositionCode === "SIDRA_PEDIATRIC_ED" || dispositionCode === "HMC_EMERGENCY_DEPARTMENT") {
    return "EMERGENCY";
  }
  if (
    dispositionCode === "HMC_URGENT_REVIEW" ||
    dispositionCode === "PHCC_URGENT_CARE_OR_TELECONSULT" ||
    dispositionCode === "OUTSTATION_TELECONSULT_ESCALATION"
  ) {
    return "URGENT";
  }
  if (dispositionCode === "SELF_CARE_WITH_CALLBACK_PRECAUTIONS") {
    return "SELF_CARE";
  }
  return "ROUTINE";
}

function noteFromEncounter(encounter: NoteSource): string {
  const clipboard = encounter.clipboardPayload as Record<string, unknown> | null;
  if (typeof clipboard?.notePayload === "string") {
    return clipboard.notePayload;
  }
  if (typeof clipboard?.clipboardText === "string") {
    return clipboard.clipboardText;
  }
  return [
    "# IST Tech Tele-Triage SBAR Note",
    `Encounter: ${encounter.id}`,
    `Disposition: ${encounter.finalDispositionCode}`,
    "SBAR note content was not available in the persisted clipboard payload."
  ].join("\n");
}

function mockEncounter(encounterId: string) {
  return {
    id: encounterId,
    staffMember: {
      istStaffId: "IST-MOCK-STAFF",
      dateOfBirth: new Date("1990-01-01T00:00:00.000Z")
    },
    dependent: null,
    nurseId: "remote-triage-nurse",
    finalDispositionCode: "HMC_URGENT_REVIEW" as AcuityDispositionCode,
    clipboardPayload: {
      notePayload: "# IST Tech Tele-Triage SBAR Note\nDry-run clinical handoff payload for EMR/FHIR writeback validation."
    }
  };
}

function resolvePatientId(encounter: NonNullable<EncounterForWriteback> | ReturnType<typeof mockEncounter>, explicit?: string): string {
  if (explicit) {
    return explicit;
  }
  const configured = process.env.FHIR_TEST_PATIENT_QID ?? process.env.FHIR_TEST_PATIENT_ID;
  if (configured) {
    return configured;
  }
  if (isMockMode()) {
    return encounter.dependent?.id ?? encounter.staffMember.istStaffId;
  }
  throw new Error("Live FHIR writeback requires a verified QID/EMR patient identifier mapping.");
}

function practitionerIdFor(encounter: NonNullable<EncounterForWriteback> | ReturnType<typeof mockEncounter>, explicit?: string): string {
  const practitionerId = explicit ?? process.env.FHIR_PRACTITIONER_ID ?? encounter.nurseId;
  if (!practitionerId && !isMockMode()) {
    throw new Error("Live FHIR writeback requires FHIR_PRACTITIONER_ID.");
  }
  return practitionerId || "remote-triage-nurse";
}

function summarizePayload(payload: FhirDocumentReference) {
  const payloadText = JSON.stringify(payload);
  const attachmentData = payload.content[0]?.attachment.data ?? "";
  return {
    resourceType: payload.resourceType,
    docStatus: payload.docStatus,
    typeCode: payload.type.coding[0]?.code ?? "UNKNOWN",
    categoryCodes: (payload.category ?? []).flatMap((category) => category.coding.map((coding) => coding.code)),
    payloadSizeBytes: Buffer.byteLength(payloadText, "utf8"),
    attachmentSizeBytes: Buffer.byteLength(attachmentData, "utf8")
  };
}

async function recordTransmissionAudit(args: {
  encounterId: string;
  target: FhirDestination;
  endpoint: string;
  status: WritebackStatus;
  success: boolean;
  payloadSummary: WritebackResult["payloadSummary"];
  failureReason?: string;
}): Promise<boolean> {
  if (!shouldUseDatabasePersistence()) {
    return false;
  }

  await prisma.auditEvent.create({
    data: {
      timestamp: new Date(),
      action: "EMR_FHIR_WRITEBACK",
      module: "Integration",
      resource: "DocumentReference",
      recordReference: args.encounterId,
      purpose: "Nurse-approved tele-triage clinical document handoff",
      success: args.success,
      riskLevel: args.success ? "medium" : "high",
      metadata: jsonValue({
        target: args.target,
        endpoint: args.endpoint,
        status: args.status,
        payloadSizeBytes: args.payloadSummary.payloadSizeBytes,
        attachmentSizeBytes: args.payloadSummary.attachmentSizeBytes,
        docStatus: args.payloadSummary.docStatus,
        typeCode: args.payloadSummary.typeCode,
        failureReason: args.failureReason
      })
    }
  });
  return true;
}

async function recordSafetyFailure(args: {
  encounter: NonNullable<EncounterForWriteback>;
  target: FhirDestination;
  endpoint: string;
  failureReason: string;
}) {
  if (!shouldUseDatabasePersistence()) {
    return;
  }

  const event = {
    type: "EMR_FHIR_WRITEBACK_FAILURE",
    target: args.target,
    endpoint: args.endpoint,
    failureReason: args.failureReason,
    fallback: "clipboard",
    createdAtIso: new Date().toISOString()
  };
  const existing = await prisma.safetyAuditDeviationLog.findUnique({
    where: { encounterId: args.encounter.id }
  });
  if (existing) {
    const current = existing.explainabilityTrace as unknown;
    const nextTrace = Array.isArray(current) ? [...current, event] : [current, event].filter(Boolean);
    await prisma.safetyAuditDeviationLog.update({
      where: { encounterId: args.encounter.id },
      data: { explainabilityTrace: jsonValue(nextTrace) }
    });
    return;
  }

  await prisma.safetyAuditDeviationLog.create({
    data: {
      encounterId: args.encounter.id,
      originalAiRecommendation: "FHIR_WRITEBACK",
      nurseOverrideRationale: "FHIR writeback failed; fallback to clipboard handoff required.",
      rulesEngineSeverity: dispositionSeverity(args.encounter.finalDispositionCode),
      overrideStatusFlag: "REVIEW_REQUIRED" as OverrideStatusFlag,
      explainabilityTrace: jsonValue([event])
    }
  });
}

function writebackMode(options: ExecuteWritebackOptions): "dry-run" | "live" {
  if (options.dryRun || isMockMode()) {
    return "dry-run";
  }
  return (process.env.FHIR_WRITEBACK_MODE ?? "dry-run").toLowerCase() === "live" ? "live" : "dry-run";
}

const WRITEBACK_MAX_ATTEMPTS = 3;
const WRITEBACK_RETRY_BASE_DELAY_MS = 250;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Closes NFR-112 (Resiliency) - retries a transient failure (network error or
// 5xx, e.g. the EMR endpoint briefly unavailable) with exponential backoff.
// Never retries a 4xx: a bad token or malformed payload will fail identically
// on every attempt, so retrying it only delays surfacing a real error.
async function postDocumentReferenceOnce(endpoint: string, token: string, payload: FhirDocumentReference, requestId?: string) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      accept: FHIR_JSON_CONTENT_TYPE,
      "content-type": FHIR_JSON_CONTENT_TYPE,
      ...(requestId ? { "x-request-id": requestId } : {})
    },
    body: JSON.stringify(payload)
  });
  const body = (await response.text()).trim();
  if (!response.ok) {
    const error = new Error(`FHIR DocumentReference POST failed with HTTP ${response.status}: ${body}`) as Error & {
      status?: number;
    };
    error.status = response.status;
    throw error;
  }
  let resourceId: string | undefined;
  try {
    const parsed = JSON.parse(body) as { id?: string };
    resourceId = parsed.id;
  } catch {
    resourceId = response.headers.get("location") ?? undefined;
  }
  return { status: response.status, resourceId };
}

export async function postDocumentReference(endpoint: string, token: string, payload: FhirDocumentReference, requestId?: string) {
  let lastError: unknown;
  for (let attempt = 1; attempt <= WRITEBACK_MAX_ATTEMPTS; attempt++) {
    try {
      return await postDocumentReferenceOnce(endpoint, token, payload, requestId);
    } catch (error) {
      lastError = error;
      const status = (error as { status?: number }).status;
      const isTransient = status === undefined || status >= 500;
      if (!isTransient || attempt === WRITEBACK_MAX_ATTEMPTS) {
        throw error;
      }
      await sleep(WRITEBACK_RETRY_BASE_DELAY_MS * 2 ** (attempt - 1));
    }
  }
  throw lastError;
}

export async function executeWriteback(
  encounterId: string,
  options: ExecuteWritebackOptions = {},
  session?: AuthenticatedSession
): Promise<WritebackResult> {
  const persistedEncounter = await loadEncounterForWriteback(encounterId, session);
  if (!persistedEncounter && shouldUseDatabasePersistence()) {
    throw new Error(`Encounter ${encounterId} was not found for EMR/FHIR writeback.`);
  }
  await assertHumanApprovalForExport(encounterId, "EMR_WRITEBACK");

  const encounter = persistedEncounter ?? mockEncounter(encounterId);
  const ageYears = persistedEncounter ? patientAgeYears(persistedEncounter) : 36;
  if (ageYears === undefined) {
    throw new Error(`Encounter ${encounterId} does not have age context for EMR routing.`);
  }

  const target: FhirDestination = ageYears < 18 ? "EPIC_SIDRA" : "CERNER_MILLENNIUM";
  const endpoint = writebackEndpoint(target);
  const patientId = resolvePatientId(encounter, options.patientId);
  const practitionerId = practitionerIdFor(encounter, options.practitionerId);
  const base64Data = encodeSbarNote(noteFromEncounter(encounter));
  const payload =
    target === "EPIC_SIDRA"
      ? buildEpicDocumentReference(patientId, encounter.id, practitionerId, base64Data, options.isDraft ?? true)
      : buildCernerDocumentReference(patientId, encounter.id, practitionerId, base64Data);
  const payloadSummary = summarizePayload(payload);
  const mode = writebackMode(options);
  const qhieToken = options.qhieAccessToken ?? process.env.QHIE_ACCESS_TOKEN ?? "";
  const consentGranted = await verifyPatientConsent(patientId, qhieToken, options.requestId);

  if (!consentGranted) {
    const auditPersisted = await recordTransmissionAudit({
      encounterId,
      target,
      endpoint,
      status: "consent-denied",
      success: false,
      payloadSummary,
      failureReason: "QHIE consent was not active."
    });
    return {
      encounterId,
      status: "consent-denied",
      target,
      endpoint,
      consentChecked: true,
      consentGranted: false,
      fallback: "clipboard",
      auditPersisted,
      payloadSummary,
      message: "QHIE consent was not active. Fallback to nurse-controlled clipboard handoff."
    };
  }

  if (mode === "dry-run") {
    const auditPersisted = await recordTransmissionAudit({
      encounterId,
      target,
      endpoint,
      status: "dry-run",
      success: true,
      payloadSummary
    });
    return {
      encounterId,
      status: "dry-run",
      target,
      endpoint,
      consentChecked: true,
      consentGranted: true,
      fallback: "none",
      auditPersisted,
      payloadSummary,
      message: "FHIR writeback prepared in dry-run mode. No EMR endpoint was called."
    };
  }

  const emrToken = tokenFor(target, options.emrAccessToken);
  if (!emrToken) {
    throw new Error(`Live ${target} writeback requires an EMR/FHIR access token.`);
  }

  try {
    const providerResponse = await postDocumentReference(endpoint, emrToken, payload, options.requestId);
    const auditPersisted = await recordTransmissionAudit({
      encounterId,
      target,
      endpoint,
      status: "sent",
      success: true,
      payloadSummary
    });
    return {
      encounterId,
      status: "sent",
      target,
      endpoint,
      consentChecked: true,
      consentGranted: true,
      fallback: "none",
      auditPersisted,
      payloadSummary,
      providerResponse,
      message: "FHIR DocumentReference writeback was accepted by the target EMR endpoint."
    };
  } catch (error) {
    const failureReason = error instanceof Error ? error.message : "Unknown FHIR writeback failure.";
    console.error("FHIR writeback failed", {
      encounterId,
      target,
      endpoint,
      failureReason
    });
    if (persistedEncounter) {
      await recordSafetyFailure({ encounter: persistedEncounter, target, endpoint, failureReason });
    }
    const auditPersisted = await recordTransmissionAudit({
      encounterId,
      target,
      endpoint,
      status: "fallback-clipboard",
      success: false,
      payloadSummary,
      failureReason
    });
    return {
      encounterId,
      status: "fallback-clipboard",
      target,
      endpoint,
      consentChecked: true,
      consentGranted: true,
      fallback: "clipboard",
      auditPersisted,
      payloadSummary,
      message: "FHIR writeback failed. Fallback to nurse-controlled clipboard handoff."
    };
  }
}
