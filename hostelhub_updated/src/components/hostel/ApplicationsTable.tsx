import { ChevronRight, FileText } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fmtDateTime } from "@/lib/hostel/format";
import { gateState, getStudent } from "@/lib/hostel/logic";
import type { Application, DB } from "@/lib/hostel/types";
import { EmptyState, GateBadge, StatusBadge, StudentAvatar } from "./ui-bits";

export function ApplicationsTable({
  db,
  apps,
  now,
  showStudent = false,
  onSelect,
  emptyTitle = "No applications",
  emptyDescription,
}: {
  db: DB;
  apps: Application[];
  now: number;
  showStudent?: boolean;
  onSelect?: (a: Application) => void;
  emptyTitle?: string;
  emptyDescription?: string | undefined;
}) {
  if (apps.length === 0) return <EmptyState icon={FileText} title={emptyTitle} description={emptyDescription} />;
  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-card">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/60 hover:bg-muted/60">
              <TableHead className="pl-5">Application</TableHead>
              {showStudent && <TableHead>Student</TableHead>}
              <TableHead>Type</TableHead>
              <TableHead>Destination</TableHead>
              <TableHead>Departure</TableHead>
              <TableHead>Return</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Gate</TableHead>
              {onSelect && <TableHead className="w-8" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {apps.map((a) => {
              const st = getStudent(db, a.studentId);
              return (
                <TableRow
                  key={a.id}
                  className={onSelect ? "cursor-pointer" : undefined}
                  onClick={onSelect ? () => onSelect(a) : undefined}
                >
                  <TableCell className="pl-5 font-mono text-xs font-semibold text-primary">{a.id}</TableCell>
                  {showStudent && (
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <StudentAvatar name={st?.name ?? "?"} size="sm" />
                        <div className="min-w-0 leading-tight">
                          <div className="whitespace-nowrap text-sm font-medium">{st?.name}</div>
                          <div className="font-mono text-[11px] text-muted-foreground">{st?.usn}</div>
                        </div>
                      </div>
                    </TableCell>
                  )}
                  <TableCell className="whitespace-nowrap text-sm">{a.type}</TableCell>
                  <TableCell className="max-w-[200px] truncate text-sm">{a.destination}</TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">{fmtDateTime(a.departure)}</TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">{fmtDateTime(a.expectedReturn)}</TableCell>
                  <TableCell>
                    <StatusBadge status={a.status} />
                    {a.status === "rejected" && a.rejectionReason && !showStudent && (
                      <p className="mt-1 max-w-[220px] text-xs text-destructive">{a.rejectionReason}</p>
                    )}
                  </TableCell>
                  <TableCell>
                    <GateBadge state={gateState(db, a, now)} />
                  </TableCell>
                  {onSelect && (
                    <TableCell>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
