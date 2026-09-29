import "server-only";
import { and, asc, eq, inArray } from "drizzle-orm";
import { cache } from "react";
import { getDb, isDatabaseConfigured } from "@/db";
import {
  faqs,
  media,
  pages,
  pageSections,
  processSteps,
  serviceCategories,
  serviceImages,
  services,
  siteSettings,
  type Media,
  type PageSection,
  type Service,
  type ServiceCategory,
  type SiteSettings,
} from "@/db/schema";

export interface ResolvedImage {
  id: string;
  url: string;
  alt: string;
  width: number;
  height: number;
}

export function toImage(m: Media | null | undefined): ResolvedImage | null {
  if (!m) return null;
  return { id: m.id, url: m.url, alt: m.alt, width: m.width, height: m.height };
}

async function loadMedia(ids: (string | null | undefined)[]): Promise<Map<string, ResolvedImage>> {
  const unique = [...new Set(ids.filter((x): x is string => Boolean(x)))];
  if (!unique.length) return new Map();
  const rows = await getDb().select().from(media).where(inArray(media.id, unique));
  return new Map(rows.map((m) => [m.id, toImage(m)!]));
}

/* ------------------------------ Settings ------------------------------ */

export type PublicSettings = SiteSettings & {
  logo: ResolvedImage | null;
  favicon: ResolvedImage | null;
  ogImage: ResolvedImage | null;
};

export const getSettings = cache(async (): Promise<PublicSettings | null> => {
  if (!isDatabaseConfigured()) return null;
  const [row] = await getDb().select().from(siteSettings).where(eq(siteSettings.id, 1)).limit(1);
  if (!row) return null;
  const images = await loadMedia([row.logoId, row.faviconId, row.ogImageId]);
  return {
    ...row,
    logo: row.logoId ? images.get(row.logoId) ?? null : null,
    favicon: row.faviconId ? images.get(row.faviconId) ?? null : null,
    ogImage: row.ogImageId ? images.get(row.ogImageId) ?? null : null,
  };
});

/* -------------------------------- Pages -------------------------------- */

export type ResolvedSectionItem = { title: string; text: string; image: ResolvedImage | null };

export type ResolvedSection = Omit<PageSection, "items"> & {
  image: ResolvedImage | null;
  items: ResolvedSectionItem[];
};

export interface ResolvedPage {
  key: string;
  path: string;
  name: string;
  seoTitle: string;
  seoDescription: string;
  ogImage: ResolvedImage | null;
  updatedAt: Date;
  /** Visible sections, by key. */
  sections: Record<string, ResolvedSection | undefined>;
}

export const getPage = cache(async (key: string): Promise<ResolvedPage | null> => {
  if (!isDatabaseConfigured()) return null;
  const db = getDb();
  const [page] = await db.select().from(pages).where(eq(pages.key, key)).limit(1);
  if (!page) return null;
  const sections = await db
    .select()
    .from(pageSections)
    .where(and(eq(pageSections.pageId, page.id), eq(pageSections.isVisible, true)))
    .orderBy(asc(pageSections.position));
  const images = await loadMedia([
    page.ogImageId,
    ...sections.map((s) => s.imageId),
    ...sections.flatMap((s) => s.items.map((i) => i.imageId)),
  ]);
  const resolved: Record<string, ResolvedSection> = {};
  for (const s of sections) {
    resolved[s.key] = {
      ...s,
      image: s.imageId ? images.get(s.imageId) ?? null : null,
      items: s.items.map((i) => ({
        title: i.title ?? "",
        text: i.text ?? "",
        image: i.imageId ? images.get(i.imageId) ?? null : null,
      })),
    };
  }
  return {
    key: page.key,
    path: page.path,
    name: page.name,
    seoTitle: page.seoTitle,
    seoDescription: page.seoDescription,
    ogImage: page.ogImageId ? images.get(page.ogImageId) ?? null : null,
    updatedAt: page.updatedAt,
    sections: resolved,
  };
});

/* ------------------------------- Services ------------------------------- */

export type PublicService = Service & {
  image: ResolvedImage | null;
  category: Pick<ServiceCategory, "id" | "slug" | "name" | "position"> | null;
};

export const getPublicServices = cache(async (): Promise<PublicService[]> => {
  if (!isDatabaseConfigured()) return [];
  const db = getDb();
  const rows = await db
    .select({ service: services, category: serviceCategories })
    .from(services)
    .leftJoin(serviceCategories, eq(serviceCategories.id, services.categoryId))
    .where(eq(services.isActive, true))
    .orderBy(asc(services.position), asc(services.title));
  const images = await loadMedia(rows.map((r) => r.service.imageId));
  return rows.map(({ service, category }) => ({
    ...service,
    image: service.imageId ? images.get(service.imageId) ?? null : null,
    category: category && category.isActive
      ? { id: category.id, slug: category.slug, name: category.name, position: category.position }
      : null,
  }));
});

export const getPublicServiceBySlug = cache(async (slug: string) => {
  const all = await getPublicServices();
  const service = all.find((s) => s.slug === slug);
  if (!service) return null;
  const gallery = await getDb()
    .select({ m: media })
    .from(serviceImages)
    .innerJoin(media, eq(media.id, serviceImages.mediaId))
    .where(eq(serviceImages.serviceId, service.id))
    .orderBy(asc(serviceImages.position));
  return { ...service, gallery: gallery.map((g) => toImage(g.m)!) };
});

export const getActiveCategories = cache(async () => {
  if (!isDatabaseConfigured()) return [];
  return getDb()
    .select()
    .from(serviceCategories)
    .where(eq(serviceCategories.isActive, true))
    .orderBy(asc(serviceCategories.position));
});

/* ---------------------------- Steps & FAQ ---------------------------- */

export const getProcessSteps = cache(async () => {
  if (!isDatabaseConfigured()) return [];
  return getDb()
    .select()
    .from(processSteps)
    .where(eq(processSteps.isActive, true))
    .orderBy(asc(processSteps.position));
});

export const getFaqs = cache(async (homeOnly = false) => {
  if (!isDatabaseConfigured()) return [];
  const conditions = [eq(faqs.isActive, true)];
  if (homeOnly) conditions.push(eq(faqs.showOnHome, true));
  return getDb()
    .select()
    .from(faqs)
    .where(and(...conditions))
    .orderBy(asc(faqs.position));
});
