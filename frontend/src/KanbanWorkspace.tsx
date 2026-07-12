import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Kanban,
  PhoneCall,
  ShieldAlert,
  UserRoundCheck
} from "lucide-react";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";

type Severity = "Emergency" | "Urgent" | "Routine" | "Self-care";
type BoardStatus = "incoming" | "identity" | "triage" | "disposition" | "followup";

type BoardCase = {
  id: string;
  maskedPatientId: string;
  staffId: string;
  patientType: "Staff" | "Dependent";
  severity: Severity;
  status: BoardStatus;
  channel: "Phone" | "WhatsApp" | "Callback";
  waitMinutes: number;
  role: string;
  station: string;
  summary: string;
  safetyFloor: boolean;
  route: string;
  owner: string;
};

const boardColumns: Array<{ id: BoardStatus; title: string; limit: string; icon: typeof PhoneCall }> = [
  { id: "incoming", title: "Incoming", limit: "Accept next call", icon: PhoneCall },
  { id: "identity", title: "Identity", limit: "HRMS match", icon: UserRoundCheck },
  { id: "triage", title: "Clinical triage", limit: "Rules-first checklist", icon: ShieldAlert },
  { id: "disposition", title: "Disposition", limit: "Nurse approval", icon: AlertTriangle },
  { id: "followup", title: "SBAR / follow-up", limit: "Copy and close", icon: CheckCircle2 }
];

