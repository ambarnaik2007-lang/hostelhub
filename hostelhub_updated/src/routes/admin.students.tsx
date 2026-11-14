import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useState } from "react";
import { ApplicationsTable } from "@/components/hostel/ApplicationsTable";
import { InfoRow, PageHeader, StudentAvatar } from "@/components/hostel/ui-bits";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useNow } from "@/hooks/use-now";
import { pageHead } from "@/lib/hostel/format";
import { useStaffContext } from "@/lib/hostel/hooks";
import { studentsOutside } from "@/lib/hostel/logic";

export const Route = createFileRoute("/admin/students")({
  head: () => pageHead("Student Management", "Registered hostel residents, their rooms and outpass activity."),
  component: StudentsPage,
});

function StudentsPage() {
  const { db } = useStaffContext();
  const now = useNow();
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const outsideIds = new Set(studentsOutside(db).map((o) => o.student.id));
  const query = q.trim().toLowerCase();
  const list = db.students.filter((s) => !query || [s.name, s.usn, s.room, s.block, s.course].some((v) => v.toLowerCase().includes(query)));
  const sel = selected ? db.students.find((s) => s.id === selected) : undefined;

  return (
    <div>
      <PageHeader title="Student Management" description={`${db.students.length} registered hostel residents`} />
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, USN, room or course" className="h-10 bg-card pl-9" />
      </div>
      <div className="overflow-hidden rounded-xl border bg-card shadow-card">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/60 hover:bg-muted/60">
                <TableHead className="pl-5">Student</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Hostel</TableHead>
                <TableHead>Mobile</TableHead>
                <TableHead>Applications</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((s) => (
                <TableRow key={s.id} className="cursor-pointer" onClick={() => setSelected(s.id)}>
                  <TableCell className="pl-5">
                    <div className="flex items-center gap-3">
                      <StudentAvatar name={s.name} size="sm" />
                      <div className="leading-tight">
                        <div className="whitespace-nowrap font-medium">{s.name}</div>
                        <div className="font-mono text-[11px] text-muted-foreground">{s.usn}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm">
                    {s.course.replace("B.E. ", "")} <span className="text-muted-foreground">· {s.year}</span>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm">
                    {s.block}, {s.room}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">{s.mobile}</TableCell>
                  <TableCell className="text-sm">{db.applications.filter((a) => a.studentId === s.id).length}</TableCell>
                  <TableCell>{outsideIds.has(s.id) ? <Badge variant="warning">Outside</Badge> : <Badge variant="success">In hostel</Badge>}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={!!sel} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Student profile</DialogTitle>
          </DialogHeader>
          {sel && (
            <div className="space-y-6">
              <div className="flex flex-col gap-5 rounded-xl border bg-muted/40 p-5 sm:flex-row">
                <StudentAvatar name={sel.name} size="lg" />
                <dl className="grid flex-1 grid-cols-2 gap-4 md:grid-cols-3">
                  <InfoRow label="Name" value={sel.name} />
                  <InfoRow label="USN" value={sel.usn} mono />
                  <InfoRow label="Course" value={`${sel.course}, ${sel.year}`} />
                  <InfoRow label="Hostel" value={`${sel.block}, Room ${sel.room}`} />
                  <InfoRow label="Mobile" value={sel.mobile} />
                  <InfoRow label="Emergency" value={`${sel.emergencyName} (${sel.emergencyRelation}) · ${sel.emergencyPhone}`} />
                </dl>
              </div>
              <ApplicationsTable db={db} apps={db.applications.filter((a) => a.studentId === sel.id)} now={now} emptyTitle="No applications" />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
