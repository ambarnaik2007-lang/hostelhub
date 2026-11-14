import { format, formatDistanceToNowStrict } from "date-fns";

export const fmtDateTime = (iso?: string) => (iso ? format(new Date(iso), "dd MMM yyyy, hh:mm a") : "—");
export const fmtDate = (iso?: string) => (iso ? format(new Date(iso), "dd MMM yyyy") : "—");
export const fmtTime = (iso?: string) => (iso ? format(new Date(iso), "hh:mm a") : "—");
export const fmtRelative = (iso: string) => formatDistanceToNowStrict(new Date(iso), { addSuffix: true });

export function fmtDuration(minutes: number) {
  if (!Number.isFinite(minutes) || minutes <= 0) return "0m";
  const m = Math.round(minutes);
  const d = Math.floor(m / 1440);
  const h = Math.floor((m % 1440) / 60);
  const mm = m % 60;
  return [d ? `${d}d` : "", h ? `${h}h` : "", mm || (!d && !h) ? `${mm}m` : ""].filter(Boolean).join(" ");
}

export const initials = (name: string) =>
  name
    .replace(/^(Dr\.|Mr\.|Ms\.)\s*/, "")
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

export function pageHead(title: string, description: string) {
  const full = `${title} · HostelHub`;
  return {
    meta: [
      { title: full },
      { name: "description", content: description },
      { property: "og:title", content: full },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  };
}
