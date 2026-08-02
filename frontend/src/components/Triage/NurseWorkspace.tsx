import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  ClipboardCheck,
  Copy,
  Database,
  FileText,
  Filter,
  ListChecks,
  MessageCircle,
  PauseCircle,
  PhoneCall,
  PhoneIncoming,
  Plane,
  Search,
  ShieldAlert,
  Stethoscope,
  TimerReset,
  UserRoundCheck,
  X
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type {
  QueueClinicalStage,
  QueueItem,
  QueuePreparedProtocol,
  QueueProtocolQuestionPreview,
  SafetyFloorSource
} from "../../QueueContext";
import { useQueue } from "../../QueueContext";
import { SectionTabs } from "../ui/NavigationControls";
import InitialAssessmentPanel from "./InitialAssessmentPanel";

type ConsciousLevel = "alert" | "voice" | "pain" | "unresponsive";
type Severity = "Emergency" | "Urgent" | "Routine" | "Self-care";
type Channel = "Phone" | "WhatsApp" | "Callback";
type PatientType = "Staff" | "Dependent";
type StageId = "reasonEmergency" | "questions" | "disposition" | "complete";
type CallQueueStatus = "Waiting" | "Incoming telephone call" | "In Call" | "Callback due" | "On hold" | "Closed";

interface Card {
  id: string;
  istStaffId: string;
  dependentId?: string;
  patientName: string;
  patientType: PatientType;
  jobTitle: string;
  department: string;
  symptomTextRaw: string;
  preparedProtocol?: QueuePreparedProtocol;
  stccProcess?: QueueItem["stccProcess"];
  age: number;
  ageMonths?: number;
  ageSource?: "staff" | "dependent";
  ageCalculatedFrom?: string;
  identityValidated?: boolean;
  identityValidationSource?: string;
  identityValidationMessage?: string;
  identityValidatedAtIso?: string;
  biologicalSex: "female" | "male" | "other" | "unknown";
  maskedPatientId: string;
  queueWaitMinutes: number;
  queueStatus: CallQueueStatus;
  channel: Channel;
  stationCode?: string;
  onDuty: boolean;
  outstation: boolean;
  crewCategory: "flight_deck" | "cabin_crew" | "ground_staff" | "dependent" | "other";
  queueFloorActive?: boolean;
  safetyFloorSource?: SafetyFloorSource;
  vitalsUnobtainable?: boolean;
  initialAssessmentResponses?: Record<string, string>;
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
  news2?: {
    respiratoryRate: number;
    spo2: number;
    temperature: number;
    heartRate: number;
    consciousness: number;
    total: number;
  };
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

type AssessmentResponseState = Record<string, boolean>;

const apiBase = import.meta.env.VITE_API_BASE_URL || "";

const stages: Array<{ id: StageId; label: string; shortLabel: string; icon: LucideIcon }> = [
  { id: "reasonEmergency", label: "Reason & Rule-Out", shortLabel: "1", icon: Search },
  { id: "questions", label: "Questions", shortLabel: "2", icon: ListChecks },
  { id: "disposition", label: "Disposition & Advice", shortLabel: "3", icon: Stethoscope },
  { id: "complete", label: "SBAR / Complete", shortLabel: "4", icon: ClipboardCheck }
];

const queueStageToStepIndex: Record<QueueClinicalStage, number> = {
  INTAKE: 0,
  IDENTITY: 0,
  VITALS: 0,
  PROTOCOL: 1,
  DISPOSITION: 2,
  SBAR: 3
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
    queueStatus: "Incoming telephone call",
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
    queueStatus: "Waiting",
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
    queueStatus: "Callback due",
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
    queueStatus: "Incoming telephone call",
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
  if (!card.vitalsUnobtainable) {
    if (card.vitals.consciousLevel !== "alert") reasons.push("AVPU is not Alert");
    if (card.vitals.spo2 < 92) reasons.push("SpO2 below 92%");
    if (card.vitals.heartRate < 60 || card.vitals.heartRate > 130) reasons.push("Heart rate outside 60-130 bpm");
    if (card.vitals.respiratoryRate < 10 || card.vitals.respiratoryRate > 30) {
      reasons.push("Respiratory rate outside 10-30/min");
    }
    if (pediatricTachypnea(card)) reasons.push("Age-banded pediatric tachypnea threshold");
  }
  if (card.queueFloorActive && card.safetyFloorSource === "symptom") {
    reasons.push("Emergency symptom phrase reported by the caller");
  }
  if (card.queueFloorActive && card.safetyFloorSource === "judgment") {
    reasons.push("Nurse triager judgment: sounds life-threatening");
  }
  if (card.queueFloorActive && card.safetyFloorSource === "vitals" && card.vitalsUnobtainable) {
    reasons.push("Red-floor vitals recorded earlier in the queue");
  }
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

function selectedAssessmentQuestion(card: Card, responses: AssessmentResponseState): QueueProtocolQuestionPreview | undefined {
  const mandatoryQuestion = mandatoryAssessmentQuestion(card);
  if (mandatoryQuestion) return mandatoryQuestion;
  return assessmentQuestionsFor(card).find((question) => responses[question.id] === true);
}

function mandatoryAssessmentQuestion(card: Card): QueueProtocolQuestionPreview | undefined {
  const prepared = preparedProtocolFor(card);
  if (card.age >= 18 || !prepared?.primaryProtocolTitle?.startsWith("Shingles (Zoster)")) return undefined;
  return assessmentQuestionsFor(card).find(
    (question) => question.severity === "Urgent" && question.dispositionCode === "HMC_URGENT_REVIEW"
  );
}

function routeForDispositionCode(
  card: Card,
  dispositionCode: string,
  severity: Severity
): { code: string; destination: string; rationale: string } {
  const normalized = dispositionCode.toUpperCase();
  if (normalized.includes("RED") || normalized.includes("EMERGENCY") || severity === "Emergency") {
    if (card.age < 18) {
      return {
        code: "SIDRA_PEDIATRIC_ED",
        destination: "Sidra Medicine Emergency Department",
        rationale: "Pediatric emergency disposition routes to Sidra."
      };
    }
    return {
      code: "HMC_EMERGENCY_DEPARTMENT",
      destination: "Hamad Medical Corporation (HMC) Emergency Department",
      rationale: "Adult emergency disposition routes to HMC emergency care."
    };
  }

  if (normalized.includes("URGENT") || severity === "Urgent") {
    return {
      code: "HMC_URGENT_REVIEW",
      destination: "HMC urgent review pathway",
      rationale: "Urgent disposition requires same-day clinical review."
    };
  }

  if (normalized.includes("ROUTINE") || severity === "Routine") {
    return {
      code: "PHCC_URGENT_CARE_OR_TELECONSULT",
      destination: "PHCC urgent care or IST teleconsult",
      rationale: "Routine disposition routes to primary care or IST teleconsult, with callback precautions."
    };
  }

  return {
    code: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
    destination: "Self-care with callback precautions",
    rationale: "Self-care is permitted only after higher acuity levels are answered No."
  };
}

function activeSeverityFromAssessment(card: Card, score: ApiScoreResult | undefined, responses: AssessmentResponseState): Severity {
  if (localSafetyFloorReasons(card).length > 0 || score?.redAlertTriggered) return "Emergency";
  return selectedAssessmentQuestion(card, responses)?.severity ?? activeSeverity(card, score);
}

function routeFromAssessment(
  card: Card,
  score: ApiScoreResult | undefined,
  responses: AssessmentResponseState
): { code: string; destination: string; rationale: string } {
  if (localSafetyFloorReasons(card).length > 0 || score?.redAlertTriggered) return routeFor(card, score);
  const selectedQuestion = selectedAssessmentQuestion(card, responses);
  if (selectedQuestion) {
    return routeForDispositionCode(card, selectedQuestion.dispositionCode, selectedQuestion.severity);
  }
  return routeFor(card, score);
}

function careAdviceFor(
  card: Card,
  responses: AssessmentResponseState,
  route: { code: string; destination: string; rationale: string }
): Array<{ title: string; body: string }> {
  const selectedQuestion = selectedAssessmentQuestion(card, responses);
  const ids = selectedQuestion?.careAdviceIds ?? [];
  const reason = card.symptomTextRaw.toLowerCase();

  if (route.code === "SIDRA_PEDIATRIC_ED" || route.code === "HMC_EMERGENCY_DEPARTMENT") {
    return [
      {
        title: "First aid while arranging emergency care",
        body: "Keep the patient safe, avoid food or drink if urgent transfer is likely, and do not allow duty continuation or travel until emergency care clears the patient."
      }
    ];
  }

  if (reason.includes("ankle") || reason.includes("foot") || ids.includes("ankle-foot-injury-care")) {
    return [
      {
        title: "Apply a cold pack",
        body: "Apply a wrapped cold pack for 20 minutes, repeat as needed, elevate the limb, and avoid painful weight-bearing."
      },
      {
        title: "Pain medicines and warnings",
        body: "Use only approved medicines per local policy. Escalate if pain, swelling, numbness, color change, or walking ability worsens."
      }
    ];
  }

  if (route.code === "SELF_CARE_WITH_CALLBACK_PRECAUTIONS") {
    return [
      {
        title: "Self-care with callback precautions",
        body: "Give clear home-care advice, expected recovery window, and red-flag callback instructions. No duty clearance is implied."
      }
    ];
  }

  return [
    {
      title: "Clinic review and safety-net advice",
      body: "Book or direct the patient to the routed clinical service and provide red-flag callback precautions before ending the call."
    }
  ];
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
  if (item.patientAge) return item.patientAge.ageYears;
  if (item.patientType === "Dependent") return 8;
  return item.jobTitle?.toLowerCase().includes("pilot") ? 35 : 32;
}

function stageIndexFromQueue(item: QueueItem): number {
  return queueStageToStepIndex[item.currentStage] ?? 0;
}

function minutesInQueue(createdAtIso?: string, fallback = 0): number {
  if (!createdAtIso) return fallback;
  const createdAtMs = new Date(createdAtIso).getTime();
  if (Number.isNaN(createdAtMs)) return fallback;
  return Math.max(0, Math.round((Date.now() - createdAtMs) / 60_000));
}

function callQueueStatusFrom(item: QueueItem): CallQueueStatus {
  if (item.status === "COMPLETED") return "Closed";
  if (item.status === "INFO_REQUIRED") return "On hold";
  if (item.status === "IN_PROCESS") return "In Call";
  if (item.channel === "Callback") return "Callback due";
  if (item.channel === "Phone") return "Incoming telephone call";
  return "Waiting";
}

function queueStageFromStep(index: number): QueueClinicalStage {
  const stageId = stages[index]?.id ?? "reasonEmergency";
  if (stageId === "reasonEmergency") return "VITALS";
  if (stageId === "questions") return "PROTOCOL";
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
    symptomTextRaw: item.reasonNarrative ?? item.summary,
    preparedProtocol: item.preparedProtocol,
    stccProcess: item.stccProcess,
    age,
    ageMonths: item.patientAge?.ageMonths,
    ageSource: item.patientAge?.source,
    ageCalculatedFrom: item.patientAge?.calculatedFrom,
    identityValidated: item.identityValidated,
    identityValidationSource: item.identityValidationSource,
    identityValidationMessage: item.identityValidationMessage,
    identityValidatedAtIso: item.identityValidatedAtIso,
    biologicalSex: "unknown",
    maskedPatientId: item.patientType === "Dependent" ? `DEP-${item.id.slice(-4)}***` : `${item.istStaffId.slice(0, 6)}***`,
    queueWaitMinutes: minutesInQueue(item.createdAtIso),
    queueStatus: callQueueStatusFrom(item),
    channel: channelFrom(item),
    stationCode: item.stationCode,
    onDuty: item.customAviationTags.some((tag) => tag.toLowerCase().includes("fit-to-fly")),
    outstation: item.customAviationTags.some((tag) => tag.toLowerCase().includes("outstation")) || item.stationCode !== "DOH",
    crewCategory: crewCategoryFrom(item),
    queueFloorActive: item.safetyFloorActive,
    safetyFloorSource: item.safetyFloorSource ?? (item.safetyFloorActive ? "vitals" : undefined),
    vitalsUnobtainable: item.vitalsUnobtainable ?? !item.vitals,
    initialAssessmentResponses: item.initialAssessmentResponses,
    vitals: item.vitals ?? {
      heartRate: 82,
      respiratoryRate: 16,
      spo2: 98,
      temperature: item.patientType === "Dependent" ? 37.4 : 36.9,
      consciousLevel: "alert"
    }
  };
}

function dispositionRestrictsFitToFly(severity: Severity): boolean {
  return severity === "Emergency" || severity === "Urgent";
}

type FitToFlyStatus = "CLEARED" | "RESTRICTED" | "MEDICAL_REVIEW_REQUIRED";

function hasAviationFitToFlyTrigger(card: Card): boolean {
  const text = card.symptomTextRaw.toLowerCase();
  return (
    card.onDuty ||
    card.outstation ||
    text.includes("fit-to-fly") ||
    text.includes("sickness") ||
    text.includes("dizzy") ||
    text.includes("syncope") ||
    text.includes("chest") ||
    text.includes("shortness of breath") ||
    text.includes("altered consciousness")
  );
}

function fitToFlyStatus(card: Card, severity: Severity): FitToFlyStatus {
  if (dispositionRestrictsFitToFly(severity)) return "RESTRICTED";
  if (severity === "Routine" && isActiveFlightCrew(card)) return "RESTRICTED";
  if (card.onDuty && hasAviationFitToFlyTrigger(card)) return "RESTRICTED";
  if (hasAviationFitToFlyTrigger(card)) return "MEDICAL_REVIEW_REQUIRED";
  return "CLEARED";
}

function fitToFlyRuleText(severity: Severity): string {
  if (dispositionRestrictsFitToFly(severity)) {
    return "Rule: STCC final Emergency or Urgent disposition blocks fit-to-fly clearance until clinician review, even for dependent cases.";
  }

  return "Rule: STCC disposition is evaluated first; the aviation layer can restrict routine crew cases or keep fit-to-fly under review when duty, outstation, sickness, or operational symptom triggers are present.";
}

function fitToFlyTone(status: FitToFlyStatus): "emerald" | "amber" | "rose" {
  if (status === "RESTRICTED") return "rose";
  if (status === "MEDICAL_REVIEW_REQUIRED") return "amber";
  return "emerald";
}

function aviationTagsForFitToFly(status: FitToFlyStatus): string[] {
  if (status === "RESTRICTED") return ["fit-to-fly-review", "duty-restriction"];
  if (status === "MEDICAL_REVIEW_REQUIRED") return ["fit-to-fly-review"];
  return [];
}

function severityClass(severity: Severity): string {
  if (severity === "Emergency") return "bg-rose-50 text-rose-700 border-rose-200";
  if (severity === "Urgent") return "bg-amber-50 text-amber-700 border-amber-200";
  if (severity === "Routine") return "bg-sky-50 text-sky-700 border-sky-200";
  return "bg-emerald-50 text-emerald-700 border-emerald-200";
}

function severityAccentBorder(severity: Severity): string {
  if (severity === "Emergency") return "border-rose-500";
  if (severity === "Urgent") return "border-amber-500";
  if (severity === "Routine") return "border-sky-500";
  return "border-emerald-500";
}

function severityCircleClass(severity: Severity): string {
  if (severity === "Emergency") return "bg-rose-100 text-rose-700";
  if (severity === "Urgent") return "bg-amber-100 text-amber-700";
  if (severity === "Routine") return "bg-sky-100 text-sky-700";
  return "bg-emerald-100 text-emerald-700";
}

function severityTagClass(severity: Severity): string {
  if (severity === "Emergency") return "text-rose-700";
  if (severity === "Urgent") return "text-amber-700";
  if (severity === "Routine") return "text-sky-700";
  return "text-emerald-700";
}

function severityResultCardClass(severity: Severity): string {
  if (severity === "Emergency") return "border-rose-300 bg-rose-50";
  if (severity === "Urgent") return "border-amber-300 bg-amber-50";
  if (severity === "Routine") return "border-sky-300 bg-sky-50";
  return "border-emerald-300 bg-emerald-50";
}

function sbarMarkdown(card: Card, score?: ApiScoreResult, assessmentResponses: AssessmentResponseState = {}): string {
  const severity = activeSeverityFromAssessment(card, score, assessmentResponses);
  const route = routeFromAssessment(card, score, assessmentResponses);
  const reasons = localSafetyFloorReasons(card);
  const fitStatus = fitToFlyStatus(card, severity);
  const vitals = card.vitalsUnobtainable
    ? "Vitals not obtained on call; symptom-based safety floor applied"
    : `HR ${card.vitals.heartRate}, RR ${card.vitals.respiratoryRate}, SpO2 ${card.vitals.spo2}%, Temp ${card.vitals.temperature}C, AVPU ${card.vitals.consciousLevel}`;
  const initialAssessmentEntries = Object.entries(card.initialAssessmentResponses ?? {});
  const initialAssessmentLine =
    initialAssessmentEntries.length > 0
      ? `Initial assessment: ${initialAssessmentEntries.map(([prompt, answer]) => `${prompt} ${answer}`).join(" | ")}.`
      : undefined;

  return [
    "# IST Health Tele-Triage SBAR",
    "",
    "## English",
    `S: ${card.patientName} (${card.maskedPatientId}), ${card.age} years, ${card.jobTitle}, reports ${card.symptomTextRaw}`,
    `B: Department ${card.department}; channel ${card.channel}; station ${card.stationCode ?? "DOH"}.`,
    `A: ${vitals}. Severity ${severity}. ${reasons.length > 0 ? `Safety floor: ${reasons.join("; ")}.` : "No emergency safety floor currently triggered."}${initialAssessmentLine ? ` ${initialAssessmentLine}` : ""}`,
    `R: Route to ${route.destination} (${route.code}). Fit-to-fly ${fitStatus}. ${fitToFlyRuleText(severity)}`,
    "",
    "## Arabic",
    `الحالة: معرف المريض ${card.maskedPatientId}، العمر ${card.age} سنة، الشكوى: ${card.symptomTextRaw}`,
    `الخلفية: القسم ${card.department}، قناة التواصل ${card.channel}، المحطة ${card.stationCode ?? "DOH"}.`,
    `التقييم: العلامات الحيوية ${vitals}. مستوى الخطورة ${severity}.`,
    `التوصية: التوجيه إلى ${route.destination}. حالة اللياقة للطيران ${fitStatus}. ${fitToFlyRuleText(severity)}`
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
  const { queue, activeItem, connectCall, updateItemContext, moveItem } = useQueue();
  const [cardsById, setCardsById] = useState<Record<string, Card>>(() =>
    Object.fromEntries(initialCards.map((card) => [card.id, card]))
  );
  const [queueIds, setQueueIds] = useState(() => initialCards.map((card) => card.id));
  const [holdIds, setHoldIds] = useState<string[]>([]);
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [activeFocusOpen, setActiveFocusOpen] = useState(false);
  const [stageIndex, setStageIndex] = useState(0);
  const [scoreByCardId, setScoreByCardId] = useState<Record<string, ScoreState>>({});
  const [assessmentResponsesByCardId, setAssessmentResponsesByCardId] = useState<Record<string, AssessmentResponseState>>({});
  const [toast, setToast] = useState<Toast | null>(null);
  const [writebackStatus, setWritebackStatus] = useState("No encounter completed in this session.");
  const [copiedCardIds, setCopiedCardIds] = useState<Set<string>>(() => new Set());
  const [severityFilter, setSeverityFilter] = useState<Severity | "All">("All");
  const [patientFilter, setPatientFilter] = useState<PatientType | "All">("All");
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
  const previousActiveItemIdRef = useRef<string | undefined>();

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
    const isNewActiveItem = previousActiveItemIdRef.current !== activeItem.id;
    previousActiveItemIdRef.current = activeItem.id;
    const card = queueItemToCard(activeItem);
    setCardsById((current) => ({ ...current, [card.id]: card }));
    setQueueIds((current) => current.filter((id) => id !== card.id));
    setHoldIds((current) => current.filter((id) => id !== card.id));
    setActiveCardId(card.id);
    if (isNewActiveItem) {
      setActiveFocusOpen(true);
    }
    setStageIndex(stageIndexFromQueue(activeItem));
  }, [activeItem]);

