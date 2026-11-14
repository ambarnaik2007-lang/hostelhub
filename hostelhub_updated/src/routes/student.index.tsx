import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowRight, Bell, CheckCircle2, Clock, DoorOpen, FilePlus2, FileText, Home, QrCode } from "lucide-react";
import { ApplicationsTable } from "@/components/hostel/ApplicationsTable";
import { InfoRow, StatCard, StudentAvatar } from "@/components/hostel/ui-bits";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNow } from "@/hooks/use-now";
import { fmtDateTime, fmtRelative, pageHead } from "@/lib/hostel/format";
import { useStudentContext } from "@/lib/hostel/hooks";
import { verifyPass } from "@/lib/hostel/logic";

export const Route = createFileRoute("/student/")({
  head: () => pageHead("Student Dashboard", "Your outpass overview, active QR pass and latest updates."),
  component: StudentDashboard,
});

function StudentDashboard() {
  const { db, student } = useStudentContext();
  const now = useNow();
  const apps = db.applications.filter((a) => a.studentId === student.id);
  const active = apps
    .filter((a) => a.passId)
    .map((a) => verifyPass(db, a.passId!, now))
    .find((v) => v.kind === "ready_exit" || v.kind === "ready_return" || v.kind === "not_yet_valid");
  const outside = active?.kind === "ready_return";
  const notes = db.notifications.filter((n) => n.recipient === student.id).slice(0, 4);
  const hour = new Date(now).getHours();
  const greet = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-6">
      <Card className="relative overflow-hidden border-0 bg-navy-gradient p-6 text-primary-foreground shadow-elevated md:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <StudentAvatar name={student.name} size="lg" />
            <div>
              <p className="text-sm text-sidebar-foreground">{greet},</p>
              <h1 className="text-2xl font-bold md:text-3xl">{student.name}</h1>
              <p className="mt-1 text-sm text-sidebar-muted">
                {student.usn} · {student.block}, Room {student.room}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild size="lg" className="bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90">
              <Link to="/student/apply">
                <FilePlus2 /> Apply for Outpass
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-sidebar-border bg-sidebar-accent/40 text-sidebar-accent-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
              <Link to="/student/pass">
                <QrCode /> My QR Pass
              </Link>
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total applications" value={apps.length} icon={FileText} />
        <StatCard label="Pending" value={apps.filter((a) => a.status === "pending").length} icon={Clock} tone="amber" />
        <StatCard label="Approved" value={apps.filter((a) => a.status === "approved").length} icon={CheckCircle2} tone="green" />
        <StatCard label="Current status" value={outside ? "Outside" : "In hostel"} icon={outside ? DoorOpen : Home} tone={outside ? "amber" : "blue"} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="border-border/70 p-6 shadow-card lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Active pass</h2>
            <Link to="/student/pass" className="text-sm font-medium text-info hover:underline">
              Open QR pass
            </Link>
          </div>
          {active && active.kind !== "not_found" ? (
            <div className="flex flex-col gap-4 rounded-xl border bg-success-soft/50 p-5 sm:flex-row sm:items-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-success text-success-foreground">
                <QrCode className="h-7 w-7" />
              </div>
              <div className="flex-1">
                <div className="font-mono text-sm font-bold text-primary">{active.pass.id}</div>
                <div className="mt-0.5 font-semibold">
                  {active.app.type} · {active.app.destination}
                </div>
                <div className="text-sm text-muted-foreground">
                  {fmtDateTime(active.app.departure)} → {fmtDateTime(active.app.expectedReturn)}
                </div>
              </div>
              <Button asChild variant="success">
                <Link to="/student/pass">
                  Show at gate <ArrowRight />
                </Link>
              </Button>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
              No active pass. Once the warden approves an application, your QR pass appears here.
            </div>
          )}

          <h2 className="mb-3 mt-8 font-semibold">Recent applications</h2>
          <ApplicationsTable db={db} apps={apps.slice(0, 4)} now={now} emptyTitle="No applications yet" />
        </Card>

        <div className="space-y-6">
          <Card className="border-border/70 p-6 shadow-card">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold">Profile</h2>
              <Link to="/student/profile" className="text-sm font-medium text-info hover:underline">
                View
              </Link>
            </div>
            <dl className="grid grid-cols-2 gap-4">
              <InfoRow label="USN" value={student.usn} mono />
              <InfoRow label="Mobile" value={student.mobile} />
              <InfoRow label="Course" value={student.course} />
              <InfoRow label="Year" value={student.year} />
              <InfoRow label="Hostel" value={student.block} />
              <InfoRow label="Room" value={student.room} />
              <div className="col-span-2">
                <InfoRow label="Emergency contact" value={`${student.emergencyName} (${student.emergencyRelation}) · ${student.emergencyPhone}`} />
              </div>
            </dl>
          </Card>
          <Card className="border-border/70 p-6 shadow-card">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold">Notifications</h2>
              <Link to="/student/notifications" className="text-sm font-medium text-info hover:underline">
                All
              </Link>
            </div>
            <ul className="space-y-3">
              {notes.map((n) => (
                <li key={n.id} className="flex gap-3">
                  <Bell className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <div className="text-sm font-medium">{n.title}</div>
                    <div className="truncate text-xs text-muted-foreground">{n.message}</div>
                    <div className="text-[11px] text-muted-foreground">{fmtRelative(n.at)}</div>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
