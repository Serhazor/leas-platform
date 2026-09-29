"use client";

import { useState, useTransition } from "react";
import { AdminForm, useMarkDirty } from "@/components/admin/AdminForm";
import { ACheck, ACounted, ASelect, AText, ATextArea } from "@/components/admin/fields";
import { ImageField, type PickedImage } from "@/components/admin/ImageField";
import { Panel } from "@/components/admin/Panel";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import type { SiteSettings } from "@/db/schema";
import { saveSettings, sendTestEmail } from "@/lib/actions/admin/settings";
import { contrastRatio, FONT_PAIRS } from "@/lib/theme";

type S = SiteSettings & { logo: PickedImage | null; favicon: PickedImage | null; ogImage: PickedImage | null };

export function GeneralSettingsForm({ s }: { s: S }) {
  return (
    <AdminForm action={saveSettings}>
      <input type="hidden" name="section" value="general" />
      <div className="space-y-6">
        <Panel title="Entreprise">
          <div className="grid gap-5 sm:grid-cols-2">
            <AText name="companyName" label="Nom de l'entreprise" defaultValue={s.companyName} required />
            <AText name="ownerName" label="Votre nom (page À propos)" defaultValue={s.ownerName} optional />
            <AText name="tagline" label="Accroche" defaultValue={s.tagline} className="sm:col-span-2" optional hint="Courte phrase affichée dans le pied de page." />
            <ATextArea name="footerText" label="Texte du pied de page" rows={3} defaultValue={s.footerText} className="sm:col-span-2" optional />
          </div>
        </Panel>
        <Panel title="Coordonnées" description="Affichées sur la page Contact et dans le pied de page.">
          <div className="grid gap-5 sm:grid-cols-2">
            <AText name="email" type="email" label="E-mail de contact" defaultValue={s.email} optional />
            <AText name="phone" type="tel" label="Téléphone" defaultValue={s.phone} optional />
            <AText name="addressLine" label="Adresse" defaultValue={s.addressLine} className="sm:col-span-2" optional />
            <AText name="postalCode" label="Code postal" defaultValue={s.postalCode} optional />
            <AText name="city" label="Ville" defaultValue={s.city} optional />
            <ACheck name="showAddress" label="Afficher l'adresse complète sur le site" defaultChecked={s.showAddress} className="sm:col-span-2" hint="Sinon, seule la ville et le secteur d'intervention sont indiqués." />
            <AText name="serviceArea" label="Secteur d'intervention" defaultValue={s.serviceArea} placeholder="Ex. : Lyon et sa métropole" optional />
            <AText name="contactHoursNote" label="Délai ou horaires de réponse" defaultValue={s.contactHoursNote} placeholder="Ex. : Réponse sous 24 h ouvrées" optional />
          </div>
        </Panel>
        <Panel title="Réseaux sociaux" description="Laissez vide pour ne pas afficher le lien.">
          <div className="grid gap-5 sm:grid-cols-3">
            <AText name="linkedinUrl" type="url" label="LinkedIn" defaultValue={s.linkedinUrl} placeholder="https://www.linkedin.com/…" optional />
            <AText name="instagramUrl" type="url" label="Instagram" defaultValue={s.instagramUrl} placeholder="https://www.instagram.com/…" optional />
            <AText name="facebookUrl" type="url" label="Facebook" defaultValue={s.facebookUrl} placeholder="https://www.facebook.com/…" optional />
          </div>
        </Panel>
      </div>
    </AdminForm>
  );
}

