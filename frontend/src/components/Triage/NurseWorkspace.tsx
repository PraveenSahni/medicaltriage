import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Copy,
  Database,
  FileText,
  Filter,
  PauseCircle,
  PhoneCall,
  Plane,
  Search,
  ShieldAlert,
  Stethoscope,
  TimerReset,
  UserRoundCheck,
  X
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { QueueClinicalStage, QueueItem } from "../../QueueContext";
import { useQueue } from "../../QueueContext";

type ConsciousLevel = "alert" | "voice" | "pain" | "unresponsive";
type Severity = "Emergency" | "Urgent" | "Routine" | "Self-care";
type Channel = "Phone" | "WhatsApp" | "Callback";
type PatientType = "Staff" | "Dependent";
type StageId = "intake" | "identity" | "symptoms" | "vitals" | "protocol" | "disposition" | "complete";

interface Card {
  id: string;
  istStaffId: string;
  dependentId?: string;
  patientName: string;
  patientType: PatientType;
  jobTitle: string;
  department: string;
  symptomTextRaw: string;
  age: number;
  biologicalSex: "female" | "male" | "other" | "unknown";
  maskedPatientId: string;
  queueWaitMinutes: number;
  channel: Channel;
  stationCode?: string;
  onDuty: boolean;
  outstation: boolean;
  crewCategory: "flight_deck" | "cabin_crew" | "ground_staff" | "dependent" | "other";
  vitals: {
    heartRate: number;
    respiratoryRate: number;
    spo2: number;
    temperature: number;
    consciousLevel: ConsciousLevel;
  };
}

type ApiScoreResult = {
  score: number;
  riskBand: "RED_ALERT" | "URGENT" | "CLINIC_REVIEW" | "HOMECARE";
  severity: "EMERGENCY" | "URGENT" | "ROUTINE" | "HOMECARE";
  dispositionCode: string;
  destinationName: string;
  routingRationale: string;
  redAlertTriggered: boolean;
  trace?: Array<{ ruleId: string; matched: boolean; rationale: string }>;
  patientAge?: {
    source: "staff" | "dependent";
    ageYears: number;
    ageMonths: number;
    calculatedFrom: string;
  };
};

type ScoreState =
  | { status: "idle" }
  | { status: "loading"; result?: ApiScoreResult }
  | { status: "ready"; result: ApiScoreResult; updatedAtIso: string }
  | { status: "error"; result?: ApiScoreResult; error: string };

type StaffIdentityState =
  | { status: "idle" }
  | { status: "loading" }
  | {
      status: "ready";
      valid: boolean;
      display: string;
      department?: string;
      jobTitle?: string;
      dependents: number;
    }
  | { status: "error"; error: string };

type ToastTone = "info" | "warning" | "success";

type Toast = {
  id: number;
  tone: ToastTone;
  message: string;
};

type SyntheticReviewRecord = {
  id: string;
  severity: Severity;
  role: string;
  ageGroup: "Pediatric" | "Adult" | "Older adult";
  patientType: PatientType;
  route: string;
  summary: string;
  tags: string[];
  raw: unknown;
};

const apiBase = import.meta.env.VITE_API_BASE_URL || "";

const stages: Array<{ id: StageId; label: string; shortLabel: string }> = [
  { id: "intake", label: "Intake", shortLabel: "1" },
  { id: "identity", label: "Identity", shortLabel: "2" },
  { id: "symptoms", label: "Symptoms", shortLabel: "3" },
  { id: "vitals", label: "Vitals", shortLabel: "4" },
  { id: "protocol", label: "Protocol", shortLabel: "5" },
  { id: "disposition", label: "Disposition", shortLabel: "6" },
  { id: "complete", label: "SBAR / Complete", shortLabel: "7" }
];

const queueStageToStepIndex: Record<QueueClinicalStage, number> = {
  INTAKE: 0,
  IDENTITY: 1,
  VITALS: 3,
  PROTOCOL: 4,
  DISPOSITION: 5,
  SBAR: 6
};

const initialCards: Card[] = [
  {
    id: "call-10001",
    istStaffId: "IST-10001",
    maskedPatientId: "IST-10***",
    patientName: "Staff member",
    patientType: "Staff",
    jobTitle: "Cabin Crew",
    department: "Flight Operations",
    symptomTextRaw: "Chest tightness and sweating before duty report.",
    age: 32,
    biologicalSex: "female",
    queueWaitMinutes: 4,
    channel: "Phone",
    stationCode: "DOH",
    onDuty: true,
    outstation: false,
    crewCategory: "cabin_crew",
    vitals: {
      heartRate: 135,
      respiratoryRate: 18,
      spo2: 91,
      temperature: 37.2,
      consciousLevel: "alert"
    }
  },
  {
    id: "call-10002",
    istStaffId: "IST-1001",
    dependentId: "dep_ist_1001_child_02",
    maskedPatientId: "DEP-42***",
    patientName: "Dependent child",
    patientType: "Dependent",
    jobTitle: "Dependent",
    department: "Family health",
    symptomTextRaw: "Fever with fast breathing reported by parent.",
    age: 3,
    biologicalSex: "male",
    queueWaitMinutes: 7,
    channel: "WhatsApp",
    onDuty: false,
    outstation: false,
    crewCategory: "dependent",
    vitals: {
      heartRate: 118,
      respiratoryRate: 42,
      spo2: 97,
      temperature: 39.1,
      consciousLevel: "alert"
    }
  },
  {
    id: "call-10003",
    istStaffId: "IST-1001",
    maskedPatientId: "IST-10***",
    patientName: "Staff member",
    patientType: "Staff",
    jobTitle: "Pilot",
    department: "Flight Deck",
    symptomTextRaw: "Dizziness after long sector; fit-to-fly review requested.",
    age: 35,
    biologicalSex: "male",
    queueWaitMinutes: 11,
    channel: "Callback",
    stationCode: "LHR",
    onDuty: true,
    outstation: true,
    crewCategory: "flight_deck",
    vitals: {
      heartRate: 92,
      respiratoryRate: 16,
      spo2: 98,
      temperature: 36.8,
      consciousLevel: "alert"
    }
  },
  {
    id: "call-10004",
    istStaffId: "IST-3003",
    maskedPatientId: "IST-30***",
    patientName: "Staff member",
    patientType: "Staff",
    jobTitle: "Operations Specialist",
    department: "Airport Operations",
    symptomTextRaw: "Mild sore throat, no red flags, requesting routine advice.",
    age: 29,
    biologicalSex: "unknown",
    queueWaitMinutes: 16,
    channel: "Phone",
    onDuty: false,
    outstation: false,
    crewCategory: "ground_staff",
    vitals: {
      heartRate: 78,
      respiratoryRate: 14,
      spo2: 99,
      temperature: 37.1,
      consciousLevel: "alert"
    }
  }
];

function isActiveFlightCrew(card: Card): boolean {
  return card.crewCategory === "flight_deck" || card.crewCategory === "cabin_crew";
}

function isPediatric(card: Card): boolean {
  return card.age < 18;
}

function pediatricTachypnea(card: Card): boolean {
  const rr = card.vitals.respiratoryRate;
  if (card.age < 1 / 6) return rr >= 60;
  if (card.age < 1) return rr >= 50;
  if (card.age < 5) return rr >= 40;
  if (card.age <= 12) return rr >= 26;
  return false;
}

function localSafetyFloorReasons(card: Card): string[] {
  const reasons: string[] = [];
  if (card.vitals.consciousLevel !== "alert") reasons.push("AVPU is not Alert");
  if (card.vitals.spo2 < 92) reasons.push("SpO2 below 92%");
  if (card.vitals.heartRate < 60 || card.vitals.heartRate > 130) reasons.push("Heart rate outside 60-130 bpm");
  if (card.vitals.respiratoryRate < 10 || card.vitals.respiratoryRate > 30) {
    reasons.push("Respiratory rate outside 10-30/min");
  }
  if (pediatricTachypnea(card)) reasons.push("Age-banded pediatric tachypnea threshold");
  return reasons;
}

