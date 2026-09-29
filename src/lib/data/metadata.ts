import "server-only";
import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { getPage, getSettings } from "./public";

/** Metadata for a CMS-managed page (editable title/description/image). */
export async function pageMetadata(key: string, path: string, fallbackTitle: string, noIndex = false): Promise<Metadata> {
  const [settings, page] = await Promise.all([getSettings(), getPage(key)]);
  return buildMetadata({
    settings,
    path,
    title: page?.seoTitle || fallbackTitle,
    description: page?.seoDescription,
    image: page?.ogImage,
    noIndex,
  });
}
