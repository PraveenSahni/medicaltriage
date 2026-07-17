import {
  AlertTriangle,
  BookOpen,
  BrainCircuit,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  Database,
  ExternalLink,
  FileCheck2,
  GitBranch,
  HelpCircle,
  Hospital,
  Kanban,
  Languages,
  LockKeyhole,
  MapPin,
  MessageSquare,
  PhoneCall,
  PlugZap,
  Route,
  SearchCheck,
  ShieldCheck,
  Stethoscope,
  TimerReset,
  UserRoundCheck,
  Users,
  Workflow
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { InteroperabilityTab } from "./components/HelpCenter/InteroperabilityTab";
import { SystemPurposeTab } from "./components/HelpCenter/SystemPurposeTab";
import { TestEvidenceCenter } from "./components/HelpCenter/TestEvidenceCenter";
import { ApiCatalogTable, HelpCard, MatrixHelpCard, MiniDefinition } from "./components/HelpCenter/shared";

type TabKey = "help" | "tests" | "library" | "overview" | "workflow" | "qatar" | "integration" | "governance" | "security";

type HelpTab = {
  key: TabKey;
  label: string;
  icon: LucideIcon;
};

type WhatWhyHow = {
  what: string;
  why: string;
  how: string[];
};

type LibraryArea = {
  id: string;
  title: string;
  eyebrow: string;
  icon: LucideIcon;
  summary: string;
  framework?: WhatWhyHow;
  usedBy: string[];
  details: string[];
  helps?: Array<{
    title: string;
    body: string;
  }>;
  usefulFor?: Array<{
    title: string;
    body: string;
  }>;
  exampleFlow?: string[];
};

type DataStrategyCard = {
  title: string;
  eyebrow: string;
  icon: LucideIcon;
  status: string;
  body: string;
  bullets: string[];
  formula?: string;
  link: {
    href: string;
    label: string;
  };
};

type MatrixCard = {
  title: string;
  eyebrow: string;
  icon: LucideIcon;
  body: string;
  bullets: string[];
  link: {
    href: string;
    label: string;
  };
};

type HelpGuide = {
  title: string;
  eyebrow: string;
  icon: LucideIcon;
  audience: string;
  goal: string;
  framework: WhatWhyHow;
  steps: string[];
  safety: string;
};

type ValidationReviewItem = {
  area: string;
  verdict: "Correct" | "Partially built" | "Pending production";
  evidence: string;
  nextStep: string;
};

type ApiCatalogRow = {
  area: string;
  api: string;
  use: string;
  status: string;
};

type RoleAccessRow = {
  category: string;
  prefix: string;
  role: string;
  access: string;
  permissions: string[];
  responsibilities: string[];
  scopes: string[];
};

type SecurityAdminHelpTopic = {
  id: string;
  title: string;
  eyebrow: string;
  icon: LucideIcon;
  summary: string;
  built: string[];
  controls: string[];
  production: string[];
};

type FacilityLink = {
  label: string;
  href: string;
};

type CareFacilityInfo = {
  name: string;
  category: string;
  summary: string;
  sourceNote: string;
  links: FacilityLink[];
};

type DispositionRouteDetail = {
  code: string;
  destination: string;
  severityBand: string;
  trigger: string;
  selectedWhen: string[];
  dataUsed: string[];
  handoff: string[];
  governance: string;
  facility: CareFacilityInfo;
};

const tabs: HelpTab[] = [
  { key: "help", label: "Help", icon: HelpCircle },
  { key: "tests", label: "Test Results", icon: ClipboardCheck },
  { key: "library", label: "Library", icon: BookOpen },
  { key: "overview", label: "System Map", icon: ShieldCheck },
  { key: "workflow", label: "Call Flow", icon: Workflow },
  { key: "qatar", label: "Qatar Model", icon: MapPin },
  { key: "integration", label: "Integration", icon: PlugZap },
  { key: "governance", label: "Governance", icon: ShieldCheck },
  { key: "security", label: "Security Admin", icon: LockKeyhole }
];

const operatingStats = [
  { label: "Core paths", value: "3", detail: "Nurse triage, CCP follow-up, and administration" },
  { label: "Severity levels", value: "4", detail: "Emergency, Urgent, Routine, Self-care" },
  { label: "Local routes", value: "8", detail: "HMC, Sidra, PHCC, IST teleconsult, self-care" },
  { label: "Audit flags", value: "4", detail: "AI differed, override up, downgrade blocked, final rules" }
];

const teleTriageStages = [
  {
    title: "Remote intake",
    body:
      "When the call enters the queue, the API validates the staff/dependent relationship against HRMS, calculates age from date of birth, and carries language, location, duty status, and local/outstation context into the nurse workspace."
  },
  {
    title: "Complaint matching",
    body:
      "The system maps the caller's words to a protocol using chief complaint, symptom keywords, age, sex, mode, and red-flag terms."
  },
  {
    title: "Acuity rule-out",
    body:
      "Emergency rule-out is reviewed before the assessment path. After that, the assessment tab presents one acuity-ordered question at a time, with emergency-level questions ahead of urgent, routine, and self-care items."
  },
  {
    title: "Clinical plus aviation context",
    body:
      "The rules combine symptoms with crew role, on-duty state, outstation status, fit-to-fly concern, sickness leave, vaccination reaction, and occupational visit flags."
  },
  {
    title: "Disposition proposal",
    body:
      "The engine returns severity, destination, rationale, trace, insurance notes, aviation tags, and whether the route is emergency, urgent, teleconsult, clinic, or self-care."
  },
  {
    title: "Clinician handoff",
    body:
      "The clinician validates the output, documents the decision, copies the SBAR/SOAP note, and opens CCP follow-up for transfer, appointment, callback, or escalation."
  }
];

const teleTriageDecisionContract = [
  {
    label: "What the system decides",
    body:
      "It proposes the minimum safe severity, disposition code, care destination, rationale, rule trace, and SBAR payload."
  },
  {
    label: "What the clinician decides",
    body:
      "The clinician confirms, overrides upward when needed, documents clinical judgment, and remains accountable for the final advice."
  },
  {
    label: "What production must connect",
    body:
      "Licensed protocols, live HRMS, insurance, scheduling, EMR/FHIR writeback, audit persistence, and approved Arabic translation."
  }
];

const systemCards = [
  {
    title: "Rules-first clinical safety",
    icon: ShieldCheck,
    body:
      "The system treats deterministic triage logic as the safety floor. AI can summarize, highlight risks, and flag approved protocol context for nurse review, but it cannot lower a protected high-acuity disposition."
  },
  {
    title: "Governed MedGemma copilot strategy",
    icon: BrainCircuit,
    body:
      "MedGemma is planned as a clinical language copilot for explanation, summarization, translation support, and SBAR drafting. It is not the triage authority; deterministic rules and nurse approval remain the clinical control."
  },
  {
    title: "STCC-compatible nurse workflow",
    icon: Stethoscope,
    body:
      "The clinical pathway follows the STCC-compatible telehealth pattern: search by chief complaint, work through red-flag questions first, capture rationale, and produce a structured SBAR/SOAP note."
  },
  {
    title: "Tele-triage encounter engine",
    icon: PhoneCall,
    body:
      "The system supports a remote consultation from auto-validated HRMS identity through symptom capture, protocol matching, acuity rule-out, local routing, clinician validation, and SBAR handoff."
  },
  {
    title: "CCP employee communication",
    icon: MessageSquare,
    body:
      "CCP means Continuous Communication Pipeline in this solution: one employee index with separate visit/call threads, linked previous communication, consent, callbacks, and audit."
  },
  {
    title: "SymptomScreen-style access support",
    icon: ClipboardList,
    body:
      "A simplified screening layer is planned for front-desk or call-center staff so non-clinical users can identify urgent concerns without exercising clinical judgment."
  },
  {
    title: "IST Health localization",
    icon: MapPin,
    body:
      "The MVP localizes routing around staff identity, dependents, insurance status, IST medical workflows, HMC/Sidra emergency routes, fit-to-fly gates, outstation review, and sickness validation."
  }
];

const helpGuides: HelpGuide[] = [
  {
    title: "Remote Triage Nurse operating guide",
    eyebrow: "Primary clinical user",
    icon: Stethoscope,
    audience: "Remote Triage Nurse, Senior Triage Nurse, Pediatric Triage Nurse",
    goal:
      "Run a safe remote encounter from HRMS-validated caller context to disposition, SBAR note, and CCP follow-up without allowing AI to downgrade the rules engine.",
    framework: {
      what:
        "A nurse-led operating guide for one remote triage encounter after HRMS has already validated caller identity and calculated age at queue entry.",
      why:
        "The core problem is safe triage at call-center speed: nurses need a clear sequence that catches high-acuity findings early, keeps AI advisory, and preserves accountability.",
      how: [
        "Review the auto-loaded HRMS staff/dependent evidence before collecting clinical detail.",
        "Capture symptoms, vitals, duty state, language, and aviation flags while using the calculated HRMS age.",
        "Apply deterministic red floors first, then answer the guided assessment questions one at a time until a Yes fixes the route or the question path is exhausted."
      ]
    },
    steps: [
      "Open the queue case only after the API has validated staff/dependent identity and calculated age from HRMS.",
      "Use the call-context strip for pre-triage facts such as channel, wait time, patient type, age, station, and HRMS validation.",
      "Start clinical work in the first action tab: Reason & Emergency Rule-Out. Confirm the reason narrative, review guideline search, and check emergency safety-floor rules.",
      "Use the rules-first output as the minimum safe floor: non-alert consciousness, low SpO2, extreme respiratory rate, extreme heart rate, and pediatric tachypnea cannot be downgraded.",
      "Move to Assessment Questions only after emergency rule-out. The nurse answers the single active question; No unlocks the next acuity item, while Yes stops lower-priority questions and fixes the provisional disposition.",
      "Review the proposed route, safety rationale, and trace before copying the SOAP/SBAR handoff.",
      "Open CCP when a callback, transfer handoff, safety precaution, fit-to-duty follow-up, or employee message needs tracking."
    ],
    safety:
      "The nurse owns the final clinical advice. AI may draft or explain, but the clinician validates and approves the final disposition and any employee-facing message."
  },
  {
    title: "Provider-neutral call-center guide",
    eyebrow: "Incoming calls, callbacks, and recordings",
    icon: PhoneCall,
    audience: "Remote Triage Nurse, Call Intake Coordinator, Triage Service Manager, Integration Administrator, Privacy Officer",
    goal:
      "Connect incoming telephone calls and callbacks to the clinical queue without coupling IST Health to one telephony vendor or allowing the call platform to make clinical decisions.",
    framework: {
      what:
        "A provider-neutral integration gateway that normalizes call events, synchronizes them with the IST queue, and exposes governed answer, callback, hold, resume, and end commands.",
      why:
        "Telephony providers should transport calls, not own HRMS identity validation, queue locks, STCC protocol selection, disposition, or care advice. A stable gateway prevents vendor lock-in and preserves one auditable clinical workflow.",
      how: [
        "Accept HMAC-signed provider events, normalize them, persist the event before processing, and use provider event IDs for idempotency.",
        "Resolve the target organization, validate staff/dependent identity through HRMS, and create the clinical queue case only after identity succeeds.",
        "When a nurse answers or starts a callback, claim the queue case first, execute the configured provider adapter, and release the lock if the provider rejects or fails.",
        "Store recording governance metadata in GCP Doha, require the approved notice plus consent or legal basis, and keep raw recordings outside the clinical RAG corpus."
      ]
    },
    steps: [
      "A provider sends CALL_OFFERED or CALLBACK_REQUESTED to the signed inbound event endpoint.",
      "The gateway rejects invalid signatures, deduplicates retries, masks the caller number, and records only approved operational metadata.",
      "Unidentified callers remain in identity resolution; they do not enter the clinical queue.",
      "The nurse selects Answer for a live incoming call or Call back for a callback case from the same cockpit.",
      "The gateway claims the queue item, invokes the selected provider adapter, records the command result, and opens the case only after connection succeeds.",
      "Recording availability is accepted only for me-central1 with notice, consent/legal basis, checksum metadata, and ragEligible=false."
    ],
    safety:
      "The dry-run adapter and normalized event/command contracts are implemented. Production still needs an approved provider adapter, credentials, DNIS-to-organization mapping, recording bucket/KMS/retention policy, and operational monitoring."
  },
  {
    title: "Nurse cockpit mode guide",
    eyebrow: "Step or Board workspace",
    icon: Kanban,
    audience: "Remote Triage Nurse, Senior Triage Nurse, Triage Service Manager, UAT customer reviewers",
    goal:
      "Choose the correct nurse workspace style: Step cockpit for one active clinical encounter, or Board cockpit for queue supervision and shift-level visibility.",
    framework: {
      what:
        "The platform now offers two nurse workspace modes: the guided Step cockpit at #/workspace and the Kanban-style Board cockpit at #/kanban.",
      why:
        "Different users need different operational views. The nurse conducting clinical triage needs a controlled one-call sequence, while shift leads and customers often need a board view of queue load, stage distribution, and safety-floor cases.",
      how: [
        "Use Step when actively triaging one caller, confirming the reason for call, ruling out emergency safety floors, answering triage assessment questions, reviewing route rationale, and completing SBAR.",
        "Use Board when supervising multiple incoming calls, checking which stage each case is in, reviewing severity mix, and deciding which case should be picked next.",
        "Do not use Board movement to bypass deterministic safety floors, clinical stage completion, route review, or Remote Triage Nurse approval."
      ]
    },
    steps: [
      "Open Step from the header when a nurse is ready to work one case through action tabs: Reason & Emergency Rule-Out, Questions, Disposition, and SBAR / Complete.",
      "Open Board from the header when a shift lead or reviewer needs to see Incoming, Reason / HRMS-ready, Clinical triage, Disposition, and SBAR / follow-up columns.",
      "Keep emergency and safety-floor cards visible and prioritized in either mode.",
      "When a Board card is selected for clinical work, continue the actual clinical decision in the guided Step cockpit.",
      "During UAT, capture which roles prefer Step by default and which roles prefer Board by default."
    ],
    safety:
      "Step remains the safer default for Remote Triage Nurse clinical execution. Board is a queue-supervision option and must not replace clinical stage completion, safety-floor enforcement, or nurse approval."
  },
  {
    title: "Named user and tenant queue guide",
    eyebrow: "Oracle HRMS directory",
    icon: Users,
    audience: "Triage Service Manager, Remote Triage Nurse, Security Administrator, Integration Administrator",
    goal:
      "Operate the system in named-user mode so every queue action is tied to a clinician, organization, role, session, and signed transition trace.",
    framework: {
      what:
        "The backend now supports organization-bound named users, HRMS directory sync, auto-validated staff/dependent queue ingress, tenant-scoped queue visibility, lock release, and cross-tenant escalation handover.",
      why:
        "For internal employee tele-triage, anonymous or shared access is not sufficient. Nurses must see only the calls routed to their organization unless an approved escalation moves the case to another organization.",
      how: [
        "Oracle-style HRMS sync upserts active users and maps job context into role and organization membership.",
        "Queue creation validates the staff/dependent relationship and calculates age from HRMS before the case becomes nurse-visible.",
        "Inactive, on-leave, or rest-period status revokes active sessions, releases queue locks, and blocks future login.",
        "Queue list, claim, update, move, and handover operations use the authenticated user's organizationId and write signed transition evidence."
      ]
    },
    steps: [
      "Confirm the clinician signs in as a named user rather than a shared role.",
      "Validate that the user's active role and organization are correct before queue work starts.",
      "Use the queue cockpit to claim only cases routed to the user's organization.",
      "When a PHCC case needs HMC escalation, use the handover action so the target organization changes with audit evidence.",
      "Run HRMS sync after workforce-status changes so leave, rest-period, or inactive users lose access and active locks are returned to Incoming."
    ],
    safety:
      "Only platform-level administration is globally exempt. Tenant isolation and the HRMS kill switch are operating controls; live Oracle connectivity still needs approved credentials, scopes, and residency governance."
  },
  {
    title: "Clinical governance review guide",
    eyebrow: "Safety and quality",
    icon: ShieldCheck,
    audience: "Clinical Governance Lead, Protocol Content Manager, Quality Reviewer",
    goal:
      "Review whether content, routing, overrides, bilingual text, and audit traces are clinically safe enough for UAT and production release.",
    framework: {
      what:
        "A governance review path for clinical content, safety floors, route mapping, override behavior, and release evidence.",
      why:
        "The root risk is unapproved clinical variation: protocol content, local destinations, AI wording, and nurse-facing guidance must be clinically validated before production.",
      how: [
        "Review acuity order, severity mapping, disposition, rationale, and care-advice links.",
        "Sample adult, pediatric, aviation, urgent, self-care, and AI-downgrade scenarios.",
        "Approve local Qatar routes and release gates before activating production content."
      ]
    },
    steps: [
      "Check that every algorithm has acuity-ordered questions, severity, disposition, rationale, and care-advice mapping.",
      "Review the Phase I open-source baseline separately from any future licensed STCC/SymptomScreen import.",
      "Sample adult emergency, pediatric emergency, stable NEWS2, aviation restriction, and self-care cases using the automated test pack.",
      "Approve local Qatar routing rules before activating production destinations.",
      "Track gaps for licensed protocols, Arabic clinical translation governance, persistence, EMR writeback, and medical director sign-off."
    ],
    safety:
      "Governance must treat the current MVP content as implementation scaffolding until licensed content and local SOP approval are complete."
  },
  {
    title: "Security and privacy help guide",
    eyebrow: "Access and data law",
    icon: LockKeyhole,
    audience: "Security Administrator, Privacy Officer / DPO, Compliance Auditor",
    goal:
      "Understand how login, roles, permissions, masking, reveal, audit, and Qatar/GDPR-aligned controls protect clinical and staff data.",
    framework: {
      what:
        "A security and privacy guide for identity, role access, masking, reveal approvals, audit trails, retention, and data-law control mapping.",
      why:
        "The platform handles sensitive staff and health context; access must be explainable, least-privilege, auditable, and aligned with Qatar data law and GDPR-style privacy-by-design principles.",
      how: [
        "Validate distinct named users, assigned roles, and permissions through the grouped simulator and Admin panels.",
        "Keep PHI ephemeral until persistence, retention, and legal basis are approved.",
        "Require audit events for reveal, export, role changes, failed access, and employee-facing communication."
      ]
    },
    steps: [
      "Use the grouped named-user simulator to confirm each user has one assigned role and a distinct access profile rather than duplicate all-access behavior.",
      "Review Security Admin for users, roles, SSO, encryption, reveal controls, and audit events.",
      "Confirm PHI remains ephemeral in the current triage API scaffold unless a production persistence design is approved.",
      "Check that employee-facing CCP messages require Remote Triage Nurse approval before WhatsApp, SMS, or email send.",
      "Confirm any production database, log, report, or export has residency, retention, masking, and legal-basis controls."
    ],
    safety:
      "Privacy help is a control map, not a legal certification. Final PDPPL/GDPR decisions need privacy counsel and DPO approval."
  },
  {
    title: "Integration and data ingestion guide",
    eyebrow: "Engineering and DBA",
    icon: Database,
    audience: "Integration Administrator, System Administrator, Reporting Analyst",
    goal:
      "Seed, test, and later migrate clinical content without changing the nurse-facing workflow or bypassing deterministic safety floors.",
    framework: {
      what:
        "An engineering guide for database schema, clinical seed content, Oracle HCM-style data ingestion, API adapters, tests, and migration readiness.",
      why:
        "The integration problem is avoiding brittle rewrites: clinical content, HRMS, EMR, communication, and analytics must connect behind stable IST APIs.",
      how: [
        "Run Prisma migration/seed and verify schema, row counts, and API contracts.",
        "Keep Oracle HCM, EMR, insurer, scheduling, Twilio, Graph, and analytics behind backend adapters.",
        "Run safety, API, simulation, and frontend build tests after every content or integration change."
      ]
    },
    steps: [
      "Run Prisma migrations against the approved PostgreSQL database, then run the Phase I seed.",
      "Use the seed to populate Algorithm, TriageQuestion, CareAdvice, QuestionAdviceBridge, localized dispositions, and IST demo staff records.",
      "Run Jest/Supertest API tests and Python safety tests after every protocol or scoring change.",
      "Keep Oracle HCM, insurance, EMR, scheduling, Twilio, Graph, and analytics behind backend adapters.",
      "For licensed content, use SchemaCrawler/DBML mapping and import scripts, then rerun the same safety regression tests."
    ],
    safety:
      "Data ingestion changes are not clinical approval. They only make data available for governed rules, tests, and clinician review."
  },
  {
    title: "LLM and cloud implementation guide",
    eyebrow: "MedGemma strategy",
    icon: BrainCircuit,
    audience: "Clinical Governance Lead, AI Engineer, Security Administrator, Cloud Platform Engineer",
    goal:
      "Use MedGemma or another approved clinical LLM as a governed copilot while preserving the rules-first triage engine, nurse approval, and Qatar-hosted production controls.",
    framework: {
      what:
        "A cloud and LLM strategy for using MedGemma or another approved model as an advisory copilot for explanation, summaries, approved-protocol context prompts, and SBAR drafts.",
      why:
        "The model must not become an invisible clinical decision-maker; the safety floor, nurse approval, privacy posture, model lineage, and Qatar-hosted controls must remain explicit.",
      how: [
        "Evaluate synthetic rows first, then use retrieval/prompting before any fine-tuning.",
        "Expose model output only through a backend adapter with masking, logging, and downgrade blocking.",
        "Move to private GCP Doha serving only after clinical, privacy, security, cost, and quota approvals."
      ]
    },
    steps: [
      "Start with evaluation, not training: use the synthetic JSONL rows to test whether the model explains the deterministic disposition, flags missing approved protocol context, and refuses to downgrade red floors.",
      "Use prompt engineering and retrieval before fine-tuning; clinical protocol text, local routing policy, and SBAR templates should be retrieved or injected as governed context.",
      "For MVP, run a low-cost quantized model only for non-authoritative explanation, summarization, and draft generation. Do not send real PHI to a public endpoint.",
      "For production, deploy inside GCP Doha (me-central1) using a private GKE or approved Vertex AI custom endpoint pattern, with private networking, IAM, KMS, audit logging, and VPC Service Controls.",
      "Gate any fine-tuning or reinforcement workflow behind DPO/privacy approval, clinical governance sign-off, synthetic or de-identified training data, evaluation thresholds, rollback, and model registry control."
    ],
    safety:
      "The LLM can assist the nurse, but it cannot diagnose, approve disposition, lower an emergency/urgent floor, approve fitness for duty, or send employee-facing CCP messages without nurse approval."
  }
];

const validationReviewItems: ValidationReviewItem[] = [
  {
    area: "Staff validation",
    verdict: "Correct",
    evidence:
      "The API exposes POST /api/v1/staff/validate and the queue service now auto-validates staff/dependent identity, stores HRMS age snapshots, and prevents manual nurse-side age entry for queue cases.",
    nextStep: "Replace mock HRMS records with Oracle Fusion HCM publicWorkers/workers adapter after HR and privacy approval."
  },
  {
    area: "Vital-sign safety floor",
    verdict: "Correct",
    evidence:
      "POST /api/v1/triage/calculate-score applies mandatory RED floors for consciousness, SpO2, respiratory rate, heart rate, and pediatric tachypnea before NEWS2 scoring.",
    nextStep: "Expand pediatric age bands and validate thresholds with clinical governance before production use."
  },
  {
    area: "SOAP/SBAR completion",
    verdict: "Correct",
    evidence:
      "POST /api/v1/triage/complete returns clipboard text by default and JSON with notePayload/fitToFlyStatus when the caller asks for application/json.",
    nextStep: "Connect signed clinical note persistence and EMR/FHIR writeback only after retention and writeback policy approval."
  },
  {
    area: "Nurse workspace modes",
    verdict: "Correct",
    evidence:
      "Step and Board now share /api/v1/queue through QueueContext. Queue items can be claimed, locked, moved with sequence validation, prioritized by safety/SLA, and handed from Board into Step.",
    nextStep:
      "Run live PostgreSQL migration/UAT, connect Oracle HCM call intake, and capture production queue-transition audit evidence."
  },
  {
    area: "Named user HRMS and tenant queue",
    verdict: "Correct",
    evidence:
      "The backend has organization-bound sessions, POST /api/v1/hrms/sync-users, tenant-scoped /api/v1/queue visibility, HRMS session revocation, lock release, and cross-tenant escalation handover tests.",
    nextStep:
      "Replace the mock Oracle-style feed with approved Oracle Fusion HCM credentials, scheduler identity, database migrations, and production audit evidence."
  },
  {
    area: "Data ingestion",
    verdict: "Partially built",
    evidence:
      "prisma/seed.ts is typed and ready, and docker-compose.yml now provides a local PostgreSQL 15 target for live-mode write/read validation.",
    nextStep: "Run npm run db:local:up, npm run prisma:migrate, npm run db:seed, then capture seed evidence in the audit dashboard."
  },
  {
    area: "Python AI safety wrapper",
    verdict: "Correct",
    evidence:
      "python/test_safety_wrapper.py verifies normal HOMECARE pass-through, RED vital downgrade blocking, EMERGENCY severity upgrade, and SQLite audit row creation.",
    nextStep: "Promote audit storage from local SQLite to the approved production audit datastore."
  },
  {
    area: "Live enterprise integrations",
    verdict: "Pending production",
    evidence:
      "Oracle HCM, EMR, scheduling, Twilio/Graph live transport, insurer verification, transcription, and analytics are documented as adapters, not live production connectors.",
    nextStep: "Approve secrets, scopes, data residency, service accounts, signed webhooks, and least-privilege policies before enabling live mode."
  },
  {
    area: "LLM / MedGemma strategy",
    verdict: "Pending production",
    evidence:
      "The repository has rules-first simulation data and LLM-ready JSONL rows, but no live MedGemma endpoint, provider key, model registry, or cloud inference adapter is enabled yet.",
    nextStep:
      "Build the evaluation and provider-adapter layer first, then deploy a private GCP Doha inference endpoint only after security, privacy, clinical governance, and cost approval."
  }
];

const dataConsumptionStrategyCards: DataStrategyCard[] = [
  {
    title: "Phase I Inception Baseline",
    eyebrow: "Open-source standards",
    icon: Database,
    status: "Built for MVP validation",
    body:
      "The current backend consumes an open-source clinical safety baseline so engineering can test the complete Rules-First, AI-Second workflow before licensed content is introduced.",
    bullets: [
      "Adult triage uses WHO Interagency Integrated Triage Tool style red-floor rules: SpO2 below 92%, respiratory rate below 10 or above 30, and heart rate below 60 or above 130 bpm immediately trigger emergency handling.",
      "Pediatric triage includes WHO ETAT / IMCI style age-specific tachypnea handling. In the current implementation, a child under 5 with respiratory rate 40 or above is routed through the pediatric emergency safety floor.",
      "NEWS2 is used as the stable-vitals physiological calculator after mandatory red floors are checked."
    ],
    formula: "NEWS2 Score = sum(Points(Parameter_i))",
    link: {
      href: "#/workspace",
      label: "Go to Triage Workspace"
    }
  },
  {
    title: "Phase II Production Migration",
    eyebrow: "Optional licensed upgrade",
    icon: GitBranch,
    status: "Prepared for UAT / Go-Live",
    body:
      "The schema keeps clinical content abstract so licensed Schmitt-Thompson After Hours and SymptomScreen data can replace sample content without rewriting the triage workspace.",
    bullets: [
      "SchemaCrawler can reverse-engineer licensed MS SQL or Access structures into DBML, which can then be mapped into the Postgres clinical protocol tables.",
      "The seed/import layer populates Algorithm, TriageQuestion, CareAdvice, QuestionAdviceBridge, localized dispositions, and protocol indexes while the frontend continues calling the same IST APIs.",
      "Clinical governance can compare schema integrity, safety-floor mappings, and local clinic overrides from the operations and audit dashboard before production activation."
    ],
    link: {
      href: "#/dashboard",
      label: "View Operations & Audit Dashboard"
    }
  },
  {
    title: "Governed LLM Copilot Strategy",
    eyebrow: "MedGemma / clinical AI",
    icon: BrainCircuit,
    status: "Strategy defined; endpoint not yet live",
    body:
      "The platform will use MedGemma as an assistive clinical language layer only after evaluation, governance, and private deployment controls are in place.",
    bullets: [
      "MVP: use synthetic data, prompt evaluation, and optional quantized local/CPU inference for explanation and SBAR drafting. Real clinical disposition remains deterministic and nurse-approved.",
      "Cloud UAT: expose the LLM through an internal adapter contract so the frontend never calls the model directly and every prompt/output can be logged, masked, evaluated, and blocked.",
      "Production: host the model inside GCP Doha with private networking, IAM, KMS, audit logging, VPC Service Controls, model registry, rollback, and approved clinical evaluation thresholds."
    ],
    link: {
      href: "#/library",
      label: "Open LLM Library"
    }
  }
];

const llmCloudMigrationTasks: MatrixCard[] = [
  {
    title: "1. Evaluation-first MVP",
    eyebrow: "Before training",
    icon: CheckCircle2,
    body:
      "Use the existing synthetic training JSONL to measure model behavior before any production model is selected or tuned.",
    bullets: [
      "Create train, validation, and test splits from synthetic-only rows.",
      "Score red-floor refusal, pediatric routing explanation, female-health context, male-health context, Qatar seasonal context, and nurse-approval language.",
      "Fail the build if the model recommends a lower severity than the deterministic rules or writes employee-facing content as already approved."
    ],
    link: {
      href: "#/library",
      label: "Review Simulation Library"
    }
  },
  {
    title: "2. MVP inference adapter",
    eyebrow: "Low-cost controlled pilot",
    icon: PlugZap,
    body:
      "Add one backend model adapter so the UI and triage engine stay independent from the provider or serving engine.",
    bullets: [
      "Support dry-run mode first, then an internal llama.cpp or similar CPU inference endpoint for quantized MedGemma where clinically and legally approved.",
      "Send only minimum necessary context; prefer synthetic or de-identified payloads during MVP testing.",
      "Return structured fields: missing questions, rationale summary, SBAR draft, confidence warnings, and safety-floor acknowledgement."
    ],
    link: {
      href: "#/integration",
      label: "Open Integration Map"
    }
  },
  {
    title: "3. GCP Doha production serving",
    eyebrow: "Cloud move",
    icon: ShieldCheck,
    body:
      "Move model serving into the Qatar region with private networking and formal model governance before clinical production.",
    bullets: [
      "Deploy on private GKE or an approved Vertex AI custom endpoint in me-central1 after confirming model, accelerator, and service availability.",
      "Use private ingress, workload identity, Secret Manager, Cloud KMS, Cloud Audit Logs, logging redaction, and VPC Service Controls.",
      "Use vLLM or another approved high-concurrency serving engine only after performance, cost, and quota testing."
    ],
    link: {
      href: "#/governance",
      label: "Open Governance"
    }
  },
  {
    title: "4. Governed tuning and release",
    eyebrow: "After validation",
    icon: GitBranch,
    body:
      "Treat fine-tuning as a regulated software release, not a shortcut to clinical approval.",
    bullets: [
      "Use synthetic or formally de-identified data only unless DPO, clinical governance, and legal approve a stricter path.",
      "Register every model version with dataset lineage, eval scorecards, known limitations, rollback plan, and approved use cases.",
      "Keep deterministic safety wrappers outside the model so prompt drift or model upgrades cannot change the clinical floor."
    ],
    link: {
      href: "#/security",
      label: "Open Security Admin"
    }
  }
];

const aviationDataTableCards: MatrixCard[] = [
  {
    title: "Custom Aviation Medical Rules",
    eyebrow: "Aviation data tables",
    icon: Route,
    body:
      "The platform parses occupational parameters for airport and flight staff, then converts those fields into aviation tags, fit-to-duty controls, and clinician-visible routing evidence.",
    bullets: [
      "Fit-to-Fly: STCC clinical disposition is evaluated first; Emergency and Urgent outcomes force RESTRICTED until clinician clearance.",
      "Routine STCC outcomes for safety-sensitive crew remain RESTRICTED; self-care outcomes can still become MEDICAL_REVIEW_REQUIRED when duty, outstation, sickness, or operational symptom triggers are present.",
      "Outstation Validation: station and outstation flags create a teleconsult escalation path and preserve local-care coordination context.",
      "Sickness Validation: the system compiles standardized medical leave telemetry for nurse review instead of automatically approving leave.",
      "Vaccine Reactions: post-vaccination fever, rash, swelling, or related symptoms create structured follow-up and duty-rest review, such as ground-duty only until clinical clearance."
    ],
    link: {
      href: "#/workspace",
      label: "Open Crew Triage Panel"
    }
  }
];

const qatariRoutingMatrixCards: MatrixCard[] = [
  {
    title: "Localized Care-Routing Matrix",
    eyebrow: "Qatari healthcare routing",
    icon: Hospital,
    body:
      "Disposition codes map the clinical safety floor to Qatar-specific healthcare destinations while preserving nurse review and local governance ownership.",
    bullets: [
      "Emergency pediatric cases route to Sidra Medicine Emergency Department.",
      "Emergency adult/general cases route to Hamad Medical Corporation (HMC) Emergency Department.",
      "Urgent and clinic care can route to PHCC urgent care or IST Medical Centre at the HIA Midfield area depending on severity, staff context, and availability.",
      "Routine and self-care cases coordinate through registered primary care, callback precautions, and approved care-advice content."
    ],
    link: {
      href: "#/workspace",
      label: "Review Disposition Rules"
    }
  }
];

const workflowSteps = [
  {
    title: "Incoming call and HRMS validation",
    icon: UserRoundCheck,
    body:
      "The call or callback enters the queue with channel, wait time, caller context, staff/dependent relationship, duty status, station, and HRMS-calculated age already validated before nurse triage starts."
  },
  {
    title: "Opening script and reason for call",
    icon: ClipboardList,
    body:
      "The nurse follows the approved opening script, confirms the reason narrative, and captures the caller's own words without turning the identity step into a manual clinical tab."
  },
  {
    title: "Keyword search and guideline selection",
    icon: SearchCheck,
    body:
      "The deterministic search layer matches search words, synonyms, age, sex, mode, and red-flag terms to candidate protocols. The nurse remains responsible for selecting or confirming the guideline."
  },
  {
    title: "Emergency and initial assessment",
    icon: AlertTriangle,
    body:
      "Emergency rule-out runs first: low SpO2, abnormal respiratory rate, abnormal heart rate, altered consciousness, pediatric danger signs, severe symptoms, and other red-floor triggers set the minimum safe route."
  },
  {
    title: "Acuity-ordered triage questions",
    icon: ClipboardCheck,
    body:
      "After emergency rule-out, the nurse answers one active assessment question at a time from highest acuity to lowest. A Yes fixes the disposition; a No unlocks the next lower-priority question."
  },
  {
    title: "Disposition and Qatar routing",
    icon: GitBranch,
    body:
      "The clinical disposition is mapped to a local source of care such as HMC, Sidra, PHCC, IST Health medical review, teleconsult, occupational health, or self-care. Aviation fit-to-fly can restrict but not downgrade care."
  },
  {
    title: "Care advice and first aid",
    icon: Stethoscope,
    body:
      "Mapped care advice, home-care instructions, callback precautions, first-aid content, and send-later guidance are presented from approved protocol content for nurse review."
  },
  {
    title: "Closing script, SBAR, and audit",
    icon: FileCheck2,
    body:
      "The nurse closes the call with approved instructions, copies the SBAR/SOAP note, opens CCP follow-up when needed, and leaves an audit trace for safety, governance, and future RAG comparison."
  }
];

const libraryAreas: LibraryArea[] = [
  {
    id: "teletriage",
    title: "Tele-Triage Encounter Engine",
    eyebrow: "Remote clinical decision support",
    icon: PhoneCall,
    summary:
      "Coordinates automatic HRMS caller validation, age calculation, symptom capture, protocol search, acuity-first questions, aviation gates, disposition routing, SBAR handoff, and human approval for remote nurse triage.",
    usedBy: [
      "POST /api/v1/triage/start",
      "POST /api/v1/triage/encounters/evaluate",
      "TriageWorkspace"
    ],
    details: [
      "The encounter starts only after the queue API validates the staff/dependent relationship and calculates age from HRMS date of birth or age fields.",
      "The current MVP keeps PHI ephemeral and returns the decision package to the frontend for clinician validation and clipboard handoff.",
      "Production tele-triage requires persistence, role-based access, call transcription, scheduling, EMR integration, and approved clinical SOPs."
    ]
  },
  {
    id: "provider-neutral-call-center",
    title: "Provider-Neutral Call Center Gateway",
    eyebrow: "Telephony transport and recording governance",
    icon: PhoneCall,
    summary:
      "Defines how incoming calls, callbacks, call state, and recording metadata move between any approved contact-center provider and the IST Health queue while STCC rules and the nurse retain clinical authority.",
    framework: {
      what:
        "A normalized event and command layer with durable call sessions, idempotent provider events, queue locking, adapter health, tenant routing, and recording controls.",
      why:
        "A provider-specific workflow would duplicate queue logic, weaken auditability, and make future contact-center replacement expensive. The gateway keeps the clinical contract stable while adapters change.",
      how: [
        "Receive CALL_OFFERED, CALL_CONNECTED, CALL_HELD, CALL_RESUMED, CALL_ENDED, CALLBACK_REQUESTED, CALLBACK_ANSWERED, NO_ANSWER, and RECORDING_AVAILABLE events.",
        "Verify HMAC signatures, persist before processing, deduplicate by provider plus providerEventId, mask ANI, and retain only metadata keys from arbitrary provider payloads.",
        "Route HRMS-validated calls into the tenant queue and hold unresolved identities outside the clinical queue.",
        "Execute ANSWER, START_CALLBACK, HOLD, RESUME, and END through a registered provider adapter with queue-lock rollback on failure."
      ]
    },
    usedBy: [
      "POST /api/v1/integrations/call-center/events",
      "GET /api/v1/call-center/status",
      "GET /api/v1/call-center/sessions",
      "POST /api/v1/call-center/queue/:queueItemId/command",
      "src/services/callCenterGateway.ts",
      "src/routes/callCenterGateway.ts",
      "frontend/src/QueueContext.tsx",
      "frontend/src/components/Triage/NurseWorkspace.tsx",
      "prisma/schema.prisma: CallCenterSession and CallCenterEvent"
    ],
    details: [
      "Telephony owns call transport and provider recording delivery. IST owns queue allocation, locks, HRMS identity, STCC workflow, safety floors, disposition, and clinical audit.",
      "CALL_CENTER_PROVIDER selects the adapter. The current dry-run adapter proves the contract without contacting an external telephone platform.",
      "CALL_CENTER_DEFAULT_ORGANIZATION_ID supplies live tenant routing when an event does not carry an approved target organization. Simulation defaults to the PHCC nurse queue.",
      "Provider validation happens before a queue claim. If an available adapter later rejects a command, the gateway marks the session failed and releases the lock acquired for that command.",
      "Raw ANI is never returned from the session API; only a masked display value is exposed. A keyed hash can support controlled correlation without storing the plain number.",
      "Recordings must remain in GCP Doha me-central1. The gateway requires noticePlayed plus GRANTED or LEGAL_BASIS before retaining an object reference.",
      "Raw audio is explicitly ragEligible=false. Only a separately governed, de-identified, nurse-reviewed transcript or derived evaluation dataset may be considered for model improvement.",
      "Production work remains: approved provider adapter, private connectivity/webhook controls, retry worker and dead-letter queue, call-event monitoring, recording lifecycle, legal notice, and retention approval."
    ],
    helps: [
      {
        title: "One nurse queue",
        body: "Incoming calls and callbacks become the same governed queue cases used by Step and Board, so contact-center integration does not create a second clinical workflow."
      },
      {
        title: "Provider independence",
        body: "A new provider implements the adapter and event translation contracts; STCC logic, nurse screens, queue locks, and audit rules remain unchanged."
      },
      {
        title: "Failure containment",
        body: "Invalid signatures, duplicate events, missing identity, unavailable adapters, provider rejection, and recording-policy violations are blocked at explicit boundaries."
      },
      {
        title: "Qatar-hosted evidence",
        body: "Call metadata and approved recording references are designed for PostgreSQL and GCP Doha controls with masked identifiers and audit signatures."
      }
    ],
    usefulFor: [
      { title: "Nurses", body: "Answer a live call or start a callback without leaving the clinical cockpit." },
      { title: "Integration administrators", body: "Monitor adapter status, session metadata, provider contracts, and tenant routing." },
      { title: "Privacy and audit", body: "Verify notice, consent/legal basis, residency, masking, and exclusion of raw recordings from RAG." }
    ],
    exampleFlow: [
      "The provider sends a signed CALL_OFFERED event with call reference, masked identity inputs, target queue, and reason narrative.",
      "The gateway persists the event, validates staff/dependent context, and creates one HRMS-validated queue case.",
      "The nurse clicks Answer. IST claims the case and calls the configured adapter.",
      "On success, the session becomes CONNECTED and the Step cockpit opens. On failure, the lock is released.",
      "Later provider events update hold, resume, end, no-answer, or recording status without changing the clinical disposition.",
      "The recording reference is accepted only after policy checks and remains outside the RAG knowledge boundary."
    ]
  },
  {
    id: "nurse-workspace-modes",
    title: "Nurse Cockpit Modes",
    eyebrow: "Step cockpit and Kanban board",
    icon: Kanban,
    summary:
      "Documents the two customer-selectable nurse workspace modes: the guided one-active-call Step cockpit and the Kanban-style Board cockpit for queue supervision.",
    framework: {
      what:
        "Two frontend surfaces support the triage operation. #/workspace opens the guided Step cockpit; #/kanban opens the Kanban Board cockpit. Both are backed by the unified queue orchestration API.",
      why:
        "A single layout cannot serve every user equally. Remote Triage Nurses need a strict clinical sequence, while senior nurses, service managers, and customer reviewers may need queue visibility across many calls.",
      how: [
        "Route active clinical execution through Step so Reason & Emergency Rule-Out, one-question-at-a-time assessment, disposition, and SBAR stay ordered.",
        "Use Board for operational awareness: incoming calls, HRMS-ready reason state, clinical triage state, disposition review, and SBAR/follow-up load.",
        "Keep Board actions constrained by the same deterministic safety floor, role permissions, lock ownership, route review, and nurse-approval rules as Step."
      ]
    },
    usedBy: [
      "#/workspace",
      "#/kanban",
      "frontend/src/components/Triage/NurseWorkspace.tsx",
      "frontend/src/KanbanWorkspace.tsx",
      "frontend/src/QueueContext.tsx",
      "src/routes/queueRouter.ts",
      "src/services/queueOrchestration.ts",
      "frontend/src/App.tsx"
    ],
    details: [
      "Step cockpit is the default clinical execution mode for one active call. It presents action tabs rather than intake/identity tabs.",
      "Identity is not a nurse-click action in Step. The queue API validates HRMS identity and calculates age before the case becomes nurse-visible; call context appears next to the active employee/dependent call.",
      "The first action tab combines Reason & Emergency Rule-Out so the nurse can see the reason narrative, prepared guideline search, vitals, and 911/emergency safety-floor result in one place.",
      "The Questions action tab is a guided click-and-enable flow. Only the current acuity question is active; No unlocks the next question, and Yes stops lower-priority questions because the route has been identified.",
      "Board cockpit is an alternate Kanban view with Incoming, Reason / HRMS-ready, Clinical triage, Disposition, and SBAR / follow-up columns.",
      "Header buttons let the customer switch between Step and Board; the app also supports direct hash navigation through #/workspace and #/kanban.",
      "QueueContext fetches /api/v1/queue and provides call connection, release, move, context update, and heartbeat functions to both Step and Board.",
      "Opening an incoming or callback case connects it through the provider-neutral gateway, claims the queue item, sets a five-minute lock, and loads the same encounter context into the progressive Step cockpit.",
      "Moving a Board or Step item calls the queue sequence validator and writes a signed transition trace in the backend service path."
    ],
    helps: [
      {
        title: "Customer choice",
        body:
          "Customers can compare a guided clinical workflow against a board-style queue workflow without losing either option during UAT."
      },
      {
        title: "Nurse focus",
        body:
          "Step keeps the active nurse focused on one caller and one next clinical action, reducing clutter and preventing parallel-case mistakes."
      },
      {
        title: "Shift visibility",
        body:
          "Board helps senior nurses and service managers see case volume, stage distribution, severity mix, wait time, and safety-floor cases at a glance."
      },
      {
        title: "Governed movement",
        body:
          "Board status movement supports operations, not clinical shortcutting. The queue service blocks bypass attempts, foreign locks, and clinical edits by intake-only roles."
      }
    ],
    usefulFor: [
      {
        title: "Remote Triage Nurse",
        body: "Use Step as the primary workspace when conducting a live clinical call."
      },
      {
        title: "Senior Triage Nurse",
        body:
          "Use Board to supervise load, spot emergency cases, assign work, and then move selected cases into the Step cockpit for clinical execution."
      },
      {
        title: "Triage Service Manager",
        body:
          "Use Board to understand staffing pressure, queue stage distribution, and where calls are waiting."
      },
      {
        title: "Governance and UAT reviewers",
        body:
          "Use both views to verify that customer-preferred UI does not weaken safety floors, route review, or auditability."
      }
    ],
    exampleFlow: [
      "A nurse or reviewer signs in and sees the Step / Board switch in the header.",
      "The Remote Triage Nurse opens Step to handle one selected caller through Reason & Emergency Rule-Out, Questions, Disposition, and SBAR / Complete.",
      "A Senior Triage Nurse opens Board to review all waiting and in-progress calls across the five operational columns.",
      "Emergency and safety-floor cases remain visible and prioritized in both modes.",
      "When a case needs clinical decisioning, the user opens it from Board into Step; the case is claimed and locked before editing.",
      "Every successful movement receives a signed transition trace; live PostgreSQL deployment stores those records in QueueTransitionLog."
    ]
  },
  {
    id: "named-user-hrms-tenant-queue",
    title: "Named User HRMS and Tenant Queue",
    eyebrow: "Organization-bound access",
    icon: Users,
    summary:
      "Defines how Oracle-style HRMS directory records become named clinical users, how queue cards are scoped to PHCC/HMC/Sidra-style organizations, and how cross-tenant handover is audited.",
    framework: {
      what:
        "A multi-tenant identity and queue control layer built on the existing ApplicationUser, UserSession, queue, and audit models rather than a duplicate user table.",
      why:
        "The system is for internal employee tele-triage across healthcare organizations. A nurse should not see or claim another organization's queue unless an approved escalation changes the target organization.",
      how: [
        "POST /api/v1/hrms/sync-users accepts an Oracle-style worker feed and maps employee status, job title, and organization code into local named users.",
        "POST /api/v1/queue validates staff/dependent identity and creates an HRMS-derived patientAge snapshot before the item can be claimed.",
        "The HRMS kill switch disables inactive/on-leave/rest-period users, revokes their sessions, and releases their active queue locks.",
        "Queue orchestration checks tenant access before list, get, claim, heartbeat, context update, move, and escalation handover operations."
      ]
    },
    usedBy: [
      "POST /api/v1/hrms/sync-users",
      "GET /api/v1/queue",
      "POST /api/v1/queue/:id/claim",
      "POST /api/v1/queue/:id/escalate",
      "src/services/hrmsSync.ts",
      "src/services/securityAdmin.ts",
      "src/services/queueOrchestration.ts",
      "tests/multiTenantRBAC.test.ts"
    ],
    details: [
      "Organization records are represented for IST Health, HMC, PHCC, and Sidra-style routing, with ApplicationUser sessions carrying organizationId and organizationCode.",
      "Queue records carry identityValidated, identityValidationSource, identityValidatedAtIso, and patientAge metadata from the HRMS adapter so nurse workspaces do not ask for manual age entry.",
      "Queue cards carry source and target organization IDs. The target organization controls who can see and claim the active card.",
      "Platform super administrators and system administrators are the only global queue exemptions in the current implementation.",
      "The escalation handover endpoint re-scopes a queue card to the target organization, clears the active lock, returns it to Incoming, and writes a signed transition event.",
      "The current HRMS endpoint can be called by Triage Service Manager, platform/system administrator, or a configured scheduler secret. Production should replace the mock feed with Oracle Fusion HCM and mTLS/client-credential controls."
    ],
    helps: [
      {
        title: "Least privilege",
        body:
          "Clinicians see the organization queue they are assigned to. This prevents a PHCC user from casually browsing HMC or Sidra queue cards."
      },
      {
        title: "Immediate workforce control",
        body:
          "When Oracle HRMS marks a user inactive, on leave, or in rest period, their sessions are revoked and active queue locks are released."
      },
      {
        title: "Audited escalation",
        body:
          "A cross-tenant escalation does not silently move data. It changes targetOrganizationId and records actor, actor organization, target organization, event type, and HMAC signature."
      }
    ],
    usefulFor: [
      {
        title: "Triage Service Manager",
        body: "Run HRMS sync and confirm staffing status changes are reflected in access and queue locks."
      },
      {
        title: "Remote Triage Nurse",
        body: "Work one organization-scoped queue and escalate a case only through the governed handover path."
      },
      {
        title: "Security Administrator",
        body: "Review organization membership, session revocation, and signed transition evidence before production."
      }
    ],
    exampleFlow: [
      "Oracle Fusion HCM reports a PHCC nurse as active.",
      "POST /api/v1/hrms/sync-users upserts the named user with PHCC organization membership and remote triage role.",
      "A call intake record is created through POST /api/v1/queue; the API validates the staff/dependent relationship and stores calculated age before the nurse sees the card.",
      "The nurse signs in and sees only PHCC-target queue cards.",
      "The nurse claims a PHCC card; the queue item is locked to that user.",
      "If HRMS later reports On-Leave, the session is revoked, the lock is released, and login returns Forbidden.",
      "If a PHCC card needs HMC escalation, the nurse executes handover and the card becomes visible in the HMC queue with signed audit."
    ]
  },
  {
    id: "ccp",
    title: "CCP - Employee Communication Pipeline",
    eyebrow: "One employee, separate visit threads",
    icon: MessageSquare,
    summary:
      "CCP is the Continuous Communication Pipeline for one employee. It keeps an employee-level communication index while opening a separate thread for each visit, call, teleconsult, or clinic encounter.",
    usedBy: [
      "GET /api/v1/ccp/employee/:istStaffId",
      "GET /api/v1/ccp/communication/status",
      "POST /api/v1/ccp/messages/draft",
      "POST /api/v1/ccp/messages/:draftId/approve-send",
      "POST /api/v1/ccp/webhooks/twilio",
      "CcpWorkspace",
      "getEmployeeCcpSummary"
    ],
    details: [
      "The CCP subject is the employee, but the operating unit is the visit/call thread. Each new clinic visit, remote call, teleconsult, or follow-up opens a separate active thread.",
      "Previous threads stay closed and are not merged into the new encounter, but the nurse sees linked prior threads and the last communication as context before continuing.",
      "Every CCP goal has an owner, due time, next action, thread ID, and settle point so callbacks, precautions, route handoffs, fit-to-duty follow-up, and dependent context do not disappear after the live call.",
      "The controller pattern keeps outbound actions policy-driven: AI may detect or draft, but employee-facing messages stay queued until the Remote Triage Nurse reviews and approves the send.",
      "WhatsApp, SMS, and email now sit behind transport adapters. CCP callers create an outbound draft and the adapter is invoked only after Remote Triage Nurse approval, consent/channel validation, and any configured test redirect.",
      "Inbound Twilio webhooks follow the verify, parse, persist, acknowledge pattern. The local build keeps this as an in-memory record; production should persist to a durable queue before returning the provider acknowledgement.",
      "The current build exposes demo endpoints and workspace status. Production should persist the CCP as a single-writer ledger with delivery receipts, immutable audit events, retention state, and approved integrations."
    ],
    helps: [
      {
        title: "One place to look",
        body:
          "A nurse, physician, administrator, or support user does not need to search separate call notes, SMS messages, WhatsApp updates, email, and task lists. The employee index becomes the quick-access record."
      },
      {
        title: "Clean episode separation",
        body:
          "The next visit or call starts a new thread, so today’s clinical context is not mixed with the previous encounter. Prior communication remains linked for nurse awareness."
      },
      {
        title: "Faster callbacks",
        body:
          "Open goals show the owner, due time, next action, and closure condition. This makes safety callbacks and route handoffs easier to act on without bypassing nurse approval."
      },
      {
        title: "Better employee experience",
        body:
          "The employee does not have to repeat the same story each time the case moves between intake, nurse triage, physician review, occupational health, or helpdesk support."
      },
      {
        title: "Clinical continuity",
        body:
          "Red-flag precautions, human approval gates, fit-to-duty tasks, dependent context, and clinical route decisions stay linked after the live call ends."
      },
      {
        title: "Governance and audit",
        body:
          "Every communication can carry actor, channel, purpose, timestamp, linked goal, and audit tags. This supports privacy review, quality sampling, and incident reconstruction."
      },
      {
        title: "Controlled automation",
        body:
          "AI can summarize and draft, but CCP keeps actions policy-led: consent, channel choice, emergency floors, disclosure rules, and nurse approval before send remain code-controlled."
      },
      {
        title: "Two-way transport model",
        body:
          "Outbound WhatsApp, SMS, and email share the same CCP gate. Inbound WhatsApp/SMS replies enter through the Twilio webhook, are signature-checked when live, parsed with text and media attachments, then persisted for the CCP processor."
      },
      {
        title: "Safe integration mode",
        body:
          "The default transport mode is dry-run, so a local demo can prove nurse approval, ledger capture, and adapter selection without sending a real message. Live mode requires explicit Twilio or Microsoft Graph configuration."
      }
    ],
    usefulFor: [
      {
        title: "Remote Triage Nurse",
        body:
          "Sees identity, consent, active channels, open callbacks, safety precautions, draft messages, current thread status, and linked previous-thread last communication before approving any employee-facing send."
      },
      {
        title: "Senior Nurse or Physician",
        body:
          "Reviews the route handoff, acuity decision, SBAR context, and prior employee communications before approving or escalating the case."
      },
      {
        title: "Occupational Health",
        body:
          "Tracks fit-to-duty, sickness validation, medical commission, vaccination reaction, and duty-sensitive follow-up from the same thread."
      },
      {
        title: "Outstation Support",
        body:
          "Keeps remote staff cases visible when the employee is away from the main clinic and needs teleconsult coordination or station-specific support."
      },
      {
        title: "Dependent Cases",
        body:
          "Links child or family-member triage to the employee context while preserving guardian, age, route, and callback information."
      },
      {
        title: "Governance, Privacy, and Audit",
        body:
          "Shows what was communicated, who acted, which channel was used, why it was permitted, and what still needs human closure."
      }
    ],
    exampleFlow: [
      "Employee calls the tele-triage line and identity, duty status, location, and preferred callback channel are confirmed.",
      "The nurse opens CCP for that employee and starts a new active thread for this visit or call.",
      "The nurse sees the previous thread links and can open the last communication from each closed thread for context.",
      "The triage engine proposes severity and route; CCP creates the route handoff goal and attaches the SBAR draft for clinician validation.",
      "CCP drafts or queues the callback or safety text; the Remote Triage Nurse reviews it, approves it, and only then the permitted WhatsApp, SMS, or email adapter can send it.",
      "If the employee replies by WhatsApp or SMS, the inbound webhook verifies the provider signature, parses the message and any media, persists the record, and returns a fast acknowledgement.",
      "Senior nurse, physician, or occupational health closes the goal when the route, fit-to-duty, sickness validation, or callback outcome is documented.",
      "Governance can later review one timeline instead of stitching together call notes, messages, tasks, and manual emails."
    ]
  },
  {
    id: "protocols",
    title: "Clinical Protocol Library",
    eyebrow: "STCC-compatible content layer",
    icon: BookOpen,
    summary:
      "Stores adult and pediatric algorithms, search words, ordered triage questions, severity grades, rationale, red-flag markers, care advice links, references, supplementals, first aid, taxonomy, telemedicine flags, and bilingual title fields.",
    usedBy: [
      "Algorithm",
      "TriageQuestion",
      "CareAdvice",
      "AlgorithmCareAdvice",
      "QuestionAdviceBridge",
      "ProtocolKeywordIndex",
      "ProtocolSynonym",
      "ClinicalReference",
      "ClinicalSupplemental",
      "ProtocolFirstAid",
      "ProtocolTaxonomy"
    ],
    details: [
      "The schema is now aligned to the STCC telehealth content pattern: symptom definition, reason/search words, guideline selection, initial assessment, triage assessment questions, disposition, care advice, first aid, background, references, and supplemental content.",
      "Questions are ordered by acuity. Emergency rule-out is handled first, then the nurse receives one active protocol question at a time until a Yes fixes the disposition or all items are answered No.",
      "Clinical references and supplementals are separate linked structures so evidence, appendices, dosage tables, reviewer notes, and non-guideline content do not get mixed into the question path.",
      "First-aid and care-advice content can hold plain text plus sanitized HTML/XHTML so future licensed STCC formatting can be preserved safely.",
      "Protocol taxonomy captures category, system, anatomy, specialty, and other index groupings needed for STCC-like browsing and validation.",
      "Source hashes, checksums, release IDs, and reconciliation metadata support annual content refresh and duplicate/lineage validation.",
      "The model supports localized care advice and disposition codes connected to each algorithm. Local Qatar routing remains an overlay and must not downgrade the clinical disposition."
    ],
    helps: [
      {
        title: "What it gives the nurse",
        body:
          "A protocol can be selected from search words, then worked through as an acuity-ordered path with disposition, care advice, first aid, and handoff content attached."
      },
      {
        title: "What it gives governance",
        body:
          "Every clinical item can be traced to release, source identifier, hash/checksum, evidence reference, and local overlay decision."
      },
      {
        title: "What it gives the importer",
        body:
          "Licensed STCC data can be mapped into canonical runtime tables without changing the frontend workflow."
      }
    ],
    exampleFlow: [
      "Import or seed a ProtocolRelease.",
      "Load algorithms with title, definition, background, age/sex/mode rules, source IDs, and source hashes.",
      "Attach search words, synonyms, taxonomy, references, supplementals, first aid, and care advice.",
      "Load questions in high-to-low acuity order and link Yes triggers to disposition and advice.",
      "Run duplicate, bridge, row-count, ordering, and source-lineage validation before activation.",
      "Activate the approved release while keeping local Qatar routes as a separate governed overlay."
    ]
  },
  {
    id: "stcc-rag-shadow",
    title: "STCC-Compatible RAG Shadow Architecture",
    eyebrow: "Bounded AI learning ledger",
    icon: BrainCircuit,
    summary:
      "Runs deterministic search and nurse guideline selection in parallel with a bounded RAG shadow path, then records agreement, disagreement, blocked outputs, and learning feedback without letting AI decide clinical disposition.",
    framework: {
      what:
        "A separate RAG and learning layer that compares approved-content retrieval, LLM shadow suggestions, deterministic protocol matching, and nurse selections.",
      why:
        "The system needs AI/ML learning evidence without turning the LLM into a clinical decision engine. Shadow mode lets the model learn from nurse/system comparison while STCC-shaped content and deterministic rules remain authoritative.",
      how: [
        "Restrict retrieval to approved clinical content, local Qatar overlays, opening/closing scripts, and approved care advice.",
        "Record retrieval source IDs, snippet hashes, suggested keywords, suggested protocol candidates, model/prompt/corpus version, and confidence.",
        "Compare deterministic primary protocol, shadow primary protocol, and nurse-selected protocol; store feedback and block unsafe outputs."
      ]
    },
    usedBy: [
      "RagRetrievalEvent",
      "LlmShadowSuggestion",
      "NurseSelectionEvent",
      "ProtocolComparisonEvent",
      "LearningFeedbackEvent",
      "ModelEvaluationRun",
      "SafetyBlockedOutput",
      "preparedProtocol.ragShadow",
      "stccProcess"
    ],
    details: [
      "RAG retrieval is bounded to approved indexed content. It must not use general web medical advice or the model's open-ended medical memory during a live encounter.",
      "The shadow model may extract reason terms, body part, duration, red flags, keywords, and candidate protocols, but it cannot decide disposition, care advice, fit-to-fly, or source of care.",
      "The nurse-facing workflow continues to use deterministic search and nurse confirmation. RAG runs beside it and produces comparison evidence.",
      "SafetyBlockedOutput records invented questions, invented care advice, unsafe downgrades, out-of-bound sources, and privacy-boundary violations.",
      "LearningFeedbackEvent classifies whether the outcome needs no change, synonym tuning, keyword weight review, prompt review, content review, or safety review.",
      "ModelEvaluationRun links every model/prompt/corpus/dataset scorecard to the feedback and blocked-output evidence."
    ],
    helps: [
      {
        title: "Keeps AI useful but bounded",
        body:
          "The model can help explain or suggest candidate protocols while deterministic rules and nurse approval remain the clinical control."
      },
      {
        title: "Creates training evidence",
        body:
          "Every agreement or disagreement becomes structured evaluation data for protocol ranking, keyword tuning, prompt review, and safety scorecards."
      },
      {
        title: "Protects the STCC boundary",
        body:
          "The RAG layer cites source IDs and snippet hashes from approved content, so hallucinated advice and unapproved sources are detectable and blockable."
      }
    ],
    usefulFor: [
      {
        title: "Remote Triage Nurse",
        body:
          "Receives advisory search support without losing control of the selected guideline and final disposition."
      },
      {
        title: "Clinical Governance",
        body:
          "Reviews mismatches between nurse selection, deterministic search, and RAG suggestions before approving any tuning or content change."
      },
      {
        title: "AI/ML Team",
        body:
          "Uses de-identified or synthetic comparison rows to improve reason extraction, keyword ranking, and explanation quality."
      }
    ],
    exampleFlow: [
      "Caller reason is captured and normalized.",
      "Deterministic search ranks approved protocol candidates.",
      "Bounded RAG retrieves approved source records and produces candidate protocols with citations.",
      "Nurse selects or confirms the guideline.",
      "ProtocolComparisonEvent stores full match, partial match, or disagreement.",
      "LearningFeedbackEvent records whether synonym, keyword, prompt, content, or safety review is needed.",
      "Unsafe model output is recorded in SafetyBlockedOutput and excluded from nurse action."
    ]
  },
  {
    id: "llm-copilot-cloud",
    title: "LLM Copilot and MedGemma Cloud Strategy",
    eyebrow: "Rules-first AI-second",
    icon: BrainCircuit,
    summary:
      "Defines how the system should use MedGemma or another approved clinical LLM for explanation, summarization, bilingual drafting, and SBAR assistance without handing over clinical decision authority.",
    usedBy: [
      "LLM-ready JSONL simulation exports",
      "python/run_bulk_clinical_simulation.py",
      "src/services/simulationEngine.ts",
      "future /api/v1/ai/copilot/evaluate",
      "future /api/v1/ai/copilot/draft",
      "future GCP Doha model endpoint"
    ],
    details: [
      "Current state: the platform has synthetic LLM-ready data, safety wrappers, and help governance. It does not yet have a live MedGemma endpoint, training job, provider credentials, model registry, or production inference adapter.",
      "MedGemma should be treated as a developer model that needs validation, adaptation, and independent clinical verification for the IST Health tele-triage use case.",
      "The LLM is allowed to explain why the deterministic engine routed a case, draft SBAR/SOAP text, flag missing approved protocol questions or context, summarize prior CCP threads, and support bilingual wording.",
      "The LLM is not allowed to diagnose, approve or downgrade a disposition, approve fit-to-duty, approve sickness leave, bypass pediatric/adult red floors, or send WhatsApp/SMS/email without Remote Triage Nurse approval.",
      "MVP approach: evaluation-first using synthetic data, prompt engineering, retrieval of governed protocol context, and optional low-cost quantized inference for non-authoritative drafting.",
      "Cloud approach: private GCP Doha deployment in me-central1 after confirming service/accelerator availability, with private GKE or approved Vertex AI custom endpoint, IAM, KMS, audit logging, logging redaction, VPC Service Controls, and model-version governance.",
      "Training approach: do not fine-tune on live PHI by default. Use synthetic or formally de-identified data, split train/validation/test sets, maintain dataset lineage, and require clinical/DPO/security approval before any tuning job.",
      "Operational guardrail: deterministic safety wrappers remain outside the model so a prompt change, fine-tune, or model upgrade cannot change the emergency floor."
    ],
    helps: [
      {
        title: "Why MedGemma helps",
        body:
          "It gives the nurse a medically oriented language assistant for summarizing noisy calls, turning structured findings into readable SBAR, and explaining rules in human language."
      },
      {
        title: "Why rules stay separate",
        body:
          "Clinical thresholds, age-based pediatric routing, SpO2/heart-rate/respiratory-rate floors, aviation safety gates, and nurse approval are code-controlled so the model cannot drift into autonomous triage."
      },
      {
        title: "How synthetic data is used",
        body:
          "The 100-record and future 1M-record synthetic runs provide evaluation and tuning material covering children, dependents, female health, pregnancy red flags, male health, aviation duty, heat, dust, and Qatar seasonal context without using real PHI."
      },
      {
        title: "How cloud migration works",
        body:
          "The LLM should move behind a private backend adapter in GCP Doha. The UI calls IST APIs, the adapter calls the private model endpoint, and security controls log, mask, evaluate, and block unsafe output."
      },
      {
        title: "How go-live is controlled",
        body:
          "Every model version needs a scorecard, safety-floor pass rate, clinical review, known-limitations note, rollback plan, and approved-use statement before it can assist live triage."
      }
    ],
    usefulFor: [
      {
        title: "Remote Triage Nurse",
        body:
          "Receives cleaner summaries, SBAR drafts, suggested missing questions, and bilingual wording while still owning the final advice."
      },
      {
        title: "Clinical Governance",
        body:
          "Can review model behavior against deterministic expected outputs, local protocol policy, pediatric/female/male health cohorts, and Qatar regional context."
      },
      {
        title: "Security and Privacy",
        body:
          "Can verify data minimization, masking, audit logs, model endpoint residency, prompt/output retention, and DPO-approved training data controls."
      },
      {
        title: "Cloud Platform Team",
        body:
          "Gets an implementation backlog for GCP Doha: private networking, endpoint deployment, model registry, cost tests, quota tests, monitoring, and rollback."
      }
    ],
    exampleFlow: [
      "Generate or import synthetic LLM-ready rows and split them into train, validation, and test sets.",
      "Run offline evaluation to check that the model explains the deterministic route without downgrading severity.",
      "Add a backend LLM adapter in dry-run mode and display outputs as advisory draft content only.",
      "Pilot quantized inference for non-PHI or synthetic payloads if the MVP needs local model behavior before cloud hosting.",
      "For cloud UAT, deploy a private model endpoint in GCP Doha and connect it through the backend adapter.",
      "Run clinical, privacy, security, and performance scorecards before enabling live nurse-facing assistance.",
      "Keep nurse approval, safety-floor wrappers, CCP outbound gates, and audit logging outside the model."
    ]
  },
  {
    id: "data-ingestion",
    title: "Data Ingestion and QA",
    eyebrow: "Phase I seed and Phase II migration",
    icon: Database,
    summary:
      "Documents how clinical content, aviation tables, local dispositions, Oracle-style employee API feeds, normalized projections, and automated QA tests enter and validate the Phase I system.",
    usedBy: [
      "prisma/seed.ts",
      "prisma/schema.prisma",
      "src/scripts/importClinicalContent.ts",
      "python/generate_synthetic_pdp_data.py",
      "tests/triage.test.ts",
      "python/test_safety_wrapper.py"
    ],
    details: [
      "Phase I seeding populates open-source/synthetic protocol content, acuity-ordered questions, localized care advice, QuestionAdviceBridge mappings, keyword indexes, and localized Qatar dispositions.",
      "The synthetic employee data factory can generate an Oracle Fusion HCM-style API feed for a 260-aircraft aviation workforce, plus normalized IST staff/dependent projections, 5,000 historical encounters, semantic vectors, and safety audit logs.",
      "The backend keeps the clinical content shape compatible with a later licensed Schmitt-Thompson After Hours / SymptomScreen import. The clinical workspace continues to call the same API contract after the dataset swap.",
      "Schema alignment now includes ClinicalReference, AlgorithmReference, ClinicalSupplemental, AlgorithmSupplemental, ProtocolTaxonomy, ProtocolFirstAid, telemedicine flags, sanitized formatted content, and source hash/checksum fields.",
      "RAG shadow ledger tables are separate from source clinical data so model comparison, learning feedback, and blocked unsafe outputs cannot contaminate the approved content library.",
      "The current test layer validates staff lookup, adult emergency safety floors, pediatric tachypnea routing, stable-vitals NEWS2 calculation, bilingual SBAR generation, fit-to-fly restriction, and Python AI downgrade blocking.",
      "Seed execution requires a reachable PostgreSQL database and DATABASE_URL. Code-level validation can still run without the database through TypeScript build, Prisma validate, Jest API tests, and Python wrapper tests."
    ],
    helps: [
      {
        title: "Clinical lineage",
        body:
          "Each protocol question can be traced to severity, disposition, rationale, and care advice so clinical governance can review what drove the route."
      },
      {
        title: "Safe dataset swap",
        body:
          "Licensed data can be imported into the same relational footprint instead of changing the frontend workflow or nurse-facing screen logic."
      },
      {
        title: "Aviation context",
        body:
          "Crew role, duty state, outstation status, sickness request, vaccination timing, and fit-to-fly flags are kept as explicit data rather than hidden prompt text."
      },
      {
        title: "Synthetic workforce",
        body:
          "The generator models pilots, cabin crew, support staff, dependents, historical calls, and safety deviations as Oracle-style API payloads and normalized IST projections without introducing real employee or patient records."
      },
      {
        title: "Automated evidence",
        body:
          "Jest/Supertest and Python tests make the safety floor, routing, SBAR output, and AI downgrade controls repeatable for release review."
      }
    ],
    exampleFlow: [
      "Run Prisma migration against the approved PostgreSQL database.",
      "Generate or consume Oracle Fusion HCM worker/contact payloads, then map them into the IST staff-validation response and approved normalized projection.",
      "Run the Phase I seed to load open-source clinical baseline and Qatar dispositions.",
      "Load STCC-compatible references, supplementals, first aid, taxonomy, telemedicine indicators, and source-lineage fields when the licensed import format is approved.",
      "Run API tests to prove staff validation, adult emergency routing, pediatric emergency routing, stable NEWS2 handling, and SBAR output.",
      "Run Python safety tests to prove an AI routine or homecare downgrade is blocked when RED vitals are present.",
      "At UAT or Go-Live, import licensed clinical content into the same schema and rerun the same test suite before activation."
    ]
  },
  {
    id: "prisma-model",
    title: "Prisma Data Model",
    eyebrow: "Relational clinical backbone",
    icon: Database,
    summary:
      "Explains the PostgreSQL model used for STCC-compatible clinical content, staff/dependents, queue orchestration, aviation encounters, safety logs, RAG shadow learning, and security administration.",
    usedBy: [
      "prisma/schema.prisma",
      "@prisma/client",
      "src/scripts/importClinicalContent.ts",
      "src/services/queueOrchestration.ts",
      "src/services/ragShadow.ts"
    ],
    details: [
      "Algorithm, TriageQuestion, CareAdvice, QuestionAdviceBridge, AlgorithmCareAdvice, ProtocolKeywordIndex, and ProtocolSynonym form the core protocol footprint.",
      "ClinicalReference, AlgorithmReference, ClinicalSupplemental, AlgorithmSupplemental, ProtocolTaxonomy, and ProtocolFirstAid close the STCC-compatible gaps for references, appendices, indexes, first aid, and non-question content.",
      "ProtocolRelease, ClinicalContentImportJob, ClinicalContentImportError, source hashes/checksums, and reconciliation fields preserve import lineage and annual update evidence.",
      "StaffMember and Dependent are normalized triage projections of Oracle Fusion HCM worker/contact data, not the long-term HR source of truth.",
      "TriageQueueItem and QueueTransitionLog preserve named-user queue state, call locks, STCC process snapshots, and signed movement traces.",
      "AviationTriageEncounter and SafetyAuditDeviationLog preserve the route, score, final disposition, RAG shadow suggestion, override rationale, and explainability trace once persistence is approved.",
      "RagRetrievalEvent, LlmShadowSuggestion, NurseSelectionEvent, ProtocolComparisonEvent, LearningFeedbackEvent, ModelEvaluationRun, and SafetyBlockedOutput preserve bounded AI/ML evidence separately from source clinical content.",
      "Security administration models define application users, roles, responsibilities, permissions, access profiles, reveal events, encryption policy metadata, and audit events."
    ],
    helps: [
      {
        title: "Why it matters",
        body:
          "A stable relational footprint lets clinical content change without rebuilding the triage workspace or retraining users."
      },
      {
        title: "Current limitation",
        body:
          "The schema is aligned, but importer population, live Cloud SQL migration, retention policy, and licensed STCC activation are still separate governed tasks."
      }
    ]
  },
  {
    id: "simulation-engine",
    title: "Synthetic Simulation Engine",
    eyebrow: "AI evaluation and safety testing",
    icon: BrainCircuit,
    summary:
      "Generates synthetic tele-triage encounters through the full discrete state pipeline: intake, vector protocol match, safety floor, NEWS2-style scoring, aviation gate, Qatar routing, SBAR, and LLM-ready JSONL rows.",
    usedBy: [
      "GET /api/v1/simulation/scenarios",
      "POST /api/v1/simulation/run/:scenarioId",
      "GET /api/v1/simulation/training-set",
      "npm run simulation:jsonl",
      "python/simulation_engine.py"
    ],
    details: [
      "The simulation engine is synthetic only. It is safe for demos, regression tests, prompt evaluation, and governed training workflows because every row is tagged synthetic and contains no PHI.",
      "The engine follows the same rules-first architecture as the live triage workflow: deterministic safety floors and nurse approval remain authoritative, while AI rows teach explanation and drafting behavior.",
      "Each result includes a state transition log, cosine-similarity protocol match, vital-sign score, aviation gate, final disposition, SBAR note, and an expected-output record for LLM evaluation.",
      "The learning rows now carry contextual patient metadata so AI evaluation can check child/dependent, pediatric, female-health, pregnancy red-flag, male-health, and aviation-duty reasoning.",
      "Regional context adds Qatar day-wise season, heat risk, dust risk, respiratory season, vulnerable groups, and demographic priors for safer AI/ML evaluation.",
      "The attached design works for this platform after correction, but the pasted Python had syntax gaps. The repo implementation is executable, typed, tested, and exposed by API plus CLI."
    ],
    helps: [
      {
        title: "Train without PHI",
        body:
          "The JSONL export gives AI teams realistic call patterns without using real employee or patient records."
      },
      {
        title: "Prove safety behavior",
        body:
          "Emergency vitals, pediatric tachypnea, low-similarity complaints, aviation restrictions, and AI downgrade attempts can be regression-tested repeatedly."
      },
      {
        title: "Exercise the call queue",
        body:
          "Large synthetic batches can feed incoming-call, nurse-capacity, prioritization, and escalation tests before live call-center integration."
      },
      {
        title: "Evaluate AI copilots",
        body:
          "Expected outputs teach the AI to summarize, explain, and draft while deferring final disposition to deterministic rules and nurse approval."
      },
      {
        title: "Teach contextual awareness",
        body:
          "The bulk dataset includes pediatric/dependent, female-health, pregnancy red-flag, and male-health cases with explicit age band, biological sex, dependent status, and safety-floor labels."
      },
      {
        title: "Model Qatar seasonal health",
        body:
          "Each bulk row includes season, heat-risk, dust-risk, respiratory-season, and vulnerable-group labels so AI evaluation can learn when heat, humidity, dust, and population context should influence explanation and nurse prompts."
      }
    ],
    exampleFlow: [
      "Generate or select a synthetic scenario.",
      "Run semantic vector matching and reject low-confidence matches below threshold.",
      "Apply WHO/IITT RED floors before NEWS2 scoring or RAG shadow suggestions.",
      "Apply aviation context for fit-to-fly, outstation, sickness, and vaccination flags.",
      "Route to local Qatar disposition and render SBAR.",
      "Export the expected outcome as JSONL for AI evaluation or governed training."
    ]
  },
  {
    id: "synthetic-employee-data",
    title: "Synthetic Employee Data Factory",
    eyebrow: "Aviation workforce seed data",
    icon: Database,
    summary:
      "Builds the statistically realistic Oracle-style employee API feed plus synthetic dependent, encounter, vector, and safety-audit data used to stress-test the platform and evaluate AI copilots.",
    usedBy: [
      "python/generate_synthetic_pdp_data.py",
      "python/test_synthetic_pdp_generator.py",
      "oracle_fusion_hcm_api.publicWorkers",
      "oracle_fusion_hcm_api.workers",
      "oracle_fusion_hcm_api.assignments",
      "oracle_fusion_hcm_api.hcmContacts",
      "data/generated/ist_qatar_seed_data.json",
      "docs/synthetic-employee-data.md"
    ],
    details: [
      "Default generation models 260 active wide-body aircraft, 26,000 employees, 4,300 pilots, 5,200 cabin crew, and 16,500 support staff.",
      "The source feed includes Oracle Fusion HCM-style publicWorkers, workers, workRelationships, assignments, hcmContacts, contactRelationships, and absences collections.",
      "Dependents are assigned to 45 percent of staff, with spouse, son, and daughter relationships generated logically from synthetic employee age and represented through contact relationship payloads.",
      "The 5,000 encounter history follows core operational profiles: cardiac emergency, pediatric respiratory distress, cabin crew back pain, pilot ear barotrauma, and mandated immunization fever.",
      "The bulk clinical simulation expands the learning set with pediatric fever/dehydration, female urinary symptoms, pregnancy red flags, and male genitourinary urgent presentations.",
      "Every encounter includes vitals, transcript text, semantic symptom vector, cosine-similarity protocol match, deterministic disposition, fit-to-fly impact, and SBAR-style payload.",
      "Contextual fields include patient_context, biological_sex, age band, dependent status, pregnancy/red-flag status where applicable, and aviation role.",
      "Regional fields include regional_context with Qatar season, temperature, apparent temperature, humidity, wind, heat risk, dust risk, respiratory season, vulnerable groups, health-impact tags, and demographic priors.",
      "Exactly 5 percent of generated encounters receive a safety audit deviation log with original RAG shadow suggestion, nurse rationale, rules severity, and explainability trace."
    ],
    helps: [
      {
        title: "Why it helps",
        body:
          "A realistic workforce lets the triage queue, nurse workspace, dashboards, analytics, and AI test harness behave like a large aviation operation."
      },
      {
        title: "How it protects privacy",
        body:
          "All records are synthetic, generated from distributions and deterministic templates, with no copied HR or patient data."
      },
      {
        title: "How AI teams use it",
        body:
          "The data can train or evaluate non-autonomous copilot behavior: summarize, explain, draft SBAR, and defer to rules and nurse approval."
      },
      {
        title: "Why context matters",
        body:
          "A child with fever/dehydration, a pregnant employee with bleeding, and a male patient with acute genitourinary pain need different red-flag reasoning even when the final AI task is only explanation or drafting."
      },
      {
        title: "Why regional data matters",
        body:
          "In Qatar, summer heat, humidity, dust exposure, and a working-age aviation population change the questions a nurse should remember to ask, especially for children, pregnant patients, respiratory symptoms, dehydration, and duty exposure."
      },
      {
        title: "Database readiness",
        body:
          "The JSON includes Oracle-style source collections plus Prisma table-shaped projections so a seed loader can insert protocol anchors, approved staff snapshots, dependents, encounters, and safety logs in dependency order."
      }
    ],
    exampleFlow: [
      "Generate the full dataset or a smaller validation sample.",
      "Use the Oracle Fusion HCM-style collections as the employee source feed for adapter testing.",
      "Review the statistics block for workforce and encounter distribution.",
      "Map Oracle workers, assignments, contacts, and absences into the IST staff-validation response.",
      "Load protocol anchors first, then approved normalized staff/dependent projections, encounters, and safety logs.",
      "Run triage and AI evaluation tests against the synthetic records.",
      "Use failures to tune prompts, queue design, safety explanations, and data quality checks."
    ]
  },
  {
    id: "clinical-simulation-engine",
    title: "Complete Clinical Simulation Engine",
    eyebrow: "End-to-end safety rehearsal",
    icon: Workflow,
    summary:
      "Runs the full synthetic clinical journey from Oracle-style employee verification through nurse triage, vector retrieval, safety floors, aviation gates, SBAR, FHIR write-back, and audit logging.",
    usedBy: [
      "python/clinical_simulation_engine.py",
      "python/run_bulk_clinical_simulation.py",
      "python/test_clinical_simulation_engine.py",
      "python/test_bulk_clinical_simulation.py",
      "EmployeeSimulator",
      "VectorKnowledgeEngine",
      "TriageNurseSimulator",
      "EMRWritebackEngine"
    ],
    details: [
      "EmployeeSimulator consumes the synthetic Oracle Fusion HCM-style feed and verifies staff, dependents, department, job title, and duty status.",
      "VectorKnowledgeEngine applies five-dimensional cosine similarity for adult emergency, pediatric respiratory, pediatric fever/dehydration, back pain, vaccination reaction, female-health, male-health, ear barotrauma, and UNKNOWN fallback anchors.",
      "TriageNurseSimulator runs patient verification, chief complaint mapping, WHO/IITT RED floors, pediatric tachypnea checks, NEWS2 scoring, aviation restrictions, and AI downgrade blocking.",
      "EMRWritebackEngine generates bilingual SBAR Markdown, a simulated FHIR transaction Bundle, Encounter, Observation, ClinicalImpression resources, and append-only safety audit logs.",
      "The bulk runner can stream 100-record rehearsals or 1M-record historical simulations into encounter, audit, and LLM-ready training JSONL partitions.",
      "Bulk rows include child/dependent, female-health, pregnancy red-flag, and male-health cohorts so AI/ML evaluation covers contextual clinical reasoning rather than generic adult symptoms only.",
      "Bulk rows also include Qatar regional context for day-wise heat, humidity, dust, respiratory season, and population-health priors; these are explanation features, not autonomous disposition rules.",
      "The built-in suite executes the three master-prompt cases: active pilot cardiac emergency, pediatric cough with tachypnea, and stable cabin crew lower back injury."
    ],
    helps: [
      {
        title: "Why it helps",
        body:
          "It lets clinical, operations, integration, and AI teams rehearse the complete flow before connecting live Oracle HCM or EMR systems."
      },
      {
        title: "How it protects safety",
        body:
          "The RAG shadow suggestion is compared against deterministic rules, and downgrades below RED or aviation safety floors are blocked and logged."
      },
      {
        title: "How it supports integrations",
        body:
          "The final payload is a simulated FHIR transaction, so EMR teams can review object shape without sending data to a live clinical database."
      },
      {
        title: "How to run it",
        body:
          "Use clinical-sim:sample for fast validation, clinical-sim:bulk-sample for 100 records, or clinical-sim:bulk-1m for the million-record historical run."
      }
    ],
    exampleFlow: [
      "Generate the synthetic Oracle employee feed.",
      "Verify staff or dependent identity through EmployeeSimulator.",
      "Match symptoms against the vector codebook.",
      "Run the nurse triage state machine and deterministic safety floor.",
      "Apply aviation medicine duty restrictions.",
      "Generate bilingual SBAR and FHIR transaction payload.",
      "Create audit evidence for AI downgrade blocking or nurse override."
    ]
  },
  {
    id: "api-contracts",
    title: "API Contract Library",
    eyebrow: "Backend endpoint reference",
    icon: PlugZap,
    summary:
      "Lists the operating API contracts exposed by the backend for staff validation, triage scoring, encounter completion, CCP, auth, and administration.",
    usedBy: [
      "src/app.ts",
      "src/routes/staff.ts",
      "src/routes/triage.ts",
      "src/routes/simulation.ts",
      "src/routes/ccp.ts",
      "src/routes/auth.ts",
      "src/routes/admin.ts"
    ],
    details: [
      "POST /api/v1/staff/validate validates IST staff IDs and returns the profile, dependents, and a compatibility validated flag.",
      "POST /api/v1/triage/calculate-score accepts snake_case vital signs and returns score, severity, riskBand, dispositionCode, targetFacilityCode, route rationale, NEWS2 components, and trace.",
      "POST /api/v1/triage/complete returns text/plain SOAP/SBAR for clipboard or JSON notePayload with fitToFlyStatus when Accept: application/json is used.",
      "POST /api/v1/triage/encounters/evaluate remains the richer clinical-plus-aviation route-evaluation endpoint used by the workspace.",
      "Simulation endpoints generate synthetic-only scenarios, full transition logs, suite runs, and LLM-ready JSONL exports for evaluation and governed training.",
      "Synthetic employee generation is file-based and includes Oracle Fusion HCM-style API payloads; production staff validation should consume live Oracle APIs through the backend adapter.",
      "The complete clinical simulation engine is also file-based and produces simulated FHIR write-back bundles rather than calling a live EMR.",
      "CCP endpoints support employee thread lookup, transport status, outbound draft creation, nurse approval, and Twilio webhook ingestion."
    ],
    usefulFor: [
      {
        title: "Frontend engineers",
        body: "Know which contracts are stable and which fields are compatibility aliases for tests and downstream integrations."
      },
      {
        title: "Integration teams",
        body: "Can place Oracle HCM, insurer, EMR, scheduling, Twilio, Graph, and analytics behind adapters without changing the UI contract."
      }
    ]
  },
  {
    id: "test-pack",
    title: "Test and Validation Pack",
    eyebrow: "Regression evidence",
    icon: CheckCircle2,
    summary:
      "Groups the automated checks that validate Phase I safety behavior after backend, schema, seed, or help-content changes.",
    usedBy: [
      "tests/triage.test.ts",
      "tests/simulation.test.ts",
      "tests/safety-alignment.test.ts",
      "tests/fixtures/triage_scenarios.json",
      "python/test_safety_wrapper.py",
      "python/test_synthetic_pdp_generator.py",
      "python/test_clinical_simulation_engine.py",
      "scripts/runPython.mjs",
      "npm test",
      "npm run test:python",
      "npm run typecheck:web",
      "npm run build:web"
    ],
    details: [
      "Jest/Supertest verifies authentication, staff validation, invalid staff rejection, HRMS-calculated age enforcement, adult RED floor, pediatric tachypnea route, pediatric 5-12 warning, stable NEWS2 pass-through, bilingual SBAR output, AI downgrade blocking, and fit-to-fly restriction.",
      "The Python safety wrapper tests verify that AI HOMECARE passes when vitals are normal and that ROUTINE/HOMECARE downgrades are blocked when RED vitals are present.",
      "The shared fixture tests run the same adult vital-sign scenarios through TypeScript scoring and the Python safety wrapper so RED-floor behavior cannot drift silently between engines.",
      "Simulation endpoint tests now authenticate through the real login route before reading scenarios, running scenarios, or exporting LLM-ready JSONL rows.",
      "The synthetic PDP generator tests verify workforce scale math, dependent generation, encounter mix, safety audit volume, and Prisma-shaped record fields.",
      "The complete clinical simulation tests verify cosine fallback, prompt case routing, AI downgrade blocking, fit-to-fly restriction, FHIR transaction shape, and audit log creation.",
      "Frontend typecheck and build validate that the Help/Library content compiles and renders with the current React/Tailwind application.",
      "Prisma validate and generate confirm the schema is syntactically valid and the client reflects the latest model names."
    ],
    helps: [
      {
        title: "Release gate",
        body: "A release should not proceed if the RED floor, pediatric routing, SBAR, or AI downgrade tests fail."
      },
      {
        title: "Evidence gap",
        body: "Database seed execution can now be tested locally through Docker Compose PostgreSQL before moving the same schema to Cloud SQL in GCP Doha."
      }
    ]
  },
  {
    id: "remediation-evidence",
    title: "Sequential Remediation Evidence",
    eyebrow: "Review, test, commit, rollback",
    icon: FileCheck2,
    summary:
      "Records the current remediation sequence so reviewers can confirm what changed, which tests were run, and how to roll back each bounded commit.",
    usedBy: [
      "git log --oneline",
      "npm run build",
      "npm test",
      "npm run test:python",
      "npm run typecheck:web",
      "npm run build:web",
      "prisma validate"
    ],
    details: [
      "4064ef5 - Expanded Help/Library into the What, Why, and How framework. Rollback: git revert 4064ef5.",
      "ad28efb - Added Prisma singleton, live-mode configuration guardrails, mock/live response marking, and persistence hooks for sessions, audit events, and triage encounter records. Rollback: git revert ad28efb.",
      "3d927a1 - Protected API routes with session or bearer-token auth, added login/staff rate limits, strict CORS defaults, and auth-aware API tests. Rollback: git revert 3d927a1.",
      "1f51af2 - Enforced HRMS-calculated patient age, pediatric thresholds, AI downgrade trace blocking, and final emergency/urgent fit-to-fly restriction. Rollback: git revert 1f51af2.",
      "3ba83b7 - Added shared TypeScript/Python safety fixtures, simulation auth test alignment, and a portable Python launcher. Rollback: git revert 3ba83b7.",
      "Unrelated untracked .claude/ content is intentionally left out of this sequence."
    ],
    helps: [
      {
        title: "What was confirmed",
        body:
          "Each completed fix was reviewed in code, tested with targeted commands, and committed separately so rollback is precise."
      },
      {
        title: "Why sequence matters",
        body:
          "Database/runtime, auth, clinical safety, and simulator alignment touch different risk surfaces. Keeping one commit per fix avoids a broad revert when only one layer needs correction."
      },
      {
        title: "How to roll back",
        body:
          "Use the listed git revert command for the specific commit. Re-run npm test, npm run build, and the affected frontend or Python validation command after the revert."
      }
    ],
    exampleFlow: [
      "Review the commit entry and scope.",
      "Run the listed validation command for that layer.",
      "If the fix must be backed out, run the exact git revert command.",
      "Re-run the same validation command.",
      "Record any remaining gap as a separate remediation item."
    ]
  },
  {
    id: "content-release",
    title: "Clinical Content Release Lifecycle",
    eyebrow: "Open-source to licensed content",
    icon: GitBranch,
    summary:
      "Describes how protocol data moves from Phase I sample content to governed licensed production content without rewriting the nurse workflow.",
    usedBy: [
      "ProtocolRelease",
      "ClinicalContentImportJob",
      "ClinicalContentImportError",
      "ClinicalContentSourceType",
      "ClinicalReference",
      "ClinicalSupplemental",
      "ProtocolTaxonomy",
      "ProtocolFirstAid"
    ],
    details: [
      "A content release carries source type, version, region, mode, active status, import metadata, and linked algorithms.",
      "Phase I can load synthetic/open-source sample content for engineering validation while retaining a clear source label.",
      "Licensed STCC or SymptomScreen imports should use a controlled importer, checksum, row counts, skipped rows, validation errors, source record hashes, relationship checks, and duplicate detection.",
      "Release activation must include algorithms, questions, search words, care advice, references, supplementals, first aid, taxonomy, telemedicine labels, and local overlay reconciliation.",
      "Only one approved active clinical content package should drive production triage for a defined mode and region."
    ],
    exampleFlow: [
      "Receive licensed dataset and vendor documentation.",
      "Reverse-engineer source schema with approved tooling and map into the IST Postgres model.",
      "Run dry-run import and validate row counts, code mappings, severity floors, and care advice links.",
      "Run regression tests and clinical governance review.",
      "Activate the approved release and archive the previous release with audit evidence."
    ]
  },
  {
    id: "frontend-surfaces",
    title: "Frontend Workspace Surfaces",
    eyebrow: "User-facing modules",
    icon: ClipboardList,
    summary:
      "Documents the screens that users see: login, triage workspace, CCP workspace, administration, Help, and Library.",
    usedBy: ["LoginPage", "TriageWorkspace", "CcpWorkspace", "AdminPortal", "HelpCenter", "App"],
    details: [
      "Login uses IST Health organization context and a grouped simulate-user dropdown for administration, security, governance, business, integration, reporting, and support users.",
      "TriageWorkspace is the nurse-facing clinical page for staff/dependent context, symptom capture, rules-first evaluation, SBAR, and CCP launch.",
      "CcpWorkspace shows one employee communication index with separate visit/call threads, nurse-approved outbound drafts, and transport status.",
      "AdminPortal exposes role-aware security, privacy, access, SSO, encryption, reveal, and audit panels.",
      "Help now explains operational guidance, while Library acts as the technical/reference catalogue."
    ]
  },
  {
    id: "identity",
    title: "Staff, Dependents, and Eligibility",
    eyebrow: "HRMS and insurance context",
    icon: UserRoundCheck,
    summary:
      "Validates the IST staff ID, maps dependents, checks duty status, and returns insurance provider, eligibility status, and last-checked notes.",
    usedBy: ["POST /api/v1/staff/validate", "POST /api/v1/triage/start", "verifyInsuranceEligibility"],
    details: [
      "Target HRMS connector is Oracle Fusion Cloud HCM REST, starting with publicWorkers for low-scope active-worker checks and workers/workRelationships/assignments when deeper duty context is approved.",
      "Dependent context maps to Oracle HCM Contacts and Contact Relationships where IST stores dependents there.",
      "Eligibility does not stop clinical advice; it informs booking, financial responsibility, and downstream verification."
    ]
  },
  {
    id: "safety",
    title: "Deterministic Safety Floor",
    eyebrow: "Rules before AI",
    icon: ShieldCheck,
    summary:
      "Combines clinical red-flag rules and aviation gates to determine the minimum permitted severity before RAG shadow suggestions are reviewed.",
    usedBy: ["resolveDisposition", "evaluate_mock_stcc_floor", "severityMax"],
    details: [
      "Emergency examples include chest tightness with sweating, prolonged severe pain, breathing difficulty, altered consciousness, stroke terms, and anaphylaxis terms.",
      "Urgent examples include moderate pain, persistent vomiting, high fever, dizziness, abnormal oxygen saturation, or safety-sensitive crew symptoms.",
      "AI escalation can be accepted, but an AI downgrade below the deterministic floor is blocked and audited."
    ]
  },
  {
    id: "aviation",
    title: "Aviation Medicine Layer",
    eyebrow: "Fit-to-fly and duty context",
    icon: Route,
    summary:
      "Adds airline-specific logic for flight deck, cabin crew, outstation staff, sickness validation, vaccination reactions, and occupational visits.",
    usedBy: ["evaluateAviationRules", "aviationContext", "customAviationTags"],
    details: [
      "Safety-sensitive crew with dizziness, syncope, chest symptoms, shortness of breath, or altered consciousness require medical review before duty.",
      "Outstation cases create teleconsult escalation and station-code telemetry.",
      "Recent vaccination plus rash, fever, or swelling creates a structured follow-up flag."
    ]
  },
  {
    id: "routing",
    title: "Localized Disposition Routing",
    eyebrow: "Right care, right place",
    icon: Hospital,
    summary:
      "Turns severity and context into a local destination: HMC Emergency, Sidra Pediatric ED, HMC urgent review, IST medical centre at HIA, IST Old Airport medical commission workflow, PHCC/teleconsult, outstation teleconsult, or self-care.",
    usedBy: ["resolveDisposition", "AcuityDispositionCode", "DispositionDecision"],
    details: [
      "Pediatric emergency routes to Sidra Medicine Emergency Department.",
      "Adult/general emergency routes to Hamad Medical Corporation Emergency Department.",
      "Occupational, fit-to-fly, sickness-validation, and commission workflows route to IST medical destinations when clinically appropriate."
    ]
  },
  {
    id: "documentation",
    title: "Documentation and Handover",
    eyebrow: "SBAR/SOAP clipboard payload",
    icon: FileCheck2,
    summary:
      "Compiles the encounter into English and Arabic-labeled SBAR text plus structured metadata for EMR copy-paste, future FHIR handoff, and clinical audit.",
    usedBy: ["compileSbarClipboardPayload", "clipboardText", "structured payload"],
    details: [
      "The output includes situation, background, assessment, recommendation, insurance status, aviation tags, severity, destination, and rationale.",
      "The current MVP uses clipboard handoff to reduce integration friction.",
      "A future EMR integration can persist the structured payload through approved Oracle Cerner/FHIR workflows."
    ]
  },
  {
    id: "audit",
    title: "Safety Audit and Dashboard",
    eyebrow: "Explainability and quality review",
    icon: Database,
    summary:
      "Captures RAG shadow suggestion differences, nurse overrides, downgrade blocks, rules-engine severity, and explainability traces for safety officer review.",
    usedBy: ["buildSafetyAuditDraft", "SafetyAuditDeviationLog", "python/audit.sqlite3"],
    details: [
      "Emergency cases and AI mismatches are marked review-required.",
      "The Python wrapper writes downgrade decisions and rule hits to SQLite for the MVP demonstration.",
      "The dashboard is the operating surface for QA sampling, trend review, incident follow-up, and training feedback."
    ]
  }
];

const libraryWhatWhyHow: Record<string, WhatWhyHow> = {
  teletriage: {
    what:
      "The remote encounter engine that moves one caller from staff/dependent validation through symptom capture, acuity rule-out, local routing, documentation, and nurse approval.",
    why:
      "The core problem is that remote clinical calls can miss context or bury red flags. The engine makes the sequence explicit so emergency findings, aviation duty impact, and human accountability stay visible.",
    how: [
      "Validate identity, dependent status, duty context, language, and location.",
      "Capture complaint, narrative, vitals, red flags, age, sex, and aviation flags.",
      "Apply deterministic safety floors, then route, document, and hand off through SBAR and CCP."
    ]
  },
  ccp: {
    what:
      "The Continuous Communication Pipeline: one employee communication index with separate visit, call, teleconsult, and follow-up threads.",
    why:
      "Clinical continuity breaks when call notes, WhatsApp, SMS, email, callbacks, and route handoffs are scattered. CCP keeps every episode separate but linked for nurse review.",
    how: [
      "Open a new thread for each visit or call while keeping previous thread links visible.",
      "Create goals for callbacks, route handoffs, fit-to-duty, safety precautions, and dependent follow-up.",
      "Queue outbound messages until Remote Triage Nurse approval, then send through guarded WhatsApp/SMS/email adapters."
    ]
  },
  protocols: {
    what:
      "The STCC-compatible clinical content layer: algorithms, search words, taxonomy, acuity-ordered questions, severity, rationale, disposition codes, care advice, first aid, references, and supplementals.",
    why:
      "Triage safety depends on asking high-acuity questions first and tracing the final route back to approved clinical content rather than prompt wording or informal nurse memory.",
    how: [
      "Load protocol content into Algorithm, TriageQuestion, CareAdvice, bridge, keyword, synonym, reference, supplemental, taxonomy, and first-aid tables.",
      "Keep emergency questions ordered before urgent, routine, or self-care content.",
      "Use release IDs, source hashes, duplicate checks, and annual reconciliation metadata before production activation."
    ]
  },
  "stcc-rag-shadow": {
    what:
      "A bounded RAG shadow layer that runs beside deterministic STCC-style search and nurse selection, then stores comparison evidence without changing clinical authority.",
    why:
      "The AI/ML engine needs learning signals, but clinical decisions must remain deterministic and nurse-approved. Shadow mode creates evidence without allowing AI to invent, downgrade, or route care.",
    how: [
      "Retrieve only approved source records and store source IDs, release versions, snippet hashes, and confidence.",
      "Store LLM candidate protocols, extracted keywords, and rationale as advisory shadow suggestions.",
      "Compare deterministic, shadow, and nurse-selected protocol outcomes; record feedback and block unsafe output."
    ]
  },
  "llm-copilot-cloud": {
    what:
      "The governed MedGemma/LLM copilot strategy for explanation, summarization, approved-protocol context prompts, bilingual wording, and SBAR drafting.",
    why:
      "The LLM must assist without becoming an invisible clinical authority. Safety floors, route decisions, nurse approval, privacy controls, and model lineage must remain outside the model.",
    how: [
      "Evaluate synthetic JSONL before any live endpoint or tuning.",
      "Expose the model only through a backend adapter with masking, logging, and downgrade blocking.",
      "Move to private GCP Doha serving only after clinical, privacy, security, quota, and cost approval."
    ]
  },
  "data-ingestion": {
    what:
      "The ingestion and QA model for STCC-compatible clinical content, local dispositions, aviation tables, synthetic Oracle HCM-style feeds, and normalized projections.",
    why:
      "The system must accept better data over time without changing the nurse workflow or weakening deterministic clinical safety.",
    how: [
      "Run migrations and seed approved baseline content into the relational schema.",
      "Map Oracle-style worker/contact payloads into IST staff/dependent validation responses.",
      "Validate row counts, source hashes, duplicate records, missing bridges, question order, references, supplementals, first aid, and care advice before activating any imported content release."
    ]
  },
  "prisma-model": {
    what:
      "The PostgreSQL relational backbone for STCC-compatible content, staff/dependents, queue state, aviation encounters, RAG shadow evidence, audit logs, and security administration.",
    why:
      "A stable schema keeps clinical content, HR context, audit evidence, and security controls traceable as the MVP moves toward production.",
    how: [
      "Maintain protocol, source-lineage, RAG ledger, staff projection, encounter, queue, audit, and security models in Prisma.",
      "Run Prisma validation, migrations, and seed against an approved PostgreSQL database.",
      "Deprecate legacy convenience fields gradually after importers and runtime code move to canonical release, DOB-derived age, and organization references."
    ]
  },
  "simulation-engine": {
    what:
      "A synthetic-only state-machine simulation that emits triage outcomes, transition logs, SBAR, audit traces, and LLM-ready rows.",
    why:
      "The team needs realistic data to validate safety, queue behavior, and copilot prompts without using real employee or patient records.",
    how: [
      "Generate scenarios with demographics, symptoms, vitals, route context, and aviation flags.",
      "Run semantic matching, red floors, NEWS2-style scoring, aviation gates, and route selection.",
      "Export JSONL rows for evaluation, regression tests, and governed training workflows."
    ]
  },
  "synthetic-employee-data": {
    what:
      "A synthetic aviation workforce and dependent factory shaped like Oracle Fusion HCM source payloads plus IST normalized projections.",
    why:
      "The system needs large-scale employee, dependent, and encounter data to stress-test workflows before live HRMS access is approved.",
    how: [
      "Generate synthetic publicWorkers, workers, assignments, contacts, dependents, absences, and encounter history.",
      "Preserve contextual cohorts for children, female health, pregnancy red flags, male health, and aviation duties.",
      "Use output for adapter tests, queue tests, analytics, and LLM evaluation only."
    ]
  },
  "clinical-simulation-engine": {
    what:
      "The end-to-end rehearsal engine for employee verification, vector retrieval, nurse triage, safety floors, aviation restrictions, SBAR, FHIR-shaped output, and audit logging.",
    why:
      "Before live Oracle HCM or EMR integration, teams need a complete test harness that proves the clinical journey and safety controls together.",
    how: [
      "Consume the synthetic Oracle HCM-style feed and verify staff/dependents.",
      "Match complaints to protocol anchors and run deterministic safety and aviation rules.",
      "Emit bilingual SBAR, simulated FHIR bundles, audit logs, and LLM-ready training rows."
    ]
  },
  "api-contracts": {
    what:
      "The backend contract catalogue for staff validation, triage scoring, encounter completion, simulation, CCP, auth, and administration.",
    why:
      "Stable APIs let the frontend, Oracle HCM, EMR, communication providers, analytics, and future LLM adapter evolve without rewriting the nurse workspace.",
    how: [
      "Keep frontend calls routed through IST API endpoints.",
      "Place Oracle, insurer, EMR, scheduling, Twilio, Graph, analytics, and LLM providers behind adapters.",
      "Version new endpoints and preserve compatibility aliases used by tests and integrations."
    ]
  },
  "test-pack": {
    what:
      "The regression evidence pack for triage safety, simulation, synthetic data generation, and frontend build integrity.",
    why:
      "Every clinical or integration change needs repeatable proof that red floors, pediatric routing, SBAR, AI downgrade blocking, and UI rendering still work.",
    how: [
      "Assign every maintained scenario a stable ID, reject duplicate IDs, and link each case to its owning contract or risk.",
      "Add a case for new behavior, revise the owning case when a contract changes, and retire an obsolete case with its reason and replacement instead of leaving duplicate coverage.",
      "Run Jest/Supertest for API, RBAC, call-center integration, queue behavior, and frontend type/build checks.",
      "Run Python safety, synthetic data, clinical simulation, and bulk simulation tests.",
      "Treat failed red-floor, routing, SBAR, or downgrade-blocking tests as release blockers."
    ]
  },
  "remediation-evidence": {
    what:
      "The review evidence and rollback ledger for the current sequential remediation run.",
    why:
      "Clinical, security, and integration fixes must be reversible by layer so one defect does not force a broad rollback of unrelated work.",
    how: [
      "Review the commit scope and tests listed for each fix.",
      "Use the exact git revert command for the affected commit only.",
      "Re-run the same validation commands after rollback and record any remaining gap separately."
    ]
  },
  "content-release": {
    what:
      "The lifecycle for moving from sample Phase I content to licensed or locally approved clinical protocol releases.",
    why:
      "Clinical content is not just data; it is governed medical logic that needs versioning, review, activation, rollback, and audit evidence.",
    how: [
      "Import a release with source, version, checksums, row counts, and validation errors.",
      "Run clinical and technical regression tests against the imported package.",
      "Activate only one approved content package per mode and region."
    ]
  },
  "frontend-surfaces": {
    what:
      "The visible application surfaces: login, triage workspace, CCP workspace, admin portal, Help, Library, Governance, and Security Admin.",
    why:
      "Different users need different levels of clarity; nurses need fast action, administrators need controls, and governance teams need evidence.",
    how: [
      "Keep the login minimal and role-aware.",
      "Keep the triage workspace focused on one call and one next action.",
      "Use Help/Library to explain workflows, evidence, integrations, and open production gaps."
    ]
  },
  identity: {
    what:
      "The staff, dependent, eligibility, and duty-context layer used before clinical triage begins.",
    why:
      "Wrong identity or missing dependent context can lead to incorrect age, route, eligibility, callback, or duty decisions.",
    how: [
      "Validate staff ID and select staff or dependent patient context.",
      "Map Oracle HCM workers, assignments, contacts, and dependents into the internal response.",
      "Use eligibility and duty status for routing support, not to block emergency advice."
    ]
  },
  safety: {
    what:
      "The deterministic safety floor that defines the minimum permitted severity before AI or lower-acuity logic is considered.",
    why:
      "The system must never allow prompt wording, model output, or routine workflow pressure to downgrade emergency findings.",
    how: [
      "Evaluate consciousness, SpO2, respiratory rate, heart rate, pediatric tachypnea, and red-flag symptoms first.",
      "Lock the minimum severity and route when emergency or urgent floors are triggered.",
      "Audit any AI mismatch, nurse override, or downgrade-blocking event."
    ]
  },
  aviation: {
    what:
      "The aviation medicine layer for crew role, duty status, fit-to-fly, outstation, sickness, vaccination reaction, and occupational context.",
    why:
      "Aviation staff may be clinically stable but operationally unsafe for duty; the route must account for safety-sensitive work.",
    how: [
      "Capture crew role, on-duty state, outstation status, sickness request, and vaccination timing.",
      "Apply duty restriction or medical review tags when safety-sensitive symptoms are present.",
      "Document aviation tags in SBAR and CCP follow-up for governed closure."
    ]
  },
  routing: {
    what:
      "The localized disposition routing model for Sidra, HMC, PHCC, IST medical routes, teleconsult escalation, and self-care.",
    why:
      "Clinical severity must convert into a real local destination and handoff path, not just a generic recommendation.",
    how: [
      "Route pediatric emergency to Sidra and adult/general emergency to HMC pathways.",
      "Apply urgent, routine, outstation, occupational, and self-care routes after red floors.",
      "Keep destination rules configurable under local medical governance."
    ]
  },
  documentation: {
    what:
      "The SBAR/SOAP handover payload and structured documentation model for clipboard and future EMR/FHIR integration.",
    why:
      "A safe triage call must leave a clean, reviewable handoff that explains context, route, rationale, and nurse accountability.",
    how: [
      "Compile situation, background, assessment, recommendation, route, rationale, and aviation tags.",
      "Return clipboard text in the MVP and structured payloads for future EMR writeback.",
      "Keep final documentation nurse-reviewed before handoff."
    ]
  },
  audit: {
    what:
      "The safety audit and explainability layer for rules, AI mismatches, overrides, downgrade blocks, and quality review.",
    why:
      "Clinical safety and compliance depend on being able to reconstruct what happened, who approved it, and why the route was selected.",
    how: [
      "Log deterministic rule hits, RAG shadow suggestions, final disposition, and nurse rationale.",
      "Mark emergency cases and AI mismatches for safety review.",
      "Use audit dashboards and exports for QA sampling, incident follow-up, and training feedback."
    ]
  }
};

function getLibraryWhatWhyHow(area: LibraryArea): WhatWhyHow {
  if (area.framework) {
    return area.framework;
  }

  const configured = libraryWhatWhyHow[area.id];
  if (configured) {
    return configured;
  }

  return {
    what: area.summary,
    why:
      area.helps?.[0]?.body ??
      area.usefulFor?.[0]?.body ??
      "This topic exists so users can move from assumptions to traceable facts, purpose, and action inside the triage platform.",
    how: area.exampleFlow ?? area.details.slice(0, 5)
  };
}

const routeDecisionOrder = [
  "Emergency safety floor first: pediatric emergency to Sidra, adult/general or unknown-age emergency to HMC.",
  "STCC-selected disposition is the clinical source of truth for the care route and care advice.",
  "Outstation escalation next when the case is not already emergency and remote clinical coordination is needed.",
  "Aviation gates then decide fit-to-fly status, sickness validation, and occupational or commission visits without downgrading the STCC disposition.",
  "If no specific route applies, severity falls back to urgent, routine, or self-care pathways."
];

const careFacilities = {
  sidra: {
    name: "Sidra Medicine",
    category: "Pediatric and specialist hospital",
    summary:
      "Publicly listed Qatar Foundation academic medical center in Ar-Rayyan/Doha. Use for pediatric emergency routing after the emergency safety floor is triggered.",
    sourceNote: "Official public site available; emergency workflow still needs IST Health clinical SOP confirmation.",
    links: [
      { label: "Official site", href: "https://www.sidra.org/" },
      { label: "Google Maps", href: "https://www.google.com/maps/search/?api=1&query=Sidra%20Medicine%20Doha%20Qatar" }
    ]
  },
  hmcEmergency: {
    name: "Hamad General Hospital / HMC Emergency pathway",
    category: "Public emergency and tertiary care",
    summary:
      "Hamad General Hospital is a publicly listed HMC hospital in Doha. For life-threatening cases, the operational route should be confirmed through HMC Ambulance Service / 999 and the nearest appropriate HMC emergency facility.",
    sourceNote: "Official HMC hospital and ambulance pages available; nearest-ED selection should be configured from live IST Health/HMC routing policy.",
    links: [
      {
        label: "Hamad General Hospital",
        href: "https://www.hamad.qa/EN/Hospitals-and-services/Hamad-General-Hospital/Pages/default.aspx"
      },
      {
        label: "HMC Ambulance Service",
        href: "https://www.hamad.qa/EN/Hospitals-and-services/Ambulance-Service/Pages/default.aspx"
      },
      {
        label: "Google Maps",
        href: "https://www.google.com/maps/search/?api=1&query=Hamad%20General%20Hospital%20Emergency%20Department%20Doha"
      }
    ]
  },
  hmcUrgent: {
    name: "Hamad Medical Corporation urgent review pathway",
    category: "Public urgent secondary care",
    summary:
      "Use for urgent presentations that do not meet the emergency floor but need time-sensitive HMC review or escalation from primary care.",
    sourceNote: "Official HMC public provider pages available; exact urgent clinic/referral target should be configured by IST Health medical governance.",
    links: [
      {
        label: "HMC",
        href: "https://www.hamad.qa/EN/Pages/default.aspx"
      },
      {
        label: "Hamad General Hospital",
        href: "https://www.hamad.qa/EN/Hospitals-and-services/Hamad-General-Hospital/Pages/default.aspx"
      },
      {
        label: "Google Maps",
        href: "https://www.google.com/maps/search/?api=1&query=Hamad%20Medical%20Corporation%20Doha%20Qatar"
      }
    ]
  },
  qaHiaMedical: {
    name: "IST Health Medical Centre - Hamad International Airport",
    category: "IST Health staff medical destination",
    summary:
      "Internal IST Health medical route for HIA-based staff care, fit-to-fly review, sickness validation, and duty-status coordination.",
    sourceNote:
      "No authoritative public facility page was found in open web search; confirm internal facility name, address, phone, hours, and booking rules with IST Health.",
    links: [
      {
        label: "Google Maps search",
        href: "https://www.google.com/maps/search/?api=1&query=medical%20centre%20Hamad%20International%20Airport%20Doha"
      },
      {
        label: "IST Health",
        href: "#"
      }
    ]
  },
  qaOldAirportMedical: {
    name: "IST Health Medical - Old Airport medical commission workflow",
    category: "IST Health occupational / commission destination",
    summary:
      "Internal IST Health medical route for occupational health, medical commission, clearance, and staff documentation workflows around the Old Airport area.",
    sourceNote:
      "Open sources identify Old Airport as a Doha district, but a public IST Health medical-commission facility page was not found; confirm the formal internal name.",
    links: [
      {
        label: "Google Maps search",
        href: "https://www.google.com/maps/search/?api=1&query=medical%20commission%20Old%20Airport%20Road%20Doha"
      },
      {
        label: "IST Health",
        href: "#"
      }
    ]
  },
  phccUrgentCare: {
    name: "Primary Health Care Corporation (PHCC) Urgent Care",
    category: "24-hour primary urgent care",
    summary:
      "PHCC publicly lists 24-hour Urgent Care for non-threatening needs and says critical conditions are stabilized then transferred by EMS for HMC secondary care.",
    sourceNote: "Official PHCC urgent-care page available; health-center selection should follow staff registration, location, coverage, and appointment policy.",
    links: [
      {
        label: "PHCC Urgent Care",
        href: "https://www.phcc.gov.qa/clinics-and-services/programmes/urgent-care"
      },
      {
        label: "Google Maps",
        href: "https://www.google.com/maps/search/?api=1&query=PHCC%20Urgent%20Care%20Qatar"
      }
    ]
  },
  qaTeleconsult: {
    name: "IST Health medical teleconsult escalation",
    category: "Airline medical coordination",
    summary:
      "Internal IST Health medical escalation route for outstation staff, station coordination, local care referral, and operational duty restrictions.",
    sourceNote:
      "No public IST Health teleconsult SOP was found; configure from internal medical, airport operations, and station-management procedures.",
    links: [
      {
        label: "Google Maps search",
        href: "https://www.google.com/maps/search/?api=1&query=medical%20teleconsult%20Doha"
      },
      {
        label: "IST Health",
        href: "#"
      }
    ]
  },
  selfCare: {
    name: "IST Health nurse-guided self-care with callback precautions",
    category: "No facility transfer",
    summary:
      "Used only after higher-acuity questions are negative and the nurse agrees approved self-care advice and callback precautions are appropriate.",
    sourceNote: "Clinical advice must come from licensed protocol content and IST Health medical governance.",
    links: []
  }
} satisfies Record<string, CareFacilityInfo>;

const dispositionRoutes: DispositionRouteDetail[] = [
  {
    code: "SIDRA_PEDIATRIC_ED",
    destination: "Sidra Medicine",
    severityBand: "Emergency pediatric",
    trigger: "Emergency patient under 18",
    selectedWhen: [
      "Patient age is under 18 and the deterministic safety floor is Emergency.",
      "A pediatric protocol question maps the encounter to an emergency disposition.",
      "AI cannot downgrade this route below the emergency floor."
    ],
    dataUsed: ["Age or dependent profile", "Red-flag checklist answers", "Emergency protocol disposition"],
    handoff: [
      "Emergency SBAR with age, guardian/dependent context, chief complaint, red flags, and selected questions.",
      "Nurse follows local emergency transfer workflow and records the rule trace."
    ],
    governance:
      "Destination and transfer procedure must be confirmed by IST Health clinical governance and local pediatric emergency routing policy.",
    facility: careFacilities.sidra
  },
  {
    code: "HMC_EMERGENCY_DEPARTMENT",
    destination: "Hamad General Hospital / nearest HMC Emergency pathway",
    severityBand: "Emergency adult/general",
    trigger: "Adult/general emergency",
    selectedWhen: [
      "Emergency rule is triggered for adult, general, or unknown-age presentations.",
      "Examples in the scaffold include high-risk chest pain, breathing difficulty, altered consciousness, stroke terms, or anaphylaxis terms.",
      "Protocol content may also set this disposition through an emergency checklist question."
    ],
    dataUsed: ["Chief complaint", "Narrative and red flags", "Vitals", "Protocol question selection"],
    handoff: [
      "Emergency SBAR with rationale and safety-floor evidence.",
      "Insurance and eligibility notes remain secondary to emergency care routing."
    ],
    governance:
      "Emergency routing should be locked against AI downgrade and sampled in the Safety Officer dashboard.",
    facility: careFacilities.hmcEmergency
  },
  {
    code: "HMC_URGENT_REVIEW",
    destination: "Hamad Medical Corporation urgent review pathway",
    severityBand: "Urgent",
    trigger: "Urgent but not emergency",
    selectedWhen: [
      "Urgent clinical floor is matched and emergency red flags are negative.",
      "Current scaffold examples include moderate pain, persistent vomiting, high fever, dizziness, or oxygen saturation below the configured threshold.",
      "Protocol content can also select urgent HMC review."
    ],
    dataUsed: ["Urgent symptom terms", "Vitals", "Negative emergency checklist items"],
    handoff: [
      "Time-sensitive SBAR, urgent symptoms, negative emergency findings, and callback number.",
      "Nurse documents escalation rationale and any physician review requirement."
    ],
    governance:
      "Urgent timing and booking SLAs should be configured by medical leadership rather than hard-coded in the UI.",
    facility: careFacilities.hmcUrgent
  },
  {
    code: "IST_HIA_MIDFIELD_MEDICAL_CENTRE",
    destination: "IST Health Medical Centre - HIA",
    severityBand: "IST Health staff pathway",
    trigger: "Fit-to-fly, sickness, or staff pathway",
    selectedWhen: [
      "Crew or staff case needs fit-to-fly review and is not already emergency.",
      "Sickness leave validation is requested.",
      "Safety-sensitive symptoms restrict duty until medical review."
    ],
    dataUsed: ["Crew role", "On-duty flag", "Fit-to-fly status", "Sickness leave request", "Staff duty status"],
    handoff: [
      "SBAR plus aviation tags such as fit-to-fly-review, duty-restriction, or sickness-validation.",
      "Operational note for duty status handling and medical review outcome."
    ],
    governance:
      "Fit-to-fly clearance remains a clinician decision; the system only routes and documents the review need.",
    facility: careFacilities.qaHiaMedical
  },
  {
    code: "IST_OLD_AIRPORT_MEDICAL_COMMISSION",
    destination: "IST Health Medical - Old Airport medical commission",
    severityBand: "Occupational / commission",
    trigger: "Occupational or commission visit",
    selectedWhen: [
      "Occupational or medical commission visit flag is selected.",
      "No emergency route has already taken priority.",
      "Case is administrative/occupational in nature but still passes through clinical safety checks first."
    ],
    dataUsed: ["Occupational visit flag", "Staff identity", "Clinical safety floor", "Aviation context"],
    handoff: [
      "Reason for commission visit, clinical screen result, staff identity snapshot, and any restrictions.",
      "Document whether the visit is occupational, clearance-related, or follow-up."
    ],
    governance:
      "Occupational routing should be aligned with IST Health medical commission workflows and HR documentation policy.",
    facility: careFacilities.qaOldAirportMedical
  },
  {
    code: "PHCC_URGENT_CARE_OR_TELECONSULT",
    destination: "PHCC Urgent Care or IST Health teleconsult",
    severityBand: "Routine",
    trigger: "Routine staff pathway",
    selectedWhen: [
      "Routine severity after emergency and urgent questions are negative.",
      "Low-acuity staff case needs primary-care, clinic, or teleconsult follow-up.",
      "Protocol advice maps the case to routine review."
    ],
    dataUsed: ["Routine protocol result", "Staff/dependent context", "Insurance notes", "Appointment availability"],
    handoff: [
      "Routine SBAR, care advice, callback precautions, and booking notes.",
      "Future scheduling connector can turn this route into a clinic or teleconsult appointment."
    ],
    governance:
      "The final destination should be configurable by coverage, staff location, clinic hours, and approved appointment rules.",
    facility: careFacilities.phccUrgentCare
  },
  {
    code: "OUTSTATION_TELECONSULT_ESCALATION",
    destination: "IST Health medical teleconsult escalation",
    severityBand: "Outstation urgent coordination",
    trigger: "Outstation clinical coordination",
    selectedWhen: [
      "Staff member is outstation and the case is not already emergency.",
      "Remote clinical review, station coordination, or duty-status handling is required.",
      "Station code is captured when available."
    ],
    dataUsed: ["Outstation flag", "Station code", "Crew role", "Duty status", "Sickness request"],
    handoff: [
      "Station-aware SBAR, local contact details, travel/duty context, and escalation reason.",
      "Document whether the case needs teleconsult, local care referral, or flight/duty restriction."
    ],
    governance:
      "Outstation rules need airline operations alignment, local-care network mapping, and after-hours escalation coverage.",
    facility: careFacilities.qaTeleconsult
  },
  {
    code: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
    destination: "Self-care with callback precautions",
    severityBand: "Self-care",
    trigger: "No red flag or urgent trigger",
    selectedWhen: [
      "Emergency and urgent checklist items are negative.",
      "No aviation duty restriction, outstation escalation, sickness validation, or protocol-specific disposition applies.",
      "Nurse agrees that self-care advice and callback precautions are appropriate."
    ],
    dataUsed: ["Negative checklist answers", "Care advice handout", "Nurse review", "Callback details"],
    handoff: [
      "Self-care instructions, red-flag return precautions, and callback plan.",
      "Document that higher-acuity questions were negative."
    ],
    governance:
      "Self-care content must come from approved clinical care advice and should never bypass nurse review.",
    facility: careFacilities.selfCare
  }
];

const integrationRows = [
  ["Provider-neutral Call Center", "Normalize incoming calls, callbacks, call state, and recording metadata while preserving IST queue locks and STCC clinical authority.", "Signed event and command contracts, dry-run adapter, session/event persistence schema, cockpit connection, and governance tests are built; production provider adapter is pending."],
  ["Oracle Fusion HCM", "Validate staff identity, active worker status, assignments, contacts, dependents, absences, and documents.", "Mock adapter exists; target connector documented below."],
  ["Insurance", "Return provider, eligibility, last check, and booking notes.", "Mock eligibility cache exists; connect payer or benefits verification after insurer specs."],
  ["EMR / Oracle Health", "Move SBAR/SOAP into patient record.", "Clipboard handoff now; SMART on FHIR or approved Oracle Health API later."],
  ["MedGemma / LLM Copilot", "Explain deterministic routing, draft SBAR, flag missing approved protocol questions or context, summarize CCP context, and support bilingual wording.", "Strategy documented; model endpoint and adapter pending cloud implementation."],
  ["Twilio WhatsApp / SMS", "Send nurse-approved CCP messages and receive employee replies with text or media attachments.", "Adapter and webhook are built; dry-run is default until live secrets and signed webhook URL are approved."],
  ["Microsoft 365 Graph", "Send nurse-approved non-urgent CCP email through an approved mailbox.", "Adapter is built; live use needs Mail.Send app consent and mailbox-scoped access policy."],
  ["Scheduling", "Book clinic, teleconsult, commission, or urgent review slots.", "Future connector tied to disposition code."],
  ["Transcription", "Convert call audio into nurse-reviewed text.", "Workspace already accepts transcript fields."],
  ["Analytics", "Track call volume, categories, escalations, nurse response, recontact, and QA sampling.", "Dashboard scaffold exists for safety officer review."]
];

const oracleHcmApiRows: ApiCatalogRow[] = [
  {
    area: "Active staff lookup",
    api: "GET /hcmRestApi/resources/11.13.18.05/publicWorkers\nGET /hcmRestApi/resources/11.13.18.05/publicWorkers/{PersonId}",
    use: "First-choice low-scope lookup for active workers and public worker profile data.",
    status: "Read-only target"
  },
  {
    area: "Full staff profile",
    api: "GET /hcmRestApi/resources/11.13.18.05/workers\nGET /hcmRestApi/resources/11.13.18.05/workers/{workersUniqID}",
    use: "Validate staff ID, PersonId/PersonNumber, worker type, and deeper person fields when publicWorkers is not enough.",
    status: "Requires HCM roles"
  },
  {
    area: "Duty and department",
    api: "GET /workers/{workersUniqID}/child/workRelationships\nGET /workers/{workersUniqID}/child/workRelationships/{PeriodOfServiceId}/child/assignments\nGET /publicWorkers/{PersonId}/child/assignments",
    use: "Map legal employer, assignment, department, job title, manager, location, and active duty context.",
    status: "Read-only target"
  },
  {
    area: "Dependents and contacts",
    api: "GET /hcmRestApi/resources/11.13.18.05/hcmContacts\nGET /hcmContacts/{hcmContactsUniqID}/child/contactRelationships",
    use: "Map spouse, child, parent, and other contact relationships to the triage dependent picker.",
    status: "Governed PHI"
  },
  {
    area: "Phone and email",
    api: "GET /workers/{workersUniqID}/child/phones\nGET /workers/{workersUniqID}/child/emails\nGET /hcmContacts/{hcmContactsUniqID}/child/phones\nGET /hcmContacts/{hcmContactsUniqID}/child/emails",
    use: "Confirm callback details for staff and dependents when policy allows the triage team to view them.",
    status: "Minimum necessary"
  },
  {
    area: "Absence and sickness",
    api: "GET /hcmRestApi/resources/11.13.18.05/absences\nPOST /hcmRestApi/resources/11.13.18.05/absences/action/findByAdvancedSearchQuery\nPOST /hcmRestApi/resources/11.13.18.05/absences",
    use: "Read existing sickness records and optionally create an absence request only after HR policy approves writeback.",
    status: "Read first, write later"
  },
  {
    area: "Medical certificates",
    api: "GET /hcmRestApi/resources/11.13.18.05/documentRecords\nPOST /hcmRestApi/resources/11.13.18.05/documentRecords\nGET /documentRecords/{DocumentsOfRecordId}/child/attachments",
    use: "Attach or retrieve governed document records for sickness certificates or fit-to-duty evidence.",
    status: "Future writeback"
  },
  {
    area: "Change sync",
    api: "Oracle HCM Atom Feeds\nHCM Extracts\nPOST /hcmRestApi/objectSnapshots",
    use: "Use Atom feeds for key changes, HCM Extracts for bulk baseline loads, and object snapshots where an extract structure is configured.",
    status: "Integration job"
  }
];

const plannedApiRows: ApiCatalogRow[] = [
  {
    area: "Provider-neutral call center",
    api: "POST /api/v1/integrations/call-center/events\nGET /api/v1/call-center/status\nGET /api/v1/call-center/sessions\nPOST /api/v1/call-center/queue/:queueItemId/command",
    use: "Accept signed idempotent provider events, create HRMS-validated queue cases, and execute answer/callback/hold/resume/end through a provider adapter with lock rollback.",
    status: "Built with dry-run adapter"
  },
  {
    area: "IST triage API",
    api: "POST /api/v1/staff/validate\nPOST /api/v1/triage/start\nPOST /api/v1/triage/encounters/evaluate",
    use: "Stable internal contract used by the frontend and future enterprise adapters.",
    status: "Built"
  },
  {
    area: "HRMS named-user sync",
    api: "POST /api/v1/hrms/sync-users\nOracle Fusion HCM worker feed\nHRMS_SYNC_CRON_SECRET for scheduler mode",
    use: "Upsert named users, bind organization membership, map job roles, revoke sessions, and release active queue locks when HRMS marks a user inactive, on leave, or in rest period.",
    status: "Built with mock Oracle-style feed"
  },
  {
    area: "Tenant queue orchestration",
    api: "GET /api/v1/queue\nPOST /api/v1/queue\nPOST /api/v1/queue/:id/claim\nPOST /api/v1/queue/:id/escalate",
    use: "Validate HRMS identity and age at queue ingress, restrict visibility and claiming to the authenticated user's organization, and allow audited escalation handover to another target organization.",
    status: "Built"
  },
  {
    area: "CCP employee communication",
    api: "GET /api/v1/ccp/employee/{istStaffId}",
    use: "Return the one-employee Continuous Communication Pipeline summary: consent, channels, goals, nurse approval gate, communication timeline, controller rules, and audit posture.",
    status: "Built demo endpoint"
  },
  {
    area: "CCP outbound approval",
    api: "POST /api/v1/ccp/messages/draft\nPOST /api/v1/ccp/messages/{draftId}/approve-send\nGET /api/v1/ccp/messages/drafts",
    use: "Create an employee-facing WhatsApp, SMS, or email draft; hold it pending Remote Triage Nurse approval; then dispatch through the guarded adapter in dry-run or live mode.",
    status: "Built with dry-run safety"
  },
  {
    area: "CCP WhatsApp / SMS",
    api: "POST /api/v1/ccp/webhooks/twilio\nGET /api/v1/ccp/webhooks/inbound-records\nTWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM, TWILIO_SMS_FROM",
    use: "Use Twilio REST for outbound WhatsApp/SMS and Twilio webhook verification for inbound replies with text and media attachments.",
    status: "Adapter built"
  },
  {
    area: "CCP email",
    api: "Microsoft Graph sendMail\nMS_GRAPH_TENANT_ID, MS_GRAPH_CLIENT_ID, MS_GRAPH_CLIENT_SECRET, EMAIL_FROM",
    use: "Send nurse-approved non-urgent employee follow-up by Microsoft 365 Graph when Mail.Send, admin consent, mailbox scoping, and live mode are approved.",
    status: "Adapter built"
  },
  {
    area: "CCP transport posture",
    api: "GET /api/v1/ccp/communication/status\nCCP_TRANSPORT_MODE=dry-run|live\nCCP_TEST_REDIRECT_TO",
    use: "Expose whether WhatsApp/SMS and email are dry-run or live, which provider is configured, and which safety gates protect outbound and inbound communication.",
    status: "Built"
  },
  {
    area: "Protocol API",
    api: "GET /api/v1/protocols/search\nGET /api/v1/protocols/{protocolId}\nGET /api/v1/protocols/{protocolId}/care-advice",
    use: "Active Phase 1 clinical content lookup, acuity checklist rendering, and care advice selection.",
    status: "Built with sample content"
  },
  {
    area: "Clinical content import",
    api: "Cloud Run Job: pnpm content:import\nCloud SQL PostgreSQL protocol tables\nSecured GCS package staging",
    use: "Load licensed STCC release packages into versioned protocol tables in GCP Qatar.",
    status: "Importer scaffold"
  },
  {
    area: "LLM copilot evaluation",
    api: "Future: POST /api/v1/ai/copilot/evaluate\nFuture: POST /api/v1/ai/copilot/draft\nLLM_PROVIDER=medgemma|dry-run\nLLM_ENDPOINT_URL",
    use: "Run prompt/eval checks and return advisory summaries, approved-protocol context prompts, and SBAR drafts without changing the deterministic disposition.",
    status: "Planned cloud adapter"
  },
  {
    area: "GCP Doha model serving",
    api: "Private GKE service or approved Vertex AI custom endpoint in me-central1\nvLLM/llama.cpp serving\nVPC Service Controls, IAM, KMS, Audit Logs",
    use: "Host MedGemma or another approved clinical LLM privately for governed copilot assistance after security, privacy, clinical, and cost approvals.",
    status: "Cloud implementation task"
  },
  {
    area: "Oracle Fusion HCM",
    api: "publicWorkers, workers, workRelationships, assignments, hcmContacts, absences, documentRecords, Atom feeds",
    use: "Replace the mock HRMS adapter with live staff, dependent, duty, absence, and document context.",
    status: "Target connector"
  },
  {
    area: "Insurance",
    api: "Payer eligibility REST or approved benefits interface",
    use: "Verify eligibility, coverage notes, and payer routing without blocking clinical safety advice.",
    status: "Awaiting payer specs"
  },
  {
    area: "EMR / Oracle Health",
    api: "SMART on FHIR or approved Oracle Health/Cerner API",
    use: "Persist final SBAR/SOAP, encounter summary, disposition, and clinician author details.",
    status: "Future connector"
  },
  {
    area: "Scheduling",
    api: "Clinic scheduling API or appointment-booking integration",
    use: "Book IST clinic, teleconsult, commission, or urgent review slots based on final disposition.",
    status: "Future connector"
  },
  {
    area: "Transcription and analytics",
    api: "Speech-to-text API, audit export, de-identified BigQuery pipeline",
    use: "Convert call audio to reviewed text and support operational QA dashboards.",
    status: "Future connector"
  }
];

const governanceItems = [
  {
    title: "Human-in-the-loop approval",
    icon: Users,
    body:
      "The system is decision support. Nurses and physicians validate the final disposition, and the UI keeps the operating rule visible."
  },
  {
    title: "AI downgrade blocking",
    icon: AlertTriangle,
    body:
      "If deterministic rules classify an encounter as Emergency, a RAG shadow suggestion below that floor is blocked and logged as a safety event."
  },
  {
    title: "LLM model governance",
    icon: BrainCircuit,
    body:
      "MedGemma or any future LLM must pass synthetic and clinically reviewed evaluations before UAT. Model outputs remain preliminary, nurse-verified, auditable, and blocked from changing red-floor rules."
  },
  {
    title: "Protocol governance",
    icon: CheckCircle2,
    body:
      "Production use needs licensed clinical content, lead physician and lead nurse review, local disposition approval, and a defined update cadence."
  },
  {
    title: "Privacy and retention",
    icon: LockKeyhole,
    body:
      "The scaffold returns PHI in memory only. Prisma persistence should be enabled only after retention, security, and EMR-write policies are approved."
  },
  {
    title: "Quality analytics",
    icon: TimerReset,
    body:
      "The RFI targets call volumes, categories, nurse response time, outcome trends, recontact rates, randomized review, incident reporting, and exportable dashboards."
  },
  {
    title: "Multilingual operations",
    icon: Languages,
    body:
      "English and Arabic are represented in the current UI and SBAR labels; Hindi, Tagalog, and governed translation are planned capabilities."
  }
];

const dataLawItems = [
  {
    title: "GDPR privacy-by-design mapping",
    body:
      "The system maps GDPR-style principles into product controls: purpose limitation through documented use cases, data minimization through role-scoped views, privacy by default through masked fields, integrity and confidentiality through encryption policy, and accountability through audit events."
  },
  {
    title: "Qatar personal-data law mapping",
    body:
      "The design treats Qatar personal-data requirements as operational controls: clear processing purpose, authorized access, protection of sensitive health and identity fields, data residency review, approved cross-border transfer decisions, retention rules, and auditable disclosure or reveal."
  },
  {
    title: "Healthcare and clinical safety overlay",
    body:
      "Because the platform handles tele-triage and health context, privacy controls are paired with clinical governance: clinicians approve dispositions, emergency safety rules cannot be downgraded by AI, and production policies must be reviewed by legal, privacy, security, and medical leadership."
  },
  {
    title: "No automatic compliance claim",
    body:
      "The help text explains how controls are designed to support GDPR and Qatar data-law review. It does not claim automatic legal certification; final deployment still needs legal sign-off, DPIA/privacy assessment, security review, and approved operating policies."
  }
];

const securityAdminHelpTopics: SecurityAdminHelpTopic[] = [
  {
    id: "login-user-simulation",
    title: "Login and Named User Simulation",
    eyebrow: "Authentication entry",
    icon: LockKeyhole,
    summary:
      "The login page is now the single entry point for the system. It uses IST Health branding, language selection, password visibility, SSO entry, and a simulator that opens the system as a selected named user.",
    built: [
      "Apple-style minimal login using the system font stack, light mode by default, and optional dark mode.",
      "Organization selector is set to IST Health, with English, Arabic, Hindi, and Tagalog language choices.",
      "Simulate user dropdown is grouped by business category: A - Administration, S - Security and Privacy, G - Governance and Quality, B - Business and Clinical Operations, I - Integration, R - Reporting and Analytics, and U - User Support.",
      "Each simulated user has one assigned role, so changing the selected user automatically changes the login email, role, permission set, and landing area.",
      "The simulator uses the normal login API, sets a secure session cookie, and redirects by permission to admin or workspace."
    ],
    controls: [
      "Authentication errors stay generic and do not reveal whether a username exists.",
      "The backend derives the active role from the named user and rejects a role override when that role is not assigned to the account.",
      "Session restore uses the same permission logic as login, so refresh keeps the correct landing area."
    ],
    production: [
      "ADMIN_PASSWORD is now environment-driven; MOCK_MODE=false rejects startup when the password is missing or still uses the mock local fallback.",
      "Replace the local password gate with Argon2id hashes and an enterprise identity store.",
      "Add password reset, MFA/OTP screens, CAPTCHA after repeated failures, refresh-token rotation, and forced logout controls.",
      "Connect planned-maintenance, password-expiry, and session-timeout notices to policy configuration."
    ]
  },
  {
    id: "rbac-responsibility",
    title: "Roles, Responsibilities, and Access",
    eyebrow: "RBAC plus responsibility model",
    icon: ShieldCheck,
    summary:
      "The security layer separates role permissions, clinical responsibilities, and active-role session behavior so menus and APIs can be controlled consistently.",
    built: [
      "Seeded roles now cover Platform Super Administrator, Organization Administrator, System Administrator, Security Administrator, Privacy Officer / DPO, Compliance Auditor, Clinical Governance Lead, Triage Service Manager, Call Intake Coordinator, Remote Triage Nurse, Senior Triage Nurse, Pediatric Triage Nurse, Teleconsult Physician, Occupational Health Clinician, Protocol Content Manager, Quality Reviewer, Integration Administrator, Reporting Analyst, and Helpdesk Support.",
      "Named User Mode means every action is tied to a real authenticated user, active role, session, queue assignment, and audit identity rather than a generic actor selector.",
      "The active role is derived from the named user and controls permissions for the current session instead of granting every role at once.",
      "Every seeded role is intended to have a distinct effective access profile across permissions, responsibilities, data scopes, clinical scopes, and integration scopes.",
      "The old global Actor selector was removed so the authenticated role is the single source of truth for menus, API access, data scope, and audit.",
      "A central authorization helper protects administration APIs independently of frontend menu visibility.",
      "Admin navigation and admin tabs appear only when the active session has the matching administration, security, privacy, or audit permissions."
    ],
    controls: [
      "Platform Super Administrator has all current permissions for local simulation and demonstration.",
      "Clinical roles such as nurse, pediatric nurse, physician, and occupational-health clinician land in the triage workspace with role-specific clinical scopes.",
      "Governance, quality, privacy, integration, and administration roles see only the Control Center modules allowed by their active permissions.",
      "Queue locking remains named-user based: one nurse claims one call, lock ownership is audited, and HRMS status changes can release locks."
    ],
    production: [
      "Add editable role templates, access profiles, effective dates, explicit deny, queue/facility/clinical scopes, and approval workflows.",
      "Add segregation-of-duties checks such as preventing a user from approving their own elevated access.",
      "Extend authorization guards around every clinical, queue, note, integration, export, and content-management endpoint."
    ]
  },
  {
    id: "control-center-bifurcation",
    title: "Control Center Module Bifurcation",
    eyebrow: "Separate workspaces",
    icon: Workflow,
    summary:
      "The Control Center is split into separate modules so a role sees its own workspace instead of one overloaded administration screen.",
    built: [
      "Users: named-user lifecycle, HRMS directory state, account status, masked identifiers, and effective access review.",
      "Access: roles, permissions, responsibilities, data scopes, clinical scopes, integration scopes, and segregation boundaries.",
      "Security: SSO provider metadata, MFA posture, session/security policy, and cryptographic policy references.",
      "Privacy: privacy assessments, purpose-based reveal requests, masking policy, and data-law evidence.",
      "Audit: immutable event review for login, queue, reveal, override, integration, and governance activity.",
      "Governance: clinical safety policies, red-floor rules, protocol release readiness, exception review, and quality evidence.",
      "Protocol Library: algorithms, keywords, questions, care advice, localized routing, and content release status.",
      "Integration: Oracle HRMS, EMR/FHIR, SSO, roster, insurance, and downstream connector status.",
      "Reports: de-identified operational, safety, adoption, quality, and integration reports.",
      "Support: helpdesk tickets, user issues, access support, device guidance, and non-clinical service requests."
    ],
    controls: [
      "Each module has its own backend route and permission guard.",
      "A role can open the Control Center only when it is a real control-center role, not merely because it has reveal permission for clinical work.",
      "The Privacy Officer gets a dedicated reveal workspace, and the Integration Administrator gets a dedicated connector-status workspace."
    ],
    production: [
      "Add module-specific edit/approval workflows after the read-model is validated by stakeholders.",
      "Persist module configuration, approval history, and connector run history in production tables.",
      "Add per-module feature flags for demo, UAT, and production environments."
    ]
  },
  {
    id: "admin-portal",
    title: "Control Center",
    eyebrow: "Same application, protected section",
    icon: Users,
    summary:
      "The Control Center is integrated into the existing app rather than being a parallel system. It gives authorized users a governed place to review only the modules allowed for their active role.",
    built: [
      "Overview module catalog filtered by active role permissions.",
      "Users panel with masked identifiers and controlled reveal actions for administrators.",
      "Access panel for roles, responsibilities, and permissions.",
      "Security, Privacy, Audit, Governance, Protocol Library, Integration, Reports, and Support panels are separated inside the same protected section."
    ],
    controls: [
      "Admin APIs require server-side permission checks.",
      "The portal respects the active named user's assigned role, so a nurse does not see the admin icon.",
      "User identifiers are masked by the backend before reaching the browser."
    ],
    production: [
      "Add create/edit/suspend/unlock/reset workflows, bulk CSV upload, effective access preview, and full assignment history.",
      "Add organization, facility, department, clinical specialty, queue, approval, temporary access, and break-glass administration pages.",
      "Connect dashboard metrics to persistent production stores rather than demo seed data."
    ]
  },
  {
    id: "masking-reveal",
    title: "Masking and Controlled Reveal",
    eyebrow: "Privacy by default",
    icon: UserRoundCheck,
    summary:
      "Personal fields are masked by default, and authorized reveal is handled as a deliberate backend action with a purpose and audit trail.",
    built: [
      "Email, mobile, employee ID, and licence values are returned masked in admin/user views.",
      "Reveal endpoint validates the session and reveal permission before returning a value.",
      "Reveal requests require a business purpose and return an auto-remask timer for the UI message.",
      "Reveal actions are written to the demo audit event stream."
    ],
    controls: [
      "Administrators do not automatically receive unrestricted plaintext personal data.",
      "A user without reveal permission receives a denial from the backend.",
      "Audit events do not store decrypted values."
    ],
    production: [
      "Add MFA step-up, supervisor or dual approval, per-field reveal policy, watermarks, disable-copy controls, and remask-on-blur behavior.",
      "Move reveal approval, reveal event, and privacy request flows into persistent database tables.",
      "Enforce clinical relationship, queue assignment, and purpose-of-access checks for patient-level data."
    ]
  },
  {
    id: "sso-provider",
    title: "SSO and Identity Providers",
    eyebrow: "Enterprise identity",
    icon: PlugZap,
    summary:
      "The system now has an SSO administration model and UI surface for future Microsoft Entra ID, OIDC, OAuth2, and SAML configuration.",
    built: [
      "Authentication provider seed records model protocol, issuer URL, tenant ID, redirect URI, allowed domains, and attribute mappings.",
      "Group-to-role mappings are represented for SSO-driven authorization.",
      "SSO providers appear in the Administration portal with enabled state and certificate expiry metadata.",
      "A backend SSO test endpoint validates provider metadata in the demo service."
    ],
    controls: [
      "Secrets are represented as secret-manager references rather than displayed plaintext.",
      "Local login can be enabled or disabled per provider model.",
      "JIT provisioning is represented in the provider configuration."
    ],
    production: [
      "Implement real OIDC/SAML callbacks, signed metadata, logout handling, certificate monitoring, and secret rotation.",
      "Store client secrets in GCP Secret Manager or an approved vault.",
      "Add group-to-responsibility and group-to-access-profile mappings with approval review."
    ]
  },
  {
    id: "encryption-policy",
    title: "Encryption, KMS, and Data Residency",
    eyebrow: "Sensitive-data controls",
    icon: Database,
    summary:
      "The admin extension defines configurable encryption policies and KMS references without sending keys or raw cryptographic material to the frontend.",
    built: [
      "Encryption policy records include data classification, covered entities, covered fields, algorithm, KMS provider, key alias, rotation days, masking policy, reveal policy, and data residency.",
      "AES-256-GCM is the approved field-encryption baseline in the policy model.",
      "IST Health Cloud KMS aliases are shown as policy references, not as keys.",
      "Privacy/encryption policies are visible through the Administration portal."
    ],
    controls: [
      "Raw master keys and plaintext data-encryption keys are not stored in application records.",
      "Encryption policy administration is separated from clinical decision logic.",
      "Data residency is explicit in the policy surface."
    ],
    production: [
      "Implement envelope encryption with Cloud KMS or the approved HSM/vault.",
      "Add encrypted columns, key references, nonce/tag metadata, and controlled migration for existing sensitive fields.",
      "Add key rotation, compromise response, usage audit, and dual-approval workflows."
    ]
  },
  {
    id: "audit-monitoring",
    title: "Audit and Monitoring",
    eyebrow: "Traceability",
    icon: TimerReset,
    summary:
      "The security/admin work extends the system with login, failed login, reveal, SSO, and administration audit visibility.",
    built: [
      "Audit events include timestamp, user, active role, organization, facility, department, action, module, resource, IP/device, success, and risk.",
      "Failed login attempts are tracked and lockout behavior is represented in the authentication service.",
      "Administration dashboard exposes security, privacy, and cryptographic health counters.",
      "Audit panel lists recent security and privacy events."
    ],
    controls: [
      "Decrypted personal values are not written into audit records.",
      "Authentication and reveal events are generated on the backend.",
      "Audit visibility is restricted to sessions with audit permissions."
    ],
    production: [
      "Move audit to an immutable append-only store with retention policy and SIEM export.",
      "Add break-glass review, identifiable export tracking, access-change history, and incident workflow.",
      "Add centralized redaction for logs, traces, API errors, and support diagnostics."
    ]
  }
];

const roleAccessRows: RoleAccessRow[] = [
  {
    category: "A - Administration",
    prefix: "A",
    role: "Platform Super Administrator",
    access: "Demo-only full-system access across triage, administration, security, privacy, audit, cryptography, integrations, and reports.",
    permissions: ["all current permissions"],
    responsibilities: ["all current responsibilities"],
    scopes: ["all users", "all encounters", "all integration scopes"]
  },
  {
    category: "A - Administration",
    prefix: "A",
    role: "Organization Administrator",
    access: "Tenant, facility, department, queue, user, and access configuration for IST Health.",
    permissions: ["admin.users.manage", "admin.roles.manage", "operations.dashboard.view", "reports.view", "audit.events.view"],
    responsibilities: ["administer_organization", "manage_users", "view_operational_reports"],
    scopes: ["organization:IST Health", "facility:*", "hrms.read"]
  },
  {
    category: "A - Administration",
    prefix: "A",
    role: "System Administrator",
    access: "Application and user administration without automatic clinical-data reveal or clinical workflow rights.",
    permissions: ["admin.users.manage", "admin.roles.manage", "support.tickets.manage", "audit.events.view"],
    responsibilities: ["manage_users", "provide_helpdesk_support"],
    scopes: ["organization:IST Health", "support tickets", "masked users"]
  },
  {
    category: "S - Security and Privacy",
    prefix: "S",
    role: "Security Administrator",
    access: "Authentication, SSO, security policy, session, KMS policy, and security-event administration.",
    permissions: ["security.sso.manage", "crypto.policy.manage", "audit.events.view"],
    responsibilities: ["manage_sso", "manage_encryption_policy"],
    scopes: ["organization:IST Health", "sso", "kms"]
  },
  {
    category: "S - Security and Privacy",
    prefix: "S",
    role: "Privacy Officer / DPO",
    access: "Privacy assessment, purpose-based reveal governance, data-law evidence, and disclosure controls.",
    permissions: ["privacy.assessment.manage", "privacy.reveal.request", "crypto.policy.manage", "audit.events.view", "reports.view"],
    responsibilities: ["manage_privacy_assessment", "approve_personal_data_reveal", "manage_encryption_policy"],
    scopes: ["privacy register", "masked users", "reveal requests", "kms", "audit"]
  },
  {
    category: "G - Governance and Quality",
    prefix: "G",
    role: "Compliance Auditor",
    access: "Audit evidence, privacy events, access activity, and approved de-identified management reports.",
    permissions: ["audit.events.view", "reports.view", "reports.export"],
    responsibilities: ["quality_review_completed_case", "view_operational_reports", "export_deidentified_reports"],
    scopes: ["audit events", "deidentified reports", "completed encounters"]
  },
  {
    category: "G - Governance and Quality",
    prefix: "G",
    role: "Clinical Governance Lead",
    access: "Clinical protocol approval, safety rules, escalation policy, release governance, and quality review.",
    permissions: ["clinical.governance.approve", "protocol.library.manage", "triage.recommendation.view", "audit.events.view", "reports.view"],
    responsibilities: ["approve_clinical_governance", "maintain_protocol_library", "quality_review_completed_case"],
    scopes: ["protocol library", "governance register", "quality review", "adult/pediatric/aviation"]
  },
  {
    category: "G - Governance and Quality",
    prefix: "G",
    role: "Protocol Content Manager",
    access: "Approved triage algorithms, keyword indexes, care advice, and localized clinical library content.",
    permissions: ["protocol.library.manage", "reports.view", "audit.events.view"],
    responsibilities: ["maintain_protocol_library", "view_operational_reports"],
    scopes: ["protocol library", "care advice", "keyword index", "content management"]
  },
  {
    category: "G - Governance and Quality",
    prefix: "G",
    role: "Quality Reviewer",
    access: "Completed encounter review without changing signed clinical notes.",
    permissions: ["audit.events.view", "reports.view"],
    responsibilities: ["quality_review_completed_case", "view_operational_reports"],
    scopes: ["completed encounters", "quality review"]
  },
  {
    category: "B - Business and Clinical Operations",
    prefix: "B",
    role: "Triage Service Manager",
    access: "Queue health, staffing coverage, case allocation, operational KPIs, and escalation throughput.",
    permissions: ["triage.queue.manage", "operations.dashboard.view", "reports.view", "audit.events.view"],
    responsibilities: ["coordinate_triage_queue", "view_operational_reports"],
    scopes: ["assigned queues", "operational dashboards", "hrms.read", "audit"]
  },
  {
    category: "B - Business and Clinical Operations",
    prefix: "B",
    role: "Call Intake Coordinator",
    access: "Inbound call registration, identity context, non-clinical intake capture, and routing to clinical queues.",
    permissions: ["triage.workspace.view", "triage.call.intake"],
    responsibilities: ["register_triage_call"],
    scopes: ["intake queue", "identity verification", "hrms.read"]
  },
  {
    category: "B - Business and Clinical Operations",
    prefix: "B",
    role: "Remote Triage Nurse",
    access: "Assigned remote triage encounters with clinical protocol access and RAG shadow suggestion visibility.",
    permissions: ["triage.workspace.view", "triage.recommendation.view", "privacy.reveal.request"],
    responsibilities: ["conduct_nurse_triage", "view_rag_shadow_suggestion"],
    scopes: ["assigned queue", "adult", "aviation", "hrms.read", "insurance.read"]
  },
  {
    category: "B - Business and Clinical Operations",
    prefix: "B",
    role: "Senior Triage Nurse",
    access: "Complex triage, queue supervision, protocol adherence, and upward disposition override.",
    permissions: ["triage.workspace.view", "triage.call.intake", "triage.recommendation.view", "triage.disposition.override", "triage.queue.manage", "privacy.reveal.request"],
    responsibilities: ["conduct_nurse_triage", "view_rag_shadow_suggestion", "coordinate_triage_queue"],
    scopes: ["assigned queue", "supervised queue", "escalation", "hrms.read", "insurance.read"]
  },
  {
    category: "B - Business and Clinical Operations",
    prefix: "B",
    role: "Pediatric Triage Nurse",
    access: "Pediatric and dependent triage with guardian, age, and emergency routing rules.",
    permissions: ["triage.workspace.view", "triage.recommendation.view", "triage.pediatric.manage", "privacy.reveal.request"],
    responsibilities: ["conduct_nurse_triage", "perform_pediatric_triage", "view_rag_shadow_suggestion"],
    scopes: ["dependent encounters", "pediatric", "emergency", "hrms.read", "insurance.read"]
  },
  {
    category: "B - Business and Clinical Operations",
    prefix: "B",
    role: "Teleconsult Physician",
    access: "Escalated teleconsult review, physician-level disposition, and clinical override decisions.",
    permissions: ["triage.workspace.view", "triage.recommendation.view", "triage.teleconsult.manage", "triage.disposition.override", "privacy.reveal.request"],
    responsibilities: ["approve_physician_escalation", "view_rag_shadow_suggestion"],
    scopes: ["escalated encounters", "physician escalation", "emr.write", "insurance.read"]
  },
  {
    category: "B - Business and Clinical Operations",
    prefix: "B",
    role: "Occupational Health Clinician",
    access: "Fit-to-work, fit-to-fly, sickness, occupational visit, and medical commission pathways.",
    permissions: ["triage.workspace.view", "triage.recommendation.view", "triage.disposition.override", "privacy.reveal.request"],
    responsibilities: ["perform_occupational_health_review", "view_rag_shadow_suggestion"],
    scopes: ["occupational cases", "fit-to-fly", "sickness", "hrms.read", "emr.write"]
  },
  {
    category: "I - Integration",
    prefix: "I",
    role: "Integration Administrator",
    access: "HRMS, EMR, call-center, roster, insurance, SSO connector, and API integration configuration.",
    permissions: ["integration.hrms.manage", "integration.emr.manage", "integration.callcenter.manage", "security.sso.manage", "audit.events.view"],
    responsibilities: ["manage_enterprise_integrations", "manage_sso"],
    scopes: ["integration config", "connector logs", "hrms.manage", "emr.manage", "callcenter.manage", "sso", "insurance.manage"]
  },
  {
    category: "R - Reporting and Analytics",
    prefix: "R",
    role: "Reporting Analyst",
    access: "Approved de-identified operating, quality, safety, and adoption reports.",
    permissions: ["reports.view", "reports.export"],
    responsibilities: ["view_operational_reports", "export_deidentified_reports"],
    scopes: ["deidentified reports", "analytics"]
  },
  {
    category: "U - User Support",
    prefix: "U",
    role: "Helpdesk Support",
    access: "Access support, device guidance, training questions, and non-clinical user service requests.",
    permissions: ["support.tickets.manage"],
    responsibilities: ["provide_helpdesk_support"],
    scopes: ["support tickets", "masked users"]
  }
];

const securityAdminApiRows: ApiCatalogRow[] = [
  {
    area: "Login and session",
    api: "POST /api/v1/auth/login\nGET /api/v1/auth/session\nPOST /api/v1/auth/logout",
    use: "Create, restore, and revoke secure sessions. The login request can include a simulated active role for demo personas.",
    status: "Built"
  },
  {
    area: "SSO test",
    api: "POST /api/v1/auth/sso/test",
    use: "Validate the configured identity-provider metadata before live SSO callback wiring is enabled.",
    status: "Demo endpoint"
  },
  {
    area: "Control Center modules",
    api: "GET /api/v1/admin/control-modules",
    use: "Return the module catalog filtered to the active role: Users, Access, Security, Privacy, Audit, Governance, Protocol Library, Integration, Reports, and Support.",
    status: "Built"
  },
  {
    area: "Control Center dashboard",
    api: "GET /api/v1/admin/summary",
    use: "Return dashboard metrics for active users, failed logins, sessions, privacy requests, crypto warnings, and incidents when the role has audit visibility.",
    status: "Built with seed data"
  },
  {
    area: "Identity and access",
    api: "GET /api/v1/admin/users\nGET /api/v1/admin/roles\nGET /api/v1/admin/responsibilities\nGET /api/v1/admin/permissions",
    use: "Power the Users and Access sections of the Control Center.",
    status: "Built read APIs"
  },
  {
    area: "Security configuration",
    api: "GET /api/v1/admin/sso-providers\nGET /api/v1/admin/encryption-policies",
    use: "Expose identity-provider and encryption-policy configuration for authorized administrators.",
    status: "Built read APIs"
  },
  {
    area: "Privacy and audit",
    api: "GET /api/v1/admin/reveal-directory\nPOST /api/v1/admin/reveal\nGET /api/v1/admin/audit-events",
    use: "Power the Privacy Officer reveal workspace and show security/privacy event history.",
    status: "Built demo workflow"
  },
  {
    area: "Governance and protocol library",
    api: "GET /api/v1/admin/governance\nGET /api/v1/admin/protocol-library",
    use: "Expose clinical governance work items and protocol-library status for governance and content-management roles.",
    status: "Built read APIs"
  },
  {
    area: "Integration workbench",
    api: "GET /api/v1/admin/integrations",
    use: "Expose Oracle HRMS, EMR/FHIR, SSO, analytics, and connector-status records for Integration Administrator and security roles.",
    status: "Built read API"
  },
  {
    area: "Reports and support",
    api: "GET /api/v1/admin/reports\nGET /api/v1/admin/support",
    use: "Expose de-identified report catalog and helpdesk queue records for reporting, operations, and support roles.",
    status: "Built read APIs"
  }
];

export default function HelpCenter() {
  const [activeTab, setActiveTab] = useState<TabKey>("help");
  const [selectedAreaId, setSelectedAreaId] = useState(libraryAreas[0].id);

  const selectedArea = useMemo(
    () => libraryAreas.find((area) => area.id === selectedAreaId) ?? libraryAreas[0],
    [selectedAreaId]
  );

  useEffect(() => {
    function syncTabFromHash() {
      const target = window.location.hash.replace(/^#\/?/, "").split("?")[0].toLowerCase();
      if (tabs.some((tab) => tab.key === target)) {
        setActiveTab(target as TabKey);
      }
    }

    syncTabFromHash();
    window.addEventListener("hashchange", syncTabFromHash);
    return () => window.removeEventListener("hashchange", syncTabFromHash);
  }, []);

  function openLibraryTopic(areaId: string) {
    setSelectedAreaId(areaId);
    setActiveTab("library");
  }

  return (
    <div className="help-library-shell">
      <section className="help-library-hero">
        <div>
          <span className="tag-label">CONNECTED HELP CENTER</span>
          <h2>IST Help Center and Clinical Library</h2>
          <p>
            Help is the operating guide for people using the system. Library is the technical and
            clinical reference catalogue for the data model, APIs, routes, tests, integrations, and
            governance evidence behind the system.
          </p>
        </div>
        <div className="help-stat-grid">
          {operatingStats.map((stat) => (
            <div key={stat.label} className="help-stat">
              <strong>{stat.value}</strong>
              <span>{stat.label}</span>
              <small>{stat.detail}</small>
            </div>
          ))}
        </div>
      </section>

      <div className="help-tabbar" role="tablist" aria-label="Help library sections">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={active}
              className={`help-tab ${active ? "help-tab-active" : ""}`}
              onClick={() => setActiveTab(tab.key)}
            >
              <Icon className="h-5 w-5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {activeTab === "help" && (
        <HelpManualPanel
          onOpenLibraryTopic={openLibraryTopic}
          onOpenTab={setActiveTab}
        />
      )}
      {activeTab === "tests" && <TestEvidenceCenter />}
      {activeTab === "overview" && (
        <SystemPurposeTab
          systemCards={systemCards}
          dataConsumptionStrategyCards={dataConsumptionStrategyCards}
          teleTriageStages={teleTriageStages}
        />
      )}
      {activeTab === "workflow" && <WorkflowPanel />}
      {activeTab === "library" && (
        <LibraryPanel
          selectedArea={selectedArea}
          selectedAreaId={selectedAreaId}
          onSelectArea={setSelectedAreaId}
        />
      )}
      {activeTab === "qatar" && <QatarPanel />}
      {activeTab === "integration" && (
        <InteroperabilityTab
          integrationRows={integrationRows}
          oracleHcmApiRows={oracleHcmApiRows}
          plannedApiRows={plannedApiRows}
          llmCloudMigrationTasks={llmCloudMigrationTasks}
        />
      )}
      {activeTab === "governance" && <GovernancePanel />}
      {activeTab === "security" && <SecurityAdministrationPanel />}
    </div>
  );
}

