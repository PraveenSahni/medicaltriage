# IST Health Tele-Triage and Clinical Decision Support

## Slide-by-Slide Speaker Notes

Source presentation: `IST_Health_Tele_Triage_Clinical_Decision_Support_Updated.pptx`

Audience: business sponsors, nursing operations, clinical governance, IT, security, privacy, and integration stakeholders.

Recommended presentation length: 25 to 30 minutes, followed by 10 to 15 minutes for questions and a guided product demonstration.

## Deck Review

The presentation tells a coherent story from the operating problem through the nurse workflow, service-management controls, clinical safety, Qatar localization, enterprise architecture, readiness, and implementation decisions. The strongest differentiators are the one-call nurse cockpit, deterministic safety floors, STCC-compatible workflow, bounded RAG shadow, Qatar routing and aviation context, CCP continuity, and named-user governance.

The slides are intentionally information-dense. Present the headline and the operational meaning rather than reading every item. Use the readiness language consistently:

- **Demo ready:** available for controlled demonstration with synthetic data.
- **Foundation implemented:** backend or control foundation exists, but the complete live journey is not released.
- **External dependency:** requires licensed content, a customer system, provider credentials, approval, or endpoint onboarding.
- **Planned:** remains to be built or aligned.

Important presentation boundaries:

- The solution is nurse-controlled clinical decision support, not autonomous diagnosis.
- Synthetic and open-source content demonstrates the STCC-compatible process; licensed STCC content is required for production use.
- Voice AI and MedGemma cannot determine disposition or bypass the deterministic rules engine.
- National HIE and EMR/FHIR write-back are controlled integration capabilities, not claims of a current live connection.
- GCP Doha `me-central1` is the target Qatar trust boundary, subject to service-by-service residency validation and customer approval.

## Slide 1 - IST Health Tele-Triage and Clinical Decision Support

**Opening line**

IST Health is a governed tele-triage and clinical decision-support platform designed for employee and dependent healthcare operations in Qatar.

**Speaking points**

- The platform brings the call queue, employee identity, clinical protocol execution, local routing, follow-up, and governance into one traceable journey.
- It is designed for high-volume employee populations served by a limited number of triage nurses.
- The operating model is rules-first and nurse-controlled. AI supports interpretation and comparison but does not make the clinical decision.
- The demonstration uses synthetic data and a controlled clinical-content model.

**Transition**

Start with the operational problem the product is solving.

**Presenter guardrail**

Do not describe the platform as a production-approved medical device or an autonomous symptom checker.

## Slide 2 - Business Problem: Safe Triage at Scale with Limited Clinical Capacity

**Opening line**

The business challenge is not simply answering calls; it is handling continuous demand safely, quickly, and with evidence of every decision.

**Speaking points**

- Thousands of employees and dependents can generate live calls, callbacks, duty-sensitive questions, and seasonal demand spikes.
- A small clinical team needs to see the oldest waits, highest-acuity cases, abandoned calls, station context, and nurse workload.
- Clinical safety requires emergency findings to appear early and lower-acuity workflow to remain blocked until those findings are addressed.
- Traceability requires one clinical owner, validated facts, a reviewable clinical path, and an auditable handoff.
- IST Health combines queue control, nurse workflow, safety rules, local routing, and evidence instead of treating them as separate tools.

**Transition**

The next slide shows how those controls form one governed journey.

## Slide 3 - Product Overview: One Governed Journey from Call to Follow-Up

**Opening line**

Every encounter moves through two connected phases: intake and clinical assessment, followed by disposition, advice, handoff, and follow-up.

**Speaking points**

- A live call or callback enters through a provider-neutral call-center boundary.
- HRMS resolves the employee or dependent and calculates age before the case enters the clinical queue.
- A nurse claims and locks one case, reviews the prepared protocol candidate, and works through the controlled assessment.
- The rules engine fixes the minimum safe acuity; approved advice and a local source of care follow that result.
- The system creates SBAR or SOAP output only from validated facts, then opens CCP follow-up, referral, or closure as required.
- The three guarantees are nurse ownership, no autonomous diagnosis, and clear readiness status.

**Transition**

Now move from the end-to-end flow to the nurse's actual working surface.

**Presenter guardrail**

On identity, say the nurse reviews auto-validated HRMS evidence. Do not imply that age is manually entered or recalculated by the nurse.

