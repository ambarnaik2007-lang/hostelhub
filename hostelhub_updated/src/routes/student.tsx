import { Navigate, Outlet, createFileRoute } from "@tanstack/react-router";
import { Bell, FilePlus2, FileText, History, LayoutDashboard, QrCode, UserRound } from "lucide-react";
import { PortalShell, type NavItem } from "@/components/hostel/PortalShell";
import { PortalLoading } from "@/components/hostel/ui-bits";
import { pageHead } from "@/lib/hostel/format";
import { useDB, useSession } from "@/lib/hostel/store";

export const Route = createFileRoute("/student")({
  ssr: false,
  head: () => pageHead("Student Portal", "Apply for hostel outpasses and carry your QR pass."),
  pendingComponent: PortalLoading,
  component: StudentLayout,
});

function StudentLayout() {
  const session = useSession();
  const db = useDB();
  if (!db) return <PortalLoading />;
  if (!session || session.role !== "student") return <Navigate to="/" />;
  const student = db.students.find((s) => s.id === session.userId);
  if (!student) return <Navigate to="/" />;
  const unread = db.notifications.filter((n) => n.recipient === student.id && !n.read).length;
  const nav: NavItem[] = [
    { to: "/student", label: "Dashboard", icon: LayoutDashboard, exact: true },
    { to: "/student/profile", label: "My Profile", icon: UserRound },
    { to: "/student/apply", label: "Apply for Outpass", icon: FilePlus2 },
    { to: "/student/applications", label: "My Applications", icon: FileText },
    { to: "/student/pass", label: "My QR Pass", icon: QrCode },
    { to: "/student/history", label: "Outpass History", icon: History },
    { to: "/student/notifications", label: "Notifications", icon: Bell, badge: unread },
  ];
  return (
    <PortalShell
      portal="Student Portal"
      nav={nav}
      user={{ name: student.name, subtitle: student.usn }}
      notificationsTo="/student/notifications"
      unread={unread}
    >
      <Outlet />
    </PortalShell>
  );
}
