import { Navigate, Outlet, createFileRoute } from "@tanstack/react-router";
import { DoorOpen, ScanLine, ScrollText } from "lucide-react";
import { PortalShell, type NavItem } from "@/components/hostel/PortalShell";
import { PortalLoading } from "@/components/hostel/ui-bits";
import { pageHead } from "@/lib/hostel/format";
import { studentsOutside } from "@/lib/hostel/logic";
import { useDB, useSession } from "@/lib/hostel/store";

export const Route = createFileRoute("/security")({
  ssr: false,
  head: () => pageHead("Security Gate Portal", "Scan and verify student QR outpasses at the hostel gate."),
  pendingComponent: PortalLoading,
  component: SecurityLayout,
});

function SecurityLayout() {
  const session = useSession();
  const db = useDB();
  if (!db) return <PortalLoading />;
  if (!session || session.role !== "security") return <Navigate to="/" />;
  const user = db.staff.find((s) => s.id === session.userId);
  if (!user) return <Navigate to="/" />;
  const nav: NavItem[] = [
    { to: "/security", label: "Scan & Verify", icon: ScanLine, exact: true },
    { to: "/security/outside", label: "Students Outside", icon: DoorOpen, badge: studentsOutside(db).length },
    { to: "/security/records", label: "Gate Records", icon: ScrollText },
  ];
  return (
    <PortalShell portal="Security Gate Portal" nav={nav} user={{ name: user.name, subtitle: user.title }}>
      <Outlet />
    </PortalShell>
  );
}
