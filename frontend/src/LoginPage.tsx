import {
  Eye,
  EyeOff
} from "lucide-react";
import { FormEvent, useState } from "react";

type AuthenticatedSession = {
  sessionId: string;
  user: {
    id: string;
    fullName: string;
    email: string;
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

type LoginPageProps = {
  onAuthenticated: (session: AuthenticatedSession, redirectTo: "workspace" | "admin") => void;
};

const apiBase = import.meta.env.VITE_API_BASE_URL || "";

type SimulationUser = {
  id: string;
  roleCode: string;
  roleLabel: string;
  name: string;
  label: string;
  username: string;
  password: string;
  landing: string;
};

type SimulationUserGroup = {
  code: string;
  label: string;
  users: SimulationUser[];
};

const simulationUserGroups: SimulationUserGroup[] = [
  {
    code: "A",
    label: "A - Administration",
    users: [
      {
        id: "platform-administrator",
        roleCode: "platform_super_administrator",
        roleLabel: "Platform Super Administrator",
        name: "Platform Administrator",
        label: "Platform Administrator",
        username: "pa@irisstar.tech",
        password: "PlatformAdmin@2026",
        landing: "complete system"
      },
      {
        id: "organization-administrator",
        roleCode: "organization_administrator",
        roleLabel: "Organization Administrator",
        name: "Organization Administrator",
        label: "Organization Administrator",
        username: "oa@irisstar.tech",
        password: "OrgAdmin@2026",
        landing: "organization administration"
      },
      {
        id: "system-administrator",
        roleCode: "system_administrator",
        roleLabel: "System Administrator",
        name: "System Administrator",
        label: "System Administrator",
        username: "sa@irisstar.tech",
        password: "SystemAdmin@2026",
        landing: "administration"
      }
    ]
  },
  {
    code: "S",
    label: "S - Security and Privacy",
    users: [
      {
        id: "security-administrator",
        roleCode: "security_administrator",
        roleLabel: "Security Administrator",
        name: "Security Administrator",
        label: "Security Administrator",
        username: "sec@irisstar.tech",
        password: "SecurityAdmin@2026",
        landing: "security"
      },
      {
        id: "privacy-officer",
        roleCode: "privacy_officer",
        roleLabel: "Privacy Officer / DPO",
        name: "Privacy Officer",
        label: "Privacy Officer / DPO",
        username: "privacy@irisstar.tech",
        password: "Privacy@2026",
        landing: "privacy governance"
      }
    ]
  },
  {
    code: "G",
    label: "G - Governance and Quality",
    users: [
      {
        id: "compliance-auditor",
        roleCode: "compliance_auditor",
        roleLabel: "Compliance Auditor",
        name: "Compliance Auditor",
        label: "Compliance Auditor",
        username: "audit@irisstar.tech",
        password: "Audit@2026",
        landing: "audit review"
      },
      {
        id: "clinical-governance-lead",
        roleCode: "clinical_governance_lead",
        roleLabel: "Clinical Governance Lead",
        name: "Clinical Governance Lead",
        label: "Clinical Governance Lead",
        username: "governance@irisstar.tech",
        password: "Governance@2026",
        landing: "clinical governance"
      },
      {
        id: "protocol-content-manager",
        roleCode: "protocol_content_manager",
        roleLabel: "Protocol Content Manager",
        name: "Protocol Content Manager",
        label: "Protocol Content Manager",
        username: "protocols@irisstar.tech",
        password: "Protocols@2026",
        landing: "protocol library"
      },
      {
        id: "quality-reviewer",
        roleCode: "quality_reviewer",
        roleLabel: "Quality Reviewer",
        name: "Quality Reviewer",
        label: "Quality Reviewer",
        username: "quality@irisstar.tech",
        password: "Quality@2026",
        landing: "audit review"
      }
    ]
  },
  {
    code: "B",
    label: "B - Business and Clinical Operations",
    users: [
      {
        id: "triage-service-manager",
        roleCode: "triage_service_manager",
        roleLabel: "Triage Service Manager",
        name: "Triage Service Manager",
        label: "Triage Service Manager",
        username: "manager@irisstar.tech",
        password: "Manager@2026",
        landing: "operations dashboard"
      },
      {
        id: "call-intake-coordinator",
        roleCode: "call_intake_coordinator",
        roleLabel: "Call Intake Coordinator",
        name: "Call Intake Coordinator",
        label: "Call Intake Coordinator",
        username: "intake@irisstar.tech",
        password: "Intake@2026",
        landing: "call intake workspace"
      },
      {
        id: "remote-triage-nurse",
        roleCode: "remote_triage_nurse",
        roleLabel: "Remote Triage Nurse",
        name: "Remote Triage Nurse",
        label: "Remote Triage Nurse",
        username: "nurse@irisstar.tech",
        password: "Nurse@2026",
        landing: "triage workspace"
      },
      {
        id: "senior-triage-nurse",
        roleCode: "senior_triage_nurse",
        roleLabel: "Senior Triage Nurse",
        name: "Senior Triage Nurse",
        label: "Senior Triage Nurse",
        username: "senior.nurse@irisstar.tech",
        password: "SeniorNurse@2026",
        landing: "supervised triage workspace"
      },
      {
        id: "pediatric-triage-nurse",
        roleCode: "pediatric_triage_nurse",
        roleLabel: "Pediatric Triage Nurse",
        name: "Pediatric Triage Nurse",
        label: "Pediatric Triage Nurse",
        username: "pediatric.nurse@irisstar.tech",
        password: "PediatricNurse@2026",
        landing: "pediatric triage workspace"
      },
      {
        id: "teleconsult-physician",
        roleCode: "teleconsult_physician",
        roleLabel: "Teleconsult Physician",
        name: "Teleconsult Physician",
        label: "Teleconsult Physician",
        username: "physician@irisstar.tech",
        password: "Physician@2026",
        landing: "physician escalation workspace"
      },
      {
        id: "occupational-health-clinician",
        roleCode: "occupational_health_clinician",
        roleLabel: "Occupational Health Clinician",
        name: "Occupational Health Clinician",
        label: "Occupational Health Clinician",
        username: "oh@irisstar.tech",
        password: "OccupationalHealth@2026",
        landing: "occupational-health workspace"
      }
    ]
  },
  {
    code: "I",
    label: "I - Integration",
    users: [
      {
        id: "integration-administrator",
        roleCode: "integration_administrator",
        roleLabel: "Integration Administrator",
        name: "Integration Administrator",
        label: "Integration Administrator",
        username: "integration@irisstar.tech",
        password: "Integration@2026",
        landing: "integration administration"
      }
    ]
  },
  {
    code: "R",
    label: "R - Reporting and Analytics",
    users: [
      {
        id: "reporting-analyst",
        roleCode: "reporting_analyst",
        roleLabel: "Reporting Analyst",
        name: "Reporting Analyst",
        label: "Reporting Analyst",
        username: "reports@irisstar.tech",
        password: "Reports@2026",
        landing: "reporting"
      }
    ]
  },
  {
    code: "U",
    label: "U - User Support",
    users: [
      {
        id: "helpdesk-support",
        roleCode: "helpdesk_support",
        roleLabel: "Helpdesk Support",
        name: "Helpdesk Support",
        label: "Helpdesk Support",
        username: "helpdesk@irisstar.tech",
        password: "Helpdesk@2026",
        landing: "support"
      }
    ]
  }
] as const;

const simulationUsers = simulationUserGroups.flatMap((group) => group.users);

export default function LoginPage({ onAuthenticated }: LoginPageProps) {
  const [simulationUserId, setSimulationUserId] = useState("platform-administrator");
  const selectedSimulationUser =
    simulationUsers.find((user) => user.id === simulationUserId) ?? simulationUsers[0];
  const [username, setUsername] = useState(selectedSimulationUser.username);
  const [password, setPassword] = useState(selectedSimulationUser.password);
  const [tenant, setTenant] = useState("ist-tech");
  const [language, setLanguage] = useState("en");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(true);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  async function loginWithCredentials(
    nextUsername: string,
    nextPassword: string,
    nextRememberMe: boolean,
    nextSimulationRole?: string
  ) {
    setBusy(true);
    setStatus("");

    try {
      const response = await fetch(`${apiBase}/api/v1/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: nextUsername,
          password: nextPassword,
          tenant,
          language,
          rememberMe: nextRememberMe,
          simulateRole: nextSimulationRole
        })
      });
      const payload = await response.json();
      if (!response.ok) {
        setStatus(payload.message ?? "Sign-in failed. Check your credentials or contact the helpdesk.");
        return;
      }
      onAuthenticated(payload.session, payload.redirectTo === "admin" ? "admin" : "workspace");
    } catch {
      setStatus("Authentication service is not reachable. Contact the helpdesk.");
    } finally {
      setBusy(false);
    }
  }

  async function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await loginWithCredentials(username, password, rememberMe);
  }

  return (
    <main className="login-shell" aria-label="Sign in">
      <section className="login-brand-panel">
        <div className="login-brand-lockup">
          <img className="login-brand-logo" src="/logo-irisstar.svg" alt="IRIS STAR Technologies L.L.C" />
          <span className="tag-label">IRIS STAR TECHNOLOGIES L.L.C</span>
        </div>
        <h1>IST Health</h1>
        <strong>The Digital Health Engine for Qatar</strong>
        <p>
          Hospital Information System for governed tele-triage, clinical administration,
          privacy, and audit operations in Doha, Qatar.
        </p>
      </section>

      <form className="login-card" onSubmit={submitLogin}>
        <div>
          <span className="tag-label">SECURE LOGIN</span>
          <h2>Continue</h2>
          <p>
            Use local credentials or an approved single sign-on provider. Authentication messages do
            not reveal whether an account exists.
          </p>
        </div>

        <label className="field-label" htmlFor="simulation-user">
          Simulate user
        </label>
        <select
          id="simulation-user"
          className="input-control"
          value={simulationUserId}
          onChange={(event) => {
            const nextUserId = event.target.value;
            const nextUser = simulationUsers.find((user) => user.id === nextUserId) ?? simulationUsers[0];
            setSimulationUserId(nextUser.id);
            setUsername(nextUser.username);
            setPassword(nextUser.password);
            setShowPassword(true);
            setStatus("");
          }}
        >
          {simulationUserGroups.map((group) => (
            <optgroup key={group.code} label={group.label}>
              {group.users.map((user) => (
                <option key={user.id} value={user.id}>
                  {group.code} - {user.name} - {user.roleLabel}
                </option>
              ))}
            </optgroup>
          ))}
        </select>

        <label className="field-label" htmlFor="username">
          Email or username
        </label>
        <input
          id="username"
          className="input-control"
          autoComplete="username"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
        />

        <label className="field-label" htmlFor="password">
          Password
        </label>
        <div className="password-row">
          <input
            id="password"
            className="input-control"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <button
            type="button"
            className="header-icon-button"
            onClick={() => setShowPassword((current) => !current)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            title={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        <label className="login-check">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(event) => setRememberMe(event.target.checked)}
          />
          <span>Remember this device under the trusted-device policy</span>
        </label>

        {status && (
          <div className="login-alert" role="alert">
            {status}
          </div>
        )}

        <div className="login-actions">
          <button className="primary-button" type="submit" disabled={busy}>
            {busy ? "Logging in" : "Login"}
          </button>
          <button
            className="secondary-button"
            type="button"
            onClick={() => setStatus("SSO provider is configured in Administration and awaits enterprise metadata.")}
            disabled={busy}
          >
            Use Single Sign-On
          </button>
        </div>

        <div className="login-links">
          <a href="#privacy">Privacy policy</a>
          <a href="#terms">Terms of use</a>
          <a href="mailto:helpdesk@irisstar.tech">Helpdesk</a>
          <a href="#forgot-password">Forgot password</a>
        </div>
        <p className="login-legal-line">
          Legal entity: IRIS STAR Technologies L.L.C. Product: IST Health.
        </p>
      </form>
    </main>
  );
}
