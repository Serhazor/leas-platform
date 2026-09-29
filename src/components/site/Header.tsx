import Image from "next/image";
import Link from "next/link";
import type { PublicSettings } from "@/lib/data/public";
import { BOOKING_CTA } from "@/lib/navigation";
import { ButtonLink } from "@/components/ui/Button";
import { MobileNavigation } from "./MobileNavigation";
import { NavLinks } from "./NavLinks";

export function Brand({ settings, className = "" }: { settings: PublicSettings | null; className?: string }) {
  const name = settings?.companyName || "Accueil";
  if (settings?.logo) {
    const height = 40;
    const width = Math.round((settings.logo.width / settings.logo.height) * height) || 160;
    return (
      <Image
        src={settings.logo.url}
        alt={settings.logo.alt || name}
        width={width}
        height={height}
        priority
        className={`h-9 w-auto sm:h-10 ${className}`}
      />
    );
  }
  return <span className={`font-serif text-[1.65rem] leading-none font-medium tracking-tight text-ink ${className}`}>{name}</span>;
}

export function Header({ settings }: { settings: PublicSettings | null }) {
  return (
    <header className="sticky top-0 z-50 border-b border-line/80 bg-paper [--header-h:4.5rem]">
      <a
        href="#contenu"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-[70] focus:rounded-md focus:bg-ink focus:px-4 focus:py-2 focus:text-white"
      >
        Aller au contenu
      </a>
      <div className="container-page flex h-[4.5rem] items-center justify-between gap-6">
        <Link href="/" className="flex shrink-0 items-center" aria-label={`${settings?.companyName || "Accueil"} — accueil`}>
          <Brand settings={settings} />
        </Link>
        <nav aria-label="Navigation principale" className="hidden lg:block">
          <NavLinks />
        </nav>
        <div className="flex items-center gap-2">
          {settings?.bookingEnabled !== false && (
            <div className="hidden min-[380px]:block">
              <ButtonLink href={BOOKING_CTA.href} size="sm" className="lg:h-10 lg:px-4">
                {BOOKING_CTA.label}
              </ButtonLink>
            </div>
          )}
          <MobileNavigation phone={settings?.phone} email={settings?.email} />
        </div>
      </div>
    </header>
  );
}
