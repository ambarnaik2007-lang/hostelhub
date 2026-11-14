import type {
  AppNotification,
  Application,
  DB,
  GateLog,
  NotificationKind,
  OutpassType,
  Pass,
  Role,
  Session,
  Student,
} from "./types";
import { DEMO_ACCOUNTS, DEMO_PASSWORD, OUTPASS_TYPES } from "./types";

export const MINUTE = 60_000;
export const HOUR = 60 * MINUTE;
export const DAY = 24 * HOUR;
/** A pass can be used at the gate from this long before the approved departure. */
export const EXIT_WINDOW_BEFORE_MS = 2 * HOUR;

/* ------------------------------------------------------------------ auth */

export function authenticate(
  db: DB,
  role: Role,
  email: string,
  password: string,
): { ok: true; session: Session } | { ok: false; error: string } {
  const e = email.trim().toLowerCase();
  const match = (Object.keys(DEMO_ACCOUNTS) as Role[]).find((r) => DEMO_ACCOUNTS[r].email === e);
  if (!match) return { ok: false, error: "No demo account found with this email." };
  if (match !== role)
    return {
      ok: false,
      error: `This is a ${DEMO_ACCOUNTS[match].label} account. Select the correct role.`,
    };
  if (password !== DEMO_PASSWORD) return { ok: false, error: "Incorrect password." };
  const userId = DEMO_ACCOUNTS[role].userId;
  const exists =
    role === "student"
      ? db.students.some((s) => s.id === userId)
      : db.staff.some((s) => s.id === userId);
  if (!exists) return { ok: false, error: "Account not found in the demo data." };
  return { ok: true, session: { userId, role } };
}

/* ------------------------------------------------------------ validation */

export interface ApplicationInput {
  type: string;
  destination: string;
  reason: string;
  departureDate: string; // yyyy-mm-dd
  departureTime: string; // HH:mm
  returnDate: string;
  returnTime: string;
  remarks: string;
}

