import { DAY, HOUR, MINUTE, generatePassId } from "./logic";
import type {
  AppNotification,
  Application,
  DB,
  GateLog,
  OutpassType,
  Pass,
  StaffUser,
  Student,
} from "./types";

/** Deterministic PRNG so the demo data is the same on every reset. */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const STUDENT_ROWS: [string, string, string, string, string, string, string, string][] = [
  // name, usn, course, year, block, room, guardian, blood
  ["Aarav Sharma", "1RV23CS001", "B.E. Computer Science", "2nd Year", "Himalaya", "A-214", "Rakesh Sharma", "B+"],
  ["Ananya Rao", "1RV23EC014", "B.E. Electronics & Communication", "2nd Year", "Puravanchal Girl Hostel", "C-108", "Suresh Rao", "O+"],
  ["Rohan Mehta", "1RV22ME032", "B.E. Mechanical Engineering", "3rd Year", "Karakoram", "B-305", "Kiran Mehta", "A+"],
  ["Priya Nair", "1RV24IS007", "B.E. Information Science", "1st Year", "Puravanchal Girl Hostel", "C-212", "Lakshmi Nair", "AB+"],
  ["Karthik Reddy", "1RV22CV019", "B.E. Civil Engineering", "3rd Year", "Karakoram", "B-118", "Venkat Reddy", "O-"],
  ["Sneha Kulkarni", "1RV23AI021", "B.E. AI & Machine Learning", "2nd Year", "Puravanchal Girl Hostel", "C-304", "Anil Kulkarni", "B+"],
  ["Vikram Singh", "1RV21CS045", "B.E. Computer Science", "4th Year", "Los Altos", "A-401", "Harpreet Singh", "A-"],
  ["Diya Menon", "1RV24BT003", "B.E. Biotechnology", "1st Year", "Puravanchal Girl Hostel", "C-115", "Ravi Menon", "O+"],
  ["Arjun Patel", "1RV23EE027", "B.E. Electrical & Electronics", "2nd Year", "Himalaya", "A-207", "Mahesh Patel", "B-"],
  ["Meghana Gowda", "1RV22CH011", "B.E. Chemical Engineering", "3rd Year", "Puravanchal Girl Hostel", "C-221", "Ramesh Gowda", "A+"],
  ["Nikhil Joshi", "1RV24ME040", "B.E. Mechanical Engineering", "1st Year", "Karakoram", "B-102", "Sanjay Joshi", "O+"],
  ["Ishita Banerjee", "1RV21EC033", "B.E. Electronics & Communication", "4th Year", "Puravanchal Girl Hostel", "C-410", "Debashis Banerjee", "AB-"],
  ["Siddharth Iyer", "1RV23IS018", "B.E. Information Science", "2nd Year", "Los Altos", "A-309", "Ganesh Iyer", "B+"],
  ["Tanvi Deshpande", "1RV22AI009", "B.E. AI & Machine Learning", "3rd Year", "Puravanchal Girl Hostel", "C-317", "Prakash Deshpande", "A+"],
];

const STAFF: StaffUser[] = [
  { id: "adm-001", email: "admin@hostelhub.demo", role: "admin", name: "Dr. Meera Iyer", title: "Chief Warden", phone: "+91 80 4000 1100" },
  { id: "adm-002", email: "deputy.warden@hostelhub.demo", role: "admin", name: "Prakash Hegde", title: "Deputy Warden", phone: "+91 80 4000 1101" },
  { id: "sec-001", email: "security@hostelhub.demo", role: "security", name: "Rajesh Kumar", title: "Main Gate · Day Shift", phone: "+91 80 4000 1200" },
  { id: "sec-002", email: "night.gate@hostelhub.demo", role: "security", name: "Manjunath B.", title: "Main Gate · Night Shift", phone: "+91 80 4000 1201" },
];

