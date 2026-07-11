import {
  Activity,
  AlertTriangle,
  DatabaseZap,
  Eye,
  FileKey2,
  Fingerprint,
  KeyRound,
  LockKeyhole,
  ShieldCheck,
  UserCog,
  Users
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import SafetyDashboard from "./components/SafetyDashboard";

type AdminTab = "dashboard" | "safety" | "users" | "access" | "sso" | "privacy" | "audit";

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

type AdminData = {
  dashboard?: Dashboard;
  users: AdminUser[];
  roles: Role[];
  responsibilities: Responsibility[];
  permissions: Permission[];
  providers: SsoProvider[];
  policies: EncryptionPolicy[];
  events: AuditEvent[];
};

const emptyData: AdminData = {
  users: [],
  roles: [],
  responsibilities: [],
  permissions: [],
  providers: [],
  policies: [],
  events: []
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
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");
  const [data, setData] = useState<AdminData>(emptyData);
  const [status, setStatus] = useState("Loading security administration data.");
  const [revealResult, setRevealResult] = useState("");

  const hasPermission = (permission: string) => session.permissions.includes(permission);

  const tabs = useMemo(
    () =>
      [
        { key: "dashboard" as const, label: "Dashboard", icon: Activity, enabled: hasPermission("audit.events.view") },
        { key: "safety" as const, label: "AI Safety", icon: AlertTriangle, enabled: hasPermission("audit.events.view") },
        { key: "users" as const, label: "Users", icon: Users, enabled: hasPermission("admin.users.manage") },
        { key: "access" as const, label: "Access", icon: ShieldCheck, enabled: hasPermission("admin.roles.manage") },
        { key: "sso" as const, label: "SSO", icon: Fingerprint, enabled: hasPermission("security.sso.manage") },
        { key: "privacy" as const, label: "Privacy", icon: LockKeyhole, enabled: hasPermission("crypto.policy.manage") },
        { key: "audit" as const, label: "Audit", icon: DatabaseZap, enabled: hasPermission("audit.events.view") }
      ].filter((tab) => tab.enabled),
    [session.permissions]
  );

  useEffect(() => {
    if (!tabs.some((tab) => tab.key === activeTab)) {
      setActiveTab(tabs[0]?.key ?? "dashboard");
    }
  }, [activeTab, tabs]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setStatus("Loading security administration data.");
      try {
        const canViewAudit = hasPermission("audit.events.view");
        const canManageUsers = hasPermission("admin.users.manage");
        const canManageRoles = hasPermission("admin.roles.manage");
        const canManageSso = hasPermission("security.sso.manage");
        const canManageCrypto = hasPermission("crypto.policy.manage");

        const [summary, users, roles, responsibilities, permissions, providers, policies, events] =
          await Promise.all([
            canViewAudit ? fetchJson("/api/v1/admin/summary") : Promise.resolve({ dashboard: undefined }),
            canManageUsers ? fetchJson("/api/v1/admin/users") : Promise.resolve({ users: [] }),
            canManageRoles ? fetchJson("/api/v1/admin/roles") : Promise.resolve({ roles: [] }),
            canManageRoles ? fetchJson("/api/v1/admin/responsibilities") : Promise.resolve({ responsibilities: [] }),
            canManageRoles ? fetchJson("/api/v1/admin/permissions") : Promise.resolve({ permissions: [] }),
            canManageSso ? fetchJson("/api/v1/admin/sso-providers") : Promise.resolve({ providers: [] }),
            canManageCrypto ? fetchJson("/api/v1/admin/encryption-policies") : Promise.resolve({ policies: [] }),
            canViewAudit ? fetchJson("/api/v1/admin/audit-events") : Promise.resolve({ events: [] })
          ]);

        if (!cancelled) {
          setData({
            dashboard: summary.dashboard,
            users: users.users,
            roles: roles.roles,
            responsibilities: responsibilities.responsibilities,
            permissions: permissions.permissions,
            providers: providers.providers,
            policies: policies.policies,
            events: events.events
          });
          setStatus("Available administration modules loaded for the active role.");
        }
      } catch {
        if (!cancelled) {
          setStatus("Unable to load one or more administration modules. Check role permissions and API status.");
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
          purpose: "Authorized support investigation"
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
    <section className="admin-shell" aria-label="Security administration">
      <div className="admin-hero">
        <div>
          <span className="tag-label">SECURITY ADMINISTRATION</span>
          <h2>Identity, Privacy, Access, and Audit</h2>
          <p>
            Extends the existing tele-triage system with login, SSO, users, roles,
            responsibilities, masking, controlled reveal, encryption policies, and monitoring.
          </p>
        </div>
        <div className="admin-session-card">
          <strong>{session.user.fullName}</strong>
          <span>{formatRole(session.activeRole)}</span>
          <small>Session expires {new Date(session.expiresAtIso).toLocaleString()}</small>
        </div>
      </div>

      <div className="help-tabbar admin-tabbar" role="tablist" aria-label="Administration sections">
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

      {activeTab === "dashboard" && <DashboardPanel dashboard={data.dashboard} />}
      {activeTab === "safety" && <SafetyDashboard />}
      {activeTab === "users" && (
        <UsersPanel users={data.users} revealResult={revealResult} onReveal={requestReveal} />
      )}
      {activeTab === "access" && (
        <AccessPanel roles={data.roles} responsibilities={data.responsibilities} permissions={data.permissions} />
      )}
      {activeTab === "sso" && <SsoPanel providers={data.providers} />}
      {activeTab === "privacy" && <PrivacyPanel policies={data.policies} />}
      {activeTab === "audit" && <AuditPanel events={data.events} />}
    </section>
  );
}

async function fetchJson(path: string) {
  const response = await fetch(`${apiBase}${path}`, { credentials: "include" });
  if (!response.ok) {
    throw new Error(`Request failed ${response.status}`);
  }
  return response.json();
}

function DashboardPanel({ dashboard }: { dashboard?: Dashboard }) {
  const items = dashboard
    ? [
        ["Active users", dashboard.activeUsers],
        ["Suspended", dashboard.suspendedUsers],
        ["Locked", dashboard.lockedUsers],
        ["Expiring access", dashboard.expiringAccess],
        ["Active sessions", dashboard.activeSessions],
        ["Failed logins", dashboard.failedLoginAttempts],
        ["Access approvals", dashboard.pendingAccessApprovals],
        ["Role approvals", dashboard.pendingRoleApprovals],
        ["Break-glass", dashboard.breakGlassEvents],
        ["Recent reveals", dashboard.recentReveals],
        ["Exports", dashboard.identifiableExports],
        ["Key warnings", dashboard.keysNearingExpiry],
        ["Overdue rotations", dashboard.overdueKeyRotations],
        ["Crypto failures", dashboard.failedCryptoOperations],
        ["Certificate warnings", dashboard.certificateExpiryWarnings],
        ["Privacy requests", dashboard.openPrivacyRequests],
        ["Security incidents", dashboard.openSecurityIncidents]
      ]
    : [];

  return (
    <section className="admin-metric-grid">
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
    <section className="help-grid">
      <article className="help-card">
        <div className="help-card-heading">
          <span className="help-icon">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div>
            <h3 className="help-title">Role templates</h3>
            <p>Role assignments combine permissions, responsibilities, scopes, and approval rules.</p>
          </div>
        </div>
        <div className="admin-list">
          {roles.map((role) => (
            <div key={role.code}>
              <strong>{role.name}</strong>
              <span>{role.description}</span>
              <small>
                {role.permissions.length} permissions | {role.responsibilities.length} responsibilities |{" "}
                {role.dataScopes.length} data scopes | {role.clinicalScopes.length} clinical scopes |{" "}
                {role.integrationScopes.length} integration scopes
              </small>
            </div>
          ))}
        </div>
      </article>
      <article className="help-card">
        <div className="help-card-heading">
          <span className="help-icon">
            <KeyRound className="h-5 w-5" />
          </span>
          <div>
            <h3 className="help-title">Responsibilities</h3>
            <p>Responsibilities are configurable business functions with risk and conflict controls.</p>
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
      <article className="help-card help-card-wide">
        <h3 className="help-title">Permission matrix</h3>
        <div className="admin-chip-row">
          {permissions.map((permission) => (
            <span key={permission.code} className="status-pill border border-emerald-200 bg-emerald-50 text-emerald-700">
              {permission.code}
            </span>
          ))}
        </div>
      </article>
    </section>
  );
}

function SsoPanel({ providers }: { providers: SsoProvider[] }) {
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
          <div className="admin-chip-row">
            {provider.allowedDomains.map((domain) => (
              <span key={domain} className="status-pill border border-amber-200 bg-amber-50 text-amber-700">
                {domain}
              </span>
            ))}
          </div>
        </article>
      ))}
    </section>
  );
}

function PrivacyPanel({ policies }: { policies: EncryptionPolicy[] }) {
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

function MiniFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="help-mini-definition">
      <strong>{label}</strong>
      <span>{value}</span>
    </div>
  );
}
