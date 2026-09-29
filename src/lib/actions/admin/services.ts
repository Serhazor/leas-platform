"use server";

import { and, count, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getDb } from "@/db";
import { bookings, serviceCategories, serviceImages, services } from "@/db/schema";
import { logActivity } from "@/lib/activity";
import { requireAdmin } from "@/lib/auth/session";
import { parsePriceToCents, slugify } from "@/lib/format";
import { failure, invalid, success, type FormState } from "@/lib/validation";
import { bool, moveRow, nextPosition, nullableId, revalidatePublic, str, UUID_RE } from "./helpers";

const serviceSchema = z.object({
  title: z.string().trim().min(1, "Le titre est obligatoire.").max(120, "120 caractères maximum."),
  slug: z
    .string()
    .trim()
    .max(80)
    .transform((v) => slugify(v))
    .refine((v) => v.length >= 2, "L'adresse de la page doit contenir au moins 2 caractères."),
  shortDescription: z.string().trim().max(300, "300 caractères maximum."),
  description: z.string().trim().max(20_000),
  icon: z.string().trim().max(40),
  ctaLabel: z.string().trim().max(60, "60 caractères maximum."),
  priceNote: z.string().trim().max(60, "60 caractères maximum."),
  seoTitle: z.string().trim().max(120, "120 caractères maximum."),
  seoDescription: z.string().trim().max(300, "300 caractères maximum."),
  durationMinutes: z.coerce
    .number({ error: "Durée invalide." })
    .int("Durée invalide.")
    .min(15, "Minimum 15 minutes.")
    .max(600, "Maximum 10 heures."),
});

export async function saveService(_prev: FormState<{ id: string }>, formData: FormData): Promise<FormState<{ id: string }>> {
  const admin = await requireAdmin();
  const id = str(formData, "id");
  const isNew = !UUID_RE.test(id);

  const parsed = serviceSchema.safeParse({
    title: str(formData, "title"),
    slug: str(formData, "slug") || str(formData, "title"),
    shortDescription: str(formData, "shortDescription"),
    description: str(formData, "description"),
    icon: str(formData, "icon"),
    ctaLabel: str(formData, "ctaLabel"),
    priceNote: str(formData, "priceNote"),
    seoTitle: str(formData, "seoTitle"),
    seoDescription: str(formData, "seoDescription"),
    durationMinutes: str(formData, "durationMinutes") || "60",
  });
  if (!parsed.success) return invalid(parsed.error);

  const priceCents = parsePriceToCents(str(formData, "price"));
  if (Number.isNaN(priceCents)) {
    return { status: "error", message: "Merci de corriger les champs indiqués.", fieldErrors: { price: "Prix invalide (exemple : 150 ou 149,90)." }, submittedAt: Date.now() };
  }
  const showPrice = bool(formData, "showPrice");
  if (showPrice && priceCents == null) {
    return { status: "error", message: "Merci de corriger les champs indiqués.", fieldErrors: { price: "Indiquez un prix pour pouvoir l'afficher." }, submittedAt: Date.now() };
  }

  const db = getDb();
  const [clash] = await db
    .select({ id: services.id })
    .from(services)
    .where(isNew ? eq(services.slug, parsed.data.slug) : and(eq(services.slug, parsed.data.slug), ne(services.id, id)));
  if (clash) {
    return { status: "error", message: "Merci de corriger les champs indiqués.", fieldErrors: { slug: "Cette adresse est déjà utilisée par un autre service." }, submittedAt: Date.now() };
  }

  const values = {
    ...parsed.data,
    categoryId: nullableId(formData, "categoryId"),
    imageId: nullableId(formData, "imageId"),
    priceCents,
    priceFrom: bool(formData, "priceFrom"),
    showPrice,
    isActive: bool(formData, "isActive"),
    isComingSoon: bool(formData, "isComingSoon"),
    isFeatured: bool(formData, "isFeatured"),
    bookingEnabled: bool(formData, "bookingEnabled"),
    requiresAddress: bool(formData, "requiresAddress"),
  };

  const galleryIds = str(formData, "gallery")
    .split(",")
    .map((x) => x.trim())
    .filter((x) => UUID_RE.test(x));

  let serviceId = id;
  await db.transaction(async (tx) => {
    if (isNew) {
      const [row] = await tx
        .insert(services)
        .values({ ...values, position: await nextPosition("services") })
        .returning({ id: services.id });
      serviceId = row.id;
    } else {
      await tx.update(services).set(values).where(eq(services.id, id));
    }
    await tx.delete(serviceImages).where(eq(serviceImages.serviceId, serviceId));
    if (galleryIds.length) {
      await tx
        .insert(serviceImages)
        .values([...new Set(galleryIds)].map((mediaId, i) => ({ serviceId, mediaId, position: i + 1 })));
    }
  });

  await logActivity({
    type: "service.updated",
    summary: `${isNew ? "Service créé" : "Service modifié"} : ${values.title}`,
    entityType: "service",
    entityId: serviceId,
    actorId: admin.id,
  });
  revalidatePublic();
  if (isNew) redirect(`/admin/services/${serviceId}?cree=1`);
  return success("Service enregistré.", { id: serviceId });
}

