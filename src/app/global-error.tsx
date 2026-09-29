"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="fr">
      <body style={{ fontFamily: "system-ui, sans-serif", padding: "3rem 1.5rem", textAlign: "center", color: "#1c2427" }}>
        <h1>Un problème est survenu</h1>
        <p>Le site n&apos;a pas pu s&apos;afficher. Merci de réessayer dans quelques instants.</p>
        <button onClick={() => reset()} style={{ marginTop: "1rem", padding: "0.6rem 1.2rem" }}>
          Réessayer
        </button>
      </body>
    </html>
  );
}
