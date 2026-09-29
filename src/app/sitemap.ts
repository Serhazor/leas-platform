import type { MetadataRoute } from "next";
import { getDb, isDatabaseConfigured } from "@/db";
import { pages } from "@/db/schema";
import { getPublicServices } from "@/lib/data/public";
import { siteUrl } from "@/lib/site-url";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!isDatabaseConfigured()) return [{ url: siteUrl("/") }];
  const [pageRows, services] = await Promise.all([getDb().select().from(pages), getPublicServices()]);
  const priority: Record<string, number> = { "/": 1, "/services": 0.9, "/etats-des-lieux": 0.9, "/reservation": 0.8 };
  return [
    ...pageRows.map((p) => ({
      url: siteUrl(p.path === "/" ? "/" : p.path),
      lastModified: p.updatedAt,
      changeFrequency: "monthly" as const,
      priority: priority[p.path] ?? (p.path.startsWith("/mentions") || p.path.startsWith("/politique") ? 0.2 : 0.6),
    })),
    ...services.map((s) => ({
      url: siteUrl(`/services/${s.slug}`),
      lastModified: s.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
