"use client";

import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface PreviewTableProps {
  headers: string[];
  rows: Record<string, string>[];
  maxPreviewRows?: number;
}

export function PreviewTable({
  headers,
  rows,
  maxPreviewRows = 100,
}: PreviewTableProps) {
  const columnHelper = createColumnHelper<Record<string, string>>();
  const displayRows = rows.slice(0, maxPreviewRows);

  const columns = useMemo(
    () =>
      headers.map((header) =>
        columnHelper.accessor(header, {
          id: header,
          header: header,
          cell: (info) => {
            const val = info.getValue();
            return (
              <span
                className={cn(
                  "block max-w-[200px] truncate text-sm",
                  !val && "text-muted-foreground italic"
                )}
                title={val || "—"}
              >
                {val || "—"}
              </span>
            );
          },
        })
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [headers]
  );

  const table = useReactTable({
    data: displayRows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="relative rounded-xl border border-border overflow-hidden">
      <div className="overflow-auto max-h-[400px]">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-muted/80 backdrop-blur-sm border-b border-border">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground w-10 border-r border-border">
                  #
                </th>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left text-xs font-semibold text-foreground whitespace-nowrap border-r border-border last:border-r-0"
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-border">
            {table.getRowModel().rows.map((row, idx) => (
              <tr
                key={row.id}
                className={cn(
                  "transition-colors",
                  idx % 2 === 0 ? "bg-background" : "bg-muted/20",
                  "hover:bg-primary/5"
                )}
              >
                <td className="px-3 py-2.5 text-xs text-muted-foreground border-r border-border">
                  {idx + 1}
                </td>
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className="px-4 py-2.5 border-r border-border last:border-r-0"
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {rows.length > maxPreviewRows && (
        <div className="px-4 py-2 bg-muted/40 border-t border-border text-xs text-muted-foreground">
          Showing {maxPreviewRows} of {rows.length} rows — all rows will be
          processed on import
        </div>
      )}
    </div>
  );
}
