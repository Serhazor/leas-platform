/**
 * Database schema (single source of truth).
 * SQL migrations in /drizzle are generated from this file with `npm run db:generate`.
 */
import { relations, sql } from "drizzle-orm";
import {
  bigserial,
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  smallint,
  text,
  time,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
};

/* -------------------------------------------------------------------------- */
/* Enums                                                                       */
/* -------------------------------------------------------------------------- */

export const bookingStatusEnum = pgEnum("booking_status", [
  "pending",
  "confirmed",
  "refused",
  "cancelled",
  "completed",
]);
export const enquiryStatusEnum = pgEnum("enquiry_status", ["new", "in_progress", "done"]);
export const bookingModeEnum = pgEnum("booking_mode", ["request", "instant"]);
export const adminRoleEnum = pgEnum("admin_role", ["owner", "admin"]);

/* -------------------------------------------------------------------------- */
/* Administration & authentication                                             */
/* -------------------------------------------------------------------------- */

export const adminUsers = pgTable("admin_users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  role: adminRoleEnum("role").notNull().default("admin"),
  isActive: boolean("is_active").notNull().default(true),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  ...timestamps,
});

export const adminSessions = pgTable(
  "admin_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => adminUsers.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).defaultNow().notNull(),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("admin_sessions_user_idx").on(t.userId)],
);

export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => adminUsers.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const loginAttempts = pgTable(
  "login_attempts",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    email: text("email").notNull(),
    ipHash: text("ip_hash"),
    success: boolean("success").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("login_attempts_email_idx").on(t.email, t.createdAt)],
);

/* -------------------------------------------------------------------------- */
/* Media library                                                               */
/* -------------------------------------------------------------------------- */

export const media = pgTable("media", {
  id: uuid("id").primaryKey().defaultRandom(),
  storageKey: text("storage_key").notNull().unique(),
  url: text("url").notNull(),
  fileName: text("file_name").notNull(),
  mimeType: text("mime_type").notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  width: integer("width").notNull(),
  height: integer("height").notNull(),
  alt: text("alt").notNull().default(""),
  uploadedBy: uuid("uploaded_by").references(() => adminUsers.id, { onDelete: "set null" }),
  ...timestamps,
});

/* -------------------------------------------------------------------------- */
/* Site settings (single row)                                                  */
/* -------------------------------------------------------------------------- */

export const siteSettings = pgTable(
  "site_settings",
  {
    id: smallint("id").primaryKey().default(1),
    // Identity
    companyName: text("company_name").notNull().default(""),
    tagline: text("tagline").notNull().default(""),
    ownerName: text("owner_name").notNull().default(""),
    logoId: uuid("logo_id").references(() => media.id, { onDelete: "set null" }),
    faviconId: uuid("favicon_id").references(() => media.id, { onDelete: "set null" }),
    // Contact
    email: text("email").notNull().default(""),
    phone: text("phone").notNull().default(""),
    addressLine: text("address_line").notNull().default(""),
    postalCode: text("postal_code").notNull().default(""),
    city: text("city").notNull().default(""),
    showAddress: boolean("show_address").notNull().default(false),
    serviceArea: text("service_area").notNull().default(""),
    contactHoursNote: text("contact_hours_note").notNull().default(""),
    linkedinUrl: text("linkedin_url").notNull().default(""),
    instagramUrl: text("instagram_url").notNull().default(""),
    facebookUrl: text("facebook_url").notNull().default(""),
    footerText: text("footer_text").notNull().default(""),
    // SEO defaults
    seoTitle: text("seo_title").notNull().default(""),
    seoDescription: text("seo_description").notNull().default(""),
    ogImageId: uuid("og_image_id").references(() => media.id, { onDelete: "set null" }),
    // Branding
    colorPrimary: text("color_primary").notNull().default("#2f4b45"),
    colorSecondary: text("color_secondary").notNull().default("#f4efe7"),
    colorAccent: text("color_accent").notNull().default("#a8643f"),
    fontPair: text("font_pair").notNull().default("classique"),
    // Booking behaviour
    bookingMode: bookingModeEnum("booking_mode").notNull().default("request"),
    bookingEnabled: boolean("booking_enabled").notNull().default(true),
    defaultDurationMinutes: integer("default_duration_minutes").notNull().default(60),
    bufferMinutes: integer("buffer_minutes").notNull().default(30),
    minNoticeHours: integer("min_notice_hours").notNull().default(24),
    maxAdvanceDays: integer("max_advance_days").notNull().default(60),
    slotIntervalMinutes: integer("slot_interval_minutes").notNull().default(30),
    timezone: text("timezone").notNull().default("Europe/Paris"),
    // Emails
    notificationEmail: text("notification_email").notNull().default(""),
    emailSenderName: text("email_sender_name").notNull().default(""),
    emailSignature: text("email_signature").notNull().default(""),
    // Legal information (mentions légales)
    legalName: text("legal_name").notNull().default(""),
    legalForm: text("legal_form").notNull().default(""),
    siret: text("siret").notNull().default(""),
    rcs: text("rcs").notNull().default(""),
    vatNumber: text("vat_number").notNull().default(""),
    shareCapital: text("share_capital").notNull().default(""),
    publicationDirector: text("publication_director").notNull().default(""),
    hostingInfo: text("hosting_info").notNull().default(""),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => [check("site_settings_singleton", sql`${t.id} = 1`)],
);

/* -------------------------------------------------------------------------- */
/* Pages & editable sections                                                   */
/* -------------------------------------------------------------------------- */

/** Repeated items inside a section (e.g. "Pourquoi nous choisir" points, gallery images). */
export type SectionItem = { title?: string; text?: string; imageId?: string | null };

export const pages = pgTable("pages", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: text("key").notNull().unique(),
  path: text("path").notNull(),
  name: text("name").notNull(),
  seoTitle: text("seo_title").notNull().default(""),
  seoDescription: text("seo_description").notNull().default(""),
  ogImageId: uuid("og_image_id").references(() => media.id, { onDelete: "set null" }),
  ...timestamps,
});

