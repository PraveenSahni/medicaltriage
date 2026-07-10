import {
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  ChevronRight,
  Clock,
  Hospital,
  ShieldCheck,
  TrendingDown,
  UserRoundCheck
} from "lucide-react";
import { useState } from "react";

type AuditLog = {
  id: string;
  staffGroup: string;
  protocol: string;
  rulesSeverity: string;
  aiRecommendation: string;
  finalDisposition: string;
  overrideRationale: string;
  trace: string[];
};

const auditLogs: AuditLog[] = [
  {
    id: "AUD-1042",
    staffGroup: "Cabin Crew",
    protocol: "Chest Pain - Adult",
    rulesSeverity: "Emergency",
    aiRecommendation: "Routine",
    finalDisposition: "HMC Emergency",
    overrideRationale: "LLM downgrade blocked after chest tightness and sweating matched emergency rule.",
    trace: [
      "STCC_MOCK_CHEST_PAIN_SWEATING matched",
      "Fit-to-fly gate restricted duty status",
      "Safety audit created for AI recommendation difference"
    ]
  },
  {
    id: "AUD-1038",
    staffGroup: "Flight Deck",
    protocol: "Dizziness",
    rulesSeverity: "Urgent",
    aiRecommendation: "Urgent",
    finalDisposition: "IST HIA Midfield Medical Centre",
    overrideRationale: "Safety-sensitive crew required fit-to-fly clearance before roster return.",
    trace: [
      "Aviation safety-sensitive crew gate matched",
      "No emergency symptoms detected",
      "Nurse accepted urgent review"
    ]
  },
  {
    id: "AUD-1027",
    staffGroup: "Dependent",
    protocol: "Fever - Pediatric",
    rulesSeverity: "Emergency",
    aiRecommendation: "Emergency",
    finalDisposition: "Sidra Medicine ED",
    overrideRationale: "Pediatric high-acuity rule routed directly to Sidra Medicine.",
    trace: [
      "Pediatric age filter applied",
      "Emergency fever warning terms matched",
      "Disposition set to Sidra Medicine ED"
    ]
  },
  {
    id: "AUD-1019",
    staffGroup: "Ground Services",
    protocol: "Back Pain",
    rulesSeverity: "Routine",
    aiRecommendation: "Self-care",
    finalDisposition: "PHCC or teleconsult",
    overrideRationale: "Nurse kept routine review due occupational duty constraints.",
    trace: [
      "Routine musculoskeletal gate matched",
      "No emergency red flags selected",
      "Nurse rationale retained in audit view"
    ]
  }
];

const kpis = [
  {
    label: "Total Call Volume",
    value: "1,284",
    trend: "+12.4%",
    icon: BarChart3,
    tone: "emerald",
    series: [28, 36, 34, 44, 52, 49, 58]
  },
  {
    label: "Average Handling Time",
    value: "07:42",
    trend: "22% lower",
    icon: Clock,
    tone: "cyan",
    series: [58, 55, 51, 47, 45, 43, 39]
  },
  {
    label: "Emergency Escalations",
    value: "86",
    trend: "HMC/Sidra",
    icon: Hospital,
    tone: "rose",
    series: [8, 12, 9, 14, 10, 16, 17]
  },
  {
    label: "Sickness Leave Approvals",
    value: "318",
    trend: "+6.1%",
    icon: UserRoundCheck,
    tone: "amber",
    series: [18, 22, 27, 25, 31, 36, 33]
  }
];

