import {
  Eye,
  EyeOff,
  Moon,
  Sun
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
  themeMode: "light" | "dark";
  onToggleTheme: () => void;
};

const apiBase = import.meta.env.VITE_API_BASE_URL || "";
const simulationLoginPassword = import.meta.env.VITE_DEMO_ADMIN_PASSWORD || "LocalMockAdmin!2026";

type SimulationRole = {
  value: string;
  label: string;
  username: string;
  landing: string;
};

type SimulationRoleGroup = {
  code: string;
  label: string;
  roles: SimulationRole[];
};

const simulationRoleGroups: SimulationRoleGroup[] = [
  {
    code: "A",
    label: "A - Administration",
    roles: [
      {
        value: "platform_super_administrator",
        label: "Platform Super Administrator",
        username: "admin@ist.local",
        landing: "complete system"
      },
      {
        value: "organization_administrator",
        label: "Organization Administrator",
        username: "org.admin@ist.local",
        landing: "organization administration"
      },
      {
        value: "system_administrator",
        label: "System Administrator",
        username: "admin@ist.local",
        landing: "administration"
      }
    ]
  },
  {
    code: "S",
    label: "S - Security and Privacy",
    roles: [
      {
        value: "security_administrator",
        label: "Security Administrator",
        username: "admin@ist.local",
        landing: "security"
      },
      {
        value: "privacy_officer",
        label: "Privacy Officer / DPO",
        username: "privacy@ist.local",
        landing: "privacy governance"
      }
    ]
  },
  {
    code: "G",
    label: "G - Governance and Quality",
    roles: [
      {
        value: "compliance_auditor",
        label: "Compliance Auditor",
        username: "compliance@ist.local",
        landing: "audit review"
      },
      {
        value: "clinical_governance_lead",
        label: "Clinical Governance Lead",
        username: "governance@ist.local",
        landing: "clinical governance"
      },
      {
        value: "protocol_content_manager",
        label: "Protocol Content Manager",
        username: "protocols@ist.local",
        landing: "protocol library"
      },
      {
        value: "quality_reviewer",
        label: "Quality Reviewer",
        username: "reviewer@ist.local",
        landing: "audit review"
      }
    ]
  },
  {
    code: "B",
    label: "B - Business and Clinical Operations",
    roles: [
      {
        value: "triage_service_manager",
        label: "Triage Service Manager",
        username: "triage.manager@ist.local",
        landing: "operations dashboard"
      },
      {
        value: "call_intake_coordinator",
        label: "Call Intake Coordinator",
        username: "intake@ist.local",
        landing: "call intake workspace"
      },
      {
        value: "remote_triage_nurse",
        label: "Remote Triage Nurse",
        username: "nurse@ist.local",
        landing: "triage workspace"
      },
      {
        value: "senior_triage_nurse",
        label: "Senior Triage Nurse",
        username: "senior.nurse@ist.local",
        landing: "supervised triage workspace"
      },
      {
        value: "pediatric_triage_nurse",
        label: "Pediatric Triage Nurse",
        username: "pediatric.nurse@ist.local",
        landing: "pediatric triage workspace"
      },
      {
        value: "teleconsult_physician",
        label: "Teleconsult Physician",
        username: "physician@ist.local",
        landing: "physician escalation workspace"
      },
      {
        value: "occupational_health_clinician",
        label: "Occupational Health Clinician",
        username: "occupational.health@ist.local",
        landing: "occupational-health workspace"
      }
    ]
  },
  {
    code: "I",
    label: "I - Integration",
    roles: [
      {
        value: "integration_administrator",
        label: "Integration Administrator",
        username: "integrations@ist.local",
        landing: "integration administration"
      }
    ]
  },
  {
    code: "R",
    label: "R - Reporting and Analytics",
    roles: [
      {
        value: "reporting_analyst",
        label: "Reporting Analyst",
        username: "reports@ist.local",
        landing: "reporting"
      }
    ]
  },
  {
    code: "U",
    label: "U - User Support",
    roles: [
      {
        value: "helpdesk_support",
        label: "Helpdesk Support",
        username: "helpdesk@ist.local",
        landing: "support"
      }
    ]
  }
] as const;

const simulationRoles = simulationRoleGroups.flatMap((group) => group.roles);

