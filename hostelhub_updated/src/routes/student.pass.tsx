import { Link, createFileRoute } from "@tanstack/react-router";
import { BadgeCheck, Clock, Download, DoorOpen, FilePlus2, QrCode } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { useRef } from "react";
import { EmptyState, InfoRow, PageHeader, StudentAvatar } from "@/components/hostel/ui-bits";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNow } from "@/hooks/use-now";
import { fmtDateTime, pageHead } from "@/lib/hostel/format";
import { useStudentContext } from "@/lib/hostel/hooks";
import { verifyPass, type VerifyResult } from "@/lib/hostel/logic";

export const Route = createFileRoute("/student/pass")({
  head: () => pageHead("My QR Pass", "Your approved outpass QR code for verification at the hostel gate."),
  component: MyPass,
});

type Live = Extract<VerifyResult, { pass: unknown }>;

function PassCard({ v, name, usn }: { v: Live; name: string; usn: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const download = () => {
    const url = ref.current?.toDataURL("image/png");
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = `${v.pass.id}.png`;
    a.click();
  };
  const status =
    v.kind === "ready_return" ? (
      <Badge variant="warning">
        <DoorOpen className="h-3 w-3" /> Currently outside
      </Badge>
    ) : v.kind === "not_yet_valid" ? (
      <Badge variant="info">
        <Clock className="h-3 w-3" /> Valid from 2h before departure
      </Badge>
    ) : (
      <Badge variant="success">
        <BadgeCheck className="h-3 w-3" /> Valid for exit
      </Badge>
    );

  return (
    <Card className="overflow-hidden border-border/70 shadow-elevated">
      <div className="flex items-center justify-between bg-navy-gradient px-6 py-4 text-primary-foreground">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-sidebar-muted">HostelHub · Gate pass</div>
          <div className="font-mono text-lg font-bold">{v.pass.id}</div>
        </div>
        <QrCode className="h-6 w-6 text-sidebar-primary" />
      </div>
      <div className="grid gap-6 p-6 md:grid-cols-[auto_minmax(0,1fr)]">
        <div className="flex flex-col items-center gap-3">
          <div className="rounded-2xl border bg-card p-3 shadow-card">
            <QRCodeCanvas ref={ref} value={v.pass.id} size={208} level="M" marginSize={2} />
          </div>
          <Button variant="outline" size="sm" onClick={download}>
            <Download /> Download QR
          </Button>
        </div>
        <div className="min-w-0 space-y-5">
          <div className="flex items-center gap-3">
            <StudentAvatar name={name} />
            <div>
              <div className="font-semibold">{name}</div>
              <div className="font-mono text-xs text-muted-foreground">{usn}</div>
            </div>
            <div className="ml-auto">{status}</div>
          </div>
          <dl className="grid grid-cols-2 gap-4">
            <InfoRow label="Outpass type" value={v.app.type} />
            <InfoRow label="Destination" value={v.app.destination} />
            <InfoRow label="Departure" value={fmtDateTime(v.app.departure)} />
            <InfoRow label="Expected return" value={fmtDateTime(v.app.expectedReturn)} />
            <InfoRow label="Approval status" value={<span className="text-success">APPROVED by warden</span>} />
            <InfoRow label="Application" value={v.app.id} mono />
            {v.pass.exitAt && <InfoRow label="Exit recorded" value={fmtDateTime(v.pass.exitAt)} />}
          </dl>
          <p className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
            The QR code contains only the pass ID — no personal information. Show it to security at the gate when leaving and returning.
          </p>
        </div>
      </div>
    </Card>
  );
}

function MyPass() {
  const { db, student } = useStudentContext();
  const now = useNow(15_000);
  const live = db.applications
    .filter((a) => a.studentId === student.id && a.passId)
    .map((a) => verifyPass(db, a.passId!, now))
    .filter((v): v is Live => v.kind === "ready_exit" || v.kind === "ready_return" || v.kind === "not_yet_valid");
  const pending = db.applications.filter((a) => a.studentId === student.id && a.status === "pending").length;

  return (
    <div>
      <PageHeader title="My QR Pass" description="Approved, currently valid passes for gate verification." />
      {live.length === 0 ? (
        <EmptyState
          icon={QrCode}
          title="No active QR pass"
          description={
            pending
              ? `You have ${pending} application${pending > 1 ? "s" : ""} waiting for warden approval. Your QR code will appear here automatically once approved.`
              : "Apply for an outpass. Once the warden approves it, a unique QR pass is generated here."
          }
          action={
            <Button asChild>
              <Link to={pending ? "/student/applications" : "/student/apply"}>
                <FilePlus2 /> {pending ? "View applications" : "Apply for outpass"}
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="grid max-w-4xl gap-6">
          {live.map((v) => (
            <PassCard key={v.pass.id} v={v} name={student.name} usn={student.usn} />
          ))}
        </div>
      )}
    </div>
  );
}
