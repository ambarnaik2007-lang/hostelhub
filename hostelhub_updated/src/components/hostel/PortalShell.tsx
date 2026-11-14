import { Link, useNavigate, type LinkProps } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import { Bell, LogOut, Menu, RotateCcw } from "lucide-react";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { actions } from "@/lib/hostel/store";
import { cn } from "@/lib/utils";
import { Logo } from "./Logo";
import { StudentAvatar } from "./ui-bits";

export interface NavItem {
  to: NonNullable<LinkProps["to"]>;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
  badge?: number;
}

interface Props {
  portal: string;
  nav: NavItem[];
  user: { name: string; subtitle: string };
  notificationsTo?: NonNullable<LinkProps["to"]>;
  unread?: number;
  children: ReactNode;
}

function NavList({ nav, onNavigate, onLogout }: { nav: NavItem[]; onNavigate?: (() => void) | undefined; onLogout: () => void }) {
  return (
    <nav className="flex flex-1 flex-col gap-1 px-3">
      {nav.map((item) => (
        <Link
          key={item.label}
          to={item.to}
          activeOptions={{ exact: item.exact ?? false }}
          onClick={onNavigate}
          className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-muted transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground data-[status=active]:bg-sidebar-accent data-[status=active]:text-sidebar-accent-foreground"
        >
          <item.icon className="h-[18px] w-[18px] shrink-0 group-data-[status=active]:text-sidebar-primary" />
          <span className="flex-1">{item.label}</span>
          {!!item.badge && (
            <span className="rounded-full bg-sidebar-primary px-2 py-0.5 text-[11px] font-bold text-sidebar-primary-foreground">
              {item.badge}
            </span>
          )}
        </Link>
      ))}
      <button
        onClick={onLogout}
        className="mt-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-sidebar-muted transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
      >
        <LogOut className="h-[18px] w-[18px]" />
        Logout
      </button>
    </nav>
  );
}

function SidebarBody({ portal, nav, user, onNavigate, onLogout }: Props & { onNavigate?: (() => void) | undefined; onLogout: () => void }) {
  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="px-6 pb-6 pt-6">
        <Logo inverted />
      </div>
      <div className="px-6 pb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-sidebar-muted">{portal}</div>
      <NavList nav={nav} onNavigate={onNavigate} onLogout={onLogout} />
      <div className="m-3 mt-6 flex items-center gap-3 rounded-xl border border-sidebar-border bg-sidebar-accent/50 p-3">
        <StudentAvatar name={user.name} size="sm" />
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-sidebar-accent-foreground">{user.name}</div>
          <div className="truncate text-xs text-sidebar-muted">{user.subtitle}</div>
        </div>
      </div>
    </div>
  );
}

export function PortalShell(props: Props) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const logout = () => {
    actions.logout();
    navigate({ to: "/" });
  };
  const reset = () => {
    if (window.confirm("Reset all demo data to the original sample records?")) {
      actions.resetDemo();
      toast.success("Demo data reset");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block">
        <SidebarBody {...props} onLogout={logout} />
      </aside>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-72 border-sidebar-border bg-sidebar p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SidebarBody {...props} onNavigate={() => setOpen(false)} onLogout={logout} />
        </SheetContent>
      </Sheet>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b bg-card/90 px-4 backdrop-blur md:px-8">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </Button>
          <div className="lg:hidden">
            <Logo />
          </div>
          <div className="hidden text-sm text-muted-foreground lg:block">
            <span className="font-semibold text-foreground">{props.portal}</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden rounded-full border border-warning/25 bg-warning-soft px-2.5 py-1 text-[11px] font-semibold text-warning sm:inline">
              Demo mode
            </span>
            <Button variant="ghost" size="icon" onClick={reset} aria-label="Reset demo data" title="Reset demo data">
              <RotateCcw className="h-4 w-4" />
            </Button>
            {props.notificationsTo && (
              <Button variant="ghost" size="icon" asChild aria-label="Notifications">
                <Link to={props.notificationsTo} className="relative">
                  <Bell className="h-5 w-5" />
                  {!!props.unread && (
                    <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                      {props.unread}
                    </span>
                  )}
                </Link>
              </Button>
            )}
            <div className="hidden items-center gap-2 border-l pl-3 md:flex">
              <StudentAvatar name={props.user.name} size="sm" />
              <div className="leading-tight">
                <div className="text-sm font-semibold">{props.user.name}</div>
                <div className="text-xs text-muted-foreground">{props.user.subtitle}</div>
              </div>
            </div>
          </div>
        </header>
        <main className={cn("mx-auto w-full max-w-7xl px-4 py-6 md:px-8 md:py-8")}>{props.children}</main>
      </div>
    </div>
  );
}