function localSeverity(card: Card): Severity {
  if (localSafetyFloorReasons(card).length > 0) return "Emergency";
  const text = card.symptomTextRaw.toLowerCase();
  if (
    card.vitals.temperature >= 38 ||
    card.vitals.spo2 < 94 ||
    card.vitals.heartRate >= 120 ||
    text.includes("dizziness") ||
    text.includes("chest") ||
    text.includes("breath")
  ) {
    return "Urgent";
  }
  if (text.includes("sore throat") || text.includes("mild")) return "Routine";
  return "Self-care";
}

function severityFromScore(score?: ApiScoreResult): Severity | undefined {
  if (!score) return undefined;
  if (score.severity === "EMERGENCY") return "Emergency";
  if (score.severity === "URGENT") return "Urgent";
  if (score.severity === "ROUTINE") return "Routine";
  return "Self-care";
}

function activeSeverity(card: Card, score?: ApiScoreResult): Severity {
  return severityFromScore(score) ?? localSeverity(card);
}

function routeFor(card: Card, score?: ApiScoreResult): { code: string; destination: string; rationale: string } {
  if (score) {
    return {
      code: score.dispositionCode,
      destination: score.destinationName,
      rationale: score.routingRationale
    };
  }

  const severity = localSeverity(card);
  if (severity === "Emergency" && card.age < 18) {
    return {
      code: "SIDRA_PEDIATRIC_ED",
      destination: "Sidra Medicine Emergency Department",
      rationale: "Local safety preview routes pediatric emergency cases to Sidra."
    };
  }
  if (severity === "Emergency") {
    return {
      code: "HMC_EMERGENCY_DEPARTMENT",
      destination: "Hamad Medical Corporation (HMC) Emergency Department",
      rationale: "Local safety preview routes adult emergency cases to HMC."
    };
  }
  if (severity === "Urgent") {
    return {
      code: "HMC_URGENT_REVIEW",
      destination: "HMC urgent review pathway",
      rationale: "Urgent case requires clinical review."
    };
  }
  if (severity === "Routine") {
    return {
      code: "PHCC_URGENT_CARE_OR_TELECONSULT",
      destination: "PHCC urgent care or IST teleconsult",
      rationale: "Routine review suitable for clinic or teleconsult when no red floor is present."
    };
  }
  return {
    code: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
    destination: "Self-care with callback precautions",
    rationale: "No emergency or urgent trigger detected in local preview."
  };
}

function crewCategoryFrom(item: QueueItem): Card["crewCategory"] {
  const text = `${item.jobTitle ?? ""} ${item.customAviationTags.join(" ")}`.toLowerCase();
  if (text.includes("pilot") || text.includes("flight_deck")) return "flight_deck";
  if (text.includes("cabin")) return "cabin_crew";
  if (item.patientType === "Dependent") return "dependent";
  if (text.includes("ground")) return "ground_staff";
  return "other";
}

function channelFrom(item: QueueItem): Channel {
  if (item.channel === "WhatsApp" || item.channel === "Callback") return item.channel;
  return "Phone";
}

function ageFrom(item: QueueItem): number {
  if (item.patientType === "Dependent") return 8;
  return item.jobTitle?.toLowerCase().includes("pilot") ? 35 : 32;
}

function stageIndexFromQueue(item: QueueItem): number {
  return queueStageToStepIndex[item.currentStage] ?? 0;
}

function queueStageFromStep(index: number): QueueClinicalStage {
  const stageId = stages[index]?.id ?? "intake";
  if (stageId === "intake") return "INTAKE";
  if (stageId === "identity" || stageId === "symptoms") return "IDENTITY";
  if (stageId === "vitals") return "VITALS";
  if (stageId === "protocol") return "PROTOCOL";
  if (stageId === "disposition") return "DISPOSITION";
  return "SBAR";
}

function queueItemToCard(item: QueueItem): Card {
  const age = ageFrom(item);
  return {
    id: item.id,
    istStaffId: item.istStaffId,
    dependentId: item.dependentId,
    patientName: item.patientType === "Dependent" ? "Dependent" : "Staff member",
    patientType: item.patientType,
    jobTitle: item.jobTitle ?? item.patientType,
    department: item.department ?? "Employee health",
    symptomTextRaw: item.summary,
    age,
    biologicalSex: "unknown",
    maskedPatientId: item.patientType === "Dependent" ? `DEP-${item.id.slice(-4)}***` : `${item.istStaffId.slice(0, 6)}***`,
    queueWaitMinutes: Math.max(0, Math.round((new Date(item.slaDeadlineIso).getTime() - Date.now()) / 60_000)),
    channel: channelFrom(item),
    stationCode: item.stationCode,
    onDuty: item.customAviationTags.some((tag) => tag.toLowerCase().includes("fit-to-fly")),
    outstation: item.customAviationTags.some((tag) => tag.toLowerCase().includes("outstation")) || item.stationCode !== "DOH",
    crewCategory: crewCategoryFrom(item),
    vitals: item.vitals ?? {
      heartRate: item.safetyFloorActive ? 135 : 82,
      respiratoryRate: item.patientType === "Dependent" && item.safetyFloorActive ? 42 : 16,
      spo2: item.safetyFloorActive ? 91 : 98,
      temperature: item.patientType === "Dependent" ? 38.2 : 36.9,
      consciousLevel: "alert"
    }
  };
}

function fitToFlyStatus(card: Card, severity: Severity): "CLEARED" | "RESTRICTED" {
  return isActiveFlightCrew(card) && (severity === "Emergency" || severity === "Urgent") ? "RESTRICTED" : "CLEARED";
}

function severityClass(severity: Severity): string {
  if (severity === "Emergency") return "bg-rose-50 text-rose-700 border-rose-200";
  if (severity === "Urgent") return "bg-amber-50 text-amber-700 border-amber-200";
  if (severity === "Routine") return "bg-sky-50 text-sky-700 border-sky-200";
  return "bg-emerald-50 text-emerald-700 border-emerald-200";
}

function sbarMarkdown(card: Card, score?: ApiScoreResult): string {
  const severity = activeSeverity(card, score);
  const route = routeFor(card, score);
  const reasons = localSafetyFloorReasons(card);
  const fitStatus = fitToFlyStatus(card, severity);
  const vitals = `HR ${card.vitals.heartRate}, RR ${card.vitals.respiratoryRate}, SpO2 ${card.vitals.spo2}%, Temp ${card.vitals.temperature}C, AVPU ${card.vitals.consciousLevel}`;

  return [
    "# IST Tele-Triage SBAR",
    "",
    "## English",
    `S: ${card.patientName} (${card.maskedPatientId}), ${card.age} years, ${card.jobTitle}, reports ${card.symptomTextRaw}`,
    `B: Department ${card.department}; channel ${card.channel}; station ${card.stationCode ?? "DOH"}.`,
    `A: ${vitals}. Severity ${severity}. ${reasons.length > 0 ? `Safety floor: ${reasons.join("; ")}.` : "No emergency safety floor currently triggered."}`,
    `R: Route to ${route.destination} (${route.code}). Fit-to-fly ${fitStatus}.`,
    "",
    "## Arabic",
    `الحالة: معرف المريض ${card.maskedPatientId}، العمر ${card.age} سنة، الشكوى: ${card.symptomTextRaw}`,
    `الخلفية: القسم ${card.department}، قناة التواصل ${card.channel}، المحطة ${card.stationCode ?? "DOH"}.`,
    `التقييم: العلامات الحيوية ${vitals}. مستوى الخطورة ${severity}.`,
    `التوصية: التوجيه إلى ${route.destination}. حالة اللياقة للطيران ${fitStatus}.`
  ].join("\n");
}

function priorityTuple(card: Card): number[] {
  return [
    localSafetyFloorReasons(card).length > 0 ? 0 : 1,
    -card.queueWaitMinutes,
    card.patientType === "Dependent" || isPediatric(card) ? 0 : 1,
    isActiveFlightCrew(card) ? 0 : 1,
    card.outstation ? 0 : 1
  ];
}

function compareTuples(left: number[], right: number[]): number {
  for (let index = 0; index < Math.max(left.length, right.length); index += 1) {
    const delta = (left[index] ?? 0) - (right[index] ?? 0);
    if (delta !== 0) return delta;
  }
  return 0;
}

async function copyText(value: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : undefined;
}

