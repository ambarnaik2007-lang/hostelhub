import { Navigate, Outlet, createFileRoute } from "@tanstack/react-router";
import { BarChart3, CheckCircle2, ClipboardList, Clock, LayoutDashboard, Users, XCircle } from "lucide-react";
import { PortalShell, type NavItem } from "@/components/hostel/PortalShell";
import { PortalLoading } from "@/components/hostel/ui-bits";
import { pageHead } from "@/lib/hostel/format";
import { useDB, useSession } from "@/lib/hostel/store";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => pageHead("Warden Portal", "Review and approve student hostel outpass applications."),
  pendingComponent: PortalLoading,
  component: AdminLayout,
});

function AdminLayout() {
  const session = useSession();
  const db = useDB();
  if (!db) return <PortalLoading />;
  if (!session || session.role !== "admin") return <Navigate to="/" />;
  const user = db.staff.find((s) => s.id === session.userId);
  if (!user) return <Navigate to="/" />;
  const pending = db.applications.filter((a) => a.status === "pending").length;
  const nav: NavItem[] = [
    { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
    { to: "/admin/pending", label: "Pending Applications", icon: Clock, badge: pending },
    { to: "/admin/approved", label: "Approved Applications", icon: CheckCircle2 },
    { to: "/admin/rejected", label: "Rejected Applications", icon: XCircle },
    { to: "/admin/students", label: "Student Management", icon: Users },
    { to: "/admin/records", label: "Outpass Records", icon: ClipboardList },
    { to: "/admin/analytics", label: "Reports & Analytics", icon: BarChart3 },
  ];
  return (
    <PortalShell portal="Admin / Warden Portal" nav={nav} user={{ name: user.name, subtitle: user.title }}>
      <Outlet />
    </PortalShell>
  );
}
