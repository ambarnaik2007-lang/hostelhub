import { Link, createFileRoute } from "@tanstack/react-router";
import { format } from "date-fns";
import { CheckCircle2, FilePlus2, Send } from "lucide-react";
import { useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";
import { InfoRow, PageHeader } from "@/components/hostel/ui-bits";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { pageHead } from "@/lib/hostel/format";
import { useStudentContext } from "@/lib/hostel/hooks";
import { HOUR, MINUTE, validateApplication, type ApplicationInput } from "@/lib/hostel/logic";
import { actions } from "@/lib/hostel/store";
import { OUTPASS_TYPES, type Application } from "@/lib/hostel/types";

export const Route = createFileRoute("/student/apply")({
  head: () => pageHead("Apply for Outpass", "Submit a new hostel outpass request for warden approval."),
  component: ApplyPage,
});

function defaults(): ApplicationInput {
  const q = 15 * MINUTE;
  const dep = new Date(Math.ceil((Date.now() + 30 * MINUTE) / q) * q);
  const ret = new Date(dep.getTime() + 4 * HOUR);
  return {
    type: "",
    destination: "",
    reason: "",
    departureDate: format(dep, "yyyy-MM-dd"),
    departureTime: format(dep, "HH:mm"),
    returnDate: format(ret, "yyyy-MM-dd"),
    returnTime: format(ret, "HH:mm"),
    remarks: "",
  };
}

function Field({ label, error, children, htmlFor }: { label: string; error?: string | undefined; children: ReactNode; htmlFor: string }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>
        {label}
      </Label>
      {children}
      {error && <p className="text-xs font-medium text-destructive">{error}</p>}
    </div>
  );
}

function ApplyPage() {
  const { student } = useStudentContext();
  const [form, setForm] = useState<ApplicationInput>(defaults);
  const [errors, setErrors] = useState<Partial<Record<keyof ApplicationInput, string>>>({});
  const [submitted, setSubmitted] = useState<Application | null>(null);
  const set = (k: keyof ApplicationInput) => (v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const res = validateApplication(form, Date.now());
    if (!res.ok) {
      setErrors(res.errors);
      toast.error("Please fix the highlighted fields.");
      return;
    }
    try {
      const app = actions.submitApplication(student.id, form);
      setSubmitted(app);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  if (submitted) {
    return (
      <div className="mx-auto max-w-xl">
        <Card className="border-border/70 p-8 text-center shadow-elevated">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success-soft text-success">
            <CheckCircle2 className="h-9 w-9" />
          </div>
          <h1 className="mt-5 text-2xl font-bold">Application submitted</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your outpass request has been sent to the warden. You'll be notified once it is reviewed.
          </p>
          <div className="mt-6 grid grid-cols-2 gap-4 rounded-xl border bg-muted/40 p-4 text-left">
            <InfoRow label="Application ID" value={submitted.id} mono />
            <InfoRow label="Status" value={<span className="text-warning">PENDING</span>} />
            <InfoRow label="Type" value={submitted.type} />
            <InfoRow label="Destination" value={submitted.destination} />
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Button asChild>
              <Link to="/student/applications">View my applications</Link>
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setForm(defaults());
                setSubmitted(null);
              }}
            >
              <FilePlus2 /> Apply another
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Apply for Outpass" description="Fill in your travel details. Your personal details are added from your profile." />
      <div className="grid gap-6 lg:grid-cols-3">
        <form onSubmit={submit} noValidate className="lg:col-span-2">
          <Card className="space-y-6 border-border/70 p-6 shadow-card md:p-8">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Outpass type *" error={errors.type} htmlFor="type">
                <Select value={form.type} onValueChange={set("type")}>
                  <SelectTrigger id="type" className="h-10" aria-invalid={!!errors.type}>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {OUTPASS_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Destination *" error={errors.destination} htmlFor="destination">
                <Input id="destination" className="h-10" maxLength={120} placeholder="e.g. Home – Mysuru" value={form.destination} onChange={(e) => set("destination")(e.target.value)} />
              </Field>
            </div>
            <Field label="Reason for leaving *" error={errors.reason} htmlFor="reason">
              <Textarea id="reason" rows={3} maxLength={500} placeholder="Briefly explain why you need to leave the hostel" value={form.reason} onChange={(e) => set("reason")(e.target.value)} />
            </Field>
            <div className="grid gap-5 rounded-xl border bg-muted/30 p-5 sm:grid-cols-2">
              <Field label="Departure date *" error={errors.departureDate} htmlFor="dd">
                <Input id="dd" type="date" className="h-10 bg-card" value={form.departureDate} onChange={(e) => set("departureDate")(e.target.value)} />
              </Field>
              <Field label="Departure time *" error={errors.departureTime} htmlFor="dt">
                <Input id="dt" type="time" className="h-10 bg-card" value={form.departureTime} onChange={(e) => set("departureTime")(e.target.value)} />
              </Field>
              <Field label="Expected return date *" error={errors.returnDate} htmlFor="rd">
                <Input id="rd" type="date" className="h-10 bg-card" value={form.returnDate} onChange={(e) => set("returnDate")(e.target.value)} />
              </Field>
              <Field label="Expected return time *" error={errors.returnTime} htmlFor="rt">
                <Input id="rt" type="time" className="h-10 bg-card" value={form.returnTime} onChange={(e) => set("returnTime")(e.target.value)} />
              </Field>
            </div>
            <Field label="Additional remarks" error={errors.remarks} htmlFor="remarks">
              <Textarea id="remarks" rows={2} maxLength={300} placeholder="Optional" value={form.remarks} onChange={(e) => set("remarks")(e.target.value)} />
            </Field>
            <div className="flex justify-end border-t pt-5">
              <Button type="submit" size="lg">
                <Send /> Submit Application
              </Button>
            </div>
          </Card>
        </form>
        <Card className="h-fit border-border/70 p-6 shadow-card">
          <h3 className="font-semibold">Your details</h3>
          <p className="mb-5 text-xs text-muted-foreground">Prefilled from your profile</p>
          <dl className="space-y-4">
            <InfoRow label="Name" value={student.name} />
            <InfoRow label="Student ID / USN" value={student.usn} mono />
            <InfoRow label="Mobile" value={student.mobile} />
            <InfoRow label="Course & year" value={`${student.course}, ${student.year}`} />
            <InfoRow label="Hostel" value={`${student.block}, Room ${student.room}`} />
            <InfoRow label="Emergency contact" value={`${student.emergencyName} · ${student.emergencyPhone}`} />
          </dl>
        </Card>
      </div>
    </div>
  );
}
