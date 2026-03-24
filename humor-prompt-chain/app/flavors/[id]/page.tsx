import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import FlavorEditor from "./_components/FlavorEditor";
import StepList from "./_components/StepList";
import PipelineRunner from "./_components/PipelineRunner";

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
    .select("id, name, description, created_datetime_utc")
    .eq("id", id)
    .single();
  if (!flavor) notFound();

  const { data: steps } = await admin
    .from("humor_flavor_steps")
    .select(
      "id, description, order_by, llm_system_prompt, llm_user_prompt, llm_temperature, humor_flavor_id, humor_flavor_step_type_id, llm_model_id, llm_input_type_id, llm_output_type_id"
    )
    .eq("humor_flavor_id", id)
    .order("order_by");

  const sortedSteps = steps ?? [];

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg-base)" }}>
      <main className="max-w-4xl mx-auto px-8 py-12">

        {/* Back */}
        <Link
          href="/flavors"
          className="inline-flex items-center gap-1.5 text-xs font-mono mb-8 hover:opacity-60 transition-opacity"
          style={{ color: "var(--text-muted)" }}
        >
          ← All Flavors
        </Link>

        {/* Flavor header */}
        <div className="mb-8 animate-fade-up">
          <FlavorEditor flavor={flavor} />
        </div>

        {/* ── RUN PIPELINE — Primary focus ── */}
        <div className="mb-12 animate-fade-up" style={{ animationDelay: "60ms" }}>
          <PipelineRunner flavorId={id} flavorSlug={flavor.name} steps={sortedSteps} />
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
        <div className="animate-fade-up" style={{ animationDelay: "100ms" }}>
          <StepList steps={sortedSteps} flavorId={id} />
        </div>
      </main>
    </div>
  );
}