## Slide 4 - Nurse Cockpit: One Active Call, Four Controlled Clinical Actions

**Opening line**

The nurse cockpit deliberately limits the user to one active encounter so attention, ownership, and safety state cannot become fragmented.

**Speaking points**

- The call context shows the patient type, calculated age, reason for call, queue owner, and live or callback status.
- Answer or callback accepts the telephony interaction; HRMS evidence is reviewed rather than manually recreated.
- Claim and lock prevents two nurses from progressing the same clinical case.
- The four action tabs are Reason and Emergency Rule-Out, Questions, Disposition and Advice, and SBAR or Complete.
- Safety state, protocol path, route, advice, and handoff remain visible throughout the encounter.
- The nurse can hold, resume, release, escalate, transfer, complete, or create CCP follow-up without surrendering clinical ownership.

**Transition**

Use a pediatric fever call to demonstrate how this works in practice.

## Slide 5 - Nurse Encounter Walkthrough: Pediatric Fever Call

**Opening line**

This scenario follows a parent calling about an eligible employee's dependent with fever and fast breathing.

**Speaking points**

- The call-center event creates the queue item, and HRMS resolves the dependent and age.
- The nurse accepts the call, and the platform creates a single-owner encounter lock.
- Emergency rule-out checks available observations, reported danger signs, consciousness, breathing, and any reliable measured vital signs.
- The selected pediatric protocol presents questions from highest to lowest acuity.
- The first confirmed Yes fixes the provisional minimum disposition and prevents unsafe downgrading.
- The system displays targeted care advice and the configured Qatar source of care.
- The nurse validates the facts, completes the handoff note, and opens referral or CCP follow-up when needed.
- Cockpit, Kanban, audit, reporting, and CCP reflect the same encounter state.

**Transition**

The nurse owns the clinical case; the service manager supervises flow and capacity.

**Presenter guardrail**

Do not imply every telephone caller has connected clinical devices. The nurse uses reported observations and any available reliable measurements.

## Slide 6 - Triage Service Manager Operations: Command View without Clinical Bypass

**Opening line**

The Triage Service Manager sees operational risk across the service but cannot take over the nurse's clinical authority.

**Speaking points**

- The board organizes cases by Incoming Queue, Reason and Rule-Out, Questions, Disposition and Advice, and SBAR or Complete.
- Managers monitor volume, wait time, staffing coverage, held or delayed calls, escalations, stale locks, and routing bottlenecks.
- The board mirrors the same state machine used by the cockpit, so it is not a separate source of truth.
- Valid transitions can be supervised, but the manager cannot answer clinical questions, lower acuity, or approve a disposition.
- Personal data remains masked unless the user also holds the required purpose-based reveal permission.

**Transition**

This separation works because minimum clinical acuity is protected by deterministic rules.

## Slide 7 - Rules-First Clinical Safety: Deterministic Floors Protect Minimum Acuity

**Opening line**

The safety kernel establishes a non-negotiable minimum acuity before AI advice or workflow convenience can influence the case.

**Speaking points**

- Emergency floors include low SpO2, extreme respiratory or heart rate, altered consciousness, pediatric danger signs, and protocol-specific red findings.
- When a floor is triggered, the minimum disposition becomes Emergency and the configured emergency route is selected.
- The safety state remains visible in the cockpit, board, handoff, and audit trail.
- AI cannot downgrade the floor, a manager cannot bypass it, and an unapproved route cannot replace it.
- Any human exception or override requires an authorized role, rationale, and a signed audit trace.
- The nurse remains the accountable clinical decision owner and may always escalate above the minimum.

**Transition**

The rules engine is embedded in an STCC-compatible clinical process.

## Slide 8 - STCC-Compatible Clinical Process and Content Boundary

**Opening line**

IST Health follows the STCC process shape while maintaining a strict boundary between demonstration content and licensed production content.

**Speaking points**

- The sequence is Opening, Reason for Call, Guideline Selection, Initial Assessment, Triage Questions, Disposition, Care Advice, and Closing or Handoff.
- Search words and caller narrative prepare candidate guidelines; the nurse confirms the correct guideline.
- Initial assessment captures complaint context and emergency rule-out information.
- Triage questions are presented in acuity order until a Yes fixes the disposition or the path is exhausted.
- Care advice is linked to the selected disposition and approved content version.
- The current demonstration uses synthetic or open-source content to prove the workflow and data shape.
- Production requires licensed STCC import, reconciliation, clinical acceptance, version control, and governance approval.

