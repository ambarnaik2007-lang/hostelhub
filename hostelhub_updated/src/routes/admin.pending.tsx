import { createFileRoute } from "@tanstack/react-router";
import { AdminAppList } from "@/components/hostel/AdminAppList";
import { pageHead } from "@/lib/hostel/format";

export const Route = createFileRoute("/admin/pending")({
  head: () => pageHead("Pending Applications", "New requests waiting for your decision. Select one to review."),
  component: () => <AdminAppList status="pending" title="Pending Applications" description="New requests waiting for your decision. Select one to review." />,
});
