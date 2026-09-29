import Link from "next/link";
import { getSettings } from "@/lib/data/public";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings().catch(() => null);
  return (
    <main className="flex min-h-dvh items-center justify-center bg-secondary/60 px-4 py-12 font-sans">
      <div className="w-full max-w-md">
        <p className="mb-8 text-center">
          <Link href="/" className="font-serif text-3xl text-ink">
            {settings?.companyName || "Administration"}
          </Link>
          <span className="mt-1 block text-sm text-subtle">Espace d&apos;administration</span>
        </p>
        <div className="rounded-lg border border-line bg-white p-6 shadow-sm sm:p-8">{children}</div>
      </div>
    </main>
  );
}
