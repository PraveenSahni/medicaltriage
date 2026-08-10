import { useMemo, type JSX } from "react";
import {
  createHashHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider
} from "@tanstack/react-router";
import { formatRole } from "./shared/roleLabels";
import type { AdminNavTab } from "./AdminNav";
import { AdminSidebar } from "./AdminSidebar";
import { useAdminData } from "./AdminDataContext";
import type { AdminData, Session } from "../AdminPortal";
import { UsersPanel as AdminUsersPanel } from "./panels/UsersPanel";
import { RolesPanel } from "./panels/RolesPanel";
import { ResponsibilitiesPanel } from "./panels/ResponsibilitiesPanel";
import { AccessControlPanel } from "./panels/AccessControlPanel";
import {
  OverviewPanel,
  SecurityPanel,
  PrivacyPanel,
  AuditPanel,
  GovernancePanel,
  ProtocolLibraryPanel,
  IntegrationPanel,
  ReportsPanel,
  SupportPanel
} from "./panels/ReadOnlyPanels";

function RootLayout({ tabs, onLogout }: { tabs: AdminNavTab[]; onLogout: () => void }) {
  const { session, status } = useAdminData<AdminData, Session>();

  return (
    <div className="admin-shell-frame">
      <AdminSidebar tabs={tabs} fullName={session.user.fullName} activeRole={session.activeRole} onLogout={onLogout} />
      <div className="admin-shell-main">
        <div className="admin-hero">
          <div>
            <span className="tag-label">CONTROL CENTER</span>
            <h2>Named User Access and Enterprise Controls</h2>
            <p>
              Each role sees only its permitted module: Users, Roles, Responsibilities, Access
              Control, Security, Privacy, Audit, Governance, Protocol Library, Integration,
              Reports, and Support.
            </p>
          </div>
          <div className="admin-session-card">
            <strong>{session.user.fullName}</strong>
            <span>{formatRole(session.activeRole)}</span>
            <small>Session expires {new Date(session.expiresAtIso).toLocaleString()}</small>
          </div>
        </div>
        <div className="status-pill border border-emerald-200 bg-emerald-50 text-emerald-700">{status}</div>
        <Outlet />
      </div>
    </div>
  );
}

function OverviewRoute() {
  const { data } = useAdminData<AdminData, Session>();
  return <OverviewPanel modules={data.modules} dashboard={data.dashboard} />;
}

function SecurityRoute() {
  const { data } = useAdminData<AdminData, Session>();
  return <SecurityPanel providers={data.providers} policies={data.policies} />;
}

function PrivacyRoute() {
  const { data, revealResult, requestReveal } = useAdminData<AdminData, Session>();
  return (
    <PrivacyPanel policies={data.policies} users={data.revealUsers} revealResult={revealResult} onReveal={requestReveal} />
  );
}

function AuditRoute() {
  const { data } = useAdminData<AdminData, Session>();
  return <AuditPanel events={data.events} />;
}

function GovernanceRoute() {
  const { data } = useAdminData<AdminData, Session>();
  return <GovernancePanel items={data.governanceItems} />;
}

function ProtocolsRoute() {
  const { data } = useAdminData<AdminData, Session>();
  return <ProtocolLibraryPanel protocols={data.protocols} />;
}

function IntegrationRoute() {
  const { data } = useAdminData<AdminData, Session>();
  return <IntegrationPanel connectors={data.connectors} />;
}

function ReportsRoute() {
  const { data } = useAdminData<AdminData, Session>();
  return <ReportsPanel reports={data.reports} />;
}

function SupportRoute() {
  const { data } = useAdminData<AdminData, Session>();
  return <SupportPanel tickets={data.tickets} />;
}

function AccessControlRoute() {
  const { session } = useAdminData<AdminData, Session>();
  return <AccessControlPanel permissions={session.permissions} />;
}

function buildRouteTree(tabs: AdminNavTab[], onLogout: () => void) {
  const rootRoute = createRootRoute({
    component: () => <RootLayout tabs={tabs} onLogout={onLogout} />
  });

  const routeFor = (path: string, component: () => JSX.Element) =>
    createRoute({ getParentRoute: () => rootRoute, path, component });

  const overviewRoute = createRoute({ getParentRoute: () => rootRoute, path: "/", component: OverviewRoute });
  const usersRoute = routeFor("/users", AdminUsersPanel);
  const rolesRoute = routeFor("/roles", RolesPanel);
  const responsibilitiesRoute = routeFor("/responsibilities", ResponsibilitiesPanel);
  const accessControlRoute = routeFor("/access-control", AccessControlRoute);
  const securityRoute = routeFor("/security", SecurityRoute);
  const privacyRoute = routeFor("/privacy", PrivacyRoute);
  const auditRoute = routeFor("/audit", AuditRoute);
  const governanceRoute = routeFor("/governance", GovernanceRoute);
  const protocolsRoute = routeFor("/protocols", ProtocolsRoute);
  const integrationRoute = routeFor("/integration", IntegrationRoute);
  const reportsRoute = routeFor("/reports", ReportsRoute);
  const supportRoute = routeFor("/support", SupportRoute);

  return rootRoute.addChildren([
    overviewRoute,
    usersRoute,
    rolesRoute,
    responsibilitiesRoute,
    accessControlRoute,
    securityRoute,
    privacyRoute,
    auditRoute,
    governanceRoute,
    protocolsRoute,
    integrationRoute,
    reportsRoute,
    supportRoute
  ]);
}

// TanStack Router mounted only inside the Admin subtree - basepath "/admin"
// with hash history means this router's own internal routes express as
// #/admin, #/admin/users, #/admin/roles, etc, while App.tsx's own hash
// listener (the outer routing layer for every other view) only ever
// inspects the hash's first path segment and leaves everything after it to
// this router - see the one-line guard added to syncViewFromHash in App.tsx.
export function AdminRouterView({ tabs, onLogout }: { tabs: AdminNavTab[]; onLogout: () => void }) {
  const router = useMemo(() => {
    const routeTree = buildRouteTree(tabs, onLogout);
    return createRouter({
      routeTree,
      history: createHashHistory(),
      basepath: "/admin"
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <RouterProvider router={router} />;
}
