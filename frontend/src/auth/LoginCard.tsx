import { Eye, EyeOff } from "lucide-react";
import { FormEvent, useState } from "react";
import { setAccessToken } from "../authToken";
import { useLocale } from "../i18n/LocaleContext";
import type { AuthenticatedSession } from "./session";

function BrandMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="530.68 548.65 938.64 902.7" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M1000,873.74c-17.41,0-32.06-6.85-42.38-19.79C940.3,832.19,938.3,797.37,944,772.51c6.44-28,24-58.52,47.64-87.64-44.41-51.56-107.52-98-156.08-114.21l4-12C890.3,575.56,954.29,622.2,1000,674.91c45.71-52.71,109.71-99.35,160.42-116.26l4,12c-48.56,16.2-111.67,62.65-156.07,114.21,23.61,29.12,41.2,59.61,47.63,87.64,5.71,24.86,3.71,59.68-13.61,81.44C1032.07,866.89,1017.41,873.74,1000,873.74Zm0-178.82c-21.71,27-37.81,55-43.65,80.43-5,21.89-3.52,52.25,11.18,70.71,7.94,10,18.86,15,32.47,15s24.53-5.05,32.47-15c14.7-18.46,16.21-48.82,11.18-70.71C1037.81,749.94,1021.72,722,1000,694.92Z"/>
      <path d="M894,908.71a52.84,52.84,0,0,1-14.13-2C853.06,899.33,831,872.33,821,848.87c-11.27-26.46-15-61.46-13-98.9-66.24-15.62-144.6-16.1-193.4-.66l-3.82-12.08c51-16.13,130.16-16,198.12-.23,6-69.52,30.36-144.86,61.45-188.35l10.3,7.36c-29.77,41.64-53.52,116.32-59.13,184.14,36.21,9.68,68.36,24,90.05,42.9,19.22,16.75,38.08,46.09,36.85,73.88-.74,16.54-8.57,30.69-22.65,40.92C915.88,905.05,905.08,908.71,894,908.71ZM820.68,753.19c-1.67,34.64,1.75,66.74,12,90.72,8.8,20.67,27.86,44.34,50.61,50.63,12.27,3.39,24.08,1.06,35.09-6.93s16.88-18.51,17.44-31.24c1.05-23.57-15.58-49-32.51-63.77C883.62,775.48,854.13,762.3,820.68,753.19Z"/>
      <path d="M540.87,1023.71l-10.19-7.53c31.76-43,95.88-89.46,160.15-116.64-36-59.76-60.59-135-61-188.49l12.66-.1c.4,51.18,25.07,125.56,60.39,183.72,35-13.46,69.42-20.76,98.07-18.22,25.4,2.25,57.9,14.91,73.24,38.11,9.13,13.81,11.11,29.86,5.73,46.42S863.5,989.36,848,995.17c-26,9.75-59.78.89-81.65-12.21-24.67-14.79-48.24-40.94-68.63-72.39C635,936.87,571.27,982.54,540.87,1023.71Zm169-118c19,29,40.65,53,63,66.36,19.26,11.55,48.59,19.49,70.7,11.22,11.93-4.47,20.11-13.3,24.31-26.24s2.78-24.9-4.25-35.52c-13-19.69-41.41-30.5-63.78-32.48C773.87,886.76,742.28,893.43,709.85,905.73Z"/>
      <path d="M642.49,1289.05l-12.66-.1c.41-53.46,25-128.73,61-188.49-64.27-27.18-128.39-73.64-160.15-116.64l10.19-7.53c30.4,41.18,94.09,86.84,156.85,113.14,20.39-31.45,44-57.6,68.63-72.39,21.87-13.1,55.61-22,81.65-12.21,15.5,5.81,26.54,17.63,31.92,34.19s3.4,32.61-5.73,46.41c-15.34,23.21-47.83,35.87-73.24,38.12-28.65,2.55-63.08-4.77-98.07-18.22C667.56,1163.49,642.89,1237.87,642.49,1289.05Zm67.36-194.77c32.43,12.29,64,19,90,16.65,22.37-2,50.77-12.8,63.78-32.48,7-10.63,8.46-22.58,4.25-35.52s-12.38-21.77-24.31-26.24c-22.11-8.27-51.44-.33-70.7,11.22C750.5,1041.31,728.86,1065.27,709.85,1094.28Z"/>
      <path d="M870.37,1451.35c-31.09-43.49-55.46-118.84-61.45-188.35-68,15.79-147.15,15.9-198.12-.23l3.82-12.08c48.8,15.44,127.16,15,193.4-.66-2-37.44,1.7-72.44,13-98.9,10-23.46,32.07-50.46,58.88-57.88,16-4.41,31.83-1.33,45.92,8.9s21.91,24.38,22.65,40.92c1.23,27.79-17.63,57.13-36.85,73.88-21.69,18.89-53.84,33.22-90.05,42.9,5.61,67.82,29.36,142.5,59.13,184.14ZM894.05,1104a40.3,40.3,0,0,0-10.8,1.51c-22.75,6.29-41.81,30-50.61,50.63-10.21,24-13.63,56.08-12,90.73,33.46-9.12,62.93-22.29,82.59-39.42,16.93-14.76,33.56-40.2,32.51-63.77-.56-12.73-6.43-23.23-17.44-31.24C910.6,1106.77,902.46,1104,894.05,1104Z"/>
      <path d="M1160.42,1441.35c-50.71-16.91-114.71-63.55-160.42-116.27-45.71,52.72-109.7,99.36-160.42,116.27l-4-12c48.56-16.2,111.67-62.65,156.08-114.21C968,1286,950.45,1255.52,944,1227.49c-5.71-24.86-3.71-59.68,13.61-81.44,10.32-12.94,25-19.79,42.38-19.79s32.07,6.85,42.38,19.79c17.32,21.76,19.32,56.58,13.61,81.44-6.43,28-24,58.52-47.63,87.64,44.4,51.56,107.51,98,156.07,114.21ZM1000,1138.93c-13.61,0-24.53,5-32.47,15-14.7,18.46-16.21,48.82-11.18,70.71,5.84,25.41,21.94,53.39,43.65,80.43,21.72-27,37.81-55,43.65-80.43,5-21.89,3.52-52.25-11.18-70.71C1024.53,1144,1013.61,1138.93,1000,1138.93Z"/>
      <path d="M1129.63,1451.35l-10.3-7.36c29.77-41.64,53.52-116.32,59.14-184.14-36.22-9.67-68.37-24-90.06-42.9-19.22-16.75-38.07-46.09-36.84-73.88.73-16.54,8.56-30.69,22.65-40.92s30-13.31,45.91-8.9c26.81,7.42,48.89,34.42,58.88,57.88,11.27,26.46,15,61.46,13,98.9,66.23,15.62,144.59,16.1,193.39.66l3.83,12.08c-51,16.13-130.16,16-198.13.23C1185.09,1332.52,1160.72,1407.86,1129.63,1451.35ZM1106,1104c-8.41,0-16.55,2.82-24.29,8.44-11,8-16.88,18.51-17.44,31.24-1,23.57,15.58,49,32.51,63.77,19.66,17.13,49.13,30.3,82.59,39.42,1.67-34.65-1.75-66.75-12-90.73-8.8-20.67-27.86-44.34-50.61-50.63A40.25,40.25,0,0,0,1106,1104Z"/>
      <path d="M1357.51,1289.05c-.39-51.18-25.07-125.56-60.39-183.72-35,13.46-69.43,20.75-98.07,18.22-25.4-2.25-57.9-14.91-73.24-38.12-9.13-13.8-11.11-29.85-5.73-46.41s16.42-28.38,31.92-34.19c26-9.76,59.78-.89,81.66,12.21,24.66,14.79,48.23,40.94,68.62,72.39,62.77-26.3,126.45-72,156.85-113.14l10.19,7.53c-31.75,43-95.88,89.46-160.14,116.64,36,59.76,60.58,135,61,188.49Zm-180.65-275.77a58.38,58.38,0,0,0-20.42,3.41c-11.92,4.47-20.11,13.3-24.31,26.24s-2.78,24.89,4.25,35.52c13,19.68,41.41,30.5,63.79,32.48,26,2.31,57.55-4.36,90-16.65-19-29-40.65-53-63-66.37C1213.41,1019.68,1194.56,1013.28,1176.86,1013.28Z"/>
      <path d="M1459.13,1023.71c-30.4-41.17-94.09-86.84-156.85-113.14-20.39,31.45-44,57.6-68.62,72.39-21.88,13.1-55.6,22-81.66,12.21-15.5-5.81-26.54-17.63-31.92-34.19s-3.4-32.61,5.73-46.42c15.34-23.2,47.84-35.86,73.24-38.11,28.65-2.53,63.08,4.77,98.07,18.22,35.32-58.16,60-132.54,60.39-183.72l12.67.1c-.42,53.46-25,128.73-61,188.49,64.26,27.18,128.39,73.64,160.14,116.64ZM1210.7,888.62c-3.6,0-7.11.14-10.53.45-22.37,2-50.78,12.79-63.79,32.48-7,10.62-8.45,22.58-4.25,35.52s12.39,21.77,24.31,26.24c22.11,8.28,51.44.33,70.7-11.22,22.36-13.4,44-37.36,63-66.36C1262,895.05,1234.46,888.62,1210.7,888.62Z"/>
      <path d="M1106,908.71c-11.08,0-21.87-3.66-31.78-10.86-14.09-10.23-21.92-24.38-22.65-40.92-1.23-27.79,17.62-57.13,36.84-73.88,21.69-18.89,53.84-33.22,90.06-42.9-5.62-67.82-29.37-142.5-59.14-184.14l10.3-7.36c31.09,43.49,55.46,118.83,61.45,188.35,68-15.79,147.15-15.9,198.13.23l-3.83,12.08c-48.8-15.44-127.16-14.95-193.39.66,2,37.44-1.71,72.44-13,98.9-10,23.46-32.07,50.46-58.88,57.88A52.84,52.84,0,0,1,1106,908.71Zm73.32-155.53c-33.46,9.12-62.93,22.29-82.59,39.42-16.93,14.76-33.55,40.2-32.51,63.77.56,12.73,6.43,23.23,17.44,31.24s22.81,10.33,35.09,6.93c22.75-6.29,41.81-30,50.61-50.63C1177.57,819.93,1181,787.83,1179.32,753.18Z"/>
      <path d="M1018.63,624.76A18.63,18.63,0,1,1,1000,606.13,18.63,18.63,0,0,1,1018.63,624.76Z"/>
      <path d="M794.51,685.48a18.63,18.63,0,1,1-26-4.12A18.62,18.62,0,0,1,794.51,685.48Z"/>
      <path d="M648.88,866.33a18.63,18.63,0,1,1-23.47,12A18.62,18.62,0,0,1,648.88,866.33Z"/>
      <path d="M637.37,1098.24a18.63,18.63,0,1,1-12,23.47A18.63,18.63,0,0,1,637.37,1098.24Z"/>
      <path d="M764.37,1292.63a18.63,18.63,0,1,1,4.12,26A18.62,18.62,0,0,1,764.37,1292.63Z"/>
      <path d="M981.37,1375.24a18.63,18.63,0,1,1,18.63,18.63A18.63,18.63,0,0,1,981.37,1375.24Z"/>
      <path d="M1205.49,1314.52a18.63,18.63,0,1,1,26,4.12A18.62,18.62,0,0,1,1205.49,1314.52Z"/>
      <path d="M1351.12,1133.67a18.63,18.63,0,1,1,23.47-12A18.63,18.63,0,0,1,1351.12,1133.67Z"/>
      <path d="M1362.63,901.76a18.63,18.63,0,1,1,12-23.47A18.63,18.63,0,0,1,1362.63,901.76Z"/>
      <path d="M1235.63,707.37a18.63,18.63,0,1,1-4.12-26A18.62,18.62,0,0,1,1235.63,707.37Z"/>
    </svg>
  );
}