const initialBoardCases: BoardCase[] = [
  {
    id: "case-10002",
    maskedPatientId: "DEP-42***",
    staffId: "IST-1001",
    patientType: "Dependent",
    severity: "Emergency",
    status: "incoming",
    channel: "WhatsApp",
    waitMinutes: 7,
    role: "Dependent child",
    station: "DOH",
    summary: "Fever with fast breathing reported by parent.",
    safetyFloor: true,
    route: "Sidra Medicine Emergency Department",
    owner: "Unassigned"
  },
  {
    id: "case-10001",
    maskedPatientId: "IST-10***",
    staffId: "IST-10001",
    patientType: "Staff",
    severity: "Emergency",
    status: "identity",
    channel: "Phone",
    waitMinutes: 4,
    role: "Cabin Crew",
    station: "DOH",
    summary: "Chest tightness and sweating before duty report.",
    safetyFloor: true,
    route: "Hamad Medical Corporation Emergency Department",
    owner: "Senior Triage Nurse"
  },
  {
    id: "case-10003",
    maskedPatientId: "IST-10***",
    staffId: "IST-1001",
    patientType: "Staff",
    severity: "Urgent",
    status: "triage",
    channel: "Callback",
    waitMinutes: 11,
    role: "Pilot",
    station: "LHR",
    summary: "Dizziness after long sector; fit-to-fly review requested.",
    safetyFloor: false,
    route: "HMC urgent review pathway",
    owner: "Remote Triage Nurse"
  },
  {
    id: "case-10005",
    maskedPatientId: "IST-22***",
    staffId: "IST-2205",
    patientType: "Staff",
    severity: "Urgent",
    status: "disposition",
    channel: "Phone",
    waitMinutes: 13,
    role: "Ground Operations",
    station: "DOH",
    summary: "Back pain after ramp duty, reduced mobility, no trauma red flags.",
    safetyFloor: false,
    route: "Occupational health clinician review",
    owner: "Occupational Health Clinician"
  },
  {
    id: "case-10004",
    maskedPatientId: "IST-30***",
    staffId: "IST-3003",
    patientType: "Staff",
    severity: "Routine",
    status: "followup",
    channel: "Phone",
    waitMinutes: 16,
    role: "Operations Specialist",
    station: "DOH",
    summary: "Mild sore throat, no red flags, requesting routine advice.",
    safetyFloor: false,
    route: "PHCC urgent care or IST teleconsult",
    owner: "Remote Triage Nurse"
  }
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

const statusOrder: BoardStatus[] = ["incoming", "identity", "triage", "disposition", "followup"];

function nextStatus(status: BoardStatus) {
  return statusOrder[Math.min(statusOrder.indexOf(status) + 1, statusOrder.length - 1)];
}

function previousStatus(status: BoardStatus) {
  return statusOrder[Math.max(statusOrder.indexOf(status) - 1, 0)];
}

function maskCount(cases: BoardCase[]) {
  return cases.filter((boardCase) => boardCase.safetyFloor).length;
}

export default function KanbanWorkspace() {
  const [cases, setCases] = useState(initialBoardCases);
  const [selectedId, setSelectedId] = useState(initialBoardCases[0]?.id ?? "");
  const [severityFilter, setSeverityFilter] = useState<Severity | "All">("All");

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

  function moveCase(id: string, direction: "forward" | "back") {
    setCases((current) =>
      current.map((boardCase) =>
        boardCase.id === id
          ? {
              ...boardCase,
              status: direction === "forward" ? nextStatus(boardCase.status) : previousStatus(boardCase.status),
              owner: boardCase.owner === "Unassigned" ? "Remote Triage Nurse" : boardCase.owner
            }
          : boardCase
      )
    );
    setSelectedId(id);
  }

  function openStepCockpit() {
    window.location.hash = "#/workspace";
  }

  return (
    <section className="space-y-4" aria-label="Kanban nurse cockpit">
      <div className="clinical-card p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="tag-label">KANBAN COCKPIT</span>
            <h1 className="mt-2 text-3xl font-semibold tracking-[0] text-[var(--tx)] md:text-4xl">
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

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Waiting calls" value={String(cases.filter((boardCase) => boardCase.status === "incoming").length)} />
          <Metric label="In clinical flow" value={String(cases.filter((boardCase) => boardCase.status !== "incoming").length)} />
          <Metric label="Safety floors" value={String(maskCount(cases))} tone="red" />
          <Metric label="Assigned nurses" value={String(new Set(cases.map((boardCase) => boardCase.owner)).size)} />
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="grid gap-3 lg:grid-cols-5">
          {boardColumns.map((column) => {
            const columnCases = filteredCases.filter((boardCase) => boardCase.status === column.id);
            const ColumnIcon = column.icon;
            return (
              <section key={column.id} className="clinical-card min-w-0 p-3" aria-label={`${column.title} column`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <ColumnIcon className="h-4 w-4 text-[var(--t1)]" />
                      <h2 className="truncate text-sm font-semibold text-[var(--tx)]">{column.title}</h2>
                    </div>
                    <p className="mt-1 text-[11px] font-medium leading-4 text-[var(--tx3)]">{column.limit}</p>
                  </div>
                  <span className="rounded-full border border-[var(--bd)] px-2 py-1 text-[11px] font-semibold text-[var(--tx2)]">
                    {columnCases.length}
                  </span>
                </div>

                <div className="mt-3 grid gap-2">
                  {columnCases.map((boardCase) => (
                    <button
                      key={boardCase.id}
                      type="button"
                      className={`rounded-lg border p-3 text-left transition ${
                        selectedCase?.id === boardCase.id
                          ? "border-[var(--t1)] bg-[var(--t1bg)]"
                          : "border-[var(--bd)] bg-[var(--bg)] hover:border-[var(--t1bd)]"
                      }`}
                      onClick={() => setSelectedId(boardCase.id)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <span className="text-[11px] font-semibold text-[var(--t1)]">{boardCase.maskedPatientId}</span>
                          <strong className="mt-1 block text-sm leading-5 text-[var(--tx)]">{boardCase.role}</strong>
                        </div>
                        <span className={`rounded-full border px-2 py-1 text-[10px] font-semibold ${severityStyles[boardCase.severity]}`}>
                          {boardCase.severity}
                        </span>
                      </div>
                      <p className="mt-2 text-xs leading-5 text-[var(--tx2)]">{boardCase.summary}</p>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        <Chip>{boardCase.waitMinutes}m</Chip>
                        <Chip>{boardCase.channel}</Chip>
                        <Chip>{boardCase.patientType}</Chip>
                        {boardCase.safetyFloor && <Chip tone="red">Safety floor</Chip>}
                      </div>
                    </button>
                  ))}

                  {columnCases.length === 0 && (
                    <div className="rounded-lg border border-dashed border-[var(--bd)] p-3 text-center text-xs font-semibold text-[var(--tx3)]">
                      Clear
                    </div>
                  )}
                </div>
              </section>
            );
          })}
        </div>

        <aside className="clinical-card p-4" aria-label="Selected call details">
          {selectedCase ? (
            <div className="space-y-4">
              <div>
                <span className="tag-label">SELECTED CALL</span>
                <h2 className="mt-2 text-xl font-semibold text-[var(--tx)]">{selectedCase.maskedPatientId}</h2>
                <p className="mt-2 text-sm leading-6 text-[var(--tx2)]">{selectedCase.summary}</p>
              </div>

              <div className="grid gap-2">
                <Detail label="Staff ID" value={selectedCase.staffId} />
                <Detail label="Patient" value={selectedCase.patientType} />
                <Detail label="Owner" value={selectedCase.owner} />
                <Detail label="Station" value={selectedCase.station} />
                <Detail label="Route" value={selectedCase.route} />
              </div>

              {selectedCase.safetyFloor && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-red-700">
                  <div className="flex items-center gap-2 text-sm font-semibold">
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
                <p className="mt-2 font-semibold">No call selected</p>
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
      <strong className={`block text-2xl font-semibold ${tone === "red" ? "text-red-600" : "text-[var(--tx)]"}`}>
        {value}
      </strong>
      <span className="mt-1 block text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--tx3)]">{label}</span>
    </div>
  );
}

function Chip({ children, tone = "default" }: { children: ReactNode; tone?: "default" | "red" }) {
  return (
    <span
      className={`rounded-full border px-2 py-1 text-[10px] font-semibold ${
        tone === "red"
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-[var(--bd)] bg-[var(--bg2)] text-[var(--tx2)]"
      }`}
    >
      {children}
    </span>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--bd)] bg-[var(--bg2)] p-3">
      <span className="block text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--tx3)]">{label}</span>
      <strong className="mt-1 block text-sm leading-5 text-[var(--tx)]">{value}</strong>
    </div>
  );
}