  const filteredQueue = useMemo(() => {
    const cards = queueIds.map((id) => cardsById[id]).filter((card): card is Card => Boolean(card));
    return cards
      .filter((card) => severityFilter === "All" || localSeverity(card) === severityFilter)
      .filter((card) => patientFilter === "All" || card.patientType === patientFilter)
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
  }, [cardsById, dutyFilter, patientFilter, queueIds, severityFilter, sortMode]);

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
    if (!activeCard || activeCard.vitalsUnobtainable) return undefined;

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

  const initialAssessmentPatchTimer = useRef<number | undefined>();

  function updateInitialAssessmentAnswers(cardId: string, answers: Record<string, string>) {
    updateCard(cardId, { initialAssessmentResponses: answers });
    if (activeItem?.id !== cardId) return;
    window.clearTimeout(initialAssessmentPatchTimer.current);
    initialAssessmentPatchTimer.current = window.setTimeout(() => {
      void updateItemContext(cardId, { initialAssessmentResponses: answers });
    }, 600);
  }

  function setVitalsUnobtainable(cardId: string, value: boolean) {
    updateCard(cardId, { vitalsUnobtainable: value });
    if (value) {
      setScoreByCardId((current) => ({ ...current, [cardId]: { status: "idle" } }));
    }
    if (activeItem?.id === cardId) {
      void updateItemContext(cardId, { vitalsUnobtainable: value });
    }
  }

