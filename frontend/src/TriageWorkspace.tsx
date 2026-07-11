import {
  BadgeCheck,
  Bot,
  Check,
  Clock,
  ClipboardCheck,
  Copy,
  Database,
  FileText,
  Languages,
  PhoneCall,
  MapPin,
  Plane,
  Search,
  ShieldAlert,
  Sparkles,
  Stethoscope,
  Syringe,
  UserCheck,
  XCircle
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type Severity = "Emergency" | "Urgent" | "Routine" | "Self-care";

type StaffProfile = {
  id: string;
  istStaffId: string;
  department: string;
  jobTitle: string;
  dutyStatus: string;
  insuranceEligibilityStatus: string;
  insuranceProvider?: string;
  dependents: Array<{
    id: string;
    relationshipType: string;
    age: number;
    biologicalSex: string;
  }>;
};

type Question = {
  id: string;
  acuityOrder?: number;
  severity: Severity;
  text?: string;
  questionTextEn?: string;
  rationale?: string;
  rationaleEn?: string;
  dispositionCode?: string;
  redFlag?: boolean;
  keywords: string[];
  careAdviceIds?: string[];
};

type ProtocolSearchResult = {
  id: string;
  titleEn: string;
  clinicalDefinitionEn?: string;
  score: number;
  matchedTerms: string[];
  questionCount: number;
  highestSeverity: Severity;
  releaseVersion: string;
};

type ProtocolDetail = {
  id: string;
  titleEn: string;
  clinicalDefinitionEn?: string;
  releaseVersion: string;
  questions: Question[];
};

type CopilotSuggestion = {
  id: string;
  question: string;
  confidence: number;
  proposed: "Yes" | "No";
  status: "pending" | "accepted" | "rejected";
};

type EvaluationDecision = {
  severity: Severity;
  dispositionCode: string;
  destinationName: string;
  destinationRationale: string;
  trace: Array<{ ruleId: string; matched: boolean; rationale: string }>;
};

type TriageStepId = "patient" | "presentation" | "acuity" | "copilot" | "disposition";

type WorkflowStep = {
  id: TriageStepId;
  title: string;
  subtitle: string;
};

type IncomingCall = {
  id: string;
  queueNumber: string;
  priority: Severity;
  staffId: string;
  patientLabel: string;
  ageYears: number;
  waitMinutes: number;
  channel: "Phone" | "WhatsApp" | "Callback";
  complaint: string;
  transcriptEn: string;
  transcriptAr: string;
  profile: StaffProfile;
  dependentId?: string;
  fitToFly: boolean;
  outstation: boolean;
  sicknessLeave: boolean;
  vaccinationScreen: boolean;
};

type GeneratedDataSnapshot = {
  available: boolean;
  message?: string;
  activeRun?: {
    name: string;
    lastModifiedIso: string;
    recordCount?: number;
  };
  files?: {
    manifest?: string;
    encounters?: string | null;
    training?: string | null;
    audit?: string | null;
  };
  manifest?: {
    recordCount?: number;
    auditRecordCount?: number;
    startDate?: string;
    endDate?: string;
    counts?: {
      by_profile?: Record<string, number>;
      by_severity?: Record<string, number>;
      by_route?: Record<string, number>;
      by_fit_to_fly?: Record<string, number>;
    };
    regionalContext?: {
      enabled?: boolean;
      mode?: string;
      open_data_sources?: string[];
    };
  };
  samples?: {
    encounters?: Array<{
      encounter_id: string;
      profile: string;
      severity: string;
      route: string;
      patient_context?: Record<string, unknown>;
      biological_sex?: string;
      regional_context?: {
        climate?: {
          season?: string;
          heat_risk?: string;
          dust_risk?: string;
          respiratory_season?: string;
          temperature_max_c?: number;
          apparent_temperature_max_c?: number;
        };
        health?: {
          health_impact_tags?: string[];
          vulnerable_groups?: string[];
        };
      };
    }>;
  };
};

const apiBase = import.meta.env.VITE_API_BASE_URL || "";

const workflowSteps: WorkflowStep[] = [
  {
    id: "patient",
    title: "Caller & patient",
    subtitle: "Validate staff, dependent, eligibility, and duty context."
  },
  {
    id: "presentation",
    title: "Presentation",
    subtitle: "Capture complaint, transcript, and aviation flags."
  },
  {
    id: "acuity",
    title: "Acuity checklist",
    subtitle: "Rule out high-acuity findings before routine care."
  },
  {
    id: "copilot",
    title: "Nurse review",
    subtitle: "Accept or reject AI assistance before handoff."
  },
  {
    id: "disposition",
    title: "Disposition & SBAR",
    subtitle: "Finalize deterministic routing and copy the note."
  }
];

const demoProfile: StaffProfile = {
  id: "staff_demo_10001",
  istStaffId: "IST-10001",
  department: "Flight Operations",
  jobTitle: "Cabin Crew",
  dutyStatus: "active",
  insuranceProvider: "IST Staff Health Plan",
  insuranceEligibilityStatus: "eligible",
  dependents: [
    {
      id: "dep_demo_10001_child",
      relationshipType: "child",
      age: 8,
      biologicalSex: "female"
    }
  ]
};

const initialIncomingCalls: IncomingCall[] = [
  {
    id: "call-2407-001",
    queueNumber: "Q-001",
    priority: "Emergency",
    staffId: "IST-10001",
    patientLabel: "Staff member",
    ageYears: 32,
    waitMinutes: 2,
    channel: "Phone",
    complaint: "Chest tightness and sweating for more than one hour",
    transcriptEn: "Cabin crew reports sudden chest tightness with sweating for more than one hour.",
    transcriptAr:
      "طاقم المقصورة يبلغ عن ضيق مفاجئ في الصدر مع تعرق لمدة تزيد عن ساعة.",
    profile: demoProfile,
    fitToFly: true,
    outstation: false,
    sicknessLeave: true,
    vaccinationScreen: false
  },
  {
    id: "call-2407-002",
    queueNumber: "Q-002",
    priority: "Urgent",
    staffId: "IST-10024",
    patientLabel: "Staff member",
    ageYears: 41,
    waitMinutes: 7,
    channel: "WhatsApp",
    complaint: "Persistent vomiting with dizziness after night duty",
    transcriptEn: "Ground services staff reports dizziness and repeated vomiting after night duty.",
    transcriptAr: "الموظف يبلغ عن دوخة وقيء متكرر بعد المناوبة الليلية.",
    profile: {
      id: "staff_demo_10024",
      istStaffId: "IST-10024",
      department: "Ground Services",
      jobTitle: "Ramp Supervisor",
      dutyStatus: "active",
      insuranceProvider: "IST Staff Health Plan",
      insuranceEligibilityStatus: "eligible",
      dependents: []
    },
    fitToFly: false,
    outstation: false,
    sicknessLeave: true,
    vaccinationScreen: false
  },
  {
    id: "call-2407-003",
    queueNumber: "Q-003",
    priority: "Routine",
    staffId: "IST-10037",
    patientLabel: "Child dependent",
    ageYears: 8,
    waitMinutes: 11,
    channel: "Callback",
    complaint: "Mild sore throat and low fever in child dependent",
    transcriptEn: "Employee requests advice for child dependent with mild sore throat and low fever.",
    transcriptAr: "الموظف يطلب نصيحة لطفل لديه التهاب حلق خفيف وحرارة بسيطة.",
    profile: {
      id: "staff_demo_10037",
      istStaffId: "IST-10037",
      department: "Cabin Services",
      jobTitle: "Cabin Crew",
      dutyStatus: "off duty",
      insuranceProvider: "IST Staff Health Plan",
      insuranceEligibilityStatus: "eligible",
      dependents: [
        {
          id: "dep_demo_10037_child",
          relationshipType: "child",
          age: 8,
          biologicalSex: "male"
        }
      ]
    },
    dependentId: "dep_demo_10037_child",
    fitToFly: false,
    outstation: false,
    sicknessLeave: false,
    vaccinationScreen: false
  },
  {
    id: "call-2407-004",
    queueNumber: "Q-004",
    priority: "Urgent",
    staffId: "IST-10051",
    patientLabel: "Staff member",
    ageYears: 29,
    waitMinutes: 14,
    channel: "Phone",
    complaint: "Outstation sickness call with fever and weakness",
    transcriptEn: "Outstation crew member reports fever, weakness, and needs coordinated teleconsult support.",
    transcriptAr: "أحد أفراد الطاقم خارج المحطة يبلغ عن حرارة وضعف ويحتاج إلى تنسيق استشارة عن بعد.",
    profile: {
      id: "staff_demo_10051",
      istStaffId: "IST-10051",
      department: "Flight Operations",
      jobTitle: "Cabin Crew",
      dutyStatus: "outstation",
      insuranceProvider: "IST Staff Health Plan",
      insuranceEligibilityStatus: "eligible",
      dependents: []
    },
    fitToFly: true,
    outstation: true,
    sicknessLeave: true,
    vaccinationScreen: false
  }
];

const fallbackProtocol: ProtocolDetail = {
  id: "sample-chest-pain-adult",
  titleEn: "Chest Pain or Tightness - Adult",
  clinicalDefinitionEn:
    "Synthetic Phase 1 fallback protocol. API search replaces this with active content when available.",
  releaseVersion: "2026.07-sample",
  questions: [
    {
      id: "chest-adult-q1",
      acuityOrder: 1,
      severity: "Emergency",
      questionTextEn:
        "Chest pain, tightness, sweating, breathing difficulty, altered consciousness, stroke signs, or throat swelling?",
      rationaleEn: "High-acuity red flags must be ruled out before any lower-acuity pathway.",
      dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
      redFlag: true,
      keywords: ["chest", "sweat", "breathing", "altered consciousness", "slurred", "throat"]
    },
    {
      id: "chest-adult-q2",
      acuityOrder: 2,
      severity: "Emergency",
      questionTextEn: "Severe constant chest or abdominal pain lasting more than one hour?",
      rationaleEn: "Persistent severe pain keeps the deterministic emergency floor active.",
      dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
      redFlag: true,
      keywords: ["severe", "constant", "abdominal", "abdomen"]
    },
    {
      id: "chest-adult-q3",
      acuityOrder: 3,
      severity: "Urgent",
      questionTextEn: "Moderate pain, dizziness, persistent vomiting, high fever, or abnormal oxygen saturation?",
      rationaleEn: "Concerning non-emergency findings require time-sensitive review.",
      dispositionCode: "HMC_URGENT_REVIEW",
      keywords: ["moderate", "dizziness", "vomiting", "fever", "oxygen"]
    },
    {
      id: "chest-adult-q4",
      acuityOrder: 4,
      severity: "Routine",
      questionTextEn: "Common respiratory, throat, back pain, urinary, rash, or mild fever symptoms?",
      rationaleEn: "Routine review can route to PHCC, IST clinic, or teleconsult depending on context.",
      dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT",
      keywords: ["cough", "sore throat", "back pain", "urine", "rash"]
    },
    {
      id: "chest-adult-q5",
      acuityOrder: 5,
      severity: "Self-care",
      questionTextEn: "No red flags and symptoms suitable for advice with callback precautions?",
      rationaleEn: "Self-care remains available only after high-acuity conditions are ruled out.",
      dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
      keywords: ["mild", "self-care", "advice"]
    }
  ]
};

const severityStyle: Record<Severity, string> = {
  Emergency: "border-rose-200 bg-rose-50 text-rose-700",
  Urgent: "border-amber-200 bg-amber-50 text-amber-700",
  Routine: "border-emerald-200 bg-emerald-50 text-emerald-700",
  "Self-care": "border-gray-200 bg-gray-50 text-gray-700"
};

function defaultQuestionsForPriority(priority: Severity): string[] {
  const match = fallbackProtocol.questions.find((question) => question.severity === priority);
  return match ? [match.id] : [];
}

const initialSuggestions: CopilotSuggestion[] = [
  {
    id: "s1",
    question: "Chest tightness and sweating detected in English transcript.",
    confidence: 94,
    proposed: "Yes",
    status: "pending"
  },
  {
    id: "s2",
    question: "Arabic transcript indicates no loss of consciousness.",
    confidence: 88,
    proposed: "No",
    status: "pending"
  },
  {
    id: "s3",
    question: "Outstation sickness validation should be attached to the encounter.",
    confidence: 81,
    proposed: "Yes",
    status: "pending"
  }
];

const severityRank: Record<Severity, number> = {
  "Self-care": 1,
  Routine: 2,
  Urgent: 3,
  Emergency: 4
};

function questionText(question: Question): string {
  return question.questionTextEn ?? question.text ?? "";
}

function questionRationale(question: Question): string {
  return question.rationaleEn ?? question.rationale ?? "";
}

function highestSeverity(selected: string[], transcript: string, questions: Question[]): Severity {
  const text = transcript.toLowerCase();
  let severity: Severity = "Self-care";

  for (const question of questions) {
    const selectedQuestion = selected.includes(question.id);
    const keywordHit = question.keywords.some((keyword) => text.includes(keyword));
    if ((selectedQuestion || keywordHit) && severityRank[question.severity] > severityRank[severity]) {
      severity = question.severity;
    }
  }

  return severity;
}

function localDecision(severity: Severity, ageYears: number, outstation: boolean): EvaluationDecision {
  if (severity === "Emergency" && ageYears < 18) {
    return {
      severity,
      dispositionCode: "SIDRA_PEDIATRIC_ED",
      destinationName: "Sidra Medicine Emergency Department",
      destinationRationale: "High-acuity pediatric presentation.",
      trace: [{ ruleId: "LOCAL_UI_PEDIATRIC_EMERGENCY", matched: true, rationale: "Age under 18 with emergency red flag." }]
    };
  }

  if (severity === "Emergency") {
    return {
      severity,
      dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
      destinationName: "Nearest HMC Emergency Department",
      destinationRationale: "High-acuity adult/general presentation.",
      trace: [{ ruleId: "LOCAL_UI_ADULT_EMERGENCY", matched: true, rationale: "Emergency red flag selected or detected." }]
    };
  }

  if (outstation) {
    return {
      severity: severityRank[severity] < severityRank.Urgent ? "Urgent" : severity,
      dispositionCode: "OUTSTATION_TELECONSULT_ESCALATION",
      destinationName: "IST teleconsult escalation",
      destinationRationale: "Outstation sick staff require coordinated remote review.",
      trace: [{ ruleId: "LOCAL_UI_OUTSTATION_GATE", matched: true, rationale: "Outstation context toggled." }]
    };
  }

  if (severity === "Urgent") {
    return {
      severity,
      dispositionCode: "HMC_URGENT_REVIEW",
      destinationName: "HMC urgent review pathway",
      destinationRationale: "Time-sensitive clinical review without emergency floor.",
      trace: [{ ruleId: "LOCAL_UI_URGENT_GATE", matched: true, rationale: "Urgent symptom criteria selected." }]
    };
  }

  if (severity === "Routine") {
    return {
      severity,
      dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT",
      destinationName: "PHCC urgent care or IST teleconsult",
      destinationRationale: "Low-acuity staff pathway.",
      trace: [{ ruleId: "LOCAL_UI_ROUTINE_GATE", matched: true, rationale: "Routine symptom criteria selected." }]
    };
  }

  return {
    severity,
    dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
    destinationName: "Self-care with callback precautions",
    destinationRationale: "No red flags selected.",
    trace: [{ ruleId: "LOCAL_UI_SELF_CARE_GATE", matched: true, rationale: "Checklist remains low acuity." }]
  };
}

export default function TriageWorkspace() {
  const [incomingCalls] = useState<IncomingCall[]>(initialIncomingCalls);
  const [activeCallId, setActiveCallId] = useState(initialIncomingCalls[0].id);
  const [completedCallIds, setCompletedCallIds] = useState<string[]>([]);
  const [staffId, setStaffId] = useState("IST-10001");
  const [profile, setProfile] = useState<StaffProfile | null>(demoProfile);
  const [selectedDependentId, setSelectedDependentId] = useState("");
  const [ageYears, setAgeYears] = useState(32);
  const [symptomSearch, setSymptomSearch] = useState("Chest tightness and sweating for more than one hour");
  const [englishTranscript, setEnglishTranscript] = useState(
    "Cabin crew reports sudden chest tightness with sweating for more than one hour."
  );
  const [arabicTranscript, setArabicTranscript] = useState(
    "طاقم المقصورة يبلغ عن ضيق مفاجئ في الصدر مع تعرق لمدة تزيد عن ساعة."
  );
  const [protocolResults, setProtocolResults] = useState<ProtocolSearchResult[]>([]);
  const [selectedProtocol, setSelectedProtocol] = useState<ProtocolDetail>(fallbackProtocol);
  const [protocolStatus, setProtocolStatus] = useState("Synthetic Phase 1 protocol loaded locally.");
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([fallbackProtocol.questions[0].id]);
  const [fitToFly, setFitToFly] = useState(true);
  const [outstation, setOutstation] = useState(false);
  const [vaccinationScreen, setVaccinationScreen] = useState(false);
  const [sicknessLeave, setSicknessLeave] = useState(true);
  const [suggestions, setSuggestions] = useState<CopilotSuggestion[]>(initialSuggestions);
  const [decision, setDecision] = useState<EvaluationDecision>(
    localDecision("Emergency", ageYears, outstation)
  );
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const [status, setStatus] = useState("Demo profile loaded. Backend validation will be used when available.");
  const [activeStep, setActiveStep] = useState<TriageStepId>("patient");
  const [highestUnlockedStep, setHighestUnlockedStep] = useState(1);
  const [generatedData, setGeneratedData] = useState<GeneratedDataSnapshot | null>(null);
  const [generatedDataStatus, setGeneratedDataStatus] = useState("Checking generated synthetic records.");

  const selectedDependent = profile?.dependents.find((dependent) => dependent.id === selectedDependentId);
  const activeStepIndex = workflowSteps.findIndex((step) => step.id === activeStep);
  const activeStepNumber = activeStepIndex + 1;
  const activeWorkflowStep = workflowSteps[activeStepIndex] ?? workflowSteps[0];
  const workflowProgress = Math.round(((highestUnlockedStep - 1) / (workflowSteps.length - 1)) * 100);
  const activeIncomingCall = incomingCalls.find((call) => call.id === activeCallId) ?? incomingCalls[0];
  const waitingCalls = incomingCalls.filter(
    (call) => call.id !== activeCallId && !completedCallIds.includes(call.id)
  );
  const activeCallCompleted = completedCallIds.includes(activeCallId);
  const queueLocked = highestUnlockedStep > 1 && !activeCallCompleted;
  const completedCallCount = completedCallIds.length;
  const waitingEmergencyCount = waitingCalls.filter((call) => call.priority === "Emergency").length;
  const longestWaitMinutes = waitingCalls.reduce((current, call) => Math.max(current, call.waitMinutes), 0);
  const activeQuestions = useMemo(() => {
    return [...selectedProtocol.questions].sort(
      (left, right) => (left.acuityOrder ?? 999) - (right.acuityOrder ?? 999)
    );
  }, [selectedProtocol]);

  useEffect(() => {
    const controller = new AbortController();
    const age = selectedDependent?.age ?? ageYears;
    const params = new URLSearchParams({
      q: symptomSearch,
      ageYears: String(age),
      mode: "both",
      limit: "5"
    });

    async function loadProtocol() {
      try {
        const searchResponse = await fetch(`${apiBase}/api/v1/protocols/search?${params.toString()}`, {
          signal: controller.signal
        });
        if (!searchResponse.ok) {
          throw new Error("Protocol search failed.");
        }

        const searchPayload = (await searchResponse.json()) as {
          results: ProtocolSearchResult[];
          release: { version: string };
        };
        setProtocolResults(searchPayload.results);

        const topMatch = searchPayload.results[0];
        if (!topMatch) {
          setSelectedProtocol(fallbackProtocol);
          setProtocolStatus("No API protocol match. Using local fallback checklist.");
          return;
        }

        const detailResponse = await fetch(`${apiBase}/api/v1/protocols/${topMatch.id}`, {
          signal: controller.signal
        });
        if (!detailResponse.ok) {
          throw new Error("Protocol detail failed.");
        }

        const detailPayload = (await detailResponse.json()) as {
          release: { version: string };
          protocol: Omit<ProtocolDetail, "releaseVersion">;
        };
        const nextProtocol = {
          ...detailPayload.protocol,
          releaseVersion: detailPayload.release.version
        };
        setSelectedProtocol(nextProtocol);
        setSelectedQuestions((current) => {
          const validIds = new Set(nextProtocol.questions.map((question) => question.id));
          return current.filter((questionId) => validIds.has(questionId));
        });
        setProtocolStatus(`Protocol loaded from API release ${detailPayload.release.version}.`);
      } catch {
        if (controller.signal.aborted) {
          return;
        }

        setProtocolResults([]);
        setSelectedProtocol(fallbackProtocol);
        setProtocolStatus("API not available. Using local synthetic Phase 1 checklist.");
      }
    }

    const timeout = window.setTimeout(loadProtocol, 200);
    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [ageYears, selectedDependent?.age, symptomSearch]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadGeneratedData() {
      try {
        const response = await fetch(`${apiBase}/api/v1/simulation/generated`, {
          signal: controller.signal
        });
        if (!response.ok) {
          throw new Error("Generated-data endpoint returned an error.");
        }

        const payload = (await response.json()) as GeneratedDataSnapshot;
        setGeneratedData(payload);
        setGeneratedDataStatus(
          payload.available
            ? `Loaded ${payload.activeRun?.name ?? "generated synthetic run"}.`
            : payload.message ?? "No generated synthetic records found."
        );
      } catch {
        if (!controller.signal.aborted) {
          setGeneratedData(null);
          setGeneratedDataStatus("Generated records are on disk, but this running API does not expose them yet.");
        }
      }
    }

    loadGeneratedData();
    return () => controller.abort();
  }, []);

  const filteredQuestions = useMemo(() => {
    return activeQuestions;
  }, [activeQuestions]);

  const currentSeverity = useMemo(() => {
    return highestSeverity(selectedQuestions, `${symptomSearch} ${englishTranscript}`, activeQuestions);
  }, [activeQuestions, englishTranscript, selectedQuestions, symptomSearch]);

  const redFlagHits = useMemo(() => {
    const text = `${symptomSearch} ${englishTranscript}`.toLowerCase();
    return activeQuestions
      .filter((question) => question.severity === "Emergency" || question.redFlag)
      .flatMap((question) => question.keywords)
      .filter((keyword) => text.includes(keyword));
  }, [activeQuestions, englishTranscript, symptomSearch]);

  const patientSummary = selectedDependent
    ? `${selectedDependent.relationshipType} dependent`
    : profile?.jobTitle ?? "Staff member";
  const patientAge = selectedDependent?.age ?? ageYears;
  const acceptedSuggestionCount = suggestions.filter((item) => item.status === "accepted").length;
  const aviationFlags = [
    fitToFly ? "Fit-to-fly" : null,
    outstation ? "Outstation" : null,
    sicknessLeave ? "Sickness validation" : null,
    vaccinationScreen ? "Vaccination reaction" : null
  ].filter(Boolean) as string[];

  const sbarText = useMemo(() => {
    const patient = selectedDependent
      ? `${selectedDependent.relationshipType} dependent, age ${selectedDependent.age}`
      : `${profile?.jobTitle ?? "Staff member"} ${profile?.istStaffId ?? staffId}`;
    return [
      "IST Tele-Triage SBAR",
      `S: ${patient} reports ${englishTranscript}`,
      `B: Department ${profile?.department ?? "pending"}; insurance ${profile?.insuranceEligibilityStatus ?? "pending"}; aviation context ${fitToFly ? "fit-to-fly review" : "standard triage"}${outstation ? ", outstation" : ""}.`,
      `A: ${decision.severity} safety floor. Disposition ${decision.dispositionCode}.`,
      `R: ${decision.destinationName}. ${decision.destinationRationale}`
    ].join("\n");
  }, [decision, englishTranscript, fitToFly, outstation, profile, selectedDependent, staffId]);

  async function validateStaff() {
    try {
      const response = await fetch(`${apiBase}/api/v1/staff/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ istStaffId: staffId })
      });

      if (!response.ok) {
        throw new Error("Staff validation endpoint returned an error.");
      }

      const payload = (await response.json()) as { profile?: StaffProfile };
      if (payload.profile) {
        setProfile(payload.profile);
        setStatus("Staff validated through API.");
      }
    } catch {
      setProfile({ ...demoProfile, istStaffId: staffId });
      setStatus("API not available. Continuing with demo HRMS profile.");
    }
  }

  function toggleQuestion(questionId: string) {
    setSelectedQuestions((current) =>
      current.includes(questionId)
        ? current.filter((item) => item !== questionId)
        : [...current, questionId]
    );
  }

  function setSuggestionStatus(id: string, nextStatus: CopilotSuggestion["status"]) {
    setSuggestions((current) =>
      current.map((suggestion) =>
        suggestion.id === id ? { ...suggestion, status: nextStatus } : suggestion
      )
    );
  }

  async function finalizePlan() {
    const local = localDecision(currentSeverity, selectedDependent?.age ?? ageYears, outstation);

    try {
      const response = await fetch(`${apiBase}/api/v1/triage/encounters/evaluate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          istStaffId: staffId,
          dependentId: selectedDependentId || undefined,
          nurseId: "demo-nurse",
          protocolId: selectedProtocol.id,
          selectedQuestionIds: selectedQuestions,
          aiRecommendationSeverity: currentSeverity === "Emergency" ? "Routine" : currentSeverity,
          symptoms: {
            chiefComplaint: symptomSearch,
            narrative: englishTranscript,
            language: "en",
            ageYears: selectedDependent?.age ?? ageYears,
            durationMinutes: symptomSearch.toLowerCase().includes("hour") ? 75 : 20,
            redFlags: redFlagHits
          },
          aviationContext: {
            crewRole: fitToFly ? "cabin_crew" : "other",
            onDuty: fitToFly,
            outstation,
            sicknessLeaveRequested: sicknessLeave,
            recentVaccinationHours: vaccinationScreen ? 24 : undefined
          }
        })
      });

      if (!response.ok) {
        throw new Error("Evaluation endpoint returned an error.");
      }

      const payload = (await response.json()) as { decision: EvaluationDecision };
      setDecision(payload.decision);
      setStatus("Disposition generated through API rules wrapper.");
    } catch {
      setDecision(local);
      setStatus("API not available. Generated disposition with local UI rules.");
    }
  }

  async function copySbar() {
    try {
      await navigator.clipboard.writeText(sbarText);
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }

    window.setTimeout(() => setCopyState("idle"), 2200);
  }

  function takeIncomingCall(call: IncomingCall) {
    setActiveCallId(call.id);
    setCompletedCallIds((current) => current.filter((callId) => callId !== call.id));
    setStaffId(call.staffId);
    setProfile(call.profile);
    setSelectedDependentId(call.dependentId ?? "");
    setAgeYears(call.ageYears);
    setSymptomSearch(call.complaint);
    setEnglishTranscript(call.transcriptEn);
    setArabicTranscript(call.transcriptAr);
    setSelectedProtocol(fallbackProtocol);
    setProtocolResults([]);
    setProtocolStatus("Call claimed. Searching protocol content for this complaint.");
    setSelectedQuestions(defaultQuestionsForPriority(call.priority));
    setFitToFly(call.fitToFly);
    setOutstation(call.outstation);
    setSicknessLeave(call.sicknessLeave);
    setVaccinationScreen(call.vaccinationScreen);
    setSuggestions(initialSuggestions);
    setDecision(localDecision(call.priority, call.ageYears, call.outstation));
    setCopyState("idle");
    setStatus(`${call.queueNumber} claimed from ${call.channel} queue. Validate staff to continue.`);
    setActiveStep("patient");
    setHighestUnlockedStep(1);
  }

  function openWorkflowStep(stepId: TriageStepId) {
    const stepIndex = workflowSteps.findIndex((step) => step.id === stepId);
    if (stepIndex + 1 <= highestUnlockedStep) {
      setActiveStep(stepId);
    }
  }

  function enableNextStep(currentStepId: TriageStepId) {
    const currentIndex = workflowSteps.findIndex((step) => step.id === currentStepId);
    const nextStep = workflowSteps[currentIndex + 1];
    setHighestUnlockedStep((current) => Math.max(current, currentIndex + 2));
    if (nextStep) {
      setActiveStep(nextStep.id);
    }
  }

  async function validateAndEnablePresentation() {
    await validateStaff();
    enableNextStep("patient");
  }

  async function finalizeAndComplete() {
    await finalizePlan();
    setCompletedCallIds((current) =>
      current.includes(activeCallId) ? current : [...current, activeCallId]
    );
    setHighestUnlockedStep(workflowSteps.length);
    setActiveStep("disposition");
  }

  return (
    <div className="triage-flow-shell">
      <section className="triage-call-pipeline clinical-card" aria-label="Incoming call pipeline">
        <div className="triage-call-header">
          <div>
            <span className="tag-label">INCOMING CALL PIPELINE</span>
            <h2>Call queue for triage nurses</h2>
            <p>Claim one waiting call, complete the triage workflow, then return to the queue.</p>
          </div>
          <div className="triage-call-metrics" aria-label="Queue metrics">
            <span>
              <strong>{waitingCalls.length}</strong>
              waiting
            </span>
            <span>
              <strong>{waitingEmergencyCount}</strong>
              emergency
            </span>
            <span>
              <strong>{longestWaitMinutes}m</strong>
              longest wait
            </span>
            <span>
              <strong>{completedCallCount}</strong>
              completed
            </span>
          </div>
        </div>

        <div className="triage-call-grid">
          <div className={`triage-active-call border ${severityStyle[activeIncomingCall.priority]}`}>
            <div className="triage-call-title-row">
              <PhoneCall className="h-4 w-4" />
              <span>{activeCallCompleted ? "Completed call" : "Active call"}</span>
              <strong>{activeIncomingCall.queueNumber}</strong>
            </div>
            <h3>{activeIncomingCall.patientLabel}</h3>
            <p>{activeIncomingCall.complaint}</p>
            <div className="triage-call-tags">
              <span className="status-pill bg-white text-ist-blue">{activeIncomingCall.staffId}</span>
              <span className="status-pill bg-white text-gray-700">{activeIncomingCall.channel}</span>
              <span className="status-pill bg-white text-gray-700">{activeIncomingCall.waitMinutes}m wait</span>
              <span className={`status-pill border ${severityStyle[activeIncomingCall.priority]}`}>
                {activeIncomingCall.priority}
              </span>
            </div>
          </div>

          <div className="triage-waiting-calls" aria-label="Waiting calls">
            {waitingCalls.map((call) => (
              <button
                key={call.id}
                type="button"
                className="triage-waiting-call"
                disabled={queueLocked}
                onClick={() => takeIncomingCall(call)}
                title={queueLocked ? "Finish the active call before claiming another call." : "Claim this call"}
              >
                <span className={`triage-call-priority-dot triage-call-priority-${call.priority.toLowerCase().replace("-", "")}`} />
                <span>
                  <strong>{call.queueNumber}</strong>
                  <small>
                    {call.staffId} | {call.patientLabel}
                  </small>
                </span>
                <span className="triage-call-wait">
                  <Clock className="h-3.5 w-3.5" />
                  {call.waitMinutes}m
                </span>
              </button>
            ))}
            {waitingCalls.length === 0 && (
              <div className="triage-empty-queue">No waiting calls. Active call can be finalized and copied.</div>
            )}
          </div>
        </div>
      </section>

      <section className="synthetic-data-panel clinical-card" aria-label="Synthetic data records">
        <div className="synthetic-data-header">
          <div className="synthetic-data-heading">
            <span className="synthetic-data-icon">
              <Database className="h-5 w-5" />
            </span>
            <div>
              <span className="tag-label">SYNTHETIC DATA RECORDS</span>
              <h2>Generated simulation dataset</h2>
              <p>{generatedDataStatus}</p>
            </div>
          </div>
          <div className="synthetic-data-run">
            <span>Active run</span>
            <strong>{generatedData?.activeRun?.name ?? "Not loaded"}</strong>
            <small>{generatedData?.activeRun?.lastModifiedIso ?? "Start API to expose generated files."}</small>
          </div>
        </div>

        <div className="synthetic-data-metrics">
          <span>
            <strong>{generatedData?.manifest?.recordCount ?? 0}</strong>
            encounters
          </span>
          <span>
            <strong>{generatedData?.manifest?.auditRecordCount ?? 0}</strong>
            audit rows
          </span>
          <span>
            <strong>{Object.keys(generatedData?.manifest?.counts?.by_profile ?? {}).length}</strong>
            profiles
          </span>
          <span>
            <strong>{generatedData?.manifest?.regionalContext?.enabled ? "On" : "Off"}</strong>
            regional context
          </span>
        </div>

        {generatedData?.available && (
          <div className="synthetic-data-grid">
            <div className="synthetic-data-card">
              <span className="field-label">Profile distribution</span>
              <div className="synthetic-data-list">
                {Object.entries(generatedData.manifest?.counts?.by_profile ?? {})
                  .slice(0, 6)
                  .map(([label, count]) => (
                    <span key={label}>
                      <strong>{label.replace(/_/g, " ")}</strong>
                      <small>{count}</small>
                    </span>
                  ))}
              </div>
            </div>

            <div className="synthetic-data-card">
              <span className="field-label">Severity and routing</span>
              <div className="synthetic-data-list">
                {Object.entries(generatedData.manifest?.counts?.by_severity ?? {}).map(([label, count]) => (
                  <span key={label}>
                    <strong>{label}</strong>
                    <small>{count}</small>
                  </span>
                ))}
              </div>
            </div>

            <div className="synthetic-data-card synthetic-data-card-wide">
              <span className="field-label">Sample records</span>
              <div className="synthetic-sample-list">
                {(generatedData.samples?.encounters ?? []).map((sample) => (
                  <article key={sample.encounter_id} className="synthetic-sample-row">
                    <div>
                      <strong>{sample.profile.replace(/_/g, " ")}</strong>
                      <span>
                        {sample.severity} | {sample.route}
                      </span>
                    </div>
                    <div className="synthetic-sample-tags">
                      <span>{sample.biological_sex ?? "UNKNOWN"}</span>
                      <span>{String(sample.patient_context?.context_group ?? "general")}</span>
                      <span>{sample.regional_context?.climate?.season ?? "season pending"}</span>
                      <span>Heat {sample.regional_context?.climate?.heat_risk ?? "n/a"}</span>
                      <span>Dust {sample.regional_context?.climate?.dust_risk ?? "n/a"}</span>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="synthetic-data-files">
          <span>Manifest: {generatedData?.files?.manifest ?? "not exposed"}</span>
          <span>Encounters: {generatedData?.files?.encounters ?? "not exposed"}</span>
          <span>Training: {generatedData?.files?.training ?? "not exposed"}</span>
        </div>
      </section>

      <section className="triage-compact-stagebar clinical-card" aria-label="Triage workflow status">
        <div className="triage-stage-meter">
          <div className="triage-stage-row">
            <span>
              Stage {activeStepNumber} of {workflowSteps.length}: {activeWorkflowStep.title}
            </span>
            <strong>{workflowProgress}%</strong>
          </div>
          <div className="triage-progress-track">
            <span style={{ width: `${workflowProgress}%` }} />
          </div>
        </div>
        <p>Rules-first triage. Nurse review required before disposition or employee communication.</p>
      </section>

      <nav className="triage-step-nav" aria-label="Triage workflow stages">
        {workflowSteps.map((step, index) => {
          const stepNumber = index + 1;
          const locked = stepNumber > highestUnlockedStep;
          const active = step.id === activeStep;
          const complete = stepNumber < highestUnlockedStep;
          const statusLabel = locked ? "Locked" : active ? "In progress" : complete ? "Complete" : "Enabled";

          return (
            <button
              key={step.id}
              type="button"
              className={`triage-step-button ${active ? "triage-step-button-active" : ""} ${
                complete ? "triage-step-button-complete" : ""
              } ${locked ? "triage-step-button-locked" : ""}`}
              disabled={locked}
              onClick={() => openWorkflowStep(step.id)}
              aria-current={active ? "step" : undefined}
            >
              <span className="triage-step-number">
                {complete ? <Check className="h-4 w-4" /> : stepNumber}
              </span>
              <span className="triage-step-copy">
                <strong>{step.title}</strong>
                <small>{statusLabel}</small>
              </span>
            </button>
          );
        })}
      </nav>

      <div className="triage-flow-grid">
        <section className="triage-step-panel clinical-card">
          <div className="triage-step-panel-header">
            <div>
              <span className="tag-label">
                STAGE {activeStepNumber} OF {workflowSteps.length}
              </span>
              <h2>{activeWorkflowStep.title}</h2>
              <p>{activeWorkflowStep.subtitle}</p>
            </div>
            <span className={`status-pill border ${severityStyle[currentSeverity]}`}>{currentSeverity}</span>
          </div>

          {activeStep === "patient" && (
            <div className="triage-stage-content">
              <div className="triage-control-row">
                <label className="triage-field-block" htmlFor="staffId">
                  <span className="field-label">IST staff ID</span>
                  <input
                    id="staffId"
                    value={staffId}
                    onChange={(event) => setStaffId(event.target.value)}
                    className="input-control"
                  />
                </label>
                <button type="button" onClick={validateAndEnablePresentation} className="primary-button">
                  <BadgeCheck className="h-4 w-4" />
                  Validate & enable
                </button>
              </div>

              <div className="triage-person-strip">
                <UserCheck className="h-5 w-5" />
                <div>
                  <strong>{profile?.jobTitle ?? "Pending validation"}</strong>
                  <span>{profile?.department ?? "Department will appear after validation"}</span>
                </div>
                <span className="status-pill bg-ist-cream text-ist-blue">
                  {profile?.dutyStatus ?? "unknown"}
                </span>
                <span className="status-pill bg-gray-100 text-gray-700">
                  {profile?.insuranceEligibilityStatus ?? "insurance pending"}
                </span>
              </div>

              <div className="triage-two-column">
                <label className="triage-field-block" htmlFor="dependent">
                  <span className="field-label">Patient</span>
                  <select
                    id="dependent"
                    value={selectedDependentId}
                    onChange={(event) => setSelectedDependentId(event.target.value)}
                    className="input-control"
                  >
                    <option value="">Staff member</option>
                    {profile?.dependents.map((dependent) => (
                      <option key={dependent.id} value={dependent.id}>
                        {dependent.relationshipType} dependent, age {dependent.age}
                      </option>
                    ))}
                  </select>
                </label>

                {!selectedDependent && (
                  <label className="triage-field-block" htmlFor="ageYears">
                    <span className="field-label">Staff age</span>
                    <input
                      id="ageYears"
                      type="number"
                      min={0}
                      max={120}
                      value={ageYears}
                      onChange={(event) => setAgeYears(Number(event.target.value))}
                      className="input-control"
                    />
                  </label>
                )}
              </div>

              <div className="triage-evidence-box">
                <strong>Validation status</strong>
                <span>{status}</span>
              </div>
            </div>
          )}

          {activeStep === "presentation" && (
            <div className="triage-stage-content">
              <label className="triage-search-field" htmlFor="protocolSearch">
                <Search className="pointer-events-none h-5 w-5" />
                <input
                  id="protocolSearch"
                  value={symptomSearch}
                  onChange={(event) => setSymptomSearch(event.target.value)}
                  className="input-control"
                  placeholder="Search symptoms or protocols"
                />
              </label>

              <div className="triage-protocol-summary">
                <div>
                  <span className="field-label">Matched protocol</span>
                  <strong>{selectedProtocol.titleEn}</strong>
                  <p>{selectedProtocol.clinicalDefinitionEn}</p>
                </div>
                <span className="status-pill bg-ist-cream text-ist-blue">{selectedProtocol.releaseVersion}</span>
              </div>

              <div className="triage-two-column">
                <label className="triage-field-block">
                  <span className="field-label">English transcript</span>
                  <textarea
                    value={englishTranscript}
                    onChange={(event) => setEnglishTranscript(event.target.value)}
                    className="textarea-control"
                  />
                </label>
                <label className="triage-field-block">
                  <span className="field-label">Arabic transcript</span>
                  <textarea
                    value={arabicTranscript}
                    onChange={(event) => setArabicTranscript(event.target.value)}
                    className="textarea-control text-right"
                    dir="rtl"
                  />
                </label>
              </div>

              <div className="triage-choice-grid">
                <ToggleCard checked={fitToFly} onChange={setFitToFly} icon={Plane} label="Fit-to-Fly validation" />
                <ToggleCard checked={outstation} onChange={setOutstation} icon={MapPin} label="Outstation sick leave" />
                <ToggleCard checked={sicknessLeave} onChange={setSicknessLeave} icon={FileText} label="Sickness validation" />
                <ToggleCard
                  checked={vaccinationScreen}
                  onChange={setVaccinationScreen}
                  icon={Syringe}
                  label="Vaccination reaction"
                />
              </div>

              <div className="triage-button-row">
                <button type="button" className="primary-button" onClick={() => enableNextStep("presentation")}>
                  Enable acuity checklist
                </button>
                <span>{protocolStatus}</span>
              </div>
            </div>
          )}

          {activeStep === "acuity" && (
            <div className="triage-stage-content">
              <div className="triage-evidence-box triage-evidence-alert">
                <ShieldAlert className="h-4 w-4" />
                <div>
                  <strong>Current safety floor: {currentSeverity}</strong>
                  <span>Checklist order stays high-acuity first so red flags are never buried below routine care.</span>
                </div>
              </div>

              <div className="triage-question-list">
                {filteredQuestions.map((question) => {
                  const checked = selectedQuestions.includes(question.id);
                  return (
                    <button
                      key={question.id}
                      type="button"
                      className={`question-row ${checked ? "question-row-active" : ""}`}
                      onClick={() => toggleQuestion(question.id)}
                    >
                      <span className={`status-pill border ${severityStyle[question.severity]}`}>
                        {question.severity}
                      </span>
                      <span className="min-w-0 flex-1 text-left">
                        <span className="block text-sm font-bold text-ist-blue">{questionText(question)}</span>
                        <span className="mt-1 block text-sm text-slate-500">{questionRationale(question)}</span>
                      </span>
                      <span className={`check-target ${checked ? "check-target-active" : ""}`}>
                        {checked && <Check className="h-4 w-4" />}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="triage-red-flags">
                <span className="field-label">Red flag highlights</span>
                <div>
                  {redFlagHits.length > 0 ? (
                    [...new Set(redFlagHits)].map((hit) => (
                      <span key={hit} className="status-pill bg-white text-rose-700">
                        {hit}
                      </span>
                    ))
                  ) : (
                    <span>No emergency keywords detected.</span>
                  )}
                </div>
              </div>

              <div className="triage-button-row">
                <button type="button" className="primary-button" onClick={() => enableNextStep("acuity")}>
                  Enable nurse review
                </button>
                <span>{selectedQuestions.length} checklist item(s) selected</span>
              </div>
            </div>
          )}

          {activeStep === "copilot" && (
            <div className="triage-stage-content">
              <div className="triage-evidence-box">
                <Languages className="h-4 w-4" />
                <div>
                  <strong>AI assistance remains advisory</strong>
                  <span>The message and disposition move forward only after nurse review and approval.</span>
                </div>
              </div>

              <div className="triage-suggestion-list">
                {suggestions.map((suggestion) => (
                  <div key={suggestion.id} className="triage-suggestion-row">
                    <span className="triage-suggestion-icon">
                      <Bot className="h-4 w-4" />
                    </span>
                    <div>
                      <strong>{suggestion.question}</strong>
                      <span>
                        {suggestion.confidence}% confidence, proposed {suggestion.proposed}
                      </span>
                    </div>
                    <div className="triage-suggestion-actions">
                      <button
                        type="button"
                        className={`secondary-button ${
                          suggestion.status === "accepted" ? "border-ist-gold bg-ist-cream text-ist-blue" : ""
                        }`}
                        onClick={() => setSuggestionStatus(suggestion.id, "accepted")}
                      >
                        <Check className="h-4 w-4" />
                        Accept
                      </button>
                      <button
                        type="button"
                        className={`secondary-button ${
                          suggestion.status === "rejected" ? "border-rose-200 bg-rose-50 text-rose-700" : ""
                        }`}
                        onClick={() => setSuggestionStatus(suggestion.id, "rejected")}
                      >
                        <XCircle className="h-4 w-4" />
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="triage-button-row">
                <button type="button" className="primary-button" onClick={() => enableNextStep("copilot")}>
                  Enable disposition & SBAR
                </button>
                <span>{acceptedSuggestionCount} copilot suggestion(s) accepted</span>
              </div>
            </div>
          )}

          {activeStep === "disposition" && (
            <div className="triage-stage-content">
              <div className={`triage-final-card border ${severityStyle[decision.severity]}`}>
                <span>Final disposition</span>
                <strong>{decision.severity}</strong>
                <p>{decision.destinationName}</p>
                <small>{decision.destinationRationale}</small>
              </div>

              <div className="triage-sbar-preview">
                <div>
                  <ClipboardCheck className="h-4 w-4" />
                  <strong>SBAR/SOAP preview</strong>
                </div>
                <pre>{sbarText}</pre>
              </div>

              <div className="triage-button-row">
                <button type="button" className="primary-button" onClick={finalizeAndComplete}>
                  <Sparkles className="h-4 w-4" />
                  Finalize Plan
                </button>
                <button type="button" className="secondary-button" onClick={copySbar}>
                  <Copy className="h-4 w-4" />
                  {copyState === "copied" ? "Copied" : copyState === "failed" ? "Copy blocked" : "Copy SBAR Note"}
                </button>
              </div>
            </div>
          )}
        </section>

        <aside className="triage-decision-panel clinical-card">
          <div>
            <span className="tag-label">CURRENT PROCESS STAGE</span>
            <h3>{activeWorkflowStep.title}</h3>
            <p>
              Stage {activeStepNumber} of {workflowSteps.length}. Next actions stay gated until this stage is enabled
              or completed.
            </p>
          </div>

          <div className="triage-active-case">
            <span className="field-label">Active case</span>
            <strong>{profile?.istStaffId ?? staffId}</strong>
            <p>
              {patientSummary} | Age {patientAge} | {profile?.department ?? "Pending department"}
            </p>
            <div>
              <span className="status-pill bg-ist-cream text-ist-blue">
                {profile?.dutyStatus ?? "unknown"}
              </span>
              <span className="status-pill bg-gray-100 text-gray-700">
                {profile?.insuranceEligibilityStatus ?? "insurance pending"}
              </span>
            </div>
          </div>

          <div className={`triage-side-disposition border ${severityStyle[currentSeverity]}`}>
            <span>Safety floor</span>
            <strong>{currentSeverity}</strong>
            <p>{decision.destinationName}</p>
          </div>

          <div className="triage-side-list">
            <div>
              <span>Protocol</span>
              <strong>{selectedProtocol.titleEn}</strong>
            </div>
            <div>
              <span>Aviation context</span>
              <strong>{aviationFlags.length > 0 ? aviationFlags.join(", ") : "None selected"}</strong>
            </div>
            <div>
              <span>Why this route</span>
              <strong>{decision.trace[0]?.rationale ?? "Awaiting final route evaluation."}</strong>
            </div>
          </div>

          <div className="triage-side-actions">
            <button type="button" className="primary-button" onClick={finalizeAndComplete}>
              <Sparkles className="h-4 w-4" />
              Finalize route
            </button>
            <button type="button" className="secondary-button" onClick={() => openWorkflowStep("disposition")}>
              View SBAR
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}

function ToggleCard({
  checked,
  onChange,
  icon: Icon,
  label
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  icon: typeof Plane;
  label: string;
}) {
  return (
    <label className={`toggle-card ${checked ? "toggle-card-active" : ""}`}>
      <span className="flex items-center gap-3">
        <Icon className="h-4 w-4" />
        <span>{label}</span>
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 rounded border-gray-300 text-ist-blue focus:ring-ist-gold"
      />
    </label>
  );
}
