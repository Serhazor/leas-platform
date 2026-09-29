import type { Metadata } from "next";
import Link from "next/link";
import { ResetPasswordForm } from "../AuthForms";

export const metadata: Metadata = { title: "Nouveau mot de passe" };

export default async function ResetPage({ searchParams }: { searchParams: Promise<{ jeton?: string }> }) {
  const { jeton } = await searchParams;
  if (!jeton) {
    return (
      <div className="space-y-4 text-sm">
        <p>Ce lien est incomplet ou n&apos;est plus valide.</p>
        <Link href="/admin/mot-de-passe-oublie" className="underline underline-offset-4">
          Demander un nouveau lien
        </Link>
      </div>
    );
  }
  return <ResetPasswordForm token={jeton} />;
}
