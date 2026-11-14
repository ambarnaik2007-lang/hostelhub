import type { ReactNode } from "react";
import { fmtDateTime } from "@/lib/hostel/format";
import { gateState } from "@/lib/hostel/logic";
import type { Application, DB } from "@/lib/hostel/types";
import { GateBadge, InfoRow, StatusBadge } from "./ui-bits";

/** Read-only detail grid shared by the student and warden dialogs. */
export function ApplicationDetails({ db, app, now, footer }: { db: DB; app: Application; now: number; footer?: ReactNode }) {
  const pass = app.passId ? db.passes.find((p) => p.id === app.passId) : undefined;
  const reviewer = app.reviewedBy ? db.staff.find((s) => s.id === app.reviewedBy) : undefined;
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-sm font-bold text-primary">{app.id}</span>
        <StatusBadge status={app.status} />
        <GateBadge state={gateState(db, app, now)} />
      </div>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
        <InfoRow label="Outpass type" value={app.type} />
        <InfoRow label="Destination" value={app.destination} />
        <InfoRow label="Departure" value={fmtDateTime(app.departure)} />
        <InfoRow label="Expected return" value={fmtDateTime(app.expectedReturn)} />
        <div className="col-span-2">
          <InfoRow label="Reason" value={app.reason} />
        </div>
        {app.remarks && (
          <div className="col-span-2">
            <InfoRow label="Additional remarks" value={app.remarks} />
          </div>
        )}
        <InfoRow label="Applied on" value={fmtDateTime(app.createdAt)} />
        {reviewer && <InfoRow label="Reviewed by" value={`${reviewer.name}, ${fmtDateTime(app.reviewedAt)}`} />}
        {pass && <InfoRow label="QR pass ID" value={pass.id} mono />}
        {pass?.exitAt && <InfoRow label="Exit recorded" value={fmtDateTime(pass.exitAt)} />}
        {pass?.returnAt && <InfoRow label="Return recorded" value={fmtDateTime(pass.returnAt)} />}
      </dl>
      {app.status === "rejected" && app.rejectionReason && (
        <div className="rounded-lg border border-destructive/20 bg-destructive-soft p-3 text-sm text-destructive">
          <span className="font-semibold">Rejection reason: </span>
          {app.rejectionReason}
        </div>
      )}
      {footer}
    </div>
  );
}
