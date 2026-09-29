import Link from "next/link";
import type { Booking, ContactEnquiry } from "@/db/schema";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { BOOKING_STATUS_LABELS, BOOKING_STATUS_TONES, ENQUIRY_STATUS_LABELS, ENQUIRY_STATUS_TONES } from "@/lib/booking/status";
import { fullName } from "@/lib/format";
import { formatDate, formatTime } from "@/lib/time";

export function BookingStatusBadge({ status }: { status: Booking["status"] }) {
  return <StatusBadge tone={BOOKING_STATUS_TONES[status]}>{BOOKING_STATUS_LABELS[status]}</StatusBadge>;
}

export function EnquiryStatusBadge({ status }: { status: ContactEnquiry["status"] }) {
  return <StatusBadge tone={ENQUIRY_STATUS_TONES[status]}>{ENQUIRY_STATUS_LABELS[status]}</StatusBadge>;
}

/** Compact booking line used on the dashboard. */
export function BookingLine({ booking, tz }: { booking: Booking; tz: string }) {
  return (
    <Link href={`/admin/reservations/${booking.id}`} className="flex items-center gap-4 rounded-md px-2 py-3 hover:bg-ink/[0.03]">
      <span className="w-16 shrink-0 text-center">
        <span className="block text-xs text-subtle">{formatDate(booking.startsAt, tz).slice(0, 5)}</span>
        <span className="block text-base font-semibold tabular-nums">{formatTime(booking.startsAt, tz)}</span>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">{fullName(booking)}{booking.company ? ` · ${booking.company}` : ""}</span>
        <span className="block truncate text-sm text-muted">
          {booking.serviceTitle}
          {booking.city ? ` · ${booking.city}` : ""}
        </span>
      </span>
      <BookingStatusBadge status={booking.status} />
    </Link>
  );
}
