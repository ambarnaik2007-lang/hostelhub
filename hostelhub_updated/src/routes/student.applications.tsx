import { Link, createFileRoute } from "@tanstack/react-router";
import { Ban, FilePlus2, QrCode } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ApplicationDetails } from "@/components/hostel/ApplicationDetails";
import { ApplicationsTable } from "@/components/hostel/ApplicationsTable";
import { PageHeader } from "@/components/hostel/ui-bits";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNow } from "@/hooks/use-now";
import { pageHead } from "@/lib/hostel/format";
import { useStudentContext } from "@/lib/hostel/hooks";
import { gateState } from "@/lib/hostel/logic";
import { actions } from "@/lib/hostel/store";

export const Route = createFileRoute("/student/applications")({
  head: () => pageHead("My Applications", "Track the status of every outpass application you have submitted."),
  component: MyApplications,
});

function MyApplications() {
  const { db, student } = useStudentContext();
  const now = useNow();
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState<string | null>(null);
  const all = db.applications.filter((a) => a.studentId === student.id);
  const apps = filter === "all" ? all : all.filter((a) => a.status === filter);
  const sel = selected ? db.applications.find((a) => a.id === selected) : undefined;
  const canCancel = sel && (sel.status === "pending" || (sel.status === "approved" && gateState(db, sel, now) === "not_exited"));

  return (
    <div>
      <PageHeader
        title="My Applications"
        description="All outpass requests you have submitted. Select one to see details."
        actions={
          <Button asChild>
            <Link to="/student/apply">
              <FilePlus2 /> New application
            </Link>
          </Button>
        }
      />
      <Tabs value={filter} onValueChange={setFilter} className="mb-4">
        <TabsList>
          <TabsTrigger value="all">All ({all.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>
      </Tabs>
      <ApplicationsTable db={db} apps={apps} now={now} onSelect={(a) => setSelected(a.id)} emptyTitle="Nothing here yet" emptyDescription="Applications you submit will be listed here." />

      <Dialog open={!!sel} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Application details</DialogTitle>
          </DialogHeader>
          {sel && (
            <ApplicationDetails
              db={db}
              app={sel}
              now={now}
              footer={
                <div className="flex flex-wrap justify-end gap-2 border-t pt-4">
                  {canCancel && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        try {
                          actions.cancel(sel.id, student.id);
                          toast.success(`${sel.id} cancelled`);
                        } catch (e) {
                          toast.error((e as Error).message);
                        }
                      }}
                    >
                      <Ban /> Cancel application
                    </Button>
                  )}
                  {sel.status === "approved" && gateState(db, sel, now) !== "returned" && gateState(db, sel, now) !== "expired" && (
                    <Button asChild variant="success">
                      <Link to="/student/pass">
                        <QrCode /> View QR pass
                      </Link>
                    </Button>
                  )}
                </div>
              }
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
