import { createFileRoute } from "@tanstack/react-router";
import { Camera, Phone, ShieldAlert } from "lucide-react";
import { InfoRow, PageHeader, StudentAvatar } from "@/components/hostel/ui-bits";
import { Card } from "@/components/ui/card";
import { pageHead } from "@/lib/hostel/format";
import { useStudentContext } from "@/lib/hostel/hooks";

export const Route = createFileRoute("/student/profile")({
  head: () => pageHead("My Profile", "Your registered student and hostel details."),
  component: ProfilePage,
});

function ProfilePage() {
  const { student } = useStudentContext();
  return (
    <div>
      <PageHeader title="My Profile" description="Details registered with the hostel office. Contact the warden's office to update them." />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="flex flex-col items-center border-border/70 p-8 text-center shadow-card">
          <div className="relative">
            <StudentAvatar name={student.name} size="xl" />
            <div className="absolute bottom-1 right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-card bg-primary text-primary-foreground">
              <Camera className="h-4 w-4" />
            </div>
          </div>
          <h2 className="mt-4 text-xl font-bold">{student.name}</h2>
          <p className="font-mono text-sm text-muted-foreground">{student.usn}</p>
          <p className="mt-3 rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
            {student.block} · Room {student.room}
          </p>
          <p className="mt-4 text-xs text-muted-foreground">Profile photograph placeholder</p>
        </Card>
        <div className="space-y-6 lg:col-span-2">
          <Card className="border-border/70 p-6 shadow-card">
            <h3 className="mb-5 font-semibold">Academic & hostel</h3>
            <dl className="grid gap-5 sm:grid-cols-2">
              <InfoRow label="Full name" value={student.name} />
              <InfoRow label="Student ID / USN" value={student.usn} mono />
              <InfoRow label="Course" value={student.course} />
              <InfoRow label="Year" value={student.year} />
              <InfoRow label="Hostel" value={student.block} />
              <InfoRow label="Room number" value={student.room} />
              <InfoRow label="Email" value={student.email} />
              <InfoRow label="Blood group" value={student.bloodGroup} />
            </dl>
          </Card>
          <div className="grid gap-6 sm:grid-cols-2">
            <Card className="border-border/70 p-6 shadow-card">
              <div className="mb-4 flex items-center gap-2 font-semibold">
                <Phone className="h-4 w-4 text-info" /> Registered mobile
              </div>
              <p className="text-lg font-semibold">{student.mobile}</p>
            </Card>
            <Card className="border-border/70 p-6 shadow-card">
              <div className="mb-4 flex items-center gap-2 font-semibold">
                <ShieldAlert className="h-4 w-4 text-destructive" /> Emergency contact
              </div>
              <p className="font-semibold">{student.emergencyName}</p>
              <p className="text-sm text-muted-foreground">
                {student.emergencyRelation} · {student.emergencyPhone}
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
