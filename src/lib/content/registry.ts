/**
 * Structure of the editable pages.
 *
 * This file only describes *which* fields each page section offers in the admin
 * interface and how they are labelled (in French, in business language).
 * The content itself lives in the database (tables `pages` / `page_sections`).
 */

export type SectionField =
  | "eyebrow"
  | "heading"
  | "subheading"
  | "body"
  | "image"
  | "cta"
  | "cta2"
  | "items";

export type ItemField = "title" | "text" | "image";

export interface SectionDefinition {
  key: string;
  label: string;
  help?: string;
  fields: SectionField[];
  /** Optional per-field label overrides. */
  labels?: Partial<Record<SectionField, string>>;
  itemFields?: ItemField[];
  itemLabel?: string;
  /** Whether the owner may hide the section. */
  canHide?: boolean;
}

export interface PageDefinition {
  key: string;
  path: string;
  name: string;
  description: string;
  sections: SectionDefinition[];
  /** Extra editors displayed on the page editor (managed in their own tables). */
  extras?: ("process_steps" | "faq_link" | "services_link")[];
}

const finalCta: SectionDefinition = {
  key: "final_cta",
  label: "Appel à l'action en bas de page",
  fields: ["heading", "subheading", "cta", "cta2"],
  canHide: true,
};

export const PAGE_DEFINITIONS: PageDefinition[] = [
  {
    key: "accueil",
    path: "/",
    name: "Page d'accueil",
    description: "La première page que découvrent vos visiteurs.",
    extras: ["services_link", "process_steps", "faq_link"],
    sections: [
      {
        key: "hero",
        label: "Bandeau principal",
        help: "Le haut de la page : votre message principal et vos boutons.",
        fields: ["eyebrow", "heading", "subheading", "image", "cta", "cta2"],
        labels: { cta: "Bouton principal", cta2: "Bouton secondaire" },
      },
      {
        key: "intro",
        label: "Présentation",
        fields: ["eyebrow", "heading", "body"],
        canHide: true,
      },
      {
        key: "services",
        label: "Services",
        help: "Les services affichés sont ceux marqués « Afficher sur la page d'accueil » dans Services.",
        fields: ["eyebrow", "heading", "subheading", "cta"],
        canHide: true,
      },
      {
        key: "process",
        label: "Comment ça marche",
        help: "Les étapes se modifient dans la page « Comment ça marche ».",
        fields: ["eyebrow", "heading", "subheading", "cta"],
        canHide: true,
      },
      {
        key: "about",
        label: "À propos",
        fields: ["eyebrow", "heading", "body", "image", "cta"],
        canHide: true,
      },
      {
        key: "why",
        label: "Pourquoi faire appel à nous",
        fields: ["eyebrow", "heading", "items"],
        itemFields: ["title", "text"],
        itemLabel: "Argument",
        canHide: true,
      },
      {
        key: "faq",
        label: "Questions fréquentes",
        help: "Les questions affichées sont celles marquées « Afficher sur la page d'accueil » dans FAQ.",
        fields: ["eyebrow", "heading", "cta"],
        canHide: true,
      },
      finalCta,
    ],
  },
  {
    key: "services",
    path: "/services",
    name: "Services",
    description: "La page qui présente l'ensemble de vos services.",
    extras: ["services_link"],
    sections: [
      { key: "hero", label: "En-tête de page", fields: ["eyebrow", "heading", "subheading"] },
      finalCta,
    ],
  },
  {
    key: "etats-des-lieux",
    path: "/etats-des-lieux",
    name: "États des lieux",
    description: "La page dédiée aux états des lieux d'entrée et de sortie.",
    sections: [
      {
        key: "hero",
        label: "En-tête de page",
        fields: ["eyebrow", "heading", "subheading", "image", "cta", "cta2"],
        labels: { cta: "Bouton principal", cta2: "Bouton secondaire" },
      },
      { key: "entree", label: "État des lieux d'entrée", fields: ["heading", "body", "image"], canHide: true },
      { key: "sortie", label: "État des lieux de sortie", fields: ["heading", "body", "image"], canHide: true },
      {
        key: "professionnels",
        label: "Pour les professionnels de la gestion locative",
        fields: ["eyebrow", "heading", "body", "items"],
        itemFields: ["title", "text"],
        itemLabel: "Point",
        canHide: true,
      },
      {
        key: "locations",
        label: "Types de locations",
        fields: ["heading", "items"],
        itemFields: ["title", "text"],
        itemLabel: "Type de location",
        canHide: true,
      },
      {
        key: "documents",
        label: "Documents remis",
        fields: ["heading", "body"],
        canHide: true,
      },
      finalCta,
    ],
  },
  {
    key: "a-propos",
    path: "/a-propos",
    name: "À propos",
    description: "Votre présentation personnelle et votre parcours.",
    sections: [
      {
        key: "hero",
        label: "Présentation",
        fields: ["eyebrow", "heading", "subheading", "image"],
        labels: { image: "Photo de profil" },
      },
      { key: "biography", label: "Mon parcours", fields: ["heading", "body"], canHide: true },
      { key: "experience", label: "Expérience professionnelle", fields: ["heading", "body"], canHide: true },
      {
        key: "qualifications",
        label: "Formations et qualifications",
        help: "Section masquée automatiquement si le texte est vide.",
        fields: ["heading", "body"],
        canHide: true,
      },
      {
        key: "philosophy",
        label: "Ma façon de travailler",
        fields: ["heading", "body", "items"],
        itemFields: ["title", "text"],
        itemLabel: "Valeur",
        canHide: true,
      },
      {
        key: "gallery",
        label: "Galerie de photos",
        help: "Section masquée automatiquement si aucune photo n'est ajoutée.",
        fields: ["heading", "items"],
        itemFields: ["image", "text"],
        itemLabel: "Photo",
        labels: { items: "Photos" },
        canHide: true,
      },
      finalCta,
    ],
  },
  {
    key: "comment-ca-marche",
    path: "/comment-ca-marche",
    name: "Comment ça marche",
    description: "Les étapes d'une intervention, de la demande au suivi.",
    extras: ["process_steps"],
    sections: [
      { key: "hero", label: "En-tête de page", fields: ["eyebrow", "heading", "subheading"] },
      {
        key: "details",
        label: "Informations complémentaires",
        fields: ["heading", "items"],
        itemFields: ["title", "text"],
        itemLabel: "Information",
        canHide: true,
      },
      finalCta,
    ],
  },
  {
    key: "questions-frequentes",
    path: "/questions-frequentes",
    name: "Questions fréquentes",
    description: "L'en-tête de la page FAQ. Les questions se gèrent dans « FAQ ».",
    extras: ["faq_link"],
    sections: [
      { key: "hero", label: "En-tête de page", fields: ["eyebrow", "heading", "subheading"] },
      finalCta,
    ],
  },
  {
    key: "contact",
    path: "/contact",
    name: "Contact",
    description: "La page de contact. Vos coordonnées se modifient dans Paramètres.",
    sections: [
      { key: "hero", label: "En-tête de page", fields: ["eyebrow", "heading", "subheading"] },
      {
        key: "booking_cta",
        label: "Encadré « Prendre rendez-vous »",
        fields: ["heading", "body", "cta"],
        canHide: true,
      },
    ],
  },
  {
    key: "reservation",
    path: "/reservation",
    name: "Réservation",
    description: "Les textes du parcours de réservation.",
    sections: [
      { key: "hero", label: "En-tête de page", fields: ["eyebrow", "heading", "subheading"] },
      {
        key: "confirmation_request",
        label: "Message après une demande de rendez-vous",
        help: "Affiché lorsque la réservation doit être validée par vos soins.",
        fields: ["heading", "body"],
      },
      {
        key: "confirmation_instant",
        label: "Message après une réservation confirmée",
        help: "Affiché lorsque la réservation est confirmée immédiatement.",
        fields: ["heading", "body"],
      },
      {
        key: "unavailable",
        label: "Message si aucune réservation n'est possible",
        fields: ["heading", "body"],
      },
    ],
  },
  {
    key: "mentions-legales",
    path: "/mentions-legales",
    name: "Mentions légales",
    description: "Les informations sur l'éditeur sont complétées automatiquement depuis Paramètres.",
    sections: [{ key: "content", label: "Contenu", fields: ["heading", "body"] }],
  },
  {
    key: "politique-de-confidentialite",
    path: "/politique-de-confidentialite",
    name: "Politique de confidentialité",
    description: "Comment les données personnelles de vos clients sont traitées.",
    sections: [{ key: "content", label: "Contenu", fields: ["heading", "body"] }],
  },
  {
    key: "politique-cookies",
    path: "/politique-cookies",
    name: "Politique relative aux cookies",
    description: "Information sur les cookies utilisés par le site.",
    sections: [{ key: "content", label: "Contenu", fields: ["heading", "body"] }],
  },
];

