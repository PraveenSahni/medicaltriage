import { LogOut } from "lucide-react";
import type { AuthenticatedSession } from "../auth/session";

type CockpitUtilityBarProps = {
  session: AuthenticatedSession;
  onLogout: () => void;
};

/**
 * Compact, sidebar-scoped utility row - not a full-width application header.
 * Carries only the essentials the old topbar provided (who's signed in, sign
 * out) so the old AppShell/TopBar never needs to mount for this route.
 */
export function CockpitUtilityBar({ session, onLogout }: CockpitUtilityBarProps) {
  return (
    <div className="cockpit-utility-bar">
      <div className="cockpit-utility-user">
        <span className="cockpit-utility-name">{session.user.fullName}</span>
      </div>
      <div className="cockpit-utility-actions">
        <button
          type="button"
          className="cockpit-utility-btn"
          onClick={onLogout}
          title="Sign out"
          aria-label="Sign out"
        >
          <LogOut size={14} />
        </button>
      </div>
    </div>
  );
}
