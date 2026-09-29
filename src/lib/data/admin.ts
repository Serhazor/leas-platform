import "server-only";
import { and, asc, count, desc, eq, gte, ilike, inArray, lt, or, sql, type SQL } from "drizzle-orm";
import { getDb } from "@/db";
import {
  activityLog,
  adminUsers,
  availabilityRules,
  blockedPeriods,
  bookings,
  contactEnquiries,
  faqs,
  media,
  pages,
  pageSections,
  processSteps,
  serviceCategories,
  serviceImages,
  services,
  siteSettings,
  type BookingStatus,
  type EnquiryStatus,
} from "@/db/schema";
import { BOOKING_STATUSES, ENQUIRY_STATUSES } from "@/lib/booking/status";
import { toImage, type ResolvedImage } from "./public";

export const PAGE_SIZE = 25;

async function mediaMap(ids: (string | null | undefined)[]) {
  const unique = [...new Set(ids.filter((x): x is string => Boolean(x)))];
  if (!unique.length) return new Map<string, ResolvedImage>();
  const rows = await getDb().select().from(media).where(inArray(media.id, unique));
  return new Map(rows.map((m) => [m.id, toImage(m)!]));
}

export async function getAdminSettings() {
  const [row] = await getDb().select().from(siteSettings).where(eq(siteSettings.id, 1));
  if (!row) return null;
  const images = await mediaMap([row.logoId, row.faviconId, row.ogImageId]);
  return {
    ...row,
    logo: row.logoId ? images.get(row.logoId) ?? null : null,
    favicon: row.faviconId ? images.get(row.faviconId) ?? null : null,
    ogImage: row.ogImageId ? images.get(row.ogImageId) ?? null : null,
  };
}

/* -------------------------------- Dashboard -------------------------------- */

export async function getDashboardData() {
  const db = getDb();
  const now = new Date();
  const in7days = new Date(now.getTime() + 7 * 86_400_000);
  const [pendingCount, upcomingCount, newEnquiries, upcoming, pending, enquiries, activity] = await Promise.all([
    db.select({ value: count() }).from(bookings).where(and(eq(bookings.status, "pending"), gte(bookings.startsAt, now))),
    db
      .select({ value: count() })
      .from(bookings)
      .where(and(inArray(bookings.status, ["confirmed", "pending"]), gte(bookings.startsAt, now), lt(bookings.startsAt, in7days))),
    db.select({ value: count() }).from(contactEnquiries).where(eq(contactEnquiries.status, "new")),
    db
      .select()
      .from(bookings)
      .where(and(eq(bookings.status, "confirmed"), gte(bookings.startsAt, now)))
      .orderBy(asc(bookings.startsAt))
      .limit(6),
    db
      .select()
      .from(bookings)
      .where(and(eq(bookings.status, "pending"), gte(bookings.startsAt, now)))
      .orderBy(asc(bookings.startsAt))
      .limit(6),
    db.select().from(contactEnquiries).orderBy(desc(contactEnquiries.createdAt)).limit(5),
    db.select().from(activityLog).orderBy(desc(activityLog.createdAt)).limit(10),
  ]);
  return {
    pendingCount: pendingCount[0].value,
    upcomingCount: upcomingCount[0].value,
    newEnquiriesCount: newEnquiries[0].value,
    upcoming,
    pending,
    enquiries,
    activity,
  };
}

/** Items the owner should complete before going live. */
export async function getSetupChecklist() {
  const db = getDb();
  const [settings] = await db.select().from(siteSettings).where(eq(siteSettings.id, 1));
  const [about] = await db
    .select({ imageId: pageSections.imageId })
    .from(pageSections)
    .innerJoin(pages, eq(pages.id, pageSections.pageId))
    .where(and(eq(pages.key, "a-propos"), eq(pageSections.key, "hero")));
  const [{ value: ruleCount }] = await db.select({ value: count() }).from(availabilityRules);
  const items = [
    { done: Boolean(settings?.email), label: "Indiquer l'adresse e-mail de contact", href: "/admin/parametres" },
    { done: Boolean(settings?.phone), label: "Indiquer le numéro de téléphone", href: "/admin/parametres" },
    { done: Boolean(settings?.serviceArea), label: "Préciser le secteur d'intervention", href: "/admin/parametres" },
    { done: Boolean(settings?.siret && settings?.legalName), label: "Compléter les informations légales (SIRET…)", href: "/admin/parametres/informations-legales" },
    { done: Boolean(about?.imageId), label: "Ajouter une photo de profil (page À propos)", href: "/admin/contenu/a-propos" },
    { done: ruleCount > 0, label: "Définir les horaires de disponibilité", href: "/admin/disponibilites" },
    { done: Boolean(process.env.RESEND_API_KEY), label: "Activer l'envoi des e-mails (à faire par la personne qui gère l'hébergement)", href: "/admin/parametres/emails" },
  ];
  return items;
}

