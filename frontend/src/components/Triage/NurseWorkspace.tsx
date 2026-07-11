import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Copy,
  FileText,
  PauseCircle,
  PhoneCall,
  Plane,
  ShieldAlert,
  Stethoscope,
  TimerReset,
  UserRoundCheck
} from "lucide-react";
import { useMemo, useState } from "react";

type ColumnId = "incoming" | "inProcess" | "informationRequired" | "completed";
type ConsciousLevel = "alert" | "voice" | "pain" | "unresponsive";
type Severity = "Emergency" | "Urgent" | "Routine" | "Self-care";

interface Card {
  id: string;
  istStaffId: string;
  patientName: string;
  jobTitle: string;
  department: string;
  symptomTextRaw: string;
  age: number;
  maskedPatientId: string;
  queueWaitMinutes: number;
  channel: "Phone" | "WhatsApp" | "Callback";
  stationCode?: string;
  vitals: {
    heartRate: number;
    respiratoryRate: number;
    spo2: number;
    temperature: number;
    consciousLevel: ConsciousLevel;
  };
}

type ToastTone = "info" | "warning" | "success";

type Toast = {
  id: number;
  tone: ToastTone;
  message: string;
};

const apiBase = import.meta.env.VITE_API_BASE_URL || "";

const columnMeta: Record<
  ColumnId,
  {
    title: string;
    subtitle: string;
    icon: typeof PhoneCall;
  }
> = {
  incoming: {
    title: "Incoming",
    subtitle: "All pending calls",
    icon: PhoneCall
  },
  inProcess: {
    title: "In Process",
    subtitle: "One active triage",
    icon: Stethoscope
  },
  informationRequired: {
    title: "Information Required",
    subtitle: "Pending callbacks",
    icon: PauseCircle
  },
  completed: {
    title: "Completed",
    subtitle: "Signed and executed",
    icon: CheckCircle2
  }
};

const initialCards: Card[] = [
  {
    id: "call-10001",
    istStaffId: "IST-10001",
    maskedPatientId: "IST-10***",
    patientName: "Staff member",
    jobTitle: "Cabin Crew",
    department: "Flight Operations",
    symptomTextRaw: "Chest tightness and sweating before duty report.",
    age: 32,
    queueWaitMinutes: 4,
    channel: "Phone",
    stationCode: "DOH",
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
    istStaffId: "IST-10002",
    maskedPatientId: "DEP-42***",
    patientName: "Dependent child",
    jobTitle: "Dependent",
    department: "Family health",
    symptomTextRaw: "Fever with fast breathing reported by parent.",
    age: 3,
    queueWaitMinutes: 7,
    channel: "WhatsApp",
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
    istStaffId: "IST-10003",
    maskedPatientId: "IST-10***",
    patientName: "Staff member",
    jobTitle: "Pilot",
    department: "Flight Deck",
    symptomTextRaw: "Dizziness after long sector; fit-to-fly review requested.",
    age: 46,
    queueWaitMinutes: 11,
    channel: "Callback",
    stationCode: "LHR",
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
    istStaffId: "IST-10004",
    maskedPatientId: "IST-10***",
    patientName: "Staff member",
    jobTitle: "Ground Staff",
    department: "Airport Operations",
    symptomTextRaw: "Mild sore throat, no red flags, requesting routine advice.",
    age: 29,
    queueWaitMinutes: 16,
    channel: "Phone",
    vitals: {
      heartRate: 78,
      respiratoryRate: 14,
      spo2: 99,
      temperature: 37.1,
      consciousLevel: "alert"
    }
  }
];

const initialColumns: Record<ColumnId, string[]> = {
  incoming: initialCards.map((card) => card.id),
  inProcess: [],
  informationRequired: [],
  completed: []
};

function isSafetySensitiveCrew(card: Card): boolean {
  const jobTitle = card.jobTitle.toLowerCase();
  return jobTitle.includes("pilot") || jobTitle.includes("cabin crew");
}

function pediatricTachypnea(card: Card): boolean {
  const rr = card.vitals.respiratoryRate;
  if (card.age < 1 / 6) {
    return rr >= 60;
  }
  if (card.age < 1) {
    return rr >= 50;
  }
  if (card.age < 5) {
    return rr >= 40;
  }
  if (card.age <= 12) {
    return rr >= 26;
  }
  return false;
}

