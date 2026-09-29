"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { BOOKING_CTA, MAIN_NAV } from "@/lib/navigation";
import { formatPhone, phoneHref } from "@/lib/format";
import { isActivePath } from "./NavLinks";

export function MobileNavigation({ phone, email }: { phone?: string; email?: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [lastPath, setLastPath] = useState(pathname);

  // Close the menu after navigating.
  if (pathname !== lastPath) {
    setLastPath(pathname);
    if (open) setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.querySelector<HTMLElement>("a")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="menu-mobile"
        className="-mr-2 inline-flex h-11 items-center gap-2 rounded-md px-3 text-sm font-medium text-ink hover:bg-ink/5"
      >
        {open ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
        <span>{open ? "Fermer" : "Menu"}</span>
      </button>

      <div
        id="menu-mobile"
        ref={panelRef}
        hidden={!open}
        className="fixed inset-x-0 top-[var(--header-h,4.5rem)] bottom-0 z-40 overflow-y-auto border-t border-line bg-paper"
      >
        <nav aria-label="Navigation principale" className="container-page flex min-h-full flex-col py-6">
          <ul className="divide-y divide-line">
            {MAIN_NAV.map((item) => {
              const active = isActivePath(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center justify-between py-4 font-serif text-2xl ${active ? "text-primary" : "text-ink"}`}
                  >
                    {item.label}
                    {active && <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />}
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className="mt-auto space-y-4 pt-8">
            <Link
              href={BOOKING_CTA.href}
              className="flex h-12 w-full items-center justify-center rounded-md bg-primary text-base font-medium text-on-primary"
            >
              {BOOKING_CTA.label}
            </Link>
            {(phone || email) && (
              <div className="flex flex-col gap-1 text-center text-sm text-muted">
                {phone && (
                  <a href={phoneHref(phone)} className="py-1">
                    {formatPhone(phone)}
                  </a>
                )}
                {email && (
                  <a href={`mailto:${email}`} className="py-1">
                    {email}
                  </a>
                )}
              </div>
            )}
          </div>
        </nav>
      </div>
    </div>
  );
}
