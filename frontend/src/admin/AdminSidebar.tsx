import { Link } from "@tanstack/react-router";
import { ChevronsLeft, ChevronsRight, LogOut } from "lucide-react";
import { useState } from "react";
import { formatRole } from "./shared/roleLabels";
import { cn } from "./components/lib/utils";
import { Button } from "./components/ui/button";
import { Avatar, AvatarFallback } from "./components/ui/avatar";
import type { AdminNavTab } from "./AdminNav";

type AdminSidebarProps = {
  tabs: AdminNavTab[];
  fullName: string;
  activeRole: string;
  onLogout: () => void;
};

// Real shadcn-admin-style collapsible left sidebar (nav-main pattern),
// replacing the horizontal tab bar - the primary navigation shape the
// upstream reference uses. Router-driven exactly like the tab bar was:
// each item is a real Link to an #/admin/* sub-route, not local state.
export function AdminSidebar({ tabs, fullName, activeRole, onLogout }: AdminSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const initials = fullName
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-border bg-card transition-[width]",
        collapsed ? "w-16" : "w-60"
      )}
    >
      <div className="flex items-center gap-2 border-b border-border px-3 py-3">
        <img className="admin-logo shrink-0" src="/logo-irisstar.svg" alt="" aria-hidden="true" />
        {!collapsed && <span className="truncate text-sm font-bold text-foreground">IST Health | Admin</span>}
      </div>

      <nav className="flex-1 overflow-y-auto py-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <Link
              key={tab.key}
              to={tab.path}
              className="mx-2 mb-1 flex items-center gap-3 rounded-md px-2.5 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
              activeProps={{ className: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground" }}
              title={tab.label}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span className="truncate">{tab.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-2">
        <div className={cn("flex items-center gap-2 rounded-md px-1.5 py-2", collapsed && "justify-center")}>
          <Avatar>
            <AvatarFallback>{initials || "?"}</AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-foreground">{fullName}</div>
              <div className="truncate text-xs text-muted-foreground">{formatRole(activeRole)}</div>
            </div>
          )}
        </div>
        <div className="mt-1 flex gap-1">
          <Button variant="ghost" size="sm" className="flex-1 justify-start" onClick={onLogout}>
            <LogOut className="h-4 w-4" />
            {!collapsed && "Sign out"}
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setCollapsed((current) => !current)} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
            {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </aside>
  );
}