export const FIELD_LABELS: Record<SectionField, string> = {
  eyebrow: "Surtitre",
  heading: "Titre",
  subheading: "Texte d'introduction",
  body: "Texte",
  image: "Image",
  cta: "Bouton",
  cta2: "Second bouton",
  items: "Éléments",
};

export const FIELD_HELP: Partial<Record<SectionField, string>> = {
  eyebrow: "Petit texte affiché au-dessus du titre (facultatif).",
  body: "Laissez une ligne vide entre deux paragraphes. Commencez une ligne par « - » pour créer une liste, ou par « ## » pour un intertitre.",
};

export function getPageDefinition(key: string): PageDefinition | undefined {
  return PAGE_DEFINITIONS.find((p) => p.key === key);
}

/** Internal links offered in the admin link picker. */
export const INTERNAL_LINKS: { href: string; label: string }[] = [
  { href: "/reservation", label: "Réservation" },
  { href: "/services", label: "Services" },
  { href: "/etats-des-lieux", label: "États des lieux" },
  { href: "/comment-ca-marche", label: "Comment ça marche" },
  { href: "/a-propos", label: "À propos" },
  { href: "/questions-frequentes", label: "Questions fréquentes" },
  { href: "/contact", label: "Contact" },
  { href: "/", label: "Accueil" },
];
