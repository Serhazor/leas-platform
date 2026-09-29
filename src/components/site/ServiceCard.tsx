import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { ServiceIcon } from "@/components/ui/icons";
import type { PublicService } from "@/lib/data/public";
import { formatServicePrice } from "@/lib/format";

export function ServiceCard({ service, headingLevel = "h3" }: { service: PublicService; headingLevel?: "h2" | "h3" }) {
  const H = headingLevel;
  const price = formatServicePrice(service);
  return (
    <article className="group relative flex h-full flex-col border-t border-ink/15 pt-6 transition-colors hover:border-accent">
      {service.image && (
        <div className="relative mb-6 aspect-[3/2] overflow-hidden rounded-[var(--radius-card)] bg-secondary">
          <Image
            src={service.image.url}
            alt={service.image.alt}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
          />
        </div>
      )}
      <div className="flex items-center justify-between gap-3">
        {service.icon && !service.image ? (
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary-soft text-primary">
            <ServiceIcon name={service.icon} />
          </span>
        ) : (
          <span className="text-xs font-medium tracking-wide text-subtle">{service.category?.name}</span>
        )}
        {service.isComingSoon && (
          <span className="rounded-full bg-accent-soft px-2.5 py-1 text-xs font-medium text-accent">Bientôt disponible</span>
        )}
      </div>
      <H className="mt-5 text-2xl sm:text-[1.7rem]">
        <Link href={`/services/${service.slug}`} className="after:absolute after:inset-0 focus-visible:outline-none">
          {service.title}
        </Link>
      </H>
      <p className="mt-3 flex-1 leading-relaxed text-muted">{service.shortDescription}</p>
      <div className="mt-5 flex items-center justify-between gap-3 text-sm">
        {price ? <span className="font-medium text-ink">{price}</span> : <span />}
        <span className="inline-flex items-center gap-1 font-medium text-primary">
          En savoir plus
          <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
        </span>
      </div>
    </article>
  );
}
