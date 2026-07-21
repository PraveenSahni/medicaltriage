import {
  HelpCircle,
  LogOut,
  MessageSquare,
  Moon,
  Settings,
  ShieldCheck,
  Sun
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import AdminPortal from "./AdminPortal";
import CcpWorkspace from "./CcpWorkspace";
import HelpCenter from "./HelpCenter";
import KanbanWorkspace from "./KanbanWorkspace";
import LoginPage from "./LoginPage";
import { QueueProvider } from "./QueueContext";
import TriageWorkspace from "./TriageWorkspace";
import { IconActionButton, LabeledIconButton, WorkspaceModeSwitch } from "./components/ui/NavigationControls";

type ViewKey = "workspace" | "kanban" | "ccp" | "help" | "admin";
type ThemeMode = "light" | "dark";
type EnvironmentTone = "simulation" | "demo" | "uat" | "production";

type AuthenticatedSession = {
  sessionId: string;
  user: {
    id: string;
    fullName: string;
    department: string;
    facility: string;
    roles: string[];
    accountStatus: string;
    mfaStatus: string;
  };
  activeRole: string;
  permissions: string[];
  expiresAtIso: string;
  mfaVerified: boolean;
};

type RuntimeEnvironment = {
  environment: EnvironmentTone;
  dataProfile: string;
  banner: {
    visible: boolean;
    label: string;
    description: string;
    tone: EnvironmentTone;
  };
};

const apiBase = import.meta.env.VITE_API_BASE_URL || "";

const defaultRuntimeEnvironment: RuntimeEnvironment = {
  environment: "simulation",
  dataProfile: "synthetic",
  banner: {
    visible: true,
    label: "SIMULATION",
    description: "Synthetic records only. No PHI. Use for workflow rehearsal and governed AI evaluation.",
    tone: "simulation"
  }
};

const roleLabels: Record<string, string> = {
  platform_super_administrator: "Platform Super Administrator",
  organization_administrator: "Organization Administrator",
  system_administrator: "System Administrator",
  security_administrator: "Security Administrator",
  privacy_officer: "Privacy Officer / DPO",
  compliance_auditor: "Compliance Auditor",
  clinical_governance_lead: "Clinical Governance Lead",
  triage_service_manager: "Triage Service Manager",
  call_intake_coordinator: "Call Intake Coordinator",
  remote_triage_nurse: "Remote Triage Nurse",
  senior_triage_nurse: "Senior Triage Nurse",
  pediatric_triage_nurse: "Pediatric Triage Nurse",
  teleconsult_physician: "Teleconsult Physician",
  occupational_health_clinician: "Occupational Health Clinician",
  protocol_content_manager: "Protocol Content Manager",
  quality_reviewer: "Quality Reviewer",
  integration_administrator: "Integration Administrator",
  reporting_analyst: "Reporting Analyst",
  helpdesk_support: "Helpdesk Support"
};

const controlCenterRoles = new Set([
  "platform_super_administrator",
  "organization_administrator",
  "system_administrator",
  "security_administrator",
  "privacy_officer",
  "compliance_auditor",
  "clinical_governance_lead",
  "triage_service_manager",
  "protocol_content_manager",
  "quality_reviewer",
  "integration_administrator",
  "reporting_analyst",
  "helpdesk_support"
]);

function canOpenAdminView(session: AuthenticatedSession) {
  return controlCenterRoles.has(session.activeRole);
}

function formatRole(role: string) {
  return (
    roleLabels[role] ??
    role
      .replace(/_/g, " ")
      .replace(/\b\w/g, (character) => character.toUpperCase())
  );
}

export default function App() {
  const [activeView, setActiveView] = useState<ViewKey>("workspace");
  const [themeMode, setThemeMode] = useState<ThemeMode>("light");
  const [session, setSession] = useState<AuthenticatedSession | null>(null);
  const [sessionStatus, setSessionStatus] = useState("Checking secure session.");
  const [runtimeEnvironment, setRuntimeEnvironment] = useState<RuntimeEnvironment>(defaultRuntimeEnvironment);

  useEffect(() => {
    document.documentElement.dataset.theme = themeMode;
    document.documentElement.classList.toggle("dark", themeMode === "dark");
  }, [themeMode]);

  useEffect(() => {
    let cancelled = false;

    async function loadRuntimeEnvironment() {
      try {
        const response = await fetch(`${apiBase}/api/v1/runtime/environment`);
        if (!response.ok) {
          return;
        }
        const payload = (await response.json()) as RuntimeEnvironment;
        if (!cancelled) {
          setRuntimeEnvironment(payload);
        }
      } catch {
        if (!cancelled) {
          setRuntimeEnvironment(defaultRuntimeEnvironment);
        }
      }
    }

    loadRuntimeEnvironment();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadSession() {
      try {
        const response = await fetch(`${apiBase}/api/v1/auth/session`, { credentials: "include" });
        if (!response.ok) {
          setSessionStatus("Authentication required.");
          return;
        }
        const payload = await response.json();
        if (!cancelled) {
          setSession(payload.session);
          setActiveView(canOpenAdminView(payload.session) ? "admin" : "workspace");
          setSessionStatus("Secure session restored.");
        }
      } catch {
        if (!cancelled) {
          setSessionStatus("Authentication service unavailable.");
        }
      }
    }

    loadSession();
    return () => {
      cancelled = true;
    };
  }, []);

  const heading = useMemo(() => {
    if (activeView === "admin") {
      return {
        eyebrow: "CONTROL CENTER",
        title: "Role-Based Control Center",
        subtitle: "Users, access, security, privacy, audit, governance, protocol library, integrations, reports, and support are split by named-user responsibility.",
        metric: "31",
        metricLabel: "ACCESS CONTROLS"
      };
    }

    if (activeView === "help") {
      return {
        eyebrow: "HELP CENTER",
        title: "Help Center",
        subtitle: "Separated operating help and technical library for clinical workflow, data ingestion, integrations, safety controls, and localized routing.",
        metric: "10",
        metricLabel: "HELP AREAS"
      };
    }

    if (activeView === "ccp") {
      return {
        eyebrow: "CCP",
        title: "Continuous Communication Pipeline",
        subtitle:
          "One employee communication thread for tele-triage calls, callbacks, reminders, route handoffs, follow-up goals, and audit.",
        metric: "1",
        metricLabel: "EMPLOYEE THREAD"
      };
    }

    if (activeView === "kanban") {
      return {
        eyebrow: "KANBAN COCKPIT",
        title: "Nurse Queue Board",
        subtitle: "STCC-compatible queue supervision: incoming calls, reason and rule-out, acuity questions, disposition and advice, and SBAR completion.",
        metric: "5",
        metricLabel: "QUEUE LANES"
      };
    }

    return {
      eyebrow: "TRIAGE PAGE",
      title: "IST Health Clinical Decision Support",
      subtitle: "Rules-first clinical triage for Qatar workforce health operations with SBAR drafting.",
      metric: "6",
      metricLabel: "REVIEW GATES"
    };
  }, [activeView]);

  const renderView = () => {
    if (activeView === "admin" && session) {
      return <AdminPortal session={session} />;
    }

    if (activeView === "help") {
      return <HelpCenter />;
    }

    if (activeView === "ccp") {
      return <CcpWorkspace />;
    }

    if (activeView === "kanban") {
      return <KanbanWorkspace />;
    }

    return <TriageWorkspace />;
  };

  const hasAdminAccess = session ? canOpenAdminView(session) : false;
  const activeRoleLabel = session ? formatRole(session.activeRole) : "";
  const viewLabels: Record<ViewKey, string> = {
    workspace: "Triage",
    kanban: "Triage",
    ccp: "CCP",
    help: "Help",
    admin: "Admin"
  };
  const activeViewLabel = viewLabels[activeView];

  function openView(view: ViewKey) {
    const nextHashByView: Record<ViewKey, string> = {
      workspace: "#/workspace",
      kanban: "#/kanban",
      ccp: "#/ccp",
      help: "#/help",
      admin: "#/admin"
    };
    setActiveView(view);
    if (window.location.hash !== nextHashByView[view]) {
      window.location.hash = nextHashByView[view];
    }
  }

  useEffect(() => {
    if (!session) {
      return;
    }

    function syncViewFromHash() {
      const target = window.location.hash.replace(/^#\/?/, "").split("?")[0].toLowerCase();

      if (target === "workspace" || target === "triage") {
        setActiveView("workspace");
        return;
      }

      if (target === "kanban" || target === "board") {
        setActiveView("kanban");
        return;
      }

      if (target === "ccp") {
        setActiveView("ccp");
        return;
      }

      if (["help", "library", "qatar", "integration", "governance", "security"].includes(target)) {
        setActiveView("help");
        return;
      }

      if ((target === "admin" || target === "dashboard") && hasAdminAccess) {
        setActiveView("admin");
      }
    }

    syncViewFromHash();
    window.addEventListener("hashchange", syncViewFromHash);
    return () => window.removeEventListener("hashchange", syncViewFromHash);
  }, [hasAdminAccess, session]);

  async function logout() {
    await fetch(`${apiBase}/api/v1/auth/logout`, { method: "POST", credentials: "include" });
    setSession(null);
    setActiveView("workspace");
    setSessionStatus("Signed out.");
  }

  if (!session) {
    return (
      <div>
        <div className="app-shell">
          <div className="app-frame">
            <div className="login-theme-bar">
              <IconActionButton
                icon={themeMode === "light" ? Moon : Sun}
                label={`Switch to ${themeMode === "light" ? "dark" : "light"} mode`}
                onClick={() => setThemeMode((current) => (current === "light" ? "dark" : "light"))}
                title={themeMode === "light" ? "Dark mode" : "Light mode"}
              />
            </div>
            <EnvironmentBanner runtimeEnvironment={runtimeEnvironment} />
            <LoginPage
              onAuthenticated={(nextSession, redirectTo) => {
                setSession(nextSession);
                setActiveView(redirectTo);
                window.location.hash = redirectTo === "admin" ? "#/admin" : "#/workspace";
                setSessionStatus("Signed in.");
              }}
            />
            <footer className="app-footer login-footer">
              <ShieldCheck className="h-4 w-4" />
              {sessionStatus}
            </footer>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="app-shell">
        <div className="app-frame">
          <div className="ist-watermark" aria-hidden="true">
            IST
          </div>
          <EnvironmentBanner runtimeEnvironment={runtimeEnvironment} />
          <header className="topbar" aria-label="Application navigation">
            <button
              type="button"
              className="brand-lockup"
              onClick={() => openView("workspace")}
              aria-label="Open triage page"
            >
              <IstLogoMark />
              <span>
                <strong>IST Health | {activeViewLabel}</strong>
                <small>{session.user.fullName} | {activeRoleLabel}</small>
              </span>
            </button>

            <div className="topbar-actions" aria-label="Header actions">
              <WorkspaceModeSwitch
                value={activeView === "workspace" || activeView === "kanban" ? activeView : null}
                onChange={openView}
              />
              {hasAdminAccess && (
                <LabeledIconButton
                  icon={Settings}
                  label="Control"
                  active={activeView === "admin"}
                  onClick={() => openView("admin")}
                  title="Control Center"
                />
              )}
              <LabeledIconButton
                icon={MessageSquare}
                label="CCP"
                active={activeView === "ccp"}
                onClick={() => openView("ccp")}
                title="CCP"
              />
              <LabeledIconButton
                icon={HelpCircle}
                label="Help"
                aria-label="Open help and library"
                active={activeView === "help"}
                onClick={() => openView("help")}
                title="Help"
              />
              <LabeledIconButton
                icon={themeMode === "light" ? Moon : Sun}
                label={themeMode === "light" ? "Dark" : "Light"}
                onClick={() => setThemeMode((current) => (current === "light" ? "dark" : "light"))}
                title={themeMode === "light" ? "Dark mode" : "Light mode"}
              />
              <LabeledIconButton
                icon={LogOut}
                label="Sign out"
                onClick={logout}
                title="Sign out"
              />
            </div>
          </header>

          {activeView !== "workspace" && activeView !== "kanban" && (
            <>
              <section className="page-summary">
                <div className="min-w-0">
                  <span className="tag-label">{heading.eyebrow}</span>
                  <h1>{heading.title}</h1>
                  <p>{heading.subtitle}</p>
                </div>
                <div className="summary-metric" aria-label={heading.metricLabel}>
                  <strong>{heading.metric}</strong>
                  <span>{heading.metricLabel}</span>
                </div>
              </section>

              <section className="rule-callout">
                <div>
                  <strong>Core operating rule</strong>
                  <p>
                    IST Health does not autonomously approve a clinical disposition. It drafts, challenges,
                    evidence-packs, and tracks the worksheet so clinicians can validate faster with traceability.
                  </p>
                </div>
                <span>NEEDS REVIEW</span>
              </section>
            </>
          )}

          <QueueProvider>
            <main className="workspace-body">{renderView()}</main>
          </QueueProvider>

          <footer className="app-footer">
            <ShieldCheck className="h-4 w-4" />
            Rules-first safety floor. AI assists, clinicians approve.
          </footer>
        </div>
      </div>
    </div>
  );
}

function EnvironmentBanner({ runtimeEnvironment }: { runtimeEnvironment: RuntimeEnvironment }) {
  if (!runtimeEnvironment.banner.visible) {
    return null;
  }

  return (
    <aside
      className={`environment-banner environment-banner-${runtimeEnvironment.banner.tone}`}
      aria-label={`${runtimeEnvironment.banner.label} environment`}
    >
      <strong>{runtimeEnvironment.banner.label}</strong>
      <span>{runtimeEnvironment.banner.description}</span>
    </aside>
  );
}

function IstLogoMark() {
  return (
    <span className="ist-logo-mark" aria-hidden="true">
      <img className="ist-logo-image" src="/logo-irisstar.svg" alt="" />
    </span>
  );
}