function HelpManualPanel({
  onOpenLibraryTopic,
  onOpenTab
}: {
  onOpenLibraryTopic: (areaId: string) => void;
  onOpenTab: (tab: TabKey) => void;
}) {
  return (
    <section className="help-stack">
      <article className="help-card help-card-wide">
        <div className="help-card-heading">
          <span className="help-icon">
            <HelpCircle className="h-5 w-5" />
          </span>
          <div>
            <span className="tag-label">HELP SECTION</span>
            <h3 className="help-title">How to use and validate the system</h3>
            <p>
              This is the human operating guide. It explains what each role should do, what has
              been validated in code, what remains a production dependency, and where to go next
              inside the system.
            </p>
          </div>
        </div>

        <div className="help-chip-row">
          <button type="button" className="secondary-button" onClick={() => onOpenTab("workflow")}>
            <Workflow className="h-4 w-4" />
            Call flow
          </button>
          <button type="button" className="secondary-button" onClick={() => onOpenLibraryTopic("data-ingestion")}>
            <Database className="h-4 w-4" />
            Data ingestion library
          </button>
          <button type="button" className="secondary-button" onClick={() => onOpenLibraryTopic("nurse-workspace-modes")}>
            <Kanban className="h-4 w-4" />
            Workspace modes
          </button>
          <button type="button" className="secondary-button" onClick={() => onOpenLibraryTopic("provider-neutral-call-center")}>
            <PhoneCall className="h-4 w-4" />
            Call center gateway
          </button>
          <button type="button" className="secondary-button" onClick={() => onOpenLibraryTopic("named-user-hrms-tenant-queue")}>
            <Users className="h-4 w-4" />
            HRMS tenant controls
          </button>
          <button type="button" className="secondary-button" onClick={() => onOpenLibraryTopic("llm-copilot-cloud")}>
            <BrainCircuit className="h-4 w-4" />
            LLM strategy
          </button>
          <button type="button" className="secondary-button" onClick={() => onOpenLibraryTopic("stcc-rag-shadow")}>
            <SearchCheck className="h-4 w-4" />
            STCC/RAG shadow
          </button>
          <button type="button" className="secondary-button" onClick={() => onOpenLibraryTopic("api-contracts")}>
            <PlugZap className="h-4 w-4" />
            API contracts
          </button>
          <button type="button" className="secondary-button" onClick={() => onOpenTab("qatar")}>
            <MapPin className="h-4 w-4" />
            Qatar routing
          </button>
          <button type="button" className="secondary-button" onClick={() => onOpenTab("security")}>
            <LockKeyhole className="h-4 w-4" />
            Security admin
          </button>
        </div>
      </article>

      <div className="help-grid">
        {helpGuides.map((guide) => {
          const GuideIcon = guide.icon;
          return (
            <article key={guide.title} className="help-card">
              <div className="help-card-heading">
                <span className="help-icon">
                  <GuideIcon className="h-5 w-5" />
                </span>
                <div>
                  <span className="tag-label">{guide.eyebrow}</span>
                  <h3 className="help-title">{guide.title}</h3>
                  <p>{guide.goal}</p>
                </div>
              </div>
              <div className="help-detail-expanded">
                <h4>Audience</h4>
                <p>{guide.audience}</p>
              </div>
              <WhatWhyHowPanel framework={guide.framework} />
              <RouteDetailList title="Detailed checklist" items={guide.steps} />
              <div className="help-route-governance">
                <h4>Safety note</h4>
                <p>{guide.safety}</p>
              </div>
            </article>
          );
        })}
      </div>

      <article className="help-card help-card-wide">
        <div className="help-card-heading">
          <span className="help-icon">
            <CheckCircle2 className="h-5 w-5" />
          </span>
          <div>
            <span className="tag-label">CODE AND HELP VALIDATION</span>
            <h3 className="help-title">What is correct, partial, and pending</h3>
            <p>
              This review is based on the current code paths, tests, schema, seed script, and Help
              text. It separates validated MVP behavior from production dependencies.
            </p>
          </div>
        </div>

        <div className="help-integration-table">
          {validationReviewItems.map((item) => (
            <div key={item.area} className="help-integration-row">
              <strong>{item.area}</strong>
              <span>{item.evidence}</span>
              <small>{item.nextStep}</small>
              <em
                className={
                  item.verdict === "Correct"
                    ? "status-pill border border-emerald-200 bg-emerald-50 text-emerald-700"
                    : item.verdict === "Partially built"
                      ? "status-pill border border-amber-200 bg-amber-50 text-amber-700"
                      : "status-pill border border-rose-200 bg-rose-50 text-rose-600"
                }
              >
                {item.verdict}
              </em>
            </div>
          ))}
        </div>
      </article>

      <article className="help-card help-card-wide">
        <div className="help-card-heading">
          <span className="help-icon">
            <BookOpen className="h-5 w-5" />
          </span>
          <div>
            <span className="tag-label">HELP VS LIBRARY</span>
            <h3 className="help-title">Separated structure</h3>
            <p>
              Use Help when the question is, “What should I do?” Use Library when the question is,
              “What system object, API, table, rule, adapter, or evidence supports this?”
            </p>
          </div>
        </div>
        <div className="help-compare-grid">
          <MiniDefinition
            label="Help"
            body="Role-based instructions, operating flow, validation status, safe-use warnings, and next actions for nurses, governance, security, and integration teams."
          />
          <MiniDefinition
            label="Library"
            body="Reference catalogue for clinical content, APIs, data ingestion, Prisma schema, tests, Qatar routing, CCP, security administration, and integrations."
          />
          <MiniDefinition
            label="Governance"
            body="Cross-cutting production controls for clinical approval, privacy law alignment, audit evidence, and release readiness."
          />
          <MiniDefinition
            label="Qatar Model"
            body="Localized route matrix and aviation-specific operational rules for Sidra, HMC, PHCC, IST medical routes, outstation review, and self-care."
          />
        </div>
        <WhatWhyHowPanel
          framework={{
            what:
              "Every Help and Library topic should first define the fact, object, workflow, risk, or problem being discussed.",
            why:
              "The framework prevents assumptions: users can see the purpose and root cause before jumping into controls, APIs, or process steps.",
            how: [
              "Use What to confirm the topic and current state.",
              "Use Why to understand the motivation, safety reason, or business problem.",
              "Use How to follow the concrete actions, implementation path, or validation steps."
            ]
          }}
        />
      </article>
    </section>
  );
}