function textValue(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function numberValue(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function ageGroup(age?: number): SyntheticReviewRecord["ageGroup"] {
  if (typeof age !== "number") return "Adult";
  if (age < 18) return "Pediatric";
  if (age >= 60) return "Older adult";
  return "Adult";
}

function normalizeSyntheticRecord(value: unknown, index: number): SyntheticReviewRecord {
  const record = asRecord(value) ?? {};
  const input = asRecord(record.input);
  const expected = asRecord(record.expectedOutput);
  const vitals = asRecord(input?.vitals);
  const age = numberValue(input?.ageYears ?? record.ageYears ?? vitals?.ageYears);
  const role = textValue(input?.role ?? record.role, "Synthetic");
  const severity = textValue(expected?.finalSeverity ?? record.finalSeverity, localSeverity(initialCards[0])) as Severity;
  return {
    id: textValue(record.id ?? record.encounterId, `synthetic-${index + 1}`),
    severity: ["Emergency", "Urgent", "Routine", "Self-care"].includes(severity) ? severity : "Routine",
    role,
    ageGroup: ageGroup(age),
    patientType: role.toLowerCase().includes("dependent") || (typeof age === "number" && age < 18) ? "Dependent" : "Staff",
    route: textValue(expected?.targetRoutingEndpoint ?? record.targetRoutingEndpoint, "Not routed"),
    summary: textValue(input?.symptomText ?? record.symptomText ?? record.scenarioName, "Synthetic scenario"),
    tags: [
      textValue(record.scenarioId, "synthetic"),
      typeof age === "number" && age < 18 ? "pediatric" : "adult",
      role.toLowerCase().includes("cabin") || role.toLowerCase().includes("pilot") ? "aviation" : "general"
    ],
    raw: value
  };
}

function recordsFromCards(cards: Card[]): SyntheticReviewRecord[] {
  return cards.map((card) => ({
    id: card.id,
    severity: localSeverity(card),
    role: card.jobTitle,
    ageGroup: ageGroup(card.age),
    patientType: card.patientType,
    route: routeFor(card).destination,
    summary: card.symptomTextRaw,
    tags: [
      card.outstation ? "outstation" : "local",
      card.onDuty ? "on-duty" : "off-duty",
      isActiveFlightCrew(card) ? "safety-sensitive" : "general"
    ],
    raw: card
  }));
}

export default function NurseWorkspace() {
  const { queue, activeItem, claimItem, updateItemContext, moveItem } = useQueue();
  const [cardsById, setCardsById] = useState<Record<string, Card>>(() =>
    Object.fromEntries(initialCards.map((card) => [card.id, card]))
  );
  const [queueIds, setQueueIds] = useState(() => initialCards.map((card) => card.id));
  const [holdIds, setHoldIds] = useState<string[]>([]);
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [stageIndex, setStageIndex] = useState(0);
  const [scoreByCardId, setScoreByCardId] = useState<Record<string, ScoreState>>({});
  const [identityByCardId, setIdentityByCardId] = useState<Record<string, StaffIdentityState>>({});
  const [toast, setToast] = useState<Toast | null>(null);
  const [writebackStatus, setWritebackStatus] = useState("No encounter completed in this session.");
  const [copiedCardIds, setCopiedCardIds] = useState<Set<string>>(() => new Set());
  const [severityFilter, setSeverityFilter] = useState<Severity | "All">("All");
  const [patientFilter, setPatientFilter] = useState<PatientType | "All">("All");
  const [channelFilter, setChannelFilter] = useState<Channel | "All">("All");
  const [dutyFilter, setDutyFilter] = useState<"All" | "On-duty" | "Outstation">("All");
  const [sortMode, setSortMode] = useState<"Clinical priority" | "Longest wait">("Clinical priority");
  const [syntheticOpen, setSyntheticOpen] = useState(false);
  const [syntheticLoading, setSyntheticLoading] = useState(false);
  const [syntheticError, setSyntheticError] = useState<string | null>(null);
  const [syntheticRecords, setSyntheticRecords] = useState<SyntheticReviewRecord[]>(() => recordsFromCards(initialCards));
  const [selectedSyntheticId, setSelectedSyntheticId] = useState<string | null>(initialCards[0]?.id ?? null);
  const [syntheticSeverity, setSyntheticSeverity] = useState<Severity | "All">("All");
  const [syntheticRole, setSyntheticRole] = useState("All");
  const [syntheticAgeGroup, setSyntheticAgeGroup] = useState<SyntheticReviewRecord["ageGroup"] | "All">("All");

  const activeCard = activeCardId ? cardsById[activeCardId] : undefined;
  const activeScore = activeCardId ? scoreByCardId[activeCardId] : undefined;
  const activeScoreResult = activeScore && "result" in activeScore ? activeScore.result : undefined;
  const currentStage = stages[stageIndex];

  useEffect(() => {
    if (queue.length === 0) {
      return;
    }
    const queueCards = queue.map(queueItemToCard);
    setCardsById((current) => ({
      ...current,
      ...Object.fromEntries(queueCards.map((card) => [card.id, card]))
    }));
    setQueueIds(
      queue
        .filter((item) => item.status !== "COMPLETED")
        .filter((item) => item.id !== activeItem?.id)
        .map((item) => item.id)
    );
  }, [activeItem?.id, queue]);

  useEffect(() => {
    if (!activeItem) {
      return;
    }
    const card = queueItemToCard(activeItem);
    setCardsById((current) => ({ ...current, [card.id]: card }));
    setQueueIds((current) => current.filter((id) => id !== card.id));
    setHoldIds((current) => current.filter((id) => id !== card.id));
    setActiveCardId(card.id);
    setStageIndex(stageIndexFromQueue(activeItem));

    if (activeItem.identityValidated) {
      setIdentityByCardId((current) => ({
        ...current,
        [card.id]: {
          status: "ready",
          valid: true,
          display: "Validated through queue orchestration",
          department: card.department,
          jobTitle: card.jobTitle,
          dependents: card.patientType === "Dependent" ? 1 : 0
        }
      }));
    }
  }, [activeItem]);

  const filteredQueue = useMemo(() => {
    const cards = queueIds.map((id) => cardsById[id]).filter((card): card is Card => Boolean(card));
    return cards
      .filter((card) => severityFilter === "All" || localSeverity(card) === severityFilter)
      .filter((card) => patientFilter === "All" || card.patientType === patientFilter)
      .filter((card) => channelFilter === "All" || card.channel === channelFilter)
      .filter((card) => {
        if (dutyFilter === "All") return true;
        if (dutyFilter === "On-duty") return card.onDuty;
        return card.outstation;
      })
      .sort((left, right) => {
        if (sortMode === "Longest wait") {
          return right.queueWaitMinutes - left.queueWaitMinutes;
        }
        return compareTuples(priorityTuple(left), priorityTuple(right));
      });
  }, [cardsById, channelFilter, dutyFilter, patientFilter, queueIds, severityFilter, sortMode]);

  const redQueueCount = useMemo(
    () => Object.values(cardsById).filter((card) => localSafetyFloorReasons(card).length > 0).length,
    [cardsById]
  );

  const filteredSyntheticRecords = useMemo(
    () =>
      syntheticRecords
        .filter((record) => syntheticSeverity === "All" || record.severity === syntheticSeverity)
        .filter((record) => syntheticRole === "All" || record.role === syntheticRole)
        .filter((record) => syntheticAgeGroup === "All" || record.ageGroup === syntheticAgeGroup),
    [syntheticAgeGroup, syntheticRecords, syntheticRole, syntheticSeverity]
  );

  const selectedSyntheticRecord =
    filteredSyntheticRecords.find((record) => record.id === selectedSyntheticId) ?? filteredSyntheticRecords[0];

  const activeVitalsKey = activeCard
    ? `${activeCard.id}-${activeCard.vitals.heartRate}-${activeCard.vitals.respiratoryRate}-${activeCard.vitals.spo2}-${activeCard.vitals.temperature}-${activeCard.vitals.consciousLevel}-${activeCard.istStaffId}-${activeCard.dependentId ?? ""}`
    : "";

  useEffect(() => {
    if (!activeCard) return undefined;

    let ignore = false;
    const timer = window.setTimeout(async () => {
      setScoreByCardId((current) => ({
        ...current,
        [activeCard.id]: {
          status: "loading",
          result: "result" in (current[activeCard.id] ?? {}) ? (current[activeCard.id] as ScoreState & { result?: ApiScoreResult }).result : undefined
        }
      }));

      try {
        const response = await fetch(`${apiBase}/api/v1/triage/calculate-score`, {
          method: "POST",
          credentials: "include",
          headers: {
            accept: "application/json",
            "content-type": "application/json"
          },
          body: JSON.stringify({
            ist_staff_id: activeCard.istStaffId,
            dependent_id: activeCard.dependentId,
            heart_rate: activeCard.vitals.heartRate,
            respiratory_rate: activeCard.vitals.respiratoryRate,
            spo2: activeCard.vitals.spo2,
            temperature: activeCard.vitals.temperature,
            conscious_level: activeCard.vitals.consciousLevel
          })
        });

        if (!response.ok) {
          throw new Error(`Score API returned HTTP ${response.status}`);
        }

        const result = (await response.json()) as ApiScoreResult;
        if (!ignore) {
          setScoreByCardId((current) => ({
            ...current,
            [activeCard.id]: { status: "ready", result, updatedAtIso: new Date().toISOString() }
          }));
          if (activeItem?.id === activeCard.id) {
            void updateItemContext(activeCard.id, {
              vitals: activeCard.vitals,
              matchedProtocolId: result.dispositionCode ? "phase1-rules-first-protocol" : undefined,
              calculatedSeverity: result.severity === "HOMECARE" ? "SELF_CARE" : result.severity,
              dispositionCode: result.dispositionCode,
              destinationName: result.destinationName
            });
          }
        }
      } catch (error) {
        if (!ignore) {
          setScoreByCardId((current) => ({
            ...current,
            [activeCard.id]: {
              status: "error",
              result: "result" in (current[activeCard.id] ?? {}) ? (current[activeCard.id] as ScoreState & { result?: ApiScoreResult }).result : undefined,
              error: error instanceof Error ? error.message : "Score API unavailable"
            }
          }));
        }
      }
    }, 350);

    return () => {
      ignore = true;
      window.clearTimeout(timer);
    };
  }, [activeCard, activeItem?.id, activeVitalsKey, updateItemContext]);

  function showToast(message: string, tone: ToastTone = "info") {
    const id = Date.now();
    setToast({ id, tone, message });
    window.setTimeout(() => {
      setToast((current) => (current?.id === id ? null : current));
    }, 4200);
  }

  function updateCard(cardId: string, patch: Partial<Card>) {
    setCardsById((current) => ({
      ...current,
      [cardId]: {
        ...current[cardId],
        ...patch
      }
    }));
  }

  function updateCardVitals(cardId: string, nextVitals: Partial<Card["vitals"]>) {
    setCardsById((current) => ({
      ...current,
      [cardId]: {
        ...current[cardId],
        vitals: {
          ...current[cardId].vitals,
          ...nextVitals
        }
      }
    }));
  }

  async function openCall(cardId: string) {
    if (activeCardId && activeCardId !== cardId) {
      showToast("A call is already active. Complete it or place it on hold before opening another call.", "warning");
      return;
    }

    try {
      if (queue.some((item) => item.id === cardId)) {
        const claimed = await claimItem(cardId);
        setStageIndex(stageIndexFromQueue(claimed));
      } else {
        setStageIndex(0);
      }
      setQueueIds((current) => current.filter((id) => id !== cardId));
      setHoldIds((current) => current.filter((id) => id !== cardId));
      setActiveCardId(cardId);
      showToast("Call opened and locked in the nurse cockpit.", "success");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Unable to open queue item.", "warning");
    }
  }

  function holdActiveCall() {
    if (!activeCardId) return;
    setHoldIds((current) => [...new Set([...current, activeCardId])]);
    setActiveCardId(null);
    setStageIndex(0);
    showToast("Call placed in Information Required / callback hold.", "info");
  }

  function handleStageChange(nextIndex: number) {
    const boundedIndex = Math.max(0, Math.min(nextIndex, stages.length - 1));
    if (!activeItem || activeItem.id !== activeCardId) {
      setStageIndex(boundedIndex);
      return;
    }

    const toStage = queueStageFromStep(boundedIndex);
    const toStatus = toStage === "INTAKE" ? "INCOMING" : "IN_PROCESS";
    void moveItem(activeItem.id, toStage, toStatus, "Step cockpit stage change with sequence validation.")
      .then(() => setStageIndex(boundedIndex))
      .catch((error) => {
        showToast(error instanceof Error ? error.message : "Stage movement blocked by queue rules.", "warning");
      });
  }

  async function validateIdentity(card: Card) {
    setIdentityByCardId((current) => ({ ...current, [card.id]: { status: "loading" } }));
    try {
      const response = await fetch(`${apiBase}/api/v1/staff/validate`, {
        method: "POST",
        credentials: "include",
        headers: {
          accept: "application/json",
          "content-type": "application/json"
        },
        body: JSON.stringify({ ist_staff_id: card.istStaffId })
      });
      const body = (await response.json()) as {
        valid?: boolean;
        reason?: string;
        profile?: { department?: string; jobTitle?: string; dependents?: unknown[] };
      };

      if (!response.ok || !body.valid) {
        throw new Error(body.reason ?? `HRMS validation returned HTTP ${response.status}`);
      }

      setIdentityByCardId((current) => ({
        ...current,
        [card.id]: {
          status: "ready",
          valid: true,
          display: "Validated through HRMS adapter",
          department: body.profile?.department,
          jobTitle: body.profile?.jobTitle,
          dependents: Array.isArray(body.profile?.dependents) ? body.profile.dependents.length : 0
        }
      }));
      if (activeItem?.id === card.id) {
        void updateItemContext(card.id, { identityValidated: true });
      }
      showToast("Identity validated. Age remains sourced from HRMS/dependent record.", "success");
    } catch (error) {
      setIdentityByCardId((current) => ({
        ...current,
        [card.id]: { status: "error", error: error instanceof Error ? error.message : "HRMS validation failed" }
      }));
      showToast("Identity validation failed. Keep the call in nurse review.", "warning");
    }
  }

  async function postCompletion(card: Card, score?: ApiScoreResult) {
    const route = routeFor(card, score);
    await fetch(`${apiBase}/api/v1/triage/complete`, {
      method: "POST",
      credentials: "include",
      headers: {
        accept: "application/json",
        "content-type": "application/json"
      },
      body: JSON.stringify({
        encounter_id: card.id,
        ist_staff_id: card.istStaffId,
        nurse_id: "remote-triage-nurse",
        patient_name: card.patientName,
        patient_age_years: card.age,
        chief_complaint: card.symptomTextRaw,
        subjective: card.symptomTextRaw,
        objective: `HR ${card.vitals.heartRate}, RR ${card.vitals.respiratoryRate}, SpO2 ${card.vitals.spo2}, Temp ${card.vitals.temperature}, AVPU ${card.vitals.consciousLevel}`,
        assessment: `Rules-first severity ${activeSeverity(card, score)}. ${localSafetyFloorReasons(card).join("; ") || "No red floor."}`,
        recommendation: route.destination,
        final_disposition_code: route.code,
        routing_destination: route.destination,
        safety_rationale: route.rationale,
        custom_aviation_tags:
          fitToFlyStatus(card, activeSeverity(card, score)) === "RESTRICTED"
            ? ["fit-to-fly-review", "duty-restriction"]
            : []
      })
    });
  }

  async function postEmrWriteback(card: Card) {
    try {
      const response = await fetch(`${apiBase}/api/v1/emr/writeback/${card.id}`, {
        method: "POST",
        credentials: "include",
        headers: {
          accept: "application/json",
          "content-type": "application/json"
        },
        body: JSON.stringify({ dryRun: true, isDraft: true })
      });
      setWritebackStatus(
        response.ok
          ? "EMR/FHIR writeback dry-run executed through the safety-gated endpoint."
          : `EMR/FHIR writeback remains gated or unavailable (HTTP ${response.status}).`
      );
    } catch {
      setWritebackStatus("EMR/FHIR writeback remains safety-gated; clipboard SBAR is the active handoff.");
    }
  }

  async function copyAndComplete(card: Card) {
    if (currentStage.id !== "complete") {
      showToast("Move to Stage 7 before completing the encounter.", "warning");
      return;
    }

    try {
      await copyText(sbarMarkdown(card, activeScoreResult));
      setCopiedCardIds((current) => new Set([...current, card.id]));
      await postCompletion(card, activeScoreResult);
      if (activeItem?.id === card.id) {
        const route = routeFor(card, activeScoreResult);
        await updateItemContext(card.id, {
          clinicalApproval: {
            approvedBy: "Remote Triage Nurse",
            approvedAtIso: new Date().toISOString(),
            approvalType: "sbar-copy-and-close"
          },
          sbarCopied: true,
          matchedProtocolId: activeScoreResult?.dispositionCode ? "phase1-rules-first-protocol" : "manual-route-review",
          calculatedSeverity: activeSeverity(card, activeScoreResult) === "Self-care" ? "SELF_CARE" : activeSeverity(card, activeScoreResult).toUpperCase(),
          dispositionCode: route.code,
          destinationName: route.destination
        });
        await moveItem(card.id, "SBAR", "COMPLETED", "SBAR copied and nurse-approved for queue closure.");
      }
      await postEmrWriteback(card);
      setCompletedIds((current) => [...new Set([...current, card.id])]);
      setActiveCardId(null);
      setStageIndex(0);
      showToast("SBAR copied and encounter completed.", "success");
    } catch {
      showToast("Completion was blocked by the browser or API. Keep the encounter active.", "warning");
    }
  }

  async function openSyntheticDrawer() {
    setSyntheticOpen(true);
    setSyntheticLoading(true);
    setSyntheticError(null);
    try {
      const response = await fetch(`${apiBase}/api/v1/simulation/generated`, {
        credentials: "include",
        headers: { accept: "application/json" }
      });
      if (!response.ok) {
        throw new Error(`Synthetic API returned HTTP ${response.status}`);
      }
      const body = (await response.json()) as { samples?: { encounters?: unknown[]; training?: unknown[] } };
      const samples = [...(body.samples?.encounters ?? []), ...(body.samples?.training ?? [])];
      const normalized = samples.length > 0 ? samples.map(normalizeSyntheticRecord) : recordsFromCards(Object.values(cardsById));
      setSyntheticRecords(normalized);
      setSelectedSyntheticId(normalized[0]?.id ?? null);
    } catch (error) {
      setSyntheticError(error instanceof Error ? error.message : "Synthetic data API unavailable");
      setSyntheticRecords(recordsFromCards(Object.values(cardsById)));
    } finally {
      setSyntheticLoading(false);
    }
  }

  const queueWaitLabel = queueIds.length === 1 ? "1 waiting" : `${queueIds.length} waiting`;

  return (
    <section className="space-y-4" aria-label="Nurse cockpit workspace">
      <header className="rounded-lg border border-slate-200/80 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Nurse Cockpit</span>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal text-slate-950 md:text-5xl">
              One Active Call
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Prioritized intake on the left, one progressive triage flow in the center, and safety-gated notes on the right.
            </p>
          </div>
          <div className="grid grid-cols-4 gap-2 text-center">
            <Kpi value={queueIds.length} label="Waiting" />
            <Kpi value={activeCard ? 1 : 0} label="Active" />
            <Kpi value={holdIds.length} label="Hold" />
            <Kpi value={completedIds.length} label="Closed" />
          </div>
        </div>
      </header>

      {toast && <ToastBanner toast={toast} />}

      <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)_360px]">
        <QueuePanel
          cards={filteredQueue}
          queueWaitLabel={queueWaitLabel}
          redQueueCount={redQueueCount}
          severityFilter={severityFilter}
          patientFilter={patientFilter}
          channelFilter={channelFilter}
          dutyFilter={dutyFilter}
          sortMode={sortMode}
          onSeverityChange={setSeverityFilter}
          onPatientChange={setPatientFilter}
          onChannelChange={setChannelFilter}
          onDutyChange={setDutyFilter}
          onSortChange={setSortMode}
          onOpen={openCall}
        />

        <main className="min-h-[640px] rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          {activeCard ? (
            <ActiveCallPanel
              card={activeCard}
              stageIndex={stageIndex}
              scoreState={activeScore ?? { status: "idle" }}
              identityState={identityByCardId[activeCard.id] ?? { status: "idle" }}
              onStageChange={handleStageChange}
              onValidateIdentity={() => validateIdentity(activeCard)}
              onUpdateCard={(patch) => updateCard(activeCard.id, patch)}
              onVitalsChange={(nextVitals) => updateCardVitals(activeCard.id, nextVitals)}
              onHold={holdActiveCall}
              onComplete={() => copyAndComplete(activeCard)}
            />
          ) : (
            <EmptyActiveState holdCount={holdIds.length} onSyntheticOpen={openSyntheticDrawer} />
          )}
        </main>

        <SafetySummaryPanel
          activeCard={activeCard}
          score={activeScoreResult}
          scoreState={activeScore ?? { status: "idle" }}
          copied={activeCard ? copiedCardIds.has(activeCard.id) : false}
          writebackStatus={writebackStatus}
          onSyntheticOpen={openSyntheticDrawer}
        />
      </div>

      {holdIds.length > 0 && (
        <section className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="mb-3 flex items-center gap-2 text-amber-800">
            <PauseCircle className="h-4 w-4" />
            <h2 className="text-sm font-semibold">Information Required / Callback Hold</h2>
          </div>
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
            {holdIds.map((id) => (
              <HoldCard key={id} card={cardsById[id]} onOpen={() => openCall(id)} />
            ))}
          </div>
        </section>
      )}

      {syntheticOpen && (
        <SyntheticDrawer
          loading={syntheticLoading}
          error={syntheticError}
          records={filteredSyntheticRecords}
          selectedRecord={selectedSyntheticRecord}
          severity={syntheticSeverity}
          role={syntheticRole}
          ageGroup={syntheticAgeGroup}
          allRoles={[...new Set(syntheticRecords.map((record) => record.role))]}
          onClose={() => setSyntheticOpen(false)}
          onSelect={setSelectedSyntheticId}
          onSeverityChange={setSyntheticSeverity}
          onRoleChange={setSyntheticRole}
          onAgeGroupChange={setSyntheticAgeGroup}
        />
      )}
    </section>
  );
}

