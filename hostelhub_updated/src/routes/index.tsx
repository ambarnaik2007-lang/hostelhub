import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Eye, EyeOff, GraduationCap, Info, QrCode, ShieldCheck, UserCog } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import hostelGate from "@/assets/hostel-gate.jpg";
import { Logo } from "@/components/hostel/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { pageHead } from "@/lib/hostel/format";
import { actions, useSession } from "@/lib/hostel/store";
import { DEMO_ACCOUNTS, DEMO_PASSWORD, type Role } from "@/lib/hostel/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () =>
    pageHead(
      "Sign in",
      "Sign in to HostelHub as a student, warden or security guard to manage digital hostel outpasses.",
    ),
  component: LoginPage,
});

const ROLES: { role: Role; label: string; icon: typeof GraduationCap; desc: string }[] = [
  { role: "student", label: "Student", icon: GraduationCap, desc: "Apply & view passes" },
  { role: "admin", label: "Admin / Warden", icon: UserCog, desc: "Review applications" },
  { role: "security", label: "Security Guard", icon: ShieldCheck, desc: "Verify at the gate" },
];

const HOME: Record<Role, "/student" | "/admin" | "/security"> = {
  student: "/student",
  admin: "/admin",
  security: "/security",
};

function LoginPage() {
  const navigate = useNavigate();
  const session = useSession();
  const [role, setRole] = useState<Role>("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (session) navigate({ to: HOME[session.role] });
  }, [session, navigate]);

  const fillDemo = (r: Role) => {
    setRole(r);
    setEmail(DEMO_ACCOUNTS[r].email);
    setPassword(DEMO_PASSWORD);
    setError("");
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }
    const res = actions.login(role, email, password);
    if (!res.ok) setError(res.error);
    else navigate({ to: HOME[role] });
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <section className="relative hidden overflow-hidden bg-sidebar lg:block">
        <img src={hostelGate} alt="Hostel main gate at dusk" width={1024} height={1280} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-navy-overlay" />
        <div className="relative flex h-full flex-col justify-between p-12">
          <Logo inverted />
          <div className="max-w-md">
            <h1 className="text-4xl font-extrabold leading-tight text-sidebar-accent-foreground">
              Hostel outpasses, without the paperwork.
            </h1>
            <p className="mt-4 text-base text-sidebar-foreground">
              Students apply online, wardens approve in one click, and security verifies a QR pass at the gate.
            </p>
            <div className="mt-8 grid grid-cols-3 gap-3">
              {[
                { icon: GraduationCap, t: "Apply online" },
                { icon: UserCog, t: "Warden approval" },
                { icon: QrCode, t: "QR gate check" },
              ].map((f) => (
                <div key={f.t} className="rounded-xl border border-sidebar-border bg-sidebar/60 p-4 backdrop-blur">
                  <f.icon className="h-5 w-5 text-sidebar-primary" />
                  <div className="mt-2 text-sm font-semibold text-sidebar-accent-foreground">{f.t}</div>
                </div>
              ))}
            </div>
          </div>
          <p className="text-xs text-sidebar-muted">© 2026 HostelHub · University project prototype</p>
        </div>
      </section>

      <section className="flex items-center justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-md">
          <Logo className="mb-10 lg:hidden" />
          <h2 className="text-3xl font-bold">Welcome back</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">Choose your role and sign in to continue.</p>

          <div className="mt-7 grid grid-cols-3 gap-2" role="radiogroup" aria-label="Login role">
            {ROLES.map((r) => (
              <button
                key={r.role}
                type="button"
                role="radio"
                aria-checked={role === r.role}
                onClick={() => {
                  setRole(r.role);
                  setError("");
                }}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-xl border bg-card px-2 py-3.5 text-center transition-colors",
                  role === r.role
                    ? "border-primary bg-primary-soft text-primary ring-1 ring-primary"
                    : "text-muted-foreground hover:border-ring/40 hover:text-foreground",
                )}
              >
                <r.icon className="h-5 w-5" />
                <span className="text-xs font-semibold leading-tight">{r.label}</span>
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="username"
                placeholder={DEMO_ACCOUNTS[role].email}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={show ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={show ? "Hide password" : "Show password"}
                >
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            {error && <p className="rounded-lg bg-destructive-soft px-3 py-2 text-sm text-destructive">{error}</p>}
            <Button type="submit" size="xl" className="w-full">
              Sign in as {ROLES.find((r) => r.role === role)?.label} <ArrowRight />
            </Button>
          </form>

          <div className="mt-8 rounded-xl border bg-card p-4 shadow-card">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Info className="h-4 w-4 text-info" /> Demonstration accounts
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              For the college demo only — not real authentication. Password for all: <code className="font-mono font-semibold text-foreground">{DEMO_PASSWORD}</code>
            </p>
            <div className="mt-3 space-y-1.5">
              {ROLES.map((r) => (
                <button
                  key={r.role}
                  type="button"
                  onClick={() => fillDemo(r.role)}
                  className="flex w-full items-center justify-between rounded-lg border bg-muted/40 px-3 py-2 text-left text-xs transition-colors hover:border-primary/40 hover:bg-primary-soft"
                >
                  <span className="font-semibold text-foreground">{r.label}</span>
                  <span className="font-mono text-muted-foreground">{DEMO_ACCOUNTS[r.role].email}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
