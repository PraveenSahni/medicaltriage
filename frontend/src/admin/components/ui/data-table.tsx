import { flexRender, getCoreRowModel, useReactTable, type ColumnDef } from "@tanstack/react-table";
import type { ReactNode } from "react";
import { Checkbox } from "./checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./table";

// Same public column-config shape the old div-grid AdminTable used
// (key/label/render) so every existing panel's column array ports 1:1 -
// internally mapped into TanStack Table's ColumnDef so real row-model
// infrastructure (sorting/filtering, available but off by default here) is
// in place without changing any call site's column definitions.
export type AdminTableColumn<T> = {
  key: string;
  label: string;
  render: (row: T) => ReactNode;
};

type DataTableProps<T> = {
  columns: AdminTableColumn<T>[];
  rows: T[];
  getRowKey: (row: T) => string;
  emptyMessage?: string;
  /** Real shadcn-admin data-table pattern: a leading checkbox column for
      bulk row selection. Selection state is owned by the caller (which
      knows which bulk action, if any, to apply) - this component only
      renders the checkboxes and reports changes. */
  selectedRowKeys?: Set<string>;
  onSelectionChange?: (next: Set<string>) => void;
  /** Column-visibility support: hide these column keys entirely. Paired
      with ColumnVisibilityMenu below. */
  hiddenColumnKeys?: Set<string>;
};

export function DataTable<T>({
  columns,
  rows,
  getRowKey,
  emptyMessage,
  selectedRowKeys,
  onSelectionChange,
  hiddenColumnKeys
}: DataTableProps<T>) {
  const visibleColumns = hiddenColumnKeys ? columns.filter((column) => !hiddenColumnKeys.has(column.key)) : columns;
  const enableSelection = Boolean(selectedRowKeys && onSelectionChange);

  const columnDefs: ColumnDef<T>[] = visibleColumns.map((column) => ({
    id: column.key,
    header: column.label,
    cell: ({ row }) => column.render(row.original)
  }));

  const table = useReactTable({
    data: rows,
    columns: columnDefs,
    getRowId: getRowKey,
    getCoreRowModel: getCoreRowModel()
  });

  const allRowKeys = rows.map(getRowKey);
  const allSelected = enableSelection && allRowKeys.length > 0 && allRowKeys.every((key) => selectedRowKeys!.has(key));
  const someSelected = enableSelection && allRowKeys.some((key) => selectedRowKeys!.has(key));

  function toggleAll() {
    if (!onSelectionChange) return;
    onSelectionChange(allSelected ? new Set() : new Set(allRowKeys));
  }

  function toggleRow(key: string) {
    if (!selectedRowKeys || !onSelectionChange) return;
    const next = new Set(selectedRowKeys);
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    onSelectionChange(next);
  }

  return (
    <Table>
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {enableSelection && (
              <TableHead className="w-10">
                <Checkbox
                  checked={someSelected ? (allSelected ? true : "indeterminate") : false}
                  onCheckedChange={toggleAll}
                  aria-label="Select all rows"
                />
              </TableHead>
            )}
            {headerGroup.headers.map((header) => (
              <TableHead key={header.id}>{flexRender(header.column.columnDef.header, header.getContext())}</TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows.length === 0 && (
          <TableRow>
            <TableCell colSpan={visibleColumns.length + (enableSelection ? 1 : 0)} className="text-center text-muted-foreground">
              {emptyMessage ?? "No records."}
            </TableCell>
          </TableRow>
        )}
        {table.getRowModel().rows.map((row) => (
          <TableRow key={row.id}>
            {enableSelection && (
              <TableCell>
                <Checkbox
                  checked={selectedRowKeys!.has(row.id)}
                  onCheckedChange={() => toggleRow(row.id)}
                  aria-label={`Select row ${row.id}`}
                />
              </TableCell>
            )}
            {row.getVisibleCells().map((cell) => (
              <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
