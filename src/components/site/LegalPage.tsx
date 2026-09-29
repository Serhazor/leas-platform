import { RichText } from "@/components/ui/RichText";
import type { PublicSettings, ResolvedPage } from "@/lib/data/public";
import { formatPhone } from "@/lib/format";
import { formatDate } from "@/lib/time";

function Row({ label, value }: { label: string; value?: string }) {
  if (!value?.trim()) return null;
  return (
    <div className="grid gap-1 py-2.5 sm:grid-cols-[14rem_1fr] sm:gap-6">
      <dt className="text-subtle">{label}</dt>
      <dd className="whitespace-pre-line text-ink">{value}</dd>
    </div>
  );
}

export function LegalPage({
  page,
  settings,
  fallbackTitle,
  variant,
}: {
  page: ResolvedPage | null;
  settings: PublicSettings | null;
  fallbackTitle: string;
  variant: "mentions" | "privacy" | "cookies";
}) {
  const content = page?.sections.content;
  const address = settings
    ? [settings.addressLine, [settings.postalCode, settings.city].filter(Boolean).join(" ")].filter(Boolean).join(", ")
    : "";

  return (
    <div className="container-page py-14 sm:py-20">
      <article className="mx-auto max-w-3xl">
        <h1 className="text-[2.4rem] sm:text-5xl">{content?.heading || fallbackTitle}</h1>
        {page && <p className="mt-4 text-sm text-subtle">Dernière mise à jour : {formatDate(page.updatedAt)}</p>}

        {settings && variant === "mentions" && (
          <section aria-labelledby="editeur" className="mt-10">
            <h2 id="editeur" className="text-2xl sm:text-3xl">
              Éditeur du site
            </h2>
            <dl className="mt-4 divide-y divide-line border-y border-line text-[0.95rem]">
              <Row label="Dénomination" value={settings.legalName || settings.companyName} />
              <Row label="Forme juridique" value={settings.legalForm} />
              <Row label="Capital social" value={settings.shareCapital} />
              <Row label="Adresse" value={address} />
              <Row label="SIRET" value={settings.siret} />
              <Row label="RCS / RM" value={settings.rcs} />
              <Row label="N° TVA intracommunautaire" value={settings.vatNumber} />
              <Row label="Directeur·rice de la publication" value={settings.publicationDirector} />
              <Row label="E-mail" value={settings.email} />
              <Row label="Téléphone" value={settings.phone ? formatPhone(settings.phone) : ""} />
            </dl>
            <h2 className="mt-10 text-2xl sm:text-3xl">Hébergement</h2>
            <p className="mt-4 whitespace-pre-line text-muted">{settings.hostingInfo}</p>
          </section>
        )}

        {settings && variant === "privacy" && (
          <section aria-labelledby="responsable" className="mt-10">
            <h2 id="responsable" className="text-2xl sm:text-3xl">
              Responsable du traitement
            </h2>
            <dl className="mt-4 divide-y divide-line border-y border-line text-[0.95rem]">
              <Row label="Responsable" value={settings.legalName || settings.companyName} />
              <Row label="Adresse" value={address} />
              <Row label="Contact" value={settings.email} />
            </dl>
          </section>
        )}

        {content?.body && <RichText text={content.body} className="prose-site mt-10" />}
      </article>
    </div>
  );
}
