import { AlertTriangle, CheckCircle2, ChevronDown, ShieldCheck, Timer } from "lucide-react";
import { useEffect, useState } from "react";

type SafetyKpis = {
  averageHandlingTimeAiSeconds: number;
  averageHandlingTimeManualSeconds: number;
  overtriageRate: number;
  undertriageRate: number;
  medsafeDxPassRate: number;
  pendingApprovals: number;
  safetyFloorOverrides: number;
  clinicianOverrides: number;
  totalCallVolume?: number;
  hmcEscalations?: number;
  sidraEscalations?: number;
  clinicalDeviationRate?: number;
  criticalFloorBreaches?: number;
};

type SafetyTrend = {
  label: string;
  overtriageRate: number;
  undertriageRate: number;
};

type ExplainabilityFeature = {
  id: string;
  label: string;
  value: string;
  rationale: string;
};

type ExplainabilityRow = {
  encounterId: string;
  submittedAtIso: string;
  protocol: string;
  vitalsSummary: string;
  rulesEngineSeverity: string;
  aiRecommendation: string;
  finalDispositionCode: string;
  aiReasoning: string;
  safetyFloorOverride: boolean;
  clinicianOverride: boolean;
  criticalFloorBreach?: boolean;
  auditTrace: ExplainabilityFeature[];
};

type SafetyDashboardPayload = {
  kpis: SafetyKpis;
  trends: SafetyTrend[];
  explainabilityLog: ExplainabilityRow[];
};

const apiBase = import.meta.env.VITE_API_BASE_URL || "";

const emptyDashboard: SafetyDashboardPayload = {
  kpis: {
    averageHandlingTimeAiSeconds: 0,
    averageHandlingTimeManualSeconds: 0,
    overtriageRate: 0,
    undertriageRate: 0,
    medsafeDxPassRate: 0,
    pendingApprovals: 0,
    safetyFloorOverrides: 0,
    clinicianOverrides: 0,
    criticalFloorBreaches: 0
  },
  trends: [],
  explainabilityLog: []
};

function seconds(value: number) {
  const minutes = Math.floor(value / 60);
  const remaining = value % 60;
  return `${minutes}m ${remaining}s`;
}

