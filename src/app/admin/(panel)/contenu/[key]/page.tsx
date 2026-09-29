import { ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPageHeader, Panel } from "@/components/admin/Panel";
import { requireAdmin } from "@/lib/auth/session";
import { getPageDefinition } from "@/lib/content/registry";
import { getEditablePage, listAdminServices, listSteps } from "@/lib/data/admin";
import { PageEditor, type SectionValues } from "./PageEditor";
import { StepsEditor } from "./StepsEditor";

export const metadata: Metadata = { title: "Modifier une page" };

export default async function EditPage({ params }: { params: Promise<{ key: string }> }) {
  await requireAdmin();
  const { key } = await params;
  const def = getPageDefinition(key);
  if (!def) notFound();
  const [data, steps, services] = await Promise.all([
    getEditablePage(key),
    def.extras?.includes("process_steps") ? listSteps() : Promise.resolve([]),
    listAdminServices(),
  ]);
  const img = (id: string | null | undefined) => (id && data.images[id] ? { id, url: data.images[id].url, alt: data.images[id].alt } : null);

  const sections: Record<string, SectionValues> = {};
  for (const [k, s] of Object.entries(data.sections)) {
    sections[k] = {
      isVisible: s.isVisible,
      eyebrow: s.eyebrow,
      heading: s.heading,
      subheading: s.subheading,
      body: s.body,
      image: img(s.imageId),
      ctaLabel: s.ctaLabel,
      ctaHref: s.ctaHref,
      cta2Label: s.cta2Label,
      cta2Href: s.cta2Href,
      items: s.items.map((i) => ({ ...i, imageUrl: i.imageId ? data.images[i.imageId]?.url ?? null : null })),
    };
  }
  const extraLinks = services.filter((s) => s.isActive).map((s) => ({ href: `/services/${s.slug}`, label: `Service : ${s.title}` }));

  return (
    <>
      <AdminPageHeader
        title={def.name}
        description={def.description}
        back={{ href: "/admin/contenu", label: "Pages du site" }}
        actions={
          <a href={def.path} target="_blank" rel="noopener" className="inline-flex h-10 items-center gap-2 rounded-md border border-line-strong bg-white px-4 text-sm">
            <ExternalLink className="h-4 w-4" aria-hidden="true" /> Voir la page
          </a>
        }
      />

      {(def.extras?.includes("process_steps") || def.extras?.includes("faq_link") || def.extras?.includes("services_link")) && (
        <div className="mb-6 space-y-6">
          {def.extras?.includes("process_steps") && key === "comment-ca-marche" && (
            <Panel title="Les étapes" description="Affichées sur cette page et sur la page d'accueil. Chaque étape s'enregistre séparément.">
              <StepsEditor steps={steps.map((s) => ({ id: s.id, title: s.title, description: s.description, isActive: s.isActive, updatedAt: s.updatedAt.toISOString() }))} />
            </Panel>
          )}
          <div className="flex flex-wrap gap-3 text-sm">
            {def.extras?.includes("services_link") && (
              <Link href="/admin/services" className="rounded-md border border-line bg-white px-3 py-2 hover:border-muted">
                Gérer les services →
              </Link>
            )}
            {def.extras?.includes("process_steps") && key !== "comment-ca-marche" && (
              <Link href="/admin/contenu/comment-ca-marche" className="rounded-md border border-line bg-white px-3 py-2 hover:border-muted">
                Modifier les étapes « Comment ça marche » →
              </Link>
            )}
            {def.extras?.includes("faq_link") && (
              <Link href="/admin/faq" className="rounded-md border border-line bg-white px-3 py-2 hover:border-muted">
                Gérer les questions fréquentes →
              </Link>
            )}
          </div>
        </div>
      )}

      <PageEditor
        pageKey={key}
        sections={sections}
        seo={{ seoTitle: data.page?.seoTitle ?? "", seoDescription: data.page?.seoDescription ?? "", ogImage: img(data.page?.ogImageId) }}
        extraLinks={extraLinks}
      />
    </>
  );
}