**Transition**

AI is placed beside this controlled process as a bounded shadow, not inside the decision authority.

**Presenter guardrail**

Use the phrase "STCC-compatible process." Do not state that the demonstration contains the complete licensed STCC catalogue.

## Slide 9 - Bounded RAG Shadow: Advisory AI Beside the Nurse

**Opening line**

The RAG shadow observes the same encounter in parallel and compares the nurse's path with approved content, while the deterministic workflow remains authoritative.

**Speaking points**

- The shadow can rank keyword and protocol candidates, interpret transcript segments, and show confidence with evidence.
- Retrieval is constrained to approved content identifiers and release versions.
- The system records agreement, partial agreement, disagreement, and insufficient-evidence outcomes.
- These comparisons create governed evaluation data for quality improvement and later model development.
- The shadow cannot invent questions or advice, select a care route, approve disposition, or downgrade a safety floor.
- The foundation is implemented; a production model endpoint and licensed content remain external dependencies.

**Transition**

The same bounded principle applies to the planned English Voice AI journey.

## Slide 10 - English Voice AI: Backend Foundation with Nurse Validation Boundary

**Opening line**

Voice AI is designed to reduce repetitive intake effort while ensuring the nurse validates every clinically relevant answer before it affects the encounter.

**Speaking points**

- Local backend components support English initial-assessment prompts, constrained transcript interpretation, answer validation, correction, and training-example export.
- The intended journey can use approved pre-recorded prompts for fixed questions, with interruption handling and speech recognition for caller responses.
- The nurse receives the transcript, extracted answer, confidence, and source prompt for rapid validation or correction.
- Only nurse-validated answers may populate the authoritative encounter state.
- The frontend review journey, live audio, telephony orchestration, speech-to-text, voice activity detection, and recording workflow remain pending.
- MedGemma deployment requires a governed endpoint, model registry, offline safety evaluation, monitoring, feedback controls, and rollback.
- Arabic voice is intentionally deferred from this scope.

**Transition**

The product becomes more valuable when these controls are localized to Qatar's operational context.

**Presenter guardrail**

Do not claim that MedGemma has been clinically trained, validated, or deployed in production. Describe the governed training and evaluation design.

## Slide 11 - Qatar-Specific Advantage: Routing, Aviation and Occupational Context

**Opening line**

IST Health is not a generic global symptom interface; it adds Qatar workforce, care-route, aviation, and occupational context around the clinical protocol.

**Speaking points**

- HRMS provides employee or dependent eligibility, duty status, staffing role, station, and calculated age.
- The model recognizes Doha, HIA, outstation, duty-sensitive, and occupational-health contexts.
- Demonstration routes include HMC emergency or urgent pathways, Sidra pediatric emergency, PHCC review, and approved clinic or teleconsult options.
- Aviation controls include fit-to-fly, fit-to-duty, HIA medical-center review, Medical Commission context, and outstation escalation.
- These factors refine the source of care after the clinical minimum acuity is established.
- All routes and aviation policies remain configurable until the customer's clinical and operational governance teams approve the production catalogue.

**Transition**

This is why clinical disposition and aviation clearance are modeled as related but separate decisions.

## Slide 12 - Disposition and Fit-to-Fly: Linked, Separate and Protected

**Opening line**

Clinical severity is decided first; fit-to-fly or fit-to-duty status is a separate governed overlay and can never weaken the clinical result.

**Speaking points**

- Clinical disposition uses Emergency, Urgent, Routine, or Self-care.
- Aviation status uses Cleared, Medical Review Required, or Restricted.
- Cleared is available only when no safety restriction applies and an authorized workflow permits it.
- Medical Review Required routes the case to an occupational or aviation clinician.
- Emergency, Urgent, or a no-fly or no-duty rule produces Restricted.
- The hard rule is simple: an Emergency or Urgent case must never display fit-to-fly clearance.

**Transition**

After the clinical decision, CCP keeps follow-up communication continuous without corrupting encounter history.

## Slide 13 - CCP Follow-Up: Communication Continuity without Merging Encounters

**Opening line**

CCP gives each employee one communication index while keeping every call, visit, teleconsult, or clinic encounter as a separate thread.

**Speaking points**

