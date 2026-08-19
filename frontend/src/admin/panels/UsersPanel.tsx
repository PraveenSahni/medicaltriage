import { useEffect, useMemo, useState } from "react";
import { CircleDot, LogOut, MoreHorizontal, ShieldAlert, SlidersHorizontal, UserPlus } from "lucide-react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "../components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../components/ui/dropdown-menu";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover";
import { DataTable, type AdminTableColumn } from "../components/ui/data-table";
import { Pagination } from "../shared/Pagination";
import { ElevationModal } from "../shared/ElevationModal";
import { useElevatedAction } from "../shared/useElevatedAction";
import { deleteJson, fetchJson, patchJson, postJson } from "../shared/adminApi";
import { formatRole } from "../shared/roleLabels";

type SafeAdminUser = {
  id: string;
  employeeId: string;
  fullName: string;
  email: string;
  mobile: string;
  facility: string;
  department: string;
  jobTitle: string;
  mfaStatus: string;
  accountStatus: string;
  roles: string[];
};

type ActiveSession = {
  sessionId: string;
  userId: string;
  activeRole: string;
  authMethod: string;
  mfaVerified: boolean;
  expiresAtIso: string;
};

type RoleOption = { code: string; name: string };

const emptyCreateDraft = {
  fullName: "",
  email: "",
  mobile: "",
  organization: "",
  facility: "",
  department: "",
  jobTitle: "",
  reason: ""
};

const ALL_COLUMN_DEFS: { key: string; label: string }[] = [
  { key: "user", label: "User" },
  { key: "scope", label: "Scope" },
  { key: "access", label: "Access" },
  { key: "controls", label: "Controls" }
];

