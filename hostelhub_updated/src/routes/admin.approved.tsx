import { createFileRoute } from "@tanstack/react-router";
import { AdminAppList } from "@/components/hostel/AdminAppList";
import { pageHead } from "@/lib/hostel/format";

export const Route = createFileRoute("/admin/approved")({
  head: () => pageHead("Approved Applications", "Applications with an issued QR pass."),
  component: () => <AdminAppList status="approved" title="Approved Applications" description="Applications with an issued QR pass." />,
});