- Nurses can see the current thread, previous closed threads, open goals, and next actions.
- Prior communication is linked for context but is never merged into the new clinical encounter.
- Callback precautions, referral reminders, fit-to-duty follow-up, and acknowledgements can be tracked as goals.
- WhatsApp, email, and SMS are provider adapters behind the same governed pipeline.
- Outbound clinical messages remain drafts until a nurse reviews and approves them.
- The demo uses synthetic threads and approved drafts; live provider credentials and customer channel policy remain production dependencies.

**Transition**

When the encounter is complete, the same approval boundary controls health-record write-back.

## Slide 14 - Qatar National HIE and EMR/FHIR Write-Back Boundary

**Opening line**

IST Health prepares a minimum-necessary FHIR handoff only after nurse completion, human approval, consent, and target-route validation.

**Speaking points**

- The approval trace is verified before any external write-back is attempted.
- Consent policy determines whether the target National HIE or approved health-record endpoint may receive the document.
- The integration layer selects the configured customer mapping, such as an approved Sidra, HMC, PHCC, Epic, or Cerner profile.
- The initial exchange pattern is a restricted FHIR DocumentReference carrying the approved SBAR note and controlled metadata.
- Every outcome is audited as dry-run, sent, consent-denied, failed, or clipboard fallback.
- Dry-run validates the payload without calling an external endpoint.
- Live endpoint onboarding, profiles, OAuth, mappings, customer approvals, and integration UAT remain external dependencies.

**Transition**

The integration boundary sits inside a Qatar-resident target architecture.

**Presenter guardrail**

Refer to the "Qatar National Health Information Exchange, or an approved health-record endpoint." Do not claim a current live National HIE, HMC, PHCC, Sidra, Epic, or Cerner connection.

## Slide 15 - Qatar-Resident GCP Architecture and Data Boundary

**Opening line**

The target design places the clinical platform and its primary data controls inside GCP Doha `me-central1`, with only minimum-necessary governed exchange across the boundary.

**Speaking points**

- Users access the nurse cockpit, service-manager board, governance controls, administration, and Help through a controlled frontend and API layer.
- Cloud Run hosts the application services, queue orchestration, rules engine, STCC-compatible workflow, bounded RAG shadow, and FHIR gateway.
- Cloud SQL and approved storage services persist clinical state, protocol metadata, audit evidence, recordings, and transcripts according to policy.
- Secret Manager, encryption in transit and at rest, and least-privilege IAM protect credentials and service access.
- STCC content is imported through a governed ingestion process, versioned, validated, and exposed to the rules engine and retrieval layer through approved identifiers and APIs.
- External systems include HRMS, call center, EMR, National HIE, SSO, and communication providers; they exchange only the data required for the approved purpose.
- Qatar residency is enforced through location policy, architecture review, logging, and service-by-service validation.

**Transition**

Technology controls are reinforced by named-user governance, privacy, and audit.

**Presenter guardrail**

Do not make a blanket residency guarantee for every GCP service or external provider. State that each service and data flow requires validation against customer policy and Qatar requirements.

## Slide 16 - Governance and Access: Named Users, RBAC, Privacy and Audit

**Opening line**

Every capability is assigned to a named user and an explicit responsibility; role selection is not a cosmetic frontend filter.

**Speaking points**

- Named users receive assigned roles, and server-side permission checks enforce the permitted actions.
- Clinical, operational, governance, security, privacy, integration, and audit responsibilities are separated.
- Personal information is masked by default, with purpose-based, time-limited reveal when an authorized role requires it.
- Reveal records include requester, purpose, scope, approval, and expiry.
- Governance evidence includes protocol releases, route and aviation policy approvals, exceptions, reports, and rollback history.
- Operational managers receive de-identified information by default.
- Enterprise SSO and MFA remain production integration dependencies.

**Transition**

With those boundaries clear, the next slide gives an honest view of current readiness.

## Slide 17 - Current Readiness: Demo, Foundation and External Dependencies

**Opening line**

This slide separates what can be demonstrated today from what still depends on licensed content, customer systems, providers, or further build work.

**Speaking points**

- The nurse cockpit, supervisor Kanban, safety rules, synthetic HRMS, and synthetic or open-source protocol process are demo ready.
- FHIR dry-run controls and the English Voice AI backend are foundation implemented.
- Oracle HRMS, licensed STCC, live National HIE or EMR, and a governed MedGemma endpoint are external dependencies.
- Voice AI frontend alignment and live telephony orchestration are planned.
- Demo ready means suitable for controlled validation with synthetic data; it does not mean clinically approved production use.
- Production requires governance acceptance, validated integrations, security and privacy testing, clinical UAT, and operational sign-off.

