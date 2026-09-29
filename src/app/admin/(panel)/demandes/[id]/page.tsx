import { Mail, Phone } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EnquiryStatusBadge } from "@/components/admin/BookingBits";
import { AdminPageHeader, Panel } from "@/components/admin/Panel";
import { requireAdmin } from "@/lib/auth/session";
import { getAdminSettings, getEnquiry } from "@/lib/data/admin";
import { formatPhone, fullName, phoneHref } from "@/lib/format";
import { formatDateTime } from "@/lib/time";
import { EnquiryForm } from "./EnquiryForm";

export const metadata: Metadata = { title: "Demande de contact" };

export default async function EnquiryPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const [e, settings] = await Promise.all([getEnquiry(id), getAdminSettings()]);
  if (!e) notFound();
  const tz = settings?.timezone || "Europe/Paris";

  return (
    <>
      <AdminPageHeader
        back={{ href: "/admin/demandes", label: "Demandes de contact" }}
        title={
          <span className="flex flex-wrap items-center gap-3">
            {e.subject} <EnquiryStatusBadge status={e.status} />
          </span>
        }
        description={`Reçue le ${formatDateTime(e.createdAt, tz)}`}
      />
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Panel title="Message">
          <p className="whitespace-pre-line leading-relaxed">{e.message}</p>
          <div className="mt-6">
            <a
              href={`mailto:${e.email}?subject=${encodeURIComponent(`Re : ${e.subject}`)}`}
              className="inline-flex h-11 items-center gap-2 rounded-md bg-primary px-5 text-sm font-medium text-on-primary"
            >
              <Mail className="h-4 w-4" aria-hidden="true" /> Répondre par e-mail
            </a>
          </div>
        </Panel>
        <div className="space-y-6">
          <Panel title="Expéditeur">
            <p className="font-medium">{fullName(e)}</p>
            {e.company && <p className="text-sm text-muted">{e.company}</p>}
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <a href={`mailto:${e.email}`} className="flex items-center gap-2 text-primary hover:underline">
                  <Mail className="h-4 w-4" aria-hidden="true" /> {e.email}
                </a>
              </li>
              {e.phone && (
                <li>
                  <a href={phoneHref(e.phone)} className="flex items-center gap-2 text-primary hover:underline">
                    <Phone className="h-4 w-4" aria-hidden="true" /> {formatPhone(e.phone)}
                  </a>
                </li>
              )}
            </ul>
          </Panel>
          <Panel title="Suivi">
            <EnquiryForm id={e.id} status={e.status} notes={e.privateNotes} />
          </Panel>
        </div>
      </div>
    </>
  );
}