  async function escalateEmergency(source: "symptom" | "judgment", reason: string) {
    if (!activeCard) return;
    const route =
      activeCard.age < 18
        ? { code: "SIDRA_PEDIATRIC_ED", destination: "Sidra Medicine Emergency Department" }
        : { code: "HMC_EMERGENCY_DEPARTMENT", destination: "Hamad Medical Corporation (HMC) Emergency Department" };

    updateCard(activeCard.id, { queueFloorActive: true, safetyFloorSource: source });

    if (activeItem?.id === activeCard.id) {
      try {
        await updateItemContext(activeCard.id, {
          calculatedSeverity: "EMERGENCY",
          floorSource: source,
          dispositionCode: route.code,
          destinationName: route.destination
        });
      } catch (error) {
        showToast(error instanceof Error ? error.message : "Queue escalation failed. Escalate manually.", "warning");
        return;
      }
    }
    showToast(`Emergency floor set (${source === "judgment" ? "triager judgment" : "emergency phrase"}): ${reason}`, "warning");
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

  function updateAssessmentResponses(cardId: string, updates: AssessmentResponseState) {
    const currentResponses = assessmentResponsesByCardId[cardId] ?? {};
    const nextResponses = { ...currentResponses, ...updates };
    setAssessmentResponsesByCardId((current) => ({
      ...current,
      [cardId]: nextResponses
    }));

    if (activeItem?.id === cardId) {
      void updateItemContext(cardId, {
        triageAssessmentQuestionResponses: nextResponses
      });
    }
  }

  async function openCall(cardId: string) {
    if (activeCardId && activeCardId !== cardId) {
      showToast("A call is already active. Complete it or place it on hold before opening another call.", "warning");
      return;
    }

    try {
      if (queue.some((item) => item.id === cardId)) {
        const action = cardsById[cardId]?.channel === "Callback" ? "START_CALLBACK" : "ANSWER";
        const connected = await connectCall(cardId, action);
        setStageIndex(stageIndexFromQueue(connected.item));
        showToast(
          action === "START_CALLBACK"
            ? "Callback connected through the provider-neutral gateway."
            : "Incoming call answered through the provider-neutral gateway.",
          "success"
        );
      } else {
        setStageIndex(0);
      }
      setQueueIds((current) => current.filter((id) => id !== cardId));
      setHoldIds((current) => current.filter((id) => id !== cardId));
      setActiveCardId(cardId);
      setActiveFocusOpen(true);
      if (!queue.some((item) => item.id === cardId)) {
        showToast("Call opened in the nurse cockpit.", "success");
      }
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Unable to open queue item.", "warning");
    }
  }

  function holdActiveCall() {
    if (!activeCardId) return;
    setHoldIds((current) => [...new Set([...current, activeCardId])]);
    setActiveCardId(null);
    setActiveFocusOpen(false);
    setStageIndex(0);
    showToast("Call placed in Information Required / callback hold.", "info");
  }

  async function handleStageChange(nextIndex: number) {
    const boundedIndex = Math.max(0, Math.min(nextIndex, stages.length - 1));
    if (!activeItem || activeItem.id !== activeCardId || activeCard?.queueStatus === "Closed") {
      setStageIndex(boundedIndex);
      return;
    }

    const toStage = queueStageFromStep(boundedIndex);
    if (toStage === activeItem.currentStage) {
      setStageIndex(boundedIndex);
      return;
    }

    try {
      if (activeCard && boundedIndex >= 1) {
        const prepared = preparedProtocolFor(activeCard);
        const route = routeFromAssessment(activeCard, activeScoreResult, assessmentResponsesByCardId[activeCard.id] ?? {});
        const severity = activeSeverityFromAssessment(activeCard, activeScoreResult, assessmentResponsesByCardId[activeCard.id] ?? {});
        await updateItemContext(activeCard.id, {
          vitals: activeCard.vitalsUnobtainable ? undefined : activeCard.vitals,
          matchedProtocolId: prepared?.primaryProtocolId ?? activeScoreResult?.dispositionCode ?? "phase1-rules-first-protocol",
          calculatedSeverity: severity === "Self-care" ? "SELF_CARE" : severity.toUpperCase(),
          dispositionCode: route.code,
          destinationName: route.destination
        });
      }
      await moveItem(activeItem.id, toStage, "IN_PROCESS", "Step cockpit stage change with sequence validation.");
      setStageIndex(boundedIndex);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Stage movement blocked by queue rules.", "warning");
    }
  }

  async function postCompletion(card: Card, score?: ApiScoreResult, assessmentResponses: AssessmentResponseState = {}) {
    const route = routeFromAssessment(card, score, assessmentResponses);
    const severity = activeSeverityFromAssessment(card, score, assessmentResponses);
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
        objective: card.vitalsUnobtainable
          ? "Vitals not obtained on call; symptom-based safety floor applied"
          : `HR ${card.vitals.heartRate}, RR ${card.vitals.respiratoryRate}, SpO2 ${card.vitals.spo2}, Temp ${card.vitals.temperature}, AVPU ${card.vitals.consciousLevel}`,
        assessment: `Rules-first severity ${severity}. ${localSafetyFloorReasons(card).join("; ") || "No red floor."}`,
        recommendation: route.destination,
        final_disposition_code: route.code,
        routing_destination: route.destination,
        safety_rationale: route.rationale,
        custom_aviation_tags: aviationTagsForFitToFly(fitToFlyStatus(card, severity))
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
      showToast("Move to Action 4 before completing the encounter.", "warning");
      return;
    }

    try {
      const assessmentResponses = assessmentResponsesByCardId[card.id] ?? {};
      await copyText(sbarMarkdown(card, activeScoreResult, assessmentResponses));
      setCopiedCardIds((current) => new Set([...current, card.id]));
      await postCompletion(card, activeScoreResult, assessmentResponses);
      if (activeItem?.id === card.id) {
        const route = routeFromAssessment(card, activeScoreResult, assessmentResponses);
        const severity = activeSeverityFromAssessment(card, activeScoreResult, assessmentResponses);
        await updateItemContext(card.id, {
          clinicalApproval: {
            approvedBy: "Remote Triage Nurse",
            approvedAtIso: new Date().toISOString(),
            approvalType: "sbar-copy-and-close"
          },
          sbarCopied: true,
          matchedProtocolId: activeScoreResult?.dispositionCode ? "phase1-rules-first-protocol" : "manual-route-review",
          calculatedSeverity: severity === "Self-care" ? "SELF_CARE" : severity.toUpperCase(),
          dispositionCode: route.code,
          destinationName: route.destination
        });
        await moveItem(card.id, "SBAR", "COMPLETED", "SBAR copied and nurse-approved for queue closure.");
      }
      await postEmrWriteback(card);
      setCompletedIds((current) => [...new Set([...current, card.id])]);
      setActiveCardId(null);
      setActiveFocusOpen(false);
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
      <header className="ist-surface ist-section-shell">
        <div className="flex flex-nowrap items-center justify-between gap-3 overflow-x-auto">
          <div className="shrink-0">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Tele-Triage</span>
            <h1 className="mt-1 text-[15px] font-semibold tracking-normal text-slate-950 md:text-[18px]">
              Call Queue
            </h1>
          </div>

          <div className="flex flex-nowrap items-center gap-1">
            <ToggleFilterGroup
              icon={Filter}
              label="Sort"
              fullLabel="Sort"
              value={sortMode}
              options={["Priority", "Wait"]}
              valueMap={{ Priority: "Clinical priority", Wait: "Longest wait" }}
              optionTooltips={{
                Priority: "Sort by clinical priority (most urgent first)",
                Wait: "Sort by longest wait time first"
              }}
              onChange={(value) => setSortMode(value as "Clinical priority" | "Longest wait")}
              accent="indigo"
            />
            <ToggleFilterGroup
              label="Severity"
              fullLabel="Severity"
              value={severityFilter}
              options={["All", "Emergency", "Urgent", "Routine", "Self-care"]}
              onChange={(value) => setSeverityFilter(value as Severity | "All")}
              colorByOption={SEVERITY_OPTION_COLOR}
            />
            <ToggleFilterGroup
              label="Patient"
              fullLabel="Patient"
              value={patientFilter}
              options={["All", "Staff", "Dependent"]}
              onChange={(value) => setPatientFilter(value as PatientType | "All")}
              accent="teal"
            />
            <ToggleFilterGroup
              label="Duty"
              fullLabel="Duty status"
              value={dutyFilter}
              options={["All", "On-duty", "Outstation"]}
              onChange={(value) => setDutyFilter(value as "All" | "On-duty" | "Outstation")}
              accent="violet"
            />
          </div>

          <div className="ist-stat-row grid shrink-0 text-center" style={{ gridTemplateColumns: "repeat(4, 75px)" }}>
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
          onOpen={openCall}
        />

        <main className="ist-surface min-h-[640px] p-4">
          {holdIds.length > 0 && (
            <section className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
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

          {activeCard ? (
            <ActiveCallSummaryCard
              card={activeCard}
              stageIndex={stageIndex}
              score={activeScoreResult}
              assessmentResponses={assessmentResponsesByCardId[activeCard.id] ?? {}}
              onResume={() => setActiveFocusOpen(true)}
              onHold={holdActiveCall}
            />
          ) : (
            <EmptyActiveState holdCount={holdIds.length} onSyntheticOpen={openSyntheticDrawer} />
          )}
        </main>

        <SafetySummaryPanel
          activeCard={activeCard}
          score={activeScoreResult}
          assessmentResponses={activeCard ? assessmentResponsesByCardId[activeCard.id] ?? {} : {}}
          scoreState={activeScore ?? { status: "idle" }}
          copied={activeCard ? copiedCardIds.has(activeCard.id) : false}
          writebackStatus={writebackStatus}
          onSyntheticOpen={openSyntheticDrawer}
        />
      </div>

      {activeCard && activeFocusOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-50" role="dialog" aria-modal="true" aria-label="Active triage focus">
          <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-4 py-2 backdrop-blur">
            <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                className="secondary-button w-fit"
                onClick={() => setActiveFocusOpen(false)}
              >
                <ArrowLeft className="h-4 w-4" />
                Back to queue
              </button>
              <div className="flex min-w-0 flex-1 items-center justify-end gap-3">
                <div className="min-w-0 text-right">
                  <span className="text-[11px] uppercase tracking-[0.14em] text-emerald-700">Active triage focus</span>
                  <p className="truncate text-xs text-slate-600">
                    {activeCard.maskedPatientId} - {stages[stageIndex].label}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={holdActiveCall}
                  >
                    <PauseCircle className="h-4 w-4" />
                    Hold
                  </button>
                  <button
                    type="button"
                    className="primary-button"
                    onClick={() => copyAndComplete(activeCard)}
                    disabled={stageIndex !== stages.length - 1}
                  >
                    <Copy className="h-4 w-4" />
                    Complete
                  </button>
                </div>
              </div>
            </div>
          </header>
          <main className="mx-auto max-w-[1600px] px-4 py-3">
            <ActiveCallPanel
              card={activeCard}
              stageIndex={stageIndex}
              scoreState={activeScore ?? { status: "idle" }}
              assessmentResponses={assessmentResponsesByCardId[activeCard.id] ?? {}}
              onStageChange={handleStageChange}
              onUpdateCard={(patch) => updateCard(activeCard.id, patch)}
              onVitalsChange={(nextVitals) => updateCardVitals(activeCard.id, nextVitals)}
              onAssessmentResponses={(updates) => updateAssessmentResponses(activeCard.id, updates)}
              onEscalate={escalateEmergency}
              onVitalsUnobtainable={(value) => setVitalsUnobtainable(activeCard.id, value)}
              onInitialAssessmentChange={(answers) => updateInitialAssessmentAnswers(activeCard.id, answers)}
            />
          </main>
        </div>
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
    <div className="ist-stat-cell">
      <strong>{value}</strong>
      <span>{label}</span>
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
  onOpen
}: {
  cards: Card[];
  queueWaitLabel: string;
  redQueueCount: number;
  onOpen: (cardId: string) => void;
}) {
  return (
    <aside className="ist-surface ist-filter-panel">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <PhoneCall className="h-4 w-4 text-emerald-600" />
            <p className="text-xs text-slate-500">{queueWaitLabel} · {redQueueCount} red-floor cases</p>
          </div>
        </div>
        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
          Live
        </span>
      </div>

      <div className="max-h-[650px] space-y-2 overflow-auto pr-1">
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
        className="ist-control h-9 px-2 text-xs font-normal normal-case tracking-normal outline-none transition"
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

type FilterAccent = "slate" | "indigo" | "teal" | "violet";

const ACCENT_LABEL_CLASS: Record<FilterAccent, string> = {
  slate: "text-slate-400",
  indigo: "text-indigo-500",
  teal: "text-teal-600",
  violet: "text-violet-500"
};

const ACCENT_GROUP_BG: Record<FilterAccent, string> = {
  slate: "bg-slate-50/60",
  indigo: "bg-indigo-50/50",
  teal: "bg-teal-50/50",
  violet: "bg-violet-50/50"
};

const ACCENT_PILL_ACTIVE: Record<FilterAccent, string> = {
  slate: "bg-slate-900 text-white",
  indigo: "bg-indigo-600 text-white",
  teal: "bg-teal-600 text-white",
  violet: "bg-violet-600 text-white"
};

const ACCENT_PILL_INACTIVE: Record<FilterAccent, string> = {
  slate: "bg-slate-100 text-slate-600 hover:bg-slate-200",
  indigo: "bg-indigo-100/70 text-indigo-700 hover:bg-indigo-100",
  teal: "bg-teal-100/70 text-teal-700 hover:bg-teal-100",
  violet: "bg-violet-100/70 text-violet-700 hover:bg-violet-100"
};

/** Semantic per-option colors for the Severity group only - mirrors the
 *  Emergency/Urgent/Routine/Self-care colors already used on queue cards
 *  (see severityBadgeClass-style lookups elsewhere in this file). */
const SEVERITY_OPTION_COLOR: Record<string, { active: string; inactive: string }> = {
  Emergency: { active: "bg-rose-700 text-white", inactive: "bg-rose-50 text-rose-700 hover:bg-rose-100" },
  Urgent: { active: "bg-amber-600 text-white", inactive: "bg-amber-50 text-amber-700 hover:bg-amber-100" },
  Routine: { active: "bg-blue-600 text-white", inactive: "bg-blue-50 text-blue-700 hover:bg-blue-100" },
  "Self-care": { active: "bg-emerald-600 text-white", inactive: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" }
};

function ToggleFilterGroup({
  icon: Icon,
  label,
  fullLabel,
  value,
  options,
  valueMap,
  optionTooltips,
  onChange,
  accent = "slate",
  colorByOption
}: {
  icon?: typeof Filter;
  label: string;
  /** Full-word group name used in the hover tooltip (label itself may be abbreviated). */
  fullLabel?: string;
  value: string;
  options: string[];
  /** Optional display-label -> actual-value map, for showing shorter option
   *  text than the underlying value (e.g. "Priority" for "Clinical priority"). */
  valueMap?: Record<string, string>;
  /** Optional per-option hover-tooltip override; falls back to a generic
   *  "{group}: show only {option}" description when not provided. */
  optionTooltips?: Record<string, string>;
  onChange: (value: string) => void;
  /** Group-wide accent color for the label and active/inactive pills. */
  accent?: FilterAccent;
  /** Optional per-option color override (e.g. Severity's semantic colors),
   *  takes precedence over `accent` for the matching option. */
  colorByOption?: Record<string, { active: string; inactive: string }>;
}) {
  return (
    <div className={`flex shrink-0 flex-col items-center gap-0.5 rounded-md px-1.5 py-1 ${ACCENT_GROUP_BG[accent]}`}>
      <span
        className={`flex items-center justify-center gap-0.5 whitespace-nowrap text-[9px] font-semibold uppercase tracking-[0.04em] ${ACCENT_LABEL_CLASS[accent]}`}
      >
        {Icon && <Icon className="h-2.5 w-2.5" />}
        {label}
      </span>
      <div className="flex flex-nowrap gap-0.5">
        {options.map((option) => {
          const actualValue = valueMap?.[option] ?? option;
          const active = actualValue === value;
          const tooltip =
            optionTooltips?.[option] ??
            `${fullLabel ?? label}: show ${option === "All" ? "all calls" : `only ${option}`}`;
          const colors = colorByOption?.[option];
          const colorClass = colors
            ? active
              ? colors.active
              : colors.inactive
            : active
              ? ACCENT_PILL_ACTIVE[accent]
              : ACCENT_PILL_INACTIVE[accent];
          return (
            <button
              key={option}
              type="button"
              onClick={() => onChange(actualValue)}
              aria-pressed={active}
              title={tooltip}
              className={`ist-filter-toggle flex h-[36px] w-[63px] shrink-0 items-center justify-center whitespace-nowrap px-1.5 text-center text-[10px] font-medium leading-none transition ${colorClass}`}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function QueueCard({ card, onOpen }: { card: Card; onOpen: () => void }) {
  const severity = localSeverity(card);
  const red = severity === "Emergency";
  const action = actionLabelFor(card);
  const gender = card.biologicalSex === "unknown" ? "Not set" : card.biologicalSex.slice(0, 1).toUpperCase();
  return (
    <article className={`ist-record-card ${red ? "ist-record-card-danger" : ""}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-2">
          <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md border text-sm font-normal ${acuityClass(severity)}`}>
            {acuityNumber(severity)}
          </span>
          <div className="min-w-0">
            <span className="font-mono text-xs font-normal text-sky-700">{card.maskedPatientId}</span>
            <h3 className="mt-1 truncate text-sm font-semibold text-slate-950">{card.patientType}</h3>
          </div>
        </div>
        <span className={`rounded-md border px-2 py-1 text-[10px] font-normal uppercase tracking-[0.08em] ${callStatusClass(card.queueStatus)}`}>
          {card.queueStatus}
        </span>
      </div>
      <p className="mt-3 text-sm leading-5 text-slate-700">{card.symptomTextRaw}</p>
      <dl className="mt-3 grid grid-cols-4 gap-2 border-t border-slate-100 pt-3 text-[11px]">
        <CallFact label="Age" value={`${card.age}`} />
        <CallFact label="Sex" value={gender} />
        <CallFact label="Queue" value={`${card.queueWaitMinutes}m`} />
        <CallFact label="Channel" value={card.channel} />
      </dl>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <Tag>{severity}</Tag>
        <Tag>{card.jobTitle}</Tag>
        {card.outstation && <Tag>{card.stationCode ?? "Outstation"}</Tag>}
      </div>
      <button
        type="button"
        className="primary-button mt-3 w-full"
        onClick={onOpen}
      >
        {action}
        <ArrowRight className="h-3.5 w-3.5" />
      </button>
    </article>
  );
}

function acuityNumber(severity: Severity): number {
  if (severity === "Emergency") return 2;
  if (severity === "Urgent") return 3;
  if (severity === "Routine") return 4;
  return 5;
}

function acuityClass(severity: Severity): string {
  if (severity === "Emergency") return "border-rose-200 bg-rose-100 text-rose-800";
  if (severity === "Urgent") return "border-amber-200 bg-amber-100 text-amber-800";
  if (severity === "Routine") return "border-emerald-200 bg-emerald-100 text-emerald-800";
  return "border-slate-200 bg-slate-100 text-slate-700";
}

function callStatusClass(status: CallQueueStatus): string {
  if (status === "Incoming telephone call") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "Callback due") return "border-sky-200 bg-sky-50 text-sky-700";
  if (status === "In Call") return "border-amber-200 bg-amber-50 text-amber-700";
  if (status === "On hold") return "border-slate-200 bg-slate-50 text-slate-600";
  if (status === "Closed") return "border-slate-200 bg-slate-100 text-slate-500";
  return "border-emerald-200 bg-emerald-50 text-emerald-700";
}

function actionLabelFor(card: Card): string {
  if (card.queueStatus === "In Call") return "Open triage";
  if (card.queueStatus === "On hold") return "Resume call";
  if (card.queueStatus === "Closed") return "Closed";
  if (card.queueStatus === "Callback due" || card.channel === "Callback") return "Call back";
  if (card.queueStatus === "Incoming telephone call" || card.channel === "Phone") return "Answer call";
  return "Open call";
}

function CallFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="truncate uppercase tracking-[0.08em] text-slate-400">{label}</dt>
      <dd className="mt-0.5 truncate font-normal text-slate-700">{value}</dd>
    </div>
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
  assessmentResponses,
  onStageChange,
  onUpdateCard,
  onVitalsChange,
  onAssessmentResponses,
  onEscalate,
  onVitalsUnobtainable,
  onInitialAssessmentChange
}: {
  card: Card;
  stageIndex: number;
  scoreState: ScoreState;
  assessmentResponses: AssessmentResponseState;
  onStageChange: (index: number) => void;
  onUpdateCard: (patch: Partial<Card>) => void;
  onVitalsChange: (nextVitals: Partial<Card["vitals"]>) => void;
  onAssessmentResponses: (updates: AssessmentResponseState) => void;
  onEscalate: (source: "symptom" | "judgment", reason: string) => void;
  onVitalsUnobtainable: (value: boolean) => void;
  onInitialAssessmentChange: (answers: Record<string, string>) => void;
}) {
  const score = "result" in scoreState ? scoreState.result : undefined;
  const severity = activeSeverityFromAssessment(card, score, assessmentResponses);
  const route = routeFromAssessment(card, score, assessmentResponses);
  const reasons = localSafetyFloorReasons(card);
  const finalStage = stageIndex === stages.length - 1;
  const isLocked = card.queueStatus === "Closed";

  return (
    <div className="space-y-2">
      <Stepper activeIndex={stageIndex} onSelect={onStageChange} />

      {isLocked && (
        <div className="ist-surface flex items-center gap-2 border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">
          <span aria-hidden="true">🔒</span>
          <span>
            This encounter is completed. Its clinical record is locked and cannot be edited. Reopen it explicitly
            (queue manager action) before making changes.
          </span>
        </div>
      )}

      {reasons.length > 0 && <RedFloorBanner reasons={reasons} />}

      <section className={`ist-surface p-3 ${isLocked ? "pointer-events-none opacity-60" : ""}`} aria-disabled={isLocked}>
        {stages[stageIndex].id === "reasonEmergency" && (
          <ReasonEmergencyStage
            card={card}
            scoreState={scoreState}
            onUpdateCard={onUpdateCard}
            onVitalsChange={onVitalsChange}
            onEscalate={onEscalate}
            onVitalsUnobtainable={onVitalsUnobtainable}
            onInitialAssessmentChange={onInitialAssessmentChange}
          />
        )}
        {stages[stageIndex].id === "questions" && (
          <AssessmentQuestionsStage
            card={card}
            score={score}
            responses={assessmentResponses}
            onResponses={onAssessmentResponses}
          />
        )}
        {stages[stageIndex].id === "disposition" && (
          <DispositionStage card={card} score={score} severity={severity} route={route} assessmentResponses={assessmentResponses} />
        )}
        {stages[stageIndex].id === "complete" && (
          <CompleteStage card={card} score={score} assessmentResponses={assessmentResponses} />
        )}
      </section>

      <div className="flex items-center justify-between">
        <button
          type="button"
          className="secondary-button"
          onClick={() => onStageChange(Math.max(stageIndex - 1, 0))}
          disabled={stageIndex === 0}
        >
          <ArrowLeft className="h-4 w-4" />
          Previous
        </button>
        <button
          type="button"
          className="primary-button"
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
  const activeStage = stages[activeIndex]?.id ?? stages[0].id;

  return (
    <nav aria-label="Triage action tabs">
      <SectionTabs
        tabs={stages.map((stage) => ({
          key: stage.id,
          label: `${stage.shortLabel} · ${stage.label}`,
          icon: stage.icon
        }))}
        activeTab={activeStage}
        onChange={(stageId) => onSelect(stages.findIndex((stage) => stage.id === stageId))}
        ariaLabel="Triage action tabs"
        className="triage-action-tabs"
      />
    </nav>
  );
}

function RedFloorBanner({ reasons }: { reasons: string[] }) {
  return (
    <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-1.5 text-rose-800">
      <div className="flex items-start gap-2">
        <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <p className="text-xs leading-5">
          <strong className="ist-emphasis font-semibold">Emergency safety floor active:</strong> {reasons.join("; ")}
        </p>
      </div>
    </div>
  );
}

function CallContextStrip({ card }: { card: Card }) {
  const validated = card.identityValidated !== false;
  return (
    <dl className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-0.5 text-xs leading-5 text-slate-500">
      <ChannelIcon channel={card.channel} />
      <CallContextFact label="Wait" value={`${card.queueWaitMinutes}m`} />
      <CallContextFact label="Patient" value={card.patientType} />
      <CallContextFact label="Age" value={`${card.age}y${card.ageMonths !== undefined ? ` / ${card.ageMonths}m` : ""}`} />
      <CallContextFact label="Station" value={card.stationCode ?? "DOH"} />
      <CallContextFact label="HRMS" value={validated ? "Validated" : "Review"} tone={validated ? "emerald" : "amber"} />
    </dl>
  );
}

function ChannelIcon({ channel }: { channel: string }) {
  const Icon = channel === "WhatsApp" ? MessageCircle : channel === "Callback" ? PhoneIncoming : PhoneCall;
  const toneClass =
    channel === "WhatsApp"
      ? "bg-emerald-50 text-emerald-600"
      : channel === "Callback"
        ? "bg-amber-50 text-amber-600"
        : "bg-sky-50 text-sky-600";
  return (
    <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md ${toneClass}`} title={channel}>
      <Icon className="h-3 w-3" />
    </span>
  );
}

function CallContextFact({ label, value, tone = "slate" }: { label: string; value: string; tone?: "slate" | "emerald" | "amber" }) {
  const valueClass =
    tone === "emerald" ? "text-emerald-700" : tone === "amber" ? "text-amber-700" : "text-slate-800";
  return (
    <div className="flex min-w-0 items-center gap-1">
      <dt className="truncate uppercase tracking-[0.12em] text-slate-400">{label}</dt>
      <dd className={`truncate font-normal ${valueClass}`}>{value}</dd>
    </div>
  );
}

function ReasonEmergencyStage({
  card,
  scoreState,
  onUpdateCard,
  onVitalsChange,
  onEscalate,
  onVitalsUnobtainable,
  onInitialAssessmentChange
}: {
  card: Card;
  scoreState: ScoreState;
  onUpdateCard: (patch: Partial<Card>) => void;
  onVitalsChange: (nextVitals: Partial<Card["vitals"]>) => void;
  onEscalate: (source: "symptom" | "judgment", reason: string) => void;
  onVitalsUnobtainable: (value: boolean) => void;
  onInitialAssessmentChange: (answers: Record<string, string>) => void;
}) {
  const terms = keywordSearchTerms(card);
  const prepared = preparedProtocolFor(card);
  const suggestions = prepared?.suggestions.length
    ? prepared.suggestions
    : fallbackProtocolSuggestions(card);
  const score = "result" in scoreState ? scoreState.result : undefined;
  const emergencyReasons = localSafetyFloorReasons(card);
  const primarySuggestion = suggestions[0];
  const secondarySuggestionCount = Math.max(suggestions.length - 1, 0);
  const emergencyClear = emergencyReasons.length === 0;
  const ragShadow = prepared?.ragShadow;
  const possibleRedFlags = ragShadow?.extractedReason.possibleRedFlags ?? [];
  const initialAssessmentProtocolId = prepared?.primaryProtocolId ?? primarySuggestion?.protocolId;
  const vitalsUnobtainable = Boolean(card.vitalsUnobtainable);
  const judgmentAlreadySet = Boolean(card.queueFloorActive && card.safetyFloorSource === "judgment");
  const sourceLabel = prepared ? `${prepared.sourceType} ${prepared.releaseVersion}` : "Pending STCC source";

  return (
    <StageShell
      icon={Search}
      title="Action 1 - Reason & Rule-Out"
      subtitle="Opening script, HRMS context, reason, guideline selection, and emergency rule-out are handled before lower-acuity assessment questions."
    >
      <div className="space-y-2">
        <section className="rounded-md border-l-4 border-emerald-500 bg-emerald-50/40 p-2.5">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-emerald-100 text-emerald-700">
              <PhoneCall className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0 flex-1">
              <h4 className="ist-emphasis text-base font-semibold leading-tight text-slate-950">
                Greet caller, confirm role <span className="font-normal text-slate-600">({card.symptomTextRaw})</span>
              </h4>
              <CallContextStrip card={card} />
            </div>
          </div>
        </section>

        <section className="rounded-md border border-slate-200 bg-white p-3">
          <div className="grid gap-3 lg:grid-cols-2">
            <div className="min-w-0">
              <span className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Reason for call</span>
              <label className="mt-1.5 block">
                <span className="sr-only">Reason narrative</span>
                <textarea
                  className="min-h-[60px] w-full resize-y rounded-md border border-slate-200 bg-white p-2 text-sm font-normal leading-6 text-slate-950 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  value={card.symptomTextRaw}
                  onChange={(event) => onUpdateCard({ symptomTextRaw: event.target.value })}
                />
              </label>
              {terms.length > 0 && (
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] uppercase tracking-[0.1em] text-slate-400">Search words</span>
                  {terms.map((term) => (
                    <Tag key={term}>{term}</Tag>
                  ))}
                </div>
              )}
            </div>

            <div className="min-w-0 border-slate-200 pt-2 lg:border-l lg:pl-3 lg:pt-0">
              {possibleRedFlags.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] uppercase tracking-[0.1em] text-rose-500">Possible red flags (advisory)</span>
                  {possibleRedFlags.map((flag) => (
                    <span key={flag} className="rounded-md border border-rose-200 bg-rose-50 px-2 py-0.5 text-xs text-rose-700">
                      {flag}
                    </span>
                  ))}
                </div>
              )}

              <div className={possibleRedFlags.length > 0 ? "mt-2 border-t border-slate-200 pt-2" : ""}>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <span className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Guideline selection</span>
                    {primarySuggestion ? (
                      <>
                        <h4 className="text-sm font-normal leading-tight text-slate-950">{primarySuggestion.titleEn}</h4>
                        <p className="text-xs leading-5 text-slate-500">
                          {primarySuggestion.questionCount} acuity-ordered questions - {sourceLabel}
                          {secondarySuggestionCount > 0 ? ` - ${secondarySuggestionCount} alternate${secondarySuggestionCount === 1 ? "" : "s"}` : ""}
                        </p>
                      </>
                    ) : (
                      <p className="text-sm leading-6 text-slate-500">Confirm the reason narrative to prepare a protocol search.</p>
                    )}
                  </div>
                  {primarySuggestion && (
                    <span className={`w-fit shrink-0 rounded-md border px-2.5 py-1 text-xs ${severityClass(primarySuggestion.highestSeverity)}`}>
                      highest priority {primarySuggestion.highestSeverity}
                    </span>
                  )}
                </div>
              </div>

              <RagShadowEvidencePanel ragShadow={ragShadow} />
            </div>
          </div>
        </section>

        <InitialAssessmentPanel
          protocolId={initialAssessmentProtocolId}
          onEscalate={(reason) => onEscalate("symptom", reason)}
          initialAnswers={card.initialAssessmentResponses}
          onAnswersChange={onInitialAssessmentChange}
        />

        <DeterministicScoreStrip card={card} scoreState={scoreState} />

        <section className="rounded-md border border-slate-200 bg-white p-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${
                  emergencyClear ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                }`}
              >
                <ShieldAlert className="h-4 w-4" />
              </span>
              <h4 className={`ist-emphasis text-sm font-semibold ${emergencyClear ? "text-emerald-700" : "text-rose-700"}`}>
                {emergencyClear ? "No red floor active" : "Emergency safety floor active"}
              </h4>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {scoreState.status === "ready" && score && !vitalsUnobtainable && (
                <span className={`w-fit rounded-md border px-2 py-0.5 text-xs ${score.redAlertTriggered ? "border-rose-200 bg-rose-50 text-rose-700" : "border-slate-200 bg-slate-50 text-slate-600"}`}>
                  API {score.score} - {score.riskBand}
                </span>
              )}
              {vitalsUnobtainable && (
                <span className="w-fit rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600">
                  No vitals - symptom-based floor
                </span>
              )}
              <button
                type="button"
                onClick={() => onEscalate("judgment", "Triager assessed the presentation as life-threatening.")}
                disabled={judgmentAlreadySet}
                className="ist-emphasis w-fit rounded-md border border-rose-300 bg-rose-600 px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {judgmentAlreadySet ? "Escalated by triager judgment" : "Sounds life-threatening - escalate now"}
              </button>
            </div>
          </div>

          <label className="mt-2 flex w-fit items-center gap-2 text-xs text-slate-600">
            <input
              type="checkbox"
              checked={vitalsUnobtainable}
              onChange={(event) => onVitalsUnobtainable(event.target.checked)}
              className="h-3.5 w-3.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            Vitals cannot be obtained on this call
          </label>

          {vitalsUnobtainable ? (
            <div className="mt-2 rounded-md border border-amber-200 bg-amber-50 p-2 text-xs leading-5 text-amber-800">
              Vitals entry is off. The safety floor now relies on the symptom path: ask the initial assessment questions,
              assess consciousness in conversation, coach the caller to count breaths for 30 seconds if possible, and use
              the escalate button on any life-threatening sign.
            </div>
          ) : (
          <div className="mt-2 grid gap-2 md:grid-cols-5">
            <VitalInput label="HR" value={card.vitals.heartRate} min={20} max={260} onChange={(heartRate) => onVitalsChange({ heartRate })} />
            <VitalInput label="RR" value={card.vitals.respiratoryRate} min={1} max={80} onChange={(respiratoryRate) => onVitalsChange({ respiratoryRate })} />
            <VitalInput label="SpO2" value={card.vitals.spo2} min={40} max={100} onChange={(spo2) => onVitalsChange({ spo2 })} />
            <VitalInput label="Temp" value={card.vitals.temperature} min={30} max={45} step={0.1} onChange={(temperature) => onVitalsChange({ temperature })} />
            <label className="grid gap-1 text-xs font-normal text-slate-600">
              AVPU
              <select
                className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm text-slate-950 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
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
          )}

          {!emergencyClear && (
            <div className="mt-2 rounded-md border border-rose-200 bg-rose-50 p-2 text-xs leading-5 text-rose-800">
              <ul className="grid gap-0.5 sm:grid-cols-2">
                {emergencyReasons.map((reason) => (
                  <li key={reason}>- {reason}</li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </div>
    </StageShell>
  );
}

function DeterministicScoreStrip({ card, scoreState }: { card: Card; scoreState: ScoreState }) {
  const score = "result" in scoreState ? scoreState.result : undefined;
  const floorReasons = localSafetyFloorReasons(card);

  if (card.vitalsUnobtainable) {
    return (
      <section className="rounded-md border border-slate-200 bg-white p-2.5">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Deterministic score summary</span>
          <span className="text-xs leading-5 text-slate-600">
            NEWS2 suspended - vitals not obtained.{" "}
            {floorReasons.length > 0
              ? `Safety floor active: ${floorReasons.join("; ")}.`
              : "Floor relies on initial assessment and triager judgment."}
          </span>
        </div>
      </section>
    );
  }

  if (!score || !score.news2) {
    return null;
  }

  const components: Array<{ label: string; points: number }> = [
    { label: "RR", points: score.news2.respiratoryRate },
    { label: "SpO2", points: score.news2.spo2 },
    { label: "Temp", points: score.news2.temperature },
    { label: "HR", points: score.news2.heartRate },
    { label: "AVPU", points: score.news2.consciousness }
  ];
  const bandTone =
    score.riskBand === "RED_ALERT"
      ? "border-rose-200 bg-rose-50 text-rose-700"
      : score.riskBand === "URGENT"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : "border-emerald-200 bg-emerald-50 text-emerald-700";

  return (
    <section className="rounded-md border border-slate-200 bg-white p-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Deterministic score summary</span>
        <span className={`rounded-md border px-2 py-0.5 text-xs ${bandTone}`}>
          {score.redAlertTriggered ? "Red floor override" : `NEWS2 ${score.news2.total}`} - {score.riskBand}
        </span>
      </div>
      <div className="mt-2 grid grid-cols-5 gap-1.5">
        {components.map((component) => (
          <div key={component.label} className="rounded-md border border-slate-200 bg-slate-50 px-1.5 py-1 text-center">
            <span className="block text-[9px] uppercase tracking-[0.1em] text-slate-400">{component.label}</span>
            <span
              className={`block text-xs ${
                component.points >= 3 ? "text-rose-700" : component.points >= 1 ? "text-amber-700" : "text-emerald-700"
              }`}
            >
              +{component.points}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function InlineEvidence({
  label,
  value,
  tone = "slate"
}: {
  label: string;
  value: string;
  tone?: "slate" | "emerald" | "amber" | "rose";
}) {
  const toneClass =
    tone === "emerald"
      ? "text-emerald-700"
      : tone === "amber"
        ? "text-amber-700"
        : tone === "rose"
          ? "text-rose-700"
          : "text-slate-950";
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
      <span className="block text-[10px] uppercase tracking-[0.12em] text-slate-500">{label}</span>
      <strong className={`mt-1 block text-sm font-normal leading-5 ${toneClass}`}>{value}</strong>
    </div>
  );
}

type RagAgreement = NonNullable<QueuePreparedProtocol["ragShadow"]>["comparison"]["agreement"];

function agreementTone(agreement?: RagAgreement): "emerald" | "amber" | "rose" | "slate" {
  if (agreement === "FULL_MATCH") return "emerald";
  if (agreement === "PARTIAL_MATCH") return "amber";
  if (agreement === "NO_MATCH") return "rose";
  return "slate";
}

function agreementLabel(value: string | undefined): string {
  if (!value) return "No shadow result";
  return value.replace(/_/g, " ").toLowerCase();
}

function RagShadowEvidencePanel({ ragShadow }: { ragShadow?: QueuePreparedProtocol["ragShadow"] }) {
  const [expanded, setExpanded] = useState(false);

  if (!ragShadow) {
    return (
      <div className="mt-2 rounded-md border border-dashed border-slate-200 bg-slate-50 px-3 py-1.5 text-xs leading-5 text-slate-500">
        RAG shadow has not produced an advisory comparison yet. Deterministic search and nurse selection remain authoritative.
      </div>
    );
  }

  const agreement = ragShadow.comparison.agreement;
  const confidence = Math.round(ragShadow.retrieval.confidence * 100);
  const tone = agreementTone(agreement);
  const toneClass =
    tone === "emerald" ? "text-emerald-700" : tone === "amber" ? "text-amber-700" : tone === "rose" ? "text-rose-700" : "text-slate-700";
  const topCandidates = ragShadow.suggestedProtocolCandidates.slice(0, 3);

  return (
    <div className="mt-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
      <button
        type="button"
        onClick={() => setExpanded((current) => !current)}
        className="flex w-full items-center justify-between gap-2 text-left"
      >
        <span className="text-[11px] uppercase tracking-[0.14em] text-slate-500">
          RAG shadow (advisory) - <span className={`normal-case ${toneClass}`}>{agreementLabel(agreement)}</span>, {confidence}% confidence
        </span>
        <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>

      {expanded && (
        <div className="mt-2 space-y-2">
          <p className="text-xs leading-5 text-slate-600">
            Runs in parallel against approved content only. It can compare retrieval and keywords, but cannot decide disposition,
            care advice, route, or fit-to-fly status.
          </p>
          <div className="grid gap-2 lg:grid-cols-[minmax(0,1fr)_minmax(220px,0.55fr)]">
            <div className="min-w-0 rounded-md border border-slate-200 bg-white p-2">
              <span className="text-[10px] uppercase tracking-[0.12em] text-slate-500">Shadow candidates</span>
              <div className="mt-1 grid gap-1">
                {topCandidates.map((candidate) => (
                  <div key={candidate.protocolId} className="flex min-w-0 items-center justify-between gap-3 border-b border-slate-100 py-1 last:border-b-0">
                    <span className="min-w-0 truncate text-xs text-slate-800">{candidate.titleEn}</span>
                    <span className="shrink-0 font-mono text-[10px] text-slate-500">{candidate.protocolId}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-md border border-slate-200 bg-white p-2">
              <span className="text-[10px] uppercase tracking-[0.12em] text-slate-500">Boundary</span>
              <ul className="mt-1 space-y-0.5 text-[11px] leading-4 text-slate-600">
                {ragShadow.prohibitedActionAcknowledgement.slice(0, 4).map((item) => (
                  <li key={item}>- {item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ArchivedReasonEmergencyStage({
  card,
  scoreState,
  onUpdateCard,
  onVitalsChange
}: {
  card: Card;
  scoreState: ScoreState;
  onUpdateCard: (patch: Partial<Card>) => void;
  onVitalsChange: (nextVitals: Partial<Card["vitals"]>) => void;
}) {
  const terms = keywordSearchTerms(card);
  const suggestions = card.preparedProtocol?.suggestions.length
    ? card.preparedProtocol.suggestions
    : fallbackProtocolSuggestions(card);
  const score = "result" in scoreState ? scoreState.result : undefined;
  const emergencyReasons = localSafetyFloorReasons(card);

  return (
    <StageShell
      icon={Search}
      title="Action 1 - Reason & Emergency Rule-Out"
      subtitle="Confirm the reason for call, review prepared guideline search, and prove the emergency safety floor before triage questions."
    >
      <div className="grid gap-4 2xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
        <div className="space-y-4">
          <label className="grid gap-2 text-sm font-normal text-slate-700">
            <span className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Reason narrative</span>
            <textarea
              className="min-h-[136px] rounded-md border border-slate-200 bg-white p-3 text-sm font-normal leading-6 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              value={card.symptomTextRaw}
              onChange={(event) => onUpdateCard({ symptomTextRaw: event.target.value })}
            />
          </label>

          <div className="rounded-md border border-slate-200 bg-white p-3">
            <span className="block text-[11px] uppercase tracking-[0.14em] text-slate-500">Guideline search prepared</span>
            <div className="mt-3 flex min-h-11 flex-wrap gap-2 rounded-md border border-slate-200 bg-slate-50 p-2">
              {terms.length > 0 ? (
                terms.map((term) => <Tag key={term}>{term}</Tag>)
              ) : (
                <span className="px-1 text-sm text-slate-500">Enter a reason narrative to prepare search terms.</span>
              )}
            </div>
          </div>

          <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
            <div className="grid grid-cols-[1fr_72px_104px] border-b border-slate-200 bg-slate-50 px-3 py-2 text-[11px] uppercase tracking-[0.12em] text-slate-500">
              <span>Guidelines found</span>
              <span>Items</span>
              <span>Priority</span>
            </div>
            {suggestions.map((suggestion) => (
              <div
                key={suggestion.protocolId}
                className="grid grid-cols-[1fr_72px_104px] gap-3 border-b border-slate-100 px-3 py-3 text-sm last:border-b-0"
              >
                <div className="min-w-0">
                  <strong className="block truncate font-normal text-slate-950">{suggestion.titleEn}</strong>
                  <span className="mt-1 block text-xs leading-5 text-slate-500">
                    Search terms: {suggestion.matchedTerms.length > 0 ? suggestion.matchedTerms.join(", ") : "reason narrative"}
                  </span>
                </div>
                <span className="font-mono text-xs text-slate-600">{suggestion.questionCount}</span>
                <span className={`text-xs ${suggestion.highestSeverity === "Emergency" ? "text-rose-700" : "text-slate-600"}`}>
                  {suggestion.highestSeverity}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-md border border-slate-200 bg-white p-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className={emergencyReasons.length > 0 ? "h-4 w-4 text-rose-700" : "h-4 w-4 text-emerald-700"} />
              <span className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Emergency rule-out</span>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <VitalInput label="HR" value={card.vitals.heartRate} min={20} max={260} onChange={(heartRate) => onVitalsChange({ heartRate })} />
              <VitalInput label="RR" value={card.vitals.respiratoryRate} min={1} max={80} onChange={(respiratoryRate) => onVitalsChange({ respiratoryRate })} />
              <VitalInput label="SpO2" value={card.vitals.spo2} min={40} max={100} onChange={(spo2) => onVitalsChange({ spo2 })} />
              <VitalInput label="Temp" value={card.vitals.temperature} min={30} max={45} step={0.1} onChange={(temperature) => onVitalsChange({ temperature })} />
              <label className="grid gap-1 text-xs font-semibold text-slate-600 sm:col-span-2">
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
            <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-700">
              {scoreState.status === "loading" && "Scoring API is recalculating from HRMS age and current vitals..."}
              {scoreState.status === "ready" && score && (
                <span>
                  API score {score.score} - {score.riskBand} - {score.patientAge?.calculatedFrom ?? "HRMS age source"}
                </span>
              )}
              {scoreState.status === "error" && "Score API unavailable; deterministic local safety floor remains visible."}
              {scoreState.status === "idle" && "Waiting for the first authoritative score."}
            </div>
          </div>

          <div
            className={`rounded-md border p-3 text-sm leading-6 ${
              emergencyReasons.length > 0
                ? "border-rose-200 bg-rose-50 text-rose-800"
                : "border-emerald-200 bg-emerald-50 text-emerald-800"
            }`}
          >
            <strong className="block font-normal">
              {emergencyReasons.length > 0 ? "Emergency rule-out failed" : "Emergency rule-out clear"}
            </strong>
            {emergencyReasons.length > 0
              ? emergencyReasons.join("; ")
              : "No immediate red-floor trigger is currently active. Continue to acuity-ordered triage questions."}
          </div>
        </div>
      </div>
    </StageShell>
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

function IdentityStage({ card }: { card: Card }) {
  const validated = card.identityValidated !== false;
  const calculatedFrom = card.ageCalculatedFrom === "HRMS_DATE_OF_BIRTH" ? "HRMS date of birth" : "HRMS age field";
  return (
    <StageShell icon={UserRoundCheck} title="Stage 2 · Identity" subtitle="Age and dependent context are resolved from HRMS, not manual entry.">
      <InfoGrid
        items={[
          ["Staff ID", card.istStaffId],
          ["Dependent", card.dependentId ?? "Staff member"],
          ["Masked patient", card.maskedPatientId],
          ["Calculated age", `${card.age} years${card.ageMonths !== undefined ? ` (${card.ageMonths} months)` : ""}`],
          ["Age source", `${card.ageSource ?? card.patientType.toLowerCase()} · ${calculatedFrom}`],
          ["Validated", validated ? "Auto-validated before queue entry" : "HRMS lookup failed"]
        ]}
      />
      <div
        className={`mt-4 rounded-lg border p-3 text-sm leading-6 ${
          validated ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-800"
        }`}
      >
        <strong className="block text-sm font-semibold">{card.identityValidationSource ?? "HRMS_AUTO"}</strong>
        {card.identityValidationMessage ?? "The queue API validated the staff/dependent relationship and calculated age before the nurse opened the call."}
        {card.identityValidatedAtIso && <span className="block text-xs text-slate-500">Validated at {new Date(card.identityValidatedAtIso).toLocaleString()}.</span>}
      </div>
    </StageShell>
  );
}

function keywordSearchTerms(card: Card): string[] {
  const preparedTerms = preparedProtocolFor(card)?.extractedKeywords ?? [];
  if (preparedTerms.length > 0) return preparedTerms.slice(0, 6);

  return meaningfulTermsFromText(card.symptomTextRaw).slice(0, 6);
}

function meaningfulTermsFromText(text: string): string[] {
  const stopWords = new Set([
    "with",
    "from",
    "about",
    "after",
    "before",
    "reported",
    "requesting",
    "routine",
    "caller",
    "patient",
    "member",
    "adult",
    "child",
    "injury",
    "pain",
    "review",
    "protocol",
    "health"
  ]);

  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((term, index, terms) => term.length > 3 && !stopWords.has(term) && terms.indexOf(term) === index);
}

function preparedProtocolFor(card: Card): QueuePreparedProtocol | undefined {
  const prepared = card.preparedProtocol;
  if (!prepared) return undefined;

  const reasonTerms = meaningfulTermsFromText(card.symptomTextRaw);
  const protocolTerms = meaningfulTermsFromText(
    [
      prepared.reasonNarrative,
      prepared.primaryProtocolTitle,
      ...prepared.suggestions.map((suggestion) => suggestion.titleEn)
    ]
      .filter(Boolean)
      .join(" ")
  );

  if (reasonTerms.length === 0 || protocolTerms.length === 0) return prepared;
  return protocolTerms.some((term) => reasonTerms.includes(term)) ? prepared : undefined;
}

function fallbackProtocolSuggestions(card: Card): QueuePreparedProtocol["suggestions"] {
  const prepared = preparedProtocolFor(card);
  const reason = card.symptomTextRaw.toLowerCase();
  if (reason.includes("ankle") || reason.includes("foot")) {
    return [
      {
        protocolId: "ANKLE_FOOT_INJURY",
        titleEn: "Ankle and Foot Injury",
        score: 0.92,
        matchedTerms: ["ankle", "fall", "sport"],
        questionCount: 5,
        highestSeverity: "Urgent",
        releaseVersion: "local-sample"
      },
      {
        protocolId: "ANKLE_PAIN",
        titleEn: "Ankle Pain",
        score: 0.74,
        matchedTerms: ["ankle"],
        questionCount: 4,
        highestSeverity: "Routine",
        releaseVersion: "local-sample"
      }
    ];
  }

  return [
    {
      protocolId: "SAFETY_NET_PROTOCOL",
      titleEn: prepared?.primaryProtocolTitle ?? "Safety-net nurse protocol review",
      score: 0.7,
      matchedTerms: keywordSearchTerms(card),
      questionCount: assessmentQuestionsFor(card).length,
      highestSeverity: localSeverity(card),
      releaseVersion: prepared?.releaseVersion ?? "local-sample"
    }
  ];
}

function ReasonForCallStage({ card, onUpdateCard }: { card: Card; onUpdateCard: (patch: Partial<Card>) => void }) {
  const terms = keywordSearchTerms(card);
  const prepared = preparedProtocolFor(card);
  const suggestions = prepared?.suggestions.length
    ? prepared.suggestions
    : fallbackProtocolSuggestions(card);

  return (
    <StageShell
      icon={Search}
      title="Stage 2 - Reason for Call"
      subtitle="Confirm the caller narrative and guideline search prepared before nurse pickup."
    >
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(280px,0.9fr)]">
        <label className="grid gap-2 text-sm font-normal text-slate-700">
          <span className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Reason narrative</span>
          <textarea
            className="min-h-[150px] rounded-md border border-slate-200 bg-white p-3 text-sm font-normal leading-6 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            value={card.symptomTextRaw}
            onChange={(event) => onUpdateCard({ symptomTextRaw: event.target.value })}
          />
        </label>
        <div className="rounded-md border border-slate-200 bg-white p-3">
          <span className="block text-[11px] uppercase tracking-[0.14em] text-slate-500">Guideline search</span>
          <div className="mt-3 flex min-h-11 flex-wrap gap-2 rounded-md border border-slate-200 bg-slate-50 p-2">
            {terms.length > 0 ? (
              terms.map((term) => <Tag key={term}>{term}</Tag>)
            ) : (
              <span className="px-1 text-sm text-slate-500">Enter a reason narrative to prepare search terms.</span>
            )}
          </div>
          <p className="mt-3 text-xs leading-5 text-slate-500">
            HRMS has already validated staff/dependent identity and age before the call entered the nurse queue.
          </p>
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-md border border-slate-200 bg-white">
        <div className="grid grid-cols-[1fr_88px_112px] border-b border-slate-200 bg-slate-50 px-3 py-2 text-[11px] uppercase tracking-[0.12em] text-slate-500">
          <span>Guidelines found</span>
          <span>Questions</span>
          <span>Priority</span>
        </div>
        {suggestions.map((suggestion) => (
          <div
            key={suggestion.protocolId}
            className="grid grid-cols-[1fr_88px_112px] gap-3 border-b border-slate-100 px-3 py-3 text-sm last:border-b-0"
          >
            <div className="min-w-0">
              <strong className="block truncate font-normal text-slate-950">{suggestion.titleEn}</strong>
              <span className="mt-1 block text-xs leading-5 text-slate-500">
                Search terms: {suggestion.matchedTerms.length > 0 ? suggestion.matchedTerms.join(", ") : "reason narrative"}
              </span>
            </div>
            <span className="font-mono text-xs text-slate-600">{suggestion.questionCount}</span>
            <span className={`text-xs ${suggestion.highestSeverity === "Emergency" ? "text-rose-700" : "text-slate-600"}`}>
              {suggestion.highestSeverity}
            </span>
          </div>
        ))}
      </div>
    </StageShell>
  );
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
    <StageShell icon={Stethoscope} title="Stage 3 - 911 / Emergency Rule-Out" subtitle="Check vital-sign safety floors before routine protocol questions.">
      <div className="grid gap-3 md:grid-cols-5">
        <VitalInput label="HR" value={card.vitals.heartRate} min={20} max={260} onChange={(heartRate) => onVitalsChange({ heartRate })} />
        <VitalInput label="RR" value={card.vitals.respiratoryRate} min={1} max={80} onChange={(respiratoryRate) => onVitalsChange({ respiratoryRate })} />
        <VitalInput label="SpO2" value={card.vitals.spo2} min={40} max={100} onChange={(spo2) => onVitalsChange({ spo2 })} />
        <VitalInput label="Temp" value={card.vitals.temperature} min={30} max={45} step={0.1} onChange={(temperature) => onVitalsChange({ temperature })} />
        <label className="grid gap-1 text-xs font-normal text-slate-600">
          AVPU
          <select
            className="h-11 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
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
      <div className="mt-4 rounded-md border border-slate-200 bg-white p-3 text-sm text-slate-700">
        {scoreState.status === "loading" && "Scoring API is recalculating from HRMS age and current vitals..."}
        {scoreState.status === "ready" && score && (
          <span>
            API score {score?.score} - {score?.riskBand} - {score?.patientAge?.calculatedFrom ?? "HRMS age source"}
          </span>
        )}
        {scoreState.status === "error" && "Score API unavailable."}
        {scoreState.status === "idle" && "Waiting for the first authoritative score."}
      </div>
    </StageShell>
  );
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
            API score {score?.score} · {score?.riskBand} · {score?.patientAge?.calculatedFrom ?? "HRMS age source"}
          </span>
        )}
        {scoreState.status === "error" && "Score API unavailable."}
        {scoreState.status === "idle" && "Waiting for the first authoritative score."}
      </div>
    </StageShell>
  );
}

function assessmentQuestionsFor(card: Card): QueueProtocolQuestionPreview[] {
  const preparedQuestions = preparedProtocolFor(card)?.acuityQuestionPreview ?? [];
  if (preparedQuestions.length > 0) {
    return preparedQuestions
      .slice()
      .sort((left, right) => left.acuityOrder - right.acuityOrder)
      .slice(0, 6);
  }

  const reason = card.symptomTextRaw.toLowerCase();
  if (reason.includes("ankle") || reason.includes("foot")) {
    return [
      {
        id: "ankle-red-neurovascular",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is the foot cold, blue, numb, or is there severe uncontrolled pain after the injury?",
        dispositionCode: "RED_ALERT",
        redFlag: true,
        careAdviceIds: ["immobilize", "emergency-care"]
      },
      {
        id: "ankle-open-deformity",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Is there an open wound, obvious deformity, or inability to bear weight?",
        dispositionCode: "URGENT_REVIEW",
        redFlag: false,
        careAdviceIds: ["protect-limb", "urgent-review"]
      },
      {
        id: "ankle-swelling",
        acuityOrder: 3,
        severity: "Routine",
        questionTextEn: "Is there swelling, bruising, or reduced movement without emergency features?",
        dispositionCode: "ROUTINE_REVIEW",
        redFlag: false,
        careAdviceIds: ["rest-ice-compression", "clinic-review"]
      }
    ];
  }

  return [
    {
      id: "general-red-alert",
      acuityOrder: 1,
      severity: "Emergency",
      questionTextEn: "Does the caller report severe breathing difficulty, collapse, seizure, blue lips, uncontrolled bleeding, or another immediate emergency?",
      dispositionCode: "RED_ALERT",
      redFlag: true,
      careAdviceIds: ["emergency-care"]
    },
    {
      id: "general-urgent",
      acuityOrder: 2,
      severity: "Urgent",
      questionTextEn: "Are symptoms rapidly worsening, severe, or associated with high-risk duty, outstation, pediatric, pregnancy, or aviation safety concerns?",
      dispositionCode: "URGENT_REVIEW",
      redFlag: false,
      careAdviceIds: ["urgent-review"]
    },
    {
      id: "general-routine",
      acuityOrder: 3,
      severity: "Routine",
      questionTextEn: "Are symptoms mild, stable, and suitable for routine clinical advice with clear callback precautions?",
      dispositionCode: "ROUTINE_REVIEW",
      redFlag: false,
      careAdviceIds: ["routine-advice"]
    }
  ];
}

type DispositionQuestionGroup = {
  code: string;
  title: string;
  severity: Severity;
  questions: QueueProtocolQuestionPreview[];
};

function dispositionTitleFor(code: string, severity: Severity): string {
  const normalized = code.toUpperCase();
  if (normalized.includes("RED") || severity === "Emergency") return "Emergency care now";
  if (normalized.includes("URGENT") || severity === "Urgent") return "Urgent clinical review";
  if (normalized.includes("ROUTINE") || severity === "Routine") return "Clinic review / PCP within 24 hours";
  if (normalized.includes("SELF") || normalized.includes("HOME")) return "Self-care with callback precautions";
  return code.replace(/_/g, " ").toLowerCase();
}

function dispositionQuestionGroups(questions: QueueProtocolQuestionPreview[]): DispositionQuestionGroup[] {
  const groups = new Map<string, DispositionQuestionGroup>();
  questions.forEach((question) => {
    const current = groups.get(question.dispositionCode);
    if (current) {
      current.questions.push(question);
      return;
    }
    groups.set(question.dispositionCode, {
      code: question.dispositionCode,
      title: dispositionTitleFor(question.dispositionCode, question.severity),
      severity: question.severity,
      questions: [question]
    });
  });

  return [...groups.values()].map((group) => ({
    ...group,
    questions: group.questions.slice().sort((left, right) => left.acuityOrder - right.acuityOrder)
  }));
}

function groupHeaderClass(severity: Severity): string {
  if (severity === "Emergency") return "bg-rose-700 text-white";
  if (severity === "Urgent") return "bg-amber-500 text-slate-950";
  if (severity === "Routine") return "bg-sky-100 text-slate-950";
  return "bg-emerald-100 text-slate-950";
}

type AssessmentFlowItem = QueueProtocolQuestionPreview & {
  sequence: number;
  groupCode: string;
  groupTitle: string;
  groupQuestionNumber: number;
  groupQuestionCount: number;
};

function assessmentFlowItems(questions: QueueProtocolQuestionPreview[]): AssessmentFlowItem[] {
  const groups = dispositionQuestionGroups(questions);
  let sequence = 0;

  return groups.flatMap((group) =>
    group.questions.map((question, index) => {
      sequence += 1;
      return {
        ...question,
        sequence,
        groupCode: group.code,
        groupTitle: group.title,
        groupQuestionNumber: index + 1,
        groupQuestionCount: group.questions.length
      };
    })
  );
}

function AssessmentQuestionsStage({
  card,
  score,
  responses,
  onResponses
}: {
  card: Card;
  score?: ApiScoreResult;
  responses: AssessmentResponseState;
  onResponses: (updates: AssessmentResponseState) => void;
}) {
  const [view, setView] = useState<"guided" | "reference">("guided");
  const prepared = preparedProtocolFor(card);
  const questions = assessmentQuestionsFor(card);
  const flow = assessmentFlowItems(questions);
  const answeredCount = flow.filter((question) => responses[question.id] !== undefined).length;
  const firstYesIndex = flow.findIndex((question) => responses[question.id] === true);
  const firstPendingIndex = flow.findIndex((question) => responses[question.id] === undefined);
  const mandatoryQuestion = mandatoryAssessmentQuestion(card);
  const allAnsweredNo =
    !mandatoryQuestion && flow.length > 0 && flow.every((question) => responses[question.id] === false);
  const activeIndex =
    firstYesIndex >= 0
      ? firstYesIndex
      : firstPendingIndex >= 0
        ? firstPendingIndex
        : Math.max(flow.length - 1, 0);
  const activeQuestion = flow[activeIndex];
  // The mandatory question comes back as a bare preview without flow-group
  // metadata; run it through the same grouping used for the main flow so
  // selectedQuestion is always an AssessmentFlowItem (groupTitle is rendered).
  const selectedQuestion =
    (mandatoryQuestion ? assessmentFlowItems([mandatoryQuestion])[0] : undefined) ??
    (firstYesIndex >= 0 ? flow[firstYesIndex] : undefined);
  const progress =
    flow.length === 0
      ? 0
      : selectedQuestion || allAnsweredNo
        ? 100
        : Math.round((answeredCount / flow.length) * 100);
  const visibleItems = flow.slice(0, activeIndex + 1);
  const futureCount = activeQuestion ? Math.max(flow.length - activeIndex - 1, 0) : 0;

  return (
    <StageShell
      icon={ListChecks}
      title="Action 2 - Assessment Questions"
      subtitle="Ask one acuity-ordered question at a time. Stop when a Yes fixes the disposition."
    >
      <div className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-slate-200 pb-4 text-[11px] uppercase tracking-[0.12em] text-slate-500">
        <span>Protocol: <span className="normal-case tracking-normal text-slate-800">{prepared?.primaryProtocolTitle ?? "Safety-net protocol"}</span></span>
        <span>Risk: <span className="normal-case tracking-normal text-slate-800">{score?.riskBand ?? "Pending"}</span></span>
        <span>Answered: <span className="normal-case tracking-normal text-slate-800">{answeredCount} / {flow.length}</span></span>
      </div>

      <div className="mb-4 flex gap-1.5">
        <button
          type="button"
          onClick={() => setView("guided")}
          className={`rounded-none border px-3 py-1.5 text-xs font-semibold transition ${
            view === "guided" ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
          }`}
        >
          Guided Walkthrough (Yes/No)
        </button>
        <button
          type="button"
          onClick={() => setView("reference")}
          className={`rounded-none border px-3 py-1.5 text-xs font-semibold transition ${
            view === "reference" ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
          }`}
        >
          Reference List
        </button>
      </div>

      {view === "reference" ? (
        <ReferenceQuestionsView card={card} responses={responses} onResponses={onResponses} />
      ) : (
        <>
          <div className="mb-4">
            <div className="flex items-center justify-between gap-3 text-[11px] uppercase tracking-[0.12em] text-slate-500">
              <span>{selectedQuestion ? "Disposition found" : allAnsweredNo ? "Question path complete" : `Question ${Math.min(activeIndex + 1, flow.length)} of ${flow.length}`}</span>
              <span>{progress}%</span>
            </div>
            <div className="mt-2 h-px bg-slate-200">
              <div className="h-px bg-emerald-700 transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>

          {flow.length === 0 ? (
            <div className="border-l-2 border-slate-300 pl-3 text-sm leading-6 text-slate-600">
              No protocol questions are prepared yet. Confirm the reason for call and protocol search before assessment.
            </div>
          ) : (
            <div className="space-y-3">
              {visibleItems.map((question) => (
                <AssessmentStepCard
                  key={question.id}
                  item={question}
                  answer={responses[question.id]}
                  onAnswer={(value) => onResponses({ [question.id]: value })}
                  isFrontier={question.id === activeQuestion?.id}
                />
              ))}

              {(selectedQuestion || allAnsweredNo) && (
                <div className={`rounded-md border-2 p-4 ${selectedQuestion ? severityResultCardClass(selectedQuestion.severity) : "border-slate-300 bg-slate-50"}`}>
                  <span className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                    {selectedQuestion ? "Disposition identified" : "Question path complete"}
                  </span>
                  <h4 className={`mt-1 text-xl font-bold ${selectedQuestion ? severityTagClass(selectedQuestion.severity) : "text-slate-700"}`}>
                    {selectedQuestion ? selectedQuestion.groupTitle : "No criteria met - nurse judgment"}
                  </h4>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {selectedQuestion
                      ? "Stop lower-priority questioning and proceed to disposition review."
                      : "All assessment questions were answered No. Proceed with the safest available route and callback precautions."}
                  </p>
                </div>
              )}
            </div>
          )}

          {activeQuestion && (
            <details open className="mt-4 border-t border-slate-200 pt-4 text-sm leading-6 text-slate-600">
              <summary className="cursor-pointer text-[11px] uppercase tracking-[0.14em] text-slate-500">
                Clinical trace
              </summary>
              <div className="mt-3 space-y-2">
                <p>
                  Yes routes to <span className="text-slate-950">{activeQuestion.groupTitle}</span> using{" "}
                  <span className="font-mono text-xs">{activeQuestion.dispositionCode}</span>. No continues to the next high-to-low priority item.
                </p>
                {!selectedQuestion && !allAnsweredNo && futureCount > 0 && (
                  <p className="text-slate-500">
                    {futureCount} lower-priority question{futureCount === 1 ? "" : "s"} locked until this answer is recorded.
                  </p>
                )}
              </div>
            </details>
          )}
        </>
      )}
    </StageShell>
  );
}

function AssessmentStepCard({
  item,
  answer,
  onAnswer,
  isFrontier
}: {
  item: AssessmentFlowItem;
  answer: boolean | undefined;
  onAnswer: (value: boolean) => void;
  isFrontier: boolean;
}) {
  const answered = answer !== undefined;
  return (
    <div className={`rounded-md border border-slate-200 border-l-4 bg-white p-3 ${severityAccentBorder(item.severity)}`}>
      <div className="flex items-start gap-3">
        <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${severityCircleClass(item.severity)}`}>
          {answered ? <Check className="h-3.5 w-3.5" /> : item.sequence}
        </span>
        <div className="min-w-0 flex-1">
          <span className={`block text-[11px] font-semibold uppercase tracking-[0.14em] ${severityTagClass(item.severity)}`}>
            {item.groupTitle}
          </span>
          <p className="ist-emphasis mt-1 text-base font-semibold leading-6 text-slate-950">{item.questionTextEn}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onAnswer(false)}
              aria-pressed={answer === false}
              className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition ${
                answer === false
                  ? "border-emerald-600 bg-emerald-600 text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:border-emerald-400 hover:bg-emerald-50"
              }`}
            >
              No{isFrontier && !answered ? " - default" : ""}
            </button>
            <button
              type="button"
              onClick={() => onAnswer(true)}
              aria-pressed={answer === true}
              className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition ${
                answer === true
                  ? "border-rose-600 bg-rose-600 text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:border-rose-400 hover:bg-rose-50"
              }`}
            >
              Yes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReferenceQuestionsView({
  card,
  responses,
  onResponses
}: {
  card: Card;
  responses: AssessmentResponseState;
  onResponses: (updates: AssessmentResponseState) => void;
}) {
  const questions = assessmentQuestionsFor(card);
  const groups = dispositionQuestionGroups(questions);
  const resolvedGroupIndex = groups.findIndex((group) =>
    group.questions.some((question) => responses[question.id] === true)
  );

  return (
    <div className="space-y-3">
      {groups.map((group, groupIndex) => {
        const lockedByHigherYes = resolvedGroupIndex >= 0 && groupIndex > resolvedGroupIndex;
        const groupCompleteNo = group.questions.every((question) => responses[question.id] === false);
        const groupHasYes = group.questions.some((question) => responses[question.id] === true);
        const noToAllUpdates = Object.fromEntries(group.questions.map((question) => [question.id, false]));

        return (
          <details key={group.code} open className="overflow-hidden rounded-md border border-slate-200 bg-white">
            <summary className={`flex cursor-pointer list-none flex-col gap-2 px-3 py-3 md:flex-row md:items-center md:justify-between ${groupHeaderClass(group.severity)}`}>
              <div className="flex items-center gap-2">
                <strong className="font-semibold">{group.title}</strong>
                <span className="font-mono text-[11px] uppercase tracking-[0.08em]">{group.code}</span>
                <span className="rounded-full bg-white/30 px-2 py-0.5 text-[11px] font-semibold">{group.questions.length}</span>
              </div>
              {!groupHasYes && !groupCompleteNo && !lockedByHigherYes && (
                <button
                  type="button"
                  className="h-8 w-fit rounded-md border border-white/60 px-3 text-xs transition hover:bg-white/20"
                  onClick={(event) => {
                    event.preventDefault();
                    onResponses(noToAllUpdates);
                  }}
                >
                  No to all
                </button>
              )}
              {groupCompleteNo && <span className="text-xs">All no - continue next level</span>}
              {groupHasYes && <span className="text-xs">Yes captured - disposition fixed</span>}
            </summary>

            <div className="divide-y divide-slate-100">
              {group.questions.map((question) => {
                const answeredYes = responses[question.id] === true;
                const answeredNo = responses[question.id] === false;
                const disabled = lockedByHigherYes || (resolvedGroupIndex >= 0 && !answeredYes && groupIndex !== resolvedGroupIndex);
                return (
                  <article key={question.id} className={`p-3 ${disabled ? "opacity-50" : ""}`}>
                    <div className="grid gap-3 md:grid-cols-[28px_28px_minmax(0,1fr)] md:items-start">
                      <button
                        type="button"
                        className={`h-6 w-6 rounded-full border text-[10px] transition ${
                          answeredYes
                            ? "border-rose-600 bg-rose-600 text-white"
                            : "border-slate-300 bg-white text-slate-500 hover:border-rose-500"
                        }`}
                        onClick={() => onResponses({ [question.id]: true })}
                        disabled={disabled}
                        aria-pressed={answeredYes}
                        aria-label={`Answer yes to ${question.questionTextEn}`}
                      >
                        Y
                      </button>
                      <button
                        type="button"
                        className={`h-6 w-6 rounded-full border text-[10px] transition ${
                          answeredNo
                            ? "border-emerald-600 bg-emerald-600 text-white"
                            : "border-slate-300 bg-white text-slate-500 hover:border-emerald-500"
                        }`}
                        onClick={() => onResponses({ [question.id]: false })}
                        disabled={disabled}
                        aria-pressed={answeredNo}
                        aria-label={`Answer no to ${question.questionTextEn}`}
                      >
                        N
                      </button>
                      <div className="min-w-0">
                        <p className="text-sm leading-6 text-slate-800">{question.questionTextEn}</p>
                        <span className="mt-1 block text-xs leading-5 text-slate-500">
                          Ask only until a Yes identifies the level of care.
                        </span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </details>
        );
      })}
    </div>
  );
}

function ProtocolStage({ card, score }: { card: Card; score?: ApiScoreResult }) {
  const prepared = preparedProtocolFor(card);
  const protocol = prepared?.primaryProtocolTitle ?? "Safety-net nurse protocol review";
  const questions = prepared?.acuityQuestionPreview.slice(0, 4) ?? [];
  const terms = prepared?.extractedKeywords.slice(0, 6) ?? [];
  return (
    <StageShell icon={ClipboardCheck} title="Stage 5 · Protocol" subtitle="Protocol matching remains advisory until the nurse validates the checklist.">
      <InfoGrid
        items={[
          ["Matched protocol", protocol],
          ["API risk band", score?.riskBand ?? "Pending API score"],
          ["Content source", prepared ? `${prepared.sourceType} ${prepared.releaseVersion}` : "Pending queue preparation"],
          ["Keyword search", terms.length > 0 ? terms.join(", ") : "Awaiting reason narrative"],
          ["Acuity order", questions.length > 0 ? `${questions.length} high-first questions ready` : "High-risk questions first"],
          ["AI role", "Explain and draft only"]
        ]}
      />
      {questions.length > 0 && (
        <div className="mt-4 space-y-2">
          {questions.map((question) => (
            <div key={question.id} className="rounded-md border border-slate-200 bg-white p-3 text-sm leading-5 text-slate-700">
              <span className="font-mono text-[11px] font-normal uppercase tracking-[0.08em] text-slate-500">
                {question.acuityOrder} - {question.severity}
              </span>
              <p className="mt-1">{question.questionTextEn}</p>
            </div>
          ))}
        </div>
      )}
    </StageShell>
  );
}

function DispositionStage({
  card,
  score,
  severity,
  route,
  assessmentResponses
}: {
  card: Card;
  score?: ApiScoreResult;
  severity: Severity;
  route: { code: string; destination: string; rationale: string };
  assessmentResponses: AssessmentResponseState;
}) {
  const fitStatus = fitToFlyStatus(card, severity);
  const advice = careAdviceFor(card, assessmentResponses, route);
  const selectedQuestion = selectedAssessmentQuestion(card, assessmentResponses);
  return (
    <StageShell icon={Plane} title="Action 3 - Disposition and Care Advice" subtitle="Confirm where the patient goes and what advice is given before SBAR.">
      <div className="grid gap-3 lg:grid-cols-3">
        <ClinicalMetric icon={AlertTriangle} label="Severity" value={severity} tone={severity === "Emergency" ? "rose" : "emerald"} />
        <ClinicalMetric icon={TimerReset} label="Disposition" value={route.code} tone="slate" />
        <ClinicalMetric icon={Plane} label="Fit-to-fly" value={fitStatus} tone={fitToFlyTone(fitStatus)} />
      </div>
      <div className="mt-4 rounded-md border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-700">
        <span className="block text-[11px] uppercase tracking-[0.14em] text-slate-500">Where to go</span>
        <strong className="mt-1 block font-normal text-slate-950">{route.destination}</strong>
        <p className="mt-2">{score?.routingRationale ?? route.rationale}</p>
        {selectedQuestion && (
          <p className="mt-2 text-xs text-slate-500">
            Triggered by: {selectedQuestion.questionTextEn}
          </p>
        )}
        <span className="mt-3 block text-slate-950">{fitToFlyRuleText(severity)}</span>
        <span className="mt-1 block text-xs text-slate-500">
          STCC supplies the clinical disposition. IST Health aviation rules then decide whether fit-to-fly is cleared, restricted, or still requires medical review.
        </span>
      </div>

      <div className="mt-4 overflow-hidden rounded-md border-l-4 border-emerald-500 bg-emerald-50/40">
        <div className="flex items-center gap-2 px-3 py-2">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-emerald-100 text-emerald-700">
            <PhoneCall className="h-3 w-3" />
          </span>
          <span className="text-[11px] uppercase tracking-[0.12em] text-emerald-700">Say to caller now - care advice / first aid</span>
        </div>
        <div className="divide-y divide-emerald-100/70 bg-white">
          {advice.map((item) => (
            <article key={item.title} className="p-3 text-sm leading-6 text-slate-700">
              <strong className="ist-emphasis block font-semibold text-slate-950">{item.title}</strong>
              {item.body}
            </article>
          ))}
        </div>
      </div>
    </StageShell>
  );
}

function CompleteStage({
  card,
  score,
  assessmentResponses
}: {
  card: Card;
  score?: ApiScoreResult;
  assessmentResponses: AssessmentResponseState;
}) {
  return (
    <StageShell icon={FileText} title="Action 4 - SBAR / Complete" subtitle="Copy bilingual SBAR, execute safety-gated writeback, and close the call.">
      <pre className="max-h-[360px] overflow-auto whitespace-pre-wrap rounded-lg bg-slate-950 p-4 text-xs leading-5 text-slate-100">
        {sbarMarkdown(card, score, assessmentResponses)}
      </pre>
    </StageShell>
  );

  return (
    <StageShell icon={FileText} title="Stage 7 · SBAR / Complete" subtitle="Copy bilingual SBAR, execute safety-gated writeback, and close the call.">
      <pre className="max-h-[360px] overflow-auto whitespace-pre-wrap rounded-lg bg-slate-950 p-4 text-xs leading-5 text-slate-100">
        {sbarMarkdown(card, score, assessmentResponses)}
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
      <div className="mb-2 flex items-center gap-2">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-slate-950">{title}</h3>
          <p className="text-xs text-slate-500">{subtitle}</p>
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
        <div key={label} className="ist-data-field">
          <span className="ist-data-label">{label}</span>
          <strong className="ist-data-value">{value}</strong>
        </div>
      ))}
    </div>
  );
}

function ClinicalChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="ist-data-field">
      <span className="ist-data-label">{label}</span>
      <strong className="ist-data-value capitalize">{value}</strong>
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
  tone: "amber" | "emerald" | "rose" | "slate";
}) {
  const palette =
    tone === "rose"
      ? "border-rose-200 bg-rose-50 text-rose-700"
      : tone === "amber"
        ? "border-amber-200 bg-amber-50 text-amber-700"
      : tone === "emerald"
        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
        : "border-slate-200 bg-white text-slate-700";
  return (
    <article className={`min-w-0 rounded-md border p-4 ${palette}`}>
      <Icon className="h-5 w-5" />
      <span className="mt-3 block break-words text-[10px] font-semibold uppercase leading-tight tracking-[0.12em] opacity-70">
        {label}
      </span>
      <strong className="mt-2 block min-w-0 break-words text-[13px] font-semibold leading-snug text-slate-950">
        {value}
      </strong>
    </article>
  );
}

function ActiveCallSummaryCard({
  card,
  stageIndex,
  score,
  assessmentResponses,
  onResume,
  onHold
}: {
  card: Card;
  stageIndex: number;
  score?: ApiScoreResult;
  assessmentResponses: AssessmentResponseState;
  onResume: () => void;
  onHold: () => void;
}) {
  const severity = activeSeverityFromAssessment(card, score, assessmentResponses);
  const route = routeFromAssessment(card, score, assessmentResponses);
  const reasons = localSafetyFloorReasons(card);

  return (
    <div className="ist-surface flex min-h-[580px] flex-col justify-between p-5">
      <div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <span className="text-[11px] uppercase tracking-[0.14em] text-emerald-700">Active call selected</span>
            <h2 className="mt-2 truncate text-2xl font-normal text-slate-950">{card.maskedPatientId}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{card.symptomTextRaw}</p>
          </div>
          <span className={`w-fit rounded-md border px-2.5 py-1 text-xs font-normal ${severityClass(severity)}`}>
            {severity}
          </span>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <ClinicalChip label="Current action" value={stages[stageIndex]?.label ?? "Reason & Emergency"} />
          <ClinicalChip label="Route" value={route.destination} />
          <ClinicalChip label="Channel" value={`${card.channel} - ${card.queueStatus}`} />
          <ClinicalChip label="Patient" value={`${card.patientType}, ${card.age} years`} />
        </div>

        {reasons.length > 0 && (
          <div className="mt-4 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm leading-6 text-rose-800">
            <span className="block text-[11px] uppercase tracking-[0.14em]">Emergency floor</span>
            {reasons.join("; ")}
          </div>
        )}
      </div>

      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-normal text-white transition hover:bg-emerald-700"
          onClick={onResume}
        >
          Resume full triage
          <ArrowRight className="h-4 w-4" />
        </button>
        <button
          type="button"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-normal text-slate-700 transition hover:border-amber-300 hover:bg-amber-50"
          onClick={onHold}
        >
          <PauseCircle className="h-4 w-4" />
          Hold call
        </button>
      </div>
    </div>
  );
}

function EmptyActiveState({ holdCount, onSyntheticOpen }: { holdCount: number; onSyntheticOpen: () => void }) {
  return (
    <div className="ist-empty-state flex min-h-[580px] flex-col items-center justify-center p-8 text-center">
      <PhoneCall className="h-10 w-10 text-emerald-600" />
      <h2 className="mt-4 text-xl font-semibold text-slate-950">No active call</h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">
        Select one caller from the incoming queue. The cockpit blocks a second active encounter until the current call is completed or placed on hold.
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        <Tag>{holdCount} on hold</Tag>
        <button
          type="button"
          className="secondary-button"
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
  assessmentResponses,
  scoreState,
  copied,
  writebackStatus,
  onSyntheticOpen
}: {
  activeCard?: Card;
  score?: ApiScoreResult;
  assessmentResponses: AssessmentResponseState;
  scoreState: ScoreState;
  copied: boolean;
  writebackStatus: string;
  onSyntheticOpen: () => void;
}) {
  const severity = activeCard ? activeSeverityFromAssessment(activeCard, score, assessmentResponses) : "Routine";
  const reasons = activeCard ? localSafetyFloorReasons(activeCard) : [];
  const route = activeCard ? routeFromAssessment(activeCard, score, assessmentResponses) : undefined;
  const note = activeCard ? sbarMarkdown(activeCard, score, assessmentResponses) : "";
  return (
    <aside className="space-y-4">
      <section className="ist-surface p-4">
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
              <div className="ist-data-field ist-data-field-danger text-rose-800">
                <strong className="block">Red-floor override</strong>
                {reasons.join("; ")}
              </div>
            )}
            <div className="ist-data-field">
              <strong className="block text-slate-950">{route?.destination}</strong>
              {route?.rationale}
            </div>
            <div className="ist-data-field">
              {scoreState.status === "loading" && "Authoritative score refresh in progress."}
              {scoreState.status === "ready" && score && `Authoritative API: ${score.riskBand}, score ${score.score}.`}
              {scoreState.status === "error" && scoreState.error}
              {scoreState.status === "idle" && "Awaiting score API response."}
            </div>
            {copied && (
              <div className="ist-data-field ist-data-field-success flex items-center gap-2 text-emerald-800">
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

      <section className="ist-surface p-4">
        <div className="mb-3 flex items-center gap-2">
          <FileText className="h-5 w-5 text-emerald-700" />
          <h3 className="text-base font-normal text-slate-950">SBAR Preview</h3>
        </div>
        {activeCard ? (
          <pre className="ist-text-display max-h-[340px] overflow-auto whitespace-pre-wrap p-3 text-xs leading-5">
            {note}
          </pre>
        ) : (
          <p className="ist-text-display p-3 text-sm leading-6">No active note.</p>
        )}
        <div className="ist-data-field mt-3 text-xs leading-5">
          {writebackStatus}
        </div>
      </section>

      <button
        type="button"
        className="secondary-button w-full"
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
