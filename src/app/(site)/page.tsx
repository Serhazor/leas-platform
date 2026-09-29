import type { Metadata } from "next";
import Link from "next/link";
import { FaqList } from "@/components/site/FaqList";
import { ProcessSteps } from "@/components/site/ProcessSteps";
import { ServiceCard } from "@/components/site/ServiceCard";
import { ContentSection, CtaBand, SectionCtas, SectionHeading, TextLink } from "@/components/site/Sections";
import { ImageFrame } from "@/components/ui/ImageFrame";
import { ServiceIcon } from "@/components/ui/icons";
import { JsonLd } from "@/components/ui/JsonLd";
import { RichText } from "@/components/ui/RichText";
import { getFaqs, getPage, getProcessSteps, getPublicServices, getSettings, type PublicService } from "@/lib/data/public";
import { buildMetadata, faqJsonLd } from "@/lib/seo";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const [settings, page] = await Promise.all([getSettings(), getPage("accueil")]);
  return buildMetadata({
    settings,
    path: "/",
    title: page?.seoTitle || settings?.seoTitle,
    description: page?.seoDescription,
    image: page?.ogImage,
    absoluteTitle: true,
  });
}

export default async function HomePage() {
  const [page, aboutPage, services, steps, faqs] = await Promise.all([
    getPage("accueil"),
    getPage("a-propos"),
    getPublicServices(),
    getProcessSteps(),
    getFaqs(true),
  ]);
  const s = page?.sections ?? {};
  const featured = services.filter((x) => x.isFeatured);
  const aboutImage = s.about?.image ?? aboutPage?.sections.hero?.image ?? null;

  return (
    <>
      {/* 1. Hero */}
      {s.hero && (
        <section aria-labelledby="titre-accueil" className="relative overflow-hidden">
          <div className="container-page grid gap-12 pt-12 pb-16 sm:pt-16 sm:pb-20 lg:grid-cols-[1.12fr_0.88fr] lg:items-center lg:gap-16 lg:pt-20 lg:pb-28">
            <div className="animate-fade-up">
              {s.hero.eyebrow && <p className="eyebrow">{s.hero.eyebrow}</p>}
              <h1 id="titre-accueil" className="mt-5 text-[2.6rem] leading-[1.05] sm:text-6xl lg:text-[4.1rem]">
                {s.hero.heading}
              </h1>
              {s.hero.subheading && (
                <p className="mt-7 max-w-xl text-lg leading-relaxed text-muted sm:text-xl">{s.hero.subheading}</p>
              )}
              <SectionCtas section={s.hero} className="mt-9" />
            </div>
            <div className="animate-fade-up [animation-delay:120ms]">
              {s.hero.image ? (
                <ImageFrame image={s.hero.image} ratio="4/5" priority sizes="(min-width: 1024px) 42vw, 100vw" />
              ) : (
                <ServicesIndex services={services} />
              )}
            </div>
          </div>
        </section>
      )}

      {/* 2. Introduction */}
      {s.intro && (
        <ContentSection tone="soft" labelledBy="titre-intro">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
            <SectionHeading id="titre-intro" eyebrow={s.intro.eyebrow} title={s.intro.heading} />
            <RichText text={s.intro.body} className="prose-site text-lg lg:pt-9" />
          </div>
        </ContentSection>
      )}

      {/* 3. Services */}
      {s.services && featured.length > 0 && (
        <ContentSection labelledBy="titre-services">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <SectionHeading id="titre-services" eyebrow={s.services.eyebrow} title={s.services.heading} intro={s.services.subheading} />
            {s.services.ctaLabel && s.services.ctaHref && (
              <div className="shrink-0">
                <TextLink href={s.services.ctaHref}>{s.services.ctaLabel}</TextLink>
              </div>
            )}
          </div>
          <div className="mt-12 grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        </ContentSection>
      )}

      {/* 4. How it works */}
      {s.process && steps.length > 0 && (
        <ContentSection tone="soft" labelledBy="titre-etapes">
          <SectionHeading id="titre-etapes" eyebrow={s.process.eyebrow} title={s.process.heading} intro={s.process.subheading} />
          <div className="mt-12">
            <ProcessSteps steps={steps} />
          </div>
          {s.process.ctaLabel && s.process.ctaHref && (
            <div className="mt-12">
              <TextLink href={s.process.ctaHref}>{s.process.ctaLabel}</TextLink>
            </div>
          )}
        </ContentSection>
      )}

      {/* 5. About */}
      {s.about && (
        <ContentSection labelledBy="titre-apropos">
          <div className="grid gap-10 md:grid-cols-[0.8fr_1.2fr] md:items-center lg:gap-20">
            <ImageFrame image={aboutImage} ratio="4/5" sizes="(min-width: 768px) 40vw, 100vw" className="max-w-md" />
            <div>
              <SectionHeading id="titre-apropos" eyebrow={s.about.eyebrow} title={s.about.heading} />
              <RichText text={s.about.body} className="prose-site mt-6 text-lg" />
              {s.about.ctaLabel && s.about.ctaHref && (
                <div className="mt-8">
                  <TextLink href={s.about.ctaHref}>{s.about.ctaLabel}</TextLink>
                </div>
              )}
            </div>
          </div>
        </ContentSection>
      )}

      {/* 6. Why choose */}
      {s.why && s.why.items.length > 0 && (
        <ContentSection tone="soft" labelledBy="titre-pourquoi">
          <SectionHeading id="titre-pourquoi" eyebrow={s.why.eyebrow} title={s.why.heading} />
          <ul className="mt-12 grid gap-x-12 gap-y-10 md:grid-cols-2">
            {s.why.items.map((item, i) => (
              <li key={i} className="grid grid-cols-[auto_1fr] gap-5">
                <span className="mt-1 font-serif text-2xl text-accent" aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="text-2xl">{item.title}</h3>
                  <p className="mt-2 leading-relaxed text-muted">{item.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </ContentSection>
      )}

      {/* 7. FAQ preview */}
      {s.faq && faqs.length > 0 && (
        <ContentSection labelledBy="titre-faq">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
            <div>
              <SectionHeading id="titre-faq" eyebrow={s.faq.eyebrow} title={s.faq.heading} />
              {s.faq.ctaLabel && s.faq.ctaHref && (
                <div className="mt-8">
                  <TextLink href={s.faq.ctaHref}>{s.faq.ctaLabel}</TextLink>
                </div>
              )}
            </div>
            <FaqList faqs={faqs} />
          </div>
          <JsonLd data={faqJsonLd(faqs)} />
        </ContentSection>
      )}

      {/* 8. Final CTA */}
      <CtaBand section={s.final_cta} />
    </>
  );
}

/** Shown in the hero when no photo has been chosen: a factual index of the services. */
function ServicesIndex({ services }: { services: PublicService[] }) {
  const list = services.slice(0, 6);
  if (!list.length) return null;
  return (
    <div className="rounded-[var(--radius-card)] border border-line bg-white/70 p-6 sm:p-8">
      <p className="text-xs font-semibold tracking-[0.18em] text-subtle uppercase">Services</p>
      <ul className="mt-4 divide-y divide-line">
        {list.map((service) => (
          <li key={service.id}>
            <Link href={`/services/${service.slug}`} className="group flex items-center gap-4 py-4">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
                <ServiceIcon name={service.icon} />
              </span>
              <span className="flex-1">
                <span className="block font-serif text-xl leading-tight text-ink group-hover:text-primary">{service.title}</span>
                {service.isComingSoon && <span className="text-xs text-accent">Bientôt disponible</span>}
              </span>
              <span aria-hidden="true" className="text-subtle transition-transform group-hover:translate-x-1">
                →
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
