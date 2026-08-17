/**
 * Technical/system-architecture Help & Library content, ported verbatim from
 * the richer in-app Help Center (frontend/src/HelpCenter.tsx and
 * frontend/src/components/HelpCenter/*), which is the canonical source these
 * topics originated from. Nothing here is re-derived or paraphrased from
 * scratch - it is the same content, reorganized into this server-rendered
 * page's article format so the standalone /help page carries the complete
 * picture (Library, System Map, Call Flow, Qatar Model, System Integrations,
 * Governance, Security Administration, Test Results) rather than a subset.
 *
 * Where the source text describes a capability as planned, a strategy, a
 * future connector, or "not yet live," that status is preserved as-is -
 * this file does not upgrade any status to "built" or vice versa.
 */

type TopicArticle = {
  id: string;
  title: string;
  body: string; // pre-escaped HTML fragment
};

type TopicGroup = {
  id: string;
  label: string;
  articles: TopicArticle[];
};

function ul(items: string[]): string {
  return `<ul>${items.map((item) => `<li>${item}</li>`).join("")}</ul>`;
}

function ol(items: string[]): string {
  return `<ol>${items.map((item) => `<li>${item}</li>`).join("")}</ol>`;
}

function whatWhyHow(what: string, why: string, how: string[]): string {
  return `<p><strong>What:</strong> ${what}</p><p><strong>Why:</strong> ${why}</p><p><strong>How:</strong></p>${ol(how)}`;
}

