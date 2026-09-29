import type { StatusTone } from "@/lib/booking/status";

const tones: Record<StatusTone, string> = {
  warning: "bg-amber-50 text-amber-900 ring-amber-600/25",
  success: "bg-emerald-50 text-emerald-900 ring-emerald-600/25",
  danger: "bg-red-50 text-red-900 ring-red-600/25",
  neutral: "bg-stone-100 text-stone-700 ring-stone-500/20",
  info: "bg-sky-50 text-sky-900 ring-sky-600/25",
};

const dots: Record<StatusTone, string> = {
  warning: "bg-amber-500",
  success: "bg-emerald-600",
  danger: "bg-red-600",
  neutral: "bg-stone-400",
  info: "bg-sky-600",
};

export function StatusBadge({ tone, children }: { tone: StatusTone; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${tones[tone]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dots[tone]}`} aria-hidden="true" />
      {children}
    </span>
  );
}
