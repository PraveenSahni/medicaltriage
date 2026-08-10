import { createContext, useContext } from "react";
import type { ReactNode } from "react";

// TanStack Router's own `context` option is meant for relatively static
// values (created once per router instance); AdminPortal's existing
// centralized data-loading effect produces state that changes over time
// (permissions-gated fetches, reveal results). A plain React context
// wrapping <RouterProvider> avoids re-creating the router on every render
// while still letting every leaf route read the current data - the same
// pattern used elsewhere in this app (e.g. QueueContext).
export type AdminDataContextValue<TData, TSession> = {
  data: TData;
  session: TSession;
  status: string;
  revealResult: string;
  requestReveal: (userId: string, field: string) => void;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const AdminDataContext = createContext<AdminDataContextValue<any, any> | null>(null);

export function AdminDataProvider<TData, TSession>({
  value,
  children
}: {
  value: AdminDataContextValue<TData, TSession>;
  children: ReactNode;
}) {
  return <AdminDataContext.Provider value={value}>{children}</AdminDataContext.Provider>;
}

export function useAdminData<TData, TSession>(): AdminDataContextValue<TData, TSession> {
  const context = useContext(AdminDataContext);
  if (!context) {
    throw new Error("useAdminData must be used within AdminDataProvider");
  }
  return context;
}
