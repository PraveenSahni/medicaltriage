import { useEffect, useState } from "react";
import { Plus, Settings, X } from "lucide-react";
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
  system: boolean;
};

type Permission = {
  code: string;
  module: string;
  action: string;
  description: string;
  risk: string;
};

type Responsibility = {
  code: string;
  name: string;
  risk: string;
};

const emptyRoleDraft = {
  code: "",
  name: "",
  description: "",
  reason: "",
  permissions: [] as string[],
  responsibilities: [] as string[]
};

export function RolesPanel() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [responsibilities, setResponsibilities] = useState<Responsibility[]>([]);
  const [status, setStatus] = useState("Loading roles.");
  const [manageRole, setManageRole] = useState<string | null>(null);
  const [grantDrafts, setGrantDrafts] = useState<Record<string, string>>({});
  const [reasonDrafts, setReasonDrafts] = useState<Record<string, string>>({});
  const [rowError, setRowError] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [roleDraft, setRoleDraft] = useState(emptyRoleDraft);
  const elevation = useElevatedAction();

  async function load() {
    setStatus("Loading roles.");
    try {
      const [rolesResult, permissionsResult, responsibilitiesResult] = await Promise.all([
        fetchJson<{ roles: Role[] }>("/api/v1/admin/roles"),
        fetchJson<{ permissions: Permission[] }>("/api/v1/admin/permissions"),
        fetchJson<{ responsibilities: Responsibility[] }>("/api/v1/admin/responsibilities")
      ]);
      setRoles(rolesResult.roles);
      setPermissions(permissionsResult.permissions);
      setResponsibilities(responsibilitiesResult.responsibilities);
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
        await deleteJson(`/api/v1/admin/roles/${roleCode}/permissions/${encodeURIComponent(permissionCode)}`, { reason });
        await load();
      } catch (error) {
        // Real self-lockout guard: revoking admin.roles.manage from the
        // actor's own active role returns 409 - surfaced here, not swallowed.
        setRowError(error instanceof Error ? error.message : "Unable to revoke permission.");
      }
    });
  }

  function toggleDraftValue(field: "permissions" | "responsibilities", value: string) {
    setRoleDraft((current) => ({
      ...current,
      [field]: current[field].includes(value) ? current[field].filter((item) => item !== value) : [...current[field], value]
    }));
  }

  async function createRole() {
    if (!roleDraft.code.trim() || !roleDraft.name.trim() || !roleDraft.description.trim() || !roleDraft.reason.trim()) {
      setRowError("Role code, name, description, and reason are required.");
      return;
    }
    setRowError("");
    await elevation.runElevated(async () => {
      try {
        await postJson("/api/v1/admin/roles", { ...roleDraft, requiresApproval: true });
        setRoleDraft(emptyRoleDraft);
        setCreateOpen(false);
        await load();
      } catch (error) {
        setRowError(error instanceof Error ? error.message : "Unable to create role.");
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
          <strong className="block">{role.name} {role.system && <Badge>System</Badge>}</strong>
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
      <div className="flex items-center justify-between gap-3">
        <div className="status-pill border border-emerald-200 bg-emerald-50 text-emerald-700">{status}</div>
        <Button onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4" /> Create role</Button>
      </div>
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

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Create governed custom role</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <Input placeholder="Role code (example: reporting_specialist)" value={roleDraft.code} onChange={(event) => setRoleDraft((current) => ({ ...current, code: event.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_") }))} />
            <Input placeholder="Role name" value={roleDraft.name} onChange={(event) => setRoleDraft((current) => ({ ...current, name: event.target.value }))} />
            <Input placeholder="Description" value={roleDraft.description} onChange={(event) => setRoleDraft((current) => ({ ...current, description: event.target.value }))} />
            <Input placeholder="Business reason (required)" value={roleDraft.reason} onChange={(event) => setRoleDraft((current) => ({ ...current, reason: event.target.value }))} />
            <div>
              <strong className="text-sm">Permissions</strong>
              <div className="mt-2 grid max-h-40 grid-cols-2 gap-2 overflow-y-auto rounded border p-3">
                {permissions.map((permission) => <label key={permission.code} className="flex items-start gap-2 text-xs"><input type="checkbox" checked={roleDraft.permissions.includes(permission.code)} onChange={() => toggleDraftValue("permissions", permission.code)} /><span>{permission.code} ({permission.risk})</span></label>)}
              </div>
            </div>
            <div>
              <strong className="text-sm">Responsibilities</strong>
              <div className="mt-2 grid max-h-40 grid-cols-2 gap-2 overflow-y-auto rounded border p-3">
                {responsibilities.map((responsibility) => <label key={responsibility.code} className="flex items-start gap-2 text-xs"><input type="checkbox" checked={roleDraft.responsibilities.includes(responsibility.code)} onChange={() => toggleDraftValue("responsibilities", responsibility.code)} /><span>{responsibility.name} ({responsibility.risk})</span></label>)}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Segregation-of-duties and prerequisite checks run before the role is saved. The three system roles remain protected.</p>
            <Button onClick={createRole}>Create custom role</Button>
          </div>
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
