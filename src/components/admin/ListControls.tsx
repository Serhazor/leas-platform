import Link from "next/link";

/** Builds a URL keeping existing search params. */
export function withParams(base: string, params: Record<string, string | undefined>, changes: Record<string, string | undefined>) {
  const merged = { ...params, ...changes };
  const qs = new URLSearchParams(Object.entries(merged).filter(([, v]) => v) as [string, string][]).toString();
  return qs ? `${base}?${qs}` : base;
}

export function Pagination({
  base,
  params,
  page,
  pageCount,
  total,
}: {
  base: string;
  params: Record<string, string | undefined>;
  page: number;
  pageCount: number;
  total: number;
}) {
  if (pageCount <= 1) return <p className="mt-4 text-sm text-subtle">{total} résultat{total > 1 ? "s" : ""}</p>;
  return (
    <nav aria-label="Pagination" className="mt-6 flex items-center justify-between gap-4 text-sm">
      <p className="text-subtle">
        Page {page} sur {pageCount} · {total} résultat{total > 1 ? "s" : ""}
      </p>
      <div className="flex gap-2">
        {page > 1 && (
          <Link href={withParams(base, params, { page: String(page - 1) })} className="rounded-md border border-line-strong bg-white px-3 py-2 hover:border-muted">
            Précédente
          </Link>
        )}
        {page < pageCount && (
          <Link href={withParams(base, params, { page: String(page + 1) })} className="rounded-md border border-line-strong bg-white px-3 py-2 hover:border-muted">
            Suivante
          </Link>
        )}
      </div>
    </nav>
  );
}

/** Horizontal tabs (links) used for filters and settings sections. */
export function Tabs({ items, label }: { items: { href: string; label: string; active: boolean; count?: number }[]; label: string }) {
  return (
    <nav aria-label={label} className="-mx-4 mb-6 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <ul className="flex min-w-max gap-1 border-b border-line">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={item.active ? "page" : undefined}
              className={`-mb-px inline-flex items-center gap-2 border-b-2 px-3 py-2.5 text-sm whitespace-nowrap ${
                item.active ? "border-primary font-medium text-ink" : "border-transparent text-muted hover:text-ink"
              }`}
            >
              {item.label}
              {item.count ? <span className="rounded-full bg-accent-soft px-1.5 text-xs text-accent">{item.count}</span> : null}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
