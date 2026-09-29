"use client";

import {
  CalendarDays,
  CircleHelp,
  Clock,
  ExternalLink,
  FileText,
  Images,
  Inbox,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Briefcase,
  UserRound,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { logout } from "@/lib/actions/admin/auth";

const NAV = [
  { href: "/admin", label: "Tableau de bord", icon: LayoutDashboard, exact: true },
  { href: "/admin/reservations", label: "Réservations", icon: CalendarDays, badge: "bookings" as const },
  { href: "/admin/disponibilites", label: "Disponibilités", icon: Clock },
  { href: "/admin/demandes", label: "Demandes de contact", icon: Inbox, badge: "enquiries" as const },
  { href: "/admin/services", label: "Services", icon: Briefcase },
  { href: "/admin/contenu", label: "Pages du site", icon: FileText },
  { href: "/admin/faq", label: "Questions fréquentes", icon: CircleHelp },
  { href: "/admin/medias", label: "Médiathèque", icon: Images },
  { href: "/admin/parametres", label: "Paramètres", icon: Settings },
];

export function AdminShell({
  children,
  userName,
  companyName,
  counts,
  demoMode = false,
}: {
  children: ReactNode;
  userName: string;
  companyName: string;
  counts: { bookings: number; enquiries: number };
  demoMode?: boolean;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    if (open) setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const isActive = (href: string, exact?: boolean) => (exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`));

  const nav = (
    <nav aria-label="Administration" className="flex h-full flex-col">
      <ul className="space-y-0.5">
        {NAV.map((item) => {
          const active = isActive(item.href, item.exact);
          const badge = item.badge ? counts[item.badge] : 0;
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-[0.93rem] transition-colors ${
                  active ? "bg-primary text-on-primary" : "text-ink/80 hover:bg-ink/5 hover:text-ink"
                }`}
              >
                <Icon className="h-[1.1rem] w-[1.1rem] shrink-0" aria-hidden="true" strokeWidth={1.75} />
                <span className="flex-1">{item.label}</span>
                {badge > 0 && (
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${active ? "bg-white/20" : "bg-accent text-on-accent"}`}>
                    {badge}
                    <span className="sr-only"> en attente</span>
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="mt-auto space-y-0.5 border-t border-line pt-4">
        <a href="/" target="_blank" rel="noopener" className="flex items-center gap-3 rounded-md px-3 py-2.5 text-[0.93rem] text-ink/80 hover:bg-ink/5">
          <ExternalLink className="h-[1.1rem] w-[1.1rem]" aria-hidden="true" strokeWidth={1.75} />
          Voir le site
          <span className="sr-only">(nouvel onglet)</span>
        </a>
        <Link
          href="/admin/compte"
          aria-current={isActive("/admin/compte") ? "page" : undefined}
          className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-[0.93rem] ${isActive("/admin/compte") ? "bg-primary text-on-primary" : "text-ink/80 hover:bg-ink/5"}`}
        >
          <UserRound className="h-[1.1rem] w-[1.1rem]" aria-hidden="true" strokeWidth={1.75} />
          <span className="truncate">Mon compte · {userName}</span>
        </Link>
        {!demoMode && (
        <form action={logout}>
          <button type="submit" className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-[0.93rem] text-ink/80 hover:bg-ink/5">
            <LogOut className="h-[1.1rem] w-[1.1rem]" aria-hidden="true" strokeWidth={1.75} />
            Se déconnecter
          </button>
        </form>
        )}
      </div>
    </nav>
  );

  return (
    <div className="min-h-dvh bg-[#f7f6f3] font-sans">
      <a href="#admin-contenu" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[80] focus:rounded focus:bg-ink focus:px-3 focus:py-2 focus:text-white">
        Aller au contenu
      </a>
      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-line bg-white px-4 lg:hidden">
        <Link href="/admin" className="font-serif text-xl">
          {companyName}
          <span className="ml-2 font-sans text-xs text-subtle">Administration</span>
        </Link>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="admin-menu"
          className="inline-flex h-10 items-center gap-2 rounded-md px-3 text-sm font-medium hover:bg-ink/5"
        >
          {open ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
          Menu
          {!open && counts.bookings + counts.enquiries > 0 && <span className="h-2 w-2 rounded-full bg-accent" aria-hidden="true" />}
        </button>
      </header>
      <div id="admin-menu" hidden={!open} className="fixed inset-x-0 top-14 bottom-0 z-30 overflow-y-auto bg-white p-4 lg:hidden">
        {nav}
      </div>

      <div className="lg:grid lg:grid-cols-[16.5rem_1fr]">
        <aside className="sticky top-0 hidden h-dvh flex-col overflow-y-auto border-r border-line bg-white p-4 lg:flex">
          <Link href="/admin" className="mb-6 block px-3 pt-2">
            <span className="block font-serif text-2xl leading-tight">{companyName}</span>
            <span className="text-xs text-subtle">Administration</span>
          </Link>
          <div className="flex-1">{nav}</div>
        </aside>
        <main id="admin-contenu" tabIndex={-1} className="min-w-0 px-4 py-6 outline-none sm:px-8 sm:py-8 lg:py-10">
          <div className="mx-auto max-w-6xl">
            {demoMode && (
              <p className="mb-6 rounded-md border border-amber-600/25 bg-amber-50 px-4 py-2.5 text-sm text-amber-900">
                Mode démonstration : l&apos;administration est accessible sans connexion.
              </p>
            )}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
