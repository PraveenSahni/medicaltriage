import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Kanban,
  PhoneCall,
  Search,
  ShieldAlert,
} from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import type { QueueClinicalStage, QueueItem } from "./QueueContext";
import { useQueue } from "./QueueContext";

type Severity = "Emergency" | "Urgent" | "Routine" | "Self-care";
type BoardStatus = "incoming" | "reason" | "questions" | "disposition" | "followup";

type BoardCase = {
  id: string;
  maskedPatientId: string;
  staffId: string;
  patientType: "Staff" | "Dependent";
  severity: Severity;
  status: BoardStatus;
  queueStatus: QueueItem["status"];
  queueStage: QueueClinicalStage;
  channel: "Phone" | "WhatsApp" | "Callback";
  waitMinutes: number;
  role: string;
  station: string;
  summary: string;
  safetyFloor: boolean;
  route: string;
  owner: string;
  ageLabel: string;
  identityValidated: boolean;
  protocolTitle: string;
  ragAgreement: string;
  ragConfidence?: number;
};

const boardColumns: Array<{ id: BoardStatus; title: string; limit: string; icon: typeof PhoneCall }> = [
  { id: "incoming", title: "Incoming Queue", limit: "HRMS-ready calls", icon: PhoneCall },
  { id: "reason", title: "Reason & Rule-Out", limit: "Opening + search", icon: Search },
  { id: "questions", title: "Questions", limit: "High acuity first", icon: ShieldAlert },
  { id: "disposition", title: "Disposition + Advice", limit: "Nurse approval", icon: AlertTriangle },
  { id: "followup", title: "SBAR / Complete", limit: "Copy and close", icon: CheckCircle2 }
];

const severityStyles: Record<Severity, string> = {
  Emergency: "border-red-200 bg-red-50 text-red-700",
  Urgent: "border-amber-200 bg-amber-50 text-amber-700",
  Routine: "border-sky-200 bg-sky-50 text-sky-700",
  "Self-care": "border-emerald-200 bg-emerald-50 text-emerald-700"
};

const severityOrder: Record<Severity, number> = {
  Emergency: 0,
  Urgent: 1,
  Routine: 2,
  "Self-care": 3
};

const statusOrder: BoardStatus[] = ["incoming", "reason", "questions", "disposition", "followup"];
const queueStageByStatus: Record<BoardStatus, QueueClinicalStage> = {
  incoming: "INTAKE",
  reason: "VITALS",
  questions: "PROTOCOL",
  disposition: "DISPOSITION",
  followup: "SBAR"
};

function nextStatus(status: BoardStatus) {
  return statusOrder[Math.min(statusOrder.indexOf(status) + 1, statusOrder.length - 1)];
}

function previousStatus(status: BoardStatus) {
  return statusOrder[Math.max(statusOrder.indexOf(status) - 1, 0)];
}

function maskCount(cases: BoardCase[]) {
  return cases.filter((boardCase) => boardCase.safetyFloor).length;
}

function severityFrom(item: QueueItem): Severity {
  if (item.safetyFloorActive || item.calculatedSeverity === "EMERGENCY") return "Emergency";
  if (item.calculatedSeverity === "URGENT") return "Urgent";
  if (item.calculatedSeverity === "SELF_CARE") return "Self-care";
  return "Routine";
}

function statusFrom(item: QueueItem): BoardStatus {
  if (item.status === "INCOMING") return "incoming";
  if (item.stccProcess?.currentActionTab === "REASON_AND_EMERGENCY_RULE_OUT") return "reason";
  if (item.stccProcess?.currentActionTab === "QUESTIONS") return "questions";
  if (item.stccProcess?.currentActionTab === "DISPOSITION_AND_CARE_ADVICE") return "disposition";
  if (item.stccProcess?.currentActionTab === "SBAR_COMPLETE") return "followup";
  if (item.currentStage === "IDENTITY" || item.currentStage === "INTAKE" || item.currentStage === "VITALS") return "reason";
  if (item.currentStage === "PROTOCOL") return "questions";
  if (item.currentStage === "DISPOSITION") return "disposition";
  return "followup";
}

function actionLabel(status: BoardStatus) {
  if (status === "incoming") return "Waiting";
  if (status === "reason") return "Reason & rule-out";
  if (status === "questions") return "Assessment questions";
  if (status === "disposition") return "Disposition + advice";
  return "SBAR / complete";
}

function minutesUntil(iso: string) {
  return Math.max(0, Math.round((new Date(iso).getTime() - Date.now()) / 60_000));
}