const DESTINATIONS: Record<OutpassType, string[]> = {
  "Day Outing": ["City Centre Mall", "Jayanagar 4th Block", "Lalbagh Botanical Garden", "Central Library", "Indiranagar", "Commercial Street"],
  "Overnight Leave": ["Relative's house – Indiranagar", "Uncle's house – Malleshwaram", "Friend's family – Whitefield"],
  "Emergency Leave": ["Home – Mysuru", "Home – Hubballi", "Home – Mangaluru"],
  "Weekend Leave": ["Home – Mysuru", "Home – Davanagere", "Home – Tumakuru", "Home – Chennai"],
  "Medical Leave": ["Apollo Clinic, Jayanagar", "City Dental Care", "Manipal Hospital, Old Airport Rd"],
};

const REASONS: Record<OutpassType, string[]> = {
  "Day Outing": ["Buying stationery and project materials", "Personal shopping", "Group study at the city library", "Meeting family visiting the city"],
  "Overnight Leave": ["Family function at relative's house", "Cousin's engagement ceremony", "Visiting grandparents"],
  "Emergency Leave": ["Family medical emergency", "Grandparent hospitalised", "Urgent family matter"],
  "Weekend Leave": ["Going home for the weekend", "Festival celebration with family", "Family visit"],
  "Medical Leave": ["Dental check-up appointment", "Follow-up consultation with physician", "Eye test and spectacles"],
};

const REJECT_REASONS = [
  "Insufficient reason for overnight leave during internal assessments.",
  "Parent confirmation call could not be completed.",
  "Requested dates clash with the mandatory hostel meeting.",
  "Return time exceeds the hostel curfew (9:30 PM) for day outings.",
];

const DURATION_HOURS: Record<OutpassType, [number, number]> = {
  "Day Outing": [3, 8],
  "Overnight Leave": [14, 22],
  "Emergency Leave": [24, 72],
  "Weekend Leave": [34, 52],
  "Medical Leave": [2, 5],
};

interface Draft {
  studentId: string;
  type: OutpassType;
  dep: number;
  ret: number;
  created: number;
  status: Application["status"];
  exit?: number;
  back?: number;
  rejection?: string;
  reviewer?: string | undefined;
  destination?: string | undefined;
  reason?: string | undefined;
}

