import type { Metadata } from "next";
import { ServiceCard } from "@/components/site/ServiceCard";
import { ContentSection, CtaBand, PageHeader, TextLink } from "@/components/site/Sections";
import { JsonLd } from "@/components/ui/JsonLd";
import { getActiveCategories, getPage, getPublicServices, getSettings } from "@/lib/data/public";
import { breadcrumbJsonLd, buildMetadata } from "@/lib/seo";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const [settings, page] = await Promise.all([getSettings(), getPage("services")]);
  return buildMetadata({
    settings,
    path: "/services",
    title: page?.seoTitle || "Services",
    description: page?.seoDescription,
    image: page?.ogImage,
  });
}

export default async function ServicesPage() {
  const [page, services, categories] = await Promise.all([getPage("services"), getPublicServices(), getActiveCategories()]);
  const s = page?.sections ?? {};
  const groups = categories
    .map((c) => ({ category: c, items: services.filter((x) => x.category?.id === c.id) }))
    .filter((g) => g.items.length);
  const uncategorised = services.filter((x) => !x.category);
  if (uncategorised.length) {
    groups.push({
      category: { id: "autres", name: "Autres services", description: "", slug: "autres" } as (typeof categories)[number],
      items: uncategorised,
    });
  }

  return (
    <>
      <PageHeader section={s.hero} fallbackTitle="Services" />

      <ContentSection>
        <div className="space-y-20">
          {groups.map(({ category, items }) => (
            <section key={category.id} aria-labelledby={`cat-${category.slug}`}>
              <div className="grid gap-4 border-b border-line pb-6 sm:grid-cols-[1fr_auto] sm:items-end">
                <div>
                  <h2 id={`cat-${category.slug}`} className="text-3xl sm:text-[2.2rem]">
                    {category.name}
                  </h2>
                  {category.description && <p className="mt-2 text-muted">{category.description}</p>}
                </div>
                {category.slug === "services-immobiliers" && (
                  <TextLink href="/etats-des-lieux">Tout savoir sur les états des lieux</TextLink>
                )}
              </div>
              <div className="mt-10 grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((service) => (
                  <ServiceCard key={service.id} service={service} />
                ))}
              </div>
            </section>
          ))}
          {groups.length === 0 && <p className="text-muted">Les services seront présentés ici très prochainement.</p>}
        </div>
      </ContentSection>

      <CtaBand section={s.final_cta} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Accueil", path: "/" },
          { name: "Services", path: "/services" },
        ])}
      />
    </>
  );
}
