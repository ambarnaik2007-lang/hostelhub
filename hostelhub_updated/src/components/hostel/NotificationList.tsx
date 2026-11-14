import { AlertTriangle, Bell, CheckCheck, CheckCircle2, Info, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { fmtDateTime, fmtRelative } from "@/lib/hostel/format";
import { actions } from "@/lib/hostel/store";
import type { DB } from "@/lib/hostel/types";
import { cn } from "@/lib/utils";
import { EmptyState, PageHeader } from "./ui-bits";

const ICON = { info: Info, success: CheckCircle2, warning: AlertTriangle, danger: XCircle } as const;
const TONE = {
  info: "bg-info-soft text-info",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-destructive-soft text-destructive",
} as const;

export function NotificationList({ db, recipient }: { db: DB; recipient: string }) {
  const list = db.notifications.filter((n) => n.recipient === recipient);
  const unread = list.filter((n) => !n.read).length;
  return (
    <div>
      <PageHeader
        title="Notifications"
        description={unread ? `${unread} unread` : "You're all caught up."}
        actions={
          unread > 0 && (
            <Button variant="outline" onClick={() => actions.markAllRead(recipient)}>
              <CheckCheck /> Mark all as read
            </Button>
          )
        }
      />
      {list.length === 0 ? (
        <EmptyState icon={Bell} title="No notifications" />
      ) : (
        <Card className="divide-y overflow-hidden border-border/70 shadow-card">
          {list.map((n) => {
            const Icon = ICON[n.kind];
            return (
              <div key={n.id} className={cn("flex gap-4 p-4 md:p-5", !n.read && "bg-primary-soft/50")}>
                <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full", TONE[n.kind])}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{n.title}</span>
                    {!n.read && <span className="h-2 w-2 rounded-full bg-info" />}
                  </div>
                  <p className="mt-0.5 text-sm text-muted-foreground">{n.message}</p>
                </div>
                <div className="shrink-0 text-right text-xs text-muted-foreground" title={fmtDateTime(n.at)}>
                  {fmtRelative(n.at)}
                </div>
              </div>
            );
          })}
        </Card>
      )}
    </div>
  );
}
