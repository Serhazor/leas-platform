import { Clock, Euro, CalendarCheck } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ServiceCard } from "@/components/site/ServiceCard";
import { ContentSection, CtaBand } from "@/components/site/Sections";
import { ButtonLink } from "@/components/ui/Button";
import { ImageFrame } from "@/components/ui/ImageFrame";
import { JsonLd } from "@/components/ui/JsonLd";
import { plainText, RichText } from "@/components/ui/RichText";
import { getPage, getPublicServiceBySlug, getPublicServices, getSettings } from "@/lib/data/public";
import { formatServicePrice } from "@/lib/format";
import { breadcrumbJsonLd, buildMetadata } from "@/lib/seo";
import { siteUrl } from "@/lib/site-url";
import { formatDuration } from "@/lib/time";

export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  try {
    const services = await getPublicServices();
    return services.map((s) => ({ slug: s.slug }));
  } catch {
    return [];
  }
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const [settings, service] = await Promise.all([getSettings(), getPublicServiceBySlug(slug)]);
  if (!service) return {};
  return buildMetadata({
    settings,
    path: `/services/${service.slug}`,
    title: service.seoTitle || service.title,
    description: service.seoDescription || service.shortDescription || plainText(service.description),
    image: service.image,
  });
}

export default async function ServicePage({ params }: Props) {
  const { slug } = await params;
  const [service, settings, all, servicesPage] = await Promise.all([
    getPublicServiceBySlug(slug),
    getSettings(),
    getPublicServices(),
    getPage("services"),
  ]);
  if (!service) notFound();

  const price = formatServicePrice(service);
  const bookable = Boolean(settings?.bookingEnabled && service.bookingEnabled && !service.isComingSoon);
  const duration = service.durationMinutes || settings?.defaultDurationMinutes || 60;
  const related = all.filter((s) => s.id !== service.id && s.category?.id === service.category?.id).slice(0, 3);
  const others = related.length ? related : all.filter((s) => s.id !== service.id && !s.isComingSoon).slice(0, 3);
  const isInspection = service.category?.slug === "services-immobiliers";

  return (
    <>
      <section className="border-b border-line/70 bg-secondary/55">
        <div className="container-page py-10 sm:py-14 lg:py-18">
          <nav aria-label="Fil d'Ariane" className="text-sm text-subtle">
            <ol className="flex flex-wrap items-center gap-2">
              <li>
                <Link href="/" className="hover:text-ink">
                  Accueil
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link href="/services" className="hover:text-ink">
                  Services
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li aria-current="page" className="text-muted">
                {service.title}
              </li>
            </ol>
          </nav>
          <div className="mt-8 grid gap-10 lg:grid-cols-[1.25fr_0.75fr] lg:items-end">
            <div className="animate-fade-up">
              <div className="flex flex-wrap items-center gap-3">
                {service.category && <p className="eyebrow">{service.category.name}</p>}
                {service.isComingSoon && (
                  <span className="rounded-full bg-accent-soft px-2.5 py-1 text-xs font-medium text-accent">Bientôt disponible</span>
                )}
              </div>
              <h1 className="mt-4 text-[2.4rem] sm:text-5xl lg:text-[3.5rem]">{service.title}</h1>
              {service.shortDescription && (
                <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted sm:text-xl">{service.shortDescription}</p>
              )}
            </div>
            <dl className="grid gap-4 rounded-[var(--radius-card)] border border-line bg-white/80 p-6 text-sm">
              {!service.isComingSoon && (
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-accent" aria-hidden="true" />
                  <dt className="text-muted">Durée indicative</dt>
                  <dd className="ml-auto font-medium">{formatDuration(duration)}</dd>
                </div>
              )}
              {price && (
                <div className="flex items-center gap-3">
                  <Euro className="h-4 w-4 text-accent" aria-hidden="true" />
                  <dt className="text-muted">Tarif</dt>
                  <dd className="ml-auto font-medium">{price}</dd>
                </div>
              )}
              <div className="flex items-center gap-3">
                <CalendarCheck className="h-4 w-4 text-accent" aria-hidden="true" />
                <dt className="text-muted">Réservation en ligne</dt>
                <dd className="ml-auto font-medium">{bookable ? "Disponible" : "Sur demande"}</dd>
              </div>
              <div className="pt-2">
                {bookable ? (
                  <ButtonLink href={`/reservation?service=${service.slug}`} className="w-full">
                    {service.ctaLabel || "Réserver ce service"}
                  </ButtonLink>
                ) : (
                  <ButtonLink href="/contact" className="w-full">
                    {service.isComingSoon ? "Me contacter" : service.ctaLabel || "Me contacter"}
                  </ButtonLink>
                )}
              </div>
            </dl>
          </div>
        </div>
      </section>

      <ContentSection>
        <div className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr] lg:gap-20">
          <div>
            <RichText text={service.description} className="prose-site text-lg" />
            {isInspection && (
              <p className="mt-10 border-l-2 border-accent pl-5 text-muted">
                Vous êtes une agence ou un gestionnaire de biens ?{" "}
                <Link href="/etats-des-lieux" className="font-medium text-primary underline underline-offset-4">
                  Découvrez comment externaliser vos états des lieux
                </Link>
                .
              </p>
            )}
          </div>
          {service.image && (
            <div className="lg:sticky lg:top-28 lg:self-start">
              <ImageFrame image={service.image} ratio="4/5" sizes="(min-width: 1024px) 35vw, 100vw" priority />
            </div>
          )}
        </div>

        {service.gallery.length > 0 && (
          <div className="mt-16">
            <h2 className="text-3xl">En images</h2>
            <ul className="mt-8 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3">
              {service.gallery.map((img) => (
                <li key={img.id} className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-card)] bg-secondary">
                  <Image src={img.url} alt={img.alt} fill sizes="(min-width: 1024px) 33vw, 50vw" className="object-cover" />
                </li>
              ))}
            </ul>
          </div>
        )}
      </ContentSection>

      {others.length > 0 && (
        <ContentSection tone="soft" labelledBy="autres-services">
          <h2 id="autres-services" className="text-3xl sm:text-4xl">
            {related.length ? "Services associés" : "Autres services"}
          </h2>
          <div className="mt-10 grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {others.map((s) => (
              <ServiceCard key={s.id} service={s} />
            ))}
          </div>
        </ContentSection>
      )}

      <CtaBand section={servicesPage?.sections.final_cta} />

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Service",
          name: service.title,
          description: service.shortDescription || plainText(service.description),
          url: siteUrl(`/services/${service.slug}`),
          serviceType: service.category?.name,
          provider: { "@id": siteUrl("/#organisation") },
          areaServed: settings?.serviceArea || undefined,
          ...(price && service.priceCents != null
            ? { offers: { "@type": "Offer", priceCurrency: "EUR", price: (service.priceCents / 100).toFixed(2) } }
            : {}),
        }}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Accueil", path: "/" },
          { name: "Services", path: "/services" },
          { name: service.title, path: `/services/${service.slug}` },
        ])}
      />
    </>
  );
}
