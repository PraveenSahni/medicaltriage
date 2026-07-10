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
  Hospital,
  Languages,
  LockKeyhole,
  MapPin,
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
import { useMemo, useState } from "react";

type TabKey = "overview" | "workflow" | "library" | "qatar" | "integration" | "governance" | "security";

type HelpTab = {
  key: TabKey;
  label: string;
  icon: LucideIcon;
};

type LibraryArea = {
  id: string;
  title: string;
  eyebrow: string;
  icon: LucideIcon;
  summary: string;
  usedBy: string[];
  details: string[];
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
  { key: "overview", label: "System Map", icon: ShieldCheck },
  { key: "workflow", label: "Call Flow", icon: Workflow },
  { key: "library", label: "Library", icon: BookOpen },
  { key: "qatar", label: "Qatar Model", icon: MapPin },
  { key: "integration", label: "Integration", icon: PlugZap },
  { key: "governance", label: "Governance", icon: ShieldCheck },
  { key: "security", label: "Security Admin", icon: LockKeyhole }
];

const operatingStats = [
  { label: "Core paths", value: "2", detail: "Nurse triage and administrative screening" },
  { label: "Severity levels", value: "4", detail: "Emergency, Urgent, Routine, Self-care" },
  { label: "Local routes", value: "8", detail: "HMC, Sidra, PHCC, IST teleconsult, self-care" },
  { label: "Audit flags", value: "4", detail: "AI differed, override up, downgrade blocked, final rules" }
];

const teleTriageStages = [
  {
    title: "Remote intake",
    body:
      "The nurse or call-center clinician identifies the staff member, dependent, language, location, duty status, and whether the case is local, HIA-based, or outstation."
  },
  {
    title: "Complaint matching",
    body:
      "The system maps the caller's words to a protocol using chief complaint, symptom keywords, age, sex, mode, and red-flag terms."
  },
  {
    title: "Acuity rule-out",
    body:
      "Emergency questions are presented first. A positive high-acuity answer sets the minimum safety floor before any lower-acuity route is considered."
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
      "The clinician validates the output, documents the decision, copies the SBAR/SOAP note, and follows local SOP for transfer, appointment, callback, or escalation."
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
      "The system treats deterministic triage logic as the safety floor. AI can summarize, highlight risks, and suggest next steps, but it cannot lower a protected high-acuity disposition."
  },
  {
    title: "ClearTriage-aligned nurse workflow",
    icon: Stethoscope,
    body:
      "The clinical pathway follows the ClearTriage pattern: search by chief complaint, work through red-flag questions first, capture rationale, and produce a structured SBAR/SOAP note."
  },
  {
    title: "Tele-triage encounter engine",
    icon: PhoneCall,
    body:
      "The system supports a remote consultation from caller identity through symptom capture, protocol matching, acuity rule-out, local routing, clinician validation, and SBAR handoff."
  },
  {
    title: "SymptomScreen-style access support",
    icon: ClipboardList,
    body:
      "A simplified screening layer is planned for front-desk or call-center staff so non-clinical users can identify urgent concerns without exercising clinical judgment."
  },
  {
    title: "IST Tech localization",
    icon: MapPin,
    body:
      "The MVP localizes routing around staff identity, dependents, insurance status, IST medical workflows, HMC/Sidra emergency routes, fit-to-fly gates, outstation review, and sickness validation."
  }
];

