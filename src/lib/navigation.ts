/** Main public navigation (French labels). */
export const MAIN_NAV = [
  { href: "/", label: "Accueil" },
  { href: "/services", label: "Services" },
  { href: "/comment-ca-marche", label: "Comment ça marche" },
  { href: "/a-propos", label: "À propos" },
  { href: "/questions-frequentes", label: "FAQ" },
  { href: "/contact", label: "Contact" },
] as const;

export const LEGAL_NAV = [
  { href: "/mentions-legales", label: "Mentions légales" },
  { href: "/politique-de-confidentialite", label: "Politique de confidentialité" },
  { href: "/politique-cookies", label: "Cookies" },
] as const;

export const BOOKING_CTA = { href: "/reservation", label: "Réserver un service" } as const;
