import { createFileRoute } from "@tanstack/react-router";
import { AnalyticsView } from "@/components/hostel/AnalyticsView";
import { pageHead } from "@/lib/hostel/format";
import { useStaffContext } from "@/lib/hostel/hooks";

export const Route = createFileRoute("/admin/analytics")({
  head: () => pageHead("Analytics & Mathematical Insights", "Outpass trends, approval percentages, average time outside and peak departure hours."),
  component: () => {
    const { db } = useStaffContext();
    return <AnalyticsView db={db} />;
  },
});