function safetyFloorReasons(card: Card): string[] {
  const reasons: string[] = [];
  if (card.vitals.consciousLevel !== "alert") {
    reasons.push("AVPU is not Alert");
  }
  if (card.vitals.spo2 < 92) {
    reasons.push("SpO2 below 92%");
  }
  if (card.vitals.heartRate < 60 || card.vitals.heartRate > 130) {
    reasons.push("Heart rate outside 60-130 bpm");
  }
  if (card.vitals.respiratoryRate < 10 || card.vitals.respiratoryRate > 30) {
    reasons.push("Respiratory rate outside 10-30/min");
  }
  if (pediatricTachypnea(card)) {
    reasons.push("Pediatric age-banded tachypnea threshold");
  }
  return reasons;
}

function deriveSeverity(card: Card): Severity {
  if (safetyFloorReasons(card).length > 0) {
    return "Emergency";
  }

  const symptomText = card.symptomTextRaw.toLowerCase();
  if (
    card.vitals.temperature >= 38 ||
    card.vitals.spo2 < 94 ||
    card.vitals.heartRate >= 120 ||
    symptomText.includes("dizziness") ||
    symptomText.includes("chest") ||
    symptomText.includes("breath")
  ) {
    return "Urgent";
  }

  if (symptomText.includes("sore throat") || symptomText.includes("mild")) {
    return "Routine";
  }

  return "Self-care";
}

function dispositionFor(card: Card): { code: string; destination: string } {
  const severity = deriveSeverity(card);
  if (severity === "Emergency" && card.age < 18) {
    return { code: "SIDRA_PEDIATRIC_ED", destination: "Sidra Medicine Emergency Department" };
  }
  if (severity === "Emergency") {
    return { code: "HMC_EMERGENCY_DEPARTMENT", destination: "Nearest HMC Emergency Department" };
  }
  if (severity === "Urgent") {
    return { code: "HMC_URGENT_REVIEW", destination: "HMC urgent review pathway" };
  }
  if (severity === "Routine") {
    return { code: "PHCC_URGENT_CARE_OR_TELECONSULT", destination: "PHCC urgent care or IST teleconsult" };
  }
  return { code: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", destination: "Self-care with callback precautions" };
}

function fitToFlyStatus(card: Card): "CLEARED" | "RESTRICTED" {
  return isSafetySensitiveCrew(card) && deriveSeverity(card) !== "Self-care" ? "RESTRICTED" : "CLEARED";
}

function sbarMarkdown(card: Card): string {
  const severity = deriveSeverity(card);
  const route = dispositionFor(card);
  const reasons = safetyFloorReasons(card);
  const fitStatus = fitToFlyStatus(card);
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
    `الحالة: المريض ${card.maskedPatientId}، العمر ${card.age} سنة، الشكوى: ${card.symptomTextRaw}`,
    `الخلفية: القسم ${card.department}، قناة التواصل ${card.channel}.`,
    `التقييم: العلامات الحيوية ${vitals}. مستوى الخطورة ${severity}.`,
    `التوصية: التوجيه إلى ${route.destination}. حالة اللياقة للطيران ${fitStatus}.`
  ].join("\n");
}