export const TECHNICAL_TOPIC_GROUPS: TopicGroup[] = [
  {
    id: "system-map",
    label: "System Map",
    articles: [
      {
        id: "sysmap-stats",
        title: "Operating footprint at a glance",
        body: `
          <p>Core paths: 3 - Nurse triage, CCP follow-up, and administration. Severity levels: 4 - Emergency, Urgent, Routine, Self-care. Local routes: 8 - HMC, Sidra, PHCC, IST teleconsult, self-care. Audit flags: 4 - AI differed, override up, downgrade blocked, final rules.</p>
        `
      },
      {
        id: "sysmap-stages",
        title: "The tele-triage encounter stages",
        body: ol([
          `<strong>Remote intake</strong> - When the call enters the queue, the API validates the staff/dependent relationship against HRMS, calculates age from date of birth, and carries language, location, duty status, and local/outstation context into the nurse workspace.`,
          `<strong>Complaint matching</strong> - The system maps the caller's words to a protocol using chief complaint, symptom keywords, age, sex, mode, and red-flag terms.`,
          `<strong>Acuity rule-out</strong> - Emergency rule-out is reviewed before the assessment path. After that, the assessment tab presents one acuity-ordered question at a time, with emergency-level questions ahead of urgent, routine, and self-care items.`,
          `<strong>Clinical plus aviation context</strong> - The rules combine symptoms with crew role, on-duty state, outstation status, fit-to-fly concern, sickness leave, vaccination reaction, and occupational visit flags.`,
          `<strong>Disposition proposal</strong> - The engine returns severity, destination, rationale, trace, insurance notes, aviation tags, and whether the route is emergency, urgent, teleconsult, clinic, or self-care.`,
          `<strong>Clinician handoff</strong> - The clinician validates the output, documents the decision, copies the SBAR/SOAP note, and opens CCP follow-up for transfer, appointment, callback, or escalation.`
        ]),
      },
      {
        id: "sysmap-decision-contract",
        title: "The tele-triage decision contract",
        body: `
          <p><strong>What the system decides:</strong> It proposes the minimum safe severity, disposition code, care destination, rationale, rule trace, and SBAR payload.</p>
          <p><strong>What the clinician decides:</strong> The clinician confirms, overrides upward when needed, documents clinical judgment, and remains accountable for the final advice.</p>
          <p><strong>What production must connect:</strong> Licensed protocols, live HRMS, insurance, scheduling, EMR/FHIR writeback, audit persistence, and approved Arabic translation.</p>
        `
      },
      {
        id: "sysmap-principles",
        title: "Core system principles",
        body: ul([
          `<strong>Rules-first clinical safety</strong> - The system treats deterministic triage logic as the safety floor. AI can summarize, highlight risks, and flag approved protocol context for nurse review, but it cannot lower a protected high-acuity disposition.`,
          `<strong>Governed MedGemma copilot strategy</strong> - MedGemma is planned as a clinical language copilot for explanation, summarization, translation support, and SBAR drafting. It is not the triage authority; deterministic rules and nurse approval remain the clinical control.`,
          `<strong>STCC-compatible nurse workflow</strong> - The clinical pathway follows the STCC-compatible telehealth pattern: search by chief complaint, work through red-flag questions first, capture rationale, and produce a structured SBAR/SOAP note.`,
          `<strong>Tele-triage encounter engine</strong> - The system supports a remote consultation from auto-validated HRMS identity through symptom capture, protocol matching, acuity rule-out, local routing, clinician validation, and SBAR handoff.`,
          `<strong>CCP employee communication</strong> - CCP means Continuous Communication Pipeline in this solution: one employee index with separate visit/call threads, linked previous communication, consent, callbacks, and audit.`,
          `<strong>SymptomScreen-style access support</strong> - A simplified screening layer is planned for front-desk or call-center staff so non-clinical users can identify urgent concerns without exercising clinical judgment.`,
          `<strong>IST Health localization</strong> - The MVP localizes routing around staff identity, dependents, insurance status, IST medical workflows, HMC/Sidra emergency routes, fit-to-fly gates, outstation review, and sickness validation.`
        ])
      },
      {
        id: "sysmap-clinical-content-benchmark",
        title: "Clinical content strategy benchmark",
        body: `
          <p>The clinical content strategy benchmarks against mature ClearTriage/SymptomScreen practice: licensed, annually reviewed clinical protocols, structured checklists, targeted care advice, role-based workflows, training materials, and continuous quality feedback. Three layers make up the model:</p>
          ${ul([
            "<strong>ClearTriage-style</strong> - licensed nurse triage pathway for comprehensive assessment, clinical documentation, disposition rationale, and care advice.",
            "<strong>SymptomScreen-style</strong> - simplified access-staff screening for urgent red-flag detection and safe routing without requiring non-clinical staff to make clinical judgments.",
            "<strong>IST Health layer</strong> - localized staff/dependent identity, insurance status, aviation medicine rules, Arabic/English operation, and Qatar destination routing."
          ])}
        `
      }
    ]
  },
  {
    id: "call-flow",
    label: "Call Flow",
    articles: [
      {
        id: "callflow-steps",
        title: "The eight-step call workflow",
        body: ol([
          `<strong>Incoming call and HRMS validation</strong> - The call or callback enters the queue with channel, wait time, caller context, staff/dependent relationship, duty status, station, and HRMS-calculated age already validated before nurse triage starts.`,
          `<strong>Opening script and reason for call</strong> - The nurse follows the approved opening script, confirms the reason narrative, and captures the caller's own words without turning the identity step into a manual clinical tab.`,
          `<strong>Keyword search and guideline selection</strong> - The deterministic search layer matches search words, synonyms, age, sex, mode, and red-flag terms to candidate protocols. The nurse remains responsible for selecting or confirming the guideline.`,
          `<strong>Emergency and initial assessment</strong> - Emergency rule-out runs first: low SpO2, abnormal respiratory rate, abnormal heart rate, altered consciousness, pediatric danger signs, severe symptoms, and other red-floor triggers set the minimum safe route.`,
          `<strong>Acuity-ordered triage questions</strong> - After emergency rule-out, the nurse answers one active assessment question at a time from highest acuity to lowest. A Yes fixes the disposition; a No unlocks the next lower-priority question.`,
          `<strong>Disposition and Qatar routing</strong> - The clinical disposition is mapped to a local source of care such as HMC, Sidra, PHCC, IST Health medical review, teleconsult, occupational health, or self-care. Aviation fit-to-fly can restrict but not downgrade care.`,
          `<strong>Care advice and first aid</strong> - Mapped care advice, home-care instructions, callback precautions, first-aid content, and send-later guidance are presented from approved protocol content for nurse review.`,
          `<strong>Closing script, SBAR, and audit</strong> - The nurse closes the call with approved instructions, copies the SBAR/SOAP note, opens CCP follow-up when needed, and leaves an audit trace for safety, governance, and future RAG comparison.`
        ])
      },
      {
        id: "callflow-what-system-never-does",
        title: "What the system never does alone",
        body: `<p>It does not approve sickness leave, clear staff for duty, diagnose a patient, write directly into the EMR, or replace clinical judgment. It prepares evidence and documentation for a governed human decision.</p>`
      }
    ]
  },
  {
    id: "qatar-model",
    label: "Qatar Model",
    articles: [
      {
        id: "qatar-setting",
        title: "Group Health & Medical Services setting",
        body: `<p>The model supports staff and dependents through HIA medical review, Old Airport medical commission pathways, tele-triage hotline operations, HMC emergency routes, Sidra pediatric routing, and PHCC urgent care.</p>`
      },
      {
        id: "qatar-aviation-questions",
        title: "Aviation-specific clinical questions",
        body: `<p>For the IST Health organization context, the requirements call for outstation validation, fit-to-fly review, sickness validation, vaccination reactions, occupational health, mental health triage, travel-related presentations, and staff/dependent workflows.</p>`
      },
      {
        id: "qatar-aviation-rules",
        title: "Custom aviation medical rules",
        body: `
          <p>The platform parses occupational parameters for airport and flight staff, then converts those fields into aviation tags, fit-to-duty controls, and clinician-visible routing evidence.</p>
          ${ul([
            `<strong>Fit-to-Fly:</strong> STCC clinical disposition is evaluated first; Emergency and Urgent outcomes force RESTRICTED until clinician clearance.`,
            `Routine STCC outcomes for safety-sensitive crew remain RESTRICTED; self-care outcomes can still become MEDICAL_REVIEW_REQUIRED when duty, outstation, sickness, or operational symptom triggers are present.`,
            `<strong>Outstation Validation:</strong> station and outstation flags create a teleconsult escalation path and preserve local-care coordination context.`,
            `<strong>Sickness Validation:</strong> the system compiles standardized medical leave telemetry for nurse review instead of automatically approving leave.`,
            `<strong>Vaccine Reactions:</strong> post-vaccination fever, rash, swelling, or related symptoms create structured follow-up and duty-rest review, such as ground-duty only until clinical clearance.`
          ])}
        `
      },
      {
        id: "qatar-routing-matrix",
        title: "Localized care-routing matrix",
        body: `
          <p>Disposition codes map the clinical safety floor to Qatar-specific healthcare destinations while preserving nurse review and local governance ownership.</p>
          ${ul([
            `Emergency pediatric cases route to Sidra Medicine Emergency Department.`,
            `Emergency adult/general cases route to Hamad Medical Corporation (HMC) Emergency Department.`,
            `Urgent and clinic care can route to PHCC urgent care or IST Medical Centre at the HIA Midfield area depending on severity, staff context, and availability.`,
            `Routine and self-care cases coordinate through registered primary care, callback precautions, and approved care-advice content.`
          ])}
        `
      },
      {
        id: "qatar-route-decision-order",
        title: "Route decision order",
        body: ol([
          `Emergency safety floor first: pediatric emergency to Sidra, adult/general or unknown-age emergency to HMC.`,
          `STCC-selected disposition is the clinical source of truth for the care route and care advice.`,
          `Outstation escalation next when the case is not already emergency and remote clinical coordination is needed.`,
          `Aviation gates then decide fit-to-fly status, sickness validation, and occupational or commission visits without downgrading the STCC disposition.`,
          `If no specific route applies, severity falls back to urgent, routine, or self-care pathways.`
        ])
      },
      {
        id: "qatar-disposition-routes",
        title: "The eight disposition routes",
        body: `
          <table class="ref-table">
            <thead><tr><th>Disposition code</th><th>Destination</th><th>Severity band / trigger</th></tr></thead>
            <tbody>
              <tr><td>SIDRA_PEDIATRIC_ED</td><td>Sidra Medicine</td><td>Emergency pediatric - patient under 18 with an Emergency safety floor</td></tr>
              <tr><td>HMC_EMERGENCY_DEPARTMENT</td><td>Hamad General Hospital / nearest HMC Emergency pathway</td><td>Emergency adult/general or unknown-age</td></tr>
              <tr><td>HMC_URGENT_REVIEW</td><td>Hamad Medical Corporation urgent review pathway</td><td>Urgent but not emergency</td></tr>
              <tr><td>IST_HIA_MIDFIELD_MEDICAL_CENTRE</td><td>IST Health Medical Centre - HIA</td><td>Fit-to-fly, sickness, or staff pathway</td></tr>
              <tr><td>IST_OLD_AIRPORT_MEDICAL_COMMISSION</td><td>IST Health Medical - Old Airport medical commission</td><td>Occupational or commission visit</td></tr>
              <tr><td>PHCC_URGENT_CARE_OR_TELECONSULT</td><td>PHCC Urgent Care or IST Health teleconsult</td><td>Routine staff pathway</td></tr>
              <tr><td>OUTSTATION_TELECONSULT_ESCALATION</td><td>IST Health medical teleconsult escalation</td><td>Outstation urgent coordination</td></tr>
              <tr><td>SELF_CARE_WITH_CALLBACK_PRECAUTIONS</td><td>Self-care with callback precautions</td><td>No red flag or urgent trigger, nurse-agreed</td></tr>
            </tbody>
          </table>
          <p>Every route's governance note states the same caveat: destinations and transfer procedures must be confirmed by IST Health clinical governance and local routing policy - this matrix documents the current rule mapping, not an externally certified facility directory.</p>
        `
      }
    ]
  },
  {
    id: "system-integrations",
    label: "System Integrations",
    articles: [
      {
        id: "integ-priority",
        title: "Integration priority (product direction)",
        body: `
          <p>Per current product direction, four integrations are the mandatory backbone of this system, not optional add-ons - each already has real code in this repository (routes, services, and/or Prisma models), and the remaining work is to <strong>wire</strong> them into the live, end-to-end flow rather than to build them from nothing:</p>
          <ol>
            <li><strong>Call Center Gateway</strong> - this is the primary integration: it is where every call actually enters the system. <code>src/services/callCenterGateway.ts</code> and <code>src/routes/callCenterGateway.ts</code> exist with real event/command routes and Prisma-backed <code>CallCenterSession</code>/<code>CallCenterEvent</code> models. The dry-run adapter proves the full contract end-to-end; wiring in a real telephony provider adapter is the remaining step.</li>
            <li><strong>Oracle Fusion HCM (HRMS)</strong> - staff/dependent identity validation is a hard requirement, and the integration layer for it is already built: <code>src/services/hrms.ts</code>, <code>src/services/hrmsOracleAdapter.ts</code>, <code>src/services/hrmsSync.ts</code>, and the <code>POST /api/v1/hrms/sync-users</code> route all exist and are wired into queue creation today. What is still simulated is the data source behind it (a locally-generated Oracle-shaped feed rather than a live Oracle Fusion HCM tenant) - swapping in live Oracle credentials is what remains, not building the integration itself.</li>
            <li><strong>Qatar-wide disposition routing</strong> - the eight-route disposition matrix (Sidra, HMC, PHCC, IST medical, teleconsult, self-care) is fully built in code (see <a href="#" data-topic="qatar-model">Qatar Model</a>) and is the routing logic <code>resolveDisposition</code> already applies. It is a mandatory part of every triage encounter, not a future enhancement.</li>
            <li><strong>RAG Shadow + MedGemma</strong> - these are one initiative, not two separate systems (see the note in <a href="#" data-topic="lib-stcc-rag-shadow">STCC-Compatible RAG Shadow Architecture</a>). The Prisma models and shadow-comparison service already exist; the remaining work is wiring live MedGemma inference into that shadow pipeline in place of the current synthetic/offline evaluation data.</li>
          </ol>
          <p>"Wiring" in each case means: connecting an already-built code path into the live, real-time request flow with real external credentials/endpoints - not writing new application logic from scratch.</p>
        `
      },
      {
        id: "integ-status-table",
        title: "Integration status summary",
        body: `
          <table class="ref-table">
            <thead><tr><th>Integration</th><th>Purpose</th><th>Status</th></tr></thead>
            <tbody>
              <tr><td>Provider-neutral Call Center (primary integration)</td><td>Normalize incoming calls, callbacks, call state, and recording metadata while preserving IST queue locks and STCC clinical authority.</td><td>Signed event/command contracts, dry-run adapter, session/event persistence schema, cockpit connection, and governance tests are built; wiring a real telephony provider adapter is the remaining step.</td></tr>
              <tr><td>Oracle Fusion HCM (mandatory)</td><td>Validate staff identity, active worker status, assignments, contacts, dependents, absences, and documents.</td><td>Sync/adapter layer is built and wired into queue creation today; the data source is a simulated Oracle-shaped feed until live Oracle Fusion HCM credentials are connected.</td></tr>
              <tr><td>Insurance</td><td>Return provider, eligibility, last check, and booking notes.</td><td>Mock eligibility cache exists; connect payer or benefits verification after insurer specs.</td></tr>
              <tr><td>EMR / Oracle Health</td><td>Move SBAR/SOAP into patient record.</td><td>Clipboard handoff now; a real FHIR DocumentReference builder already exists (<code>src/integration/fhirWriteback.ts</code>); wiring it to a live EMR endpoint is the remaining step.</td></tr>
              <tr><td>RAG Shadow + MedGemma (one initiative)</td><td>Compare deterministic routing against a bounded RAG/LLM shadow suggestion, and use that same model for explanation, summarization, and SBAR drafting.</td><td>Prisma models and shadow-comparison service are built; wiring a live MedGemma endpoint into that pipeline is the remaining step.</td></tr>
              <tr><td>Twilio WhatsApp / SMS</td><td>Send nurse-approved CCP messages and receive employee replies with text or media attachments.</td><td>A real adapter exists (calls the Twilio REST API and Twilio webhook signature verification directly, not the Twilio SDK); dry-run is the default until live account credentials are configured.</td></tr>
              <tr><td>Microsoft 365 Graph</td><td>Send nurse-approved non-urgent CCP email through an approved mailbox.</td><td>A real adapter exists (calls Microsoft Graph's sendMail REST endpoint); live use needs Mail.Send app consent and mailbox-scoped access policy.</td></tr>
              <tr><td>Scheduling</td><td>Book clinic, teleconsult, commission, or urgent review slots.</td><td>Future connector tied to disposition code.</td></tr>
              <tr><td>Transcription</td><td>Convert call audio into nurse-reviewed text.</td><td>Workspace already accepts transcript fields.</td></tr>
              <tr><td>Analytics</td><td>Track call volume, categories, escalations, nurse response, recontact, and QA sampling.</td><td>Dashboard scaffold exists for safety officer review.</td></tr>
            </tbody>
          </table>
        `
      },
      {
        id: "integ-oracle-hcm-adapter-approach",
        title: "Oracle Fusion HCM compatibility approach",
        body: `
          <p>The platform keeps one internal staff-validation contract and places Oracle Fusion Cloud HCM behind an adapter, rather than having the frontend or triage engine call Oracle directly. The target approach: the adapter calls the tenant base URL plus <code>/hcmRestApi/resources/11.13.18.05</code>, authenticates as a service account via GCP Secret Manager, starts read-only, caches only the minimum eligibility snapshot needed for triage, and only escalates to writeback after HR, privacy, and medical governance approve it.</p>
          <p><strong>Adapter rule:</strong> the frontend and triage engine keep calling IST triage APIs only. Oracle, insurance, EMR, scheduling, and analytics remain replaceable backend adapters with audit logging and fail-safe fallback - swapping the data source behind <code>src/services/hrmsOracleAdapter.ts</code> should never require changing the Nurse Cockpit or Service Manager Board.</p>
          <p><strong>Change-sync rule:</strong> use Oracle Atom feeds for key employee changes and HCM Extracts for bulk baseline or periodic refresh - avoid high-frequency REST polling against worker data.</p>
        `
      },
      {
        id: "integ-oracle-hcm-api",
        title: "Oracle Fusion HCM target API map",
        body: `
          <table class="ref-table">
            <thead><tr><th>Area</th><th>API</th><th>Use / status</th></tr></thead>
            <tbody>
              <tr><td>Active staff lookup</td><td><code>GET /publicWorkers</code>, <code>GET /publicWorkers/{PersonId}</code></td><td>First-choice low-scope lookup for active workers and public worker profile data. Read-only target.</td></tr>
              <tr><td>Full staff profile</td><td><code>GET /workers</code>, <code>GET /workers/{workersUniqID}</code></td><td>Validate staff ID, PersonId/PersonNumber, worker type, and deeper person fields. Requires HCM roles.</td></tr>
              <tr><td>Duty and department</td><td><code>GET .../workRelationships</code>, <code>.../assignments</code></td><td>Map legal employer, assignment, department, job title, manager, location, and active duty context. Read-only target.</td></tr>
              <tr><td>Dependents and contacts</td><td><code>GET /hcmContacts</code>, <code>.../contactRelationships</code></td><td>Map spouse, child, parent, and other contact relationships to the triage dependent picker. Governed PHI.</td></tr>
              <tr><td>Phone and email</td><td><code>GET .../phones</code>, <code>.../emails</code></td><td>Confirm callback details for staff and dependents when policy allows. Minimum necessary.</td></tr>
              <tr><td>Absence and sickness</td><td><code>GET/POST /absences</code></td><td>Read existing sickness records and optionally create an absence request only after HR policy approves writeback. Read first, write later.</td></tr>
              <tr><td>Medical certificates</td><td><code>GET/POST /documentRecords</code>, <code>.../attachments</code></td><td>Attach or retrieve governed document records for sickness certificates or fit-to-duty evidence. Future writeback.</td></tr>
              <tr><td>Change sync</td><td>Oracle HCM Atom Feeds, HCM Extracts, <code>POST /objectSnapshots</code></td><td>Atom feeds for key changes, HCM Extracts for bulk baseline loads, object snapshots where configured. Integration job.</td></tr>
            </tbody>
          </table>
        `
      },
      {
        id: "integ-planned-api",
        title: "Planned/built IST API contracts",
        body: `
          <table class="ref-table">
            <thead><tr><th>Area</th><th>API</th><th>Status</th></tr></thead>
            <tbody>
              <tr><td>Provider-neutral call center</td><td><code>POST /api/v1/integrations/call-center/events</code>, <code>GET /api/v1/call-center/status</code>, <code>GET /api/v1/call-center/sessions</code>, <code>POST /api/v1/call-center/queue/:queueItemId/command</code></td><td>Built with dry-run adapter</td></tr>
              <tr><td>IST triage API</td><td><code>POST /api/v1/staff/validate</code>, <code>POST /api/v1/triage/start</code>, <code>POST /api/v1/triage/encounters/evaluate</code></td><td>Built</td></tr>
              <tr><td>HRMS named-user sync</td><td><code>POST /api/v1/hrms/sync-users</code></td><td>Built with mock Oracle-style feed</td></tr>
              <tr><td>Tenant queue orchestration</td><td><code>GET/POST /api/v1/queue</code>, <code>POST /api/v1/queue/:id/claim</code>, <code>POST /api/v1/queue/:id/escalate</code></td><td>Built</td></tr>
              <tr><td>CCP employee communication</td><td><code>GET /api/v1/ccp/employee/{istStaffId}</code></td><td>Built demo endpoint</td></tr>
              <tr><td>CCP outbound approval</td><td><code>POST /api/v1/ccp/messages/draft</code>, <code>POST /api/v1/ccp/messages/{draftId}/approve-send</code></td><td>Built with dry-run safety</td></tr>
              <tr><td>CCP WhatsApp / SMS</td><td><code>POST /api/v1/ccp/webhooks/twilio</code></td><td>Adapter built</td></tr>
              <tr><td>CCP email</td><td>Microsoft Graph sendMail</td><td>Adapter built</td></tr>
              <tr><td>Protocol API</td><td><code>GET /api/v1/protocols/search</code>, <code>GET /api/v1/protocols/{protocolId}</code></td><td>Built with sample content</td></tr>
              <tr><td>Clinical content import</td><td>Today: manual/local command <code>npx tsx scripts/extractStccMdb.ps1</code> + <code>src/scripts/loadStccMirror.ts</code>, run against a configured <code>DATABASE_URL</code>. Planned: running this as a Cloud Run Job in me-central1 with IAM, per <code>docs/phase-1-gcp-qatar.md</code>, is explicitly listed as remaining work, not yet built.</td><td>Script built; Cloud Run Job deployment not yet built</td></tr>
              <tr><td>LLM copilot evaluation</td><td>Future: <code>POST /api/v1/ai/copilot/evaluate</code>, <code>/draft</code></td><td>Planned cloud adapter</td></tr>
              <tr><td>GCP Doha model serving</td><td>Private GKE / Vertex AI custom endpoint, me-central1</td><td>Cloud implementation task</td></tr>
              <tr><td>Insurance</td><td>Payer eligibility REST or approved benefits interface</td><td>Awaiting payer specs</td></tr>
              <tr><td>EMR / Oracle Health</td><td>SMART on FHIR or approved Oracle Health/Cerner API</td><td>Future connector</td></tr>
              <tr><td>Scheduling</td><td>Clinic scheduling / appointment-booking integration</td><td>Future connector</td></tr>
              <tr><td>Transcription and analytics</td><td>Speech-to-text API, de-identified BigQuery pipeline</td><td>Future connector</td></tr>
            </tbody>
          </table>
        `
      },
      {
        id: "integ-call-center-gateway",
        title: "Provider-Neutral Call Center Gateway",
        body: `
          <p><strong>Summary:</strong> Defines how incoming calls, callbacks, call state, and recording metadata move between any approved contact-center provider and the IST Health queue while STCC rules and the nurse retain clinical authority.</p>
          ${whatWhyHow(
            "A normalized event and command layer with durable call sessions, idempotent provider events, queue locking, adapter health, tenant routing, and recording controls.",
            "A provider-specific workflow would duplicate queue logic, weaken auditability, and make future contact-center replacement expensive. The gateway keeps the clinical contract stable while adapters change.",
            [
              "Receive CALL_OFFERED, CALL_CONNECTED, CALL_HELD, CALL_RESUMED, CALL_ENDED, CALLBACK_REQUESTED, CALLBACK_ANSWERED, NO_ANSWER, and RECORDING_AVAILABLE events.",
              "Verify HMAC signatures, persist before processing, deduplicate by provider plus providerEventId, mask ANI, and retain only metadata keys from arbitrary provider payloads.",
              "Route HRMS-validated calls into the tenant queue and hold unresolved identities outside the clinical queue.",
              "Execute ANSWER, START_CALLBACK, HOLD, RESUME, and END through a registered provider adapter with queue-lock rollback on failure."
            ]
          )}
          <p><strong>Key operating details:</strong></p>
          ${ul([
            "Telephony owns call transport and provider recording delivery. IST owns queue allocation, locks, HRMS identity, STCC workflow, safety floors, disposition, and clinical audit.",
            "The current dry-run adapter proves the contract without contacting an external telephone platform.",
            "Provider validation happens before a queue claim; if an adapter later rejects a command, the gateway marks the session failed and releases the lock acquired for that command.",
            "Raw ANI is never returned from the session API; only a masked display value is exposed.",
            "Recordings must remain in GCP Doha me-central1. The gateway requires notice played plus consent or legal basis before retaining an object reference.",
            "Raw audio is explicitly not RAG-eligible. Only a separately governed, de-identified, nurse-reviewed transcript or derived evaluation dataset may be considered for model improvement.",
            "Production work remains: approved provider adapter, private connectivity/webhook controls, retry worker and dead-letter queue, call-event monitoring, recording lifecycle, legal notice, and retention approval."
          ])}
        `
      },
      {
        id: "integ-named-user-hrms-tenant",
        title: "Named User HRMS and Tenant Queue",
        body: `
          <p><strong>Summary:</strong> Defines how Oracle-style HRMS directory records become named clinical users, how queue cards are scoped to PHCC/HMC/Sidra-style organizations, and how cross-tenant handover is audited.</p>
          ${whatWhyHow(
            "A multi-tenant identity and queue control layer built on the existing ApplicationUser, UserSession, queue, and audit models rather than a duplicate user table.",
            "The system is for internal employee tele-triage across healthcare organizations. A nurse should not see or claim another organization's queue unless an approved escalation changes the target organization.",
            [
              "POST /api/v1/hrms/sync-users accepts an Oracle-style worker feed and maps employee status, job title, and organization code into local named users.",
              "POST /api/v1/queue validates staff/dependent identity and creates an HRMS-derived patientAge snapshot before the item can be claimed.",
              "The HRMS kill switch disables inactive/on-leave/rest-period users, revokes their sessions, and releases their active queue locks.",
              "Queue orchestration checks tenant access before list, get, claim, heartbeat, context update, move, and escalation handover operations."
            ]
          )}
          ${ul([
            "Only platform super administrators and system administrators are the global queue exemptions in the current implementation.",
            "The escalation handover endpoint re-scopes a queue card to the target organization, clears the active lock, returns it to Incoming, and writes a signed transition event.",
            "The current HRMS endpoint can be called by Triage Service Manager, platform/system administrator, or a configured scheduler secret; production should replace the mock feed with Oracle Fusion HCM and mTLS/client-credential controls."
          ])}
        `
      },
      {
        id: "integ-ccp",
        title: "CCP - Employee Communication Pipeline",
        body: `
          <p><strong>Summary:</strong> CCP is the Continuous Communication Pipeline for one employee. It keeps an employee-level communication index while opening a separate thread for each visit, call, teleconsult, or clinic encounter.</p>
          ${ul([
            "The CCP subject is the employee, but the operating unit is the visit/call thread. Each new clinic visit, remote call, teleconsult, or follow-up opens a separate active thread.",
            "Previous threads stay closed and are not merged into the new encounter, but the nurse sees linked prior threads and the last communication as context before continuing.",
            "Every CCP goal has an owner, due time, next action, thread ID, and settle point so callbacks, precautions, route handoffs, fit-to-duty follow-up, and dependent context do not disappear after the live call.",
            "AI may detect or draft outbound content, but employee-facing messages stay queued until the Remote Triage Nurse reviews and approves the send.",
            "WhatsApp, SMS, and email sit behind transport adapters. CCP callers create an outbound draft and the adapter is invoked only after Remote Triage Nurse approval, consent/channel validation, and any configured test redirect.",
            "Inbound Twilio webhooks follow the verify, parse, persist, acknowledge pattern. The local build keeps this as an in-memory record; production should persist to a durable queue before returning the provider acknowledgement.",
            "The current build exposes demo endpoints and workspace status. Production should persist the CCP as a single-writer ledger with delivery receipts, immutable audit events, retention state, and approved integrations."
          ])}
          <p><strong>Why it helps:</strong></p>
          ${ul([
            "<strong>One place to look</strong> - a nurse, physician, administrator, or support user does not need to search separate call notes, SMS messages, WhatsApp updates, email, and task lists.",
            "<strong>Clean episode separation</strong> - the next visit or call starts a new thread, so today's clinical context is not mixed with the previous encounter.",
            "<strong>Faster callbacks</strong> - open goals show the owner, due time, next action, and closure condition.",
            "<strong>Better employee experience</strong> - the employee does not have to repeat the same story each time the case moves between roles.",
            "<strong>Clinical continuity</strong> - red-flag precautions, human approval gates, fit-to-duty tasks, dependent context, and clinical route decisions stay linked after the live call ends.",
            "<strong>Governance and audit</strong> - every communication can carry actor, channel, purpose, timestamp, linked goal, and audit tags.",
            "<strong>Controlled automation</strong> - AI can summarize and draft, but CCP keeps actions policy-led: consent, channel choice, emergency floors, disclosure rules, and nurse approval before send remain code-controlled.",
            "<strong>Two-way transport model</strong> - outbound WhatsApp, SMS, and email share the same CCP gate; inbound WhatsApp/SMS replies enter through the Twilio webhook, are signature-checked when live, parsed with text and media attachments, then persisted for the CCP processor.",
            "<strong>Safe integration mode</strong> - the default transport mode is dry-run, so a local demo can prove nurse approval, ledger capture, and adapter selection without sending a real message."
          ])}
        `
      },
      {
        id: "integ-oracle-fusion-simulation",
        title: "Synthetic employee data factory (Oracle Fusion HCM simulation)",
        body: `
          <p><strong>Summary:</strong> Builds the statistically realistic Oracle-style employee API feed plus synthetic dependent, encounter, vector, and safety-audit data used to stress-test the platform and evaluate AI copilots.</p>
          ${ul([
            "Default generation models 260 active wide-body aircraft, 26,000 employees, 4,300 pilots, 5,200 cabin crew, and 16,500 support staff.",
            "The source feed includes Oracle Fusion HCM-style publicWorkers, workers, workRelationships, assignments, hcmContacts, contactRelationships, and absences collections.",
            "Dependents are assigned to 45 percent of staff, with spouse, son, and daughter relationships generated logically from synthetic employee age.",
            "The 5,000 encounter history follows core operational profiles: cardiac emergency, pediatric respiratory distress, cabin crew back pain, pilot ear barotrauma, and mandated immunization fever - later expanded with pediatric fever/dehydration, female urinary symptoms, pregnancy red flags, and male genitourinary urgent presentations.",
            "Every encounter includes vitals, transcript text, semantic symptom vector, cosine-similarity protocol match, deterministic disposition, fit-to-fly impact, and SBAR-style payload.",
            "Regional fields include Qatar season, temperature, humidity, wind, heat risk, dust risk, respiratory season, vulnerable groups, and demographic priors.",
            "Exactly 5 percent of generated encounters receive a safety audit deviation log with original RAG shadow suggestion, nurse rationale, rules severity, and explainability trace.",
            "All records are synthetic, generated from distributions and deterministic templates, with no copied HR or patient data."
          ])}
        `
      }
    ]
  },
  {
    id: "governance-deep-dive",
    label: "Governance",
    articles: [
      {
        id: "gov-review-guide",
        title: "Clinical governance review guide",
        body: `
          <p><strong>Audience:</strong> Clinical Governance Lead, Protocol Content Manager, Quality Reviewer.</p>
          <p><strong>Goal:</strong> Review whether content, routing, overrides, bilingual text, and audit traces are clinically safe enough for UAT and production release.</p>
          ${whatWhyHow(
            "A governance review path for clinical content, safety floors, route mapping, override behavior, and release evidence.",
            "The root risk is unapproved clinical variation: protocol content, local destinations, AI wording, and nurse-facing guidance must be clinically validated before production.",
            [
              "Review acuity order, severity mapping, disposition, rationale, and care-advice links.",
              "Sample adult, pediatric, aviation, urgent, self-care, and AI-downgrade scenarios.",
              "Approve local Qatar routes and release gates before activating production content."
            ]
          )}
          <p><strong>Steps:</strong></p>
          ${ol([
            "Check that every algorithm has acuity-ordered questions, severity, disposition, rationale, and care-advice mapping.",
            "Review the Phase I open-source baseline separately from any future licensed STCC/SymptomScreen import.",
            "Sample adult emergency, pediatric emergency, stable NEWS2, aviation restriction, and self-care cases using the automated test pack.",
            "Approve local Qatar routing rules before activating production destinations.",
            "Track gaps for licensed protocols, Arabic clinical translation governance, persistence, EMR writeback, and medical director sign-off."
          ])}
          <p><strong>Safety note:</strong> Governance must treat the current MVP content as implementation scaffolding until licensed content and local SOP approval are complete.</p>
        `
      },
      {
        id: "gov-controls",
        title: "Cross-cutting governance controls",
        body: ul([
          `<strong>Human-in-the-loop approval</strong> - the system is decision support. Nurses and physicians validate the final disposition, and the UI keeps the operating rule visible.`,
          `<strong>AI downgrade blocking</strong> - if deterministic rules classify an encounter as Emergency, a RAG shadow suggestion below that floor is blocked and logged as a safety event.`,
          `<strong>LLM model governance</strong> - MedGemma or any future LLM must pass synthetic and clinically reviewed evaluations before UAT. Model outputs remain preliminary, nurse-verified, auditable, and blocked from changing red-floor rules.`,
          `<strong>Protocol governance</strong> - production use needs licensed clinical content, lead physician and lead nurse review, local disposition approval, and a defined update cadence.`,
          `<strong>Privacy and retention</strong> - the scaffold returns PHI in memory only. Prisma persistence should be enabled only after retention, security, and EMR-write policies are approved.`,
          `<strong>Quality analytics</strong> - call volumes, categories, nurse response time, outcome trends, recontact rates, randomized review, incident reporting, and exportable dashboards are the intended reporting scope.`,
          `<strong>Multilingual operations</strong> - English and Arabic are represented in the current UI and SBAR labels; Hindi, Tagalog, and governed translation are planned capabilities.`
        ])
      },
      {
        id: "gov-data-law",
        title: "GDPR and Qatar personal-data law alignment",
        body: `
          ${ul([
            `<strong>GDPR privacy-by-design mapping</strong> - the system maps GDPR-style principles into product controls: purpose limitation through documented use cases, data minimization through role-scoped views, privacy by default through masked fields, integrity and confidentiality through encryption policy, and accountability through audit events.`,
            `<strong>Qatar personal-data law mapping</strong> - the design treats Qatar personal-data requirements as operational controls: clear processing purpose, authorized access, protection of sensitive health and identity fields, data residency review, approved cross-border transfer decisions, retention rules, and auditable disclosure or reveal.`,
            `<strong>Healthcare and clinical safety overlay</strong> - because the platform handles tele-triage and health context, privacy controls are paired with clinical governance: clinicians approve dispositions, emergency safety rules cannot be downgraded by AI, and production policies must be reviewed by legal, privacy, security, and medical leadership.`
          ])}
          <p><strong>No automatic compliance claim:</strong> this documentation explains how controls are designed to support GDPR and Qatar data-law review. It does not claim automatic legal certification - final deployment still needs legal sign-off, a DPIA/privacy assessment, security review, and approved operating policies.</p>
        `
      },
      {
        id: "gov-production-readiness",
        title: "Production readiness notes",
        body: `<p>This MVP proves system wiring. Production needs licensed clinical protocols, local medical governance, role-based access control, encryption review, audit retention rules, JCI/ISO/MOPH-aligned controls, EMR-write approvals, and a protocol review cadence owned by lead physician and lead nurse.</p>`
      }
    ]
  },
  {
    id: "security-administration-deep-dive",
    label: "Security Administration",
    articles: [
      {
        id: "secadmin-intro",
        title: "How this section relates to the Control Center",
        body: `<p>This explains the login, named-user simulation, SSO, administration, access control, masking, encryption, and audit modules added to the existing tele-triage system, in more depth than the <a href="#" data-topic="control-center">Control Center</a> topic group's per-tab summaries. For each capability below, the built/controls/production breakdown is preserved exactly as documented: what is actually built, what control it applies today, and what remains for production hardening.</p>`
      },
      {
        id: "secadmin-login",
        title: "Login and named user simulation",
        body: `
          <p><strong>Built:</strong></p>
          ${ul([
            "Apple-style minimal login using the system font stack, light mode by default, with optional dark mode.",
            "Organization selector is set to IST Health, with English, Arabic, Hindi, and Tagalog language choices.",
            "Simulate-user dropdown is grouped by business category: A - Administration, S - Security and Privacy, G - Governance and Quality, B - Business and Clinical Operations, I - Integration, R - Reporting and Analytics, U - User Support.",
            "Each simulated user has one assigned role, so changing the selected user automatically changes the login email, role, permission set, and landing area.",
            "The simulator uses the normal login API, sets a secure session cookie, and redirects by permission to admin or workspace."
          ])}
          <p><strong>Controls:</strong></p>
          ${ul([
            "Authentication errors stay generic and do not reveal whether a username exists.",
            "The backend derives the active role from the named user and rejects a role override when that role is not assigned to the account.",
            "Session restore uses the same permission logic as login, so refresh keeps the correct landing area."
          ])}
          <p><strong>Production gaps:</strong></p>
          ${ul([
            "ADMIN_PASSWORD is environment-driven; MOCK_MODE=false rejects startup when the password is missing or still uses the mock local fallback.",
            "Replace the local password gate with Argon2id hashes and an enterprise identity store.",
            "Add password reset, MFA/OTP screens, CAPTCHA after repeated failures, refresh-token rotation, and forced logout controls.",
            "Connect planned-maintenance, password-expiry, and session-timeout notices to policy configuration."
          ])}
        `
      },
      {
        id: "secadmin-rbac",
        title: "Roles, responsibilities, and access (RBAC + responsibility model)",
        body: `
          <p>The security layer separates role permissions, clinical responsibilities, and active-role session behavior so menus and APIs can be controlled consistently.</p>
          <p><strong>Built:</strong></p>
          ${ul([
            "The canonical system catalog contains exactly three protected roles: Triage Nurse, Triage Service Manager, and Platform Administrator. Platform administrators can create governed custom roles for approved requirements.",
            "Named User Mode means every action is tied to a real authenticated user, active role, session, queue assignment, and audit identity rather than a generic actor selector.",
            "The active role is derived from the named user and controls permissions for the current session instead of granting every role at once.",
            "Every system or custom role has a distinct effective access profile across permissions, responsibilities, data scopes, clinical scopes, and integration scopes.",
            "The old global Actor selector was removed so the authenticated role is the single source of truth for menus, API access, data scope, and audit.",
            "A central authorization helper protects administration APIs independently of frontend menu visibility.",
            "Admin navigation and admin tabs appear only when the active session has the matching administration, security, privacy, or audit permissions."
          ])}
          <p><strong>Controls:</strong></p>
          ${ul([
            "Platform Super Administrator has all current permissions for local simulation and demonstration.",
            "Triage Nurses land in the clinical workspace; Service Managers receive operational oversight and independent approval capabilities.",
            "Platform Administrators see the protected role catalog and can create custom roles only through the elevated, audited, segregation-validated workflow.",
            "Queue locking remains named-user based: one nurse claims one call, lock ownership is audited, and HRMS status changes can release locks."
          ])}
          <p><strong>Production gaps:</strong></p>
          ${ul([
            "Add effective dates and explicit-deny semantics to custom role assignments.",
            "Expand the centralized segregation policy as Qatar Airways approves additional custom role patterns.",
            "Extend authorization guards around every clinical, queue, note, integration, export, and content-management endpoint."
          ])}
        `
      },
      {
        id: "secadmin-control-center-bifurcation",
        title: "Control Center module bifurcation",
        body: `
          <p>The Control Center is split into separate modules so a role sees its own workspace instead of one overloaded administration screen - this is why the <a href="#" data-topic="control-center">Control Center</a> topic group documents each tab separately.</p>
          <p><strong>Controls:</strong></p>
          ${ul([
            "Each module has its own backend route and permission guard.",
            "A role can open the Control Center only when it is a real control-center role, not merely because it has reveal permission for clinical work.",
            "The Privacy Officer gets a dedicated reveal workspace, and the Integration Administrator gets a dedicated connector-status workspace."
          ])}
          <p><strong>Production gaps:</strong></p>
          ${ul([
            "Add module-specific edit/approval workflows after the read-model is validated by stakeholders.",
            "Persist module configuration, approval history, and connector run history in production tables.",
            "Add per-module feature flags for demo, UAT, and production environments."
          ])}
        `
      },
      {
        id: "secadmin-masking-reveal",
        title: "Masking and controlled reveal",
        body: `
          <p>Personal fields are masked by default, and authorized reveal is handled as a deliberate backend action with a purpose and audit trail - this is the same reveal flow documented in the <a href="#" data-topic="control-center">Control Center</a>'s Privacy tab article, described here at the control level.</p>
          <p><strong>Built:</strong></p>
          ${ul([
            "Email, mobile, employee ID, and licence values are returned masked in admin/user views.",
            "The reveal endpoint validates the session and reveal permission before returning a value.",
            "Reveal requests require a business purpose and return an auto-remask timer value for the UI message.",
            "Reveal actions are written to the audit event stream."
          ])}
          <p><strong>Controls:</strong></p>
          ${ul([
            "Administrators do not automatically receive unrestricted plaintext personal data.",
            "A user without reveal permission receives a denial from the backend.",
            "Audit events do not store decrypted values."
          ])}
          <p><strong>Production gaps:</strong></p>
          ${ul([
            "Add MFA step-up, supervisor or dual approval, per-field reveal policy, watermarks, disable-copy controls, and remask-on-blur behavior.",
            "Move reveal approval, reveal event, and privacy request flows into persistent database tables.",
            "Enforce clinical relationship, queue assignment, and purpose-of-access checks for patient-level data."
          ])}
        `
      },
      {
        id: "secadmin-sso",
        title: "SSO and identity providers",
        body: `
          <p><strong>Built:</strong></p>
          ${ul([
            "Authentication provider seed records model protocol, issuer URL, tenant ID, redirect URI, allowed domains, and attribute mappings.",
            "Group-to-role mappings are represented for SSO-driven authorization.",
            "SSO providers appear in the Control Center with enabled state and certificate expiry metadata.",
            "A backend SSO test endpoint validates provider metadata in the demo service."
          ])}
          <p><strong>Controls:</strong></p>
          ${ul([
            "Secrets are represented as secret-manager references rather than displayed plaintext.",
            "Local login can be enabled or disabled per provider model.",
            "JIT provisioning is represented in the provider configuration."
          ])}
          <p><strong>Production gaps:</strong></p>
          ${ul([
            "Implement real OIDC/SAML callbacks, signed metadata, logout handling, certificate monitoring, and secret rotation.",
            "Store client secrets in GCP Secret Manager or an approved vault.",
            "Add group-to-responsibility and group-to-access-profile mappings with approval review."
          ])}
        `
      },
      {
        id: "secadmin-encryption",
        title: "Encryption, KMS, and data residency",
        body: `
          <p><strong>Built:</strong></p>
          ${ul([
            "Encryption policy records include data classification, covered entities, covered fields, algorithm, KMS provider, key alias, rotation days, masking policy, reveal policy, and data residency.",
            "AES-256-GCM is the approved field-encryption baseline in the policy model.",
            "IST Health Cloud KMS aliases are shown as policy references, not as keys.",
            "Privacy/encryption policies are visible through the Control Center."
          ])}
          <p><strong>Controls:</strong></p>
          ${ul([
            "Raw master keys and plaintext data-encryption keys are not stored in application records.",
            "Encryption policy administration is separated from clinical decision logic.",
            "Data residency is explicit in the policy surface."
          ])}
          <p><strong>Production gaps:</strong></p>
          ${ul([
            "Implement envelope encryption with Cloud KMS or the approved HSM/vault.",
            "Add encrypted columns, key references, nonce/tag metadata, and controlled migration for existing sensitive fields.",
            "Add key rotation, compromise response, usage audit, and dual-approval workflows."
          ])}
        `
      },
      {
        id: "secadmin-audit",
        title: "Audit and monitoring",
        body: `
          <p><strong>Built:</strong></p>
          ${ul([
            "Audit events include timestamp, user, active role, organization, facility, department, action, module, resource, IP/device, success, and risk.",
            "Failed login attempts are tracked and lockout behavior is represented in the authentication service.",
            "The Control Center's dashboard exposes security, privacy, and cryptographic health counters.",
            "The Audit panel lists recent security and privacy events."
          ])}
          <p><strong>Controls:</strong></p>
          ${ul([
            "Decrypted personal values are not written into audit records.",
            "Authentication and reveal events are generated on the backend.",
            "Audit visibility is restricted to sessions with audit permissions."
          ])}
          <p><strong>Production gaps:</strong></p>
          ${ul([
            "Move audit to an immutable append-only store with retention policy and SIEM export.",
            "Add break-glass review, identifiable export tracking, access-change history, and incident workflow.",
            "Add centralized redaction for logs, traces, API errors, and support diagnostics."
          ])}
        `
      },
      {
        id: "secadmin-role-catalog",
        title: "All roles and their access (full catalog with scopes)",
        body: `
          <p>The canonical catalog contains three protected system roles. Additional approved roles are created as governed custom roles by a PAM-elevated Platform Administrator.</p>
          <table class="ref-table">
            <thead><tr><th>Category</th><th>Role</th><th>Access intent</th><th>Data scopes</th></tr></thead>
            <tbody>
              <tr><td>A</td><td>Platform Super Administrator</td><td>Demo-only full-system access across triage, administration, security, privacy, audit, cryptography, integrations, and reports.</td><td>all users, all encounters, all integration scopes</td></tr>
              <tr><td>B</td><td>Triage Service Manager</td><td>Queue health, staffing coverage, case allocation, operational KPIs, and escalation throughput.</td><td>assigned queues, operational dashboards, hrms.read, audit</td></tr>
              <tr><td>B</td><td>Remote Triage Nurse</td><td>Assigned remote triage encounters with clinical protocol access and RAG shadow suggestion visibility.</td><td>assigned queue, adult, aviation, hrms.read, insurance.read</td></tr>
            </tbody>
          </table>
        `
      },
      {
        id: "secadmin-api-map",
        title: "Security and administration API map",
        body: `
          <table class="ref-table">
            <thead><tr><th>Area</th><th>API</th><th>Use / status</th></tr></thead>
            <tbody>
              <tr><td>Login and session</td><td><code>POST /api/v1/auth/login</code>, <code>GET /api/v1/auth/session</code>, <code>POST /api/v1/auth/logout</code></td><td>Create, restore, and revoke secure sessions. The login request can include a simulated active role for demo personas.</td></tr>
              <tr><td>SSO test</td><td><code>POST /api/v1/auth/sso/test</code></td><td>Validate configured identity-provider metadata before live SSO callback wiring is enabled. Demo endpoint.</td></tr>
              <tr><td>Control Center modules</td><td><code>GET /api/v1/admin/control-modules</code></td><td>Return the module catalog filtered to the active role. Built.</td></tr>
              <tr><td>Control Center dashboard</td><td><code>GET /api/v1/admin/summary</code></td><td>Dashboard metrics for active users, failed logins, sessions, privacy requests, crypto warnings, and incidents when the role has audit visibility. Built with seed data.</td></tr>
              <tr><td>Identity and access</td><td><code>GET /api/v1/admin/users</code>, <code>/roles</code>, <code>/responsibilities</code>, <code>/permissions</code></td><td>Power the Users and Access sections of the Control Center. Built read APIs.</td></tr>
              <tr><td>Security configuration</td><td><code>GET /api/v1/admin/sso-providers</code>, <code>/encryption-policies</code></td><td>Expose identity-provider and encryption-policy configuration. Built read APIs.</td></tr>
              <tr><td>Privacy and audit</td><td><code>GET /api/v1/admin/reveal-directory</code>, <code>POST /reveal</code>, <code>GET /audit-events</code></td><td>Power the Privacy Officer reveal workspace and security/privacy event history. Built demo workflow.</td></tr>
              <tr><td>Governance and protocol library</td><td><code>GET /api/v1/admin/governance</code>, <code>/protocol-library</code></td><td>Clinical governance work items and protocol-library status. Built read APIs.</td></tr>
              <tr><td>Integration workbench</td><td><code>GET /api/v1/admin/integrations</code></td><td>Oracle HRMS, EMR/FHIR, SSO, analytics, and connector-status records. Built read API.</td></tr>
              <tr><td>Reports and support</td><td><code>GET /api/v1/admin/reports</code>, <code>/support</code></td><td>De-identified report catalog and helpdesk queue records. Built read APIs.</td></tr>
            </tbody>
          </table>
        `
      }
    ]
  },
  {
    id: "library-technical-reference",
    label: "Library (Technical Reference)",
    articles: [
      {
        id: "lib-teletriage",
        title: "Tele-Triage Encounter Engine",
        body: `
          <p><strong>Summary:</strong> Coordinates automatic HRMS caller validation, age calculation, symptom capture, protocol search, acuity-first questions, aviation gates, disposition routing, SBAR handoff, and human approval for remote nurse triage.</p>
          <p><strong>Used by:</strong> <code>POST /api/v1/triage/start</code>, <code>POST /api/v1/triage/encounters/evaluate</code>, TriageWorkspace.</p>
          ${ul([
            "The encounter starts only after the queue API validates the staff/dependent relationship and calculates age from HRMS date of birth or age fields.",
            "The current build keeps PHI ephemeral and returns the decision package to the frontend for clinician validation and clipboard handoff.",
            "Production tele-triage requires persistence, role-based access, call transcription, scheduling, EMR integration, and approved clinical SOPs."
          ])}
        `
      },
      {
        id: "lib-nurse-cockpit-modes",
        title: "Nurse Cockpit Modes (Step and Board)",
        body: `
          <p><strong>Summary:</strong> Documents the two customer-selectable nurse workspace modes: the guided one-active-call Step cockpit and the Kanban-style Board cockpit for queue supervision.</p>
          ${whatWhyHow(
            "Two frontend surfaces support the triage operation. #/workspace opens the guided Step cockpit; #/kanban opens the Kanban Board cockpit. Both are backed by the unified queue orchestration API.",
            "A single layout cannot serve every user equally. Remote Triage Nurses need a strict clinical sequence, while senior nurses, service managers, and customer reviewers may need queue visibility across many calls.",
            [
              "Route active clinical execution through Step so Reason &amp; Emergency Rule-Out, one-question-at-a-time assessment, disposition, and SBAR stay ordered.",
              "Use Board for operational awareness: incoming calls, HRMS-ready reason state, clinical triage state, disposition review, and SBAR/follow-up load.",
              "Keep Board actions constrained by the same deterministic safety floor, role permissions, lock ownership, route review, and nurse-approval rules as Step."
            ]
          )}
          ${ul([
            "Identity is not a nurse-click action in Step - the queue API validates HRMS identity and calculates age before the case becomes nurse-visible.",
            "The Questions action tab is a guided click-and-enable flow: only the current acuity question is active; No unlocks the next question, Yes stops lower-priority questions.",
            "Board is an alternate Kanban view with Incoming, Reason / HRMS-ready, Clinical triage, Disposition, and SBAR / follow-up columns.",
            "Opening an incoming or callback case connects it through the provider-neutral gateway, claims the queue item, sets a five-minute lock, and loads the same encounter context into the Step cockpit.",
            "Moving a Board or Step item calls the queue sequence validator and writes a signed transition trace in the backend service path."
          ])}
        `
      },
      {
        id: "lib-named-user-hrms-tenant-queue",
        title: "Named User HRMS and Tenant Queue",
        body: `<p>See the full write-up in <a href="#" data-topic="integ-named-user-hrms-tenant">System Integrations - "Named User HRMS and Tenant Queue"</a>.</p>`
      },
      {
        id: "lib-ccp",
        title: "CCP - Employee Communication Pipeline",
        body: `<p>See the full write-up in <a href="#" data-topic="integ-ccp">System Integrations - "CCP - Employee Communication Pipeline"</a>.</p>`
      },
      {
        id: "lib-protocol-library",
        title: "Clinical Protocol Library",
        body: `
          <p><strong>Summary:</strong> Stores adult and pediatric algorithms, search words, ordered triage questions, severity grades, rationale, red-flag markers, care advice links, references, supplementals, first aid, taxonomy, telemedicine flags, and bilingual title fields.</p>
          <p><strong>Used by:</strong> Algorithm, TriageQuestion, CareAdvice, AlgorithmCareAdvice, QuestionAdviceBridge, ProtocolKeywordIndex, ProtocolSynonym, ClinicalReference, ClinicalSupplemental, ProtocolFirstAid, ProtocolTaxonomy.</p>
          ${ul([
            "The schema is aligned to the STCC telehealth content pattern: symptom definition, reason/search words, guideline selection, initial assessment, triage assessment questions, disposition, care advice, first aid, background, references, and supplemental content.",
            "Questions are ordered by acuity - emergency rule-out is handled first, then the nurse receives one active protocol question at a time until a Yes fixes the disposition or all items are answered No.",
            "Clinical references and supplementals are separate linked structures so evidence, appendices, dosage tables, and reviewer notes do not get mixed into the question path.",
            "First-aid and care-advice content can hold plain text plus sanitized HTML/XHTML so future licensed STCC formatting can be preserved safely.",
            "Source hashes, checksums, release IDs, and reconciliation metadata support annual content refresh and duplicate/lineage validation.",
            "The model supports localized care advice and disposition codes connected to each algorithm; local Qatar routing remains an overlay and must not downgrade the clinical disposition."
          ])}
        `
      },
      {
        id: "lib-stcc-rag-shadow",
        title: "STCC-Compatible RAG Shadow Architecture (includes MedGemma)",
        body: `
          <p><strong>Summary:</strong> Runs deterministic search and nurse guideline selection in parallel with a bounded RAG shadow path, then records agreement, disagreement, blocked outputs, and learning feedback without letting AI decide clinical disposition. <strong>MedGemma is not a separate system from this one</strong> - it is the LLM this RAG shadow architecture is designed to run: MedGemma produces the shadow suggestions, extraction, and comparison evidence described below. See "LLM Copilot and MedGemma Cloud Strategy" further down this group for the model-hosting/training side of the same initiative.</p>
          ${whatWhyHow(
            "A separate RAG and learning layer that compares approved-content retrieval, LLM shadow suggestions, deterministic protocol matching, and nurse selections.",
            "The system needs AI/ML learning evidence without turning the LLM into a clinical decision engine. Shadow mode lets the model learn from nurse/system comparison while STCC-shaped content and deterministic rules remain authoritative.",
            [
              "Restrict retrieval to approved clinical content, local Qatar overlays, opening/closing scripts, and approved care advice.",
              "Record retrieval source IDs, snippet hashes, suggested keywords, suggested protocol candidates, model/prompt/corpus version, and confidence.",
              "Compare deterministic primary protocol, shadow primary protocol, and nurse-selected protocol; store feedback and block unsafe outputs."
            ]
          )}
          ${ul([
            "RAG retrieval is bounded to approved indexed content - it must not use general web medical advice or the model's open-ended medical memory during a live encounter.",
            "The shadow model may extract reason terms, body part, duration, red flags, keywords, and candidate protocols, but cannot decide disposition, care advice, fit-to-fly, or source of care.",
            "The nurse-facing workflow continues to use deterministic search and nurse confirmation; RAG runs beside it and produces comparison evidence only.",
            "Unsafe output (invented questions, invented care advice, unsafe downgrades, out-of-bound sources, privacy-boundary violations) is recorded as a SafetyBlockedOutput."
          ])}
        `
      },
      {
        id: "lib-voice-ai",
        title: "English Voice AI Initial Assessment",
        body: `
          <p><strong>Summary:</strong> Defines the English opening and initial-assessment flow before nurse pickup. The implemented component foundation provides deterministic protocol-bound sequencing, transcript interpretation, exception handling, nurse validation APIs, and governed training-example export; live audio, streaming speech recognition, persistent evidence, and the nurse playback workspace remain integration work.</p>
          ${whatWhyHow(
            "An English-only Voice AI intake flow that identifies the caller, records the required notice, captures the reason for call, follows the approved initial-assessment script, and prepares a nurse-validation worksheet.",
            "The fixed clinical wording remains consistent while callers can answer naturally. Nurses validate structured evidence faster than repeating every opening question, but clinical authority, guideline confirmation, triage questions, disposition, and care advice remain human controlled.",
            [
              "Play versioned, clinically approved English audio and use voice-activity detection so caller speech pauses playback instead of being talked over.",
              "Stream the caller response to speech-to-text, then use MedGemma only to extract structured facts and rank identifiers from the approved active protocol package.",
              "Persist each question ID, audio version, transcript span, extracted answer, confidence, exception, and model version for nurse review; never let the model invent a question or disposition."
            ]
          )}
          <p><strong>Current implementation status:</strong> the mock-runtime backend supports English protocol-bound sessions, ordered initial-assessment turns, one clarification, interruption and emergency takeover, role/owner checks, per-turn nurse validation or correction, completion gating, and validated-answer training export. It deliberately returns unavailable in database mode until the persistent repository is implemented.</p>
          ${ul([
            "The authoritative path is state controlled: CALL_OFFERED, RECORDING_NOTICE, IDENTITY_VALIDATION, REASON_CAPTURE, GUIDELINE_PREPARATION, INITIAL_ASSESSMENT, NURSE_VALIDATION_PENDING, NURSE_TRIAGE_ACTIVE, DISPOSITION_APPROVAL, and COMPLETE.",
            "Employee identity is resolved from the registered phone number when possible, otherwise the caller enters the employee ID and PIN; a dependent relationship is confirmed before any protected clinical context enters the queue.",
            "Emergency words or structured danger signals invoke the deterministic safety service immediately - a possible emergency stops routine automation and transfers or prioritizes the call, and the model cannot suppress or downgrade that action.",
            "Before nurse clinical work begins, the validation worksheet shows every question, approved wording, played audio version, transcript excerpt, interpreted answer, confidence, correction control, and exception.",
            "English is the only Voice AI language in the current scope. Arabic voice assets, Arabic speech recognition, translation, and bilingual voice validation require a separate governed release."
          ])}
        `
      },
      {
        id: "lib-medgemma-strategy",
        title: "LLM Copilot and MedGemma Cloud Strategy (same initiative as RAG Shadow)",
        body: `
          <p><strong>This is the model-hosting and training side of the same RAG Shadow initiative above</strong> - "RAG Shadow" is the architecture/data model, "MedGemma" is the specific LLM that architecture is built to run. They are one initiative with two sides (the comparison/evidence pipeline, and the model itself), not two separate systems.</p>
          <p><strong>Summary:</strong> Defines how the system should use MedGemma for constrained Voice AI interpretation, approved-protocol candidate ranking, explanation, summarization, and SBAR assistance without handing over question sequencing or clinical decision authority.</p>
          <p><strong>Current state:</strong> the RAG Shadow Prisma models (<code>RagRetrievalEvent</code>, <code>LlmShadowSuggestion</code>, <code>NurseSelectionEvent</code>, <code>ProtocolComparisonEvent</code>, <code>LearningFeedbackEvent</code>, <code>ModelEvaluationRun</code>, <code>SafetyBlockedOutput</code>) and the shadow-comparison service already exist and are built. The platform also has synthetic LLM-ready data, safety wrappers, a strict interpretation-only MedGemma port, schema validation that rejects clinical outcome fields, and a role-gated export of nurse-validated initial-assessment examples. What remains to wire is the live MedGemma endpoint itself: training job, provider credentials, model registry, and production inference adapter feeding into the already-built shadow pipeline.</p>
          ${ul([
            "The LLM is allowed to interpret caller language into an approved structured schema, extract reason terms and initial-assessment facts, rank approved protocol or answer identifiers, explain deterministic routing, draft SBAR/SOAP text, flag missing context, and summarize prior CCP threads.",
            "The LLM is not allowed to diagnose, approve or downgrade a disposition, approve fit-to-duty, approve sickness leave, bypass pediatric/adult red floors, or send WhatsApp/SMS/email without Remote Triage Nurse approval.",
            "MedGemma must not memorize, reproduce, rewrite, or autonomously execute licensed STCC content - at runtime it receives only the minimum approved context required for interpretation.",
            "MVP approach: evaluation-first using synthetic data, prompt engineering, retrieval of governed protocol context, and optional low-cost quantized inference for non-authoritative drafting.",
            "Cloud approach: private GCP Doha deployment in me-central1 after confirming service/accelerator availability, with private GKE or approved Vertex AI custom endpoint, IAM, KMS, audit logging, logging redaction, VPC Service Controls, and model-version governance.",
            "Training approach: adapt a small MedGemma adapter only for structured extraction, uncertainty detection, contradiction detection, caller-intent classification, and approved-ID ranking, using synthetic or formally de-identified data with dataset lineage and required clinical/privacy/security approval before any tuning job.",
            "Live calls never perform online learning - nurse corrections enter a quarantined feedback ledger, then pass de-identification, quality review, adjudication, duplicate and leakage checks, release evaluation, and explicit promotion before a future adapter can use them.",
            "Deterministic safety wrappers remain outside the model so a prompt change, fine-tune, or model upgrade cannot change the emergency floor."
          ])}
        `
      },
      {
        id: "lib-llm-cloud-migration-tasks",
        title: "LLM cloud migration task sequence",
        body: `
          <p>The planned four-stage rollout for moving MedGemma from evaluation to production serving:</p>
          ${ol([
            `<strong>Evaluation-first MVP</strong> - create train/validation/test splits from synthetic-only rows; score red-floor refusal, pediatric routing explanation, female-health context, male-health context, Qatar seasonal context, and nurse-approval language; fail the build if the model recommends a lower severity than the deterministic rules or writes employee-facing content as already approved.`,
            `<strong>MVP inference adapter</strong> - add one backend model adapter so the UI and triage engine stay independent from the provider or serving engine; support dry-run mode first, then an internal CPU inference endpoint for quantized MedGemma where clinically and legally approved; return structured fields (missing questions, rationale summary, SBAR draft, confidence warnings, safety-floor acknowledgement).`,
            `<strong>GCP Doha production serving</strong> - deploy on private GKE or an approved Vertex AI custom endpoint in me-central1; use private ingress, workload identity, Secret Manager, Cloud KMS, Cloud Audit Logs, logging redaction, and VPC Service Controls; use vLLM or another approved high-concurrency serving engine only after performance, cost, and quota testing.`,
            `<strong>Governed tuning and release</strong> - use synthetic or formally de-identified data only unless DPO, clinical governance, and legal approve a stricter path; register every model version with dataset lineage, eval scorecards, known limitations, rollback plan, and approved use cases; keep deterministic safety wrappers outside the model so prompt drift or model upgrades cannot change the clinical floor.`
          ])}
        `
      },
      {
        id: "lib-data-ingestion",
        title: "Data Ingestion and QA",
        body: `
          <p><strong>Summary:</strong> Documents how clinical content, aviation tables, local dispositions, Oracle-style employee API feeds, normalized projections, and automated QA tests enter and validate the Phase I system.</p>
          ${ul([
            "Phase I seeding populates open-source/synthetic protocol content, acuity-ordered questions, localized care advice, QuestionAdviceBridge mappings, keyword indexes, and localized Qatar dispositions.",
            "The synthetic employee data factory can generate an Oracle Fusion HCM-style API feed for a 260-aircraft aviation workforce, plus normalized IST staff/dependent projections, 5,000 historical encounters, semantic vectors, and safety audit logs.",
            "The backend keeps the clinical content shape compatible with a later licensed Schmitt-Thompson After Hours / SymptomScreen import - the clinical workspace continues to call the same API contract after the dataset swap.",
            "RAG shadow ledger tables are separate from source clinical data so model comparison, learning feedback, and blocked unsafe outputs cannot contaminate the approved content library.",
            "The current test layer validates staff lookup, adult emergency safety floors, pediatric tachypnea routing, stable-vitals NEWS2 calculation, bilingual SBAR generation, fit-to-fly restriction, and Python AI downgrade blocking.",
            "Seed execution requires a reachable PostgreSQL database and DATABASE_URL. Code-level validation can still run without the database through TypeScript build, Prisma validate, Jest API tests, and Python wrapper tests."
          ])}
        `
      },
      {
        id: "lib-prisma-model",
        title: "Prisma Data Model",
        body: `
          <p><strong>Summary:</strong> Explains the PostgreSQL model used for STCC-compatible clinical content, staff/dependents, queue orchestration, aviation encounters, safety logs, RAG shadow learning, and security administration.</p>
          ${ul([
            "Algorithm, TriageQuestion, CareAdvice, QuestionAdviceBridge, AlgorithmCareAdvice, ProtocolKeywordIndex, and ProtocolSynonym form the core protocol footprint.",
            "ClinicalReference, AlgorithmReference, ClinicalSupplemental, AlgorithmSupplemental, ProtocolTaxonomy, and ProtocolFirstAid close the STCC-compatible gaps for references, appendices, indexes, first aid, and non-question content.",
            "ProtocolRelease, ClinicalContentImportJob, ClinicalContentImportError, source hashes/checksums, and reconciliation fields preserve import lineage and annual update evidence.",
            "StaffMember and Dependent are normalized triage projections of Oracle Fusion HCM worker/contact data, not the long-term HR source of truth.",
            "TriageQueueItem and QueueTransitionLog preserve named-user queue state, call locks, STCC process snapshots, and signed movement traces.",
            "AviationTriageEncounter and SafetyAuditDeviationLog preserve the route, score, final disposition, RAG shadow suggestion, override rationale, and explainability trace once persistence is approved.",
            "RagRetrievalEvent, LlmShadowSuggestion, NurseSelectionEvent, ProtocolComparisonEvent, LearningFeedbackEvent, ModelEvaluationRun, and SafetyBlockedOutput preserve bounded AI/ML evidence separately from source clinical content.",
            "Security administration models define application users, roles, responsibilities, permissions, access profiles, reveal events, encryption policy metadata, and audit events."
          ])}
          <p><strong>Current limitation:</strong> the schema is aligned, but importer population, live Cloud SQL migration, retention policy, and licensed STCC activation are still separate governed tasks.</p>
        `
      },
      {
        id: "lib-simulation-engine",
        title: "Synthetic Simulation Engine",
        body: `
          <p><strong>Summary:</strong> Generates synthetic tele-triage encounters through the full discrete state pipeline: intake, vector protocol match, safety floor, NEWS2-style scoring, aviation gate, Qatar routing, SBAR, and LLM-ready JSONL rows.</p>
          ${ul([
            "The engine is synthetic only - safe for demos, regression tests, prompt evaluation, and governed training workflows because every row is tagged synthetic and contains no PHI.",
            "It follows the same rules-first architecture as the live triage workflow: deterministic safety floors and nurse approval remain authoritative, while AI rows teach explanation and drafting behavior.",
            "Each result includes a state transition log, cosine-similarity protocol match, vital-sign score, aviation gate, final disposition, SBAR note, and an expected-output record for LLM evaluation.",
            "Regional context adds Qatar day-wise season, heat risk, dust risk, respiratory season, vulnerable groups, and demographic priors for safer AI/ML evaluation."
          ])}
        `
      },
      {
        id: "lib-clinical-simulation-engine",
        title: "Complete Clinical Simulation Engine",
        body: `
          <p><strong>Summary:</strong> Runs the full synthetic clinical journey from Oracle-style employee verification through nurse triage, vector retrieval, safety floors, aviation gates, SBAR, FHIR write-back, and audit logging.</p>
          ${ul([
            "EmployeeSimulator consumes the synthetic Oracle Fusion HCM-style feed and verifies staff, dependents, department, job title, and duty status.",
            "VectorKnowledgeEngine applies five-dimensional cosine similarity for adult emergency, pediatric respiratory, pediatric fever/dehydration, back pain, vaccination reaction, female-health, male-health, ear barotrauma, and UNKNOWN fallback anchors.",
            "TriageNurseSimulator runs patient verification, chief complaint mapping, WHO/IITT RED floors, pediatric tachypnea checks, NEWS2 scoring, aviation restrictions, and AI downgrade blocking.",
            "EMRWritebackEngine generates bilingual SBAR Markdown, a simulated FHIR transaction Bundle, Encounter, Observation, ClinicalImpression resources, and append-only safety audit logs.",
            "The bulk runner can stream 100-record rehearsals or 1M-record historical simulations into encounter, audit, and LLM-ready training JSONL partitions.",
            "The built-in suite executes three master-prompt cases: active pilot cardiac emergency, pediatric cough with tachypnea, and stable cabin crew lower back injury."
          ])}
        `
      },
      {
        id: "lib-content-release",
        title: "Clinical content release lifecycle",
        body: `
          ${whatWhyHow(
            "The lifecycle for moving from sample Phase I content to licensed or locally approved clinical protocol releases.",
            "Clinical content is not just data; it is governed medical logic that needs versioning, review, activation, rollback, and audit evidence.",
            [
              "Import a release with source, version, checksums, row counts, and validation errors.",
              "Run clinical and technical regression tests against the imported package.",
              "Activate only one approved content package per mode and region."
            ]
          )}
          ${ul([
            "A content release carries source type, version, region, mode, active status, import metadata, and linked algorithms.",
            "Phase I can load synthetic/open-source sample content for engineering validation while retaining a clear source label.",
            "Licensed STCC or SymptomScreen imports should use a controlled importer, checksum, row counts, skipped rows, validation errors, source record hashes, relationship checks, and duplicate detection.",
            "Only one approved active clinical content package should drive production triage for a defined mode and region."
          ])}
        `
      },
      {
        id: "lib-test-pack",
        title: "Test and Validation Pack",
        body: `
          <p><strong>Summary:</strong> Groups the automated checks that validate Phase I safety behavior after backend, schema, seed, or help-content changes.</p>
          ${ul([
            "Jest/Supertest verifies authentication, staff validation, invalid staff rejection, HRMS-calculated age enforcement, adult RED floor, pediatric tachypnea route, pediatric 5-12 warning, stable NEWS2 pass-through, bilingual SBAR output, AI downgrade blocking, and fit-to-fly restriction.",
            "The Python safety wrapper tests verify that AI HOMECARE passes when vitals are normal and that ROUTINE/HOMECARE downgrades are blocked when RED vitals are present.",
            "Shared fixture tests run the same adult vital-sign scenarios through TypeScript scoring and the Python safety wrapper so RED-floor behavior cannot drift silently between engines.",
            "The synthetic PDP generator tests verify workforce scale math, dependent generation, encounter mix, safety audit volume, and Prisma-shaped record fields.",
            "Frontend typecheck and build validate that the Help/Library content compiles and renders with the current React application."
          ])}
          <p><strong>Release gate:</strong> a release should not proceed if the RED floor, pediatric routing, SBAR, or AI downgrade tests fail.</p>
        `
      },
      {
        id: "lib-remediation-evidence",
        title: "Sequential remediation evidence",
        body: `
          ${whatWhyHow(
            "The review evidence and rollback ledger for the current sequential remediation run.",
            "Clinical, security, and integration fixes must be reversible by layer so one defect does not force a broad rollback of unrelated work.",
            [
              "Review the commit scope and tests listed for each fix.",
              "Use the exact git revert command for the affected commit only.",
              "Re-run the same validation commands after rollback and record any remaining gap separately."
            ]
          )}
        `
      },
      {
        id: "lib-api-contracts",
        title: "API Contract Library",
        body: `<p>See <a href="#" data-topic="system-integrations">System Integrations</a> for the full built/planned API tables (Oracle HCM target API, IST triage/queue/CCP API, and planned cloud/LLM API).</p>`
      }
    ]
  },
  {
    id: "test-results-validation",
    label: "Test Results & Validation",
    articles: [
      {
        id: "test-validation-review",
        title: "What is correct, partially built, and pending production",
        body: `
          <p>This review is based on the current code paths, tests, schema, seed script, and Help text. It separates validated MVP behavior from production dependencies.</p>
          <table class="ref-table">
            <thead><tr><th>Area</th><th>Verdict</th><th>Evidence / next step</th></tr></thead>
            <tbody>
              <tr><td>Staff validation</td><td>Correct</td><td>The API exposes staff validation, and the queue service auto-validates staff/dependent identity, stores HRMS age snapshots, and prevents manual nurse-side age entry. Next: replace mock HRMS records with the Oracle Fusion HCM adapter after HR and privacy approval.</td></tr>
              <tr><td>Vital-sign safety floor</td><td>Correct</td><td>The scoring endpoint applies mandatory RED floors for consciousness, SpO2, respiratory rate, heart rate, and pediatric tachypnea before NEWS2 scoring. Next: expand pediatric age bands and validate thresholds with clinical governance.</td></tr>
              <tr><td>SOAP/SBAR completion</td><td>Correct</td><td>The completion endpoint returns clipboard text by default and JSON with note payload/fit-to-fly status when requested. Next: connect signed clinical note persistence and EMR/FHIR writeback only after retention and writeback policy approval.</td></tr>
              <tr><td>Nurse workspace modes</td><td>Correct</td><td>Step and Board share the queue API; items can be claimed, locked, moved with sequence validation, prioritized by safety/SLA, and handed from Board into Step. Next: run live PostgreSQL migration/UAT, connect Oracle HCM call intake, capture production audit evidence.</td></tr>
              <tr><td>Named user HRMS and tenant queue</td><td>Correct</td><td>The backend has organization-bound sessions, HRMS sync, tenant-scoped queue visibility, session revocation, lock release, and cross-tenant escalation handover tests. Next: replace the mock Oracle-style feed with approved Oracle Fusion HCM credentials and production audit evidence.</td></tr>
              <tr><td>Data ingestion</td><td>Partially built</td><td>The seed script is typed and ready, and a local PostgreSQL 15 target exists for live-mode write/read validation. Next: run the local DB up/migrate/seed sequence and capture seed evidence in the audit dashboard.</td></tr>
              <tr><td>Python AI safety wrapper</td><td>Correct</td><td>Verifies normal HOMECARE pass-through, RED vital downgrade blocking, EMERGENCY severity upgrade, and SQLite audit row creation. Next: promote audit storage from local SQLite to the approved production audit datastore.</td></tr>
              <tr><td>Live enterprise integrations</td><td>Pending production</td><td>Oracle HCM, EMR, scheduling, Twilio/Graph live transport, insurer verification, transcription, and analytics are documented as adapters, not live production connectors. Next: approve secrets, scopes, data residency, service accounts, signed webhooks, and least-privilege policies.</td></tr>
              <tr><td>LLM / MedGemma strategy</td><td>Pending production</td><td>The repository has rules-first simulation data and LLM-ready JSONL rows, but no live MedGemma endpoint, provider key, model registry, or cloud inference adapter is enabled yet. Next: build the evaluation and provider-adapter layer first, then deploy a private GCP Doha inference endpoint only after approvals.</td></tr>
            </tbody>
          </table>
        `
      },
      {
        id: "test-data-strategy-phase1",
        title: "Phase I inception baseline (open-source standards)",
        body: `
          <p>The current backend consumes an open-source clinical safety baseline so engineering can test the complete Rules-First, AI-Second workflow before licensed content is introduced.</p>
          ${ul([
            "Adult triage uses WHO Interagency Integrated Triage Tool style red-floor rules: SpO2 below 92%, respiratory rate below 10 or above 30, and heart rate below 60 or above 130 bpm immediately trigger emergency handling.",
            "Pediatric triage includes WHO ETAT / IMCI style age-specific tachypnea handling - a child under 5 with respiratory rate 40 or above is routed through the pediatric emergency safety floor.",
            "NEWS2 is used as the stable-vitals physiological calculator after mandatory red floors are checked."
          ])}
        `
      },
      {
        id: "test-data-strategy-phase2",
        title: "Phase II production migration (optional licensed upgrade)",
        body: `
          <p>The schema keeps clinical content abstract so licensed Schmitt-Thompson After Hours and SymptomScreen data can replace sample content without rewriting the triage workspace.</p>
          ${ul([
            "SchemaCrawler can reverse-engineer licensed MS SQL or Access structures into DBML, which can then be mapped into the Postgres clinical protocol tables.",
            "The seed/import layer populates Algorithm, TriageQuestion, CareAdvice, QuestionAdviceBridge, localized dispositions, and protocol indexes while the frontend continues calling the same IST APIs.",
            "Clinical governance can compare schema integrity, safety-floor mappings, and local clinic overrides from the operations and audit dashboard before production activation."
          ])}
        `
      },
      {
        id: "test-pack-detail",
        title: "Automated test pack detail",
        body: `
          ${ul([
            "<code>tests/triage.test.ts</code>, <code>tests/simulation.test.ts</code>, <code>tests/safety-alignment.test.ts</code>, and <code>tests/fixtures/triage_scenarios.json</code> verify authentication, staff validation, invalid staff rejection, HRMS-calculated age enforcement, adult RED floor, pediatric tachypnea route, pediatric 5-12 warning, stable NEWS2 pass-through, bilingual SBAR output, AI downgrade blocking, and fit-to-fly restriction.",
            "<code>python/test_safety_wrapper.py</code> verifies AI HOMECARE pass-through when vitals are normal and that ROUTINE/HOMECARE downgrades are blocked when RED vitals are present.",
            "Shared fixtures run the same adult vital-sign scenarios through TypeScript scoring and the Python safety wrapper so RED-floor behavior cannot drift silently between engines.",
            "<code>python/test_synthetic_pdp_generator.py</code> verifies workforce scale math, dependent generation, encounter mix, safety audit volume, and Prisma-shaped record fields.",
            "<code>python/test_clinical_simulation_engine.py</code> and <code>python/test_bulk_clinical_simulation.py</code> verify cosine fallback, prompt case routing, AI downgrade blocking, fit-to-fly restriction, FHIR transaction shape, and audit log creation.",
            "Frontend typecheck and build (<code>npm run typecheck:web</code>, <code>npm run build:web</code>) validate that Help/Library content compiles and renders with the current React application.",
            "<code>prisma validate</code> and <code>generate</code> confirm the schema is syntactically valid and the client reflects the latest model names."
          ])}
          <p><strong>Release gate:</strong> a release should not proceed if the RED floor, pediatric routing, SBAR, or AI downgrade tests fail. <strong>Evidence gap:</strong> database seed execution can be tested locally through Docker Compose PostgreSQL before moving the same schema to Cloud SQL in GCP Doha.</p>
        `
      },
      {
        id: "test-e2e-evidence",
        title: "Automated end-to-end and API test evidence (real, executed cases)",
        body: `
          <p>Beyond the Jest/Python unit and integration suites above, this system has a distinct, real Playwright end-to-end evidence layer: <code>tests/e2e/api-contract.spec.ts</code> and <code>tests/e2e/browser-journey.spec.ts</code>, run against an isolated test server on port 18080 with <code>APP_ENVIRONMENT=simulation</code>. Each test case has a stable ID, objective, preconditions, test data, step-by-step expected/actual results, and named evidence artifacts (Playwright traces/screenshots/video, or the HTML report) - this is the same evidence shown in the in-app Help Center's "Test Results" tab.</p>
          <table class="ref-table">
            <thead><tr><th>ID</th><th>Title</th><th>Category / Module</th></tr></thead>
            <tbody>
              <tr><td>API-001</td><td>Runtime environment and health contract</td><td>Runtime / Platform</td></tr>
              <tr><td>API-002</td><td>Unauthenticated and invalid-login rejection</td><td>Security / Authentication</td></tr>
              <tr><td>API-003</td><td>Named nurse session and role binding</td><td>Security / RBAC</td></tr>
              <tr><td>API-004</td><td>Queue, HRMS age, protocol, and RAG boundary integrity</td><td>Clinical Data / Queue Orchestration</td></tr>
              <tr><td>API-005</td><td>HRMS and clinical master reconciliation</td><td>Clinical Data / Protocol Library</td></tr>
              <tr><td>API-006</td><td>Adult, pediatric, and stable safety scoring</td><td>Clinical Safety / Rules Engine</td></tr>
              <tr><td>API-007</td><td>Provider-neutral gateway status and role denial</td><td>Integration / Call Center Gateway</td></tr>
              <tr><td>API-008</td><td>Incoming call through bilingual SBAR and writeback</td><td>End-to-End / Tele-Triage</td></tr>
              <tr><td>WEB-001</td><td>Simulation banner and credential autofill</td><td>Runtime / Login</td></tr>
              <tr><td>WEB-002</td><td>Invalid browser login remains outside the app</td><td>Security / Login</td></tr>
              <tr><td>WEB-003</td><td>Platform administrator lands in Control Center</td><td>Security / RBAC</td></tr>
              <tr><td>WEB-004</td><td>Queue API-to-UI data parity</td><td>Clinical Data / Nurse Cockpit</td></tr>
              <tr><td>WEB-005</td><td>Answer call and show HRMS, protocol, RAG, and score evidence</td><td>End-to-End / Nurse Cockpit</td></tr>
              <tr><td>WEB-006</td><td>Create and start a true callback request</td><td>Integration / Call Center Gateway</td></tr>
              <tr><td>WEB-007</td><td>Complete all four nurse actions and writeback</td><td>End-to-End / Tele-Triage</td></tr>
              <tr><td>WEB-008</td><td>Help evidence review and governed validation actions</td><td>Governance / Help Center</td></tr>
            </tbody>
          </table>
          <p>These 16 hand-authored cases are run across the API contract runner plus Google Chrome and Microsoft Edge (Playwright projects), and are supplemented by a generated automated regression catalog served at <code>/test-evidence/executed-test-catalog.json</code> (built by <code>scripts/generateHelpTestCatalog.ts</code>) - the in-app Test Results tab merges both sources, lets a reviewer expand any case to compare expected vs. actual per step, and records a validation decision (Validated / Rejected / Retest Required) with a mandatory reason for anything other than validating.</p>
        `
      }
    ]
  }
];