function Kpi({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
      <strong className="block text-2xl text-slate-950">{value}</strong>
      <span className="text-[11px] font-semibold uppercase text-slate-500">{label}</span>
    </div>
  );
}

function ToastBanner({ toast }: { toast: Toast }) {
  const palette =
    toast.tone === "warning"
      ? "border-amber-200 bg-amber-50 text-amber-800"
      : toast.tone === "success"
        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
        : "border-slate-200 bg-slate-50 text-slate-700";
  return (
    <div className={`rounded-lg border px-4 py-3 text-sm font-semibold shadow-sm ${palette}`} role="status">
      {toast.message}
    </div>
  );
}

function QueuePanel({
  cards,
  queueWaitLabel,
  redQueueCount,
  severityFilter,
  patientFilter,
  channelFilter,
  dutyFilter,
  sortMode,
  onSeverityChange,
  onPatientChange,
  onChannelChange,
  onDutyChange,
  onSortChange,
  onOpen
}: {
  cards: Card[];
  queueWaitLabel: string;
  redQueueCount: number;
  severityFilter: Severity | "All";
  patientFilter: PatientType | "All";
  channelFilter: Channel | "All";
  dutyFilter: "All" | "On-duty" | "Outstation";
  sortMode: "Clinical priority" | "Longest wait";
  onSeverityChange: (value: Severity | "All") => void;
  onPatientChange: (value: PatientType | "All") => void;
  onChannelChange: (value: Channel | "All") => void;
  onDutyChange: (value: "All" | "On-duty" | "Outstation") => void;
  onSortChange: (value: "Clinical priority" | "Longest wait") => void;
  onOpen: (cardId: string) => void;
}) {
  return (
    <aside className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <PhoneCall className="h-4 w-4 text-emerald-600" />
            <h2 className="text-sm font-semibold text-slate-950">Incoming Queue</h2>
          </div>
          <p className="mt-1 text-xs text-slate-500">{queueWaitLabel} · {redQueueCount} red-floor cases</p>
        </div>
        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
          Live
        </span>
      </div>

      <div className="grid gap-2">
        <SelectControl
          icon={Filter}
          label="Sort"
          value={sortMode}
          options={["Clinical priority", "Longest wait"]}
          onChange={(value) => onSortChange(value as "Clinical priority" | "Longest wait")}
        />
        <div className="grid grid-cols-2 gap-2">
          <SelectControl
            label="Severity"
            value={severityFilter}
            options={["All", "Emergency", "Urgent", "Routine", "Self-care"]}
            onChange={(value) => onSeverityChange(value as Severity | "All")}
          />
          <SelectControl
            label="Patient"
            value={patientFilter}
            options={["All", "Staff", "Dependent"]}
            onChange={(value) => onPatientChange(value as PatientType | "All")}
          />
          <SelectControl
            label="Channel"
            value={channelFilter}
            options={["All", "Phone", "WhatsApp", "Callback"]}
            onChange={(value) => onChannelChange(value as Channel | "All")}
          />
          <SelectControl
            label="Duty"
            value={dutyFilter}
            options={["All", "On-duty", "Outstation"]}
            onChange={(value) => onDutyChange(value as "All" | "On-duty" | "Outstation")}
          />
        </div>
      </div>

      <div className="mt-4 max-h-[650px] space-y-2 overflow-auto pr-1">
        {cards.length === 0 && (
          <div className="rounded-lg border border-dashed border-slate-200 p-5 text-center text-xs font-semibold text-slate-400">
            No calls match the selected filters.
          </div>
        )}
        {cards.map((card) => (
          <QueueCard key={card.id} card={card} onOpen={() => onOpen(card.id)} />
        ))}
      </div>
    </aside>
  );
}

