import { useEffect, useState } from "react";
import { Settings, X } from "lucide-react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { DataTable, type AdminTableColumn } from "../components/ui/data-table";
import { ElevationModal } from "../shared/ElevationModal";
import { useElevatedAction } from "../shared/useElevatedAction";
import { deleteJson, fetchJson, postJson } from "../shared/adminApi";

type Role = {
  code: string;
  name: string;
  description: string;
  permissions: string[];
  responsibilities: string[];
  status: string;
};

type Permission = {
  code: string;
  module: string;
  action: string;
  description: string;
  risk: string;
};

export function RolesPanel() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [status, setStatus] = useState("Loading roles.");
  const [manageRole, setManageRole] = useState<string | null>(null);
  const [grantDrafts, setGrantDrafts] = useState<Record<string, string>>({});
  const [reasonDrafts, setReasonDrafts] = useState<Record<string, string>>({});
  const [rowError, setRowError] = useState("");
  const elevation = useElevatedAction();

  async function load() {
    setStatus("Loading roles.");
    try {
      const [rolesResult, permissionsResult] = await Promise.all([
        fetchJson<{ roles: Role[] }>("/api/v1/admin/roles"),
        fetchJson<{ permissions: Permission[] }>("/api/v1/admin/permissions")
      ]);
      setRoles(rolesResult.roles);
      setPermissions(permissionsResult.permissions);
      setStatus(`${rolesResult.roles.length} role(s) loaded.`);
    } catch {
      setStatus("Unable to load roles.");
    }
  }

  useEffect(() => {
    load();
  }, []);

  function reasonFor(roleCode: string): string | undefined {
    const reason = reasonDrafts[roleCode]?.trim();
    return reason && reason.length > 0 ? reason : undefined;
  }

  async function grantPermission(roleCode: string) {
    const permissionCode = grantDrafts[roleCode];
    const reason = reasonFor(roleCode);
    if (!permissionCode || !reason) {
      setRowError("Select a permission and provide a reason before granting.");
      return;
    }
    setRowError("");
    await elevation.runElevated(async () => {
      try {
        await postJson(`/api/v1/admin/roles/${roleCode}/permissions`, { permissionCode, reason });
        await load();
      } catch (error) {
        setRowError(error instanceof Error ? error.message : "Unable to grant permission.");
      }
    });
  }

  async function revokePermission(roleCode: string, permissionCode: string) {
    const reason = reasonFor(roleCode);
    if (!reason) {
      setRowError("Provide a reason before revoking a permission.");
      return;
    }
    setRowError("");
    await elevation.runElevated(async () => {
      try {
        await deleteJson(`/api/v1/admin/roles/${roleCode}/permissions/${encodeURIComponent(permissionCode)}`);
        await load();
      } catch (error) {
        // Real self-lockout guard: revoking admin.roles.manage from the
        // actor's own active role returns 409 - surfaced here, not swallowed.
        setRowError(error instanceof Error ? error.message : "Unable to revoke permission.");
      }
    });
  }

  const grantablePermissionsFor = (role: Role) => permissions.filter((permission) => !role.permissions.includes(permission.code));
  const activeRole = roles.find((role) => role.code === manageRole) ?? null;

  const columns: AdminTableColumn<Role>[] = [
    {
      key: "role",
      label: "Role",
      render: (role) => (
        <div>
          <strong className="block">{role.name}</strong>
          <small className="text-muted-foreground">{role.description}</small>
        </div>
      )
    },
    { key: "permissions", label: "Permissions", render: (role) => `${role.permissions.length} permission(s)` },
    { key: "status", label: "Status", render: (role) => role.status },
    {
      key: "manage",
      label: "Manage",
      render: (role) => (
        <Button variant="outline" size="sm" onClick={() => setManageRole(role.code)}>
          <Settings className="h-4 w-4" /> Manage
        </Button>
      )
    }
  ];

  return (
    <section className="admin-stack">
      <div className="status-pill border border-emerald-200 bg-emerald-50 text-emerald-700">{status}</div>
      {rowError && <div className="login-alert">{rowError}</div>}
      <DataTable columns={columns} rows={roles} getRowKey={(role) => role.code} emptyMessage="No roles found." />

      <Dialog open={manageRole !== null} onOpenChange={(open) => !open && setManageRole(null)}>
        <DialogContent className="max-w-lg">
          {activeRole && (
            <>
              <DialogHeader>
                <DialogTitle>{activeRole.name}</DialogTitle>
              </DialogHeader>
              <div className="flex flex-wrap gap-2">
                {activeRole.permissions.map((permissionCode) => (
                  <Badge key={permissionCode} variant="success">
                    {permissionCode}
                    <button
                      type="button"
                      aria-label={`Revoke ${permissionCode} from ${activeRole.name}`}
                      onClick={() => revokePermission(activeRole.code, permissionCode)}
                      className="ml-1"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="grid gap-2">
                <Input
                  type="text"
                  placeholder="Reason (required)"
                  value={reasonDrafts[activeRole.code] ?? ""}
                  onChange={(event) => setReasonDrafts((current) => ({ ...current, [activeRole.code]: event.target.value }))}
                />
                <Select
                  value={grantDrafts[activeRole.code] ?? ""}
                  onValueChange={(value) => setGrantDrafts((current) => ({ ...current, [activeRole.code]: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Grant a permission..." />
                  </SelectTrigger>
                  <SelectContent>
                    {grantablePermissionsFor(activeRole).map((permission) => (
                      <SelectItem key={permission.code} value={permission.code}>
                        {permission.code} ({permission.risk})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={() => grantPermission(activeRole.code)}>Grant</Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <ElevationModal
        open={elevation.modalOpen}
        error={elevation.modalError}
        submitting={elevation.submitting}
        onSubmit={elevation.submitCode}
        onClose={elevation.closeModal}
      />
    </section>
  );
}