export default function LoginPage({ onAuthenticated, themeMode, onToggleTheme }: LoginPageProps) {
  const [username, setUsername] = useState("admin@ist.local");
  const [password, setPassword] = useState("");
  const [tenant] = useState("ist-tech");
  const [language, setLanguage] = useState("en");
  const [simulationRole, setSimulationRole] = useState("platform_super_administrator");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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

  async function simulateSelectedRoleLogin() {
    const selectedRole = simulationRoles.find((role) => role.value === simulationRole) ?? simulationRoles[0];
    setUsername(selectedRole.username);
    setPassword("");
    setRememberMe(false);
    setStatus(`Opening simulated ${selectedRole.landing}.`);
    await loginWithCredentials(selectedRole.username, simulationLoginPassword, false, selectedRole.value);
  }

  return (
    <>
      <header className="login-reference-header" aria-label="IST Health login header">
        <div className="login-reference-brand">
          <img src="/logo-irisstar.svg" alt="" />
          <span>IST</span>
        </div>
        <div className="login-reference-actions">
          <div className="login-language-switch" aria-label="Language">
            <button
              type="button"
              className={language === "en" ? "is-active" : ""}
              onClick={() => setLanguage("en")}
            >
              EN
            </button>
            <button
              type="button"
              className={language === "ar" ? "is-active" : ""}
              onClick={() => setLanguage("ar")}
            >
              AR
            </button>
          </div>
          <button
            type="button"
            className="login-reference-theme"
            onClick={onToggleTheme}
            aria-label={`Switch to ${themeMode === "light" ? "dark" : "light"} mode`}
            title={themeMode === "light" ? "Dark mode" : "Light mode"}
          >
            {themeMode === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </button>
        </div>
      </header>

      <main className="login-shell login-shell-reference" aria-label="Sign in">
        <section className="login-split-card">
          <header className="login-split-card-header">
            <div className="login-split-card-brand">
              <img src="/logo-irisstar.svg" alt="" />
              <strong>IST</strong>
              <span>Sign in to IST Health</span>
            </div>
            <p>
              to continue to <strong>IST Health</strong>
            </p>
          </header>

          <div className="login-split-card-body">
            <section className="login-brand-panel" aria-label="IST Health identity">
              <img className="login-brand-logo" src="/logo-irisstar-full.svg" alt="IRIS STAR Technologies L.L.C" />
              <span className="tag-label">THE DIGITAL HEALTH ENGINE FOR QATAR</span>
              <h1>Sign in to IST Health</h1>
              <ul className="login-feature-list">
                <li>Rules-first tele-triage</li>
                <li>Clinical governance and audit</li>
                <li>HRMS identity and dependent validation</li>
                <li>Bilingual EN / AR workspace</li>
              </ul>
              <span className="login-card-watermark" aria-hidden="true">
                IST
              </span>
            </section>

            <form className="login-card" onSubmit={submitLogin}>
              <h2>Sign in</h2>

              <label className="field-label" htmlFor="tenant-display">
                Database
              </label>
              <input
                id="tenant-display"
                className="input-control login-database-field"
                value="isthealth"
                readOnly
                aria-label={`Database mapped to ${tenant}`}
              />

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

              <div className="login-label-row">
                <label className="field-label" htmlFor="password">
                  Password
                </label>
                <a href="#forgot-password">Forgot password?</a>
              </div>
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

              <button className="primary-button login-submit-button" type="submit" disabled={busy}>
                {busy ? "Signing in" : "Sign In"}
              </button>

              <div className="login-secondary-actions">
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => setStatus("SSO provider is configured in Administration and awaits enterprise metadata.")}
                  disabled={busy}
                >
                  Single Sign-On
                </button>
                <button
                  className="secondary-button login-sysadmin-button"
                  type="button"
                  onClick={simulateSelectedRoleLogin}
                  disabled={busy}
                >
                  Simulate role
                </button>
              </div>

              <label className="field-label login-simulation-label" htmlFor="simulation-role">
                Simulation role
              </label>
              <select
                id="simulation-role"
                className="input-control login-simulation-select"
                value={simulationRole}
                onChange={(event) => setSimulationRole(event.target.value as typeof simulationRole)}
              >
                {simulationRoleGroups.map((group) => (
                  <optgroup key={group.code} label={group.label}>
                    {group.roles.map((role) => (
                      <option key={role.value} value={role.value}>
                        {group.code} - {role.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </form>
          </div>

          <footer className="login-split-card-footer">
            <p>
              By signing in, you agree to our Terms of Service and acknowledge our Privacy Policy for
              healthcare operations in Qatar.
            </p>
            <div>
              <strong>IRIS STAR Technologies L.L.C</strong>
              <span>Doha, Qatar</span>
            </div>
            <nav aria-label="Legal">
              <a href="#privacy">Privacy Policy</a>
              <a href="#terms">Terms of Service</a>
              <a href="mailto:helpdesk@ist.local">Helpdesk</a>
            </nav>
          </footer>
        </section>
      </main>
    </>
  );
}
