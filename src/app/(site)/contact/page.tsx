import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { ContactForm } from "@/components/site/ContactForm";
import { PageHeader } from "@/components/site/Sections";
import { SocialLinks } from "@/components/ui/SocialLinks";
import { ButtonLink } from "@/components/ui/Button";
import { RichText } from "@/components/ui/RichText";
import { pageMetadata } from "@/lib/data/metadata";
import { getPage, getSettings } from "@/lib/data/public";
import { formatPhone, phoneHref } from "@/lib/format";

export const revalidate = 3600;

export function generateMetadata() {
  return pageMetadata("contact", "/contact", "Contact");
}

export default async function ContactPage() {
  const [page, settings] = await Promise.all([getPage("contact"), getSettings()]);
  const s = page?.sections ?? {};
  const address =
    settings?.showAddress && settings.addressLine
      ? `${settings.addressLine}\n${[settings.postalCode, settings.city].filter(Boolean).join(" ")}`
      : "";

  return (
    <>
      <PageHeader section={s.hero} fallbackTitle="Contact" />
      <div className="container-page py-14 sm:py-20">
        <div className="grid gap-14 lg:grid-cols-[1.35fr_0.65fr] lg:gap-20">
          <section aria-labelledby="titre-formulaire">
            <h2 id="titre-formulaire" className="text-3xl">
              Envoyer un message
            </h2>
            <p className="mt-2 mb-8 text-muted">Tous les champs sont obligatoires, sauf mention contraire.</p>
            <ContactForm />
          </section>

          <aside className="space-y-10" aria-label="Coordonnées">
            <div>
              <h2 className="text-2xl">Coordonnées</h2>
              <ul className="mt-5 space-y-4 text-[0.97rem]">
                {settings?.email && (
                  <li className="flex gap-3">
                    <Mail className="mt-1 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                    <a href={`mailto:${settings.email}`} className="link-underline break-all">
                      {settings.email}
                    </a>
                  </li>
                )}
                {settings?.phone && (
                  <li className="flex gap-3">
                    <Phone className="mt-1 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                    <a href={phoneHref(settings.phone)} className="link-underline">
                      {formatPhone(settings.phone)}
                    </a>
                  </li>
                )}
                {(address || settings?.serviceArea) && (
                  <li className="flex gap-3">
                    <MapPin className="mt-1 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                    <span className="whitespace-pre-line text-muted">
                      {address}
                      {address && settings?.serviceArea ? "\n" : ""}
                      {settings?.serviceArea && `Secteur d'intervention : ${settings.serviceArea}`}
                    </span>
                  </li>
                )}
                {settings?.contactHoursNote && (
                  <li className="flex gap-3">
                    <Clock className="mt-1 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                    <span className="text-muted">{settings.contactHoursNote}</span>
                  </li>
                )}
              </ul>
              <SocialLinks settings={settings} className="mt-6" />
            </div>

            {s.booking_cta && settings?.bookingEnabled !== false && (
              <div className="rounded-[var(--radius-card)] bg-secondary p-7">
                <h2 className="text-2xl">{s.booking_cta.heading}</h2>
                <RichText text={s.booking_cta.body} className="prose-site mt-3 text-[0.97rem]" />
                {s.booking_cta.ctaLabel && s.booking_cta.ctaHref && (
                  <ButtonLink href={s.booking_cta.ctaHref} className="mt-6 w-full">
                    {s.booking_cta.ctaLabel}
                  </ButtonLink>
                )}
              </div>
            )}
          </aside>
        </div>
      </div>
    </>
  );
}
