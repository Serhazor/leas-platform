"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/admin/parametres", label: "Entreprise et contact" },
  { href: "/admin/parametres/apparence", label: "Apparence" },
  { href: "/admin/parametres/reservations", label: "Réservations" },
  { href: "/admin/parametres/referencement", label: "Référencement" },
  { href: "/admin/parametres/emails", label: "E-mails" },
  { href: "/admin/parametres/informations-legales", label: "Informations légales" },
  { href: "/admin/parametres/acces", label: "Accès" },
];

export function SettingsTabs() {
  const pathname = usePathname();
  return (
    <nav aria-label="Sections des paramètres" className="-mx-4 mb-6 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <ul className="flex min-w-max gap-1 border-b border-line">
        {TABS.map((t) => {
          const active = pathname === t.href;
          return (
            <li key={t.href}>
              <Link
                href={t.href}
                aria-current={active ? "page" : undefined}
                className={`-mb-px inline-block border-b-2 px-3 py-2.5 text-sm whitespace-nowrap ${
                  active ? "border-primary font-medium text-ink" : "border-transparent text-muted hover:text-ink"
                }`}
              >
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
