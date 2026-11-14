import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, Clock, DoorOpen, FileText, Users, XCircle } from "lucide-react";
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ReviewDialog } from "@/components/hostel/ReviewDialog";
import { PageHeader, StatCard, StudentAvatar } from "@/components/hostel/ui-bits";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNow } from "@/hooks/use-now";
import { fmtDateTime, fmtRelative, pageHead } from "@/lib/hostel/format";
import { useStaffContext } from "@/lib/hostel/hooks";
import { computeAnalytics, getStudent, studentsOutside } from "@/lib/hostel/logic";

export const Route = createFileRoute("/admin/")({
  head: () => pageHead("Warden Dashboard", "Hostel outpass statistics, pending approvals and students currently outside."),
  component: AdminDashboard,
});

function AdminDashboard() {
  const { db, user } = useStaffContext();
  const now = useNow();
  const [selected, setSelected] = useState<string | null>(null);
  const a = computeAnalytics(db, now);
  const pending = db.applications.filter((x) => x.status === "pending");
  const outside = studentsOutside(db);

  return (
    <div className="space-y-6">
      <PageHeader title={`Welcome, ${user.name}`} description={`${user.title} · Hostel outpass overview`} />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Registered students" value={db.students.length} icon={Users} />
        <StatCard label="Total applications" value={a.total} icon={FileText} tone="blue" />
        <StatCard label="Pending" value={a.pending} icon={Clock} tone="amber" />
        <StatCard label="Approved" value={a.approved} icon={CheckCircle2} tone="green" />
        <StatCard label="Rejected" value={a.rejected} icon={XCircle} tone="red" />
        <StatCard label="Currently outside" value={outside.length} icon={DoorOpen} tone="amber" />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="border-border/70 p-6 shadow-card lg:col-span-3">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-semibold">Awaiting your approval</h2>
              <p className="text-xs text-muted-foreground">{pending.length} pending request{pending.length === 1 ? "" : "s"}</p>
            </div>
            <Button asChild variant="soft" size="sm">
              <Link to="/admin/pending">
                View all <ArrowRight />
              </Link>
            </Button>
          </div>
          {pending.length === 0 ? (
            <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">No pending applications.</p>
          ) : (
            <ul className="divide-y">
              {pending.slice(0, 6).map((p) => {
                const s = getStudent(db, p.studentId);
                return (
                  <li key={p.id} className="flex items-center gap-3 py-3">
                    <StudentAvatar name={s?.name ?? "?"} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-semibold">{s?.name}</span>
                        <span className="font-mono text-[11px] text-muted-foreground">{p.id}</span>
                      </div>
                      <div className="truncate text-xs text-muted-foreground">
                        {p.type} · {p.destination} · {fmtDateTime(p.departure)}
                      </div>
                    </div>
                    <span className="hidden text-xs text-muted-foreground sm:inline">{fmtRelative(p.createdAt)}</span>
                    <Button size="sm" onClick={() => setSelected(p.id)}>
                      Review
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card className="border-border/70 p-6 shadow-card lg:col-span-2">
          <h2 className="font-semibold">Students currently outside</h2>
          <p className="mb-4 text-xs text-muted-foreground">Live from gate records</p>
          {outside.length === 0 ? (
            <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">Everyone is inside the hostel.</p>
          ) : (
            <ul className="space-y-3">
              {outside.map(({ student, app, pass }) => {
                const overdue = new Date(app.expectedReturn).getTime() < now;
                return (
                  <li key={pass.id} className="flex items-center gap-3 rounded-lg border p-3">
                    <StudentAvatar name={student.name} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold">{student.name}</div>
                      <div className="truncate text-xs text-muted-foreground">{app.destination}</div>
                    </div>
                    <div className="text-right text-xs">
                      <div className={overdue ? "font-semibold text-destructive" : "text-muted-foreground"}>{overdue ? "Overdue" : "Due back"}</div>
                      <div className="text-muted-foreground">{fmtDateTime(app.expectedReturn)}</div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>

      <Card className="border-border/70 p-6 shadow-card">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Outpasses per day</h2>
            <p className="text-xs text-muted-foreground">Last 14 days, by departure date · Approval rate {a.approvalPct.toFixed(1)}%</p>
          </div>
          <Button asChild variant="soft" size="sm">
            <Link to="/admin/analytics">
              Full analytics <ArrowRight />
            </Link>
          </Button>
        </div>
        <div className="h-60">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={a.perDay}>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} stroke="var(--muted-foreground)" />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={11} width={28} stroke="var(--muted-foreground)" />
              <Tooltip cursor={{ fill: "var(--muted)" }} contentStyle={{ borderRadius: 10, border: "1px solid var(--border)" }} />
              <Bar dataKey="count" name="Outpasses" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <ReviewDialog db={db} appId={selected} reviewerId={user.id} now={now} onClose={() => setSelected(null)} />
    </div>
  );
}