export function UsersPanel() {
  const [users, setUsers] = useState<SafeAdminUser[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [limit, setLimit] = useState(25);
  const [offset, setOffset] = useState(0);
  const [status, setStatus] = useState("Loading users.");
  const [sessionsUserId, setSessionsUserId] = useState<string | null>(null);
  const [sessionsByUser, setSessionsByUser] = useState<Record<string, ActiveSession[]>>({});
  const [reasonDrafts, setReasonDrafts] = useState<Record<string, string>>({});
  const [rowError, setRowError] = useState("");
  const [roleOptions, setRoleOptions] = useState<RoleOption[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [createDraft, setCreateDraft] = useState(emptyCreateDraft);
  const [createRoles, setCreateRoles] = useState<string[]>([]);
  const [createError, setCreateError] = useState("");
  const [createdCredential, setCreatedCredential] = useState<{ email: string; temporaryPassword: string } | null>(null);
  const [nameFilter, setNameFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<Set<string>>(new Set());
  const [roleFilter, setRoleFilter] = useState<Set<string>>(new Set());
  const [hiddenColumnKeys, setHiddenColumnKeys] = useState<Set<string>>(new Set());
  const [selectedRowKeys, setSelectedRowKeys] = useState<Set<string>>(new Set());
  const [bulkReason, setBulkReason] = useState("");
  const elevation = useElevatedAction();

  async function load() {
    setStatus("Loading users.");
    try {
      const result = await fetchJson<{ users: SafeAdminUser[]; totalCount: number }>(
        `/api/v1/admin/users?limit=${limit}&offset=${offset}`
      );
      setUsers(result.users);
      setTotalCount(result.totalCount);
      setStatus(`${result.totalCount} user(s) total.`);
      setSelectedRowKeys(new Set());
    } catch {
      setStatus("Unable to load users.");
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limit, offset]);

  useEffect(() => {
    (async () => {
      try {
        const result = await fetchJson<{ roles: RoleOption[] }>("/api/v1/admin/roles");
        setRoleOptions(result.roles);
      } catch {
        // Role picker degrades to empty gracefully - the rest of the panel still works.
      }
    })();
  }, []);

  function toggleCreateRole(code: string) {
    setCreateRoles((current) => (current.includes(code) ? current.filter((item) => item !== code) : [...current, code]));
  }

  async function submitCreateUser() {
    const { fullName, email, mobile, organization, facility, department, jobTitle, reason } = createDraft;
    if (!fullName.trim() || !email.trim() || !mobile.trim() || !organization.trim() || !facility.trim() || !department.trim() || !jobTitle.trim()) {
      setCreateError("All fields are required.");
      return;
    }
    if (!email.trim().toLowerCase().endsWith("@irisstar.tech")) {
      setCreateError("Email must be on the @irisstar.tech domain.");
      return;
    }
    if (createRoles.length === 0) {
      setCreateError("Select at least one role.");
      return;
    }
    if (!reason.trim()) {
      setCreateError("A reason is required.");
      return;
    }
    setCreateError("");
    await elevation.runElevated(async () => {
      try {
        const result = await postJson<{ user: SafeAdminUser; temporaryPassword: string }>("/api/v1/admin/users", {
          ...createDraft,
          roles: createRoles
        });
        setCreatedCredential({ email: createDraft.email.trim(), temporaryPassword: result.temporaryPassword });
        setCreateDraft(emptyCreateDraft);
        setCreateRoles([]);
        setCreateOpen(false);
        await load();
      } catch (error) {
        setCreateError(error instanceof Error ? error.message : "Unable to create user.");
      }
    });
  }

  async function openSessions(userId: string) {
    setSessionsUserId(userId);
    try {
      const result = await fetchJson<{ sessions: ActiveSession[] }>(`/api/v1/admin/users/${userId}/sessions`);
      setSessionsByUser((current) => ({ ...current, [userId]: result.sessions }));
    } catch {
      setRowError("Unable to load sessions for this user.");
    }
  }

  async function terminateSession(userId: string, sessionId: string) {
    setRowError("");
    await elevation.runElevated(async () => {
      try {
        await deleteJson(`/api/v1/admin/sessions/${sessionId}`);
        const result = await fetchJson<{ sessions: ActiveSession[] }>(`/api/v1/admin/users/${userId}/sessions`);
        setSessionsByUser((current) => ({ ...current, [userId]: result.sessions }));
      } catch (error) {
        setRowError(error instanceof Error ? error.message : "Unable to terminate session.");
      }
    });
  }

  async function changeStatus(userId: string, nextStatus: "active" | "suspended") {
    const reason = reasonDrafts[userId]?.trim();
    if (!reason) {
      setRowError("A reason is required before changing account status.");
      return;
    }
    setRowError("");
    await elevation.runElevated(async () => {
      try {
        await patchJson(`/api/v1/admin/users/${userId}/status`, { status: nextStatus, reason });
        await load();
      } catch (error) {
        setRowError(error instanceof Error ? error.message : "Unable to change account status.");
      }
    });
  }

  async function resetMfa(userId: string) {
    setRowError("");
    await elevation.runElevated(async () => {
      try {
        await postJson(`/api/v1/admin/users/${userId}/mfa-reset`, {});
        await load();
      } catch (error) {
        setRowError(error instanceof Error ? error.message : "Unable to reset MFA for this user.");
      }
    });
  }

  async function issueTemporaryCredential(user: SafeAdminUser) {
    const reason = reasonDrafts[user.id]?.trim();
    if (!reason) {
      setRowError("A reason is required before issuing a temporary credential.");
      return;
    }
    setRowError("");
    await elevation.runElevated(async () => {
      try {
        const result = await postJson<{ temporaryPassword: string }>(`/api/v1/admin/users/${user.id}/temporary-credential`, { reason });
        setCreatedCredential({ email: user.email, temporaryPassword: result.temporaryPassword });
        await load();
      } catch (error) {
        setRowError(error instanceof Error ? error.message : "Unable to issue temporary credential.");
      }
    });
  }

  // Real bulk action - loops the same PATCH .../status endpoint per selected
  // user (no dedicated bulk-status route exists), each elevation-checked the
  // same way a single-row change is. One shared reason applies to the whole
  // selection, same requirement the single-row flow already enforces.
  async function bulkChangeStatus(nextStatus: "active" | "suspended") {
    if (!bulkReason.trim()) {
      setRowError("A reason is required before applying a bulk status change.");
      return;
    }
    setRowError("");
    await elevation.runElevated(async () => {
      const failures: string[] = [];
      for (const userId of selectedRowKeys) {
        try {
          await patchJson(`/api/v1/admin/users/${userId}/status`, { status: nextStatus, reason: bulkReason.trim() });
        } catch (error) {
          failures.push(userId);
        }
      }
      if (failures.length > 0) {
        setRowError(`Unable to update ${failures.length} of ${selectedRowKeys.size} selected user(s).`);
      }
      setBulkReason("");
      await load();
    });
  }

  const visibleUsers = useMemo(() => {
    return users.filter((user) => {
      if (nameFilter.trim() && !user.fullName.toLowerCase().includes(nameFilter.trim().toLowerCase())) {
        return false;
      }
      if (statusFilter.size > 0 && !statusFilter.has(user.accountStatus)) {
        return false;
      }
      if (roleFilter.size > 0 && !user.roles.some((role) => roleFilter.has(role))) {
        return false;
      }
      return true;
    });
  }, [users, nameFilter, statusFilter, roleFilter]);

  function toggleSetValue(set: Set<string>, value: string, setter: (next: Set<string>) => void) {
    const next = new Set(set);
    if (next.has(value)) {
      next.delete(value);
    } else {
      next.add(value);
    }
    setter(next);
  }

  const columns: AdminTableColumn<SafeAdminUser>[] = [
    {
      key: "user",
      label: "User",
      render: (user) => (
        <div>
          <strong className="block">{user.fullName}</strong>
          <small className="text-muted-foreground">
            {user.email} | {user.mobile}
          </small>
        </div>
      )
    },
    {
      key: "scope",
      label: "Scope",
      render: (user) => (
        <div>
          <strong className="block">{user.facility}</strong>
          <small className="text-muted-foreground">{user.department}</small>
        </div>
      )
    },
    {
      key: "access",
      label: "Access",
      render: (user) => (
        <div>
          <Badge variant={user.accountStatus === "suspended" ? "destructive" : "success"}>{user.accountStatus}</Badge>
          <small className="mt-1 block text-muted-foreground">{user.roles.join(", ")}</small>
        </div>
      )
    },
    {
      key: "controls",
      label: "Controls",
      render: (user) => (
        <div className="flex items-center gap-2">
          <Input
            type="text"
            placeholder="Reason (required)"
            className="w-40"
            value={reasonDrafts[user.id] ?? ""}
            onChange={(event) => setReasonDrafts((current) => ({ ...current, [user.id]: event.target.value }))}
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" aria-label={`Actions for ${user.fullName}`}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {user.accountStatus === "suspended" ? (
                <DropdownMenuItem onClick={() => changeStatus(user.id, "active")}>
                  <ShieldAlert className="h-4 w-4" /> Reactivate
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => changeStatus(user.id, "suspended")}>
                  <ShieldAlert className="h-4 w-4" /> Suspend
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => resetMfa(user.id)}>Reset MFA</DropdownMenuItem>
              <DropdownMenuItem onClick={() => issueTemporaryCredential(user)}>Issue temporary credential</DropdownMenuItem>
              <DropdownMenuItem onClick={() => openSessions(user.id)}>View sessions</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )
    }
  ];

  const statusOptions = ["active", "suspended"];

  return (
    <section className="admin-stack">
      <div className="status-pill border border-emerald-200 bg-emerald-50 text-emerald-700">{status}</div>
      {rowError && <div className="login-alert">{rowError}</div>}
      {createdCredential && (
        <div className="login-alert">
          Account created for {createdCredential.email}. Temporary password (shown once):{" "}
          <strong>{createdCredential.temporaryPassword}</strong>
          <Button variant="ghost" size="sm" className="ml-3" onClick={() => setCreatedCredential(null)}>
            Dismiss
          </Button>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Input
          type="text"
          placeholder="Filter users..."
          className="w-56"
          value={nameFilter}
          onChange={(event) => setNameFilter(event.target.value)}
        />

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              <CircleDot className="h-4 w-4" /> Status {statusFilter.size > 0 && `(${statusFilter.size})`}
            </Button>
          </PopoverTrigger>
          <PopoverContent>
            <div className="grid gap-2">
              {statusOptions.map((option) => (
                <label key={option} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={statusFilter.has(option)}
                    onChange={() => toggleSetValue(statusFilter, option, setStatusFilter)}
                  />
                  {option}
                </label>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              <CircleDot className="h-4 w-4" /> Role {roleFilter.size > 0 && `(${roleFilter.size})`}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="max-h-64 overflow-y-auto">
            <div className="grid gap-2">
              {roleOptions.map((role) => (
                <label key={role.code} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={roleFilter.has(role.code)}
                    onChange={() => toggleSetValue(roleFilter, role.code, setRoleFilter)}
                  />
                  {formatRole(role.code)}
                </label>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <div className="flex-1" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <SlidersHorizontal className="h-4 w-4" /> View
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {ALL_COLUMN_DEFS.map((column) => (
              <label key={column.key} className="flex items-center gap-2 px-2 py-1.5 text-sm">
                <input
                  type="checkbox"
                  checked={!hiddenColumnKeys.has(column.key)}
                  onChange={() => toggleSetValue(hiddenColumnKeys, column.key, setHiddenColumnKeys)}
                />
                {column.label}
              </label>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4" /> Create user
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create a new named-user account</DialogTitle>
              <DialogDescription>This is the only place in the application that creates a new user account.</DialogDescription>
            </DialogHeader>
            {createError && <div className="login-alert">{createError}</div>}
            <div className="grid grid-cols-2 gap-3">
              {(
                [
                  ["fullName", "Full name"],
                  ["email", "Email (must end in @irisstar.tech)"],
                  ["mobile", "Mobile"],
                  ["organization", "Organization"],
                  ["facility", "Facility"],
                  ["department", "Department"],
                  ["jobTitle", "Job title"],
                  ["reason", "Reason (required)"]
                ] as const
              ).map(([field, label]) => (
                <div key={field} className="grid gap-1.5">
                  <Label htmlFor={`create-${field}`}>{label}</Label>
                  <Input
                    id={`create-${field}`}
                    type={field === "email" ? "email" : "text"}
                    value={createDraft[field]}
                    onChange={(event) => setCreateDraft((current) => ({ ...current, [field]: event.target.value }))}
                  />
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {roleOptions.map((role) => (
                <label key={role.code} className="status-pill border border-emerald-200 bg-emerald-50 text-emerald-700">
                  <input
                    type="checkbox"
                    checked={createRoles.includes(role.code)}
                    onChange={() => toggleCreateRole(role.code)}
                    style={{ marginRight: 6 }}
                  />
                  {formatRole(role.code)}
                </label>
              ))}
            </div>
            <DialogFooter>
              <Button onClick={submitCreateUser}>
                <UserPlus className="h-4 w-4" /> Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {selectedRowKeys.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-muted p-2">
          <span className="text-sm font-medium">{selectedRowKeys.size} selected</span>
          <Input
            type="text"
            placeholder="Reason for bulk action (required)"
            className="w-64"
            value={bulkReason}
            onChange={(event) => setBulkReason(event.target.value)}
          />
          <Button variant="outline" size="sm" onClick={() => bulkChangeStatus("suspended")}>
            Suspend selected
          </Button>
          <Button variant="outline" size="sm" onClick={() => bulkChangeStatus("active")}>
            Reactivate selected
          </Button>
        </div>
      )}

      <DataTable
        columns={columns}
        rows={visibleUsers}
        getRowKey={(user) => user.id}
        emptyMessage="No users found."
        selectedRowKeys={selectedRowKeys}
        onSelectionChange={setSelectedRowKeys}
        hiddenColumnKeys={hiddenColumnKeys}
      />

      <Dialog open={sessionsUserId !== null} onOpenChange={(open) => !open && setSessionsUserId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Active sessions</DialogTitle>
          </DialogHeader>
          <div className="admin-list">
            {(sessionsUserId ? sessionsByUser[sessionsUserId] ?? [] : []).map((session) => (
              <div key={session.sessionId}>
                <strong>{session.activeRole}</strong>
                <span>
                  {session.authMethod} | MFA verified: {session.mfaVerified ? "yes" : "no"}
                </span>
                <small>Expires {new Date(session.expiresAtIso).toLocaleString()}</small>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => sessionsUserId && terminateSession(sessionsUserId, session.sessionId)}
                >
                  <LogOut className="h-4 w-4" /> Terminate
                </Button>
              </div>
            ))}
            {sessionsUserId && (sessionsByUser[sessionsUserId] ?? []).length === 0 && <div>No active sessions for this user.</div>}
          </div>
        </DialogContent>
      </Dialog>

      <Pagination limit={limit} offset={offset} totalCount={totalCount} onChange={(next) => { setLimit(next.limit); setOffset(next.offset); }} />
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
