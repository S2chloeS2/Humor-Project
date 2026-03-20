import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import FlavorEditor from "./_components/FlavorEditor";
import StepList from "./_components/StepList";
import PipelineRunner from "./_components/PipelineRunner";

function stepIcon(desc: string | null): string {
  const d = (desc ?? "").toLowerCase();
  if (d.includes("descri") || d.includes("image") || d.includes("vision")) return "👁";
  if (d.includes("funny") || d.includes("joke") || d.includes("humor") || d.includes("absurd")) return "😂";
  if (d.includes("caption") || d.includes("write") || d.includes("generat")) return "✍️";
  if (d.includes("summar") || d.includes("rewrite")) return "📝";
  if (d.includes("tone") || d.includes("style")) return "🎨";
  return "⚙️";
}

export default async function FlavorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

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

  const { data: flavor } = await admin
    .from("humor_flavors")
    .select("id, slug, description, created_datetime_utc")
    .eq("id", id)
    .single();
  if (!flavor) notFound();

  const { data: steps } = await admin
    .from("humor_flavor_steps")
    .select("id, description, order_by, llm_system_prompt, llm_user_prompt, llm_temperature, humor_flavor_id")
    .eq("humor_flavor_id", id)
    .order("order_by");

  const sortedSteps = steps ?? [];

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg-base)" }}>
      <main className="max-w-4xl mx-auto px-8 py-10">

        {/* Back */}
        <Link
          href="/flavors"
          className="inline-flex items-center gap-1.5 text-xs font-mono mb-8 hover:opacity-70 transition-opacity"
          style={{ color: "var(--text-muted)" }}
        >
          ← All Flavors
        </Link>

        {/* Flavor name + edit */}
        <div className="mb-8 animate-fade-up">
          <FlavorEditor flavor={flavor} />
        </div>

        {/* Pipeline overview (horizontal chips) */}
        {sortedSteps.length > 0 && (
          <div
            className="rounded-2xl p-5 mb-8 animate-fade-up"
            style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)" }}
          >
            <p className="text-xs font-mono uppercase tracking-widest mb-4" style={{ color: "var(--text-muted)" }}>
              Pipeline — {sortedSteps.length} step{sortedSteps.length !== 1 ? "s" : ""}
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              {sortedSteps.map((s, i) => (
                <div key={s.id} className="flex items-center gap-2">
                  <div
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm"
                    style={{
                      background: "linear-gradient(135deg, rgba(245,158,11,0.08), rgba(249,115,22,0.04))",
                      border: "1px solid rgba(245,158,11,0.2)",
                    }}
                  >
                    <span className="text-base">{stepIcon(s.description)}</span>
                    <span className="font-mono text-xs" style={{ color: "var(--accent)" }}>{i + 1}</span>
                    <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                      {s.description ?? `Step ${i + 1}`}
                    </span>
                  </div>
                  {i < sortedSteps.length - 1 && (
                    <span className="text-xl" style={{ color: "rgba(245,158,11,0.4)" }}>→</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* RUN PIPELINE */}
        <div className="mb-12 animate-fade-up" style={{ animationDelay: "80ms" }}>
          <PipelineRunner flavorId={id} flavorSlug={flavor.slug} steps={sortedSteps} />
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-8">
          <div className="flex-1 h-px" style={{ backgroundColor: "var(--border)" }} />
          <p className="text-xs font-mono uppercase tracking-widest px-2" style={{ color: "var(--text-muted)" }}>
            Edit Pipeline Steps
          </p>
          <div className="flex-1 h-px" style={{ backgroundColor: "var(--border)" }} />
        </div>

        {/* Step management */}
        <div className="animate-fade-up" style={{ animationDelay: "120ms" }}>
          <StepList steps={sortedSteps} flavorId={id} />
        </div>
      </main>
    </div>
  );
}
