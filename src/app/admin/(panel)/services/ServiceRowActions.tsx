"use client";

import Link from "next/link";
import { ReorderButtons, ToggleSwitch } from "@/components/admin/ActionButtons";
import { moveService, toggleServiceActive } from "@/lib/actions/admin/services";

export function ServiceRowActions({ id, title, isActive, isFirst, isLast }: { id: string; title: string; isActive: boolean; isFirst: boolean; isLast: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 sm:justify-end">
      <label className="flex items-center gap-2 text-sm text-muted">
        <ToggleSwitch checked={isActive} onToggle={(v) => toggleServiceActive(id, v)} label={`Afficher « ${title} » sur le site`} />
        <span aria-hidden="true">Visible</span>
      </label>
      <ReorderButtons id={id} action={moveService} isFirst={isFirst} isLast={isLast} label={title} />
      <Link href={`/admin/services/${id}`} className="inline-flex h-9 items-center rounded-md border border-line-strong px-3.5 text-sm font-medium hover:border-muted">
        Modifier
      </Link>
    </div>
  );
}