function maskedId(item: QueueItem) {
  if (item.patientType === "Dependent") return `DEP-${item.id.slice(-4)}***`;
  return `${item.istStaffId.slice(0, 6)}***`;
}

function normalizeChannel(channel: string): BoardCase["channel"] {
  if (channel === "WhatsApp" || channel === "Callback") return channel;
  return "Phone";
}

function toBoardCase(item: QueueItem): BoardCase {
  const ragShadow = item.preparedProtocol?.ragShadow;
  return {
    id: item.id,
    maskedPatientId: maskedId(item),
    staffId: item.istStaffId,
    patientType: item.patientType,
    severity: severityFrom(item),
    status: statusFrom(item),
    queueStatus: item.status,
    queueStage: item.currentStage,
    channel: normalizeChannel(item.channel),
    waitMinutes: minutesUntil(item.slaDeadlineIso),
    role: item.jobTitle ?? item.patientType,
    station: item.stationCode ?? "DOH",
    summary: item.summary,
    safetyFloor: item.safetyFloorActive,
    route: item.destinationName ?? item.dispositionCode ?? "Pending route review",
    owner: item.assignedNurseId ?? "Unassigned",
    ageLabel: item.patientAge ? `${item.patientAge.ageYears}y${item.patientAge.ageMonths !== undefined ? ` / ${item.patientAge.ageMonths}m` : ""}` : "HRMS pending",
    identityValidated: item.identityValidated,
    protocolTitle: item.preparedProtocol?.primaryProtocolTitle ?? "Protocol match pending",
    ragAgreement: ragShadow?.comparison.agreement.replace(/_/g, " ").toLowerCase() ?? "No RAG shadow",
    ragConfidence: ragShadow ? Math.round(ragShadow.retrieval.confidence * 100) : undefined
  };
}

