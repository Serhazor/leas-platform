"use client";

import { AdminForm } from "@/components/admin/AdminForm";
import { ACheck, ACounted, AText, ATextArea } from "@/components/admin/fields";
import { ImageField, type PickedImage } from "@/components/admin/ImageField";
import { ItemsEditor } from "@/components/admin/ItemsEditor";
import { ButtonFields } from "@/components/admin/LinkField";
import { Panel } from "@/components/admin/Panel";
import { savePage } from "@/lib/actions/admin/content";
import { FIELD_HELP, FIELD_LABELS, getPageDefinition } from "@/lib/content/registry";

export type SectionValues = {
  isVisible: boolean;
  eyebrow: string;
  heading: string;
  subheading: string;
  body: string;
  image: PickedImage | null;
  ctaLabel: string;
  ctaHref: string;
  cta2Label: string;
  cta2Href: string;
  items: { title?: string; text?: string; imageId?: string | null; imageUrl?: string | null }[];
};

export function PageEditor({
  pageKey,
  sections,
  seo,
  extraLinks,
}: {
  pageKey: string;
  sections: Record<string, SectionValues | undefined>;
  seo: { seoTitle: string; seoDescription: string; ogImage: PickedImage | null };
  extraLinks: { href: string; label: string }[];
}) {
  const def = getPageDefinition(pageKey)!;
  const empty: SectionValues = {
    isVisible: true,
    eyebrow: "",
    heading: "",
    subheading: "",
    body: "",
    image: null,
    ctaLabel: "",
    ctaHref: "",
    cta2Label: "",
    cta2Href: "",
    items: [],
  };

  return (
    <AdminForm action={savePage}>
      <input type="hidden" name="pageKey" value={pageKey} />
      <div className="space-y-6">
        {def.sections.map((section, index) => {
          const v = sections[section.key] ?? empty;
          const p = `s.${section.key}`;
          const label = (f: keyof typeof FIELD_LABELS) => section.labels?.[f] ?? FIELD_LABELS[f];
          return (
            <Panel
              key={section.key}
              id={`section-${section.key}`}
              title={
                <span>
                  <span className="mr-2 text-subtle">{index + 1}.</span>
                  {section.label}
                </span>
              }
              description={section.help}
              actions={section.canHide ? <ACheck name={`${p}.visible`} label="Afficher cette section" defaultChecked={v.isVisible} /> : null}
            >
              <div className="space-y-5">
                {section.fields.includes("eyebrow") && (
                  <AText name={`${p}.eyebrow`} label={label("eyebrow")} defaultValue={v.eyebrow} hint={FIELD_HELP.eyebrow} optional />
                )}
                {section.fields.includes("heading") && <AText name={`${p}.heading`} label={label("heading")} defaultValue={v.heading} />}
                {section.fields.includes("subheading") && (
                  <ATextArea name={`${p}.subheading`} label={label("subheading")} rows={3} defaultValue={v.subheading} optional />
                )}
                {section.fields.includes("body") && (
                  <ATextArea
                    name={`${p}.body`}
                    label={label("body")}
                    rows={section.key === "content" ? 22 : 8}
                    defaultValue={v.body}
                    hint={FIELD_HELP.body}
                    optional
                  />
                )}
                {section.fields.includes("image") && (
                  <ImageField name={`${p}.imageId`} label={label("image")} initial={v.image} aspect={section.key === "hero" && pageKey === "a-propos" ? "4/5" : "4/3"} />
                )}
                {section.fields.includes("items") && (
                  <ItemsEditor
                    name={`${p}.items`}
                    label={label("items")}
                    itemLabel={section.itemLabel}
                    fields={section.itemFields ?? ["title", "text"]}
                    initial={v.items}
                  />
                )}
                {section.fields.includes("cta") && (
                  <ButtonFields
                    title={label("cta")}
                    labelName={`${p}.ctaLabel`}
                    hrefName={`${p}.ctaHref`}
                    defaultLabel={v.ctaLabel}
                    defaultHref={v.ctaHref}
                    extraLinks={extraLinks}
                  />
                )}
                {section.fields.includes("cta2") && (
                  <ButtonFields
                    title={label("cta2")}
                    labelName={`${p}.cta2Label`}
                    hrefName={`${p}.cta2Href`}
                    defaultLabel={v.cta2Label}
                    defaultHref={v.cta2Href}
                    extraLinks={extraLinks}
                  />
                )}
              </div>
            </Panel>
          );
        })}

        <Panel title="Référencement (Google et réseaux sociaux)" description="Facultatif : les réglages généraux sont utilisés si ces champs sont vides.">
          <div className="space-y-5">
            <ACounted name="seoTitle" label="Titre de la page pour Google" max={60} defaultValue={seo.seoTitle} optional />
            <ACounted name="seoDescription" label="Description pour Google" max={160} multiline defaultValue={seo.seoDescription} optional />
            <ImageField name="ogImageId" label="Image affichée lors d'un partage (facultatif)" initial={seo.ogImage} aspect="1200/630" />
          </div>
        </Panel>
      </div>
    </AdminForm>
  );
}
