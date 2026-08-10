import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

/**
 * Radix primitives (Dialog/DropdownMenu/Select/Popover/Tooltip) portal their
 * content to document.body by default, which escapes both:
 *   1. #admin-root's CSS-variable scope (--background/--foreground/etc, see
 *      administration.css) - variables don't resolve for non-descendant nodes.
 *   2. global.css's app-wide "blank reset" rule, which #admin-root is the
 *      only thing in this app engineered to beat.
 * Every Radix Portal accepts a `container` prop for exactly this reason -
 * this context supplies the real #admin-root DOM node so every shadcn
 * component under admin/components/ui/ can portal into it instead of body.
 */
const AdminPortalContainerContext = createContext<HTMLElement | null>(null);

export function useAdminPortalContainer(): HTMLElement | undefined {
  const container = useContext(AdminPortalContainerContext);
  return container ?? undefined;
}

export function AdminPortalProvider({ children }: { children: ReactNode }) {
  const [container, setContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setContainer(document.getElementById("admin-root"));
  }, []);

  return (
    <AdminPortalContainerContext.Provider value={container}>{children}</AdminPortalContainerContext.Provider>
  );
}
