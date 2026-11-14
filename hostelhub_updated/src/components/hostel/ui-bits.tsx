import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import {
  Ban,
  CheckCircle2,
  Clock,
  DoorOpen,
  Home,
  LogOut as LogOutIcon,
  TimerOff,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { initials } from "@/lib/hostel/format";
import type { GateState } from "@/lib/hostel/logic";
import type { AppStatus } from "@/lib/hostel/types";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string | undefined;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-foreground md:text-[28px]">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

const tones = {
  navy: "bg-primary-soft text-primary",
  blue: "bg-info-soft text-info",
  green: "bg-success-soft text-success",
  amber: "bg-warning-soft text-warning",
  red: "bg-destructive-soft text-destructive",
} as const;

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "navy",
  hint,
}: {
  label: string;
  value: ReactNode;
  icon: LucideIcon;
  tone?: keyof typeof tones;
  hint?: string | undefined;
}) {
  return (
    <Card className="border-border/70 p-5 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[13px] font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-foreground">{value}</p>
          {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        </div>
        <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", tones[tone])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}

export function StatusBadge({ status }: { status: AppStatus }) {
  switch (status) {
    case "pending":
      return (
        <Badge variant="warning">
          <Clock className="h-3 w-3" /> Pending
        </Badge>
      );
    case "approved":
      return (
        <Badge variant="success">
          <CheckCircle2 className="h-3 w-3" /> Approved
        </Badge>
      );
    case "rejected":
      return (
        <Badge variant="danger">
          <XCircle className="h-3 w-3" /> Rejected
        </Badge>
      );
    case "cancelled":
      return (
        <Badge variant="muted">
          <Ban className="h-3 w-3" /> Cancelled
        </Badge>
      );
  }
}

export function GateBadge({ state }: { state: GateState }) {
  switch (state) {
    case "not_exited":
      return (
        <Badge variant="info">
          <DoorOpen className="h-3 w-3" /> Ready
        </Badge>
      );
    case "outside":
      return (
        <Badge variant="warning">
          <LogOutIcon className="h-3 w-3" /> Outside
        </Badge>
      );
    case "returned":
      return (
        <Badge variant="muted">
          <Home className="h-3 w-3" /> Returned
        </Badge>
      );
    case "expired":
      return (
        <Badge variant="muted">
          <TimerOff className="h-3 w-3" /> Expired
        </Badge>
      );
    default:
      return <span className="text-xs text-muted-foreground">—</span>;
  }
}

export function StudentAvatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" | "xl" }) {
  const s = {
    sm: "h-8 w-8 text-xs",
    md: "h-11 w-11 text-sm",
    lg: "h-20 w-20 text-2xl",
    xl: "h-28 w-28 text-3xl",
  }[size];
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full border-2 border-card bg-accent font-bold text-primary ring-1 ring-border",
        s,
      )}
      aria-label={`Photo placeholder for ${name}`}
    >
      {initials(name)}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string | undefined;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-card px-6 py-14 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="mt-4 font-semibold text-foreground">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function InfoRow({ label, value, mono }: { label: string; value: ReactNode; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className={cn("mt-0.5 break-words text-sm font-medium text-foreground", mono && "font-mono")}>{value}</dd>
    </div>
  );
}

export function PortalLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
    </div>
  );
}
