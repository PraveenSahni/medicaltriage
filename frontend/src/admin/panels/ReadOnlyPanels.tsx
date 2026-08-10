import { FileKey2, Fingerprint } from "lucide-react";
import { LabeledIconButton } from "../../components/ui/NavigationControls";
import { Mail, Phone } from "lucide-react";

// Types + read-only panel components moved out of AdminPortal.tsx so both
// AdminPortal.tsx (data loading) and AdminRouter.tsx (route tree) can import
// them without a circular dependency between the two.

export type Dashboard = Record<string, number>;

export type AdminUser = {
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

export type SsoProvider = {
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

export type EncryptionPolicy = {
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

export type AuditEvent = {
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

export type ControlCenterModule = {
  id: string;
  label: string;
  purpose: string;
  primaryRoles: string[];
  requiredPermissions: string[];
  dataBoundary: string;
  prohibitedActions: string[];
};

export type IntegrationConnector = {
  id: string;
  name: string;
  system: string;
  status: string;
  ownerRole: string;
  dataHandled: string[];
  apiSurface: string;
  lastCheckedIso: string;
};

export type GovernanceWorkItem = {
  id: string;
  title: string;
  ownerRole: string;
  status: string;
  control: string;
  evidence: string;
};

export type ProtocolLibraryItem = {
  id: string;
  title: string;
  category: string;
  status: string;
  ownerRole: string;
  release: string;
  safetyNotes: string;
};

export type ReportCatalogItem = {
  id: string;
  title: string;
  audience: string;
  dataClass: string;
  exportAllowed: boolean;
  requiredPermission: string;
};

export type SupportQueueItem = {
  id: string;
  title: string;
  requesterRole: string;
  status: string;
  dataBoundary: string;
};

export function OverviewPanel({ modules, dashboard }: { modules: ControlCenterModule[]; dashboard?: Dashboard }) {
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

export function DashboardPanel({ dashboard, compact = false }: { dashboard?: Dashboard; compact?: boolean }) {
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

export function SecurityPanel({ providers, policies }: { providers: SsoProvider[]; policies: EncryptionPolicy[] }) {
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

export function PrivacyPanel({
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
                <LabeledIconButton
                  icon={Mail}
                  label="Email"
                  aria-label={`Reveal email for ${user.fullName}`}
                  onClick={() => onReveal(user.id, "email")}
                />
                <LabeledIconButton
                  icon={Phone}
                  label="Mobile"
                  aria-label={`Reveal mobile number for ${user.fullName}`}
                  onClick={() => onReveal(user.id, "mobile")}
                />
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

export function AuditPanel({ events }: { events: AuditEvent[] }) {
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

export function GovernancePanel({ items }: { items: GovernanceWorkItem[] }) {
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

export function ProtocolLibraryPanel({ protocols }: { protocols: ProtocolLibraryItem[] }) {
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

export function IntegrationPanel({ connectors }: { connectors: IntegrationConnector[] }) {
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

export function ReportsPanel({ reports }: { reports: ReportCatalogItem[] }) {
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

export function SupportPanel({ tickets }: { tickets: SupportQueueItem[] }) {
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