export function combineDateTime(date: string, time: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) return null;
  const d = new Date(`${date}T${time}:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function validateApplication(
  input: ApplicationInput,
  now: number,
):
  | { ok: true; value: Omit<Application, "id" | "studentId" | "status" | "createdAt"> }
  | { ok: false; errors: Partial<Record<keyof ApplicationInput, string>> } {
  const errors: Partial<Record<keyof ApplicationInput, string>> = {};
  if (!OUTPASS_TYPES.includes(input.type as OutpassType)) errors.type = "Select an outpass type.";
  const destination = input.destination.trim();
  if (!destination) errors.destination = "Destination is required.";
  else if (destination.length > 120) errors.destination = "Keep it under 120 characters.";
  const reason = input.reason.trim();
  if (!reason) errors.reason = "Reason is required.";
  else if (reason.length < 5) errors.reason = "Please describe the reason (at least 5 characters).";
  else if (reason.length > 500) errors.reason = "Keep it under 500 characters.";
  if (input.remarks.trim().length > 300) errors.remarks = "Keep remarks under 300 characters.";

  if (!input.departureDate) errors.departureDate = "Departure date is required.";
  if (!input.departureTime) errors.departureTime = "Departure time is required.";
  if (!input.returnDate) errors.returnDate = "Return date is required.";
  if (!input.returnTime) errors.returnTime = "Return time is required.";

  const dep = combineDateTime(input.departureDate, input.departureTime);
  const ret = combineDateTime(input.returnDate, input.returnTime);
  if (input.departureDate && input.departureTime && !dep)
    errors.departureTime = "Invalid departure date or time.";
  if (input.returnDate && input.returnTime && !ret) errors.returnTime = "Invalid return date or time.";
  if (dep && dep.getTime() < now - 30 * MINUTE)
    errors.departureTime = "Departure cannot be in the past.";
  if (dep && ret && ret.getTime() <= dep.getTime())
    errors.returnTime = "Return must be after the departure date and time.";
  if (dep && ret && ret.getTime() - dep.getTime() > 15 * DAY)
    errors.returnDate = "An outpass cannot exceed 15 days.";

  if (Object.keys(errors).length > 0 || !dep || !ret) return { ok: false, errors };
  return {
    ok: true,
    value: {
      type: input.type as OutpassType,
      destination,
      reason,
      remarks: input.remarks.trim(),
      departure: dep.toISOString(),
      expectedReturn: ret.toISOString(),
    },
  };
}

/* --------------------------------------------------------------- helpers */

const PASS_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generatePassId(rand: () => number, existing: Set<string>): string {
  for (;;) {
    let s = "HP-";
    for (let i = 0; i < 8; i++) s += PASS_ALPHABET[Math.floor(rand() * PASS_ALPHABET.length)];
    if (!existing.has(s)) return s;
  }
}

export function normalizePassId(raw: string): string {
  return raw
    .trim()
    .toUpperCase()
    .replace(/^HOSTELPASS:/, "")
    .replace(/\s+/g, "");
}

function nextId(db: DB, prefix: string): [string, number] {
  const seq = db.seq + 1;
  return [`${prefix}-${seq}`, seq];
}

function notify(
  db: DB,
  recipient: string,
  title: string,
  message: string,
  kind: NotificationKind,
  at: number,
): DB {
  const [id, seq] = nextId(db, "N");
  const n: AppNotification = {
    id,
    recipient,
    title,
    message,
    kind,
    at: new Date(at).toISOString(),
    read: false,
  };
  return { ...db, seq, notifications: [n, ...db.notifications] };
}

export function nextApplicationId(db: DB): string {
  const max = db.applications.reduce((m, a) => {
    const n = Number(a.id.replace(/\D/g, ""));
    return Number.isFinite(n) && n > m ? n : m;
  }, 1000);
  return `OP-${max + 1}`;
}

export const getStudent = (db: DB, id: string): Student | undefined =>
  db.students.find((s) => s.id === id);

/* ---------------------------------------------------------- mutations */

export function submitApplication(
  db: DB,
  studentId: string,
  input: ApplicationInput,
  now: number,
): { db: DB; application: Application } {
  const student = getStudent(db, studentId);
  if (!student) throw new Error("Student not found.");
  const result = validateApplication(input, now);
  if (!result.ok) throw new Error(Object.values(result.errors)[0] ?? "Invalid application.");
  const application: Application = {
    ...result.value,
    id: nextApplicationId(db),
    studentId,
    status: "pending",
    createdAt: new Date(now).toISOString(),
  };
  let next: DB = { ...db, applications: [application, ...db.applications] };
  next = notify(
    next,
    "admin",
    "New outpass application",
    `${student.name} (${student.usn}) applied for ${application.type} to ${application.destination}.`,
    "info",
    now,
  );
  next = notify(
    next,
    studentId,
    "Application submitted",
    `${application.id} is pending warden approval.`,
    "info",
    now,
  );
  return { db: next, application };
}

export function approveApplication(
  db: DB,
  appId: string,
  reviewerId: string,
  now: number,
  rand: () => number,
): { db: DB; pass: Pass } {
  const app = db.applications.find((a) => a.id === appId);
  if (!app) throw new Error("Application not found.");
  if (app.status !== "pending") throw new Error(`Application is already ${app.status}.`);
  const passId = generatePassId(rand, new Set(db.passes.map((p) => p.id)));
  const at = new Date(now).toISOString();
  const pass: Pass = {
    id: passId,
    applicationId: app.id,
    studentId: app.studentId,
    issuedAt: at,
    status: "active",
  };
  let next: DB = {
    ...db,
    applications: db.applications.map((a) =>
      a.id === appId
        ? { ...a, status: "approved", reviewedAt: at, reviewedBy: reviewerId, passId }
        : a,
    ),
    passes: [pass, ...db.passes],
  };
  next = notify(
    next,
    app.studentId,
    "Outpass approved",
    `${app.id} was approved. Your QR pass ${passId} is ready in My QR Pass.`,
    "success",
    now,
  );
  return { db: next, pass };
}

export function rejectApplication(
  db: DB,
  appId: string,
  reviewerId: string,
  reason: string,
  now: number,
): DB {
  const app = db.applications.find((a) => a.id === appId);
  if (!app) throw new Error("Application not found.");
  const r = reason.trim();
  if (r.length < 3) throw new Error("Enter a rejection reason.");
  const pass = app.passId ? db.passes.find((p) => p.id === app.passId) : undefined;
  if (app.status === "approved") {
    if (pass?.exitAt) throw new Error("Student has already exited on this pass.");
  } else if (app.status !== "pending") {
    throw new Error(`Application is already ${app.status}.`);
  }
  const at = new Date(now).toISOString();
  let next: DB = {
    ...db,
    applications: db.applications.map((a) =>
      a.id === appId
        ? { ...a, status: "rejected", reviewedAt: at, reviewedBy: reviewerId, rejectionReason: r }
        : a,
    ),
    passes: db.passes.map((p) => (p.id === app.passId ? { ...p, status: "cancelled" } : p)),
  };
  next = notify(
    next,
    app.studentId,
    app.status === "approved" ? "Outpass approval revoked" : "Outpass rejected",
    `${app.id} was rejected. Reason: ${r}`,
    "danger",
    now,
  );
  return next;
}

export function cancelApplication(db: DB, appId: string, studentId: string, now: number): DB {
  const app = db.applications.find((a) => a.id === appId);
  if (!app || app.studentId !== studentId) throw new Error("Application not found.");
  const pass = app.passId ? db.passes.find((p) => p.id === app.passId) : undefined;
  if (app.status !== "pending" && app.status !== "approved")
    throw new Error("Only pending or approved applications can be cancelled.");
  if (pass?.exitAt) throw new Error("You have already exited on this pass.");
  const at = new Date(now).toISOString();
  return {
    ...db,
    applications: db.applications.map((a) =>
      a.id === appId ? { ...a, status: "cancelled", cancelledAt: at } : a,
    ),
    passes: db.passes.map((p) => (p.id === app.passId ? { ...p, status: "cancelled" } : p)),
  };
}

/* ---------------------------------------------------------- gate verification */

export type VerifyKind =
  | "not_found"
  | "rejected"
  | "cancelled"
  | "not_yet_valid"
  | "expired"
  | "used"
  | "ready_exit"
  | "ready_return";

export type VerifyResult =
  | { kind: "not_found"; passId: string }
  | {
      kind: Exclude<VerifyKind, "not_found">;
      passId: string;
      pass: Pass;
      app: Application;
      student: Student;
      late: boolean;
    };

export function verifyPass(db: DB, raw: string, now: number): VerifyResult {
  const passId = normalizePassId(raw);
  const pass = db.passes.find((p) => p.id === passId);
  const app = pass && db.applications.find((a) => a.id === pass.applicationId);
  const student = pass && getStudent(db, pass.studentId);
  if (!pass || !app || !student) return { kind: "not_found", passId };
  const dep = new Date(app.departure).getTime();
  const ret = new Date(app.expectedReturn).getTime();
  const base = { passId, pass, app, student, late: now > ret };
  if (app.status === "rejected") return { ...base, kind: "rejected" };
  if (app.status === "cancelled" || pass.status === "cancelled")
    return { ...base, kind: "cancelled" };
  if (app.status !== "approved") return { ...base, kind: "cancelled" };
  if (pass.returnAt) return { ...base, kind: "used" };
  if (pass.exitAt) return { ...base, kind: "ready_return" };
  if (now < dep - EXIT_WINDOW_BEFORE_MS) return { ...base, kind: "not_yet_valid" };
  if (now > ret) return { ...base, kind: "expired" };
  return { ...base, kind: "ready_exit" };
}

function guardName(db: DB, guardId: string) {
  return db.staff.find((s) => s.id === guardId)?.name ?? guardId;
}

export function recordExit(db: DB, passId: string, guardId: string, now: number): DB {
  const v = verifyPass(db, passId, now);
  if (v.kind !== "ready_exit") throw new Error(gateErrorMessage(v.kind, "exit"));
  const at = new Date(now).toISOString();
  const [id, seq] = nextId(db, "G");
  const log: GateLog = {
    id,
    passId: v.pass.id,
    applicationId: v.app.id,
    studentId: v.student.id,
    type: "exit",
    at,
    guardId,
    guardName: guardName(db, guardId),
  };
  let next: DB = {
    ...db,
    seq,
    passes: db.passes.map((p) => (p.id === v.pass.id ? { ...p, exitAt: at, exitGuardId: guardId } : p)),
    gateLogs: [log, ...db.gateLogs],
  };
  next = notify(next, v.student.id, "Exit recorded", `You left the hostel on pass ${v.pass.id}.`, "info", now);
  return next;
}

export function recordReturn(db: DB, passId: string, guardId: string, now: number): DB {
  const v = verifyPass(db, passId, now);
  if (v.kind !== "ready_return") throw new Error(gateErrorMessage(v.kind, "return"));
  const at = new Date(now).toISOString();
  const [id, seq] = nextId(db, "G");
  const log: GateLog = {
    id,
    passId: v.pass.id,
    applicationId: v.app.id,
    studentId: v.student.id,
    type: "return",
    at,
    guardId,
    guardName: guardName(db, guardId),
    late: v.late,
  };
  let next: DB = {
    ...db,
    seq,
    passes: db.passes.map((p) =>
      p.id === v.pass.id ? { ...p, returnAt: at, returnGuardId: guardId } : p,
    ),
    gateLogs: [log, ...db.gateLogs],
  };
  next = notify(
    next,
    v.student.id,
    v.late ? "Late return recorded" : "Return recorded",
    `Welcome back. Pass ${v.pass.id} is now closed.`,
    v.late ? "warning" : "success",
    now,
  );
  if (v.late)
    next = notify(
      next,
      "admin",
      "Late return",
      `${v.student.name} (${v.student.usn}) returned after the expected time on ${v.app.id}.`,
      "warning",
      now,
    );
  return next;
}

export function gateErrorMessage(kind: VerifyKind, action: "exit" | "return"): string {
  switch (kind) {
    case "not_found":
      return "Invalid pass — this pass ID does not exist.";
    case "rejected":
      return "Pass rejected by the warden.";
    case "cancelled":
      return "This pass has been cancelled.";
    case "not_yet_valid":
      return "Pass is not valid yet — departure window has not opened.";
    case "expired":
      return "Pass expired — the expected return time has passed.";
    case "used":
      return "Pass already used — exit and return are both recorded.";
    case "ready_exit":
      return action === "return" ? "Exit has not been recorded for this pass yet." : "";
    case "ready_return":
      return action === "exit" ? "Exit already recorded — student is currently outside." : "";
  }
}

/* ---------------------------------------------------------- derived state */

export type GateState = "not_exited" | "outside" | "returned" | "expired" | "none";

export function gateState(db: DB, app: Application, now: number): GateState {
  if (app.status !== "approved" || !app.passId) return "none";
  const pass = db.passes.find((p) => p.id === app.passId);
  if (!pass) return "none";
  if (pass.returnAt) return "returned";
  if (pass.exitAt) return "outside";
  if (now > new Date(app.expectedReturn).getTime()) return "expired";
  return "not_exited";
}

export function studentsOutside(db: DB) {
  return db.passes
    .filter((p) => p.exitAt && !p.returnAt)
    .map((p) => ({
      pass: p,
      app: db.applications.find((a) => a.id === p.applicationId)!,
      student: getStudent(db, p.studentId)!,
    }))
    .filter((x) => x.app && x.student);
}

/* ---------------------------------------------------------- analytics */

export function percent(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((part / total) * 100 * 100) / 100;
}

function dayKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function computeAnalytics(db: DB, now: number) {
  const apps = db.applications;
  const total = apps.length;
  const approved = apps.filter((a) => a.status === "approved").length;
  const rejected = apps.filter((a) => a.status === "rejected").length;
  const pending = apps.filter((a) => a.status === "pending").length;
  const cancelled = apps.filter((a) => a.status === "cancelled").length;

  const completed = db.passes.filter((p) => p.exitAt && p.returnAt);
  const durations = completed.map(
    (p) => (new Date(p.returnAt!).getTime() - new Date(p.exitAt!).getTime()) / MINUTE,
  );
  const totalMinutesOutside = durations.reduce((s, d) => s + d, 0);
  const avgMinutesOutside = durations.length ? totalMinutesOutside / durations.length : 0;
  const sorted = [...durations].sort((a, b) => a - b);
  const medianMinutes = sorted.length
    ? sorted.length % 2
      ? sorted[(sorted.length - 1) / 2]!
      : (sorted[sorted.length / 2 - 1]! + sorted[sorted.length / 2]!) / 2
    : 0;
  const stdDevMinutes = durations.length
    ? Math.sqrt(
        durations.reduce((s, d) => s + (d - avgMinutesOutside) ** 2, 0) / durations.length,
      )
    : 0;

  // Outpasses per day (by departure date), last 14 days.
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const perDay: { key: string; label: string; count: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today.getTime() - i * DAY);
    perDay.push({
      key: dayKey(d),
      label: d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
      count: 0,
    });
  }
  const dayIndex = new Map(perDay.map((d, i) => [d.key, i]));
  for (const a of apps) {
    const i = dayIndex.get(dayKey(new Date(a.departure)));
    if (i !== undefined) perDay[i]!.count++;
  }

  // Weekly statistics (by application date), last 6 weeks.
  const weekly: { label: string; approved: number; rejected: number; pending: number; total: number }[] =
    [];
  for (let w = 5; w >= 0; w--) {
    const end = today.getTime() + DAY - w * 7 * DAY;
    const start = end - 7 * DAY;
    const inWeek = apps.filter((a) => {
      const t = new Date(a.createdAt).getTime();
      return t >= start && t < end;
    });
    weekly.push({
      label: w === 0 ? "This week" : `${w}w ago`,
      approved: inWeek.filter((a) => a.status === "approved").length,
      rejected: inWeek.filter((a) => a.status === "rejected").length,
      pending: inWeek.filter((a) => a.status === "pending").length,
      total: inWeek.length,
    });
  }

  // Peak departure hours from actual gate exits.
  const peakHours = Array.from({ length: 24 }, (_, h) => ({
    hour: h,
    label: `${String(h).padStart(2, "0")}:00`,
    count: 0,
  }));
  for (const log of db.gateLogs) if (log.type === "exit") peakHours[new Date(log.at).getHours()]!.count++;
  const peak = peakHours.reduce<{ hour: number; count: number } | null>(
    (best, h) => (h.count > 0 && (!best || h.count > best.count) ? h : best),
    null,
  );

  const byType = OUTPASS_TYPES.map((t) => ({ type: t, count: apps.filter((a) => a.type === t).length }));
  const lateReturns = db.gateLogs.filter((l) => l.type === "return" && l.late).length;

  return {
    total,
    approved,
    rejected,
    pending,
    cancelled,
    approvalPct: percent(approved, total),
    rejectionPct: percent(rejected, total),
    pendingPct: percent(pending, total),
    completedCount: completed.length,
    totalMinutesOutside,
    avgMinutesOutside,
    medianMinutes,
    stdDevMinutes,
    perDay,
    weekly,
    peakHours,
    peakHour: peak,
    byType,
    lateReturns,
    currentlyOutside: studentsOutside(db).length,
  };
}

export type Analytics = ReturnType<typeof computeAnalytics>;
