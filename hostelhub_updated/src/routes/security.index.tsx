import { createFileRoute } from "@tanstack/react-router";
import { ArrowDownLeft, ArrowUpRight, DoorOpen, KeyRound, ScanLine, TimerReset } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { PassVerification } from "@/components/hostel/PassVerification";
import { QrScanner } from "@/components/hostel/QrScanner";
import { PageHeader, StatCard } from "@/components/hostel/ui-bits";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNow } from "@/hooks/use-now";
import { pageHead } from "@/lib/hostel/format";
import { useStaffContext } from "@/lib/hostel/hooks";
import { normalizePassId, studentsOutside } from "@/lib/hostel/logic";

export const Route = createFileRoute("/security/")({
  head: () => pageHead("Scan & Verify", "Scan a student's QR outpass or enter the pass ID to record exit and return."),
  component: GatePage,
});

function GatePage() {
  const { db, user } = useStaffContext();
  const now = useNow(10_000);
  const [passId, setPassId] = useState<string | null>(null);
  const [manual, setManual] = useState("");
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const todays = db.gateLogs.filter((l) => new Date(l.at) >= today);
  const outside = studentsOutside(db);
  const overdue = outside.filter((o) => new Date(o.app.expectedReturn).getTime() < now).length;

  const lookup = (raw: string) => {
    const id = normalizePassId(raw);
    if (!id) {
      toast.error("Enter a pass ID");
      return;
    }
    setPassId(id);
  };
  const submitManual = (e: FormEvent) => {
    e.preventDefault();
    lookup(manual);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Gate verification" description={`${user.name} · ${user.title}`} />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Exits today" value={todays.filter((l) => l.type === "exit").length} icon={ArrowUpRight} tone="amber" />
        <StatCard label="Returns today" value={todays.filter((l) => l.type === "return").length} icon={ArrowDownLeft} tone="green" />
        <StatCard label="Currently outside" value={outside.length} icon={DoorOpen} tone="blue" />
        <StatCard label="Overdue" value={overdue} icon={TimerReset} tone="red" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_1fr]">
        <Card className="h-fit border-border/70 p-5 shadow-card">
          <Tabs defaultValue="scan">
            <TabsList className="mb-4 grid w-full grid-cols-2">
              <TabsTrigger value="scan">
                <ScanLine className="mr-1.5 h-4 w-4" /> Scan QR
              </TabsTrigger>
              <TabsTrigger value="manual">
                <KeyRound className="mr-1.5 h-4 w-4" /> Manual ID
              </TabsTrigger>
            </TabsList>
            <TabsContent value="scan">
              <QrScanner onResult={lookup} />
            </TabsContent>
            <TabsContent value="manual">
              <form onSubmit={submitManual} className="space-y-3">
                <label htmlFor="pass-id" className="text-sm font-medium">
                  Pass ID
                </label>
                <Input
                  id="pass-id"
                  value={manual}
                  onChange={(e) => setManual(e.target.value.toUpperCase())}
                  placeholder="HP-XXXXXXXX"
                  maxLength={24}
                  className="h-12 font-mono text-lg tracking-wider"
                  autoComplete="off"
                />
                <Button type="submit" size="lg" className="w-full">
                  Verify pass
                </Button>
                <p className="text-xs text-muted-foreground">Use this if the camera is unavailable. The pass ID is printed under the student's QR code.</p>
              </form>
            </TabsContent>
          </Tabs>
        </Card>
        <PassVerification db={db} passId={passId} guardId={user.id} now={now} onReset={() => { setPassId(null); setManual(""); }} />
      </div>
    </div>
  );
}
