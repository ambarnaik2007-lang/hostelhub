import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({ className, inverted = false }: { className?: string; inverted?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-xl",
          inverted ? "bg-sidebar-primary text-sidebar-primary-foreground" : "bg-primary text-primary-foreground",
        )}
      >
        <ShieldCheck className="h-5 w-5" strokeWidth={2.25} />
      </div>
      <div className="leading-none">
        <div className={cn("text-lg font-extrabold tracking-tight", inverted ? "text-sidebar-accent-foreground" : "text-foreground")}>
          Hostel<span className={inverted ? "text-sidebar-primary" : "text-info"}>Hub</span>
        </div>
        <div className={cn("mt-1 text-[10px] font-semibold uppercase tracking-[0.14em]", inverted ? "text-sidebar-muted" : "text-muted-foreground")}>
          Digital Outpass System
        </div>
      </div>
    </div>
  );
}
