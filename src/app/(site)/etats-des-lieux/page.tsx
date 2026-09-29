import { ContentSection, CtaBand, SectionCtas, SectionHeading } from "@/components/site/Sections";
import { ServiceCard } from "@/components/site/ServiceCard";
import { ImageFrame } from "@/components/ui/ImageFrame";
import { JsonLd } from "@/components/ui/JsonLd";
import { RichText } from "@/components/ui/RichText";
import { pageMetadata } from "@/lib/data/metadata";
import { getPage, getPublicServices } from "@/lib/data/public";
import { breadcrumbJsonLd } from "@/lib/seo";

export const revalidate = 3600;

export function generateMetadata() {
  return pageMetadata("etats-des-lieux", "/etats-des-lieux", "États des lieux");
}

export default async function InspectionsPage() {
  const [page, services] = await Promise.all([getPage("etats-des-lieux"), getPublicServices()]);
  const s = page?.sections ?? {};
  const related = services.filter((x) => x.category?.slug === "services-immobiliers");

  return (
    <>
      {s.hero && (
        <section className="border-b border-line/70 bg-secondary/55">
          <div className="container-page grid gap-10 py-14 sm:py-18 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-16 lg:py-22">
            <div className="animate-fade-up">
              {s.hero.eyebrow && <p className="eyebrow">{s.hero.eyebrow}</p>}
              <h1 className="mt-4 text-[2.4rem] sm:text-5xl lg:text-[3.6rem]">{s.hero.heading}</h1>
              {s.hero.subheading && <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted sm:text-xl">{s.hero.subheading}</p>}
              <SectionCtas section={s.hero} className="mt-8" />
            </div>
            {s.hero.image && <ImageFrame image={s.hero.image} ratio="5/4" priority sizes="(min-width: 1024px) 45vw, 100vw" />}
          </div>
        </section>
      )}

      {(s.entree || s.sortie) && (
        <ContentSection>
          <div className="grid gap-16 md:grid-cols-2 md:gap-12 lg:gap-20">
            {[s.entree, s.sortie].map(
              (section) =>
                section && (
                  <article key={section.key}>
                    {section.image && <ImageFrame image={section.image} ratio="3/2" className="mb-8" sizes="(min-width: 768px) 45vw, 100vw" />}
                    <h2 className="text-3xl sm:text-[2.3rem]">{section.heading}</h2>
                    <RichText text={section.body} className="prose-site mt-5" />
                  </article>
                ),
            )}
          </div>
        </ContentSection>
      )}

      {s.professionnels && (
        <ContentSection tone="soft" labelledBy="titre-pros">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
            <div>
              <SectionHeading id="titre-pros" eyebrow={s.professionnels.eyebrow} title={s.professionnels.heading} />
              <RichText text={s.professionnels.body} className="prose-site mt-6 text-lg" />
            </div>
            <ul className="divide-y divide-line border-y border-line">
              {s.professionnels.items.map((item, i) => (
                <li key={i} className="py-6">
                  <h3 className="text-2xl">{item.title}</h3>
                  <p className="mt-2 leading-relaxed text-muted">{item.text}</p>
                </li>
              ))}
            </ul>
          </div>
        </ContentSection>
      )}

      {s.locations && s.locations.items.length > 0 && (
        <ContentSection labelledBy="titre-locations">
          <SectionHeading id="titre-locations" title={s.locations.heading} />
          <ul className="mt-10 grid gap-10 md:grid-cols-3">
            {s.locations.items.map((item, i) => (
              <li key={i} className="border-t border-ink/15 pt-6">
                <h3 className="text-2xl">{item.title}</h3>
                <p className="mt-2 leading-relaxed text-muted">{item.text}</p>
              </li>
            ))}
          </ul>
        </ContentSection>
      )}

      {s.documents && (
        <ContentSection tone="soft" labelledBy="titre-documents">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
            <SectionHeading id="titre-documents" title={s.documents.heading} />
            <RichText text={s.documents.body} className="prose-site text-lg" />
          </div>
        </ContentSection>
      )}

      {related.length > 0 && (
        <ContentSection labelledBy="titre-prestations">
          <h2 id="titre-prestations" className="text-3xl sm:text-4xl">
            Les prestations
          </h2>
          <div className="mt-10 grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        </ContentSection>
      )}

      <CtaBand section={s.final_cta} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Accueil", path: "/" },
          { name: "États des lieux", path: "/etats-des-lieux" },
        ])}
      />
    </>
  );
}
