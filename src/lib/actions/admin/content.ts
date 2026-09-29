"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDb } from "@/db";
import { faqs, pages, pageSections, processSteps, type SectionItem } from "@/db/schema";
import { logActivity } from "@/lib/activity";
import { requireAdmin } from "@/lib/auth/session";
import { getPageDefinition } from "@/lib/content/registry";
import { failure, invalid, linkField, success, type FormState } from "@/lib/validation";
import { bool, moveRow, nextPosition, nullableId, revalidatePublic, str, UUID_RE } from "./helpers";

const limit = (label: string, max: number) => z.string().trim().max(max, `${label} : ${max} caractères maximum.`);

function parseItems(raw: string): SectionItem[] {
  try {
    const data = JSON.parse(raw || "[]");
    if (!Array.isArray(data)) return [];
    return data.slice(0, 30).map((i) => ({
      title: typeof i?.title === "string" ? i.title.trim().slice(0, 200) : "",
      text: typeof i?.text === "string" ? i.text.trim().slice(0, 2000) : "",
      imageId: typeof i?.imageId === "string" && UUID_RE.test(i.imageId) ? i.imageId : null,
    })).filter((i) => i.title || i.text || i.imageId);
  } catch {
    return [];
  }
}

export async function savePage(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const key = str(formData, "pageKey");
  const def = getPageDefinition(key);
  if (!def) return failure("Page inconnue.");

  const errors: Record<string, string> = {};
  const seo = z
    .object({ seoTitle: limit("Titre", 120), seoDescription: limit("Description", 300) })
    .safeParse({ seoTitle: str(formData, "seoTitle"), seoDescription: str(formData, "seoDescription") });
  if (!seo.success) return invalid(seo.error);

  const sectionValues = def.sections.map((section, index) => {
    const f = (name: string) => str(formData, `s.${section.key}.${name}`);
    const checks: [string, string, number][] = [
      ["eyebrow", f("eyebrow"), 80],
      ["heading", f("heading"), 200],
      ["subheading", f("subheading"), 600],
      ["body", f("body"), 30_000],
      ["ctaLabel", f("ctaLabel"), 60],
      ["cta2Label", f("cta2Label"), 60],
    ];
    for (const [name, value, max] of checks) {
      if (value.length > max) errors[`s.${section.key}.${name}`] = `${max} caractères maximum.`;
    }
    for (const name of ["ctaHref", "cta2Href"]) {
      if (!linkField.safeParse(f(name)).success) errors[`s.${section.key}.${name}`] = "Lien invalide.";
    }
    return {
      key: section.key,
      position: index + 1,
      isVisible: section.canHide ? bool(formData, `s.${section.key}.visible`) : true,
      eyebrow: f("eyebrow").trim(),
      heading: f("heading").trim(),
      subheading: f("subheading").trim(),
      body: f("body").trim(),
      imageId: nullableId(formData, `s.${section.key}.imageId`),
      ctaLabel: f("ctaLabel").trim(),
      ctaHref: f("ctaHref").trim(),
      cta2Label: f("cta2Label").trim(),
      cta2Href: f("cta2Href").trim(),
      items: parseItems(f("items")),
    };
  });
  if (Object.keys(errors).length) {
    return { status: "error", message: "Merci de corriger les champs indiqués.", fieldErrors: errors, submittedAt: Date.now() };
  }

  const db = getDb();
  await db.transaction(async (tx) => {
    await tx
      .insert(pages)
      .values({ key: def.key, path: def.path, name: def.name })
      .onConflictDoNothing();
    const [page] = await tx.select().from(pages).where(eq(pages.key, def.key));
    await tx
      .update(pages)
      .set({ ...seo.data, ogImageId: nullableId(formData, "ogImageId"), updatedAt: new Date() })
      .where(eq(pages.id, page.id));
    for (const s of sectionValues) {
      await tx
        .insert(pageSections)
        .values({ ...s, pageId: page.id })
        .onConflictDoUpdate({
          target: [pageSections.pageId, pageSections.key],
          set: { ...s, updatedAt: new Date() },
        });
    }
  });

  await logActivity({ type: "content.updated", summary: `Page modifiée : ${def.name}`, entityType: "page", entityId: def.key, actorId: admin.id });
  revalidatePublic();
  return success("Modifications enregistrées. Elles sont visibles sur le site.");
}

