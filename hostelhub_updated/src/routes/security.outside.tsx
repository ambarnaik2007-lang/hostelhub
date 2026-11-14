import { createFileRoute } from "@tanstack/react-router";
import { DoorOpen, LogIn } from "lucide-react";
import { toast } from "sonner";
import { EmptyState, PageHeader, StudentAvatar } from "@/components/hostel/ui-bits";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNow } from "@/hooks/use-now";
import { fmtDateTime, fmtDuration, pageHead } from "@/lib/hostel/format";
import { useStaffContext } from "@/lib/hostel/hooks";
import { MINUTE, studentsOutside } from "@/lib/hostel/logic";
import { actions } from "@/lib/hostel/store";

export const Route = createFileRoute("/security/outside")({
  head: () => pageHead("Students Outside", "Students currently outside the hostel and when they are due back."),
  component: OutsidePage,
});

function OutsidePage() {
  const { db, user } = useStaffContext();
  const now = useNow();
  const list = studentsOutside(db).sort((a, b) => a.app.expectedReturn.localeCompare(b.app.expectedReturn));
  return (
    <div>
      <PageHeader title="Students Outside" description={`${list.length} student${list.length === 1 ? "" : "s"} currently outside the hostel`} />
      {list.length === 0 ? (
        <EmptyState icon={DoorOpen} title="Everyone is inside" description="Students who exit on a pass will be listed here until they return." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {list.map(({ student, app, pass }) => {
            const due = new Date(app.expectedReturn).getTime();
            const overdue = due < now;
            return (
              <Card key={pass.id} className="border-border/70 p-5 shadow-card">
                <div className="flex items-center gap-3">
                  <StudentAvatar name={student.name} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold">{student.name}</div>
                    <div className="font-mono text-xs text-muted-foreground">
                      {student.usn} · {student.room}
                    </div>
                  </div>
                  {overdue ? <Badge variant="danger">Overdue</Badge> : <Badge variant="warning">Outside</Badge>}
                </div>
                <dl className="mt-4 space-y-1.5 text-sm">
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">Destination</dt>
                    <dd className="truncate text-right font-medium">{app.destination}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">Exited</dt>
                    <dd className="font-medium">{fmtDateTime(pass.exitAt)}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">Due back</dt>
                    <dd className={overdue ? "font-semibold text-destructive" : "font-medium"}>{fmtDateTime(app.expectedReturn)}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">{overdue ? "Overdue by" : "Time left"}</dt>
                    <dd className="font-medium">{fmtDuration(Math.abs(due - now) / MINUTE)}</dd>
                  </div>
                </dl>
                <Button
                  variant="success"
                  className="mt-4 w-full"
                  onClick={() => {
                    try {
                      actions.recordReturn(pass.id, user.id);
                      toast.success(`Return recorded for ${student.name}`);
                    } catch (e) {
                      toast.error((e as Error).message);
                    }
                  }}
                >
                  <LogIn /> Confirm return
                </Button>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
