import {
  AlertTriangle,
  BadgeCheck,
  Bot,
  Check,
  ClipboardCheck,
  Copy,
  FileText,
  Languages,
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

const apiBase = import.meta.env.VITE_API_BASE_URL || "";

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

  const selectedDependent = profile?.dependents.find((dependent) => dependent.id === selectedDependentId);
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
          const retained = current.filter((questionId) => validIds.has(questionId));
          const firstQuestionId = nextProtocol.questions[0]?.id;
          return retained.length > 0 ? retained : firstQuestionId ? [firstQuestionId] : [];
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

  return (
    <div className="grid gap-5 2xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className="space-y-5">
        <div className="grid gap-5 xl:grid-cols-[380px_minmax(0,1fr)]">
          <div className="clinical-card p-5">
            <div className="section-heading">
              <UserCheck className="h-5 w-5 text-ist-gold" />
              Caller & patient ingestion
            </div>

            <div className="mt-5 space-y-4">
              <label className="field-label" htmlFor="staffId">
                IST staff ID
              </label>
              <div className="flex gap-2">
                <input
                  id="staffId"
                  value={staffId}
                  onChange={(event) => setStaffId(event.target.value)}
                  className="input-control"
                />
                <button type="button" onClick={validateStaff} className="primary-button">
                  <BadgeCheck className="h-4 w-4" />
                  Validate
                </button>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm font-extrabold text-ist-blue">
                  {profile?.jobTitle ?? "Pending validation"}
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  {profile?.department ?? "Department will appear after validation"}
                </p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium">
                  <span className="status-pill bg-ist-cream text-ist-blue">
                    {profile?.dutyStatus ?? "unknown"}
                  </span>
                  <span className="status-pill bg-gray-100 text-gray-700">
                    {profile?.insuranceEligibilityStatus ?? "insurance pending"}
                  </span>
                </div>
              </div>

              <div>
                <label className="field-label" htmlFor="dependent">
                  Patient
                </label>
                <select
                  id="dependent"
                  value={selectedDependentId}
                  onChange={(event) => setSelectedDependentId(event.target.value)}
                  className="input-control mt-2"
                >
                  <option value="">Staff member</option>
                  {profile?.dependents.map((dependent) => (
                    <option key={dependent.id} value={dependent.id}>
                      {dependent.relationshipType} dependent, age {dependent.age}
                    </option>
                  ))}
                </select>
              </div>

              {!selectedDependent && (
                <div>
                  <label className="field-label" htmlFor="ageYears">
                    Staff age
                  </label>
                  <input
                    id="ageYears"
                    type="number"
                    min={0}
                    max={120}
                    value={ageYears}
                    onChange={(event) => setAgeYears(Number(event.target.value))}
                    className="input-control mt-2"
                  />
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <ToggleCard
                  checked={fitToFly}
                  onChange={setFitToFly}
                  icon={Plane}
                  label="Fit-to-Fly validation"
                />
                <ToggleCard
                  checked={outstation}
                  onChange={setOutstation}
                  icon={MapPin}
                  label="Outstation sick leave"
                />
                <ToggleCard
                  checked={sicknessLeave}
                  onChange={setSicknessLeave}
                  icon={FileText}
                  label="Sickness validation"
                />
                <ToggleCard
                  checked={vaccinationScreen}
                  onChange={setVaccinationScreen}
                  icon={Syringe}
                  label="Vaccination reaction"
                />
              </div>

              <p className="rounded-xl border border-ist-gold/20 bg-ist-cream px-3 py-2 text-sm font-medium text-ist-blue">{status}</p>
            </div>
          </div>

          <div className="clinical-card p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="section-heading">
                  <Stethoscope className="h-5 w-5 text-ist-gold" />
                  Interactive triage protocol
                </div>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">
                  Checklist order stays high-acuity first so red flags are never buried below routine care.
                </p>
              </div>
              <span className={`status-pill border ${severityStyle[currentSeverity]}`}>
                {currentSeverity}
              </span>
            </div>

            <label className="relative mt-5 block" htmlFor="protocolSearch">
              <Search className="pointer-events-none absolute left-3 top-3 h-5 w-5 text-slate-400" />
              <input
                id="protocolSearch"
                value={symptomSearch}
                onChange={(event) => setSymptomSearch(event.target.value)}
                className="input-control pl-10"
                placeholder="Search symptoms or protocols"
              />
            </label>

            <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    Matched protocol
                  </p>
                  <p className="mt-1 text-sm font-extrabold text-ist-blue">{selectedProtocol.titleEn}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    {selectedProtocol.clinicalDefinitionEn}
                  </p>
                </div>
                <span className="status-pill bg-white text-ist-blue">
                  {selectedProtocol.releaseVersion}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="status-pill bg-ist-cream text-ist-blue">{protocolStatus}</span>
                {protocolResults[0]?.matchedTerms.slice(0, 3).map((term) => (
                  <span key={term} className="status-pill bg-white text-slate-600">
                    {term}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-4 grid gap-3">
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

            <div className="mt-4 rounded-2xl border border-rose-100 bg-rose-50 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-rose-700">
                <ShieldAlert className="h-4 w-4" />
                Red flag highlights
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {redFlagHits.length > 0 ? (
                  [...new Set(redFlagHits)].map((hit) => (
                    <span key={hit} className="status-pill bg-white text-rose-700">
                      {hit}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-slate-500">No emergency keywords detected.</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
          <div className="clinical-card p-5">
            <div className="section-heading">
              <Languages className="h-5 w-5 text-ist-gold" />
              Bilingual copilot helper
            </div>
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <label className="block">
                <span className="field-label">English transcript</span>
                <textarea
                  value={englishTranscript}
                  onChange={(event) => setEnglishTranscript(event.target.value)}
                  className="textarea-control mt-2 min-h-32"
                />
              </label>
              <label className="block">
                <span className="field-label">Arabic transcript</span>
                <textarea
                  value={arabicTranscript}
                  onChange={(event) => setArabicTranscript(event.target.value)}
                  className="textarea-control mt-2 min-h-32 text-right"
                  dir="rtl"
                />
              </label>
            </div>

            <div className="mt-5 grid gap-3">
              {suggestions.map((suggestion) => (
                <div key={suggestion.id} className="rounded-2xl border border-gray-200 bg-white p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center">
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      <span className="mt-1 rounded-xl bg-ist-cream p-2 text-ist-gold">
                        <Bot className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="text-sm font-bold text-ist-blue">{suggestion.question}</p>
                        <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                          {suggestion.confidence}% confidence, proposed {suggestion.proposed}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
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
                </div>
              ))}
            </div>
          </div>

          <div className="clinical-card p-5">
            <div className="section-heading">
              <ClipboardCheck className="h-5 w-5 text-ist-gold" />
              Finalized plan & action
            </div>
            <div className={`mt-5 rounded-2xl border p-4 ${severityStyle[decision.severity]}`}>
              <p className="text-xs font-semibold uppercase tracking-[0.14em]">Final disposition</p>
              <h3 className="mt-2 font-display text-2xl font-extrabold">{decision.severity}</h3>
              <p className="mt-2 text-sm font-bold">{decision.destinationName}</p>
              <p className="mt-1 text-sm opacity-90">{decision.destinationRationale}</p>
            </div>

            <div className="mt-4 rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-sm font-bold text-ist-blue">SBAR/SOAP preview</p>
              <pre className="mt-3 max-h-56 overflow-auto whitespace-pre-wrap rounded-xl bg-white p-3 font-mono text-xs leading-6 text-gray-700">
                {sbarText}
              </pre>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
              <button type="button" className="primary-button justify-center" onClick={finalizePlan}>
                <Sparkles className="h-4 w-4" />
                Finalize Plan
              </button>
              <button type="button" className="secondary-button justify-center" onClick={copySbar}>
                <Copy className="h-4 w-4" />
                {copyState === "copied" ? "Copied" : copyState === "failed" ? "Copy blocked" : "Copy SBAR Note"}
              </button>
            </div>
          </div>
        </div>
      </section>

      <aside className="clinical-card h-fit p-5 2xl:sticky 2xl:top-28">
        <div className="section-heading">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          Clinical rationale drawer
        </div>
        <div className="mt-5 space-y-4">
          <ReferenceBlock
            title="Current safety floor"
            body={`${currentSeverity} based on selected checklist items and detected keywords.`}
          />
          <ReferenceBlock
            title="Medical references"
            body={`${selectedProtocol.titleEn} from Phase 1 content release ${selectedProtocol.releaseVersion}, plus aviation fit-to-fly review, outstation validation, sickness telemetry, and vaccination reaction screening.`}
          />
          <ReferenceBlock
            title="Note drafting"
            body={`${suggestions.filter((item) => item.status === "accepted").length} copilot suggestions accepted. SBAR preview is ready for clipboard handoff.`}
          />
          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <p className="text-sm font-bold text-ist-blue">Explainability trace</p>
            <div className="mt-3 space-y-2">
              {decision.trace.map((trace) => (
                <div key={trace.ruleId} className="rounded-xl bg-gray-50 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    {trace.ruleId}
                  </p>
                  <p className="mt-1 text-sm text-slate-700">{trace.rationale}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </aside>
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

function ReferenceBlock({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
      <p className="text-sm font-bold text-ist-blue">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
    </div>
  );
}
