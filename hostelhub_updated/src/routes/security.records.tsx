import { createFileRoute } from "@tanstack/react-router";
import { GateLogTable } from "@/components/hostel/GateLogTable";
import { pageHead } from "@/lib/hostel/format";
import { useStaffContext } from "@/lib/hostel/hooks";

export const Route = createFileRoute("/security/records")({
  head: () => pageHead("Gate Records", "History of every student exit and return recorded at the hostel gate."),
  component: () => {
    const { db } = useStaffContext();
    return <GateLogTable db={db} title="Gate Records" description="Previous exit and return records at the hostel gate." />;
  },
});
