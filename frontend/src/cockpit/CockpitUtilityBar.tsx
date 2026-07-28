import { ArrowLeft, HelpCircle, LogOut } from "lucide-react";
import type { AuthenticatedSession } from "../auth/session";
import { getAccessToken } from "../authToken";

type CockpitUtilityBarProps = {
  session: AuthenticatedSession;
  onLogout: () => void;
  onBack?: () => void;
};

/**
 * Compact, sidebar-scoped utility row - not a full-width application header.
 * Carries only the essentials the old topbar provided (who's signed in, sign
 * out) so the old AppShell/TopBar never needs to mount for this route.
 * `onBack` (when provided) is the only way out of this route back to
 * wherever the user came from (Kanban, the Service Manager Board, etc.),
 * since the Cockpit route bypasses that shell's own topbar entirely -
 * without it there is no way back once a user enters here. The caller
 * decides the actual destination; this button is destination-agnostic.
 */
export function CockpitUtilityBar({ session, onLogout, onBack }: CockpitUtilityBarProps) {
  return (
    <div className="cockpit-utility-bar">
      <div className="cockpit-utility-user">
        <span className="cockpit-utility-name">{session.user.fullName}</span>
      </div>
      <div className="cockpit-utility-actions">
        {onBack && (
          <button
            type="button"
            className="cockpit-utility-btn"
            onClick={onBack}
            title="Back"
            aria-label="Back"
          >
            <ArrowLeft size={14} />
          </button>
        )}
        <button
          type="button"
          className="cockpit-utility-btn"
          onClick={onLogout}
          title="Sign out"
          aria-label="Sign out"
        >
          <LogOut size={14} />
        </button>
        {/* Opens the standalone Help & Library page in a new tab (server-
            rendered at GET /help, outside the SPA bundle) - a plain link, not
            a client-side action, so this workspace's own state is never
            touched by clicking it. The access token is appended as a query
            param because a plain top-level navigation can't carry a custom
            Authorization header, and Firebase Hosting's rewrite-to-Cloud-Run
            proxy on the custom domain does not forward the Cookie header
            either - see helpRouter.ts's /help handler. */}
        <a
          className="cockpit-utility-btn"
          href={`/help${getAccessToken() ? `?token=${encodeURIComponent(getAccessToken()!)}` : ""}`}
          target="_blank"
          rel="noopener noreferrer"
          title="Help"
          aria-label="Help"
        >
          <HelpCircle size={14} />
        </a>
      </div>
    </div>
  );
}