function columnStatusLabel(columnId: ColumnId, count: number): string {
  if (columnId === "inProcess") {
    return count === 0 ? "0 active" : "1 active";
  }
  return `${count} ${count === 1 ? "call" : "calls"}`;
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

export default function NurseWorkspace() {
  const [cardsById, setCardsById] = useState<Record<string, Card>>(() =>
    Object.fromEntries(initialCards.map((card) => [card.id, card]))
  );
  const [columns, setColumns] = useState<Record<ColumnId, string[]>>(initialColumns);
  const [dragState, setDragState] = useState<{ cardId: string; sourceColumn: ColumnId } | null>(null);
  const [dropTarget, setDropTarget] = useState<ColumnId | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [writebackStatus, setWritebackStatus] = useState("No encounter completed in this session.");
  const [copiedCardIds, setCopiedCardIds] = useState<Set<string>>(() => new Set());

  const activeCard = columns.inProcess[0] ? cardsById[columns.inProcess[0]] : undefined;
  const completedCount = columns.completed.length;
  const emergencyCount = useMemo(
    () => Object.values(cardsById).filter((card) => safetyFloorReasons(card).length > 0).length,
    [cardsById]
  );

  function showToast(message: string, tone: ToastTone = "info") {
    const id = Date.now();
    setToast({ id, tone, message });
    window.setTimeout(() => {
      setToast((current) => (current?.id === id ? null : current));
    }, 4200);
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

  function moveCard(cardId: string, sourceColumn: ColumnId, targetColumn: ColumnId) {
    if (sourceColumn === targetColumn) {
      return;
    }

    if (targetColumn === "inProcess" && columns.inProcess.length >= 1 && !columns.inProcess.includes(cardId)) {
      showToast(
        "A call is already active. Please move the current card to 'Information Required' or 'Completed' first.",
        "warning"
      );
      return;
    }

    setColumns((current) => ({
      ...current,
      [sourceColumn]: current[sourceColumn].filter((id) => id !== cardId),
      [targetColumn]: [...current[targetColumn].filter((id) => id !== cardId), cardId]
    }));

    if (targetColumn === "inProcess") {
      showToast("Call opened in the active triage workspace.", "success");
    }
    if (targetColumn === "informationRequired") {
      showToast("Call placed in pending callback.", "info");
    }
    if (targetColumn === "completed") {
      showToast("Encounter moved to completed. Copy the SBAR note before EMR handoff.", "success");
      setWritebackStatus("Completion staged. EMR/FHIR writeback remains behind the HITL approval checkpoint.");
    }
  }

  function handleDrop(targetColumn: ColumnId) {
    if (!dragState) {
      return;
    }
    moveCard(dragState.cardId, dragState.sourceColumn, targetColumn);
    setDragState(null);
    setDropTarget(null);
  }

  async function postCompletion(card: Card) {
    const route = dispositionFor(card);
    try {
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
          assessment: `Rules-first severity ${deriveSeverity(card)}. ${safetyFloorReasons(card).join("; ") || "No red floor."}`,
          recommendation: route.destination,
          final_disposition_code: route.code,
          routing_destination: route.destination,
          safety_rationale: safetyFloorReasons(card).join("; ") || "No emergency floor currently triggered.",
          custom_aviation_tags:
            fitToFlyStatus(card) === "RESTRICTED" ? ["fit-to-fly-review", "duty-restriction"] : []
        })
      });
      setWritebackStatus("SBAR completion saved through the triage API; EMR/FHIR writeback remains safety-gated.");
    } catch {
      setWritebackStatus("SBAR copied locally. API completion is unavailable in this browser session.");
    }
  }

  async function copyAndComplete(card: Card) {
    try {
      await copyText(sbarMarkdown(card));
      setCopiedCardIds((current) => new Set([...current, card.id]));
      await postCompletion(card);
      moveCard(card.id, "inProcess", "completed");
      showToast("SBAR copied and encounter completed.", "success");
    } catch {
      showToast("Clipboard copy was blocked by the browser.", "warning");
    }
  }

  return (
    <section className="space-y-5" aria-label="Nurse triage kanban workspace">
      <div className="rounded-lg border border-slate-200/80 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Triage Pipeline</span>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal text-slate-950 md:text-5xl">
              Nurse Kanban Workspace
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Active calls move through intake, triage, callback hold, and signed completion while the rules-first safety
              floor stays visible to the nurse.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <strong className="block text-2xl text-slate-950">{columns.incoming.length}</strong>
              <span className="text-[11px] font-semibold uppercase text-slate-500">Waiting</span>
            </div>
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3">
              <strong className="block text-2xl text-rose-700">{emergencyCount}</strong>
              <span className="text-[11px] font-semibold uppercase text-rose-600">Red floor</span>
            </div>
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
              <strong className="block text-2xl text-emerald-700">{completedCount}</strong>
              <span className="text-[11px] font-semibold uppercase text-emerald-700">Closed</span>
            </div>
          </div>
        </div>
      </div>

      {toast && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm font-semibold shadow-sm ${
            toast.tone === "warning"
              ? "border-amber-200 bg-amber-50 text-amber-800"
              : toast.tone === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-slate-200 bg-slate-50 text-slate-700"
          }`}
          role="status"
        >
          {toast.message}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {(Object.keys(columnMeta) as ColumnId[]).map((columnId) => {
          const meta = columnMeta[columnId];
          const Icon = meta.icon;
          const cardIds = columns[columnId];
          const activeDrop = dropTarget === columnId;
          return (
            <section
              key={columnId}
              className={`min-h-[360px] rounded-lg border p-3 shadow-sm transition-all duration-300 ${
                activeDrop ? "border-emerald-400 bg-emerald-50/50" : "border-slate-200/80 bg-white"
              } ${columnId === "inProcess" ? "md:col-span-1" : ""}`}
              onDragOver={(event) => {
                event.preventDefault();
                setDropTarget(columnId);
              }}
              onDragLeave={() => setDropTarget(null)}
              onDrop={() => handleDrop(columnId)}
              aria-label={`${meta.title} column`}
            >
              <header className="mb-3 flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div>
                    <h2 className="text-sm font-semibold text-slate-950">{meta.title}</h2>
                    <p className="text-xs text-slate-500">{meta.subtitle}</p>
                  </div>
                </div>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                  {columnStatusLabel(columnId, cardIds.length)}
                </span>
              </header>

              <div className="space-y-3">
                {cardIds.length === 0 && (
                  <div className="rounded-lg border border-dashed border-slate-200 p-5 text-center text-xs font-semibold text-slate-400">
                    Empty
                  </div>
                )}
                {cardIds.map((cardId) => {
                  const card = cardsById[cardId];
                  return (
                    <TriageCard
                      key={card.id}
                      card={card}
                      columnId={columnId}
                      copied={copiedCardIds.has(card.id)}
                      onDragStart={() => setDragState({ cardId: card.id, sourceColumn: columnId })}
                      onDragEnd={() => {
                        setDragState(null);
                        setDropTarget(null);
                      }}
                      onOpen={() => moveCard(card.id, columnId, "inProcess")}
                    />
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      {activeCard && (
        <ActiveClinicalPanel
          card={activeCard}
          writebackStatus={writebackStatus}
          onVitalsChange={(nextVitals) => updateCardVitals(activeCard.id, nextVitals)}
          onHold={() => moveCard(activeCard.id, "inProcess", "informationRequired")}
          onCopyComplete={() => copyAndComplete(activeCard)}
        />
      )}
    </section>
  );
}

function TriageCard({
  card,
  columnId,
  copied,
  onDragStart,
  onDragEnd,
  onOpen
}: {
  card: Card;
  columnId: ColumnId;
  copied: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onOpen: () => void;
}) {
  const reasons = safetyFloorReasons(card);
  const severity = deriveSeverity(card);
  const red = reasons.length > 0;
  return (
    <article
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={`group cursor-grab rounded-lg border p-3 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md active:cursor-grabbing ${
        red ? "border-rose-200 bg-rose-50/80" : "border-slate-200 bg-white"
      } ${columnId === "inProcess" ? "scale-[1.01] ring-2 ring-emerald-100" : ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className="font-mono text-xs font-semibold text-sky-700">{card.maskedPatientId}</span>
          <h3 className="mt-1 truncate text-sm font-semibold text-slate-950">{card.patientName}</h3>
          <p className="text-xs text-slate-500">{card.department}</p>
        </div>
        <span
          className={`flex h-3 w-3 shrink-0 rounded-full ${red ? "animate-pulse bg-rose-500" : "bg-emerald-500"}`}
          aria-hidden="true"
        />
      </div>
      <p className="mt-3 line-clamp-3 text-sm leading-5 text-slate-700">{card.symptomTextRaw}</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600">
          {card.jobTitle}
        </span>
        <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600">
          {card.age}y
        </span>
        <span
          className={`rounded-full px-2 py-1 text-[11px] font-semibold ${
            severity === "Emergency"
              ? "bg-rose-100 text-rose-700"
              : severity === "Urgent"
                ? "bg-amber-100 text-amber-700"
                : "bg-emerald-100 text-emerald-700"
          }`}
        >
          {severity}
        </span>
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
        <span>{card.queueWaitMinutes}m wait</span>
        <span>{card.channel}</span>
      </div>
      {columnId !== "inProcess" && columnId !== "completed" && (
        <button
          type="button"
          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700"
          onClick={onOpen}
        >
          Open call
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      )}
      {copied && (
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
          <ClipboardCheck className="h-4 w-4" />
          SBAR copied
        </div>
      )}
    </article>
  );
}

function ActiveClinicalPanel({
  card,
  writebackStatus,
  onVitalsChange,
  onHold,
  onCopyComplete
}: {
  card: Card;
  writebackStatus: string;
  onVitalsChange: (nextVitals: Partial<Card["vitals"]>) => void;
  onHold: () => void;
  onCopyComplete: () => void;
}) {
  const reasons = safetyFloorReasons(card);
  const redFloor = reasons.length > 0;
  const severity = deriveSeverity(card);
  const route = dispositionFor(card);
  const fitStatus = fitToFlyStatus(card);
  const note = sbarMarkdown(card);

  return (
    <section className="rounded-lg border border-emerald-200 bg-white p-4 shadow-sm transition-all duration-300">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">Active Triage</span>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">{card.maskedPatientId}</h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">{card.symptomTextRaw}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-amber-300 hover:bg-amber-50"
            onClick={onHold}
          >
            <PauseCircle className="h-4 w-4" />
            Hold
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
            onClick={onCopyComplete}
          >
            <Copy className="h-4 w-4" />
            Copy SBAR & Complete Encounter
          </button>
        </div>
      </div>

      {redFloor && (
        <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-4 text-rose-800">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5" />
            <strong>Emergency Red Flag Warning</strong>
          </div>
          <ul className="mt-2 grid gap-1 text-sm md:grid-cols-2">
            {reasons.map((reason) => (
              <li key={reason}>- {reason}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.9fr)]">
        <div className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="mb-3 flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-emerald-700" />
              <h3 className="text-base font-semibold text-slate-950">Structured Ingestion</h3>
            </div>
            <div className="grid gap-3 md:grid-cols-5">
              <VitalInput
                label="HR"
                value={card.vitals.heartRate}
                min={20}
                max={260}
                onChange={(heartRate) => onVitalsChange({ heartRate })}
              />
              <VitalInput
                label="RR"
                value={card.vitals.respiratoryRate}
                min={1}
                max={80}
                onChange={(respiratoryRate) => onVitalsChange({ respiratoryRate })}
              />
              <VitalInput
                label="SpO2"
                value={card.vitals.spo2}
                min={40}
                max={100}
                onChange={(spo2) => onVitalsChange({ spo2 })}
              />
              <VitalInput
                label="Temp"
                value={card.vitals.temperature}
                min={30}
                max={45}
                step={0.1}
                onChange={(temperature) => onVitalsChange({ temperature })}
              />
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
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <ClinicalMetric
              icon={AlertTriangle}
              label="Safety floor"
              value={redFloor ? "Emergency" : "No red floor"}
              tone={redFloor ? "rose" : "emerald"}
            />
            <ClinicalMetric icon={TimerReset} label="Disposition" value={route.code} tone="slate" />
            <ClinicalMetric
              icon={Plane}
              label="Fit-to-fly"
              value={fitStatus}
              tone={fitStatus === "RESTRICTED" ? "rose" : "emerald"}
            />
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="mb-2 flex items-center gap-2">
              <UserRoundCheck className="h-5 w-5 text-emerald-700" />
              <h3 className="text-base font-semibold text-slate-950">Aviation Occupational Health Gate</h3>
            </div>
            <p className="text-sm leading-6 text-slate-600">
              {fitStatus === "RESTRICTED"
                ? "Safety-sensitive duty is restricted until clinical clearance. Rest-period handling and duty status review are required."
                : "No automatic fit-to-fly restriction is currently triggered by the active clinical floor."}
            </p>
          </div>
        </div>

        <aside className="rounded-lg border border-slate-200 bg-slate-950 p-4 text-white">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-emerald-300" />
              <h3 className="text-base font-semibold">Bilingual SBAR Note</h3>
            </div>
            <span className="rounded-full bg-white/10 px-2 py-1 text-[11px] font-semibold text-emerald-200">
              {severity}
            </span>
          </div>
          <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap rounded-lg bg-white/5 p-3 text-xs leading-5 text-slate-100">
            {note}
          </pre>
          <div className="mt-3 rounded-lg border border-white/10 bg-white/5 p-3 text-xs leading-5 text-slate-300">
            {writebackStatus}
          </div>
        </aside>
      </div>
    </section>
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
        : "border-slate-200 bg-slate-50 text-slate-700";
  return (
    <article className={`rounded-lg border p-4 ${palette}`}>
      <Icon className="h-5 w-5" />
      <span className="mt-3 block text-[11px] font-semibold uppercase tracking-[0.12em] opacity-70">{label}</span>
      <strong className="mt-1 block text-sm text-slate-950">{value}</strong>
    </article>
  );
}
