import { ButtonLink } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="container-page flex min-h-[55vh] flex-col items-start justify-center py-20">
      <p className="eyebrow">Erreur 404</p>
      <h1 className="mt-4 text-4xl sm:text-5xl">Cette page est introuvable</h1>
      <p className="mt-5 max-w-lg text-lg text-muted">
        La page que vous cherchez n&apos;existe pas ou a été déplacée. Vous pouvez revenir à l&apos;accueil ou consulter nos services.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <ButtonLink href="/">Retour à l&apos;accueil</ButtonLink>
        <ButtonLink href="/services" variant="secondary">
          Voir les services
        </ButtonLink>
      </div>
    </div>
  );
}