/* ---------------------------- "Comment ça marche" ---------------------------- */

const stepSchema = z.object({
  title: z.string().trim().min(1, "Le titre de l'étape est obligatoire.").max(120),
  description: z.string().trim().max(1000),
});

export async function saveStep(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const id = str(formData, "id");
  const parsed = stepSchema.safeParse({ title: str(formData, "title"), description: str(formData, "description") });
  if (!parsed.success) return invalid(parsed.error);
  const db = getDb();
  const values = { ...parsed.data, isActive: bool(formData, "isActive") };
  if (UUID_RE.test(id)) await db.update(processSteps).set(values).where(eq(processSteps.id, id));
  else await db.insert(processSteps).values({ ...values, isActive: true, position: await nextPosition("process_steps") });
  await logActivity({ type: "content.updated", summary: `Étape « ${parsed.data.title} » enregistrée`, actorId: admin.id });
  revalidatePublic();
  revalidatePath("/admin/contenu", "layout");
  return success(UUID_RE.test(id) ? "Étape enregistrée." : "Étape ajoutée.");
}

export async function deleteStep(id: string) {
  await requireAdmin();
  if (!UUID_RE.test(id)) return;
  await getDb().delete(processSteps).where(eq(processSteps.id, id));
  revalidatePublic();
  revalidatePath("/admin/contenu", "layout");
}

export async function moveStep(id: string, direction: "up" | "down") {
  await requireAdmin();
  if (!UUID_RE.test(id)) return;
  await moveRow("process_steps", id, direction);
  revalidatePublic();
  revalidatePath("/admin/contenu", "layout");
}

/* ------------------------------------ FAQ ------------------------------------ */

const faqSchema = z.object({
  question: z.string().trim().min(1, "La question est obligatoire.").max(300),
  answer: z.string().trim().min(1, "La réponse est obligatoire.").max(5000),
});

export async function saveFaq(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const id = str(formData, "id");
  const parsed = faqSchema.safeParse({ question: str(formData, "question"), answer: str(formData, "answer") });
  if (!parsed.success) return invalid(parsed.error);
  const db = getDb();
  const values = { ...parsed.data, isActive: bool(formData, "isActive"), showOnHome: bool(formData, "showOnHome") };
  if (UUID_RE.test(id)) await db.update(faqs).set(values).where(eq(faqs.id, id));
  else await db.insert(faqs).values({ ...values, position: await nextPosition("faqs") });
  await logActivity({ type: "content.updated", summary: `Question enregistrée : ${parsed.data.question}`, actorId: admin.id });
  revalidatePublic();
  revalidatePath("/admin/faq");
  return success(UUID_RE.test(id) ? "Question enregistrée." : "Question ajoutée.");
}

export async function deleteFaq(id: string) {
  await requireAdmin();
  if (!UUID_RE.test(id)) return;
  await getDb().delete(faqs).where(eq(faqs.id, id));
  revalidatePublic();
  revalidatePath("/admin/faq");
}

export async function moveFaq(id: string, direction: "up" | "down") {
  await requireAdmin();
  if (!UUID_RE.test(id)) return;
  await moveRow("faqs", id, direction);
  revalidatePublic();
  revalidatePath("/admin/faq");
}

export async function toggleFaq(id: string, field: "isActive" | "showOnHome", value: boolean) {
  await requireAdmin();
  if (!UUID_RE.test(id)) return;
  await getDb().update(faqs).set({ [field]: value }).where(eq(faqs.id, id));
  revalidatePublic();
  revalidatePath("/admin/faq");
}
