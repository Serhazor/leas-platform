/**
 * Inserts the initial French content. Idempotent: existing content is never overwritten,
 * so it is safe to run again after the owner has edited the site.
 * Usage: npm run db:seed
 */
import { config } from "dotenv";
config({ path: [".env.local", ".env"], quiet: true });
import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { and, count, eq, isNull } from "drizzle-orm";
import { imageSize } from "image-size";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../src/db/schema";
import {
  seedAvailability,
  seedCategories,
  seedFaqs,
  seedImages,
  seedPages,
  seedProcessSteps,
  seedServices,
  seedSettings,
} from "../src/db/seed-data";

async function main() {
  const url = process.env.DATABASE_URL_DIRECT || process.env.DATABASE_URL;
  if (!url) {
    console.error("✗ DATABASE_URL doit être défini.");
    process.exit(1);
  }
  const client = postgres(url, { max: 1, prepare: false, onnotice: () => {} });
  const db = drizzle(client, { schema });

  try {
    await db.transaction(async (tx) => {
      // Settings (single row)
      await tx
        .insert(schema.siteSettings)
        .values({ id: 1, ...seedSettings, notificationEmail: process.env.ADMIN_NOTIFICATION_EMAIL ?? "" })
        .onConflictDoNothing();

      // Pages & sections (only missing ones are created)
      for (const page of seedPages) {
        await tx
          .insert(schema.pages)
          .values({
            key: page.key,
            path: page.path,
            name: page.name,
            seoTitle: page.seoTitle,
            seoDescription: page.seoDescription,
          })
          .onConflictDoNothing();
        const [row] = await tx
          .select({ id: schema.pages.id })
          .from(schema.pages)
          .where(eq(schema.pages.key, page.key));
        let position = 0;
        for (const s of page.sections) {
          position += 1;
          await tx
            .insert(schema.pageSections)
            .values({
              pageId: row.id,
              key: s.key,
              position,
              isVisible: s.isVisible ?? true,
              eyebrow: s.eyebrow ?? "",
              heading: s.heading ?? "",
              subheading: s.subheading ?? "",
              body: s.body ?? "",
              ctaLabel: s.ctaLabel ?? "",
              ctaHref: s.ctaHref ?? "",
              cta2Label: s.cta2Label ?? "",
              cta2Href: s.cta2Href ?? "",
              items: s.items ?? [],
            })
            .onConflictDoNothing();
        }
      }

      // Categories & services
      const [{ value: serviceCount }] = await tx.select({ value: count() }).from(schema.services);
      if (serviceCount === 0) {
        const categories = await tx
          .insert(schema.serviceCategories)
          .values(seedCategories)
          .onConflictDoNothing()
          .returning();
        const bySlug = new Map(categories.map((c) => [c.slug, c.id]));
        await tx.insert(schema.services).values(
          seedServices.map((s, i) => ({
            slug: s.slug,
            title: s.title,
            categoryId: bySlug.get(s.category) ?? null,
            shortDescription: s.shortDescription,
            description: s.description,
            icon: s.icon,
            durationMinutes: s.durationMinutes,
            requiresAddress: s.requiresAddress,
            isComingSoon: s.isComingSoon ?? false,
            bookingEnabled: s.bookingEnabled ?? true,
            isFeatured: s.isFeatured ?? true,
            ctaLabel: s.ctaLabel,
            seoTitle: s.seoTitle,
            seoDescription: s.seoDescription,
            position: i + 1,
          })),
        );
      }

      const [{ value: stepCount }] = await tx.select({ value: count() }).from(schema.processSteps);
      if (stepCount === 0) {
        await tx
          .insert(schema.processSteps)
          .values(seedProcessSteps.map((s, i) => ({ ...s, position: i + 1 })));
      }

      const [{ value: faqCount }] = await tx.select({ value: count() }).from(schema.faqs);
      if (faqCount === 0) {
        await tx.insert(schema.faqs).values(seedFaqs.map((f, i) => ({ ...f, position: i + 1 })));
      }

      const [{ value: ruleCount }] = await tx
        .select({ value: count() })
        .from(schema.availabilityRules);
      if (ruleCount === 0) {
        await tx.insert(schema.availabilityRules).values(seedAvailability);
      }
    });
    const placed = await seedBundledImages(db);
    if (placed) console.log(`✓ ${placed} photo(s) de /public/images enregistrée(s) dans la médiathèque.`);
    console.log("✓ Contenu initial inséré (le contenu existant n'a pas été modifié).");
  } finally {
    await client.end();
  }
}

const EXTENSIONS: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".png": "image/png",
  ".avif": "image/avif",
};

/** Registers photos shipped in /public/images and assigns them where no image is set yet. */
async function seedBundledImages(db: ReturnType<typeof drizzle<typeof schema>>): Promise<number> {
  const dir = path.join(process.cwd(), "public", "images");
  let placed = 0;
  for (const img of seedImages) {
    const ext = Object.keys(EXTENSIONS).find((e) => existsSync(path.join(dir, img.name + e)));
    if (!ext) continue;
    const file = path.join(dir, img.name + ext);
    const storageKey = `static/images/${img.name}${ext}`;
    let [row] = await db.select().from(schema.media).where(eq(schema.media.storageKey, storageKey));
    if (!row) {
      const dims = imageSize(readFileSync(file));
      [row] = await db
        .insert(schema.media)
        .values({
          storageKey,
          url: `/images/${img.name}${ext}`,
          fileName: `${img.name}${ext}`,
          mimeType: EXTENSIONS[ext],
          sizeBytes: statSync(file).size,
          width: dims.width ?? 1600,
          height: dims.height ?? 1200,
          alt: img.alt,
        })
        .returning();
      placed++;
    }
    for (const target of img.targets) {
      if ("service" in target) {
        await db
          .update(schema.services)
          .set({ imageId: row.id })
          .where(and(eq(schema.services.slug, target.service), isNull(schema.services.imageId)));
      } else if ("ogDefault" in target) {
        await db.update(schema.siteSettings).set({ ogImageId: row.id }).where(isNull(schema.siteSettings.ogImageId));
      } else {
        const [page] = await db.select().from(schema.pages).where(eq(schema.pages.key, target.page));
        if (page) {
          await db
            .update(schema.pageSections)
            .set({ imageId: row.id })
            .where(
              and(
                eq(schema.pageSections.pageId, page.id),
                eq(schema.pageSections.key, target.section),
                isNull(schema.pageSections.imageId),
              ),
            );
        }
      }
    }
  }
  return placed;
}

main().catch((err) => {
  console.error("✗ Échec de l'initialisation :", err);
  process.exit(1);
});
