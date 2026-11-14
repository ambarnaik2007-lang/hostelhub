import { createFileRoute } from "@tanstack/react-router";
import { AdminAppList } from "@/components/hostel/AdminAppList";
import { pageHead } from "@/lib/hostel/format";

export const Route = createFileRoute("/admin/rejected")({
  head: () => pageHead("Rejected Applications", "Applications that were rejected or revoked, with reasons."),
  component: () => <AdminAppList status="rejected" title="Rejected Applications" description="Applications that were rejected or revoked, with reasons." />,
});