export default function KanbanWorkspace() {
  const { queue, activeItem, loading, error, moveItem, openItemInStep, setActiveItemById } = useQueue();
  const cases = useMemo(() => queue.map(toBoardCase), [queue]);
  const [selectedId, setSelectedId] = useState("");
  const [severityFilter, setSeverityFilter] = useState<Severity | "All">("All");
  const [actionError, setActionError] = useState<string | undefined>();

  useEffect(() => {
    if (activeItem) {
      setSelectedId(activeItem.id);
      return;
    }
    if (!selectedId && cases[0]) {
      setSelectedId(cases[0].id);
    }
  }, [activeItem, cases, selectedId]);

  const filteredCases = useMemo(() => {
    return cases
      .filter((boardCase) => severityFilter === "All" || boardCase.severity === severityFilter)
      .sort((left, right) => {
        if (severityOrder[left.severity] !== severityOrder[right.severity]) {
          return severityOrder[left.severity] - severityOrder[right.severity];
        }
        return right.waitMinutes - left.waitMinutes;
      });
  }, [cases, severityFilter]);

  const selectedCase = cases.find((boardCase) => boardCase.id === selectedId) ?? cases[0];

  async function moveCase(id: string, direction: "forward" | "back") {
    const boardCase = cases.find((candidate) => candidate.id === id);
    if (!boardCase) return;
    setActionError(undefined);
    try {
      const nextBoardStatus = direction === "forward" ? nextStatus(boardCase.status) : previousStatus(boardCase.status);
      const toStage = queueStageByStatus[nextBoardStatus];
      await moveItem(
        id,
        toStage,
        direction === "back" && nextBoardStatus === "incoming" ? "INCOMING" : boardCase.queueStatus === "COMPLETED" ? "COMPLETED" : "IN_PROCESS",
        direction === "forward"
          ? "Board status aligned to STCC visible action tab; clinical decisions remain in Step cockpit."
          : "Board status moved back for queue correction; clinical decisions remain in Step cockpit."
      );
      setSelectedId(id);
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : "Queue movement failed");
    }
  }

  async function openStepCockpit() {
    if (!selectedCase) {
      window.location.hash = "#/workspace";
      return;
    }
    setActionError(undefined);
    try {
      await openItemInStep(selectedCase.id);
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : "Unable to open Step cockpit");
    }
  }

  return (
    <section className="space-y-4" aria-label="Kanban nurse cockpit">
      <div className="clinical-card p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="tag-label">KANBAN COCKPIT</span>
            <h1 className="mt-2 text-3xl font-normal tracking-[0] text-[var(--tx)] md:text-4xl">
              Nurse Queue Board
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--tx2)]">
              Board-level queue supervision for shift leads, with clinical safety floor and route status visible on every card.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className="secondary-button" onClick={openStepCockpit}>
              <ArrowRight className="h-4 w-4" />
              Step cockpit
            </button>
            <label className="min-w-[180px]">
              <span className="field-label">Severity</span>
              <select
                className="input-control mt-1"
                value={severityFilter}
                onChange={(event) => setSeverityFilter(event.target.value as Severity | "All")}
              >
                {["All", "Emergency", "Urgent", "Routine", "Self-care"].map((severity) => (
                  <option key={severity} value={severity}>
                    {severity}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
        {(error || actionError) && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm font-normal text-amber-800">
            {actionError ?? error}
          </div>
        )}

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Waiting calls" value={String(cases.filter((boardCase) => boardCase.status === "incoming").length)} />
          <Metric label="In clinical flow" value={String(cases.filter((boardCase) => boardCase.status !== "incoming").length)} />
          <Metric label="Safety floors" value={String(maskCount(cases))} tone="red" />
          <Metric label="Assigned nurses" value={String(new Set(cases.map((boardCase) => boardCase.owner)).size)} />
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="overflow-x-auto pb-2">
          <div className="grid min-w-[1120px] gap-3 lg:grid-cols-5">
          {boardColumns.map((column) => {
            const columnCases = filteredCases.filter((boardCase) => boardCase.status === column.id);
            const ColumnIcon = column.icon;
            return (
              <section key={column.id} className="clinical-card min-w-0 p-4" aria-label={`${column.title} column`}>
                <div className="flex items-start justify-between gap-3 border-b border-[var(--bd)] pb-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <ColumnIcon className="h-4 w-4 text-[var(--t1)]" />
                      <h2 className="truncate text-base font-normal text-[var(--tx)]">{column.title}</h2>
                    </div>
                    <p className="mt-1 text-[11px] font-normal uppercase tracking-[0.12em] text-[var(--tx3)]">{column.limit}</p>
                  </div>
                  <span className="rounded-md border border-[var(--bd)] px-2 py-1 text-[11px] font-normal text-[var(--tx2)]">
                    {columnCases.length}
                  </span>
                </div>

                <div className="mt-3 grid gap-3">
                  {columnCases.map((boardCase) => (
                    <button
                      key={boardCase.id}
                      type="button"
                      className={`kanban-call-card rounded-md border p-4 text-left transition ${
                        selectedCase?.id === boardCase.id
                          ? "border-[var(--brand-navy)] bg-[var(--t1bg)]"
                          : "border-[var(--bd)] bg-[var(--bg)] hover:border-[var(--t1bd)]"
                      }`}
                      onClick={() => {
                        setSelectedId(boardCase.id);
                        setActiveItemById(boardCase.id);
                      }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <span className="text-[11px] font-normal uppercase tracking-[0.12em] text-[var(--t1)]">
                            {actionLabel(boardCase.status)}
                          </span>
                          <strong className="mt-2 block text-base font-normal leading-5 text-[var(--tx)]">
                            {boardCase.maskedPatientId}
                          </strong>
                          <span className="mt-1 block text-sm font-normal leading-5 text-[var(--tx2)]">{boardCase.role}</span>
                        </div>
                        <span className={`rounded-md border px-2 py-1 text-[10px] font-normal ${severityStyles[boardCase.severity]}`}>
                          {boardCase.severity}
                        </span>
                      </div>
                      <p className="mt-3 line-clamp-3 text-sm font-normal leading-6 text-[var(--tx2)]">{boardCase.summary}</p>
                      <p className="mt-3 line-clamp-2 border-l border-[var(--bd)] pl-2 text-xs leading-5 text-[var(--tx3)]">
                        {boardCase.protocolTitle}
                      </p>
                      <div className="mt-4 grid grid-cols-2 gap-2 border-t border-[var(--bd)] pt-3">
                        <MiniFact label="Wait" value={`${boardCase.waitMinutes}m`} />
                        <MiniFact label="Channel" value={boardCase.channel} />
                        <MiniFact label="Patient" value={`${boardCase.patientType} / ${boardCase.ageLabel}`} />
                        <MiniFact label="Station" value={boardCase.station} />
                      </div>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        <Chip>{boardCase.waitMinutes}m</Chip>
                        <Chip>{boardCase.channel}</Chip>
                        <Chip>{boardCase.identityValidated ? "HRMS validated" : "HRMS review"}</Chip>
                        {boardCase.ragConfidence !== undefined && <Chip>RAG {boardCase.ragAgreement}</Chip>}
                        {boardCase.safetyFloor && <Chip tone="red">Safety floor</Chip>}
                      </div>
                    </button>
                  ))}

                  {columnCases.length === 0 && (
                    <div className="rounded-md border border-dashed border-[var(--bd)] p-4 text-center text-xs font-normal text-[var(--tx3)]">
                      {loading ? "Loading" : "Clear"}
                    </div>
                  )}
                </div>
              </section>
            );
          })}
          </div>
        </div>

        <aside className="clinical-card p-4" aria-label="Selected call details">
          {selectedCase ? (
            <div className="space-y-4">
              <div>
                <span className="tag-label">SELECTED CALL</span>
                <h2 className="mt-2 text-xl font-normal text-[var(--tx)]">{selectedCase.maskedPatientId}</h2>
                <p className="mt-2 text-sm leading-6 text-[var(--tx2)]">{selectedCase.summary}</p>
              </div>

              <div className="grid gap-2">
                <Detail label="Current action" value={actionLabel(selectedCase.status)} />
                <Detail label="Staff ID" value={selectedCase.staffId} />
                <Detail label="Patient" value={selectedCase.patientType} />
                <Detail label="HRMS / Age" value={`${selectedCase.identityValidated ? "Validated" : "Review"} - ${selectedCase.ageLabel}`} />
                <Detail label="Protocol" value={selectedCase.protocolTitle} />
                <Detail
                  label="RAG shadow"
                  value={
                    selectedCase.ragConfidence !== undefined
                      ? `${selectedCase.ragAgreement} (${selectedCase.ragConfidence}%)`
                      : selectedCase.ragAgreement
                  }
                />
                <Detail label="Owner" value={selectedCase.owner} />
                <Detail label="Station" value={selectedCase.station} />
                <Detail label="Route" value={selectedCase.route} />
              </div>

              {selectedCase.safetyFloor && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-red-700">
                  <div className="flex items-center gap-2 text-sm font-normal">
                    <ShieldAlert className="h-4 w-4" />
                    Safety floor active
                  </div>
                  <p className="mt-2 text-xs leading-5">
                    Case remains emergency-routed until the nurse completes deterministic checklist review.
                  </p>
                </div>
              )}

              <div className="grid gap-2">
                <button
                  type="button"
                  className="primary-button"
                  onClick={openStepCockpit}
                >
                  Open in Step cockpit
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => moveCase(selectedCase.id, "forward")}
                  disabled={selectedCase.status === "followup"}
                >
                  Move forward
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => moveCase(selectedCase.id, "back")}
                  disabled={selectedCase.status === "incoming"}
                >
                  Move back
                </button>
              </div>
            </div>
          ) : (
            <div className="grid min-h-[280px] place-items-center text-center text-sm text-[var(--tx3)]">
              <div>
                <Kanban className="mx-auto h-6 w-6" />
        <p className="mt-2 font-normal">No call selected</p>
              </div>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}

function Metric({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "red" }) {
  return (
    <div className="rounded-lg border border-[var(--bd)] bg-[var(--bg2)] p-3">
      <strong className={`block text-2xl font-normal ${tone === "red" ? "text-red-600" : "text-[var(--tx)]"}`}>
        {value}
      </strong>
      <span className="mt-1 block text-[11px] font-normal uppercase tracking-[0.08em] text-[var(--tx3)]">{label}</span>
    </div>
  );
}

function Chip({ children, tone = "default" }: { children: ReactNode; tone?: "default" | "red" }) {
  return (
    <span
      className={`rounded-md border px-2 py-1 text-[10px] font-normal ${
        tone === "red"
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-[var(--bd)] bg-[var(--bg2)] text-[var(--tx2)]"
      }`}
    >
      {children}
    </span>
  );
}

function MiniFact({ label, value }: { label: string; value: string }) {
  return (
    <span className="min-w-0">
      <small className="block text-[10px] font-normal uppercase tracking-[0.12em] text-[var(--tx3)]">{label}</small>
      <strong className="mt-0.5 block truncate text-xs font-normal leading-5 text-[var(--tx)]">{value}</strong>
    </span>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--bd)] bg-[var(--bg2)] p-3">
      <span className="block text-[10px] font-normal uppercase tracking-[0.08em] text-[var(--tx3)]">{label}</span>
      <strong className="mt-1 block text-sm font-normal leading-5 text-[var(--tx)]">{value}</strong>
    </div>
  );
}
