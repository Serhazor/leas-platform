/**
 * Theme system: brand colours and typography are stored in site settings and applied
 * as CSS custom properties on <html>, so the owner can rebrand without touching code.
 */

export const FONT_PAIRS = {
  classique: { label: "Classique — Cormorant Garamond & Manrope", display: "--font-cormorant", body: "--font-manrope" },
  editorial: { label: "Éditorial — Fraunces & Inter", display: "--font-fraunces", body: "--font-inter" },
  sobre: { label: "Sobre — Lora & Source Sans", display: "--font-lora", body: "--font-source-sans" },
} as const;

export type FontPairKey = keyof typeof FONT_PAIRS;

export function isFontPair(v: string): v is FontPairKey {
  return v in FONT_PAIRS;
}

const HEX = /^#[0-9a-fA-F]{6}$/;

function luminance(hex: string): number {
  const rgb = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = rgb.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

/** Readable text colour (white or ink) to put on top of a background colour. */
export function readableOn(bg: string): string {
  if (!HEX.test(bg)) return "#ffffff";
  return contrastRatio(bg, "#ffffff") >= contrastRatio(bg, "#1c2427") ? "#ffffff" : "#1c2427";
}

export interface ThemeInput {
  colorPrimary: string;
  colorSecondary: string;
  colorAccent: string;
  fontPair: string;
}

export const DEFAULT_THEME: ThemeInput = {
  colorPrimary: "#2f4b45",
  colorSecondary: "#f4efe7",
  colorAccent: "#a8643f",
  fontPair: "classique",
};

/** CSS custom properties for the <html> style attribute. */
export function themeStyle(theme: Partial<ThemeInput> | null | undefined): Record<string, string> {
  const t = { ...DEFAULT_THEME, ...(theme ?? {}) };
  const primary = HEX.test(t.colorPrimary) ? t.colorPrimary : DEFAULT_THEME.colorPrimary;
  const secondary = HEX.test(t.colorSecondary) ? t.colorSecondary : DEFAULT_THEME.colorSecondary;
  const accent = HEX.test(t.colorAccent) ? t.colorAccent : DEFAULT_THEME.colorAccent;
  const pair = FONT_PAIRS[isFontPair(t.fontPair) ? t.fontPair : "classique"];
  return {
    "--brand-primary": primary,
    "--brand-on-primary": readableOn(primary),
    "--brand-secondary": secondary,
    "--brand-on-secondary": readableOn(secondary),
    "--brand-accent": accent,
    "--brand-on-accent": readableOn(accent),
    "--font-display": `var(${pair.display})`,
    "--font-body": `var(${pair.body})`,
  };
}