export default function Dashboard() {
  const [selected, setSelected] = useState<AuditLog>(auditLogs[0]);

  return (
    <div className="grid gap-5 2xl:grid-cols-[minmax(0,1fr)_420px]">
      <section className="space-y-5">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {kpis.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <div key={kpi.label} className="clinical-card p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-slate-500">{kpi.label}</p>
                    <p className="mt-2 font-display text-3xl font-extrabold text-ist-blue">{kpi.value}</p>
                  </div>
                  <span className={`kpi-icon kpi-icon-${kpi.tone}`}>
                    <Icon className="h-5 w-5" />
                  </span>
                </div>
                <div className="mt-5 flex h-16 items-end gap-1.5">
                  {kpi.series.map((height, index) => (
                    <span
                      key={`${kpi.label}-${index}`}
                      className={`kpi-bar kpi-bar-${kpi.tone}`}
                      style={{ height: `${height}px` }}
                    />
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className="font-semibold text-slate-700">{kpi.trend}</span>
                  <ArrowUpRight className="h-4 w-4 text-slate-400" />
                </div>
              </div>
            );
          })}
        </div>

        <div className="clinical-card overflow-hidden">
          <div className="border-b border-gray-200 p-5">
            <div className="section-heading">
              <ShieldCheck className="h-5 w-5 text-ist-gold" />
              Clinical safety & AI explainability log
            </div>
            <p className="mt-2 text-sm text-slate-500">
              Select an execution card to inspect rules, AI recommendation, and nurse rationale.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[860px] divide-y divide-slate-200">
              <thead className="bg-gray-50">
                <tr>
                  {["Audit ID", "Staff group", "Protocol", "Rules", "AI", "Final disposition", ""].map((head) => (
                    <th key={head} className="table-head">
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {auditLogs.map((log) => (
                  <tr
                    key={log.id}
                    className={`cursor-pointer transition hover:bg-ist-cream ${
                      selected.id === log.id ? "bg-ist-cream" : ""
                    }`}
                    onClick={() => setSelected(log)}
                  >
                    <td className="table-cell font-bold text-ist-blue">{log.id}</td>
                    <td className="table-cell">{log.staffGroup}</td>
                    <td className="table-cell">{log.protocol}</td>
                    <td className="table-cell">
                      <SeverityPill value={log.rulesSeverity} />
                    </td>
                    <td className="table-cell">{log.aiRecommendation}</td>
                    <td className="table-cell">{log.finalDisposition}</td>
                    <td className="table-cell text-right">
                      <ChevronRight className="ml-auto h-4 w-4 text-slate-400" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          <OperationalCard
            icon={TrendingDown}
            title="AHT Trend"
            value="20-30% target reduction"
            body="Pre-answering and protocol search keep nurse time focused on validation and disposition."
          />
          <OperationalCard
            icon={Hospital}
            title="Local Routing"
            value="HMC, Sidra, PHCC, IST"
            body="Emergency and low-acuity pathways remain visible for rapid service selection."
          />
          <OperationalCard
            icon={AlertTriangle}
            title="Deviation Sampling"
            value="100% high-risk review"
            body="AI mismatch and nurse override events are retained for safety officer review."
          />
        </div>
      </section>

      <aside className="clinical-card h-fit p-5 2xl:sticky 2xl:top-28">
        <div className="section-heading">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          Execution detail
        </div>
        <div className="mt-5 rounded-2xl border border-gray-200 bg-gray-50 p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
            {selected.id}
          </p>
          <h3 className="mt-2 text-xl font-extrabold text-ist-blue">{selected.protocol}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">{selected.overrideRationale}</p>
        </div>

        <div className="mt-4 grid gap-3">
          {selected.trace.map((trace) => (
            <div key={trace} className="rounded-2xl border border-gray-200 bg-white p-4">
              <p className="text-sm font-medium leading-6 text-slate-700">{trace}</p>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}

function SeverityPill({ value }: { value: string }) {
  const className =
    value === "Emergency"
      ? "border-rose-200 bg-rose-50 text-rose-700"
      : value === "Urgent"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : "border-emerald-200 bg-emerald-50 text-emerald-700";

  return <span className={`status-pill border ${className}`}>{value}</span>;
}

function OperationalCard({
  icon: Icon,
  title,
  value,
  body
}: {
  icon: typeof TrendingDown;
  title: string;
  value: string;
  body: string;
}) {
  return (
    <div className="clinical-card p-5">
      <Icon className="h-5 w-5 text-ist-gold" />
      <p className="mt-4 text-sm font-medium text-slate-500">{title}</p>
      <p className="mt-1 text-lg font-extrabold text-ist-blue">{value}</p>
      <p className="mt-3 text-sm leading-6 text-slate-600">{body}</p>
    </div>
  );
}