function SelectControl({
  icon: Icon,
  label,
  value,
  options,
  onChange
}: {
  icon?: typeof Filter;
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
      <span className="flex items-center gap-1">
        {Icon && <Icon className="h-3.5 w-3.5" />}
        {label}
      </span>
      <select
        className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-xs font-semibold normal-case tracking-normal text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function QueueCard({ card, onOpen }: { card: Card; onOpen: () => void }) {
  const severity = localSeverity(card);
  const red = severity === "Emergency";
  return (
    <article className={`rounded-lg border p-3 ${red ? "border-rose-200 bg-rose-50" : "border-slate-200 bg-white"}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <span className="font-mono text-xs font-semibold text-sky-700">{card.maskedPatientId}</span>
          <h3 className="mt-1 truncate text-sm font-semibold text-slate-950">{card.patientType}</h3>
        </div>
        <span className={`rounded-full border px-2 py-1 text-[11px] font-semibold ${severityClass(severity)}`}>
          {severity}
        </span>
      </div>
      <p className="mt-2 text-sm leading-5 text-slate-700">{card.symptomTextRaw}</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <Tag>{card.queueWaitMinutes}m</Tag>
        <Tag>{card.channel}</Tag>
        <Tag>{card.jobTitle}</Tag>
        {card.outstation && <Tag>{card.stationCode ?? "Outstation"}</Tag>}
      </div>
      <button
        type="button"
        className="mt-3 inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-3 text-xs font-semibold text-white transition hover:bg-emerald-700"
        onClick={onOpen}
      >
        Open call
        <ArrowRight className="h-3.5 w-3.5" />
      </button>
    </article>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600">
      {children}
    </span>
  );
}

function ActiveCallPanel({
  card,
  stageIndex,
  scoreState,
  identityState,
  onStageChange,
  onValidateIdentity,
  onUpdateCard,
  onVitalsChange,
  onHold,
  onComplete
}: {
  card: Card;
  stageIndex: number;
  scoreState: ScoreState;
  identityState: StaffIdentityState;
  onStageChange: (index: number) => void;
  onValidateIdentity: () => void;
  onUpdateCard: (patch: Partial<Card>) => void;
  onVitalsChange: (nextVitals: Partial<Card["vitals"]>) => void;
  onHold: () => void;
  onComplete: () => void;
}) {
  const score = "result" in scoreState ? scoreState.result : undefined;
  const severity = activeSeverity(card, score);
  const route = routeFor(card, score);
  const reasons = localSafetyFloorReasons(card);
  const finalStage = stageIndex === stages.length - 1;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">Active Triage</span>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">{card.maskedPatientId}</h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">{card.symptomTextRaw}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:border-amber-300 hover:bg-amber-50"
            onClick={onHold}
          >
            <PauseCircle className="h-4 w-4" />
            Hold
          </button>
          <button
            type="button"
            className={`inline-flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold transition ${
              finalStage ? "bg-emerald-600 text-white hover:bg-emerald-700" : "bg-slate-100 text-slate-400"
            }`}
            onClick={onComplete}
            disabled={!finalStage}
          >
            <Copy className="h-4 w-4" />
            Complete
          </button>
        </div>
      </div>

      <Stepper activeIndex={stageIndex} onSelect={onStageChange} />

      {reasons.length > 0 && <RedFloorBanner reasons={reasons} />}

      <section className="min-h-[420px] rounded-lg border border-slate-200 bg-slate-50 p-4">
        {stages[stageIndex].id === "intake" && <IntakeStage card={card} />}
        {stages[stageIndex].id === "identity" && (
          <IdentityStage card={card} state={identityState} onValidateIdentity={onValidateIdentity} />
        )}
        {stages[stageIndex].id === "symptoms" && (
          <SymptomsStage card={card} onUpdateCard={onUpdateCard} />
        )}
        {stages[stageIndex].id === "vitals" && (
          <VitalsStage card={card} scoreState={scoreState} onVitalsChange={onVitalsChange} />
        )}
        {stages[stageIndex].id === "protocol" && <ProtocolStage card={card} score={score} />}
        {stages[stageIndex].id === "disposition" && (
          <DispositionStage card={card} score={score} severity={severity} route={route} />
        )}
        {stages[stageIndex].id === "complete" && <CompleteStage card={card} score={score} />}
      </section>

      <div className="flex items-center justify-between">
        <button
          type="button"
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-40"
          onClick={() => onStageChange(Math.max(stageIndex - 1, 0))}
          disabled={stageIndex === 0}
        >
          <ArrowLeft className="h-4 w-4" />
          Previous
        </button>
        <button
          type="button"
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-slate-950 px-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400"
          onClick={() => onStageChange(Math.min(stageIndex + 1, stages.length - 1))}
          disabled={finalStage}
        >
          Next
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function Stepper({ activeIndex, onSelect }: { activeIndex: number; onSelect: (index: number) => void }) {
  return (
    <nav className="grid gap-2 md:grid-cols-7" aria-label="Triage stages">
      {stages.map((stage, index) => {
        const active = index === activeIndex;
        const complete = index < activeIndex;
        return (
          <button
            key={stage.id}
            type="button"
            className={`min-h-[62px] rounded-lg border px-2 py-2 text-left transition ${
              active
                ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                : complete
                  ? "border-emerald-200 bg-white text-slate-700"
                  : "border-slate-200 bg-white text-slate-500"
            }`}
            onClick={() => onSelect(index)}
          >
            <span className="block text-[11px] font-semibold uppercase tracking-[0.12em]">{stage.shortLabel}</span>
            <strong className="mt-1 block text-xs">{stage.label}</strong>
          </button>
        );
      })}
    </nav>
  );
}

function RedFloorBanner({ reasons }: { reasons: string[] }) {
  return (
    <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-rose-800">
      <div className="flex items-center gap-2">
        <ShieldAlert className="h-5 w-5" />
        <strong>Emergency safety floor active</strong>
      </div>
      <ul className="mt-2 grid gap-1 text-sm md:grid-cols-2">
        {reasons.map((reason) => (
          <li key={reason}>- {reason}</li>
        ))}
      </ul>
    </div>
  );
}

function IntakeStage({ card }: { card: Card }) {
  return (
    <StageShell icon={PhoneCall} title="Stage 1 · Intake" subtitle="Confirm call source and immediate context.">
      <InfoGrid
        items={[
          ["Channel", card.channel],
          ["Wait", `${card.queueWaitMinutes} minutes`],
          ["Patient type", card.patientType],
          ["Station", card.stationCode ?? "DOH"],
          ["Duty status", card.onDuty ? "On duty" : "Not on duty"],
          ["Outstation", card.outstation ? "Yes" : "No"]
        ]}
      />
    </StageShell>
  );
}

function IdentityStage({
  card,
  state,
  onValidateIdentity
}: {
  card: Card;
  state: StaffIdentityState;
  onValidateIdentity: () => void;
}) {
  return (
    <StageShell icon={UserRoundCheck} title="Stage 2 · Identity" subtitle="Age and dependent context are resolved from HRMS, not manual entry.">
      <InfoGrid
        items={[
          ["Staff ID", card.istStaffId],
          ["Dependent", card.dependentId ?? "Staff member"],
          ["Masked patient", card.maskedPatientId],
          ["Local age preview", `${card.age} years`]
        ]}
      />
      <button
        type="button"
        className="mt-4 inline-flex h-10 items-center gap-2 rounded-lg bg-emerald-600 px-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
        onClick={onValidateIdentity}
        disabled={state.status === "loading"}
      >
        <Search className="h-4 w-4" />
        {state.status === "loading" ? "Validating..." : "Validate HRMS identity"}
      </button>
      {state.status === "ready" && (
        <div className="mt-4 rounded-lg border border-emerald-200 bg-white p-3 text-sm text-emerald-800">
          {state.display}. {state.department ?? card.department} · {state.jobTitle ?? card.jobTitle} · {state.dependents} dependents.
        </div>
      )}
      {state.status === "error" && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          {state.error}
        </div>
      )}
    </StageShell>
  );
}

function SymptomsStage({ card, onUpdateCard }: { card: Card; onUpdateCard: (patch: Partial<Card>) => void }) {
  return (
    <StageShell icon={FileText} title="Stage 3 · Symptoms" subtitle="Capture the caller's narrative before protocol review.">
      <label className="grid gap-2 text-sm font-semibold text-slate-700">
        Chief complaint and narrative
        <textarea
          className="min-h-[160px] rounded-lg border border-slate-200 bg-white p-3 text-sm font-normal leading-6 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          value={card.symptomTextRaw}
          onChange={(event) => onUpdateCard({ symptomTextRaw: event.target.value })}
        />
      </label>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <ClinicalChip label="Patient" value={card.patientType} />
        <ClinicalChip label="Sex" value={card.biologicalSex} />
        <ClinicalChip label="Aviation role" value={card.crewCategory.replace(/_/g, " ")} />
      </div>
    </StageShell>
  );
}

function VitalsStage({
  card,
  scoreState,
  onVitalsChange
}: {
  card: Card;
  scoreState: ScoreState;
  onVitalsChange: (nextVitals: Partial<Card["vitals"]>) => void;
}) {
  const score = "result" in scoreState ? scoreState.result : undefined;
  return (
    <StageShell icon={Stethoscope} title="Stage 4 · Vitals" subtitle="Authoritative severity updates only after the API returns.">
      <div className="grid gap-3 md:grid-cols-5">
        <VitalInput label="HR" value={card.vitals.heartRate} min={20} max={260} onChange={(heartRate) => onVitalsChange({ heartRate })} />
        <VitalInput label="RR" value={card.vitals.respiratoryRate} min={1} max={80} onChange={(respiratoryRate) => onVitalsChange({ respiratoryRate })} />
        <VitalInput label="SpO2" value={card.vitals.spo2} min={40} max={100} onChange={(spo2) => onVitalsChange({ spo2 })} />
        <VitalInput label="Temp" value={card.vitals.temperature} min={30} max={45} step={0.1} onChange={(temperature) => onVitalsChange({ temperature })} />
        <label className="grid gap-1 text-xs font-semibold text-slate-600">
          AVPU
          <select
            className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            value={card.vitals.consciousLevel}
            onChange={(event) => onVitalsChange({ consciousLevel: event.target.value as ConsciousLevel })}
          >
            <option value="alert">Alert</option>
            <option value="voice">Voice</option>
            <option value="pain">Pain</option>
            <option value="unresponsive">Unresponsive</option>
          </select>
        </label>
      </div>
      <div className="mt-4 rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700">
        {scoreState.status === "loading" && "Scoring API is recalculating from HRMS age and current vitals..."}
        {scoreState.status === "ready" && score && (
          <span>
            API score {score.score} · {score.riskBand} · {score.patientAge?.calculatedFrom ?? "HRMS age source"}
          </span>
        )}
        {scoreState.status === "error" && scoreState.error}
        {scoreState.status === "idle" && "Waiting for the first authoritative score."}
      </div>
    </StageShell>
  );
}

function ProtocolStage({ card, score }: { card: Card; score?: ApiScoreResult }) {
  const text = card.symptomTextRaw.toLowerCase();
  const protocol = text.includes("chest")
    ? "Chest Pain or Tightness - Adult"
    : text.includes("fever")
      ? "Fever - Child"
      : text.includes("breath")
        ? "Shortness of Breath or Breathing Difficulty"
        : "Safety-net nurse protocol review";
  return (
    <StageShell icon={ClipboardCheck} title="Stage 5 · Protocol" subtitle="Protocol matching remains advisory until the nurse validates the checklist.">
      <InfoGrid
        items={[
          ["Matched protocol", protocol],
          ["API risk band", score?.riskBand ?? "Pending API score"],
          ["Acuity order", "High-risk questions first"],
          ["AI role", "Explain and draft only"]
        ]}
      />
    </StageShell>
  );
}

function DispositionStage({
  card,
  score,
  severity,
  route
}: {
  card: Card;
  score?: ApiScoreResult;
  severity: Severity;
  route: { code: string; destination: string; rationale: string };
}) {
  const fitStatus = fitToFlyStatus(card, severity);
  return (
    <StageShell icon={Plane} title="Stage 6 · Disposition" subtitle="Aviation and local routing gates are reviewed before completion.">
      <div className="grid gap-3 md:grid-cols-3">
        <ClinicalMetric icon={AlertTriangle} label="Severity" value={severity} tone={severity === "Emergency" ? "rose" : "emerald"} />
        <ClinicalMetric icon={TimerReset} label="Disposition" value={route.code} tone="slate" />
        <ClinicalMetric icon={Plane} label="Fit-to-fly" value={fitStatus} tone={fitStatus === "RESTRICTED" ? "rose" : "emerald"} />
      </div>
      <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-700">
        <strong className="block text-slate-950">{route.destination}</strong>
        {score?.routingRationale ?? route.rationale}
      </div>
    </StageShell>
  );
}

function CompleteStage({ card, score }: { card: Card; score?: ApiScoreResult }) {
  return (
    <StageShell icon={FileText} title="Stage 7 · SBAR / Complete" subtitle="Copy bilingual SBAR, execute safety-gated writeback, and close the call.">
      <pre className="max-h-[360px] overflow-auto whitespace-pre-wrap rounded-lg bg-slate-950 p-4 text-xs leading-5 text-slate-100">
        {sbarMarkdown(card, score)}
      </pre>
    </StageShell>
  );
}

function StageShell({
  icon: Icon,
  title,
  subtitle,
  children
}: {
  icon: typeof PhoneCall;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <h3 className="text-lg font-semibold text-slate-950">{title}</h3>
          <p className="text-sm text-slate-500">{subtitle}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function InfoGrid({ items }: { items: Array<[string, string]> }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {items.map(([label, value]) => (
        <div key={label} className="rounded-lg border border-slate-200 bg-white p-3">
          <span className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</span>
          <strong className="mt-1 block text-sm text-slate-950">{value}</strong>
        </div>
      ))}
    </div>
  );
}

function ClinicalChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <span className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</span>
      <strong className="mt-1 block text-sm capitalize text-slate-950">{value}</strong>
    </div>
  );
}

function VitalInput({
  label,
  value,
  min,
  max,
  step = 1,
  onChange
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="grid gap-1 text-xs font-semibold text-slate-600">
      {label}
      <input
        className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

function ClinicalMetric({
  icon: Icon,
  label,
  value,
  tone
}: {
  icon: typeof AlertTriangle;
  label: string;
  value: string;
  tone: "emerald" | "rose" | "slate";
}) {
  const palette =
    tone === "rose"
      ? "border-rose-200 bg-rose-50 text-rose-700"
      : tone === "emerald"
        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
        : "border-slate-200 bg-white text-slate-700";
  return (
    <article className={`rounded-lg border p-4 ${palette}`}>
      <Icon className="h-5 w-5" />
      <span className="mt-3 block text-[11px] font-semibold uppercase tracking-[0.12em] opacity-70">{label}</span>
      <strong className="mt-1 block text-sm text-slate-950">{value}</strong>
    </article>
  );
}

function EmptyActiveState({ holdCount, onSyntheticOpen }: { holdCount: number; onSyntheticOpen: () => void }) {
  return (
    <div className="flex min-h-[580px] flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
      <PhoneCall className="h-10 w-10 text-emerald-600" />
      <h2 className="mt-4 text-xl font-semibold text-slate-950">No active call</h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">
        Select one caller from the incoming queue. The cockpit blocks a second active encounter until the current call is completed or placed on hold.
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        <Tag>{holdCount} on hold</Tag>
        <button
          type="button"
          className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50"
          onClick={onSyntheticOpen}
        >
          <Database className="h-4 w-4" />
          Review synthetic data
        </button>
      </div>
    </div>
  );
}

function SafetySummaryPanel({
  activeCard,
  score,
  scoreState,
  copied,
  writebackStatus,
  onSyntheticOpen
}: {
  activeCard?: Card;
  score?: ApiScoreResult;
  scoreState: ScoreState;
  copied: boolean;
  writebackStatus: string;
  onSyntheticOpen: () => void;
}) {
  const severity = activeCard ? activeSeverity(activeCard, score) : "Routine";
  const reasons = activeCard ? localSafetyFloorReasons(activeCard) : [];
  const route = activeCard ? routeFor(activeCard, score) : undefined;
  const note = activeCard ? sbarMarkdown(activeCard, score) : "";
  return (
    <aside className="space-y-4">
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Safety Summary</span>
            <h2 className="mt-1 text-lg font-semibold text-slate-950">{activeCard ? activeCard.maskedPatientId : "No active call"}</h2>
          </div>
          <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${severityClass(severity)}`}>
            {severity}
          </span>
        </div>
        {activeCard ? (
          <div className="mt-4 space-y-3 text-sm leading-6 text-slate-700">
            {reasons.length > 0 && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-rose-800">
                <strong className="block">Red-floor override</strong>
                {reasons.join("; ")}
              </div>
            )}
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <strong className="block text-slate-950">{route?.destination}</strong>
              {route?.rationale}
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              {scoreState.status === "loading" && "Authoritative score refresh in progress."}
              {scoreState.status === "ready" && score && `Authoritative API: ${score.riskBand}, score ${score.score}.`}
              {scoreState.status === "error" && scoreState.error}
              {scoreState.status === "idle" && "Awaiting score API response."}
            </div>
            {copied && (
              <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-emerald-800">
                <ClipboardCheck className="h-4 w-4" />
                SBAR copied
              </div>
            )}
          </div>
        ) : (
          <p className="mt-4 text-sm leading-6 text-slate-600">
            Open a queue item to see red floors, route, aviation status, and note preview.
          </p>
        )}
      </section>

      <section className="rounded-lg border border-slate-200 bg-slate-950 p-4 text-white shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <FileText className="h-5 w-5 text-emerald-300" />
          <h3 className="text-base font-semibold">SBAR Preview</h3>
        </div>
        {activeCard ? (
          <pre className="max-h-[340px] overflow-auto whitespace-pre-wrap rounded-lg bg-white/5 p-3 text-xs leading-5 text-slate-100">
            {note}
          </pre>
        ) : (
          <p className="rounded-lg bg-white/5 p-3 text-sm leading-6 text-slate-300">No active note.</p>
        )}
        <div className="mt-3 rounded-lg border border-white/10 bg-white/5 p-3 text-xs leading-5 text-slate-300">
          {writebackStatus}
        </div>
      </section>

      <button
        type="button"
        className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50"
        onClick={onSyntheticOpen}
      >
        <Database className="h-4 w-4" />
        Synthetic records
      </button>
    </aside>
  );
}

function HoldCard({ card, onOpen }: { card?: Card; onOpen: () => void }) {
  if (!card) return null;
  return (
    <article className="rounded-lg border border-amber-200 bg-white p-3">
      <span className="font-mono text-xs font-semibold text-sky-700">{card.maskedPatientId}</span>
      <p className="mt-1 text-sm font-semibold text-slate-950">{card.symptomTextRaw}</p>
      <button
        type="button"
        className="mt-3 inline-flex h-9 items-center gap-2 rounded-lg bg-slate-950 px-3 text-xs font-semibold text-white transition hover:bg-emerald-700"
        onClick={onOpen}
      >
        Resume
        <ArrowRight className="h-3.5 w-3.5" />
      </button>
    </article>
  );
}

function SyntheticDrawer({
  loading,
  error,
  records,
  selectedRecord,
  severity,
  role,
  ageGroup,
  allRoles,
  onClose,
  onSelect,
  onSeverityChange,
  onRoleChange,
  onAgeGroupChange
}: {
  loading: boolean;
  error: string | null;
  records: SyntheticReviewRecord[];
  selectedRecord?: SyntheticReviewRecord;
  severity: Severity | "All";
  role: string;
  ageGroup: SyntheticReviewRecord["ageGroup"] | "All";
  allRoles: string[];
  onClose: () => void;
  onSelect: (id: string) => void;
  onSeverityChange: (value: Severity | "All") => void;
  onRoleChange: (value: string) => void;
  onAgeGroupChange: (value: SyntheticReviewRecord["ageGroup"] | "All") => void;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="ml-auto flex h-full w-full max-w-5xl flex-col bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-slate-200 p-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">Synthetic Data</span>
            <h2 className="mt-1 text-xl font-semibold text-slate-950">Record Review Drawer</h2>
          </div>
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50"
            onClick={onClose}
            aria-label="Close synthetic records"
          >
            <X className="h-5 w-5" />
          </button>
        </header>
        <div className="grid min-h-0 flex-1 gap-0 md:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="border-r border-slate-200 p-4">
            <div className="grid gap-2">
              <SelectControl
                label="Severity"
                value={severity}
                options={["All", "Emergency", "Urgent", "Routine", "Self-care"]}
                onChange={(value) => onSeverityChange(value as Severity | "All")}
              />
              <SelectControl
                label="Role"
                value={role}
                options={["All", ...allRoles]}
                onChange={onRoleChange}
              />
              <SelectControl
                label="Age group"
                value={ageGroup}
                options={["All", "Pediatric", "Adult", "Older adult"]}
                onChange={(value) => onAgeGroupChange(value as SyntheticReviewRecord["ageGroup"] | "All")}
              />
            </div>
            {loading && <p className="mt-4 text-sm text-slate-500">Loading generated records...</p>}
            {error && <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">{error}</p>}
            <div className="mt-4 max-h-[calc(100vh-260px)] space-y-2 overflow-auto pr-1">
              {records.map((record) => (
                <button
                  key={record.id}
                  type="button"
                  className={`w-full rounded-lg border p-3 text-left transition ${
                    selectedRecord?.id === record.id ? "border-emerald-400 bg-emerald-50" : "border-slate-200 bg-white hover:bg-slate-50"
                  }`}
                  onClick={() => onSelect(record.id)}
                >
                  <span className={`inline-flex rounded-full border px-2 py-1 text-[11px] font-semibold ${severityClass(record.severity)}`}>
                    {record.severity}
                  </span>
                  <strong className="mt-2 block text-sm text-slate-950">{record.summary}</strong>
                  <p className="mt-1 text-xs text-slate-500">{record.role} · {record.ageGroup}</p>
                </button>
              ))}
            </div>
          </aside>
          <main className="min-h-0 overflow-auto p-4">
            {selectedRecord ? (
              <div className="space-y-4">
                <InfoGrid
                  items={[
                    ["Record", selectedRecord.id],
                    ["Role", selectedRecord.role],
                    ["Patient type", selectedRecord.patientType],
                    ["Route", selectedRecord.route],
                    ["Age group", selectedRecord.ageGroup],
                    ["Severity", selectedRecord.severity]
                  ]}
                />
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <h3 className="text-base font-semibold text-slate-950">Clinical and AI evaluation context</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{selectedRecord.summary}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {selectedRecord.tags.map((tag) => (
                      <Tag key={tag}>{tag}</Tag>
                    ))}
                  </div>
                </div>
                <pre className="max-h-[480px] overflow-auto whitespace-pre-wrap rounded-lg bg-slate-950 p-4 text-xs leading-5 text-slate-100">
                  {JSON.stringify(selectedRecord.raw, null, 2)}
                </pre>
              </div>
            ) : (
              <p className="text-sm text-slate-500">No synthetic record selected.</p>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
