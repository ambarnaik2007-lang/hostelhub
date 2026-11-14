import { createFileRoute } from "@tanstack/react-router";
import { AdminAppList } from "@/components/hostel/AdminAppList";
import { GateLogTable } from "@/components/hostel/GateLogTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { pageHead } from "@/lib/hostel/format";
import { useStaffContext } from "@/lib/hostel/hooks";

export const Route = createFileRoute("/admin/records")({
  head: () => pageHead("Outpass Records", "Complete record of all outpass applications and gate exit and return logs."),
  component: RecordsPage,
});

function RecordsPage() {
  const { db } = useStaffContext();
  return (
    <Tabs defaultValue="apps">
      <TabsList className="mb-6">
        <TabsTrigger value="apps">All applications</TabsTrigger>
        <TabsTrigger value="gate">Gate logs ({db.gateLogs.length})</TabsTrigger>
      </TabsList>
      <TabsContent value="apps">
        <AdminAppList title="Outpass Records" description="Every application across all students and statuses." />
      </TabsContent>
      <TabsContent value="gate">
        <GateLogTable db={db} title="Gate Logs" description="Every exit and return recorded by security." />
      </TabsContent>
    </Tabs>
  );
}