function ColorInput({ name, label, value, hint }: { name: string; label: string; value: string; hint: string }) {
  const [color, setColor] = useState(value);
  const markDirty = useMarkDirty();
  return (
    <div>
      <label htmlFor={`c-${name}`} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={/^#[0-9a-f]{6}$/i.test(color) ? color : "#000000"}
          onChange={(e) => {
            setColor(e.target.value);
            markDirty();
          }}
          className="h-11 w-14 cursor-pointer rounded border border-line-strong bg-white p-1"
          aria-label={`${label} : sélecteur`}
        />
        <input id={`c-${name}`} name={name} value={color} onChange={(e) => setColor(e.target.value)} className="field-control w-32 font-mono" maxLength={7} />
      </div>
      <p className="mt-1.5 text-sm text-subtle">{hint}</p>
    </div>
  );
}

export function AppearanceSettingsForm({ s }: { s: S }) {
  const lowContrast = contrastRatio(s.colorPrimary, "#fdfbf8") < 4.5;
  return (
    <AdminForm action={saveSettings}>
      <input type="hidden" name="section" value="apparence" />
      <div className="space-y-6">
        <Panel title="Logo et icône">
          <div className="grid gap-8 md:grid-cols-2">
            <ImageField name="logoId" label="Logo" initial={s.logo} aspect="3/1" hint="Format horizontal conseillé, fond transparent (PNG ou WebP). Sans logo, le nom de l'entreprise est affiché." />
            <ImageField name="faviconId" label="Icône du site (onglet du navigateur)" initial={s.favicon} aspect="1/1" hint="Image carrée d'au moins 512 × 512 px." />
          </div>
        </Panel>
        <Panel title="Couleurs">
          <div className="grid gap-6 sm:grid-cols-3">
            <ColorInput name="colorPrimary" label="Couleur principale" value={s.colorPrimary} hint="Boutons, liens, bandeau final." />
            <ColorInput name="colorSecondary" label="Couleur de fond secondaire" value={s.colorSecondary} hint="Fonds de sections, de préférence très clair." />
            <ColorInput name="colorAccent" label="Couleur d'accent" value={s.colorAccent} hint="Petits détails : surtitres, puces, numéros." />
          </div>
          {lowContrast && (
            <p className="mt-5 rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-900">
              La couleur principale actuelle est peu contrastée sur fond clair : les textes et liens risquent d&apos;être difficiles à lire. Une teinte plus foncée est conseillée.
            </p>
          )}
        </Panel>
        <Panel title="Typographie">
          <fieldset className="grid gap-3 md:grid-cols-3">
            <legend className="sr-only">Association de polices</legend>
            {Object.entries(FONT_PAIRS).map(([key, pair]) => (
              <label key={key} className="flex cursor-pointer gap-3 rounded-md border border-line-strong p-4 has-[:checked]:border-primary has-[:checked]:ring-1 has-[:checked]:ring-primary">
                <input type="radio" name="fontPair" value={key} defaultChecked={s.fontPair === key} className="mt-1 accent-[var(--brand-primary)]" />
                <span>
                  <span className="block text-2xl" style={{ fontFamily: `var(${pair.display})` }}>
                    Titre élégant
                  </span>
                  <span className="mt-1 block text-sm" style={{ fontFamily: `var(${pair.body})` }}>
                    Texte courant, lisible et sobre.
                  </span>
                  <span className="mt-2 block text-xs text-subtle">{pair.label}</span>
                </span>
              </label>
            ))}
          </fieldset>
        </Panel>
      </div>
    </AdminForm>
  );
}

export function BookingSettingsForm({ s }: { s: S }) {
  return (
    <AdminForm action={saveSettings}>
      <input type="hidden" name="section" value="reservations" />
      <div className="space-y-6">
        <Panel title="Réservation en ligne">
          <div className="space-y-5">
            <ACheck name="bookingEnabled" label="Activer la réservation en ligne" defaultChecked={s.bookingEnabled} hint="Si désactivée, les visiteurs sont invités à vous contacter." />
            <fieldset>
              <legend className="mb-2 text-sm font-medium">Mode de réservation</legend>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="flex cursor-pointer gap-3 rounded-md border border-line-strong p-4 has-[:checked]:border-primary has-[:checked]:ring-1 has-[:checked]:ring-primary">
                  <input type="radio" name="bookingMode" value="request" defaultChecked={s.bookingMode === "request"} className="mt-1 accent-[var(--brand-primary)]" />
                  <span>
                    <span className="block font-medium">Demande de rendez-vous</span>
                    <span className="mt-1 block text-sm text-muted">Le client propose un créneau, vous le confirmez ou le refusez. Le créneau est bloqué en attendant.</span>
                  </span>
                </label>
                <label className="flex cursor-pointer gap-3 rounded-md border border-line-strong p-4 has-[:checked]:border-primary has-[:checked]:ring-1 has-[:checked]:ring-primary">
                  <input type="radio" name="bookingMode" value="instant" defaultChecked={s.bookingMode === "instant"} className="mt-1 accent-[var(--brand-primary)]" />
                  <span>
                    <span className="block font-medium">Confirmation immédiate</span>
                    <span className="mt-1 block text-sm text-muted">Le créneau choisi est réservé et confirmé automatiquement.</span>
                  </span>
                </label>
              </div>
            </fieldset>
          </div>
        </Panel>
        <Panel title="Créneaux" description="La durée de chaque service peut être ajustée dans la fiche du service.">
          <div className="grid gap-5 sm:grid-cols-2">
            <AText name="defaultDurationMinutes" type="number" min={15} max={600} step={15} label="Durée par défaut d'un rendez-vous (minutes)" defaultValue={String(s.defaultDurationMinutes)} />
            <AText name="bufferMinutes" type="number" min={0} max={240} step={5} label="Battement entre deux rendez-vous (minutes)" defaultValue={String(s.bufferMinutes)} hint="Temps de trajet ou de préparation." />
            <ASelect name="slotIntervalMinutes" label="Proposer un créneau toutes les" defaultValue={String(s.slotIntervalMinutes)}>
              <option value="15">15 minutes</option>
              <option value="30">30 minutes</option>
              <option value="45">45 minutes</option>
              <option value="60">1 heure</option>
            </ASelect>
            <AText name="minNoticeHours" type="number" min={0} max={720} label="Délai minimum avant un rendez-vous (heures)" defaultValue={String(s.minNoticeHours)} hint="Ex. : 24 = pas de réservation pour le jour même." />
            <AText name="maxAdvanceDays" type="number" min={1} max={365} label="Réservation possible jusqu'à (jours à l'avance)" defaultValue={String(s.maxAdvanceDays)} />
          </div>
        </Panel>
      </div>
    </AdminForm>
  );
}

export function SeoSettingsForm({ s }: { s: S }) {
  return (
    <AdminForm action={saveSettings}>
      <input type="hidden" name="section" value="referencement" />
      <Panel title="Référencement par défaut" description="Utilisé pour la page d'accueil et pour toute page sans réglage spécifique.">
        <div className="space-y-5">
          <ACounted name="seoTitle" label="Titre du site pour Google" max={60} defaultValue={s.seoTitle} />
          <ACounted name="seoDescription" label="Description du site pour Google" max={160} multiline defaultValue={s.seoDescription} />
          <ImageField name="ogImageId" label="Image de partage par défaut (réseaux sociaux)" initial={s.ogImage} aspect="1200/630" hint="Format conseillé : 1200 × 630 px." />
        </div>
      </Panel>
    </AdminForm>
  );
}

export function EmailSettingsForm({ s, providerConfigured }: { s: S; providerConfigured: boolean }) {
  const [pending, start] = useTransition();
  const { notify } = useToast();
  return (
    <div className="space-y-6">
      {!providerConfigured && (
        <p className="rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-900">
          L&apos;envoi d&apos;e-mails n&apos;est pas encore activé sur l&apos;hébergement : les notifications ne sont pas envoyées. La personne qui gère le site doit
          configurer le service d&apos;envoi (voir la documentation technique).
        </p>
      )}
      <AdminForm action={saveSettings}>
        <input type="hidden" name="section" value="emails" />
        <Panel title="Notifications et e-mails envoyés aux clients">
          <div className="space-y-5">
            <AText
              name="notificationEmail"
              type="email"
              label="Adresse qui reçoit les notifications"
              defaultValue={s.notificationEmail}
              hint="Nouvelles réservations et demandes de contact. Si vide, l'e-mail de contact est utilisé."
              optional
            />
            <AText name="emailSenderName" label="Nom de l'expéditeur" defaultValue={s.emailSenderName} placeholder={s.companyName} optional />
            <ATextArea name="emailSignature" label="Signature des e-mails" rows={3} defaultValue={s.emailSignature} optional />
          </div>
        </Panel>
      </AdminForm>
      <Panel title="Tester l'envoi">
        <p className="mb-4 text-sm text-muted">Envoie un e-mail de test à l&apos;adresse de notification.</p>
        <Button
          variant="secondary"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const res = await sendTestEmail();
              notify(res.message ?? "", res.status === "success" ? "success" : "error");
            })
          }
        >
          {pending ? "Envoi…" : "Envoyer un e-mail de test"}
        </Button>
      </Panel>
    </div>
  );
}

