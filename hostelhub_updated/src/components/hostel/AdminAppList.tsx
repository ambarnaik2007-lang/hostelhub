import { Search } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNow } from "@/hooks/use-now";
import { useStaffContext } from "@/lib/hostel/hooks";
import { getStudent } from "@/lib/hostel/logic";
import { OUTPASS_TYPES, type AppStatus } from "@/lib/hostel/types";
import { ApplicationsTable } from "./ApplicationsTable";
import { ReviewDialog } from "./ReviewDialog";
import { PageHeader } from "./ui-bits";

export function AdminAppList({ status, title, description }: { status?: AppStatus; title: string; description: string }) {
  const { db, user } = useStaffContext();
  const now = useNow();
  const [q, setQ] = useState("");
  const [type, setType] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<string | null>(null);
  const query = q.trim().toLowerCase();
  const apps = db.applications.filter((a) => {
    if (status && a.status !== status) return false;
    if (!status && statusFilter !== "all" && a.status !== statusFilter) return false;
    if (type !== "all" && a.type !== type) return false;
    if (!query) return true;
    const s = getStudent(db, a.studentId);
    return [a.id, a.destination, a.passId, s?.name, s?.usn].some((v) => v?.toLowerCase().includes(query));
  });
  return (
    <div>
      <PageHeader title={title} description={description} />
      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, USN, application or pass ID" className="h-10 bg-card pl-9" />
        </div>
        {!status && (
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-10 bg-card sm:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        )}
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="h-10 bg-card sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {OUTPASS_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <p className="mb-3 text-xs text-muted-foreground">{apps.length} application{apps.length === 1 ? "" : "s"}</p>
      <ApplicationsTable db={db} apps={apps} now={now} showStudent onSelect={(a) => setSelected(a.id)} emptyTitle="No applications found" />
      <ReviewDialog db={db} appId={selected} reviewerId={user.id} now={now} onClose={() => setSelected(null)} />
    </div>
  );
}
