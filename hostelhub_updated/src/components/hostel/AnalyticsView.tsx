import { Calculator, CheckCircle2, Clock, Hourglass, Sigma, TrendingUp, XCircle } from "lucide-react";
import type { ReactNode } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "@/components/ui/card";
import { useNow } from "@/hooks/use-now";
import { fmtDuration } from "@/lib/hostel/format";
import { computeAnalytics } from "@/lib/hostel/logic";
import type { DB } from "@/lib/hostel/types";
import { PageHeader, StatCard } from "./ui-bits";

const tooltip = { borderRadius: 10, border: "1px solid var(--border)", fontSize: 12 };
const axis = { tickLine: false, axisLine: false, fontSize: 11, stroke: "var(--muted-foreground)" } as const;
const PIE = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

function ChartCard({ title, subtitle, children, className }: { title: string; subtitle?: string; children: ReactNode; className?: string }) {
  return (
    <Card className={`border-border/70 p-6 shadow-card ${className ?? ""}`}>
      <h3 className="font-semibold">{title}</h3>
      {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      <div className="mt-4 h-64">{children}</div>
    </Card>
  );
}

function Formula({ name, expr, sub, result }: { name: string; expr: string; sub: string; result: string }) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{name}</div>
      <div className="mt-2 font-mono text-sm text-foreground">{expr}</div>
      <div className="mt-1 font-mono text-sm text-muted-foreground">= {sub}</div>
      <div className="mt-2 text-2xl font-bold text-primary">{result}</div>
    </div>
  );
}

export function AnalyticsView({ db }: { db: DB }) {
  const now = useNow(60_000);
  const a = computeAnalytics(db, now);
  const avgH = a.avgMinutesOutside / 60;
  const statusPie = [
    { name: "Approved", value: a.approved },
    { name: "Rejected", value: a.rejected },
    { name: "Pending", value: a.pending },
    { name: "Cancelled", value: a.cancelled },
  ];
  const statusColors = ["var(--chart-3)", "var(--chart-5)", "var(--chart-4)", "var(--muted-foreground)"];
  const busyHours = a.peakHours.filter((h) => h.hour >= 6 && h.hour <= 22);
  const perDayTotal = a.perDay.reduce((s, d) => s + d.count, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics and Mathematical Insights"
        description="Live statistics computed from every application and gate record. Updates automatically when records change."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Approval percentage" value={`${a.approvalPct.toFixed(2)}%`} icon={CheckCircle2} tone="green" hint={`${a.approved} of ${a.total}`} />
        <StatCard label="Rejection percentage" value={`${a.rejectionPct.toFixed(2)}%`} icon={XCircle} tone="red" hint={`${a.rejected} of ${a.total}`} />
        <StatCard label="Pending percentage" value={`${a.pendingPct.toFixed(2)}%`} icon={Clock} tone="amber" hint={`${a.pending} of ${a.total}`} />
        <StatCard label="Avg. time outside" value={fmtDuration(a.avgMinutesOutside)} icon={Hourglass} tone="blue" hint={`${a.completedCount} completed outpasses`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <ChartCard title="Total outpasses per day" subtitle={`Last 14 days by departure · ${perDayTotal} total · mean ${(perDayTotal / 14).toFixed(2)}/day`} className="lg:col-span-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={a.perDay}>
              <defs>
                <linearGradient id="perDayFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-2)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--chart-2)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis dataKey="label" {...axis} />
              <YAxis allowDecimals={false} width={28} {...axis} />
              <Tooltip contentStyle={tooltip} />
              <Area type="monotone" dataKey="count" name="Outpasses" stroke="var(--chart-1)" strokeWidth={2} fill="url(#perDayFill)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Application status split" subtitle={`n = ${a.total} applications`}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={statusPie} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2}>
                {statusPie.map((_, i) => (
                  <Cell key={i} fill={statusColors[i]} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltip} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Weekly outpass statistics" subtitle="Applications per week, grouped by outcome">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={a.weekly}>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis dataKey="label" {...axis} />
              <YAxis allowDecimals={false} width={28} {...axis} />
              <Tooltip cursor={{ fill: "var(--muted)" }} contentStyle={tooltip} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="approved" name="Approved" stackId="w" fill="var(--chart-3)" />
              <Bar dataKey="rejected" name="Rejected" stackId="w" fill="var(--chart-5)" />
              <Bar dataKey="pending" name="Pending" stackId="w" fill="var(--chart-4)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard
          title="Peak departure hours"
          subtitle={a.peakHour ? `Mode: ${String(a.peakHour.hour).padStart(2, "0")}:00–${String(a.peakHour.hour + 1).padStart(2, "0")}:00 with ${a.peakHour.count} exits` : "No exits recorded yet"}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={busyHours}>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis dataKey="label" {...axis} interval={1} />
              <YAxis allowDecimals={false} width={28} {...axis} />
              <Tooltip cursor={{ fill: "var(--muted)" }} contentStyle={tooltip} />
              <Bar dataKey="count" name="Exits" radius={[6, 6, 0, 0]}>
                {busyHours.map((h) => (
                  <Cell key={h.hour} fill={a.peakHour?.hour === h.hour ? "var(--chart-1)" : "var(--chart-2)"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <ChartCard title="Outpasses by type" subtitle="Frequency distribution">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={a.byType} dataKey="count" nameKey="type" outerRadius={85}>
                {a.byType.map((_, i) => (
                  <Cell key={i} fill={PIE[i % PIE.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltip} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <Card className="border-border/70 p-6 shadow-card lg:col-span-2">
          <div className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-info" />
            <h3 className="font-semibold">Mathematical calculations</h3>
          </div>
          <p className="text-xs text-muted-foreground">Formulas applied to the current records, with values substituted.</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Formula name="Approval percentage" expr="(Approved ÷ Total) × 100" sub={`(${a.approved} ÷ ${a.total}) × 100`} result={`${a.approvalPct.toFixed(2)}%`} />
            <Formula name="Rejection percentage" expr="(Rejected ÷ Total) × 100" sub={`(${a.rejected} ÷ ${a.total}) × 100`} result={`${a.rejectionPct.toFixed(2)}%`} />
            <Formula name="Pending percentage" expr="(Pending ÷ Total) × 100" sub={`(${a.pending} ÷ ${a.total}) × 100`} result={`${a.pendingPct.toFixed(2)}%`} />
            <Formula
              name="Average duration outside"
              expr="Total time outside ÷ Completed outpasses"
              sub={`${(a.totalMinutesOutside / 60).toFixed(1)} h ÷ ${a.completedCount}`}
              result={`${avgH.toFixed(2)} h`}
            />
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-muted p-4">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <TrendingUp className="h-3.5 w-3.5" /> Median duration
              </div>
              <div className="mt-1 text-lg font-bold">{fmtDuration(a.medianMinutes)}</div>
            </div>
            <div className="rounded-xl bg-muted p-4">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <Sigma className="h-3.5 w-3.5" /> Std. deviation (σ)
              </div>
              <div className="mt-1 text-lg font-bold">{(a.stdDevMinutes / 60).toFixed(2)} h</div>
            </div>
            <div className="rounded-xl bg-muted p-4">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <Clock className="h-3.5 w-3.5" /> Late returns
              </div>
              <div className="mt-1 text-lg font-bold">
                {a.lateReturns} <span className="text-sm font-medium text-muted-foreground">({((a.lateReturns / Math.max(a.completedCount, 1)) * 100).toFixed(1)}%)</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
