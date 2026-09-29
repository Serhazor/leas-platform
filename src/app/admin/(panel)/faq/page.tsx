import type { Metadata } from "next";
import { AdminPageHeader, Panel } from "@/components/admin/Panel";
import { requireAdmin } from "@/lib/auth/session";
import { listFaqs } from "@/lib/data/admin";
import { FaqEditor, NewFaqForm } from "./FaqEditor";

export const metadata: Metadata = { title: "Questions fréquentes" };

export default async function FaqAdminPage() {
  await requireAdmin();
  const faqs = await listFaqs();
  return (
    <>
      <AdminPageHeader title="Questions fréquentes" description="Les questions affichées sur la page FAQ, dans l'ordre ci-dessous." />
      <div className="space-y-3">
        {faqs.map((f, i) => (
          <FaqEditor
            key={f.id}
            faq={{ id: f.id, question: f.question, answer: f.answer, isActive: f.isActive, showOnHome: f.showOnHome }}
            isFirst={i === 0}
            isLast={i === faqs.length - 1}
          />
        ))}
      </div>
      <Panel title="Ajouter une question" className="mt-6">
        <NewFaqForm />
      </Panel>
    </>
  );
}