export type LoginCardProps = {
  onAuthenticated: (session: AuthenticatedSession, redirectTo: "workspace" | "admin") => void;
};

const apiBase = import.meta.env.VITE_API_BASE_URL || "";

type LoginErrorKind = "invalid" | "locked" | "disabled" | "network" | "server";

function messageForError(kind: LoginErrorKind, serverMessage?: string): string {
  switch (kind) {
    case "invalid":
      return serverMessage || "Invalid username or password.";
    case "locked":
      return serverMessage || "This account is temporarily locked. Contact the helpdesk.";
    case "disabled":
      return serverMessage || "This account is disabled. Contact the helpdesk.";
    case "network":
      return "Authentication service is not reachable. Check your connection and try again.";
    default:
      return serverMessage || "Sign-in failed. Try again or contact the helpdesk.";
  }
}

// Flip to true only once a real SSO provider is configured server-side; a
// placeholder secondary button is worse than no button at all.
const SSO_AVAILABLE = false;

export function LoginCard({ onAuthenticated }: LoginCardProps) {
  const { locale, setLocale } = useLocale();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) {
      return;
    }
    setBusy(true);
    setErrorMessage("");

    try {
      const response = await fetch(`${apiBase}/api/v1/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          password,
          tenant: "ist-tech",
          language: locale,
          rememberMe
        })
      });

      let payload: { message?: string; session?: AuthenticatedSession; accessToken?: string; redirectTo?: string } = {};
      try {
        payload = await response.json();
      } catch {
        // non-JSON error body, fall through to status-based message
      }

      if (!response.ok) {
        if (response.status === 423) {
          setErrorMessage(messageForError("locked", payload.message));
        } else if (response.status === 403) {
          setErrorMessage(messageForError("disabled", payload.message));
        } else if (response.status === 401) {
          setErrorMessage(messageForError("invalid", payload.message));
        } else {
          setErrorMessage(messageForError("server", payload.message));
        }
        return;
      }

      if (!payload.session || !payload.accessToken) {
        setErrorMessage(messageForError("server"));
        return;
      }

      setAccessToken(payload.accessToken);
      onAuthenticated(payload.session, payload.redirectTo === "admin" ? "admin" : "workspace");
    } catch {
      setErrorMessage(messageForError("network"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="login-card" onSubmit={submitLogin} aria-busy={busy}>
      <div className="login-brand">
        <BrandMark className="login-brand-mark" />
        <span className="login-brand-word">IST Health</span>
      </div>

      <div className="login-language-switch" role="group" aria-label="Language">
        <button
          type="button"
          className={locale === "en" ? "is-active" : ""}
          onClick={() => setLocale("en")}
          disabled={busy}
        >
          EN
        </button>
        <button
          type="button"
          className={locale === "ar" ? "is-active" : ""}
          onClick={() => setLocale("ar")}
          disabled={busy}
        >
          عربي
        </button>
      </div>

      <div>
        <h1 className="login-title">Sign in to Nurse Cockpit</h1>
        <p className="login-subtitle">Use your assigned clinical credentials to continue.</p>
      </div>

      <div className="login-field">
        <label htmlFor="username">Email or username</label>
        <div className="login-input-row">
          <input
            id="username"
            name="username"
            className="login-input"
            autoComplete="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            disabled={busy}
            required
          />
        </div>
      </div>

      <div className="login-field">
        <label htmlFor="password">Password</label>
        <div className="login-input-row">
          <input
            id="password"
            name="password"
            className="login-input has-toggle"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={busy}
            required
          />
          <button
            type="button"
            className="login-input-toggle"
            onClick={() => setShowPassword((current) => !current)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            title={showPassword ? "Hide password" : "Show password"}
            disabled={busy}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <label className="login-check">
        <input
          type="checkbox"
          checked={rememberMe}
          onChange={(event) => setRememberMe(event.target.checked)}
          disabled={busy}
        />
        <span>Remember this device</span>
      </label>

      {errorMessage && (
        <div className="login-alert" role="alert">
          {errorMessage}
        </div>
      )}

      <button className="login-primary-btn" type="submit" disabled={busy}>
        {busy ? "Signing in..." : "Sign In"}
      </button>

      {SSO_AVAILABLE && (
        <button
          className="login-secondary-btn"
          type="button"
          onClick={() => setErrorMessage("SSO provider is configured in Administration and awaits enterprise metadata.")}
          disabled={busy}
        >
          Use Single Sign-On
        </button>
      )}

      <div className="login-links">
        <a href="#privacy">Privacy policy</a>
        <a href="#terms">Terms of use</a>
        <a href="mailto:helpdesk@irisstar.tech">Helpdesk</a>
      </div>
      <p className="login-legal">IRIS STAR Technologies L.L.C. &middot; IST Health</p>
    </form>
  );
}
