import { useDB, useSession } from "./store";
import type { DB, StaffUser, Student } from "./types";

/** For use inside the student layout, which guarantees a signed-in student. */
export function useStudentContext(): { db: DB; student: Student } {
  const db = useDB()!;
  const session = useSession()!;
  return { db, student: db.students.find((s) => s.id === session.userId)! };
}

/** For use inside the admin and security layouts, which guarantee a signed-in staff user. */
export function useStaffContext(): { db: DB; user: StaffUser } {
  const db = useDB()!;
  const session = useSession()!;
  return { db, user: db.staff.find((s) => s.id === session.userId)! };
}
