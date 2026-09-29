import type { Metadata } from "next";
import type { PublicSettings, ResolvedImage } from "@/lib/data/public";
import { siteUrl } from "@/lib/site-url";

interface SeoInput {
  settings: PublicSettings | null;
  path: string;
  title?: string;
  description?: string;
  image?: ResolvedImage | null;
  /** Use the title as-is (no " | Entreprise" suffix). */
  absoluteTitle?: boolean;
  noIndex?: boolean;
  type?: "website" | "article";
}

function absoluteUrl(url: string) {
  return url.startsWith("http") ? url : siteUrl(url);
}

export function buildMetadata({ settings, path, title, description, image, absoluteTitle, noIndex, type = "website" }: SeoInput): Metadata {
  const company = settings?.companyName || "";
  const finalTitle = title || settings?.seoTitle || company;
  const finalDescription = description || settings?.seoDescription || "";
  const ogImage = image ?? settings?.ogImage ?? null;
  const fullTitle = absoluteTitle || !company || finalTitle.includes(company) ? finalTitle : `${finalTitle} | ${company}`;

  return {
    title: { absolute: fullTitle },
    description: finalDescription,
    alternates: { canonical: path },
    robots: noIndex ? { index: false, follow: false } : undefined,
    openGraph: {
      type,
      locale: "fr_FR",
      url: path,
      siteName: company || undefined,
      title: fullTitle,
      description: finalDescription,
      images: ogImage
        ? [{ url: absoluteUrl(ogImage.url), width: ogImage.width, height: ogImage.height, alt: ogImage.alt }]
        : undefined,
    },
    twitter: {
      card: ogImage ? "summary_large_image" : "summary",
      title: fullTitle,
      description: finalDescription,
      images: ogImage ? [absoluteUrl(ogImage.url)] : undefined,
    },
  };
}

/** schema.org ProfessionalService describing the business. */
export function businessJsonLd(settings: PublicSettings | null) {
  if (!settings) return null;
  const sameAs = [settings.linkedinUrl, settings.instagramUrl, settings.facebookUrl].filter(Boolean);
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "@id": siteUrl("/#organisation"),
    name: settings.companyName,
    description: settings.seoDescription || settings.tagline,
    url: siteUrl("/"),
    inLanguage: "fr-FR",
  };
  if (settings.email) data.email = settings.email;
  if (settings.phone) data.telephone = settings.phone;
  if (settings.logo) data.logo = absoluteUrl(settings.logo.url);
  if (settings.ogImage) data.image = absoluteUrl(settings.ogImage.url);
  if (sameAs.length) data.sameAs = sameAs;
  if (settings.serviceArea) data.areaServed = settings.serviceArea;
  if (settings.city) {
    data.address = {
      "@type": "PostalAddress",
      ...(settings.showAddress && settings.addressLine ? { streetAddress: settings.addressLine } : {}),
      ...(settings.showAddress && settings.postalCode ? { postalCode: settings.postalCode } : {}),
      addressLocality: settings.city,
      addressCountry: "FR",
    };
  }
  return data;
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: siteUrl(item.path),
    })),
  };
}

export function faqJsonLd(faqs: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };
}
