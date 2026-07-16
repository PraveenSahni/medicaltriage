import {
  Activity,
  BarChart3,
  DatabaseZap,
  Eye,
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

type AdminTab =
  | "overview"
  | "users"
  | "access"
  | "security"
  | "privacy"
  | "audit"
  | "governance"
  | "protocols"
  | "integration"
  | "reports"
  | "support";

type Session = {
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

type Dashboard = Record<string, number>;
type AdminUser = {
  id: string;
  employeeId: string;
  fullName: string;
  email: string;
  mobile: string;
  facility: string;
  department: string;
  clinicalSpecialty: string;
  jobTitle: string;
  mfaStatus: string;
  accountStatus: string;
  roles: string[];
  responsibilities: string[];
  queues: string[];
  lastLoginIso?: string;
};
type Role = {
  code: string;
  name: string;
  description: string;
  permissions: string[];
  responsibilities: string[];
  clinicalScopes: string[];
  dataScopes: string[];
  integrationScopes: string[];
  status: string;
};
type Responsibility = {
  code: string;
  name: string;
  module: string;
  businessFunction: string;
  risk: string;
  classification: string;
  allowedActions: string[];
  prerequisiteResponsibilities: string[];
  conflictingResponsibilities: string[];
  approvalRequired: boolean;
  status: string;
};
type Permission = {
  code: string;
  module: string;
  action: string;
  description: string;
  risk: string;
};
type SsoProvider = {
  id: string;
  name: string;
  protocol: string;
  enabled: boolean;
  issuerUrl: string;
  redirectUri: string;
  allowedDomains: string[];
  groupRoleMappings: Record<string, string>;
  secretStorage: string;
};
type EncryptionPolicy = {
  id: string;
  name: string;
  version: string;
  dataClassification: string;
  coveredEntities: string[];
  coveredFields: string[];
  algorithm: string;
  keyProvider: string;
  keyAlias: string;
  rotationDays: number;
  maskingPolicy: string;
  revealPolicy: string;
  dataResidency: string;
  status: string;
};
type AuditEvent = {
  id: string;
  timestampIso: string;
  userId: string;
  activeRole: string;
  action: string;
  module: string;
  resource: string;
  purpose?: string;
  success: boolean;
  risk: string;
};
type ControlCenterModule = {
  id: string;
  label: string;
  purpose: string;
  primaryRoles: string[];
  requiredPermissions: string[];
  dataBoundary: string;
  prohibitedActions: string[];
};
type IntegrationConnector = {
  id: string;
  name: string;
  system: string;
  status: string;
  ownerRole: string;
  dataHandled: string[];
  apiSurface: string;
  lastCheckedIso: string;
};
type GovernanceWorkItem = {
  id: string;
  title: string;
  ownerRole: string;
  status: string;
  control: string;
  evidence: string;
};
type ProtocolLibraryItem = {
  id: string;
  title: string;
  category: string;
  status: string;
  ownerRole: string;
  release: string;
  safetyNotes: string;
};
type ReportCatalogItem = {
  id: string;
  title: string;
  audience: string;
  dataClass: string;
  exportAllowed: boolean;
  requiredPermission: string;
};
type SupportQueueItem = {
  id: string;
  title: string;
  requesterRole: string;
  status: string;
  dataBoundary: string;
};

type AdminData = {
  modules: ControlCenterModule[];
  dashboard?: Dashboard;
  users: AdminUser[];
  revealUsers: AdminUser[];
  roles: Role[];
  responsibilities: Responsibility[];
  permissions: Permission[];
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
  users: [],
  revealUsers: [],
  roles: [],
  responsibilities: [],
  permissions: [],
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

function formatRole(role: string) {
  return (
    roleLabels[role] ??
    role
      .replace(/_/g, " ")
      .replace(/\b\w/g, (character) => character.toUpperCase())
  );
}

export default function AdminPortal({ session }: { session: Session }) {
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [data, setData] = useState<AdminData>(emptyData);
  const [status, setStatus] = useState("Loading Control Center data.");
  const [revealResult, setRevealResult] = useState("");

  const hasPermission = (permission: string) => session.permissions.includes(permission);
  const hasAnyPermission = (permissions: string[]) => permissions.some((permission) => hasPermission(permission));

  const tabs = useMemo(
    () =>
      [
        { key: "overview" as const, label: "Overview", icon: Activity, enabled: true },
        { key: "users" as const, label: "Users", icon: Users, enabled: hasPermission("admin.users.manage") },
        { key: "access" as const, label: "Access", icon: ShieldCheck, enabled: hasPermission("admin.roles.manage") },
        { key: "security" as const, label: "Security", icon: Fingerprint, enabled: hasAnyPermission(["security.sso.manage", "crypto.policy.manage"]) },
        { key: "privacy" as const, label: "Privacy", icon: LockKeyhole, enabled: hasAnyPermission(["privacy.assessment.manage", "crypto.policy.manage"]) },
        { key: "audit" as const, label: "Audit", icon: DatabaseZap, enabled: hasPermission("audit.events.view") },
        { key: "governance" as const, label: "Governance", icon: ShieldCheck, enabled: hasAnyPermission(["clinical.governance.approve", "audit.events.view"]) },
        { key: "protocols" as const, label: "Protocol Library", icon: FileKey2, enabled: hasAnyPermission(["protocol.library.manage", "clinical.governance.approve"]) },
        { key: "integration" as const, label: "Integration", icon: Network, enabled: hasAnyPermission(["integration.hrms.manage", "integration.emr.manage", "security.sso.manage"]) },
        { key: "reports" as const, label: "Reports", icon: BarChart3, enabled: hasAnyPermission(["reports.view", "operations.dashboard.view"]) },
        { key: "support" as const, label: "Support", icon: UserCog, enabled: hasAnyPermission(["support.tickets.manage", "admin.users.manage"]) }
      ].filter((tab) => tab.enabled),
    [session.permissions]
  );

  useEffect(() => {
    if (!tabs.some((tab) => tab.key === activeTab)) {
      setActiveTab(tabs[0]?.key ?? "overview");
    }
  }, [activeTab, tabs]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setStatus("Loading Control Center data.");
      try {
        const canViewAudit = hasPermission("audit.events.view");
        const canManageUsers = hasPermission("admin.users.manage");
        const canManageRoles = hasPermission("admin.roles.manage");
        const canManageSso = hasPermission("security.sso.manage");
        const canManageCrypto = hasPermission("crypto.policy.manage");
        const canManagePrivacy = hasPermission("privacy.assessment.manage");
        const canManageGovernance = hasAnyPermission(["clinical.governance.approve", "protocol.library.manage", "audit.events.view"]);
        const canManageProtocols = hasAnyPermission(["protocol.library.manage", "clinical.governance.approve"]);
        const canManageIntegrations = hasAnyPermission(["integration.hrms.manage", "integration.emr.manage", "security.sso.manage"]);
        const canViewReports = hasAnyPermission(["reports.view", "operations.dashboard.view"]);
        const canViewSupport = hasAnyPermission(["support.tickets.manage", "admin.users.manage"]);

        const [
          modules,
          summary,
          users,
          revealUsers,
          roles,
          responsibilities,
          permissions,
          providers,
          policies,
          events,
          governance,
          protocols,
          integrations,
          reports,
          support
        ] = await Promise.all([
          fetchJson<{ modules: ControlCenterModule[] }>("/api/v1/admin/control-modules"),
          canViewAudit ? fetchJson<{ dashboard?: Dashboard }>("/api/v1/admin/summary") : Promise.resolve({ dashboard: undefined }),
          canManageUsers ? fetchJson<{ users: AdminUser[] }>("/api/v1/admin/users") : Promise.resolve({ users: [] }),
          canManagePrivacy || canManageUsers ? fetchJson<{ users: AdminUser[] }>("/api/v1/admin/reveal-directory") : Promise.resolve({ users: [] }),
          canManageRoles ? fetchJson<{ roles: Role[] }>("/api/v1/admin/roles") : Promise.resolve({ roles: [] }),
          canManageRoles ? fetchJson<{ responsibilities: Responsibility[] }>("/api/v1/admin/responsibilities") : Promise.resolve({ responsibilities: [] }),
          canManageRoles ? fetchJson<{ permissions: Permission[] }>("/api/v1/admin/permissions") : Promise.resolve({ permissions: [] }),
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
            users: users.users,
            revealUsers: revealUsers.users,
            roles: roles.roles,
            responsibilities: responsibilities.responsibilities,
            permissions: permissions.permissions,
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
    <section className="admin-shell" aria-label="Role-based Control Center">
      <div className="admin-hero">
        <div>
          <span className="tag-label">CONTROL CENTER</span>
          <h2>Named User Access and Enterprise Controls</h2>
          <p>
            Each role sees only its permitted module: Users, Access, Security, Privacy, Audit,
            Governance, Protocol Library, Integration, Reports, and Support.
          </p>
        </div>
        <div className="admin-session-card">
          <strong>{session.user.fullName}</strong>
          <span>{formatRole(session.activeRole)}</span>
          <small>Session expires {new Date(session.expiresAtIso).toLocaleString()}</small>
        </div>
      </div>

      <div className="help-tabbar admin-tabbar" role="tablist" aria-label="Control Center sections">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={active}
              className={`help-tab ${active ? "help-tab-active" : ""}`}
              onClick={() => setActiveTab(tab.key)}
            >
              <Icon className="h-5 w-5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div className="status-pill border border-emerald-200 bg-emerald-50 text-emerald-700">
        {status}
      </div>

      {activeTab === "overview" && <OverviewPanel modules={data.modules} dashboard={data.dashboard} />}
      {activeTab === "users" && (
        <UsersPanel users={data.users} revealResult={revealResult} onReveal={requestReveal} />
      )}
      {activeTab === "access" && (
        <AccessPanel roles={data.roles} responsibilities={data.responsibilities} permissions={data.permissions} />
      )}
      {activeTab === "security" && <SecurityPanel providers={data.providers} policies={data.policies} />}
      {activeTab === "privacy" && (
        <PrivacyPanel
          policies={data.policies}
          users={data.revealUsers}
          revealResult={revealResult}
          onReveal={requestReveal}
        />
      )}
      {activeTab === "audit" && <AuditPanel events={data.events} />}
      {activeTab === "governance" && <GovernancePanel items={data.governanceItems} />}
      {activeTab === "protocols" && <ProtocolLibraryPanel protocols={data.protocols} />}
      {activeTab === "integration" && <IntegrationPanel connectors={data.connectors} />}
      {activeTab === "reports" && <ReportsPanel reports={data.reports} />}
      {activeTab === "support" && <SupportPanel tickets={data.tickets} />}
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

function OverviewPanel({ modules, dashboard }: { modules: ControlCenterModule[]; dashboard?: Dashboard }) {
  return (
    <section className="admin-stack">
      <div className="help-grid">
        {modules.map((module) => (
          <article key={module.id} className="help-card">
            <span className="tag-label">{module.label}</span>
            <h3 className="help-title">{module.purpose}</h3>
            <p>{module.dataBoundary}</p>
            <div className="admin-chip-row">
              {module.primaryRoles.map((role) => (
                <span key={`${module.id}-${role}`} className="status-pill border border-amber-200 bg-amber-50 text-amber-700">
                  {role}
                </span>
              ))}
            </div>
          </article>
        ))}
      </div>
      <DashboardPanel dashboard={dashboard} compact />
    </section>
  );
}

function DashboardPanel({ dashboard, compact = false }: { dashboard?: Dashboard; compact?: boolean }) {
  const items = dashboard
    ? [
        ["Active users", dashboard.activeUsers],
        ["Locked", dashboard.lockedUsers],
        ["Access approvals", dashboard.pendingAccessApprovals],
        ["Role approvals", dashboard.pendingRoleApprovals],
        ["Recent reveals", dashboard.recentReveals],
        ["Exports", dashboard.identifiableExports],
        ["Privacy requests", dashboard.openPrivacyRequests],
        ["Security incidents", dashboard.openSecurityIncidents]
      ]
    : [];

  if (!items.length) {
    return null;
  }

  return (
    <section className={`admin-metric-grid ${compact ? "admin-metric-grid-compact" : ""}`}>
      {items.map(([label, value]) => (
        <div key={label} className="admin-metric">
          <strong>{value}</strong>
          <span>{label}</span>
        </div>
      ))}
    </section>
  );
}

function UsersPanel({
  users,
  revealResult,
  onReveal
}: {
  users: AdminUser[];
  revealResult: string;
  onReveal: (userId: string, field: string) => void;
}) {
  return (
    <section className="admin-stack">
      {revealResult && <div className="login-alert">{revealResult}</div>}
      <div className="admin-table">
        <div className="admin-table-row admin-table-head">
          <span>User</span>
          <span>Scope</span>
          <span>Access</span>
          <span>Controls</span>
        </div>
        {users.map((user) => (
          <div key={user.id} className="admin-table-row">
            <span>
              <strong>{user.fullName}</strong>
              <small>{user.email} | {user.mobile}</small>
            </span>
            <span>
              <strong>{user.facility}</strong>
              <small>{user.department} | {user.clinicalSpecialty}</small>
            </span>
            <span>
              <strong>{user.accountStatus}</strong>
              <small>{user.roles.join(", ")}</small>
            </span>
            <span className="admin-action-row">
              <button className="secondary-button" type="button" onClick={() => onReveal(user.id, "email")}>
                <Eye className="h-4 w-4" />
                Reveal
              </button>
              <button className="secondary-button" type="button">
                <UserCog className="h-4 w-4" />
                Effective access
              </button>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function AccessPanel({
  roles,
  responsibilities,
  permissions
}: {
  roles: Role[];
  responsibilities: Responsibility[];
  permissions: Permission[];
}) {
  return (
    <section className="admin-stack">
      <article className="help-card help-card-wide">
        <h3 className="help-title">Role Access Bifurcation Matrix</h3>
        <div className="admin-table">
          <div className="admin-table-row admin-table-head">
            <span>Role</span>
            <span>Permissions</span>
            <span>Scopes</span>
            <span>Boundary</span>
          </div>
          {roles.map((role) => (
            <div key={role.code} className="admin-table-row">
              <span>
                <strong>{role.name}</strong>
                <small>{role.description}</small>
              </span>
              <span>{role.permissions.length}</span>
              <span>{[...role.dataScopes, ...role.clinicalScopes, ...role.integrationScopes].slice(0, 4).join(", ")}</span>
              <span>{role.status}</span>
            </div>
          ))}
        </div>
      </article>
      <div className="help-grid">
        <article className="help-card">
          <div className="help-card-heading">
            <span className="help-icon">
              <KeyRound className="h-5 w-5" />
            </span>
            <div>
              <h3 className="help-title">Responsibilities</h3>
              <p>Responsibilities are business functions with risk, conflict, and approval controls.</p>
            </div>
          </div>
          <div className="admin-list">
            {responsibilities.map((item) => (
              <div key={item.code}>
                <strong>{item.name}</strong>
                <span>{item.module} | {item.businessFunction}</span>
                <small>{item.risk} risk | conflicts: {item.conflictingResponsibilities.length}</small>
              </div>
            ))}
          </div>
        </article>
        <article className="help-card">
          <h3 className="help-title">Permission Matrix</h3>
          <div className="admin-chip-row">
            {permissions.map((permission) => (
              <span key={permission.code} className="status-pill border border-emerald-200 bg-emerald-50 text-emerald-700">
                {permission.code}
              </span>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}

function SecurityPanel({ providers, policies }: { providers: SsoProvider[]; policies: EncryptionPolicy[] }) {
  return (
    <section className="admin-stack">
      {providers.map((provider) => (
        <article key={provider.id} className="help-card">
          <div className="help-card-heading">
            <span className="help-icon">
              <Fingerprint className="h-5 w-5" />
            </span>
            <div>
              <h3 className="help-title">{provider.name}</h3>
              <p>{provider.protocol.toUpperCase()} | {provider.enabled ? "Enabled" : "Disabled pending approval"}</p>
            </div>
          </div>
          <div className="help-compare-grid">
            <MiniFact label="Issuer" value={provider.issuerUrl} />
            <MiniFact label="Redirect" value={provider.redirectUri} />
            <MiniFact label="Secrets" value={provider.secretStorage} />
          </div>
        </article>
      ))}
      {policies.length > 0 && <PolicyList policies={policies} />}
    </section>
  );
}

function PrivacyPanel({
  policies,
  users,
  revealResult,
  onReveal
}: {
  policies: EncryptionPolicy[];
  users: AdminUser[];
  revealResult: string;
  onReveal: (userId: string, field: string) => void;
}) {
  return (
    <section className="admin-stack">
      {revealResult && <div className="login-alert">{revealResult}</div>}
      <article className="help-card help-card-wide">
        <span className="tag-label">PRIVACY OFFICER WORKSPACE</span>
        <h3 className="help-title">Purpose-Based Reveal Requests</h3>
        <p>
          Personal identifiers remain masked. A reveal action requires a named user, active role,
          purpose, field, resource, and audit event.
        </p>
        <div className="admin-table">
          <div className="admin-table-row admin-table-head">
            <span>Masked user</span>
            <span>Role</span>
            <span>Directory</span>
            <span>Reveal</span>
          </div>
          {users.map((user) => (
            <div key={user.id} className="admin-table-row">
              <span>
                <strong>{user.fullName}</strong>
                <small>{user.email} | {user.mobile}</small>
              </span>
              <span>{user.roles.join(", ")}</span>
              <span>{user.accountStatus}</span>
              <span className="admin-action-row">
                <button className="secondary-button" type="button" onClick={() => onReveal(user.id, "email")}>
                  <Eye className="h-4 w-4" />
                  Email
                </button>
                <button className="secondary-button" type="button" onClick={() => onReveal(user.id, "mobile")}>
                  <Eye className="h-4 w-4" />
                  Mobile
                </button>
              </span>
            </div>
          ))}
        </div>
      </article>
      <PolicyList policies={policies} />
    </section>
  );
}

function PolicyList({ policies }: { policies: EncryptionPolicy[] }) {
  return (
    <section className="admin-stack">
      {policies.map((policy) => (
        <article key={policy.id} className="help-card">
          <div className="help-card-heading">
            <span className="help-icon">
              <FileKey2 className="h-5 w-5" />
            </span>
            <div>
              <h3 className="help-title">{policy.name}</h3>
              <p>{policy.dataClassification} | {policy.algorithm} | {policy.status}</p>
            </div>
          </div>
          <div className="help-compare-grid">
            <MiniFact label="Key provider" value={policy.keyProvider} />
            <MiniFact label="Residency" value={policy.dataResidency} />
            <MiniFact label="Rotation" value={`${policy.rotationDays} days`} />
          </div>
          <div className="admin-chip-row">
            {policy.coveredFields.map((field) => (
              <span key={`${policy.id}-${field}`} className="status-pill border border-emerald-200 bg-emerald-50 text-emerald-700">
                {field}
              </span>
            ))}
          </div>
        </article>
      ))}
    </section>
  );
}

function AuditPanel({ events }: { events: AuditEvent[] }) {
  return (
    <section className="admin-table">
      <div className="admin-table-row admin-table-head">
        <span>Event</span>
        <span>Module</span>
        <span>Resource</span>
        <span>Risk</span>
      </div>
      {events.map((event) => (
        <div key={event.id} className="admin-table-row">
          <span>
            <strong>{event.action}</strong>
            <small>{new Date(event.timestampIso).toLocaleString()} | {event.userId}</small>
          </span>
          <span>{event.module}</span>
          <span>{event.resource}</span>
          <span className={event.success ? "text-emerald-600" : "text-rose-600"}>
            {event.risk}
          </span>
        </div>
      ))}
    </section>
  );
}

function GovernancePanel({ items }: { items: GovernanceWorkItem[] }) {
  return (
    <section className="help-grid">
      {items.map((item) => (
        <article key={item.id} className="help-card">
          <span className="tag-label">{item.status}</span>
          <h3 className="help-title">{item.title}</h3>
          <p>{item.control}</p>
          <MiniFact label="Owner" value={item.ownerRole} />
          <MiniFact label="Evidence" value={item.evidence} />
        </article>
      ))}
    </section>
  );
}

function ProtocolLibraryPanel({ protocols }: { protocols: ProtocolLibraryItem[] }) {
  return (
    <section className="admin-table">
      <div className="admin-table-row admin-table-head">
        <span>Protocol</span>
        <span>Category</span>
        <span>Release</span>
        <span>Status</span>
      </div>
      {protocols.map((protocol) => (
        <div key={protocol.id} className="admin-table-row">
          <span>
            <strong>{protocol.title}</strong>
            <small>{protocol.safetyNotes}</small>
          </span>
          <span>{protocol.category}</span>
          <span>{protocol.release}</span>
          <span>{protocol.status}</span>
        </div>
      ))}
    </section>
  );
}

function IntegrationPanel({ connectors }: { connectors: IntegrationConnector[] }) {
  return (
    <section className="help-grid">
      {connectors.map((connector) => (
        <article key={connector.id} className="help-card">
          <span className="tag-label">{connector.system}</span>
          <h3 className="help-title">{connector.name}</h3>
          <p>{connector.apiSurface}</p>
          <div className="help-compare-grid">
            <MiniFact label="Status" value={connector.status} />
            <MiniFact label="Owner" value={connector.ownerRole} />
            <MiniFact label="Last checked" value={new Date(connector.lastCheckedIso).toLocaleString()} />
          </div>
          <div className="admin-chip-row">
            {connector.dataHandled.map((field) => (
              <span key={`${connector.id}-${field}`} className="status-pill border border-amber-200 bg-amber-50 text-amber-700">
                {field}
              </span>
            ))}
          </div>
        </article>
      ))}
    </section>
  );
}

function ReportsPanel({ reports }: { reports: ReportCatalogItem[] }) {
  return (
    <section className="admin-table">
      <div className="admin-table-row admin-table-head">
        <span>Report</span>
        <span>Audience</span>
        <span>Data class</span>
        <span>Export</span>
      </div>
      {reports.map((report) => (
        <div key={report.id} className="admin-table-row">
          <span>
            <strong>{report.title}</strong>
            <small>{report.requiredPermission}</small>
          </span>
          <span>{report.audience}</span>
          <span>{report.dataClass}</span>
          <span>{report.exportAllowed ? "Allowed" : "Restricted"}</span>
        </div>
      ))}
    </section>
  );
}

function SupportPanel({ tickets }: { tickets: SupportQueueItem[] }) {
  return (
    <section className="help-grid">
      {tickets.map((ticket) => (
        <article key={ticket.id} className="help-card">
          <span className="tag-label">{ticket.status}</span>
          <h3 className="help-title">{ticket.title}</h3>
          <p>{ticket.dataBoundary}</p>
          <MiniFact label="Requester" value={ticket.requesterRole} />
        </article>
      ))}
    </section>
  );
}

function MiniFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="help-mini-definition">
      <strong>{label}</strong>
      <span>{value}</span>
    </div>
  );
}
