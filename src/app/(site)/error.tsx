"use client";

import { Button, ButtonLink } from "@/components/ui/Button";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="container-page flex min-h-[55vh] flex-col items-start justify-center py-20">
      <p className="eyebrow">Erreur</p>
      <h1 className="mt-4 text-4xl sm:text-5xl">Un problème est survenu</h1>
      <p className="mt-5 max-w-lg text-lg text-muted">
        La page n&apos;a pas pu s&apos;afficher correctement. Merci de réessayer dans quelques instants.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button onClick={() => reset()}>Réessayer</Button>
        <ButtonLink href="/" variant="secondary">
          Retour à l&apos;accueil
        </ButtonLink>
      </div>
    </div>
  );
}
