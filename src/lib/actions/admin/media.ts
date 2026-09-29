"use server";

import { randomBytes } from "node:crypto";
import { desc, eq, or, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { media, pages, pageSections, serviceImages, services, siteSettings, type Media } from "@/db/schema";
import { logActivity } from "@/lib/activity";
import { requireAdmin } from "@/lib/auth/session";
import { ALLOWED_IMAGE_TYPES, extensionFor, getStorage, isBundledKey, MAX_UPLOAD_BYTES, StorageNotConfiguredError } from "@/lib/storage";
import { slugify } from "@/lib/format";
import { failure, success, type FormState } from "@/lib/validation";
import { revalidatePublic, UUID_RE } from "./helpers";

export type MediaItem = Pick<Media, "id" | "url" | "alt" | "width" | "height" | "fileName" | "mimeType" | "sizeBytes" | "createdAt">;

export async function listMedia(): Promise<MediaItem[]> {
  await requireAdmin();
  return getDb()
    .select({
      id: media.id,
      url: media.url,
      alt: media.alt,
      width: media.width,
      height: media.height,
      fileName: media.fileName,
      mimeType: media.mimeType,
      sizeBytes: media.sizeBytes,
      createdAt: media.createdAt,
    })
    .from(media)
    .orderBy(desc(media.createdAt))
    .limit(500);
}

/** Step 1 of an upload: returns a one-time URL the browser uploads the (already optimised) file to. */
export async function prepareUpload(input: { fileName: string; mimeType: string; sizeBytes: number }) {
  await requireAdmin();
  if (!ALLOWED_IMAGE_TYPES.includes(input.mimeType)) {
    return { ok: false as const, error: "Format non pris en charge. Utilisez une image JPEG, PNG, WebP, AVIF ou GIF." };
  }
  if (input.sizeBytes > MAX_UPLOAD_BYTES) {
    return { ok: false as const, error: "Image trop lourde (15 Mo maximum)." };
  }
  const base = slugify(input.fileName.replace(/\.[^.]+$/, "")).slice(0, 50) || "image";
  const now = new Date();
  const key = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}/${base}-${randomBytes(4).toString("hex")}.${extensionFor(input.mimeType)}`;
  try {
    const target = await getStorage().createUploadTarget(key);
    return { ok: true as const, ...target };
  } catch (err) {
    if (err instanceof StorageNotConfiguredError) {
      return { ok: false as const, error: "L'envoi d'images n'est pas encore activé sur ce site. Contactez la personne qui gère l'hébergement." };
    }
    console.error("[médias] préparation", err);
    return { ok: false as const, error: "Le stockage des images est momentanément indisponible. Merci de réessayer." };
  }
}

/** Step 2: records the uploaded file (or replaces an existing image, keeping every reference). */
export async function registerMedia(input: {
  key: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  width: number;
  height: number;
  alt?: string;
  replaceId?: string;
}): Promise<{ ok: true; media: MediaItem } | { ok: false; error: string }> {
  const admin = await requireAdmin();
  if (!/^\d{4}\/\d{2}\/[a-z0-9-]+\.[a-z]+$/.test(input.key)) return { ok: false, error: "Fichier invalide." };
  const storage = getStorage();
  if (!(await storage.exists(input.key))) return { ok: false, error: "Le fichier n'a pas été reçu. Merci de réessayer." };

  const values = {
    storageKey: input.key,
    url: storage.publicUrl(input.key),
    fileName: input.fileName.slice(0, 200),
    mimeType: input.mimeType,
    sizeBytes: Math.max(0, Math.round(input.sizeBytes)),
    width: Math.max(1, Math.round(input.width)),
    height: Math.max(1, Math.round(input.height)),
  };
  const db = getDb();
  let row: Media;
  if (input.replaceId && UUID_RE.test(input.replaceId)) {
    const [old] = await db.select().from(media).where(eq(media.id, input.replaceId));
    if (!old) return { ok: false, error: "L'image à remplacer n'existe plus." };
    [row] = await db.update(media).set(values).where(eq(media.id, input.replaceId)).returning();
    if (!isBundledKey(old.storageKey)) await storage.remove(old.storageKey).catch(() => {});
  } else {
    [row] = await db
      .insert(media)
      .values({ ...values, alt: (input.alt ?? "").slice(0, 300), uploadedBy: admin.id })
      .returning();
  }
  await logActivity({
    type: "media.updated",
    summary: input.replaceId ? `Image remplacée : ${row.fileName}` : `Image ajoutée : ${row.fileName}`,
    entityType: "media",
    entityId: row.id,
    actorId: admin.id,
  });
  if (input.replaceId) revalidatePublic();
  revalidatePath("/admin/medias");
  return { ok: true, media: row };
}

export async function updateMediaAlt(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const alt = String(formData.get("alt") ?? "").trim().slice(0, 300);
  if (!UUID_RE.test(id)) return failure("Action invalide.");
  await getDb().update(media).set({ alt }).where(eq(media.id, id));
  revalidatePublic();
  revalidatePath("/admin/medias");
  return success("Description enregistrée.");
}

/** Where an image is used (shown before deletion). */
export async function mediaUsage(id: string): Promise<string[]> {
  await requireAdmin();
  if (!UUID_RE.test(id)) return [];
  const db = getDb();
  const usage: string[] = [];
  const svc = await db.select({ title: services.title }).from(services).where(eq(services.imageId, id));
  svc.forEach((s) => usage.push(`Service « ${s.title} »`));
  const gallery = await db
    .select({ title: services.title })
    .from(serviceImages)
    .innerJoin(services, eq(services.id, serviceImages.serviceId))
    .where(eq(serviceImages.mediaId, id));
  gallery.forEach((s) => usage.push(`Galerie du service « ${s.title} »`));
  const sections = await db
    .select({ page: pages.name })
    .from(pageSections)
    .innerJoin(pages, eq(pages.id, pageSections.pageId))
    .where(or(eq(pageSections.imageId, id), sql`${pageSections.items} @> ${JSON.stringify([{ imageId: id }])}::jsonb`));
  sections.forEach((s) => usage.push(`Page « ${s.page} »`));
  const og = await db.select({ page: pages.name }).from(pages).where(eq(pages.ogImageId, id));
  og.forEach((s) => usage.push(`Image de partage de la page « ${s.page} »`));
  const [settings] = await db.select().from(siteSettings).where(eq(siteSettings.id, 1));
  if (settings?.logoId === id) usage.push("Logo du site");
  if (settings?.faviconId === id) usage.push("Icône du site");
  if (settings?.ogImageId === id) usage.push("Image de partage par défaut");
  return [...new Set(usage)];
}

export async function deleteMedia(id: string): Promise<FormState> {
  const admin = await requireAdmin();
  if (!UUID_RE.test(id)) return failure("Action invalide.");
  const db = getDb();
  const [row] = await db.select().from(media).where(eq(media.id, id));
  if (!row) return failure("Cette image n'existe plus.");
  // Remove the image from repeated items (gallery etc.) — other references are cleared by the database.
  await db.execute(sql`
    update page_sections
    set items = coalesce((select jsonb_agg(elem) from jsonb_array_elements(items) elem where coalesce(elem->>'imageId', '') <> ${id}), '[]'::jsonb)
    where items @> ${JSON.stringify([{ imageId: id }])}::jsonb`);
  await db.delete(media).where(eq(media.id, id));
  if (!isBundledKey(row.storageKey)) {
    try {
      await getStorage().remove(row.storageKey);
    } catch {
      /* file already gone or storage unavailable: the database entry is removed anyway */
    }
  }
  await logActivity({ type: "media.updated", summary: `Image supprimée : ${row.fileName}`, actorId: admin.id });
  revalidatePublic();
  revalidatePath("/admin/medias");
  return success("Image supprimée.");
}
