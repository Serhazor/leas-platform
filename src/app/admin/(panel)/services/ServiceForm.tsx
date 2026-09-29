"use client";

import { useState } from "react";
import { AdminForm } from "@/components/admin/AdminForm";
import { DeleteButton } from "@/components/admin/ActionButtons";
import { ACheck, ACounted, ASelect, AText, ATextArea } from "@/components/admin/fields";
import { GalleryField, ImageField, type PickedImage } from "@/components/admin/ImageField";
import { Panel } from "@/components/admin/Panel";
import { SERVICE_ICONS } from "@/components/ui/icons";
import { deleteService, saveService } from "@/lib/actions/admin/services";
import { FIELD_HELP } from "@/lib/content/registry";
import { centsToInput, slugify } from "@/lib/format";

export interface ServiceFormValues {
  id?: string;
  title: string;
  slug: string;
  categoryId: string | null;
  shortDescription: string;
  description: string;
  icon: string;
  image: PickedImage | null;
  gallery: PickedImage[];
  priceCents: number | null;
  priceFrom: boolean;
  priceNote: string;
  showPrice: boolean;
  ctaLabel: string;
  isActive: boolean;
  isComingSoon: boolean;
  isFeatured: boolean;
  bookingEnabled: boolean;
  requiresAddress: boolean;
  durationMinutes: number | null;
  seoTitle: string;
  seoDescription: string;
  bookingCount?: number;
}

export function ServiceForm({
  values,
  categories,
  defaultDuration,
}: {
  values: ServiceFormValues;
  categories: { id: string; name: string }[];
  defaultDuration: number;
}) {
  const isNew = !values.id;
  const [slug, setSlug] = useState(values.slug);
  const [slugTouched, setSlugTouched] = useState(!isNew);

  return (
    <AdminForm
      action={saveService}
      submitLabel={isNew ? "Créer le service" : "Enregistrer"}
      secondaryActions={
        !isNew && values.id ? (
          <DeleteButton
            id={values.id}
            action={deleteService}
            title="Supprimer ce service ?"
            description={
              <>
                Le service disparaîtra définitivement du site.
                {values.bookingCount ? ` Les ${values.bookingCount} réservation(s) existante(s) seront conservées.` : ""} Pour le retirer temporairement,
                décochez plutôt « Afficher sur le site ».
              </>
            }
          />
        ) : null
      }
    >
      <input type="hidden" name="id" value={values.id ?? ""} />
      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <Panel title="Présentation">
            <div className="space-y-5">
              <AText
                name="title"
                label="Nom du service"
                defaultValue={values.title}
                required
                onChange={(e) => !slugTouched && setSlug(slugify(e.target.value))}
              />
              <ASelect name="categoryId" label="Catégorie" defaultValue={values.categoryId ?? ""}>
                <option value="">Sans catégorie</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </ASelect>
              <ATextArea name="shortDescription" label="Description courte" rows={3} defaultValue={values.shortDescription} hint="Affichée sur les cartes de services (1 à 2 phrases)." optional />
              <ATextArea name="description" label="Description complète" rows={14} defaultValue={values.description} hint={FIELD_HELP.body} optional />
            </div>
          </Panel>

          <Panel title="Images">
            <div className="space-y-6">
              <ImageField name="imageId" label="Image principale" initial={values.image} aspect="3/2" />
              <GalleryField name="gallery" label="Galerie (facultatif)" initial={values.gallery} />
              <ASelect name="icon" label="Icône (affichée si aucune image)" defaultValue={values.icon}>
                <option value="">Aucune</option>
                {Object.entries(SERVICE_ICONS).map(([key, { label }]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </ASelect>
            </div>
          </Panel>

          <Panel title="Référencement (Google)" description="Facultatif : le nom et la description courte sont utilisés par défaut.">
            <div className="space-y-5">
              <div>
                <AText
                  name="slug"
                  label="Adresse de la page"
                  value={slug}
                  onChange={(e) => {
                    setSlug(e.target.value);
                    setSlugTouched(true);
                  }}
                  hint={`Aperçu : /services/${slugify(slug) || "…"}`}
                />
              </div>
              <ACounted name="seoTitle" label="Titre pour Google" max={60} defaultValue={values.seoTitle} optional />
              <ACounted name="seoDescription" label="Description pour Google" max={160} multiline defaultValue={values.seoDescription} optional />
            </div>
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="Affichage">
            <div className="space-y-4">
              <ACheck name="isActive" label="Afficher sur le site" defaultChecked={values.isActive} />
              <ACheck name="isFeatured" label="Afficher sur la page d'accueil" defaultChecked={values.isFeatured} />
              <ACheck name="isComingSoon" label="Marquer « Bientôt disponible »" defaultChecked={values.isComingSoon} hint="Le service est présenté mais ne peut pas être réservé." />
            </div>
          </Panel>

          <Panel title="Réservation">
            <div className="space-y-4">
              <ACheck name="bookingEnabled" label="Réservation en ligne possible" defaultChecked={values.bookingEnabled} />
              <ACheck name="requiresAddress" label="Demander l'adresse de l'intervention" defaultChecked={values.requiresAddress} hint="À décocher pour un rendez-vous téléphonique ou en visioconférence." />
              <AText
                name="durationMinutes"
                type="number"
                inputMode="numeric"
                min={15}
                max={600}
                step={15}
                label="Durée du rendez-vous (minutes)"
                defaultValue={String(values.durationMinutes ?? defaultDuration)}
              />
              <AText name="ctaLabel" label="Texte du bouton" defaultValue={values.ctaLabel} placeholder="Réserver ce service" optional />
            </div>
          </Panel>

          <Panel title="Tarif">
            <div className="space-y-4">
              <AText name="price" label="Prix (€)" inputMode="decimal" defaultValue={centsToInput(values.priceCents)} placeholder="Ex. : 150" optional />
              <ACheck name="priceFrom" label="Afficher « À partir de »" defaultChecked={values.priceFrom} />
              <AText name="priceNote" label="Précision" defaultValue={values.priceNote} placeholder="Ex. : HT, TTC, par logement" optional />
              <ACheck name="showPrice" label="Afficher le prix sur le site" defaultChecked={values.showPrice} />
            </div>
          </Panel>
        </div>
      </div>
    </AdminForm>
  );
}
