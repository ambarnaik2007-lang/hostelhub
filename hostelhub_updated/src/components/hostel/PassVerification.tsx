import {
  AlertTriangle,
  BadgeCheck,
  Ban,
  CheckCircle2,
  Clock,
  LogIn,
  LogOut,
  ScanLine,
  SearchX,
  ShieldX,
  TimerOff,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { fmtDateTime } from "@/lib/hostel/format";
import { verifyPass, type VerifyKind } from "@/lib/hostel/logic";
import { actions } from "@/lib/hostel/store";
import type { DB } from "@/lib/hostel/types";
import { cn } from "@/lib/utils";
import { InfoRow, StudentAvatar } from "./ui-bits";

const BANNER: Record<VerifyKind, { title: string; detail: string; tone: "ok" | "warn" | "bad"; icon: typeof BadgeCheck }> = {
  ready_exit: { title: "VALID PASS", detail: "Approved by warden · cleared for exit", tone: "ok", icon: BadgeCheck },
  ready_return: { title: "VALID PASS · RETURNING", detail: "Exit already recorded · confirm the student's return", tone: "ok", icon: BadgeCheck },
  not_found: { title: "INVALID PASS", detail: "No pass exists with this ID. Do not allow exit.", tone: "bad", icon: SearchX },
  rejected: { title: "PASS REJECTED", detail: "The warden rejected or revoked this outpass.", tone: "bad", icon: ShieldX },
  cancelled: { title: "PASS CANCELLED", detail: "This outpass was cancelled and is no longer valid.", tone: "bad", icon: Ban },
  expired: { title: "PASS EXPIRED", detail: "The expected return time has passed. The pass can't be used for exit.", tone: "bad", icon: TimerOff },
  used: { title: "PASS ALREADY USED", detail: "Exit and return are both recorded. This pass is closed.", tone: "warn", icon: AlertTriangle },
  not_yet_valid: { title: "NOT YET VALID", detail: "Exit opens 2 hours before the approved departure time.", tone: "warn", icon: Clock },
};

const TONE = {
  ok: "bg-success text-success-foreground",
  warn: "bg-warning text-warning-foreground",
  bad: "bg-destructive text-destructive-foreground",
};

export function PassVerification({
  db,
  passId,
  guardId,
  now,
  onReset,
}: {
  db: DB;
  passId: string | null;
  guardId: string;
  now: number;
  onReset: () => void;
}) {
  const [done, setDone] = useState<{ type: "exit" | "return"; at: string } | null>(null);
  useEffect(() => setDone(null), [passId]);

  if (!passId) {
    return (
      <Card className="flex min-h-[420px] flex-col items-center justify-center border-dashed border-border p-10 text-center shadow-none">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-soft text-primary">
          <ScanLine className="h-8 w-8" />
        </div>
        <h3 className="mt-4 text-lg font-semibold">Ready to verify</h3>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">Scan the student's QR pass or type the pass ID. Verification details will appear here.</p>
      </Card>
    );
  }

  const v = verifyPass(db, passId, now);

  if (done && v.kind !== "not_found") {
    return (
      <Card className="flex min-h-[420px] flex-col items-center justify-center border-border/70 p-10 text-center shadow-elevated">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-success-soft text-success">
          <CheckCircle2 className="h-11 w-11" />
        </div>
        <h3 className="mt-5 text-2xl font-bold">{done.type === "exit" ? "Exit recorded" : "Return recorded"}</h3>
        <p className="mt-1 text-muted-foreground">
          {v.student.name} · {v.student.usn}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {fmtDateTime(done.at)} · Pass <span className="font-mono">{v.pass.id}</span>
        </p>
        <Button size="lg" className="mt-6" onClick={onReset}>
          <ScanLine /> Scan next pass
        </Button>
      </Card>
    );
  }

  const b = BANNER[v.kind];
  const act = (type: "exit" | "return") => {
    try {
      if (type === "exit") actions.recordExit(v.passId, guardId);
      else actions.recordReturn(v.passId, guardId);
      setDone({ type, at: new Date().toISOString() });
      toast.success(type === "exit" ? "Exit recorded" : "Return recorded");
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <Card className="overflow-hidden border-border/70 shadow-elevated">
      <div className={cn("flex items-center gap-4 px-6 py-5", TONE[b.tone])}>
        <b.icon className="h-10 w-10 shrink-0" />
        <div>
          <div className="text-2xl font-extrabold tracking-wide">{b.title}</div>
          <div className="text-sm opacity-90">{b.detail}</div>
        </div>
        <div className="ml-auto hidden font-mono text-sm font-semibold opacity-90 sm:block">{v.passId}</div>
      </div>

      {v.kind === "not_found" ? (
        <div className="p-8 text-center">
          <p className="text-sm text-muted-foreground">
            Scanned value: <span className="font-mono font-semibold text-foreground">{v.passId || "(empty)"}</span>
          </p>
          <Button variant="outline" className="mt-5" onClick={onReset}>
            Try another pass
          </Button>
        </div>
      ) : (
        <div className="p-6">
          <div className="flex flex-col gap-6 sm:flex-row">
            <div className="flex flex-col items-center gap-2">
              <StudentAvatar name={v.student.name} size="xl" />
              <span className="text-[11px] text-muted-foreground">Student photo</span>
            </div>
            <dl className="grid flex-1 grid-cols-2 gap-x-6 gap-y-4">
              <div className="col-span-2">
                <div className="text-xl font-bold">{v.student.name}</div>
                <div className="font-mono text-sm text-muted-foreground">{v.student.usn}</div>
              </div>
              <InfoRow label="Hostel block & room" value={`${v.student.block}, Room ${v.student.room}`} />
              <InfoRow label="Mobile" value={v.student.mobile} />
              <InfoRow label="Destination" value={v.app.destination} />
              <InfoRow label="Outpass type" value={v.app.type} />
              <InfoRow label="Approved departure" value={fmtDateTime(v.app.departure)} />
              <InfoRow label="Expected return" value={fmtDateTime(v.app.expectedReturn)} />
              <InfoRow
                label="Warden approval"
                value={
                  <span className={v.app.status === "approved" ? "text-success" : "text-destructive"}>
                    {v.app.status.toUpperCase()}
                  </span>
                }
              />
              <InfoRow label="Application" value={v.app.id} mono />
              {v.pass.exitAt && <InfoRow label="Exit recorded" value={fmtDateTime(v.pass.exitAt)} />}
              {v.pass.returnAt && <InfoRow label="Return recorded" value={fmtDateTime(v.pass.returnAt)} />}
            </dl>
          </div>

          {v.kind === "ready_return" && v.late && (
            <div className="mt-5 flex items-center gap-2 rounded-lg border border-warning/25 bg-warning-soft p-3 text-sm font-medium text-warning">
              <AlertTriangle className="h-4 w-4" /> Late return — student is past the expected return time. The warden will be notified.
            </div>
          )}
          {v.kind === "rejected" && v.app.rejectionReason && (
            <div className="mt-5 rounded-lg border border-destructive/20 bg-destructive-soft p-3 text-sm text-destructive">
              Reason: {v.app.rejectionReason}
            </div>
          )}

          <div className="mt-6 flex flex-col gap-2 border-t pt-5 sm:flex-row sm:justify-end">
            <Button variant="outline" size="lg" onClick={onReset}>
              Cancel
            </Button>
            {v.kind === "ready_exit" && (
              <Button variant="success" size="xl" onClick={() => act("exit")}>
                <LogOut /> CONFIRM EXIT
              </Button>
            )}
            {v.kind === "ready_return" && (
              <Button variant="success" size="xl" onClick={() => act("return")}>
                <LogIn /> CONFIRM RETURN
              </Button>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