function KpiCard({
  label,
  value,
  hint,
  tone
}: {
  label: string;
  value: string;
  hint: string;
  tone: "green" | "amber" | "rose";
}) {
  const palette =
    tone === "rose"
      ? "border-rose-200 bg-rose-50 text-rose-700"
      : tone === "amber"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : "border-emerald-200 bg-emerald-50 text-emerald-700";
  return (
    <article className={`rounded-xl border p-4 shadow-sm ${palette}`}>
      <span className="text-xs font-semibold uppercase tracking-wide opacity-80">{label}</span>
      <strong className="mt-2 block text-3xl text-slate-950">{value}</strong>
      <p className="mt-2 text-sm text-slate-600">{hint}</p>
    </article>
  );
}
export default function SafetyDashboard() {
  const [payload, setPayload] = useState<SafetyDashboardPayload>(emptyDashboard);
  const [status, setStatus] = useState("Loading AI safety scorecard.");
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const response = await fetch(`${apiBase}/api/v1/approval/dashboard`, { credentials: "include" });
        if (!response.ok) {
          throw new Error(`Safety dashboard failed ${response.status}`);
        }
        const nextPayload = (await response.json()) as SafetyDashboardPayload;
        if (!cancelled) {
          setPayload(nextPayload);
          setStatus("Safety scorecard loaded from the HITL approval gateway.");
        }
      } catch {
        if (!cancelled) {
          setStatus("Safety scorecard unavailable. Check API status and audit permission.");
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="space-y-5" aria-label="AI safety officer dashboard">
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-700">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5" />
          <strong>Clinical AI Safety Gateway</strong>
        </div>
        <p className="mt-2 text-sm text-slate-700">
          {status} AI output remains advisory until a clinician reviews feature-level reasoning and signs the final
          action.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <KpiCard
          label="AHT AI-assisted"
          value={seconds(payload.kpis.averageHandlingTimeAiSeconds)}
          hint={`Manual baseline ${seconds(payload.kpis.averageHandlingTimeManualSeconds)}`}
          tone="green"
        />
        <KpiCard
          label="Overtriage"
          value={`${payload.kpis.overtriageRate}%`}
          hint="Higher urgency than rules baseline."
          tone="amber"
        />
        <KpiCard
          label="Undertriage"
          value={`${payload.kpis.undertriageRate}%`}
          hint="Critical safety hazard; target is zero."
          tone={payload.kpis.undertriageRate > 0 ? "rose" : "green"}
        />
        <KpiCard
          label="MedSafe-Dx pass"
          value={`${payload.kpis.medsafeDxPassRate}%`}
          hint={`${payload.kpis.pendingApprovals} approvals pending`}
          tone="green"
        />
        <KpiCard
          label="Critical breaches"
          value={`${payload.kpis.criticalFloorBreaches ?? 0}`}
          hint="Downgrades below the rules floor requiring director QA."
          tone={(payload.kpis.criticalFloorBreaches ?? 0) > 0 ? "rose" : "green"}
        />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="mb-3 flex items-center gap-2">
          <Timer className="h-5 w-5 text-slate-600" />
          <h3 className="text-lg font-semibold text-slate-950">Overtriage / undertriage trend</h3>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {payload.trends.map((trend) => (
            <div key={trend.label} className="rounded-lg border border-slate-200 p-3">
              <strong className="text-slate-950">{trend.label}</strong>
              <p className="mt-2 text-sm text-amber-700">Overtriage {trend.overtriageRate}%</p>
              <p className={`text-sm ${trend.undertriageRate > 0 ? "text-rose-600" : "text-emerald-700"}`}>
                Undertriage {trend.undertriageRate}%
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 p-4">
          <h3 className="text-lg font-semibold text-slate-950">Interactive explainability log</h3>
          <p className="text-sm text-slate-600">
            Red rows identify safety-floor overrides or clinician overrides requiring detailed audit review.
          </p>
        </div>
        <div className="divide-y divide-slate-200">
          {payload.explainabilityLog.map((row) => {
            const risky = row.safetyFloorOverride || row.clinicianOverride || row.criticalFloorBreach;
            const open = expanded === row.encounterId;
            return (
              <article
                key={row.encounterId}
                className={risky ? "bg-rose-50 text-rose-900" : "bg-white text-slate-900"}
              >
                <button
                  type="button"
                  className="flex w-full items-start justify-between gap-4 p-4 text-left"
                  onClick={() => setExpanded(open ? null : row.encounterId)}
                >
                  <span>
                    <strong>{row.encounterId}</strong>
                    <small className="mt-1 block text-slate-600">
                      {row.protocol} | {row.vitalsSummary}
                    </small>
                    <small className="mt-1 block">
                      Floor {row.rulesEngineSeverity} | AI {row.aiRecommendation} | Final {row.finalDispositionCode}
                    </small>
                  </span>
                  <span className="flex items-center gap-2">
                    {risky ? <AlertTriangle className="h-5 w-5 text-rose-600" /> : <CheckCircle2 className="h-5 w-5 text-emerald-600" />}
                    <ChevronDown className={`h-5 w-5 transition ${open ? "rotate-180" : ""}`} />
                  </span>
                </button>
                {open && (
                  <div className="px-4 pb-4">
                    <p className="rounded-lg bg-white/80 p-3 text-sm text-slate-700">{row.aiReasoning}</p>
                    <div className="mt-3 grid gap-2 md:grid-cols-2">
                      {row.auditTrace.map((trace) => (
                        <div key={trace.id} className="rounded-lg border border-slate-200 bg-white p-3">
                          <strong className="text-sm text-slate-950">{trace.label}</strong>
                          <p className="text-sm text-slate-700">{trace.value}</p>
                          <small className="text-slate-500">{trace.rationale}</small>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
