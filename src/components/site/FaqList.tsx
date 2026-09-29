import { Plus } from "lucide-react";
import type { Faq } from "@/db/schema";
import { RichText } from "@/components/ui/RichText";

/** Accessible accordion using native <details>: works without JavaScript. */
export function FaqList({ faqs }: { faqs: Faq[] }) {
  if (!faqs.length) return null;
  return (
    <div className="divide-y divide-line border-y border-line">
      {faqs.map((faq) => (
        <details key={faq.id} className="group py-1">
          <summary className="flex cursor-pointer list-none items-start justify-between gap-6 py-5 text-left [&::-webkit-details-marker]:hidden">
            <h3 className="font-sans text-[1.05rem] font-medium text-ink sm:text-lg">{faq.question}</h3>
            <Plus
              className="mt-1 h-5 w-5 shrink-0 text-accent transition-transform duration-300 group-open:rotate-45"
              aria-hidden="true"
            />
          </summary>
          <div className="pr-10 pb-6">
            <RichText text={faq.answer} />
          </div>
        </details>
      ))}
    </div>
  );
}
