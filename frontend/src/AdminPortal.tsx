import {
  Activity,
  BarChart3,
  DatabaseZap,
  FileKey2,
  Fingerprint,
  KeyRound,
  LockKeyhole,
  Network,
  ShieldCheck,
  UserCog,
  Users
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type {
  AdminUser,
  ControlCenterModule,
  Dashboard,
  EncryptionPolicy,
  SsoProvider,
  AuditEvent,
  GovernanceWorkItem,
  ProtocolLibraryItem,
  IntegrationConnector,
  ReportCatalogItem,
  SupportQueueItem
} from "./admin/panels/ReadOnlyPanels";
import { AdminRouterView } from "./admin/AdminRouter";
import { AdminDataProvider } from "./admin/AdminDataContext";
import { AdminPortalProvider } from "./admin/components/AdminPortalProvider";
import "./admin/administration.css";

export type Session = {
  user: {
    id: string;
    fullName: string;
    department: string;
    facility: string;
    roles: string[];
  };
  permissions: string[];
  activeRole: string;
  expiresAtIso: string;
};

export type AdminData = {
  modules: ControlCenterModule[];
  dashboard?: Dashboard;
  revealUsers: AdminUser[];
  providers: SsoProvider[];
  policies: EncryptionPolicy[];
  events: AuditEvent[];
  governanceItems: GovernanceWorkItem[];
  protocols: ProtocolLibraryItem[];
  connectors: IntegrationConnector[];
  reports: ReportCatalogItem[];
  tickets: SupportQueueItem[];
};

const emptyData: AdminData = {
  modules: [],
  revealUsers: [],
  providers: [],
  policies: [],
  events: [],
  governanceItems: [],
  protocols: [],
  connectors: [],
  reports: [],
  tickets: []
};

const apiBase = import.meta.env.VITE_API_BASE_URL || "";

export default function AdminPortal({ session, onLogout }: { session: Session; onLogout: () => void }) {
  const [data, setData] = useState<AdminData>(emptyData);
  const [status, setStatus] = useState("Loading Control Center data.");
  const [revealResult, setRevealResult] = useState("");

  const hasPermission = (permission: string) => session.permissions.includes(permission);
  const hasAnyPermission = (permissions: string[]) => permissions.some((permission) => hasPermission(permission));

  const tabs = useMemo(
    () =>
      [
        { key: "overview", label: "Overview", icon: Activity, path: "/", enabled: true },
        { key: "users", label: "Users", icon: Users, path: "/users", enabled: hasPermission("admin.users.manage") },
        { key: "roles", label: "Roles", icon: ShieldCheck, path: "/roles", enabled: hasPermission("admin.roles.manage") },
        {
          key: "responsibilities",
          label: "Responsibilities",
          icon: KeyRound,
          path: "/responsibilities",
          enabled: hasPermission("admin.roles.manage")
        },
        {
          key: "accessControl",
          label: "Access Control",
          icon: LockKeyhole,
          path: "/access-control",
          enabled: hasAnyPermission(["audit.events.view", "privacy.reveal.request", "privacy.reveal.approve", "admin.roles.manage"])
        },
        {
          key: "security",
          label: "Security",
          icon: Fingerprint,
          path: "/security",
          enabled: hasAnyPermission(["security.sso.manage", "crypto.policy.manage"])
        },
        {
          key: "privacy",
          label: "Privacy",
          icon: LockKeyhole,
          path: "/privacy",
          enabled: hasAnyPermission(["privacy.assessment.manage", "crypto.policy.manage"])
        },
        { key: "audit", label: "Audit", icon: DatabaseZap, path: "/audit", enabled: hasPermission("audit.events.view") },
        {
          key: "governance",
          label: "Governance",
          icon: ShieldCheck,
          path: "/governance",
          enabled: hasAnyPermission(["clinical.governance.approve", "audit.events.view"])
        },
        {
          key: "protocols",
          label: "Protocol Library",
          icon: FileKey2,
          path: "/protocols",
          enabled: hasAnyPermission(["protocol.library.manage", "clinical.governance.approve"])
        },
        {
          key: "integration",
          label: "Integration",
          icon: Network,
          path: "/integration",
          enabled: hasAnyPermission(["integration.hrms.manage", "integration.emr.manage", "security.sso.manage"])
        },
        {
          key: "reports",
          label: "Reports",
          icon: BarChart3,
          path: "/reports",
          enabled: hasAnyPermission(["reports.view", "operations.dashboard.view"])
        },
        {
          key: "support",
          label: "Support",
          icon: UserCog,
          path: "/support",
          enabled: hasAnyPermission(["support.tickets.manage", "admin.users.manage"])
        }
      ].filter((tab) => tab.enabled),
    [session.permissions]
  );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setStatus("Loading Control Center data.");
      try {
        const canViewAudit = hasPermission("audit.events.view");
        const canManageUsers = hasPermission("admin.users.manage");
        const canManageSso = hasPermission("security.sso.manage");
        const canManageCrypto = hasPermission("crypto.policy.manage");
        const canManagePrivacy = hasPermission("privacy.assessment.manage");
        const canManageGovernance = hasAnyPermission(["clinical.governance.approve", "protocol.library.manage", "audit.events.view"]);
        const canManageProtocols = hasAnyPermission(["protocol.library.manage", "clinical.governance.approve"]);
        const canManageIntegrations = hasAnyPermission(["integration.hrms.manage", "integration.emr.manage", "security.sso.manage"]);
        const canViewReports = hasAnyPermission(["reports.view", "operations.dashboard.view"]);
        const canViewSupport = hasAnyPermission(["support.tickets.manage", "admin.users.manage"]);

        const [modules, summary, revealUsers, providers, policies, events, governance, protocols, integrations, reports, support] =
          await Promise.all([
            fetchJson<{ modules: ControlCenterModule[] }>("/api/v1/admin/control-modules"),
            canViewAudit ? fetchJson<{ dashboard?: Dashboard }>("/api/v1/admin/summary") : Promise.resolve({ dashboard: undefined }),
            canManagePrivacy || canManageUsers ? fetchJson<{ users: AdminUser[] }>("/api/v1/admin/reveal-directory") : Promise.resolve({ users: [] }),
            canManageSso ? fetchJson<{ providers: SsoProvider[] }>("/api/v1/admin/sso-providers") : Promise.resolve({ providers: [] }),
            canManageCrypto ? fetchJson<{ policies: EncryptionPolicy[] }>("/api/v1/admin/encryption-policies") : Promise.resolve({ policies: [] }),
            canViewAudit ? fetchJson<{ events: AuditEvent[] }>("/api/v1/admin/audit-events") : Promise.resolve({ events: [] }),
            canManageGovernance ? fetchJson<{ items: GovernanceWorkItem[] }>("/api/v1/admin/governance") : Promise.resolve({ items: [] }),
            canManageProtocols ? fetchJson<{ protocols: ProtocolLibraryItem[] }>("/api/v1/admin/protocol-library") : Promise.resolve({ protocols: [] }),
            canManageIntegrations ? fetchJson<{ connectors: IntegrationConnector[] }>("/api/v1/admin/integrations") : Promise.resolve({ connectors: [] }),
            canViewReports ? fetchJson<{ reports: ReportCatalogItem[] }>("/api/v1/admin/reports") : Promise.resolve({ reports: [] }),
            canViewSupport ? fetchJson<{ tickets: SupportQueueItem[] }>("/api/v1/admin/support") : Promise.resolve({ tickets: [] })
          ]);

        if (!cancelled) {
          setData({
            modules: modules.modules,
            dashboard: summary.dashboard,
            revealUsers: revealUsers.users,
            providers: providers.providers,
            policies: policies.policies,
            events: events.events,
            governanceItems: governance.items,
            protocols: protocols.protocols,
            connectors: integrations.connectors,
            reports: reports.reports,
            tickets: support.tickets
          });
          setStatus("Available Control Center modules loaded for the active role.");
        }
      } catch {
        if (!cancelled) {
          setStatus("Unable to load one or more Control Center modules. Check role permissions and API status.");
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [session.permissions]);

  async function requestReveal(userId: string, field: string) {
    setRevealResult("");
    try {
      const response = await fetch(`${apiBase}/api/v1/admin/reveal`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: session.user.id,
          resourceType: "ApplicationUser",
          resourceId: userId,
          field,
          purpose: "Authorized privacy or support investigation"
        })
      });
      const payload = await response.json();
      if (!response.ok) {
        setRevealResult("Reveal denied. Approval or privacy permission is required.");
        return;
      }
      setRevealResult(`${field}: ${payload.value} (auto-remask in ${payload.remaskAfterSeconds}s)`);
    } catch {
      setRevealResult("Reveal service unavailable.");
    }
  }

  return (
    <section id="admin-root" className="admin-shell" aria-label="Role-based Control Center">
      <AdminPortalProvider>
        <AdminDataProvider value={{ data, session, status, revealResult, requestReveal }}>
          <AdminRouterView tabs={tabs} onLogout={onLogout} />
        </AdminDataProvider>
      </AdminPortalProvider>
    </section>
  );
}

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${apiBase}${path}`, { credentials: "include" });
  if (!response.ok) {
    throw new Error(`Request failed ${response.status}`);
  }
  return response.json() as Promise<T>;
}
