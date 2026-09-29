import Link from "next/link";

export default function RootNotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-4xl">Page introuvable</h1>
      <p className="text-muted">La page demandée n&apos;existe pas.</p>
      <Link href="/" className="underline underline-offset-4">
        Retour à l&apos;accueil
      </Link>
    </main>
  );
}