**Transition**

The roadmap converts these dependencies into an ordered customer implementation plan.

## Slide 18 - Implementation Roadmap and Customer Decisions

**Opening line**

The implementation is organized so clinical content and governance are established before live integrations and AI expansion.

**Speaking points**

- Stage 1 covers STCC licensing and import, content reconciliation, Qatar route approval, clinical UAT, and negative testing.
- Stage 2 connects Oracle HRMS, the chosen call-center provider, enterprise SSO and MFA, and approved EMR or National HIE endpoints.
- Stage 3 aligns the Voice AI frontend, telephony, STT, VAD, audio, MedGemma governance, monitoring, and rollback.
- Stage 4 hardens Doha location controls, privacy and security testing, monitoring, failover, support, and go-live approvals.
- Customer decisions are required for content licensing, clinical approvers, integration owners, telephony provider, data-residency policy, communication channels, FHIR profiles, and acceptance criteria.
- The sequence avoids training or integrating AI against an unapproved clinical-content baseline.

**Transition**

The demonstration can already validate the operating model while those decisions are made.

## Slide 19 - Demo Validation Guide: Where and How to Verify Capabilities

**Opening line**

Every major presentation claim maps to a visible product area and a readiness status.

**Speaking points**

- `#/workspace` validates the queue, HRMS context, one-call cockpit, rule-out, questions, disposition, advice, and SBAR.
- `#/kanban` validates manager stages, owners, locks, waits, safety state, routes, and valid transitions.
- `#/admin` validates named users, RBAC, privacy reveal, audit, governance, integrations, and reports.
- `#/ccp` validates the employee communication index, separate encounter threads, linked history, and nurse-approved drafts.
- `#/help` validates the call flow, Qatar model, STCC/RAG shadow architecture, integration evidence, and test results.
- A capability should not be presented to a customer until its label is confirmed as demo ready, foundation implemented, external dependency, or planned.

**Transition**

Close by returning to the combined business and clinical value.

## Slide 20 - Let's Drive the Future Together

**Closing line**

IST Health provides a single governed platform for call-center operations, employee identity, protocol execution, Qatar routing, aviation context, communication continuity, and enterprise evidence.

**Speaking points**

- The business value is faster and more consistent use of limited clinical capacity.
- The clinical value is acuity-first assessment with protected safety floors and nurse accountability.
- The operational value is one queue, one case owner, visible service state, and controlled follow-up.
- The enterprise value is named-user access, privacy controls, audit evidence, versioned content, and provider-neutral integrations.
- The immediate next step is to agree the clinical-content baseline, customer integration owners, Qatar routing catalogue, pilot scope, and acceptance criteria.

**Recommended final question**

Which validation stream should we start first: the nurse and service-manager workflow, Qatar clinical routing, or the customer integration and residency design?

## Anticipated Questions and Short Responses

### Is this an autonomous AI triage system?

No. The deterministic rules engine and approved clinical content control the minimum safe path. The nurse validates information and approves the disposition. AI remains advisory.

### Does the demo contain licensed STCC content?

No. It demonstrates the STCC-compatible process and data shape using synthetic and open-source content. Production requires licensed STCC ingestion, reconciliation, and clinical acceptance.

### Is Voice AI operational today?

The English initial-assessment backend foundation and validation patterns exist. The live frontend, telephony, STT, VAD, audio, recording, and governed MedGemma deployment remain to be completed.

### Is the platform connected to Qatar's National HIE?

The consent, approval, FHIR dry-run, audit, and fallback foundation is implemented. Live endpoint onboarding and customer-approved integration remain external dependencies.

### Is all data guaranteed to remain in Qatar?

The target architecture uses GCP Doha `me-central1` as the Qatar trust boundary. Each service, integration, log, backup, and support path must be validated and approved before production.

### Can a service manager change a clinical disposition?

No. The service manager manages queue flow, staffing, locks, and operational escalations. Clinical questions, safety floors, disposition, and final approval remain with authorized clinical roles.

### Can an Emergency case be marked fit to fly?

No. Emergency or Urgent status must produce a restricted aviation outcome. Fit-to-fly clearance is a separate governed decision and cannot weaken the clinical disposition.
