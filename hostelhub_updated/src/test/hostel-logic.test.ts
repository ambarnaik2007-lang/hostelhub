import { describe, expect, it } from "vitest";
import {
  HOUR,
  approveApplication,
  authenticate,
  computeAnalytics,
  percent,
  recordExit,
  recordReturn,
  rejectApplication,
  submitApplication,
  validateApplication,
  verifyPass,
  type ApplicationInput,
} from "@/lib/hostel/logic";
import { makeSeed, mulberry32 } from "@/lib/hostel/seed";

const NOW = new Date("2026-11-14T10:00:00").getTime();
const input = (over: Partial<ApplicationInput> = {}): ApplicationInput => ({
  type: "Day Outing",
  destination: "City Centre Mall",
  reason: "Buying project materials",
  departureDate: "2026-11-14",
  departureTime: "11:00",
  returnDate: "2026-11-14",
  returnTime: "17:00",
  remarks: "",
  ...over,
});

describe("HostelHub rules", () => {
  it("rejects a return time that is not after departure", () => {
    const r = validateApplication(input({ returnTime: "10:30" }), NOW);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.returnTime).toBeTruthy();
  });

  it("demo logins only work with Demo123! and the matching role", () => {
    const db = makeSeed(NOW);
    expect(authenticate(db, "student", "student@hostelhub.demo", "Demo123!").ok).toBe(true);
    expect(authenticate(db, "student", "student@hostelhub.demo", "wrong").ok).toBe(false);
    expect(authenticate(db, "admin", "student@hostelhub.demo", "Demo123!").ok).toBe(false);
  });

  it("new applications start as pending", () => {
    const { application } = submitApplication(makeSeed(NOW), "stu-001", input(), NOW);
    expect(application.status).toBe("pending");
  });

  it("full flow: approve → exit → return, blocking duplicates", () => {
    let db = makeSeed(NOW);
    const sub = submitApplication(db, "stu-001", input(), NOW);
    const ap = approveApplication(sub.db, sub.application.id, "adm-001", NOW, mulberry32(1));
    db = ap.db;
    expect(db.applications.find((a) => a.id === sub.application.id)?.status).toBe("approved");
    expect(ap.pass.id).toMatch(/^HP-[A-Z0-9]{8}$/);
    expect(verifyPass(db, ap.pass.id, NOW).kind).toBe("ready_exit");
    expect(() => recordReturn(db, ap.pass.id, "sec-001", NOW)).toThrow();
    db = recordExit(db, ap.pass.id, "sec-001", NOW);
    expect(() => recordExit(db, ap.pass.id, "sec-001", NOW)).toThrow();
    expect(verifyPass(db, ap.pass.id, NOW).kind).toBe("ready_return");
    db = recordReturn(db, ap.pass.id, "sec-001", NOW + HOUR);
    expect(verifyPass(db, ap.pass.id, NOW + HOUR).kind).toBe("used");
    expect(() => recordReturn(db, ap.pass.id, "sec-001", NOW + HOUR)).toThrow();
  });

  it("flags unknown, expired and rejected passes", () => {
    const db0 = makeSeed(NOW);
    expect(verifyPass(db0, "HP-NOPE1234", NOW).kind).toBe("not_found");
    const sub = submitApplication(db0, "stu-001", input(), NOW);
    const ap = approveApplication(sub.db, sub.application.id, "adm-001", NOW, mulberry32(2));
    expect(verifyPass(ap.db, ap.pass.id, NOW + 8 * HOUR).kind).toBe("expired");
    const revoked = rejectApplication(ap.db, sub.application.id, "adm-001", "Revoked", NOW);
    expect(verifyPass(revoked, ap.pass.id, NOW).kind).toBe("rejected");
  });

  it("approval % = approved / total × 100", () => {
    expect(percent(3, 4)).toBe(75);
    const a = computeAnalytics(makeSeed(NOW), NOW);
    expect(a.approvalPct).toBe(percent(a.approved, a.total));
    expect(a.approved + a.rejected + a.pending + a.cancelled).toBe(a.total);
  });
});
