"use client";

import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
  getPaginationRowModel,
} from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { CRMRecord, ImportResult, SkippedRecord } from "@/types";
import {
  CheckCircle2,
  XCircle,
  Users,
  SkipForward,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from "lucide-react";

const CRM_FIELDS: { key: keyof CRMRecord; label: string }[] = [
  { key: "name", label: "Name" },
  { key: "email", label: "Email" },
  { key: "country_code", label: "CC" },
  { key: "mobile_without_country_code", label: "Mobile" },
  { key: "company", label: "Company" },
  { key: "city", label: "City" },
  { key: "state", label: "State" },
  { key: "country", label: "Country" },
  { key: "crm_status", label: "Status" },
  { key: "data_source", label: "Source" },
  { key: "lead_owner", label: "Owner" },
  { key: "crm_note", label: "Notes" },
  { key: "created_at", label: "Created At" },
  { key: "description", label: "Description" },
  { key: "possession_time", label: "Possession" },
];

const STATUS_COLORS: Record<string, string> = {
  GOOD_LEAD_FOLLOW_UP:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  DID_NOT_CONNECT:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  BAD_LEAD: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  SALE_DONE:
    "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
};

const STATUS_LABELS: Record<string, string> = {
  GOOD_LEAD_FOLLOW_UP: "Good Lead",
  DID_NOT_CONNECT: "Did Not Connect",
  BAD_LEAD: "Bad Lead",
  SALE_DONE: "Sale Done",
};

function StatusBadge({ status }: { status: string }) {
  if (!status) return <span className="text-muted-foreground text-xs">—</span>;
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap",
        STATUS_COLORS[status] ?? "bg-muted text-muted-foreground"
      )}
    >
      {STATUS_LABELS[status] ?? status.replace(/_/g, " ")}
    </span>
  );
}

// ---- Imported Table ----
function ImportedTable({ data }: { data: CRMRecord[] }) {
  const columnHelper = createColumnHelper<CRMRecord>();

  const columns = useMemo(
    () =>
      CRM_FIELDS.map(({ key, label }) =>
        columnHelper.accessor(key, {
          id: key,
          header: label,
          cell: (info) => {
            const val = info.getValue();
            if (key === "crm_status")
              return (
                <div className="min-w-[120px]">
                  <StatusBadge status={val} />
                </div>
              );
            if (key === "data_source" && val)
              return (
                <Badge variant="outline" className="text-xs font-normal whitespace-nowrap">
                  {val}
                </Badge>
              );
            return (
              <span
                className={cn(
                  "block max-w-[200px] truncate text-sm",
                  !val && "text-muted-foreground italic text-xs"
                )}
                title={val || undefined}
              >
                {val || "—"}
              </span>
            );
          },
        })
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 25 } },
  });

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
        <XCircle className="w-10 h-10" />
        <p className="text-sm">No records were imported</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-auto max-h-[500px]">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-muted/80 backdrop-blur-sm border-b border-border">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => (
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
                  "transition-colors hover:bg-primary/5",
                  idx % 2 === 0 ? "bg-background" : "bg-muted/20"
                )}
              >
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
      <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-t border-border">
        <p className="text-xs text-muted-foreground">
          Page {table.getState().pagination.pageIndex + 1} of{" "}
          {table.getPageCount()}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="h-7 w-7 p-0"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="h-7 w-7 p-0"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </>
  );
}

// ---- Skipped Table ----
function SkippedTable({ data }: { data: SkippedRecord[] }) {
  const columnHelper = createColumnHelper<SkippedRecord>();

  const columns = useMemo(
    () => [
      columnHelper.accessor("row", {
        header: "Row",
        cell: (info) => (
          <span className="text-sm font-medium">{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor("reason", {
        header: "Reason",
        cell: (info) => (
          <span className="text-sm text-muted-foreground">
            {info.getValue()}
          </span>
        ),
      }),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 25 } },
  });

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
        <CheckCircle2 className="w-10 h-10 text-green-500" />
        <p className="text-sm">No records were skipped</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-auto max-h-[500px]">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-muted/80 backdrop-blur-sm border-b border-border">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => (
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
                  "transition-colors hover:bg-primary/5",
                  idx % 2 === 0 ? "bg-background" : "bg-muted/20"
                )}
              >
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
      <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-t border-border">
        <p className="text-xs text-muted-foreground">
          Page {table.getState().pagination.pageIndex + 1} of{" "}
          {table.getPageCount()}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="h-7 w-7 p-0"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="h-7 w-7 p-0"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </>
  );
}

// ---- Main ResultsView ----
interface ResultsViewProps {
  result: ImportResult;
  onReset: () => void;
}

export function ResultsView({ result, onReset }: ResultsViewProps) {
  const [activeTab, setActiveTab] = useState<"imported" | "skipped">(
    "imported"
  );

  const successRate =
    result.total > 0
      ? Math.round((result.totalImported / result.total) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<Users className="w-5 h-5 text-primary" />}
          label="Total Records"
          value={result.total}
          color="primary"
        />
        <StatCard
          icon={<CheckCircle2 className="w-5 h-5 text-green-500" />}
          label="Imported"
          value={result.totalImported}
          color="green"
        />
        <StatCard
          icon={<SkipForward className="w-5 h-5 text-yellow-500" />}
          label="Skipped"
          value={result.totalSkipped}
          color="yellow"
        />
        <StatCard
          icon={<CheckCircle2 className="w-5 h-5 text-blue-500" />}
          label="Success Rate"
          value={`${successRate}%`}
          color="blue"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab("imported")}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
            activeTab === "imported"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:text-foreground"
          )}
        >
          Imported ({result.totalImported})
        </button>
        {result.totalSkipped > 0 && (
          <button
            onClick={() => setActiveTab("skipped")}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              activeTab === "skipped"
                ? "bg-destructive text-destructive-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            Skipped ({result.totalSkipped})
          </button>
        )}
      </div>

      {/* Table */}
      <div className="relative rounded-xl border border-border overflow-hidden">
        {activeTab === "imported" ? (
          <ImportedTable data={result.imported} />
        ) : (
          <SkippedTable data={result.skipped} />
        )}
      </div>

      {/* Reset button */}
      <div className="flex justify-center">
        <Button onClick={onReset} variant="outline" className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Import Another CSV
        </Button>
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: "primary" | "green" | "yellow" | "blue";
}

function StatCard({ icon, label, value, color }: StatCardProps) {
  const bgMap = {
    primary: "bg-primary/10",
    green: "bg-green-500/10",
    yellow: "bg-yellow-500/10",
    blue: "bg-blue-500/10",
  };

  return (
    <Card className="border-border">
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-center gap-2">
          <div className={cn("p-1.5 rounded-lg", bgMap[color])}>{icon}</div>
          <CardTitle className="text-xs font-medium text-muted-foreground">
            {label}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pb-4 px-4">
        <p className="text-2xl font-bold text-foreground">{value}</p>
      </CardContent>
    </Card>
  );
}
