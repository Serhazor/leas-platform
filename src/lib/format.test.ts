import { describe, expect, it } from "vitest";
import { formatPhone, formatServicePrice, parsePriceToCents, slugify } from "./format";
import { contrastRatio, readableOn } from "./theme";

describe("format helpers", () => {
  it("slugifies French titles without accents", () => {
    expect(slugify("État des lieux d'entrée")).toBe("etat-des-lieux-d-entree");
    expect(slugify("  Cœur & Âme  ")).toBe("coeur-ame");
  });

  it("parses prices typed the French way", () => {
    expect(parsePriceToCents("149,90")).toBe(14990);
    expect(parsePriceToCents("150 €")).toBe(15000);
    expect(parsePriceToCents("")).toBeNull();
    expect(Number.isNaN(parsePriceToCents("abc"))).toBe(true);
  });

  it("formats prices in euros (fr-FR)", () => {
    const label = formatServicePrice({ priceCents: 15000, priceFrom: true, priceNote: "HT", showPrice: true });
    expect(label?.replace(/\s/g, " ")).toBe("À partir de 150 € HT");
    expect(formatServicePrice({ priceCents: 15000, priceFrom: false, priceNote: "", showPrice: false })).toBeNull();
  });

  it("formats French phone numbers", () => {
    expect(formatPhone("0612345678")).toBe("06 12 34 56 78");
  });
});

describe("theme contrast", () => {
  it("picks a readable text colour", () => {
    expect(readableOn("#2f4b45")).toBe("#ffffff");
    expect(readableOn("#f4efe7")).toBe("#1c2427");
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 0);
  });
});
