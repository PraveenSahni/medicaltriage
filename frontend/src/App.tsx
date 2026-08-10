import {
  HelpCircle,
  LayoutGrid,
  LogOut,
  MessageSquare,
  Moon,
  Settings,
  ShieldCheck,
  Sun
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import AdminPortal from "./AdminPortal";
import { clearAccessToken } from "./authToken";
import CcpWorkspace from "./CcpWorkspace";
import HelpCenter from "./HelpCenter";
import KanbanWorkspace from "./KanbanWorkspace";
import { LoginLayout } from "./auth/LoginLayout";
import { LoginCard } from "./auth/LoginCard";
import type { AuthenticatedSession } from "./auth/session";
import { QueueProvider } from "./QueueContext";
import TriageWorkspace from "./TriageWorkspace";
import NurseWorkspaceRedesign from "./components/Triage/NurseWorkspaceRedesign";
import { LabeledIconButton, WorkspaceModeSwitch } from "./components/ui/NavigationControls";
import { CockpitApp } from "./cockpit/CockpitApp";
import { canAccessNurseCockpit, canAccessServiceManagerBoard } from "./cockpit/roles";
import { TriageServiceManagerBoard } from "./serviceManagerBoard/TriageServiceManagerBoard";
import { formatRole } from "./admin/shared/roleLabels";

type ViewKey = "workspace" | "cockpitV2" | "cockpit" | "kanban" | "ccp" | "help" | "admin" | "serviceManagerBoard";
type ThemeMode = "light" | "dark";
type EnvironmentTone = "simulation" | "demo" | "uat" | "production";

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

const controlCenterRoles = new Set(["platform_super_administrator", "triage_service_manager"]);

function canOpenAdminView(session: AuthenticatedSession) {
  return controlCenterRoles.has(session.activeRole);
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
          setActiveView(
            canAccessServiceManagerBoard(payload.session.activeRole)
              ? "serviceManagerBoard"
              : canAccessNurseCockpit(payload.session.activeRole)
                ? "cockpit"
                : canOpenAdminView(payload.session)
                  ? "admin"
                  : "workspace"
          );
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
    if (activeView === "help") {
      return <HelpCenter />;
    }

    if (activeView === "ccp") {
      return <CcpWorkspace />;
    }

    if (activeView === "kanban") {
      return <KanbanWorkspace />;
    }

    if (activeView === "cockpitV2") {
      return <NurseWorkspaceRedesign />;
    }

    return <TriageWorkspace />;
  };

  const hasAdminAccess = session ? canOpenAdminView(session) : false;
  const hasCockpitAccess = session ? canAccessNurseCockpit(session.activeRole) : false;
  const hasServiceManagerBoardAccess = session ? canAccessServiceManagerBoard(session.activeRole) : false;
  const activeRoleLabel = session ? formatRole(session.activeRole) : "";
  const viewLabels: Record<ViewKey, string> = {
    workspace: "Triage",
    cockpitV2: "Triage (Redesign)",
    cockpit: "Nurse Cockpit",
    kanban: "Triage",
    ccp: "CCP",
    help: "Help",
    admin: "Admin",
    serviceManagerBoard: "Service Manager Board"
  };
  const activeViewLabel = viewLabels[activeView];

  function openView(view: ViewKey) {
    const nextHashByView: Record<ViewKey, string> = {
      workspace: "#/workspace",
      cockpitV2: "#/cockpit-v2",
      cockpit: "#/cockpit",
      kanban: "#/kanban",
      ccp: "#/ccp",
      help: "#/help",
      admin: "#/admin",
      serviceManagerBoard: "#/service-manager-board"
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

      if (target === "cockpit-v2" || target === "cockpitv2") {
        setActiveView("cockpitV2");
        return;
      }

      if (target === "cockpit" || target === "nurse-cockpit") {
        setActiveView("cockpit");
        return;
      }

      if (target === "service-manager-board" || target === "servicemanagerboard") {
        setActiveView("serviceManagerBoard");
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

      // "admin/users", "admin/roles", etc. (TanStack Router's own sub-routes,
      // mounted only inside the Admin subtree) must still resolve to the
      // "admin" view here - this listener only cares about the first path
      // segment and leaves everything after it to the router mounted inside.
      if ((target === "admin" || target === "dashboard" || target.startsWith("admin/")) && hasAdminAccess) {
        setActiveView("admin");
      }
    }

    syncViewFromHash();
    window.addEventListener("hashchange", syncViewFromHash);
    return () => window.removeEventListener("hashchange", syncViewFromHash);
  }, [hasAdminAccess, session]);

  async function logout() {
    await fetch(`${apiBase}/api/v1/auth/logout`, { method: "POST", credentials: "include" });
    clearAccessToken();
    setSession(null);
    setActiveView("workspace");
    setSessionStatus("Signed out.");
  }

  if (!session) {
    return (
      <LoginLayout>
        <LoginCard
          onAuthenticated={(nextSession, redirectTo) => {
            setSession(nextSession);
            const nextView: ViewKey = canAccessServiceManagerBoard(nextSession.activeRole)
              ? "serviceManagerBoard"
              : canAccessNurseCockpit(nextSession.activeRole)
                ? "cockpit"
                : redirectTo;
            setActiveView(nextView);
            window.location.hash =
              nextView === "serviceManagerBoard"
                ? "#/service-manager-board"
                : nextView === "cockpit"
                  ? "#/cockpit"
                  : nextView === "admin"
                    ? "#/admin"
                    : "#/workspace";
            setSessionStatus("Signed in.");
          }}
        />
      </LoginLayout>
    );
  }

  // The Nurse Cockpit route bypasses the old application shell entirely - no
  // topbar, no environment banner, no workspace-body wrapper. It is rendered
  // directly here, above the old-shell return below, per the approved design
  // reference (docs/protocol-review/nurse-cockpit-open-calls-preview.html).
  if (activeView === "cockpit") {
    if (!canAccessNurseCockpit(session.activeRole)) {
      return (
        <div className="minimal-boundary">
          <AccessDenied onLogout={logout} />
        </div>
      );
    }
    return (
      <QueueProvider>
        <CockpitApp
          session={session}
          onLogout={logout}
          onBack={
            canAccessServiceManagerBoard(session.activeRole) ? () => openView("serviceManagerBoard") : undefined
          }
        />
      </QueueProvider>
    );
  }

  // The Triage Service Manager Board is a second, distinct route that also
  // bypasses the old application shell entirely, mirroring the Nurse
  // Cockpit's own bypass above. Read-only: it reuses the same QueueProvider
  // (existing polling, no separate queue integration) but never touches any
  // of its mutation methods.
  if (activeView === "serviceManagerBoard") {
    if (!canAccessServiceManagerBoard(session.activeRole)) {
      return (
        <div className="minimal-boundary">
          <AccessDenied onLogout={logout} workspaceLabel="Triage Service Manager Board" />
        </div>
      );
    }
    return (
      <QueueProvider>
        <TriageServiceManagerBoard
          session={session}
          onLogout={logout}
          onOpenNurseCockpit={hasCockpitAccess ? () => openView("cockpit") : undefined}
        />
      </QueueProvider>
    );
  }

  // The Control Center (Admin) is a third, distinct route that also bypasses
  // the old application shell entirely, mirroring the Nurse Cockpit and
  // Triage Service Manager Board bypasses above - a genuinely separate page,
  // not one tab among many inside the generic workspace shell.
  if (activeView === "admin") {
    if (!canOpenAdminView(session)) {
      return (
        <div className="minimal-boundary">
          <AccessDenied onLogout={logout} workspaceLabel="Control Center" />
        </div>
      );
    }
    return <AdminPortal session={session} onLogout={logout} />;
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
              {hasCockpitAccess && (
                <LabeledIconButton
                  icon={ShieldCheck}
                  label="Cockpit"
                  active={false}
                  onClick={() => openView("cockpit")}
                  title="Nurse Cockpit"
                />
              )}
              {hasServiceManagerBoardAccess && (
                <LabeledIconButton
                  icon={LayoutGrid}
                  label="Manager"
                  active={false}
                  onClick={() => openView("serviceManagerBoard")}
                  title="Triage Service Manager Board"
                />
              )}
              <WorkspaceModeSwitch
                value={activeView === "workspace" || activeView === "kanban" ? activeView : null}
                onChange={openView}
              />
              {hasAdminAccess && (
                <LabeledIconButton
                  icon={Settings}
                  label="Control"
                  active={false}
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

function AccessDenied({ onLogout, workspaceLabel = "Nurse Cockpit" }: { onLogout: () => void; workspaceLabel?: string }) {
  return (
    <div className="access-denied" role="alert">
      <h1>Access Denied</h1>
      <p>Your account role is not authorized to open the {workspaceLabel}.</p>
      <button type="button" className="primary-button" onClick={onLogout}>
        Sign out
      </button>
    </div>
  );
}

function IstLogoMark() {
  return (
    <span className="ist-logo-mark" aria-hidden="true">
      <img className="ist-logo-image" src="/logo-irisstar.svg" alt="" />
    </span>
  );
}
