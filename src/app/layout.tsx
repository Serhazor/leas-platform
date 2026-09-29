import type { Metadata, Viewport } from "next";
import type { CSSProperties } from "react";
import { getSettings } from "@/lib/data/public";
import { siteUrl } from "@/lib/site-url";
import { themeStyle } from "@/lib/theme";
import { fontVariables } from "./fonts";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings().catch(() => null);
  const name = settings?.companyName || "Site";
  const favicon = settings?.favicon?.url;
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: settings?.seoTitle || name, template: `%s | ${name}` },
    description: settings?.seoDescription || undefined,
    applicationName: name,
    icons: favicon
      ? { icon: [{ url: favicon }], apple: [{ url: favicon }] }
      : { icon: [{ url: "/favicon.svg", type: "image/svg+xml" }] },
    formatDetection: { telephone: false, email: false, address: false },
  };
}

export async function generateViewport(): Promise<Viewport> {
  const settings = await getSettings().catch(() => null);
  return { themeColor: settings?.colorSecondary || "#f4efe7", width: "device-width", initialScale: 1 };
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const settings = await getSettings().catch(() => null);
  return (
    <html lang="fr" className={fontVariables} style={themeStyle(settings) as CSSProperties}>
      <body>{children}</body>
    </html>
  );
}
