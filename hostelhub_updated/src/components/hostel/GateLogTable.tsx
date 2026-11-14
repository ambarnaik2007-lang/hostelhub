import { ArrowDownLeft, ArrowUpRight, ScrollText, Search } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fmtDateTime } from "@/lib/hostel/format";
import { getStudent } from "@/lib/hostel/logic";
import type { DB } from "@/lib/hostel/types";
import { EmptyState, PageHeader, StudentAvatar } from "./ui-bits";

export function GateLogTable({ db, title, description }: { db: DB; title: string; description: string }) {
  const [q, setQ] = useState("");
  const [type, setType] = useState("all");
  const query = q.trim().toLowerCase();
  const logs = db.gateLogs.filter((l) => {
    if (type !== "all" && l.type !== type) return false;
    if (!query) return true;
    const s = getStudent(db, l.studentId);
    return [l.passId, l.applicationId, s?.name, s?.usn, l.guardName].some((v) => v?.toLowerCase().includes(query));
  });
  return (
    <div>
      <PageHeader title={title} description={description} />
      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by student, USN, pass ID or guard" className="h-10 bg-card pl-9" />
        </div>
        <Tabs value={type} onValueChange={setType}>
          <TabsList className="h-10">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="exit">Exits</TabsTrigger>
            <TabsTrigger value="return">Returns</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      {logs.length === 0 ? (
        <EmptyState icon={ScrollText} title="No gate records" />
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card shadow-card">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/60 hover:bg-muted/60">
                  <TableHead className="pl-5">Event</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Pass ID</TableHead>
                  <TableHead>Application</TableHead>
                  <TableHead>Date & time</TableHead>
                  <TableHead>Guard</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.slice(0, 200).map((l) => {
                  const s = getStudent(db, l.studentId);
                  return (
                    <TableRow key={l.id}>
                      <TableCell className="pl-5">
                        {l.type === "exit" ? (
                          <Badge variant="warning">
                            <ArrowUpRight className="h-3 w-3" /> Exit
                          </Badge>
                        ) : (
                          <Badge variant="success">
                            <ArrowDownLeft className="h-3 w-3" /> Return{l.late ? " · Late" : ""}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <StudentAvatar name={s?.name ?? "?"} size="sm" />
                          <div className="leading-tight">
                            <div className="whitespace-nowrap text-sm font-medium">{s?.name}</div>
                            <div className="font-mono text-[11px] text-muted-foreground">{s?.usn}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap font-mono text-xs font-semibold text-primary">{l.passId}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{l.applicationId}</TableCell>
                      <TableCell className="whitespace-nowrap text-sm">{fmtDateTime(l.at)}</TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">{l.guardName}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