export const pageSections = pgTable(
  "page_sections",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    pageId: uuid("page_id")
      .notNull()
      .references(() => pages.id, { onDelete: "cascade" }),
    key: text("key").notNull(),
    position: integer("position").notNull().default(0),
    isVisible: boolean("is_visible").notNull().default(true),
    eyebrow: text("eyebrow").notNull().default(""),
    heading: text("heading").notNull().default(""),
    subheading: text("subheading").notNull().default(""),
    body: text("body").notNull().default(""),
    imageId: uuid("image_id").references(() => media.id, { onDelete: "set null" }),
    ctaLabel: text("cta_label").notNull().default(""),
    ctaHref: text("cta_href").notNull().default(""),
    cta2Label: text("cta2_label").notNull().default(""),
    cta2Href: text("cta2_href").notNull().default(""),
    items: jsonb("items").$type<SectionItem[]>().notNull().default([]),
    ...timestamps,
  },
  (t) => [uniqueIndex("page_sections_page_key_idx").on(t.pageId, t.key)],
);

/* -------------------------------------------------------------------------- */
/* Services                                                                    */
/* -------------------------------------------------------------------------- */

export const serviceCategories = pgTable("service_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  position: integer("position").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  ...timestamps,
});

export const services = pgTable(
  "services",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    categoryId: uuid("category_id").references(() => serviceCategories.id, {
      onDelete: "set null",
    }),
    shortDescription: text("short_description").notNull().default(""),
    description: text("description").notNull().default(""),
    imageId: uuid("image_id").references(() => media.id, { onDelete: "set null" }),
    icon: text("icon").notNull().default(""),
    priceCents: integer("price_cents"),
    priceFrom: boolean("price_from").notNull().default(false),
    priceNote: text("price_note").notNull().default(""),
    showPrice: boolean("show_price").notNull().default(false),
    ctaLabel: text("cta_label").notNull().default(""),
    isActive: boolean("is_active").notNull().default(true),
    isComingSoon: boolean("is_coming_soon").notNull().default(false),
    isFeatured: boolean("is_featured").notNull().default(true),
    position: integer("position").notNull().default(0),
    bookingEnabled: boolean("booking_enabled").notNull().default(true),
    requiresAddress: boolean("requires_address").notNull().default(true),
    durationMinutes: integer("duration_minutes"),
    seoTitle: text("seo_title").notNull().default(""),
    seoDescription: text("seo_description").notNull().default(""),
    ...timestamps,
  },
  (t) => [index("services_category_idx").on(t.categoryId)],
);

export const serviceImages = pgTable(
  "service_images",
  {
    serviceId: uuid("service_id")
      .notNull()
      .references(() => services.id, { onDelete: "cascade" }),
    mediaId: uuid("media_id")
      .notNull()
      .references(() => media.id, { onDelete: "cascade" }),
    position: integer("position").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.serviceId, t.mediaId] })],
);

/* -------------------------------------------------------------------------- */
/* "Comment ça marche" & FAQ                                                   */
/* -------------------------------------------------------------------------- */

export const processSteps = pgTable("process_steps", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  position: integer("position").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  ...timestamps,
});

export const faqs = pgTable("faqs", {
  id: uuid("id").primaryKey().defaultRandom(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  position: integer("position").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  showOnHome: boolean("show_on_home").notNull().default(false),
  ...timestamps,
});

/* -------------------------------------------------------------------------- */
/* Availability                                                                */
/* -------------------------------------------------------------------------- */

/** Weekly opening ranges. weekday: 1 = lundi … 7 = dimanche (ISO 8601). Times are local to settings.timezone. */
export const availabilityRules = pgTable(
  "availability_rules",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    weekday: smallint("weekday").notNull(),
    startTime: time("start_time").notNull(),
    endTime: time("end_time").notNull(),
    ...timestamps,
  },
  (t) => [
    check("availability_rules_weekday", sql`${t.weekday} between 1 and 7`),
    check("availability_rules_range", sql`${t.startTime} < ${t.endTime}`),
  ],
);

