import { createFileRoute } from "@tanstack/react-router";
import { History } from "lucide-react";
import { EmptyState, PageHeader, StatusBadge } from "@/components/hostel/ui-bits";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useNow } from "@/hooks/use-now";
import { fmtDateTime, fmtDuration, pageHead } from "@/lib/hostel/format";
import { useStudentContext } from "@/lib/hostel/hooks";
import { MINUTE } from "@/lib/hostel/logic";

export const Route = createFileRoute("/student/history")({
  head: () => pageHead("Outpass History", "Your completed, expired and closed outpasses with gate times."),
  component: HistoryPage,
});

function HistoryPage() {
  const { db, student } = useStudentContext();
  const now = useNow();
  const rows = db.applications.filter((a) => {
    if (a.studentId !== student.id) return false;
    if (a.status === "rejected" || a.status === "cancelled") return true;
    const p = db.passes.find((x) => x.id === a.passId);
    return !!p?.returnAt || (a.status === "approved" && !p?.exitAt && new Date(a.expectedReturn).getTime() < now);
  });

  return (
    <div>
      <PageHeader title="Outpass History" description="Closed outpasses with actual exit and return times recorded at the gate." />
      {rows.length === 0 ? (
        <EmptyState icon={History} title="No history yet" />
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card shadow-card">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/60 hover:bg-muted/60">
                  <TableHead className="pl-5">Application</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Destination</TableHead>
                  <TableHead>Exit</TableHead>
                  <TableHead>Return</TableHead>
                  <TableHead>Time outside</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((a) => {
                  const p = db.passes.find((x) => x.id === a.passId);
                  const dur = p?.exitAt && p.returnAt ? (new Date(p.returnAt).getTime() - new Date(p.exitAt).getTime()) / MINUTE : 0;
                  return (
                    <TableRow key={a.id}>
                      <TableCell className="pl-5 font-mono text-xs font-semibold text-primary">{a.id}</TableCell>
                      <TableCell className="whitespace-nowrap">{a.type}</TableCell>
                      <TableCell>{a.destination}</TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">{fmtDateTime(p?.exitAt)}</TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">{fmtDateTime(p?.returnAt)}</TableCell>
                      <TableCell className="whitespace-nowrap font-medium">{dur ? fmtDuration(dur) : "—"}</TableCell>
                      <TableCell>
                        {a.status === "approved" && !p?.exitAt ? (
                          <span className="text-xs font-medium text-muted-foreground">Expired (unused)</span>
                        ) : (
                          <StatusBadge status={a.status} />
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
