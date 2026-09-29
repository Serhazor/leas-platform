import { Mail, MapPin, Phone } from "lucide-react";
import Link from "next/link";
import { SocialLinks } from "@/components/ui/SocialLinks";
import type { PublicService, PublicSettings } from "@/lib/data/public";
import { formatPhone, phoneHref } from "@/lib/format";
import { BOOKING_CTA, LEGAL_NAV, MAIN_NAV } from "@/lib/navigation";

export function Footer({ settings, services }: { settings: PublicSettings | null; services: PublicService[] }) {
  const year = new Date().getFullYear();
  const footerServices = services.filter((s) => !s.isComingSoon).slice(0, 6);

  return (
    <footer className="border-t border-line bg-secondary/60 text-ink">
      <div className="container-page grid gap-12 py-14 sm:py-16 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr] lg:gap-10">
        <div className="max-w-sm">
          <p className="font-serif text-2xl">{settings?.companyName}</p>
          {settings?.tagline && <p className="mt-2 text-sm text-muted">{settings.tagline}</p>}
          {settings?.footerText && <p className="mt-5 text-sm leading-relaxed text-muted">{settings.footerText}</p>}
        </div>

        <nav aria-label="Plan du site">
          <h2 className="font-sans text-xs font-semibold tracking-[0.16em] text-subtle uppercase">Navigation</h2>
          <ul className="mt-4 space-y-2.5 text-sm">
            {MAIN_NAV.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="text-muted hover:text-ink">
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href={BOOKING_CTA.href} className="text-muted hover:text-ink">
                Réservation
              </Link>
            </li>
          </ul>
        </nav>

        {footerServices.length > 0 && (
          <nav aria-label="Services">
            <h2 className="font-sans text-xs font-semibold tracking-[0.16em] text-subtle uppercase">Services</h2>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <Link href="/etats-des-lieux" className="text-muted hover:text-ink">
                  États des lieux
                </Link>
              </li>
              {footerServices.map((s) => (
                <li key={s.id}>
                  <Link href={`/services/${s.slug}`} className="text-muted hover:text-ink">
                    {s.title}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}

        <div>
          <h2 className="font-sans text-xs font-semibold tracking-[0.16em] text-subtle uppercase">Contact</h2>
          <ul className="mt-4 space-y-3 text-sm text-muted">
            {settings?.email && (
              <li className="flex items-start gap-2.5">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                <a href={`mailto:${settings.email}`} className="break-all hover:text-ink">
                  {settings.email}
                </a>
              </li>
            )}
            {settings?.phone && (
              <li className="flex items-start gap-2.5">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                <a href={phoneHref(settings.phone)} className="hover:text-ink">
                  {formatPhone(settings.phone)}
                </a>
              </li>
            )}
            {(settings?.serviceArea || settings?.city) && (
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                <span>{settings.serviceArea || settings.city}</span>
              </li>
            )}
            <li>
              <Link href="/contact" className="link-underline text-ink">
                Écrire un message
              </Link>
            </li>
          </ul>
          <SocialLinks settings={settings} className="mt-5" />
        </div>
      </div>
      <div className="border-t border-line">
        <div className="container-page flex flex-col gap-3 py-6 text-xs text-subtle sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {settings?.companyName}. Tous droits réservés.
          </p>
          <ul className="flex flex-wrap gap-x-5 gap-y-2">
            {LEGAL_NAV.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="hover:text-ink">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
