import "./login.css";
import type { ReactNode } from "react";

/**
 * Full-viewport, centered shell for the login screen. No app chrome, no
 * environment banner, no marketing panel - just the page background and a
 * centered slot for the login card, per the approved Nurse Cockpit design
 * reference (docs/protocol-review/nurse-cockpit-open-calls-preview.html).
 */
export function LoginLayout({ children }: { children: ReactNode }) {
  return (
    <div id="login-root">
      <main aria-label="Sign in">{children}</main>
    </div>
  );
}