function WorkflowPanel() {
  return (
    <section className="help-flow-grid">
      {workflowSteps.map((step, index) => {
        const Icon = step.icon;
        return (
          <article key={step.title} className="help-step">
            <div className="help-step-index">{index + 1}</div>
            <div className="help-card-heading">
              <span className="help-icon">
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <h3 className="help-title">{step.title}</h3>
                <p>{step.body}</p>
              </div>
            </div>
          </article>
        );
      })}
      <article className="help-card help-card-wide">
        <div className="help-card-heading">
          <span className="help-icon">
            <Workflow className="h-5 w-5" />
          </span>
          <div>
            <h3 className="help-title">Tele-triage decision contract</h3>
            <p>
              The system gives a structured recommendation, but the clinical endpoint remains a
              human decision. This keeps the workflow suitable for call-center and nurse triage
              while preserving safety, governance, and accountability.
            </p>
          </div>
        </div>
        <div className="help-compare-grid">
          {teleTriageDecisionContract.map((item) => (
            <MiniDefinition key={item.label} label={item.label} body={item.body} />
          ))}
        </div>
      </article>
      <article className="help-card help-card-wide">
        <div className="help-card-heading">
          <span className="help-icon">
            <AlertTriangle className="h-5 w-5" />
          </span>
          <div>
            <h3 className="help-title">What the system never does alone</h3>
            <p>
              It does not approve sickness leave, clear staff for duty, diagnose a patient, write
              directly into the EMR, or replace clinical judgment. It prepares evidence and
              documentation for a governed human decision.
            </p>
          </div>
        </div>
      </article>
    </section>
  );
}