export async function deleteService(id: string): Promise<FormState> {
  const admin = await requireAdmin();
  if (!UUID_RE.test(id)) return failure("Action invalide.");
  const db = getDb();
  const [svc] = await db.select().from(services).where(eq(services.id, id));
  if (!svc) return failure("Ce service n'existe plus.");
  await db.delete(services).where(eq(services.id, id));
  await logActivity({ type: "service.updated", summary: `Service supprimé : ${svc.title}`, actorId: admin.id });
  revalidatePublic();
  redirect("/admin/services?supprime=1");
}

export async function countServiceBookings(id: string): Promise<number> {
  await requireAdmin();
  const [{ value }] = await getDb().select({ value: count() }).from(bookings).where(eq(bookings.serviceId, id));
  return value;
}

export async function moveService(id: string, direction: "up" | "down") {
  await requireAdmin();
  if (!UUID_RE.test(id)) return;
  await moveRow("services", id, direction);
  revalidatePublic();
  revalidatePath("/admin/services");
}

export async function toggleServiceActive(id: string, active: boolean) {
  await requireAdmin();
  if (!UUID_RE.test(id)) return;
  await getDb().update(services).set({ isActive: active }).where(eq(services.id, id));
  revalidatePublic();
  revalidatePath("/admin/services");
}

/* ------------------------------ Categories ------------------------------ */

const categorySchema = z.object({
  name: z.string().trim().min(1, "Le nom est obligatoire.").max(80),
  description: z.string().trim().max(300),
});

export async function saveCategory(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const id = str(formData, "id");
  const parsed = categorySchema.safeParse({ name: str(formData, "name"), description: str(formData, "description") });
  if (!parsed.success) return invalid(parsed.error);
  const db = getDb();
  const values = { ...parsed.data, isActive: bool(formData, "isActive") };
  if (UUID_RE.test(id)) {
    await db.update(serviceCategories).set(values).where(eq(serviceCategories.id, id));
  } else {
    let slug = slugify(parsed.data.name) || "categorie";
    const [exists] = await db.select({ id: serviceCategories.id }).from(serviceCategories).where(eq(serviceCategories.slug, slug));
    if (exists) slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
    await db.insert(serviceCategories).values({ ...values, isActive: true, slug, position: await nextPosition("service_categories") });
  }
  await logActivity({ type: "service.updated", summary: `Catégorie enregistrée : ${parsed.data.name}`, actorId: admin.id });
  revalidatePublic();
  revalidatePath("/admin/services", "layout");
  return success(UUID_RE.test(id) ? "Catégorie enregistrée." : "Catégorie ajoutée.");
}

export async function deleteCategory(id: string): Promise<FormState> {
  await requireAdmin();
  if (!UUID_RE.test(id)) return failure("Action invalide.");
  const db = getDb();
  const [{ value }] = await db.select({ value: count() }).from(services).where(eq(services.categoryId, id));
  if (value > 0) return failure("Cette catégorie contient encore des services. Déplacez-les dans une autre catégorie avant de la supprimer.");
  await db.delete(serviceCategories).where(eq(serviceCategories.id, id));
  revalidatePublic();
  revalidatePath("/admin/services", "layout");
  return success("Catégorie supprimée.");
}

export async function moveCategory(id: string, direction: "up" | "down") {
  await requireAdmin();
  if (!UUID_RE.test(id)) return;
  await moveRow("service_categories", id, direction);
  revalidatePublic();
  revalidatePath("/admin/services", "layout");
}
