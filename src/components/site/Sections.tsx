import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { ButtonLink } from "@/components/ui/Button";
import type { ResolvedSection } from "@/lib/data/public";

export function ContentSection({
  children,
  tone = "default",
  className = "",
  id,
  labelledBy,
}: {
  children: ReactNode;
  tone?: "default" | "soft" | "primary";
  className?: string;
  id?: string;
  labelledBy?: string;
}) {
  const tones = {
    default: "",
    soft: "bg-secondary/55",
    primary: "bg-primary text-on-primary",
  };
  return (
    <section id={id} aria-labelledby={labelledBy} className={`py-16 sm:py-20 lg:py-24 ${tones[tone]} ${className}`}>
      <div className="container-page">{children}</div>
    </section>
  );
}

export function SectionHeading({
  id,
  eyebrow,
  title,
  intro,
  align = "left",
  as: As = "h2",
  className = "",
}: {
  id?: string;
  eyebrow?: string;
  title?: string;
  intro?: string;
  align?: "left" | "center";
  as?: "h1" | "h2";
  className?: string;
}) {
  if (!title && !eyebrow && !intro) return null;
  return (
    <div className={`${align === "center" ? "mx-auto text-center" : ""} max-w-2xl ${className}`}>
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      {title && (
        <As id={id} className={`${eyebrow ? "mt-3" : ""} text-[2rem] sm:text-4xl lg:text-[2.75rem]`}>
          {title}
        </As>
      )}
      {intro && <p className="mt-5 text-[1.05rem] leading-relaxed text-muted sm:text-lg">{intro}</p>}
    </div>
  );
}

/** Header block of inner pages. */
export function PageHeader({
  section,
  fallbackTitle,
  children,
}: {
  section?: ResolvedSection;
  fallbackTitle: string;
  children?: ReactNode;
}) {
  return (
    <section className="border-b border-line/70 bg-secondary/55">
      <div className="container-page py-14 sm:py-18 lg:py-22">
        <div className="max-w-3xl animate-fade-up">
          {section?.eyebrow && <p className="eyebrow">{section.eyebrow}</p>}
          <h1 className={`${section?.eyebrow ? "mt-4" : ""} text-[2.4rem] sm:text-5xl lg:text-[3.6rem]`}>
            {section?.heading || fallbackTitle}
          </h1>
          {section?.subheading && (
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted sm:text-xl">{section.subheading}</p>
          )}
          {children}
        </div>
      </div>
    </section>
  );
}

export function SectionCtas({ section, className = "", light = false }: { section: ResolvedSection; className?: string; light?: boolean }) {
  if (!section.ctaLabel && !section.cta2Label) return null;
  return (
    <div className={`flex flex-col gap-3 sm:flex-row sm:flex-wrap ${className}`}>
      {section.ctaLabel && section.ctaHref && (
        <ButtonLink href={section.ctaHref} size="lg" variant={light ? "light" : "primary"}>
          {section.ctaLabel}
        </ButtonLink>
      )}
      {section.cta2Label && section.cta2Href && (
        <ButtonLink
          href={section.cta2Href}
          size="lg"
          variant="secondary"
          className={light ? "border-white/40 text-on-primary hover:border-white hover:bg-white/10" : ""}
        >
          {section.cta2Label}
        </ButtonLink>
      )}
    </div>
  );
}

export function TextLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="group inline-flex items-center gap-2 text-[0.95rem] font-medium text-primary">
      <span className="link-underline">{children}</span>
      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
    </Link>
  );
}

/** Closing call-to-action band. */
export function CtaBand({ section }: { section?: ResolvedSection }) {
  if (!section || (!section.heading && !section.ctaLabel)) return null;
  return (
    <section aria-labelledby="cta-final" className="bg-primary text-on-primary">
      <div className="container-page py-16 sm:py-20">
        <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr] lg:items-end">
          <div>
            <h2 id="cta-final" className="text-[2rem] sm:text-4xl lg:text-[2.6rem]">
              {section.heading}
            </h2>
            {section.subheading && <p className="mt-4 max-w-xl text-lg leading-relaxed opacity-85">{section.subheading}</p>}
          </div>
          <SectionCtas section={section} light className="lg:justify-end" />
        </div>
      </div>
    </section>
  );
}