const workflowSteps = [
  {
    title: "Identify caller",
    icon: UserRoundCheck,
    body:
      "The nurse enters an IST staff ID. The API validates the staff member, duty status, department, job title, dependents, and insurance eligibility snapshot."
  },
  {
    title: "Start encounter",
    icon: ClipboardList,
    body:
      "The encounter opens in ephemeral mode. The selected staff member or dependent becomes the patient context without persisting PHI in this scaffold."
  },
  {
    title: "Capture symptoms",
    icon: Languages,
    body:
      "The workspace accepts symptom search, English narrative, Arabic narrative, red flags, duration, age, and optional vital signs. Bilingual labels are present while governed translation remains a production integration."
  },
  {
    title: "Apply clinical floor",
    icon: SearchCheck,
    body:
      "Mock STCC-style rules check chest pain with sweating, severe constant pain over 60 minutes, breathing or consciousness concerns, stroke/anaphylaxis terms, urgent symptoms, and routine symptoms."
  },
  {
    title: "Apply aviation context",
    icon: GitBranch,
    body:
      "Crew role, on-duty state, outstation status, sickness leave, vaccination timing, and occupational/commission visits can escalate or change the local disposition target."
  },
  {
    title: "Route and document",
    icon: ClipboardCheck,
    body:
      "The system returns severity, disposition code, destination, rationale, explainability trace, insurance notes, aviation tags, and an SBAR clipboard payload for EMR handoff."
  }
];

