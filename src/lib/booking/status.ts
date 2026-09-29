import type { BookingStatus, EnquiryStatus } from "@/db/schema";

/** French labels for machine-readable booking status codes. */
export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  pending: "En attente",
  confirmed: "Confirmé",
  refused: "Refusé",
  cancelled: "Annulé",
  completed: "Terminé",
};

export const BOOKING_STATUSES = Object.keys(BOOKING_STATUS_LABELS) as BookingStatus[];

export const ENQUIRY_STATUS_LABELS: Record<EnquiryStatus, string> = {
  new: "Nouveau",
  in_progress: "En cours",
  done: "Traité",
};

export const ENQUIRY_STATUSES = Object.keys(ENQUIRY_STATUS_LABELS) as EnquiryStatus[];

export type StatusTone = "warning" | "success" | "danger" | "neutral" | "info";

export const BOOKING_STATUS_TONES: Record<BookingStatus, StatusTone> = {
  pending: "warning",
  confirmed: "success",
  refused: "danger",
  cancelled: "neutral",
  completed: "info",
};

export const ENQUIRY_STATUS_TONES: Record<EnquiryStatus, StatusTone> = {
  new: "warning",
  in_progress: "info",
  done: "success",
};

/** Allowed transitions from the admin interface. */
export const BOOKING_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  pending: ["confirmed", "refused", "cancelled"],
  confirmed: ["completed", "cancelled"],
  refused: ["pending"],
  cancelled: ["pending"],
  completed: ["confirmed"],
};

/** Statuses that occupy a time slot. */
export const ACTIVE_BOOKING_STATUSES: BookingStatus[] = ["pending", "confirmed"];