/** Closures: holidays, days off, individually blocked dates or time periods. */
export const blockedPeriods = pgTable(
  "blocked_periods",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    allDay: boolean("all_day").notNull().default(true),
    label: text("label").notNull().default(""),
    ...timestamps,
  },
  (t) => [
    check("blocked_periods_range", sql`${t.startsAt} < ${t.endsAt}`),
    index("blocked_periods_range_idx").on(t.startsAt, t.endsAt),
  ],
);

/* -------------------------------------------------------------------------- */
/* Bookings & enquiries                                                        */
/* -------------------------------------------------------------------------- */

export const bookings = pgTable(
  "bookings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    reference: text("reference").notNull().unique(),
    serviceId: uuid("service_id").references(() => services.id, { onDelete: "set null" }),
    serviceTitle: text("service_title").notNull(),
    status: bookingStatusEnum("status").notNull().default("pending"),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    company: text("company").notNull().default(""),
    email: text("email").notNull(),
    phone: text("phone").notNull(),
    addressLine: text("address_line").notNull().default(""),
    postalCode: text("postal_code").notNull().default(""),
    city: text("city").notNull().default(""),
    message: text("message").notNull().default(""),
    consentAt: timestamp("consent_at", { withTimezone: true }).notNull(),
    privateNotes: text("private_notes").notNull().default(""),
    statusChangedAt: timestamp("status_changed_at", { withTimezone: true }),
    /** Reserved for a future calendar integration (e.g. Google Calendar event id). */
    externalCalendarEventId: text("external_calendar_event_id"),
    ...timestamps,
  },
  (t) => [
    check("bookings_range", sql`${t.startsAt} < ${t.endsAt}`),
    index("bookings_starts_at_idx").on(t.startsAt),
    index("bookings_status_idx").on(t.status),
  ],
);

export const contactEnquiries = pgTable(
  "contact_enquiries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    company: text("company").notNull().default(""),
    email: text("email").notNull(),
    phone: text("phone").notNull().default(""),
    subject: text("subject").notNull(),
    message: text("message").notNull(),
    status: enquiryStatusEnum("status").notNull().default("new"),
    privateNotes: text("private_notes").notNull().default(""),
    consentAt: timestamp("consent_at", { withTimezone: true }).notNull(),
    ...timestamps,
  },
  (t) => [index("contact_enquiries_status_idx").on(t.status, t.createdAt)],
);

export const activityLog = pgTable(
  "activity_log",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    type: text("type").notNull(),
    summary: text("summary").notNull(),
    entityType: text("entity_type"),
    entityId: text("entity_id"),
    actorId: uuid("actor_id").references(() => adminUsers.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("activity_log_created_idx").on(t.createdAt)],
);

/* -------------------------------------------------------------------------- */
/* Relations                                                                   */
/* -------------------------------------------------------------------------- */

export const pagesRelations = relations(pages, ({ many, one }) => ({
  sections: many(pageSections),
  ogImage: one(media, { fields: [pages.ogImageId], references: [media.id] }),
}));

export const pageSectionsRelations = relations(pageSections, ({ one }) => ({
  page: one(pages, { fields: [pageSections.pageId], references: [pages.id] }),
  image: one(media, { fields: [pageSections.imageId], references: [media.id] }),
}));

export const servicesRelations = relations(services, ({ one, many }) => ({
  category: one(serviceCategories, {
    fields: [services.categoryId],
    references: [serviceCategories.id],
  }),
  image: one(media, { fields: [services.imageId], references: [media.id] }),
  gallery: many(serviceImages),
}));

export const serviceCategoriesRelations = relations(serviceCategories, ({ many }) => ({
  services: many(services),
}));

export const serviceImagesRelations = relations(serviceImages, ({ one }) => ({
  service: one(services, { fields: [serviceImages.serviceId], references: [services.id] }),
  media: one(media, { fields: [serviceImages.mediaId], references: [media.id] }),
}));

export const bookingsRelations = relations(bookings, ({ one }) => ({
  service: one(services, { fields: [bookings.serviceId], references: [services.id] }),
}));

export const adminSessionsRelations = relations(adminSessions, ({ one }) => ({
  user: one(adminUsers, { fields: [adminSessions.userId], references: [adminUsers.id] }),
}));

export type Media = typeof media.$inferSelect;
export type SiteSettings = typeof siteSettings.$inferSelect;
export type Page = typeof pages.$inferSelect;
export type PageSection = typeof pageSections.$inferSelect;
export type Service = typeof services.$inferSelect;
export type ServiceCategory = typeof serviceCategories.$inferSelect;
export type ProcessStep = typeof processSteps.$inferSelect;
export type Faq = typeof faqs.$inferSelect;
export type AvailabilityRule = typeof availabilityRules.$inferSelect;
export type BlockedPeriod = typeof blockedPeriods.$inferSelect;
export type Booking = typeof bookings.$inferSelect;
export type BookingStatus = Booking["status"];
export type ContactEnquiry = typeof contactEnquiries.$inferSelect;
export type EnquiryStatus = ContactEnquiry["status"];
export type AdminUser = typeof adminUsers.$inferSelect;
export type ActivityEntry = typeof activityLog.$inferSelect;
