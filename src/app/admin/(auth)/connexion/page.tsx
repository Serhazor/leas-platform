import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/auth/session";
import { LoginForm } from "../AuthForms";

export const metadata: Metadata = { title: "Connexion" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ suite?: string }> }) {
  if (await getCurrentAdmin()) redirect("/admin");
  const { suite } = await searchParams;
  return <LoginForm next={suite} />;
}
