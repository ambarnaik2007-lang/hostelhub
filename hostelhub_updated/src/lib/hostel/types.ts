export type Role = "student" | "admin" | "security";

export const OUTPASS_TYPES = [
  "Day Outing",
  "Overnight Leave",
  "Emergency Leave",
  "Weekend Leave",
  "Medical Leave",
] as const;
export type OutpassType = (typeof OUTPASS_TYPES)[number];

export type AppStatus = "pending" | "approved" | "rejected" | "cancelled";

export interface Student {
  id: string;
  usn: string;
  name: string;
  email: string;
  mobile: string;
  course: string;
  year: string;
  block: string;
  room: string;
  emergencyName: string;
  emergencyRelation: string;
  emergencyPhone: string;
  bloodGroup: string;
}

export interface StaffUser {
  id: string;
  email: string;
  role: "admin" | "security";
  name: string;
  title: string;
  phone: string;
}

export interface Application {
  id: string;
  studentId: string;
  type: OutpassType;
  destination: string;
  reason: string;
  departure: string; // ISO
  expectedReturn: string; // ISO
  remarks: string;
  status: AppStatus;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
  passId?: string;
  cancelledAt?: string;
}

export interface Pass {
  id: string;
  applicationId: string;
  studentId: string;
  issuedAt: string;
  status: "active" | "cancelled";
  exitAt?: string;
  exitGuardId?: string;
  returnAt?: string;
  returnGuardId?: string;
}

export interface GateLog {
  id: string;
  passId: string;
  applicationId: string;
  studentId: string;
  type: "exit" | "return";
  at: string;
  guardId: string;
  guardName: string;
  late?: boolean;
}

export type NotificationKind = "info" | "success" | "warning" | "danger";

export interface AppNotification {
  id: string;
  /** student id, or "admin" / "security" for staff-wide notifications */
  recipient: string;
  title: string;
  message: string;
  at: string;
  read: boolean;
  kind: NotificationKind;
}

export interface DB {
  version: 1;
  seq: number;
  students: Student[];
  staff: StaffUser[];
  applications: Application[];
  passes: Pass[];
  gateLogs: GateLog[];
  notifications: AppNotification[];
}

export interface Session {
  userId: string;
  role: Role;
}

export const DEMO_PASSWORD = "Demo123!";

export const DEMO_ACCOUNTS: Record<Role, { email: string; userId: string; label: string }> = {
  student: { email: "student@hostelhub.demo", userId: "stu-001", label: "Student" },
  admin: { email: "admin@hostelhub.demo", userId: "adm-001", label: "Admin / Warden" },
  security: { email: "security@hostelhub.demo", userId: "sec-001", label: "Security Guard" },
};
