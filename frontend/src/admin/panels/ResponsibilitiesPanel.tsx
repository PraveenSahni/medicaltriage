import { useEffect, useState } from "react";
import { formatRole } from "../shared/roleLabels";
import { fetchJson } from "../shared/adminApi";
import { Badge } from "../components/ui/badge";
import { DataTable, type AdminTableColumn } from "../components/ui/data-table";

type Responsibility = {
  code: string;
  name: string;
  module: string;
  businessFunction: string;
  risk: string;
  conflictingResponsibilities: string[];
};

type Role = {
  code: string;
  name: string;
  responsibilities: string[];
};

const RISK_BADGE_VARIANT: Record<string, "default" | "success" | "warning" | "destructive"> = {
  low: "success",
  medium: "warning",
  high: "warning",
  critical: "destructive"
};

export function ResponsibilitiesPanel() {
  const [responsibilities, setResponsibilities] = useState<Responsibility[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [status, setStatus] = useState("Loading responsibilities.");

  useEffect(() => {
    (async () => {
      try {
        const [responsibilitiesResult, rolesResult] = await Promise.all([
          fetchJson<{ responsibilities: Responsibility[] }>("/api/v1/admin/responsibilities"),
          fetchJson<{ roles: Role[] }>("/api/v1/admin/roles")
        ]);
        setResponsibilities(responsibilitiesResult.responsibilities);
        setRoles(rolesResult.roles);
        setStatus(`${responsibilitiesResult.responsibilities.length} responsibility/ies across ${rolesResult.roles.length} role(s).`);
      } catch {
        setStatus("Unable to load responsibilities.");
      }
    })();
  }, []);

  const responsibilityNameByCode = new Map(responsibilities.map((item) => [item.code, item.name]));

  const columns: AdminTableColumn<Responsibility>[] = [
    {
      key: "name",
      label: "Responsibility",
      render: (item) => (
        <div>
          <strong className="block">{item.name}</strong>
          <small className="text-muted-foreground">
            {item.module} | {item.businessFunction}
          </small>
        </div>
      )
    },
    {
      key: "risk",
      label: "Risk",
      render: (item) => <Badge variant={RISK_BADGE_VARIANT[item.risk] ?? "default"}>{item.risk}</Badge>
    },
    { key: "conflicts", label: "Conflicts", render: (item) => item.conflictingResponsibilities.length }
  ];

  return (
    <section className="admin-stack">
      <div className="status-pill border border-emerald-200 bg-emerald-50 text-emerald-700">{status}</div>
      <article className="help-card help-card-wide">
        <h3 className="help-title">Responsibility catalog</h3>
        <p>Business functions with real risk classification and conflict tracking.</p>
        <DataTable columns={columns} rows={responsibilities} getRowKey={(item) => item.code} emptyMessage="No responsibilities found." />
      </article>
      <article className="help-card help-card-wide">
        <h3 className="help-title">Role &times; Responsibility matrix</h3>
        <div className="admin-list">
          {roles.map((role) => (
            <div key={role.code}>
              <strong>{formatRole(role.code)}</strong>
              <div className="flex flex-wrap gap-2 mt-1">
                {role.responsibilities.length === 0 && <small className="text-muted-foreground">No responsibilities assigned.</small>}
                {role.responsibilities.map((code) => (
                  <Badge key={`${role.code}-${code}`} variant="warning">
                    {responsibilityNameByCode.get(code) ?? code}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}
