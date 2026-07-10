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
import LoginPage from "./LoginPage";
import TriageWorkspace from "./TriageWorkspace";

type ViewKey = "workspace" | "ccp" | "help" | "admin";
type ThemeMode = "light" | "dark";

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

const apiBase = import.meta.env.VITE_API_BASE_URL || "";

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
        eyebrow: "INTERCONNECTED HELP",
        title: "Help & Library",
        subtitle: "Connected operating guide for clinical workflow, content library, integrations, safety controls, and localized routing.",
        metric: "9",
        metricLabel: "CONNECTED AREAS"
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

    return <TriageWorkspace />;
  };

  const hasAdminAccess = session ? canOpenAdminView(session.permissions) : false;
  const activeRoleLabel = session ? formatRole(session.activeRole) : "";

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
            <LoginPage
              onAuthenticated={(nextSession, redirectTo) => {
                setSession(nextSession);
                setActiveView(redirectTo);
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
          <header className="topbar" aria-label="Application navigation">
            <button
              type="button"
              className="brand-lockup"
              onClick={() => setActiveView("workspace")}
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
              {hasAdminAccess && (
                <button
                  type="button"
                  className={`header-icon-button ${activeView === "admin" ? "header-icon-button-active" : ""}`}
                  onClick={() => setActiveView("admin")}
                  aria-label="Open administration"
                  title="Administration"
                >
                  <Settings className="h-4 w-4" />
                </button>
              )}
              <button
                type="button"
                className={`header-icon-button ${activeView === "ccp" ? "header-icon-button-active" : ""}`}
                onClick={() => setActiveView("ccp")}
                aria-label="Open CCP"
                title="CCP"
              >
                <MessageSquare className="h-4 w-4" />
              </button>
              <button
                type="button"
                className={`header-icon-button ${activeView === "help" ? "header-icon-button-active" : ""}`}
                onClick={() => setActiveView("help")}
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

          <main className="workspace-body">{renderView()}</main>

          <footer className="app-footer">
            <ShieldCheck className="h-4 w-4" />
            Rules-first safety floor. AI assists, clinicians approve.
          </footer>
        </div>
      </div>
    </div>
  );
}

function IstLogoMark() {
  return (
    <span className="ist-logo-mark" aria-hidden="true">
      <img className="ist-logo-image" src="/ist-logo.png" alt="" />
    </span>
  );
}
