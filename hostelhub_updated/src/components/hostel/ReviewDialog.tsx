import { CheckCircle2, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { fmtDate } from "@/lib/hostel/format";
import { getStudent } from "@/lib/hostel/logic";
import { actions } from "@/lib/hostel/store";
import type { DB } from "@/lib/hostel/types";
import { ApplicationDetails } from "./ApplicationDetails";
import { InfoRow, StatusBadge, StudentAvatar } from "./ui-bits";

export function ReviewDialog({
  db,
  appId,
  reviewerId,
  now,
  onClose,
}: {
  db: DB;
  appId: string | null;
  reviewerId: string;
  now: number;
  onClose: () => void;
}) {
  const app = appId ? db.applications.find((a) => a.id === appId) : undefined;
  const [mode, setMode] = useState<"view" | "reject">("view");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    setMode("view");
    setReason("");
    setError("");
  }, [appId]);

  if (!app) return null;
  const student = getStudent(db, app.studentId);
  const pass = app.passId ? db.passes.find((p) => p.id === app.passId) : undefined;
  const previous = db.applications.filter((a) => a.studentId === app.studentId && a.id !== app.id).slice(0, 5);
  const canRevoke = app.status === "approved" && !pass?.exitAt;

  const approve = () => {
    try {
      const p = actions.approve(app.id, reviewerId);
      toast.success(`${app.id} approved`, { description: `QR pass ${p.id} issued to ${student?.name}.` });
    } catch (e) {
      toast.error((e as Error).message);
    }
  };
  const reject = () => {
    if (reason.trim().length < 3) {
      setError("Please enter a reason for the student.");
      return;
    }
    try {
      actions.reject(app.id, reviewerId, reason);
      toast.success(`${app.id} ${app.status === "approved" ? "revoked" : "rejected"}`);
      setMode("view");
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <Dialog open={!!app} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Review outpass application</DialogTitle>
          <DialogDescription>Check the student details and decide on this request.</DialogDescription>
        </DialogHeader>

        {student && (
          <div className="flex items-start gap-4 rounded-xl border bg-muted/40 p-4">
            <StudentAvatar name={student.name} size="lg" />
            <dl className="grid flex-1 grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
              <InfoRow label="Name" value={student.name} />
              <InfoRow label="USN" value={student.usn} mono />
              <InfoRow label="Mobile" value={student.mobile} />
              <InfoRow label="Course" value={`${student.course}, ${student.year}`} />
              <InfoRow label="Hostel" value={`${student.block}, Room ${student.room}`} />
              <InfoRow label="Emergency" value={`${student.emergencyName} · ${student.emergencyPhone}`} />
            </dl>
          </div>
        )}

        <ApplicationDetails db={db} app={app} now={now} />

        {previous.length > 0 && (
          <div>
            <h4 className="mb-2 text-sm font-semibold">Previous applications</h4>
            <div className="divide-y rounded-lg border">
              {previous.map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                  <span className="font-mono text-xs text-primary">{p.id}</span>
                  <span className="flex-1 truncate">
                    {p.type} · {p.destination}
                  </span>
                  <span className="hidden text-xs text-muted-foreground sm:inline">{fmtDate(p.departure)}</span>
                  <StatusBadge status={p.status} />
                </div>
              ))}
            </div>
          </div>
        )}

        {mode === "reject" && (
          <div className="space-y-2">
            <label htmlFor="reject-reason" className="text-sm font-semibold">
              Reason (shown to the student)
            </label>
            <Textarea
              id="reject-reason"
              value={reason}
              maxLength={300}
              onChange={(e) => {
                setReason(e.target.value);
                setError("");
              }}
              placeholder="e.g. Parent confirmation could not be completed."
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
        )}

        {(app.status === "pending" || canRevoke) && (
          <div className="flex flex-wrap justify-end gap-2 border-t pt-4">
            {mode === "view" ? (
              <>
                <Button variant="outline" onClick={() => setMode("reject")}>
                  <XCircle /> {app.status === "approved" ? "Revoke approval" : "Reject"}
                </Button>
                {app.status === "pending" && (
                  <Button variant="success" onClick={approve}>
                    <CheckCircle2 /> Approve & issue QR pass
                  </Button>
                )}
              </>
            ) : (
              <>
                <Button variant="ghost" onClick={() => setMode("view")}>
                  Back
                </Button>
                <Button variant="destructive" onClick={reject}>
                  <XCircle /> Confirm {app.status === "approved" ? "revoke" : "rejection"}
                </Button>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
