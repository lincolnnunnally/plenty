import { cookies } from "next/headers";
import { LineFlow } from "@/components/line-flow";
import { getPantryBySlug, effectivePayMethods } from "@/lib/db/queries";
import { readLang, t } from "@/lib/i18n";
import { pageMeta } from "@/lib/seo";
import { stripeConfigured } from "@/lib/stripe-give";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const pantry = await getPantryBySlug(slug).catch(() => null);
  return pageMeta(
    pantry ? `Check in at ${pantry.name}` : "Pantry line",
    "Register, check in, and we will request a handling donation — not a charge for food. Groceries stay free if you cannot help with handling."
  );
}

export default async function LinePage({
  params,
  searchParams
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ cancelled?: string; pass?: string }>;
}) {
  const { slug } = await params;
  const { cancelled, pass } = await searchParams;
  const pantry = await getPantryBySlug(slug).catch(() => null);
  if (!pantry) notFound();
  const methods = await effectivePayMethods(pantry).catch(() => []);
  const cardLive = await stripeConfigured();
  const lang = readLang((await cookies()).get("plenty_lang")?.value);

  return (
    <main className="shell">
      <p className="eyebrow">Pantry line · {pantry.city || "Vidalia"}</p>
      <h1>{pantry.name}</h1>
      <p className="lede">{t(lang, "lineLede")}</p>
      {cancelled ? <p className="note">Card checkout was cancelled. Nothing was charged. You are still checked in.</p> : null}
      <LineFlow slug={pantry.slug} pantryName={pantry.name} methods={methods} cardLive={cardLive} initialPass={pass} />
    </main>
  );
}