export function LegalSettingsForm({ s }: { s: S }) {
  return (
    <AdminForm action={saveSettings}>
      <input type="hidden" name="section" value="legal" />
      <Panel title="Informations légales" description="Affichées automatiquement sur la page Mentions légales. Renseignez celles qui correspondent à votre statut.">
        <div className="grid gap-5 sm:grid-cols-2">
          <AText name="legalName" label="Dénomination ou nom de l'entrepreneur" defaultValue={s.legalName} optional />
          <AText name="legalForm" label="Forme juridique" defaultValue={s.legalForm} placeholder="Ex. : Entrepreneur individuel, SASU…" optional />
          <AText name="siret" label="SIRET" defaultValue={s.siret} inputMode="numeric" optional />
          <AText name="rcs" label="RCS / RM" defaultValue={s.rcs} optional />
          <AText name="vatNumber" label="N° de TVA intracommunautaire" defaultValue={s.vatNumber} optional />
          <AText name="shareCapital" label="Capital social" defaultValue={s.shareCapital} optional />
          <AText name="publicationDirector" label="Directeur·rice de la publication" defaultValue={s.publicationDirector} optional />
          <ATextArea name="hostingInfo" label="Hébergeur" rows={4} defaultValue={s.hostingInfo} className="sm:col-span-2" optional />
        </div>
      </Panel>
    </AdminForm>
  );
}
