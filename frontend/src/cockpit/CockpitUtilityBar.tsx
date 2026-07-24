import { ArrowLeft, LogOut } from "lucide-react";
import type { AuthenticatedSession } from "../auth/session";

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
      </div>
    </div>
  );
}