const libraryAreas: LibraryArea[] = [
  {
    id: "teletriage",
    title: "Tele-Triage Encounter Engine",
    eyebrow: "Remote clinical decision support",
    icon: PhoneCall,
    summary:
      "Coordinates caller validation, symptom capture, protocol search, acuity-first questions, aviation gates, disposition routing, SBAR handoff, and human approval for remote nurse triage.",
    usedBy: [
      "POST /api/v1/triage/start",
      "POST /api/v1/triage/encounters/evaluate",
      "TriageWorkspace"
    ],
    details: [
      "The encounter starts with staff or dependent context, then applies clinical content and deterministic rules without allowing AI to approve the final disposition.",
      "The current MVP keeps PHI ephemeral and returns the decision package to the frontend for clinician validation and clipboard handoff.",
      "Production tele-triage requires persistence, role-based access, call transcription, scheduling, EMR integration, and approved clinical SOPs."
    ]
  },
  {
    id: "protocols",
    title: "Clinical Protocol Library",
    eyebrow: "STCC-style content layer",
    icon: BookOpen,
    summary:
      "Stores adult and pediatric algorithms, ordered triage questions, severity grades, rationale, red-flag markers, care advice links, and bilingual title fields.",
    usedBy: ["Algorithm", "TriageQuestion", "CareAdvice", "AlgorithmCareAdvice"],
    details: [
      "Production should replace the mock rules with licensed clinical content or an approved rules service.",
      "Questions are ordered by acuity so emergency rule-out logic appears before lower-acuity advice.",
      "The model supports localized care advice and disposition codes connected to each algorithm."
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
      "Combines clinical red-flag rules and aviation gates to determine the minimum permitted severity before AI recommendations are considered.",
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
      "Captures AI recommendation differences, nurse overrides, downgrade blocks, rules-engine severity, and explainability traces for safety officer review.",
    usedBy: ["buildSafetyAuditDraft", "SafetyAuditDeviationLog", "python/audit.sqlite3"],
    details: [
      "Emergency cases and AI mismatches are marked review-required.",
      "The Python wrapper writes downgrade decisions and rule hits to SQLite for the MVP demonstration.",
      "The dashboard is the operating surface for QA sampling, trend review, incident follow-up, and training feedback."
    ]
  }
];

const routeDecisionOrder = [
  "Emergency safety floor first: pediatric emergency to Sidra, adult/general or unknown-age emergency to HMC.",
  "Outstation escalation next when the case is not already emergency and remote clinical coordination is needed.",
  "Aviation gates next: fit-to-fly restriction, sickness validation, and occupational or commission visits.",
  "Protocol-selected disposition is then honored from the active clinical content package.",
  "If no specific route applies, severity falls back to urgent, routine, or self-care pathways."
];

const careFacilities = {
  sidra: {
    name: "Sidra Medicine",
    category: "Pediatric and specialist hospital",
    summary:
      "Publicly listed Qatar Foundation academic medical center in Ar-Rayyan/Doha. Use for pediatric emergency routing after the emergency safety floor is triggered.",
    sourceNote: "Official public site available; emergency workflow still needs IST Tech clinical SOP confirmation.",
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
    sourceNote: "Official HMC hospital and ambulance pages available; nearest-ED selection should be configured from live IST Tech/HMC routing policy.",
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
    sourceNote: "Official HMC public provider pages available; exact urgent clinic/referral target should be configured by IST Tech medical governance.",
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
    name: "IST Tech Medical Centre - Hamad International Airport",
    category: "IST Tech staff medical destination",
    summary:
      "Internal IST Tech medical route for HIA-based staff care, fit-to-fly review, sickness validation, and duty-status coordination.",
    sourceNote:
      "No authoritative public facility page was found in open web search; confirm internal facility name, address, phone, hours, and booking rules with IST Tech.",
    links: [
      {
        label: "Google Maps search",
        href: "https://www.google.com/maps/search/?api=1&query=medical%20centre%20Hamad%20International%20Airport%20Doha"
      },
      {
        label: "IST Tech",
        href: "#"
      }
    ]
  },
  qaOldAirportMedical: {
    name: "IST Tech Medical - Old Airport medical commission workflow",
    category: "IST Tech occupational / commission destination",
    summary:
      "Internal IST Tech medical route for occupational health, medical commission, clearance, and staff documentation workflows around the Old Airport area.",
    sourceNote:
      "Open sources identify Old Airport as a Doha district, but a public IST Tech medical-commission facility page was not found; confirm the formal internal name.",
    links: [
      {
        label: "Google Maps search",
        href: "https://www.google.com/maps/search/?api=1&query=medical%20commission%20Old%20Airport%20Road%20Doha"
      },
      {
        label: "IST Tech",
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
    name: "IST Tech medical teleconsult escalation",
    category: "Airline medical coordination",
    summary:
      "Internal IST Tech medical escalation route for outstation staff, station coordination, local care referral, and operational duty restrictions.",
    sourceNote:
      "No public IST Tech teleconsult SOP was found; configure from internal medical, airport operations, and station-management procedures.",
    links: [
      {
        label: "Google Maps search",
        href: "https://www.google.com/maps/search/?api=1&query=medical%20teleconsult%20Doha"
      },
      {
        label: "IST Tech",
        href: "#"
      }
    ]
  },
  selfCare: {
    name: "IST Tech nurse-guided self-care with callback precautions",
    category: "No facility transfer",
    summary:
      "Used only after higher-acuity questions are negative and the nurse agrees approved self-care advice and callback precautions are appropriate.",
    sourceNote: "Clinical advice must come from licensed protocol content and IST Tech medical governance.",
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
      "Destination and transfer procedure must be confirmed by IST Tech clinical governance and local pediatric emergency routing policy.",
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
    code: "QA_HIA_GROUP_MEDICAL_CENTRE",
    destination: "IST Tech Medical Centre - HIA",
    severityBand: "IST Tech staff pathway",
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
    code: "QA_OLD_AIRPORT_MEDICAL_COMMISSION",
    destination: "IST Tech Medical - Old Airport medical commission",
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
      "Occupational routing should be aligned with IST Tech medical commission workflows and HR documentation policy.",
    facility: careFacilities.qaOldAirportMedical
  },
  {
    code: "PHCC_URGENT_CARE_OR_QA_TELECONSULT",
    destination: "PHCC Urgent Care or IST Tech teleconsult",
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
    code: "QA_OUTSTATION_TELECONSULT_ESCALATION",
    destination: "IST Tech medical teleconsult escalation",
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
  ["Oracle Fusion HCM", "Validate staff identity, active worker status, assignments, contacts, dependents, absences, and documents.", "Mock adapter exists; target connector documented below."],
  ["Insurance", "Return provider, eligibility, last check, and booking notes.", "Mock eligibility cache exists; connect payer or benefits verification after insurer specs."],
  ["EMR / Oracle Health", "Move SBAR/SOAP into patient record.", "Clipboard handoff now; SMART on FHIR or approved Oracle Health API later."],
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
    area: "IST triage API",
    api: "POST /api/v1/staff/validate\nPOST /api/v1/triage/start\nPOST /api/v1/triage/encounters/evaluate",
    use: "Stable internal contract used by the frontend and future enterprise adapters.",
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
      "If deterministic rules classify an encounter as Emergency, an AI suggestion below that floor is blocked and logged as a safety event."
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
    id: "login-role-simulation",
    title: "Login and Role Simulation",
    eyebrow: "Authentication entry",
    icon: LockKeyhole,
    summary:
      "The login page is now the single entry point for the system. It uses IST Tech branding, language selection, password visibility, SSO entry, and a simulator that opens the system as a selected role.",
    built: [
      "Apple-style minimal login using the system font stack, light mode by default, and optional dark mode.",
      "Organization selector is set to IST Tech, with English, Arabic, Hindi, and Tagalog language choices.",
      "Simulate role dropdown is grouped by business category: A - Administration, S - Security and Privacy, G - Governance and Quality, B - Business and Clinical Operations, I - Integration, R - Reporting and Analytics, and U - User Support.",
      "The simulator uses the normal login API, sets a secure session cookie, and redirects by permission to admin or workspace."
    ],
    controls: [
      "Authentication errors stay generic and do not reveal whether a username exists.",
      "The simulated role is validated by the backend against roles assigned to the demo account.",
      "Session restore uses the same permission logic as login, so refresh keeps the correct landing area."
    ],
    production: [
      "Replace the demo password gate with Argon2id hashes and an enterprise identity store.",
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
      "The active role controls permissions for the current session instead of granting every role at once.",
      "Every seeded role is intended to have a distinct effective access profile across permissions, responsibilities, data scopes, clinical scopes, and integration scopes.",
      "The old global Actor selector was removed so the authenticated role is the single source of truth for menus, API access, data scope, and audit.",
      "A central authorization helper protects administration APIs independently of frontend menu visibility.",
      "Admin navigation and admin tabs appear only when the active session has the matching administration, security, privacy, or audit permissions."
    ],
    controls: [
      "Platform Super Administrator has all current permissions for local simulation and demonstration.",
      "Clinical roles such as nurse, pediatric nurse, physician, and occupational-health clinician land in the triage workspace with role-specific clinical scopes.",
      "Governance, quality, privacy, integration, and administration roles see only the administration modules allowed by their active permissions."
    ],
    production: [
      "Add editable role templates, access profiles, effective dates, explicit deny, queue/facility/clinical scopes, and approval workflows.",
      "Add segregation-of-duties checks such as preventing a user from approving their own elevated access.",
      "Extend authorization guards around every clinical, queue, note, integration, export, and content-management endpoint."
    ]
  },
  {
    id: "admin-portal",
    title: "Administration Portal",
    eyebrow: "Same application, protected section",
    icon: Users,
    summary:
      "The administration portal is integrated into the existing app rather than being a parallel system. It gives authorized users a governed place to review security, users, access, SSO, privacy, and audit state.",
    built: [
      "Administration dashboard with security metrics such as active users, failed logins, active sessions, privacy requests, and crypto warnings.",
      "Users panel with masked identifiers and controlled reveal actions.",
      "Access panel for roles, responsibilities, and permissions.",
      "SSO, privacy/encryption policy, and audit panels are available from the same admin section."
    ],
    controls: [
      "Admin APIs require server-side permission checks.",
      "The portal respects the active simulated role, so a nurse does not see the admin icon.",
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
      "IST Tech Cloud KMS aliases are shown as policy references, not as keys.",
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
    access: "Tenant, facility, department, queue, user, and access configuration for IST Tech.",
    permissions: ["admin.users.manage", "admin.roles.manage", "operations.dashboard.view", "reports.view", "audit.events.view"],
    responsibilities: ["administer_organization", "manage_users", "view_operational_reports"],
    scopes: ["organization:IST Tech", "facility:*", "hrms.read"]
  },
  {
    category: "A - Administration",
    prefix: "A",
    role: "System Administrator",
    access: "Application and user administration without automatic clinical-data reveal or clinical workflow rights.",
    permissions: ["admin.users.manage", "admin.roles.manage", "support.tickets.manage", "audit.events.view"],
    responsibilities: ["manage_users", "provide_helpdesk_support"],
    scopes: ["organization:IST Tech", "support tickets", "masked users"]
  },
  {
    category: "S - Security and Privacy",
    prefix: "S",
    role: "Security Administrator",
    access: "Authentication, SSO, security policy, session, KMS policy, and security-event administration.",
    permissions: ["security.sso.manage", "crypto.policy.manage", "audit.events.view"],
    responsibilities: ["manage_sso", "manage_encryption_policy"],
    scopes: ["organization:IST Tech", "sso", "kms"]
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
    access: "Assigned remote triage encounters with clinical protocol access and AI recommendation visibility.",
    permissions: ["triage.workspace.view", "triage.recommendation.view", "privacy.reveal.request"],
    responsibilities: ["conduct_nurse_triage", "view_ai_recommendation"],
    scopes: ["assigned queue", "adult", "aviation", "hrms.read", "insurance.read"]
  },
  {
    category: "B - Business and Clinical Operations",
    prefix: "B",
    role: "Senior Triage Nurse",
    access: "Complex triage, queue supervision, protocol adherence, and upward disposition override.",
    permissions: ["triage.workspace.view", "triage.call.intake", "triage.recommendation.view", "triage.disposition.override", "triage.queue.manage", "privacy.reveal.request"],
    responsibilities: ["conduct_nurse_triage", "view_ai_recommendation", "coordinate_triage_queue"],
    scopes: ["assigned queue", "supervised queue", "escalation", "hrms.read", "insurance.read"]
  },
  {
    category: "B - Business and Clinical Operations",
    prefix: "B",
    role: "Pediatric Triage Nurse",
    access: "Pediatric and dependent triage with guardian, age, and emergency routing rules.",
    permissions: ["triage.workspace.view", "triage.recommendation.view", "triage.pediatric.manage", "privacy.reveal.request"],
    responsibilities: ["conduct_nurse_triage", "perform_pediatric_triage", "view_ai_recommendation"],
    scopes: ["dependent encounters", "pediatric", "emergency", "hrms.read", "insurance.read"]
  },
  {
    category: "B - Business and Clinical Operations",
    prefix: "B",
    role: "Teleconsult Physician",
    access: "Escalated teleconsult review, physician-level disposition, and clinical override decisions.",
    permissions: ["triage.workspace.view", "triage.recommendation.view", "triage.teleconsult.manage", "triage.disposition.override", "privacy.reveal.request"],
    responsibilities: ["approve_physician_escalation", "view_ai_recommendation"],
    scopes: ["escalated encounters", "physician escalation", "emr.write", "insurance.read"]
  },
  {
    category: "B - Business and Clinical Operations",
    prefix: "B",
    role: "Occupational Health Clinician",
    access: "Fit-to-work, fit-to-fly, sickness, occupational visit, and medical commission pathways.",
    permissions: ["triage.workspace.view", "triage.recommendation.view", "triage.disposition.override", "privacy.reveal.request"],
    responsibilities: ["perform_occupational_health_review", "view_ai_recommendation"],
    scopes: ["occupational cases", "fit-to-fly", "sickness", "hrms.read", "emr.write"]
  },
  {
    category: "I - Integration",
    prefix: "I",
    role: "Integration Administrator",
    access: "HRMS, EMR, roster, insurance, SSO connector, and API integration configuration.",
    permissions: ["integration.hrms.manage", "integration.emr.manage", "security.sso.manage", "audit.events.view"],
    responsibilities: ["manage_enterprise_integrations", "manage_sso"],
    scopes: ["integration config", "connector logs", "hrms.manage", "emr.manage", "sso", "insurance.manage"]
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
    area: "Admin dashboard",
    api: "GET /api/v1/admin/summary",
    use: "Return dashboard metrics for active users, failed logins, sessions, privacy requests, crypto warnings, and incidents.",
    status: "Built with seed data"
  },
  {
    area: "Identity and access",
    api: "GET /api/v1/admin/users\nGET /api/v1/admin/roles\nGET /api/v1/admin/responsibilities\nGET /api/v1/admin/permissions",
    use: "Power the users, roles, responsibilities, and permission matrix sections of Administration.",
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
    api: "POST /api/v1/admin/reveal\nGET /api/v1/admin/audit-events",
    use: "Control personal-data reveal by purpose and show security/privacy event history.",
    status: "Built demo workflow"
  }
];

export default function HelpCenter() {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [selectedAreaId, setSelectedAreaId] = useState(libraryAreas[0].id);

  const selectedArea = useMemo(
    () => libraryAreas.find((area) => area.id === selectedAreaId) ?? libraryAreas[0],
    [selectedAreaId]
  );

  return (
    <div className="help-library-shell">
      <section className="help-library-hero">
        <div>
          <span className="tag-label">CONNECTED HELP LIBRARY</span>
          <h2>IST Tele-Triage Knowledge Base</h2>
          <p>
            A comprehensive operating guide for the clinical decision support system: what data it
            uses, how it applies rules, where AI is constrained, how Qatar-specific routing works,
            and what must be governed before production deployment.
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

      {activeTab === "overview" && <OverviewPanel />}
      {activeTab === "workflow" && <WorkflowPanel />}
      {activeTab === "library" && (
        <LibraryPanel
          selectedArea={selectedArea}
          selectedAreaId={selectedAreaId}
          onSelectArea={setSelectedAreaId}
        />
      )}
      {activeTab === "qatar" && <QatarPanel />}
      {activeTab === "integration" && <IntegrationPanel />}
      {activeTab === "governance" && <GovernancePanel />}
      {activeTab === "security" && <SecurityAdministrationPanel />}
    </div>
  );
}

function OverviewPanel() {
  return (
    <section className="help-grid">
      {systemCards.map((card) => (
        <HelpCard key={card.title} title={card.title} body={card.body} icon={card.icon} />
      ))}
      <article className="help-card help-card-wide">
        <div className="help-card-heading">
          <span className="help-icon">
            <PhoneCall className="h-5 w-5" />
          </span>
          <div>
            <h3 className="help-title">How tele-triage works in this system</h3>
            <p>
              The application is built around a remote nurse-led encounter. It gathers caller
              context, matches a clinical protocol, rules out emergency findings first, applies
              aviation-specific constraints, proposes a route, and prepares documentation for a
              clinician-approved decision.
            </p>
          </div>
        </div>
        <div className="help-route-order" aria-label="Tele-triage operating model">
          {teleTriageStages.map((stage, index) => (
            <div key={stage.title} className="help-route-order-step">
              <strong>{index + 1}</strong>
              <span>
                <b>{stage.title}</b>
                <br />
                {stage.body}
              </span>
            </div>
          ))}
        </div>
      </article>
      <article className="help-card help-card-wide">
        <div className="help-card-heading">
          <span className="help-icon">
            <BrainCircuit className="h-5 w-5" />
          </span>
          <div>
            <h3 className="help-title">Clinical content strategy</h3>
            <p>
              The benchmark is mature ClearTriage/SymptomScreen practice: licensed, annually
              reviewed clinical protocols, structured checklists, targeted care advice, role-based
              workflows, training materials, and continuous quality feedback.
            </p>
          </div>
        </div>
        <div className="help-compare-grid">
          <MiniDefinition
            label="ClearTriage-style"
            body="Licensed nurse triage pathway for comprehensive assessment, clinical documentation, disposition rationale, and care advice."
          />
          <MiniDefinition
            label="SymptomScreen-style"
            body="Simplified access-staff screening for urgent red-flag detection and safe routing without requiring non-clinical staff to make clinical judgments."
          />
          <MiniDefinition
            label="IST Tech layer"
            body="Localized staff/dependent identity, insurance status, aviation medicine rules, Arabic/English operation, and Qatar destination routing."
          />
        </div>
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
          body="For the IST Tech organization context, the RFI requires outstation validation, fit-to-fly review, sickness validation, vaccination reactions, occupational health, mental health triage, travel-related presentations, and staff/dependent workflows."
          icon={Route}
        />
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

function IntegrationPanel() {
  return (
    <section className="help-stack">
      <article className="help-card">
        <div className="help-card-heading">
          <span className="help-icon">
            <PlugZap className="h-5 w-5" />
          </span>
          <div>
            <h3 className="help-title">Integration Map</h3>
            <p>
              The scaffold keeps a stable API contract while individual enterprise connectors are
              swapped in after security, privacy, and clinical governance approval.
            </p>
          </div>
        </div>

        <div className="help-integration-table">
          {integrationRows.map(([system, purpose, status]) => (
            <div key={system} className="help-integration-row">
              <strong>{system}</strong>
              <span>{purpose}</span>
              <small>{status}</small>
            </div>
          ))}
        </div>
      </article>

      <article className="help-card help-card-wide">
        <div className="help-card-heading">
          <span className="help-icon">
            <Database className="h-5 w-5" />
          </span>
          <div>
            <h3 className="help-title">Oracle Fusion HCM compatibility approach</h3>
            <p>
              The platform keeps one internal staff-validation contract and places Oracle Fusion Cloud HCM
              behind an adapter. The adapter calls the tenant base URL plus
              <code className="help-inline-code">/hcmRestApi/resources/11.13.18.05</code>, uses
              service-account authentication from GCP Secret Manager, starts read-only, caches only
              the minimum eligibility snapshot, and escalates to writeback only after HR, privacy,
              and medical governance approve it.
            </p>
          </div>
        </div>
      </article>

      <ApiCatalogTable
        title="Oracle Fusion HCM API plan"
        body="These are the Oracle HRMS / Oracle Fusion HCM APIs the production connector should use for staff, dependent, duty, absence, and document context."
        rows={oracleHcmApiRows}
      />

      <ApiCatalogTable
        title="All integration APIs"
        body="This is the full system integration catalogue shown in Help so every connector has a named purpose, API surface, and implementation status."
        rows={plannedApiRows}
      />

      <div className="help-grid">
        <HelpCard
          title="Adapter rule"
          body="The frontend and triage engine should keep calling IST triage APIs. Oracle, insurance, EMR, scheduling, and analytics remain replaceable backend adapters with audit logging and fail-safe fallback."
          icon={Database}
        />
        <HelpCard
          title="Change sync rule"
          body="Use Oracle Atom feeds for key employee changes and HCM Extracts for bulk baseline or periodic refresh. Avoid high-frequency REST polling against worker data."
          icon={GitBranch}
        />
      </div>
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
              This explains the login, role simulation, SSO, administration, access control,
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
        body="These endpoints support the login, role simulation, SSO metadata, user/access administration, encryption policy review, reveal workflow, and audit panels."
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

function HelpCard({
  title,
  body,
  icon: Icon
}: {
  title: string;
  body: string;
  icon: LucideIcon;
}) {
  return (
    <article className="help-card">
      <div className="help-card-heading">
        <span className="help-icon">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <h3 className="help-title">{title}</h3>
          <p>{body}</p>
        </div>
      </div>
    </article>
  );
}

function MiniDefinition({ label, body }: { label: string; body: string }) {
  return (
    <div className="help-mini-definition">
      <strong>{label}</strong>
      <span>{body}</span>
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

function ApiCatalogTable({
  title,
  body,
  rows
}: {
  title: string;
  body: string;
  rows: ApiCatalogRow[];
}) {
  return (
    <article className="help-card help-card-wide">
      <div className="help-card-heading">
        <span className="help-icon">
          <PlugZap className="h-5 w-5" />
        </span>
        <div>
          <h3 className="help-title">{title}</h3>
          <p>{body}</p>
        </div>
      </div>
      <div className="help-api-table">
        {rows.map((row) => (
          <div key={`${row.area}-${row.status}`} className="help-api-row">
            <strong>{row.area}</strong>
            <code>{row.api}</code>
            <span>{row.use}</span>
            <small>{row.status}</small>
          </div>
        ))}
      </div>
    </article>
  );
}
