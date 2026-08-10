import type { ReactNode } from "react";

export type AdminTableColumn<T> = {
  key: string;
  label: string;
  render: (row: T) => ReactNode;
};

type AdminTableProps<T> = {
  columns: AdminTableColumn<T>[];
  rows: T[];
  getRowKey: (row: T) => string;
  emptyMessage?: string;
};

// Reuses the real .admin-table/.admin-table-row/.admin-table-head classes
// already defined in global.css - only the column count varies per usage
// (that CSS hardcodes a 4-column grid), so grid-template-columns is set
// inline per instance rather than duplicating the class for every column
// count.
export function AdminTable<T>({ columns, rows, getRowKey, emptyMessage }: AdminTableProps<T>) {
  const gridTemplateColumns = columns.map(() => "minmax(160px, 1fr)").join(" ");

  return (
    <div className="admin-table">
      <div className="admin-table-row admin-table-head" style={{ gridTemplateColumns }}>
        {columns.map((column) => (
          <span key={column.key}>{column.label}</span>
        ))}
      </div>
      {rows.length === 0 && (
        <div className="admin-table-row" style={{ gridTemplateColumns }}>
          <span>{emptyMessage ?? "No records."}</span>
        </div>
      )}
      {rows.map((row) => (
        <div key={getRowKey(row)} className="admin-table-row" style={{ gridTemplateColumns }}>
          {columns.map((column) => (
            <span key={column.key}>{column.render(row)}</span>
          ))}
        </div>
      ))}
    </div>
  );
}
