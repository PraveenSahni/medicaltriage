import {
  ClipboardCheck,
  HelpCircle,
  Kanban,
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

function canOpenAdminView(permissions: string[]) {
  return permissions.some((permission) =>
    ["admin.users.manage", "security.sso.manage", "audit.events.view"].includes(permission)
  );
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
          setActiveView(canOpenAdminView(payload.session.permissions) ? "admin" : "workspace");
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
        eyebrow: "ADMINISTRATION",
        title: "Security, Privacy, and Access Control",
        subtitle: "Login, SSO, users, roles, responsibilities, masking, reveal control, encryption policy, and audit monitoring.",
        metric: "31",
        metricLabel: "SECURITY CONTROLS"
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
        subtitle: "Board-level queue supervision with clinical safety floors visible across every stage.",
        metric: "5",
        metricLabel: "QUEUE STAGES"
      };
    }

    return {
      eyebrow: "TRIAGE PAGE",
      title: "IST Tech Clinical Decision Support",
      subtitle: "Rules-first clinical triage with aviation medicine context and SBAR drafting.",
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

  const hasAdminAccess = session ? canOpenAdminView(session.permissions) : false;
  const activeRoleLabel = session ? formatRole(session.activeRole) : "";

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
      <div className={themeMode === "dark" ? "dark" : ""}>
        <div className="app-shell">
          <div className="app-frame">
            <div className="login-theme-bar">
              <button
                type="button"
                className="header-icon-button"
                onClick={() => setThemeMode((current) => (current === "light" ? "dark" : "light"))}
                aria-label={`Switch to ${themeMode === "light" ? "dark" : "light"} mode`}
                title={themeMode === "light" ? "Dark mode" : "Light mode"}
              >
                {themeMode === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              </button>
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
    <div className={themeMode === "dark" ? "dark" : ""}>
      <div className="app-shell">
        <div className="app-frame">
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
                <strong>IST Tech</strong>
                <small>{session.user.fullName} | {activeRoleLabel}</small>
              </span>
            </button>

            <div className="topbar-actions" aria-label="Header actions">
              <div className="topbar-context" aria-label="Authenticated role">
                <span className="context-label">ROLE</span>
                <span className="role-chip" title={activeRoleLabel}>
                  {activeRoleLabel}
                </span>
              </div>
              <div className="topbar-view-switch" aria-label="Triage view preference">
                <button
                  type="button"
                  className={`nav-pill ${activeView === "workspace" ? "nav-pill-active" : ""}`}
                  onClick={() => openView("workspace")}
                  aria-label="Open step cockpit"
                  title="Step cockpit"
                >
                  <ClipboardCheck className="h-4 w-4" />
                  Step
                </button>
                <button
                  type="button"
                  className={`nav-pill ${activeView === "kanban" ? "nav-pill-active" : ""}`}
                  onClick={() => openView("kanban")}
                  aria-label="Open Kanban board"
                  title="Kanban board"
                >
                  <Kanban className="h-4 w-4" />
                  Board
                </button>
              </div>
              {hasAdminAccess && (
                <button
                  type="button"
                  className={`header-icon-button ${activeView === "admin" ? "header-icon-button-active" : ""}`}
                  onClick={() => openView("admin")}
                  aria-label="Open administration"
                  title="Administration"
                >
                  <Settings className="h-4 w-4" />
                </button>
              )}
              <button
                type="button"
                className={`header-icon-button ${activeView === "ccp" ? "header-icon-button-active" : ""}`}
                onClick={() => openView("ccp")}
                aria-label="Open CCP"
                title="CCP"
              >
                <MessageSquare className="h-4 w-4" />
              </button>
              <button
                type="button"
                className={`header-icon-button ${activeView === "help" ? "header-icon-button-active" : ""}`}
                onClick={() => openView("help")}
                aria-label="Open help and library"
                title="Help"
              >
                <HelpCircle className="h-4 w-4" />
              </button>
              <button
                type="button"
                className="header-icon-button"
                onClick={() => setThemeMode((current) => (current === "light" ? "dark" : "light"))}
                aria-label={`Switch to ${themeMode === "light" ? "dark" : "light"} mode`}
                title={themeMode === "light" ? "Dark mode" : "Light mode"}
              >
                {themeMode === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              </button>
              <button
                type="button"
                className="header-icon-button"
                onClick={logout}
                aria-label="Sign out"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
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
                    IST Tech does not autonomously approve a clinical disposition. It drafts, challenges,
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
      <img className="ist-logo-image" src="/ist-logo.png" alt="" />
    </span>
  );
}