export function makeSeed(nowMs: number): DB {
  const rand = mulberry32(20261113);
  const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)]!;
  const between = (a: number, b: number) => a + rand() * (b - a);

  const students: Student[] = STUDENT_ROWS.map((r, i) => {
    const surname = (r[0].split(" ").slice(-1)[0] ?? "").toLowerCase();
    return {
      id: `stu-${String(i + 1).padStart(3, "0")}`,
      name: r[0],
      usn: r[1],
      course: r[2],
      year: r[3],
      block: r[4],
      room: r[5],
      email: i === 0 ? "student@hostelhub.demo" : `${(r[0].split(" ")[0] ?? "").toLowerCase()}.${surname}@hostelhub.demo`,
      mobile: `+91 9${Math.floor(between(100000000, 999999999))}`.replace(/(\+91 \d{5})(\d{5})/, "$1 $2"),
      emergencyName: r[6],
      emergencyRelation: i % 3 === 1 ? "Mother" : "Father",
      emergencyPhone: `+91 9${Math.floor(between(100000000, 999999999))}`.replace(/(\+91 \d{5})(\d{5})/, "$1 $2"),
      bloodGroup: r[7],
    };
  });
  const demo = students[0]!;
  demo.mobile = "+91 98450 12345";
  demo.emergencyPhone = "+91 98860 54321";

  const today = new Date(nowMs);
  today.setHours(0, 0, 0, 0);
  const t0 = today.getTime();
  const types: OutpassType[] = [
    "Day Outing", "Day Outing", "Day Outing", "Day Outing", "Overnight Leave",
    "Weekend Leave", "Weekend Leave", "Medical Leave", "Medical Leave", "Emergency Leave",
  ];
  const hours = [7, 8, 9, 9, 10, 10, 10, 11, 13, 14, 15, 16, 16, 17, 17, 18, 19];
  const drafts: Draft[] = [];

  // Historical records for other students.
  for (let i = 0; i < 46; i++) {
    const student = students[1 + Math.floor(rand() * (students.length - 1))]!;
    const type = pick(types);
    const dep = t0 - (1 + Math.floor(rand() * 34)) * DAY + pick(hours) * HOUR + pick([0, 15, 30, 45]) * MINUTE;
    const [lo, hi] = DURATION_HOURS[type];
    const ret = dep + Math.round(between(lo, hi)) * HOUR;
    const created = dep - between(3, 40) * HOUR;
    const r = rand();
    const status: Application["status"] = r < 0.74 ? "approved" : r < 0.92 ? "rejected" : "cancelled";
    const d: Draft = { studentId: student.id, type, dep, ret, created, status, reviewer: pick(["adm-001", "adm-002"]) };
    if (status === "rejected") d.rejection = pick(REJECT_REASONS);
    if (status === "approved" && ret < nowMs && rand() < 0.94) {
      d.exit = dep + between(-15, 40) * MINUTE;
      const back = ret + between(-150, 70) * MINUTE;
      d.back = Math.max(back, d.exit + 45 * MINUTE);
    }
    drafts.push(d);
  }

  // Demo student's own history.
  const s0 = demo.id;
  const own: [number, OutpassType, number, number, Application["status"]][] = [
    [-26, "Weekend Leave", 9, 48, "approved"],
    [-15, "Day Outing", 15, 5, "approved"],
    [-9, "Overnight Leave", 17, 18, "rejected"],
    [-4, "Medical Leave", 10, 3, "approved"],
  ];
  for (const [day, type, hour, dur, status] of own) {
    const dep = t0 + day * DAY + hour * HOUR;
    const ret = dep + dur * HOUR;
    const d: Draft = {
      studentId: s0,
      type,
      dep,
      ret,
      created: dep - 20 * HOUR,
      status,
      reviewer: "adm-001",
      destination: type === "Weekend Leave" ? "Home – Mysuru" : type === "Day Outing" ? "Commercial Street" : type === "Medical Leave" ? "Apollo Clinic, Jayanagar" : "Uncle's house – Malleshwaram",
    };
    if (status === "rejected") d.rejection = REJECT_REASONS[0]!;
    if (status === "approved") {
      d.exit = dep + 10 * MINUTE;
      d.back = ret - 25 * MINUTE;
    }
    drafts.push(d);
  }

  // Students currently outside.
  for (const idx of [2, 6]) {
    const dep = nowMs - between(2, 4) * HOUR;
    drafts.push({
      studentId: students[idx]!.id,
      type: "Day Outing",
      dep,
      ret: nowMs + between(2, 5) * HOUR,
      created: dep - 10 * HOUR,
      status: "approved",
      exit: dep + 8 * MINUTE,
      reviewer: "adm-001",
    });
  }
  // One overdue student (still outside, past expected return).
  {
    const dep = nowMs - 9 * HOUR;
    drafts.push({ studentId: students[10]!.id, type: "Day Outing", dep, ret: nowMs - 40 * MINUTE, created: dep - 6 * HOUR, status: "approved", exit: dep + 5 * MINUTE, reviewer: "adm-002" });
  }
  // Approved upcoming passes.
  for (const idx of [5, 12]) {
    const dep = t0 + DAY + pick([9, 10, 16]) * HOUR;
    drafts.push({ studentId: students[idx]!.id, type: pick(types), dep, ret: dep + 6 * HOUR, created: nowMs - between(3, 12) * HOUR, status: "approved", reviewer: "adm-001" });
  }
  // Pending applications waiting for the warden.
  for (const idx of [1, 3, 7, 9, 13]) {
    const type = pick(types);
    const dep = t0 + (1 + Math.floor(rand() * 3)) * DAY + pick(hours) * HOUR;
    const [lo, hi] = DURATION_HOURS[type];
    drafts.push({ studentId: students[idx]!.id, type, dep, ret: dep + Math.round(between(lo, hi)) * HOUR, created: nowMs - between(0.5, 14) * HOUR, status: "pending" });
  }

  drafts.sort((a, b) => a.created - b.created);

  const applications: Application[] = [];
  const passes: Pass[] = [];
  const gateLogs: GateLog[] = [];
  const passIds = new Set<string>();
  let seq = 0;
  const iso = (t: number) => new Date(t).toISOString();
  const guardFor = (t: number) => {
    const h = new Date(t).getHours();
    return h >= 7 && h < 19 ? STAFF[2]! : STAFF[3]!;
  };

  drafts.forEach((d, i) => {
    const id = `OP-${1001 + i}`;
    const app: Application = {
      id,
      studentId: d.studentId,
      type: d.type,
      destination: d.destination ?? pick(DESTINATIONS[d.type]),
      reason: d.reason ?? pick(REASONS[d.type]),
      departure: iso(d.dep),
      expectedReturn: iso(d.ret),
      remarks: rand() < 0.3 ? "Will be reachable on my registered mobile number." : "",
      status: d.status,
      createdAt: iso(d.created),
    };
    if (d.status !== "pending" && d.status !== "cancelled") {
      app.reviewedAt = iso(d.created + between(0.5, 6) * HOUR);
      if (d.reviewer) app.reviewedBy = d.reviewer;
    }
    if (d.status === "cancelled") app.cancelledAt = iso(d.created + 2 * HOUR);
    if (d.rejection) app.rejectionReason = d.rejection;
    if (d.status === "approved") {
      const passId = generatePassId(rand, passIds);
      passIds.add(passId);
      app.passId = passId;
      const pass: Pass = { id: passId, applicationId: id, studentId: d.studentId, issuedAt: app.reviewedAt!, status: "active" };
      if (d.exit) {
        const g = guardFor(d.exit);
        pass.exitAt = iso(d.exit);
        pass.exitGuardId = g.id;
        gateLogs.push({ id: `G-${++seq}`, passId, applicationId: id, studentId: d.studentId, type: "exit", at: pass.exitAt, guardId: g.id, guardName: g.name });
      }
      if (d.back) {
        const g = guardFor(d.back);
        pass.returnAt = iso(d.back);
        pass.returnGuardId = g.id;
        gateLogs.push({ id: `G-${++seq}`, passId, applicationId: id, studentId: d.studentId, type: "return", at: pass.returnAt, guardId: g.id, guardName: g.name, late: d.back > d.ret });
      }
      passes.push(pass);
    }
    applications.push(app);
  });

  applications.reverse();
  passes.reverse();
  gateLogs.sort((a, b) => b.at.localeCompare(a.at));

  const notifications: AppNotification[] = [];
  const addN = (n: Omit<AppNotification, "id" | "read"> & { read?: boolean }) =>
    notifications.push({ id: `N-${++seq}`, read: n.read ?? true, ...n });
  addN({ recipient: s0, title: "Welcome to HostelHub", message: "Apply for outpasses online and show your QR pass at the gate.", kind: "info", at: iso(t0 - 27 * DAY), read: true });
  for (const a of applications.filter((x) => x.studentId === s0)) {
    if (a.status === "approved")
      addN({ recipient: s0, title: "Outpass approved", message: `${a.id} was approved. QR pass ${a.passId} issued.`, kind: "success", at: a.reviewedAt! });
    if (a.status === "rejected")
      addN({ recipient: s0, title: "Outpass rejected", message: `${a.id} was rejected. Reason: ${a.rejectionReason}`, kind: "danger", at: a.reviewedAt! });
  }
  for (const a of applications.filter((x) => x.status === "pending")) {
    const st = students.find((s) => s.id === a.studentId)!;
    addN({ recipient: "admin", title: "New outpass application", message: `${st.name} (${st.usn}) applied for ${a.type} to ${a.destination}.`, kind: "info", at: a.createdAt, read: false });
  }
  notifications.sort((a, b) => b.at.localeCompare(a.at));

  return { version: 1, seq, students, staff: STAFF, applications, passes, gateLogs, notifications };
}
