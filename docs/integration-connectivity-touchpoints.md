# Integration Connectivity Touchpoints

_Closes NFR-176 ("share the detailed integration touch points with QR
applications and the connectivity requirements for this integration based on
the frequency, data size etc."). This documents every real integration
touchpoint that exists in the codebase today - nothing aspirational or
planned. QR's own network/security team should use this to scope firewall
rules, egress allowlisting, and expected traffic volume._

## 1. Twilio (voice/SMS/WhatsApp) - inbound webhook

- **Direction:** Inbound (Twilio → this application).
- **Endpoint:** `POST /api/v1/integrations/call-center` (`src/services/callCenterGateway.ts`).
- **Protocol/format:** HTTPS, `application/x-www-form-urlencoded` (Twilio's
  standard webhook body format).
- **Authentication:** HMAC-SHA1 signature verification against
  `TWILIO_AUTH_TOKEN` (`verifyInbound()`, `src/services/communicationAdapters.ts`) -
  requests without a valid signature are rejected before any processing.
- **Frequency:** Event-driven, one request per real inbound call/SMS/WhatsApp
  event - not polled or batched.
- **Data size:** Small - a single call/message event's metadata (from/to,
  body text, optional media URLs), typically a few KB per request.

## 2. Twilio (voice/SMS/WhatsApp) - outbound send

- **Direction:** Outbound (this application → Twilio's REST API).
- **Endpoint:** `https://api.twilio.com/2010-04-01/Accounts/{sid}/Messages.json`.
- **Protocol/format:** HTTPS REST, `application/x-www-form-urlencoded`.
- **Authentication:** HTTP Basic Auth (`TWILIO_ACCOUNT_SID`/`TWILIO_AUTH_TOKEN`).
- **Frequency:** Event-driven, one request per outbound SMS/WhatsApp message
  a nurse/coordinator sends.
- **Resiliency:** Retries a transient failure (network error/5xx) up to 3
  attempts with exponential backoff (`src/utils/httpRetry.ts`) - a 4xx is
  never retried.
- **Data size:** Small - a single message payload, typically under 1 KB.

## 3. EMR/FHIR writeback (Cerner Millennium / Epic)

- **Direction:** Outbound (this application → the target EMR's FHIR
  DocumentReference endpoint).
- **Endpoint:** Configured per environment via `*_FHIR_BASE_URL`/
  `EMR_BASE_URL` env vars (`src/integration/fhirWriteback.ts`) - routes to
  Cerner Millennium (HMC/PHCC) for staff age ≥18, Epic (Sidra) for
  dependents <18.
- **Protocol/format:** HTTPS REST, FHIR R4 `application/fhir+json`, a
  `DocumentReference` resource containing the base64-encoded bilingual
  SOAP/SBAR clinical note as an HTML attachment.
- **Authentication:** Bearer token (`*_ACCESS_TOKEN`/`FHIR_ACCESS_TOKEN` env vars).
- **Frequency:** Event-driven, one request per completed triage encounter
  where writeback is triggered (dry-run vs. live mode is configurable via
  `FHIR_WRITEBACK_MODE`).
- **Resiliency:** Retries a transient failure (network error/5xx) up to 3
  attempts with exponential backoff; a 4xx is never retried.
- **Data size:** Small-to-moderate - a single clinical note (typically a few
  KB of HTML-encoded text) plus FHIR resource metadata.

## 4. QHIE consent verification

- **Direction:** Outbound (this application → QHIE's FHIR Consent endpoint).
- **Endpoint:** `QHIE_BASE_URL`/`QHIE_FHIR_BASE_URL` env var, `Consent` FHIR resource.
- **Protocol/format:** HTTPS REST, FHIR R4 `application/fhir+json`, a GET
  request filtered by patient.
- **Authentication:** Bearer token (`QHIE_ACCESS_TOKEN`).
- **Frequency:** Event-driven, one request per EMR writeback attempt (called
  immediately before the writeback itself, to confirm active patient consent).
- **Data size:** Small - a single Consent resource query/response.

## 5. Microsoft Graph (outbound email)

- **Direction:** Outbound (this application → Microsoft Graph's `sendMail` API).
- **Endpoint:** `https://graph.microsoft.com/v1.0/users/{mailbox}/sendMail`,
  plus `https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token` for
  OAuth2 client-credentials token exchange (`src/services/communicationAdapters.ts`).
- **Protocol/format:** HTTPS REST, `application/json`.
- **Authentication:** OAuth2 client-credentials grant (`MS_GRAPH_TENANT_ID`/
  `MS_GRAPH_CLIENT_ID`/`MS_GRAPH_CLIENT_SECRET`), token cached and refreshed
  automatically.
- **Frequency:** Event-driven, one request per outbound CCP email approval
  and (optionally) once per month for the SLI/SLO report
  (`scripts/generateMonthlySliReport.mjs`).
- **Resiliency:** Retries a transient failure (network error/5xx) up to 3
  attempts with exponential backoff.
- **Data size:** Small - a single email's subject/body, typically under 5 KB.

## 6. HRMS/EMR staff-and-dependent lookup - simulation only, no live connectivity today

- **Real status:** `src/services/hrmsOracleAdapter.ts` reads a locally
  generated Oracle-Fusion-HCM-shaped JSON fixture
  (`data/generated/ist_qatar_seed_data.json`) - there is **no live outbound
  HTTP call to a real Oracle Fusion HCM instance anywhere in this codebase**.
  `docs/oracle-fusion-hcm-integration.md` documents the intended real
  integration plan and REST collection shape (matching Oracle's genuine
  field names) that a live adapter would use, but it has not been built.
- **Why this matters for connectivity planning:** there is currently no
  network/firewall requirement for this integration to plan for - if/when a
  live Oracle Fusion HCM connection is built, it would need its own
  connectivity spec added here.

## 7. Google Cloud Monitoring / Logging - platform-internal, not a QR-facing integration

Metrics, uptime checks, log-based alerting, and the Cloud Logging → Pub/Sub
SIEM export path (`docs/siem-integration-readiness.md`) are internal to the
GCP project this application runs in - not a connection QR's own network
needs to allowlist, since none of it crosses into QR-controlled
infrastructure today.

## What this does not cover

- A live connection to QR's own network/systems - no such integration exists
  in this codebase today (see item 6 above for the closest example, HRMS,
  which remains simulation-only).
- Formal data-size/frequency SLAs negotiated with QR - these are honest,
  real estimates based on what each integration actually sends today, not a
  QR-agreed contractual specification.
