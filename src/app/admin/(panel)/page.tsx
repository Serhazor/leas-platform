import { CalendarDays, CheckCircle2, Circle, FilePen, ImagePlus, Inbox, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { BookingLine, EnquiryStatusBadge } from "@/components/admin/BookingBits";
import { AdminPageHeader, EmptyState, Panel } from "@/components/admin/Panel";
import { requireAdmin } from "@/lib/auth/session";
import { getAdminSettings, getDashboardData, getSetupChecklist } from "@/lib/data/admin";
import { fullName } from "@/lib/format";
import { formatDateTime } from "@/lib/time";

export const metadata: Metadata = { title: "Tableau de bord" };

export default async function DashboardPage() {
  const admin = await requireAdmin();
  const [data, checklist, settings] = await Promise.all([getDashboardData(), getSetupChecklist(), getAdminSettings()]);
  const tz = settings?.timezone || "Europe/Paris";
  const todo = checklist.filter((c) => !c.done);
  const firstName = admin.name.split(" ")[0];

  const stats = [
    { label: "Demandes à valider", value: data.pendingCount, href: "/admin/reservations?statut=pending" },
    { label: "Rendez-vous dans les 7 jours", value: data.upcomingCount, href: "/admin/reservations" },
    { label: "Nouveaux messages", value: data.newEnquiriesCount, href: "/admin/demandes?statut=new" },
  ];

  const quick = [
    { href: "/admin/services/nouveau", label: "Ajouter un service", icon: Plus },
    { href: "/admin/contenu/accueil", label: "Modifier la page d'accueil", icon: FilePen },
    { href: "/admin/reservations", label: "Voir les réservations", icon: CalendarDays },
    { href: "/admin/medias", label: "Ajouter une image", icon: ImagePlus },
  ];

  return (
    <>
      <AdminPageHeader title={`Bonjour ${firstName}`} description="Voici un aperçu de votre activité." />

      <div className="grid gap-3 sm:grid-cols-3">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="rounded-lg border border-line bg-white p-5 transition-colors hover:border-muted">
            <span className="block text-3xl font-semibold tabular-nums">{s.value}</span>
            <span className="mt-1 block text-sm text-muted">{s.label}</span>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {quick.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className="flex items-center gap-3 rounded-lg border border-line bg-white px-4 py-3.5 text-sm font-medium hover:border-primary hover:text-primary">
            <Icon className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
            {label}
          </Link>
        ))}
      </div>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-2">
        <Panel title="Demandes de rendez-vous à valider" actions={<Link href="/admin/reservations?statut=pending" className="text-sm text-primary underline-offset-4 hover:underline">Tout voir</Link>}>
          {data.pending.length ? (
            <div className="-mx-2 divide-y divide-line">
              {data.pending.map((b) => (
                <BookingLine key={b.id} booking={b} tz={tz} />
              ))}
            </div>
          ) : (
            <EmptyState title="Aucune demande en attente">Les nouvelles demandes apparaîtront ici.</EmptyState>
          )}
        </Panel>

        <Panel title="Prochains rendez-vous confirmés" actions={<Link href="/admin/reservations?vue=calendrier" className="text-sm text-primary underline-offset-4 hover:underline">Calendrier</Link>}>
          {data.upcoming.length ? (
            <div className="-mx-2 divide-y divide-line">
              {data.upcoming.map((b) => (
                <BookingLine key={b.id} booking={b} tz={tz} />
              ))}
            </div>
          ) : (
            <EmptyState title="Aucun rendez-vous à venir" />
          )}
        </Panel>

        <Panel title="Derniers messages" actions={<Link href="/admin/demandes" className="text-sm text-primary underline-offset-4 hover:underline">Tout voir</Link>}>
          {data.enquiries.length ? (
            <ul className="-mx-2 divide-y divide-line">
              {data.enquiries.map((e) => (
                <li key={e.id}>
                  <Link href={`/admin/demandes/${e.id}`} className="flex items-center gap-3 rounded-md px-2 py-3 hover:bg-ink/[0.03]">
                    <Inbox className="h-4 w-4 shrink-0 text-subtle" aria-hidden="true" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{e.subject}</span>
                      <span className="block truncate text-sm text-muted">
                        {fullName(e)} · {formatDateTime(e.createdAt, tz)}
                      </span>
                    </span>
                    <EnquiryStatusBadge status={e.status} />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="Aucun message pour le moment" />
          )}
        </Panel>

        <div className="space-y-6">
          {todo.length > 0 && (
            <Panel title="À compléter" description="Quelques informations utiles avant la mise en ligne.">
              <ul className="space-y-2.5">
                {checklist.map((item) => (
                  <li key={item.label} className="flex items-start gap-3 text-sm">
                    {item.done ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" aria-hidden="true" />
                    ) : (
                      <Circle className="mt-0.5 h-4 w-4 shrink-0 text-subtle" aria-hidden="true" />
                    )}
                    {item.done ? (
                      <span className="text-muted line-through">{item.label}</span>
                    ) : (
                      <Link href={item.href} className="underline-offset-4 hover:underline">
                        {item.label}
                      </Link>
                    )}
                    <span className="sr-only">{item.done ? "(fait)" : "(à faire)"}</span>
                  </li>
                ))}
              </ul>
            </Panel>
          )}
          <Panel title="Activité récente">
            {data.activity.length ? (
              <ul className="space-y-3">
                {data.activity.map((a) => (
                  <li key={a.id} className="text-sm">
                    <span className="block">{a.summary}</span>
                    <span className="text-xs text-subtle">{formatDateTime(a.createdAt, tz)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">Aucune activité pour le moment.</p>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}