/* --------------------------------- Bookings --------------------------------- */

export interface BookingFilters {
  q?: string;
  status?: string;
  service?: string;
  period?: string; // "a-venir" | "passees" | "toutes"
  page?: number;
}

export async function listBookings(filters: BookingFilters) {
  const db = getDb();
  const conditions: SQL[] = [];
  const now = new Date();
  if (filters.status && BOOKING_STATUSES.includes(filters.status as BookingStatus)) {
    conditions.push(eq(bookings.status, filters.status as BookingStatus));
  }
  if (filters.service && /^[0-9a-f-]{36}$/i.test(filters.service)) conditions.push(eq(bookings.serviceId, filters.service));
  if (filters.period === "a-venir" || !filters.period) conditions.push(gte(bookings.startsAt, now));
  if (filters.period === "passees") conditions.push(lt(bookings.startsAt, now));
  if (filters.q?.trim()) {
    const q = `%${filters.q.trim().replace(/[%_]/g, "")}%`;
    conditions.push(
      or(
        ilike(bookings.firstName, q),
        ilike(bookings.lastName, q),
        ilike(bookings.company, q),
        ilike(bookings.email, q),
        ilike(bookings.reference, q),
        ilike(bookings.city, q),
        ilike(bookings.phone, q),
      )!,
    );
  }
  const where = conditions.length ? and(...conditions) : undefined;
  const page = Math.max(1, filters.page ?? 1);
  const upcomingOrder = !filters.period || filters.period === "a-venir";
  const [rows, [{ value: total }]] = await Promise.all([
    db
      .select()
      .from(bookings)
      .where(where)
      .orderBy(upcomingOrder ? asc(bookings.startsAt) : desc(bookings.startsAt))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db.select({ value: count() }).from(bookings).where(where),
  ]);
  return { rows, total, page, pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

export async function listBookingsBetween(start: Date, end: Date) {
  return getDb()
    .select()
    .from(bookings)
    .where(and(gte(bookings.startsAt, start), lt(bookings.startsAt, end), inArray(bookings.status, ["pending", "confirmed", "completed"])))
    .orderBy(asc(bookings.startsAt));
}

export async function getBooking(id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const db = getDb();
  const [row] = await db.select().from(bookings).where(eq(bookings.id, id));
  if (!row) return null;
  const history = await db
    .select()
    .from(activityLog)
    .where(and(eq(activityLog.entityType, "booking"), eq(activityLog.entityId, id)))
    .orderBy(desc(activityLog.createdAt));
  return { booking: row, history };
}

/* --------------------------------- Enquiries -------------------------------- */

export async function listEnquiries(filters: { status?: string; q?: string; page?: number }) {
  const db = getDb();
  const conditions: SQL[] = [];
  if (filters.status && ENQUIRY_STATUSES.includes(filters.status as EnquiryStatus)) {
    conditions.push(eq(contactEnquiries.status, filters.status as EnquiryStatus));
  }
  if (filters.q?.trim()) {
    const q = `%${filters.q.trim().replace(/[%_]/g, "")}%`;
    conditions.push(
      or(
        ilike(contactEnquiries.firstName, q),
        ilike(contactEnquiries.lastName, q),
        ilike(contactEnquiries.company, q),
        ilike(contactEnquiries.email, q),
        ilike(contactEnquiries.subject, q),
      )!,
    );
  }
  const where = conditions.length ? and(...conditions) : undefined;
  const page = Math.max(1, filters.page ?? 1);
  const [rows, [{ value: total }]] = await Promise.all([
    db
      .select()
      .from(contactEnquiries)
      .where(where)
      .orderBy(desc(contactEnquiries.createdAt))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db.select({ value: count() }).from(contactEnquiries).where(where),
  ]);
  return { rows, total, page, pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

export async function getEnquiry(id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const [row] = await getDb().select().from(contactEnquiries).where(eq(contactEnquiries.id, id));
  return row ?? null;
}

export async function countNew() {
  const db = getDb();
  const [[a], [b]] = await Promise.all([
    db.select({ value: count() }).from(bookings).where(and(eq(bookings.status, "pending"), gte(bookings.startsAt, new Date()))),
    db.select({ value: count() }).from(contactEnquiries).where(eq(contactEnquiries.status, "new")),
  ]);
  return { pendingBookings: a.value, newEnquiries: b.value };
}

/* --------------------------------- Services --------------------------------- */

export async function listAdminServices() {
  const db = getDb();
  const rows = await db
    .select({ service: services, categoryName: serviceCategories.name })
    .from(services)
    .leftJoin(serviceCategories, eq(serviceCategories.id, services.categoryId))
    .orderBy(asc(services.position), asc(services.title));
  const images = await mediaMap(rows.map((r) => r.service.imageId));
  return rows.map((r) => ({ ...r.service, categoryName: r.categoryName, image: r.service.imageId ? images.get(r.service.imageId) ?? null : null }));
}

export async function getAdminService(id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const db = getDb();
  const [row] = await db.select().from(services).where(eq(services.id, id));
  if (!row) return null;
  const gallery = await db
    .select({ m: media })
    .from(serviceImages)
    .innerJoin(media, eq(media.id, serviceImages.mediaId))
    .where(eq(serviceImages.serviceId, id))
    .orderBy(asc(serviceImages.position));
  const images = await mediaMap([row.imageId]);
  const [{ value: bookingCount }] = await db.select({ value: count() }).from(bookings).where(eq(bookings.serviceId, id));
  return {
    ...row,
    image: row.imageId ? images.get(row.imageId) ?? null : null,
    gallery: gallery.map((g) => toImage(g.m)!),
    bookingCount,
  };
}

export async function listCategories() {
  const db = getDb();
  const rows = await db.select().from(serviceCategories).orderBy(asc(serviceCategories.position));
  const counts = await db
    .select({ categoryId: services.categoryId, value: count() })
    .from(services)
    .groupBy(services.categoryId);
  const map = new Map(counts.map((c) => [c.categoryId, c.value]));
  return rows.map((c) => ({ ...c, serviceCount: map.get(c.id) ?? 0 }));
}

/* ---------------------------------- Content ---------------------------------- */

export async function getEditablePage(key: string) {
  const db = getDb();
  const [page] = await db.select().from(pages).where(eq(pages.key, key));
  const sections = page ? await db.select().from(pageSections).where(eq(pageSections.pageId, page.id)) : [];
  const images = await mediaMap([page?.ogImageId, ...sections.map((s) => s.imageId), ...sections.flatMap((s) => s.items.map((i) => i.imageId))]);
  return {
    page,
    ogImage: page?.ogImageId ? images.get(page.ogImageId) ?? null : null,
    sections: Object.fromEntries(sections.map((s) => [s.key, s])),
    images: Object.fromEntries(images),
  };
}

export async function listPagesMeta() {
  return getDb().select({ key: pages.key, updatedAt: pages.updatedAt }).from(pages);
}

export async function listSteps() {
  return getDb().select().from(processSteps).orderBy(asc(processSteps.position));
}

export async function listFaqs() {
  return getDb().select().from(faqs).orderBy(asc(faqs.position));
}

/* -------------------------------- Availability ------------------------------- */

export async function getAvailability() {
  const db = getDb();
  const [rules, blocked] = await Promise.all([
    db.select().from(availabilityRules).orderBy(asc(availabilityRules.weekday), asc(availabilityRules.startTime)),
    db
      .select()
      .from(blockedPeriods)
      .where(gte(blockedPeriods.endsAt, sql`now() - interval '1 day'`))
      .orderBy(asc(blockedPeriods.startsAt)),
  ]);
  return { rules, blocked };
}

/* ----------------------------------- Admins ---------------------------------- */

export async function listAdmins() {
  return getDb()
    .select({
      id: adminUsers.id,
      name: adminUsers.name,
      email: adminUsers.email,
      role: adminUsers.role,
      isActive: adminUsers.isActive,
      lastLoginAt: adminUsers.lastLoginAt,
    })
    .from(adminUsers)
    .orderBy(asc(adminUsers.createdAt));
}

export async function getAdminProfile(id: string) {
  const [row] = await getDb()
    .select({ id: adminUsers.id, name: adminUsers.name, email: adminUsers.email, role: adminUsers.role })
    .from(adminUsers)
    .where(eq(adminUsers.id, id));
  return row ?? null;
}
