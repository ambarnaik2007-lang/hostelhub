import { createFileRoute } from "@tanstack/react-router";
import { NotificationList } from "@/components/hostel/NotificationList";
import { pageHead } from "@/lib/hostel/format";
import { useStudentContext } from "@/lib/hostel/hooks";

export const Route = createFileRoute("/student/notifications")({
  head: () => pageHead("Notifications", "Updates about your outpass approvals, rejections and gate activity."),
  component: () => {
    const { db, student } = useStudentContext();
    return <NotificationList db={db} recipient={student.id} />;
  },
});
