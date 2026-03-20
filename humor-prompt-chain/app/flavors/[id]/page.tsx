import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import FlavorEditor from "./_components/FlavorEditor";
import StepList from "./_components/StepList";
import TestFlavor from "./_components/TestFlavor";
import FlavorCaptions from "./_components/FlavorCaptions";

export default async function FlavorDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab = "steps" } = await searchParams;

  // Auth guard
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("is_superadmin, is_matrix_admin")
    .eq("id", user.id)
    .single();
  if (!profile?.is_superadmin && !profile?.is_matrix_admin) redirect("/login?error=unauthorized");

  // Load flavor
  const { data: flavor } = await admin
    .from("humor_flavors")
    .select("id, slug, description, created_datetime_utc")
    .eq("id", id)
    .single();

  if (!flavor) notFound();

  // Load steps
  const { data: steps } = await admin
    .from("humor_flavor_steps")
    .select("id, description, order_by, llm_system_prompt, llm_user_prompt, llm_temperature, humor_flavor_id")
    .eq("humor_flavor_id", id)
    .order("order_by");

  const TABS = ["steps", "test", "captions"];

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg-base)" }}>
      <main className="max-w-5xl mx-auto px-8 py-10">
        {/* Back */}
        <Link
          href="/flavors"
          className="inline-flex items-center gap-1.5 text-sm font-mono mb-6 hover:opacity-70 transition-opacity"
          style={{ color: "var(--text-muted)" }}
        >
          ← All Flavors
        </Link>

        {/* Flavor header */}
        <div className="mb-6 animate-fade-up">
          <FlavorEditor flavor={flavor} />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 p-1 rounded-lg w-fit animate-fade-up" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)" }}>
          {TABS.map((t) => (
            <Link
              key={t}
              href={`/flavors/${id}?tab=${t}`}
              className="px-4 py-1.5 rounded-md text-sm font-mono capitalize transition-all"
              style={
                tab === t
                  ? { background: "linear-gradient(135deg, #f59e0b, #f97316)", color: "#0f172a", fontWeight: "600" }
                  : { color: "var(--text-secondary)", background: "transparent" }
              }
            >
              {t}
            </Link>
          ))}
        </div>

        {/* Tab content */}
        <div className="animate-fade-up">
          {tab === "steps" && (
            <StepList steps={steps ?? []} flavorId={id} />
          )}
          {tab === "test" && (
            <TestFlavor flavorId={id} flavorSlug={flavor.slug} />
          )}
          {tab === "captions" && (
            <FlavorCaptions flavorId={id} />
          )}
        </div>
      </main>
    </div>
  );
}