function LibraryPanel({
  selectedArea,
  selectedAreaId,
  onSelectArea
}: {
  selectedArea: LibraryArea;
  selectedAreaId: string;
  onSelectArea: (areaId: string) => void;
}) {
  const Icon = selectedArea.icon;
  const framework = getLibraryWhatWhyHow(selectedArea);

  return (
    <section className="help-library-grid">
      <div className="help-topic-list" aria-label="Knowledge library topics">
        {libraryAreas.map((area) => {
          const AreaIcon = area.icon;
          const active = selectedAreaId === area.id;
          return (
            <button
              key={area.id}
              type="button"
              className={`help-topic-button ${active ? "help-topic-button-active" : ""}`}
              onClick={() => onSelectArea(area.id)}
            >
              <AreaIcon className="h-4 w-4" />
              <span>
                <strong>{area.title}</strong>
                <small>{area.eyebrow}</small>
              </span>
            </button>
          );
        })}
      </div>

      <article className="help-detail-panel">
        <div className="help-card-heading">
          <span className="help-icon">
            <Icon className="h-5 w-5" />
          </span>
          <div>
            <span className="tag-label">{selectedArea.eyebrow}</span>
            <h3 className="help-detail-title">{selectedArea.title}</h3>
            <p>{selectedArea.summary}</p>
          </div>
        </div>

        <WhatWhyHowPanel framework={framework} />

        <div className="help-detail-columns">
          <div>
            <h4>Used by the system</h4>
            <div className="help-chip-row">
              {selectedArea.usedBy.map((item) => (
                <span key={item} className="status-pill border border-emerald-200 bg-emerald-50 text-emerald-700">
                  {item}
                </span>
              ))}
            </div>
          </div>
          <div>
            <h4>Operational detail</h4>
            <ul className="help-bullet-list">
              {selectedArea.details.map((detail) => (
                <li key={detail}>{detail}</li>
              ))}
            </ul>
          </div>
        </div>

        {selectedArea.helps && (
          <div className="help-detail-expanded">
            <h4>How it helps</h4>
            <div className="help-compare-grid">
              {selectedArea.helps.map((item) => (
                <MiniDefinition key={item.title} label={item.title} body={item.body} />
              ))}
            </div>
          </div>
        )}

        {selectedArea.usefulFor && (
          <div className="help-detail-expanded">
            <h4>Where it is useful</h4>
            <div className="help-compare-grid">
              {selectedArea.usefulFor.map((item) => (
                <MiniDefinition key={item.title} label={item.title} body={item.body} />
              ))}
            </div>
          </div>
        )}

        {selectedArea.exampleFlow && (
          <div className="help-detail-expanded">
            <h4>Example employee flow</h4>
            <div className="help-route-order help-route-order-six" aria-label={`${selectedArea.title} example flow`}>
              {selectedArea.exampleFlow.map((item, index) => (
                <div key={item} className="help-route-order-step">
                  <strong>{index + 1}</strong>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </article>
    </section>
  );
}

function QatarPanel() {
  return (
    <section className="help-stack">
      <div className="help-grid">
        <HelpCard
          title="Group Health & Medical Services setting"
          body="The model supports staff and dependents through HIA medical review, Old Airport medical commission pathways, tele-triage hotline operations, HMC emergency routes, Sidra pediatric routing, and PHCC urgent care."
          icon={Hospital}
        />
        <HelpCard
          title="Aviation-specific clinical questions"
          body="For the IST Health organization context, the RFI requires outstation validation, fit-to-fly review, sickness validation, vaccination reactions, occupational health, mental health triage, travel-related presentations, and staff/dependent workflows."
          icon={Route}
        />
      </div>

      <div className="help-grid">
        {aviationDataTableCards.map((card) => (
          <MatrixHelpCard key={card.title} card={card} />
        ))}
        {qatariRoutingMatrixCards.map((card) => (
          <MatrixHelpCard key={card.title} card={card} />
        ))}
      </div>

      <article className="help-card">
        <div className="help-card-heading">
          <span className="help-icon">
            <MapPin className="h-5 w-5" />
          </span>
          <div>
            <h3 className="help-title">Disposition Route Library</h3>
            <p>Each route is selected from severity plus age, duty context, and aviation flags.</p>
          </div>
        </div>

        <div className="help-route-order" aria-label="Disposition route decision order">
          {routeDecisionOrder.map((item, index) => (
            <div key={item} className="help-route-order-step">
              <strong>{index + 1}</strong>
              <span>{item}</span>
            </div>
          ))}
        </div>

        <div className="help-route-table">
          {dispositionRoutes.map((route) => (
            <div key={route.code} className="help-route-card">
              <div className="help-route-row">
                <code>{route.code}</code>
                <strong>{route.destination}</strong>
                <span>{route.trigger}</span>
                <small>{route.severityBand}</small>
              </div>

              <div className="help-route-facility">
                <div>
                  <span className="tag-label">{route.facility.category}</span>
                  <h4>{route.facility.name}</h4>
                  <p>{route.facility.summary}</p>
                  <small>{route.facility.sourceNote}</small>
                </div>
                {route.facility.links.length > 0 && (
                  <div className="help-route-link-row" aria-label={`${route.facility.name} links`}>
                    {route.facility.links.map((link) => (
                      <a key={`${route.code}-${link.label}`} href={link.href} target="_blank" rel="noreferrer">
                        <ExternalLink className="h-3.5 w-3.5" />
                        <span>{link.label}</span>
                      </a>
                    ))}
                  </div>
                )}
              </div>

              <div className="help-route-detail-grid">
                <RouteDetailList title="Selected when" items={route.selectedWhen} />
                <RouteDetailList title="Data used" items={route.dataUsed} compact />
                <RouteDetailList title="Handoff" items={route.handoff} />
                <div className="help-route-governance">
                  <h4>Governance note</h4>
                  <p>{route.governance}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}

function GovernancePanel() {
  return (
    <section className="help-grid">
      <article className="help-card help-card-wide">
        <div className="help-card-heading">
          <span className="help-icon">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div>
            <span className="tag-label">GOVERNANCE HELP</span>
            <h3 className="help-title">Clinical governance and production controls</h3>
            <p>
              This section explains how the system stays human-approved, auditable, privacy-aware,
              and ready for clinical, security, and compliance review before production use.
            </p>
          </div>
        </div>
      </article>

      {governanceItems.map((item) => (
        <HelpCard key={item.title} title={item.title} body={item.body} icon={item.icon} />
      ))}

      <article className="help-card help-card-wide">
        <div className="help-card-heading">
          <span className="help-icon">
            <LockKeyhole className="h-5 w-5" />
          </span>
          <div>
            <span className="tag-label">DATA LAW ALIGNMENT</span>
            <h3 className="help-title">GDPR and Qatar personal-data law controls</h3>
            <p>
              The platform is designed to make privacy and security controls reviewable by legal,
              information-security, privacy, and clinical governance teams. This is a control map,
              not a claim of automatic legal certification.
            </p>
          </div>
        </div>
        <div className="help-compare-grid">
          {dataLawItems.map((item) => (
            <MiniDefinition key={item.title} label={item.title} body={item.body} />
          ))}
        </div>
      </article>

      <article className="help-card help-card-wide">
        <div className="help-card-heading">
          <span className="help-icon">
            <Database className="h-5 w-5" />
          </span>
          <div>
            <h3 className="help-title">Production readiness notes</h3>
            <p>
              This MVP proves system wiring. Production needs licensed clinical protocols, local
              medical governance, role-based access control, encryption review, audit retention
              rules, JCI/ISO/MOPH-aligned controls, EMR-write approvals, and a protocol review
              cadence owned by lead physician and lead nurse.
            </p>
          </div>
        </div>
      </article>
    </section>
  );
}

function SecurityAdministrationPanel() {
  const [selectedTopicId, setSelectedTopicId] = useState(securityAdminHelpTopics[0].id);
  const selectedTopic =
    securityAdminHelpTopics.find((topic) => topic.id === selectedTopicId) ?? securityAdminHelpTopics[0];
  const SelectedIcon = selectedTopic.icon;

  return (
    <section className="help-grid">
      <article className="help-card help-card-wide help-security-guide">
        <div className="help-card-heading">
          <span className="help-icon">
            <LockKeyhole className="h-5 w-5" />
          </span>
          <div>
            <span className="tag-label">SECURITY ADMINISTRATION</span>
            <h3 className="help-title">Interactive security administration help</h3>
            <p>
              This explains the login, named-user simulation, SSO, administration, access control,
              masking, encryption, and audit modules added to the existing tele-triage system.
              Select a topic to see what is built, what controls it applies, and what remains for
              production hardening.
            </p>
          </div>
        </div>

        <div className="help-security-layout">
          <div className="help-security-topic-list" aria-label="Security administration help topics">
            {securityAdminHelpTopics.map((topic) => {
              const TopicIcon = topic.icon;
              const active = topic.id === selectedTopic.id;
              return (
                <button
                  key={topic.id}
                  type="button"
                  className={`help-security-topic ${active ? "help-security-topic-active" : ""}`}
                  onClick={() => setSelectedTopicId(topic.id)}
                >
                  <TopicIcon className="h-4 w-4" />
                  <span>
                    <strong>{topic.title}</strong>
                    <small>{topic.eyebrow}</small>
                  </span>
                </button>
              );
            })}
          </div>

          <div className="help-security-detail">
            <div className="help-card-heading">
              <span className="help-icon">
                <SelectedIcon className="h-5 w-5" />
              </span>
              <div>
                <span className="tag-label">{selectedTopic.eyebrow}</span>
                <h4>{selectedTopic.title}</h4>
                <p>{selectedTopic.summary}</p>
              </div>
            </div>

            <div className="help-security-columns">
              <SecurityDetailList title="What is built" items={selectedTopic.built} />
              <SecurityDetailList title="Controls applied" items={selectedTopic.controls} />
              <SecurityDetailList title="Production hardening" items={selectedTopic.production} />
            </div>
          </div>
        </div>
      </article>

      <RoleAccessMatrix />

      <ApiCatalogTable
        title="Security and administration API map"
        body="These endpoints support the login, named-user simulation, SSO metadata, user/access administration, encryption policy review, reveal workflow, and audit panels."
        rows={securityAdminApiRows}
      />
    </section>
  );
}

function RoleAccessMatrix() {
  return (
    <article className="help-card help-card-wide">
      <div className="help-card-heading">
        <span className="help-icon">
          <Users className="h-5 w-5" />
        </span>
        <div>
          <span className="tag-label">ROLE ACCESS CATALOG</span>
          <h3 className="help-title">All roles and their access</h3>
          <p>
            Each role is a distinct effective-access profile. The category prefix matches the login
            simulator and the access columns show the permissions, responsibilities, and scope
            boundaries used to avoid duplicate role definitions.
          </p>
        </div>
      </div>

      <div className="help-role-table" aria-label="Role access matrix">
        <div className="help-role-row help-role-head">
          <span>Role</span>
          <span>Access intent</span>
          <span>Permissions</span>
          <span>Responsibilities</span>
          <span>Scopes</span>
        </div>
        {roleAccessRows.map((role) => (
          <div key={role.role} className="help-role-row">
            <div className="help-role-title">
              <span className="help-role-prefix">{role.prefix}</span>
              <span>
                <strong>{role.role}</strong>
                <small>{role.category}</small>
              </span>
            </div>
            <p>{role.access}</p>
            <RoleChipList items={role.permissions} />
            <RoleChipList items={role.responsibilities} />
            <RoleChipList items={role.scopes} muted />
          </div>
        ))}
      </div>
    </article>
  );
}

function RoleChipList({ items, muted = false }: { items: string[]; muted?: boolean }) {
  return (
    <div className={muted ? "help-role-chip-list help-role-chip-list-muted" : "help-role-chip-list"}>
      {items.map((item) => (
        <code key={item}>{item}</code>
      ))}
    </div>
  );
}

function SecurityDetailList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="help-security-list">
      <h5>{title}</h5>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function WhatWhyHowPanel({ framework }: { framework: WhatWhyHow }) {
  return (
    <div className="help-wwh-grid" aria-label="What why how framework">
      <div className="help-wwh-item">
        <strong>What</strong>
        <p>{framework.what}</p>
      </div>
      <div className="help-wwh-item">
        <strong>Why</strong>
        <p>{framework.why}</p>
      </div>
      <div className="help-wwh-item">
        <strong>How</strong>
        <ul>
          {framework.how.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function RouteDetailList({
  title,
  items,
  compact = false
}: {
  title: string;
  items: string[];
  compact?: boolean;
}) {
  return (
    <div className={compact ? "help-route-detail help-route-detail-compact" : "help-route-detail"}>
      <h4>{title}</h4>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
