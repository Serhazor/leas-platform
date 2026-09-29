import { Suspense } from "react";
import { BookingWizard, type BookableService } from "@/components/site/BookingWizard";
import { PageHeader } from "@/components/site/Sections";
import { ButtonLink } from "@/components/ui/Button";
import { RichText } from "@/components/ui/RichText";
import { pageMetadata } from "@/lib/data/metadata";
import { getPage, getPublicServices, getSettings } from "@/lib/data/public";
import { formatPhone, phoneHref } from "@/lib/format";

export const revalidate = 3600;

export function generateMetadata() {
  return pageMetadata("reservation", "/reservation", "Réserver un service");
}

export default async function ReservationPage() {
  const [page, settings, services] = await Promise.all([getPage("reservation"), getSettings(), getPublicServices()]);
  const s = page?.sections ?? {};
  const bookable: BookableService[] = settings?.bookingEnabled
    ? services
        .filter((x) => x.bookingEnabled && !x.isComingSoon)
        .map((x) => ({
          id: x.id,
          slug: x.slug,
          title: x.title,
          shortDescription: x.shortDescription,
          categoryName: x.category?.name ?? null,
          durationMinutes: x.durationMinutes || settings.defaultDurationMinutes,
          requiresAddress: x.requiresAddress,
        }))
    : [];

  return (
    <>
      <PageHeader section={s.hero} fallbackTitle="Réserver un service" />
      <div className="container-page py-12 sm:py-16">
        {bookable.length > 0 ? (
          <Suspense fallback={<p className="text-muted">Chargement…</p>}>
            <BookingWizard
              services={bookable}
              texts={{
                mode: settings?.bookingMode ?? "request",
                requestHeading: s.confirmation_request?.heading || "Votre demande a bien été envoyée",
                requestBody: s.confirmation_request?.body || "",
                instantHeading: s.confirmation_instant?.heading || "Votre rendez-vous est confirmé",
                instantBody: s.confirmation_instant?.body || "",
              }}
            />
          </Suspense>
        ) : (
          <div className="mx-auto max-w-2xl rounded-[var(--radius-card)] border border-line bg-white p-8 sm:p-10">
            <h2 className="text-3xl">{s.unavailable?.heading || "La réservation en ligne est momentanément indisponible"}</h2>
            <RichText text={s.unavailable?.body ?? ""} className="prose-site mt-4" />
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/contact">Envoyer un message</ButtonLink>
              {settings?.phone && (
                <a href={phoneHref(settings.phone)} className="inline-flex h-11 items-center justify-center rounded-md border border-ink/20 px-5">
                  Appeler le {formatPhone(settings.phone)}
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
