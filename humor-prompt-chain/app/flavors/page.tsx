import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import CreateFlavorButton from "./_components/CreateFlavorButton";
import DeleteFlavorButton from "./_components/DeleteFlavorButton";

function stepIcon(desc: string | null): string {
  const d = (desc ?? "").toLowerCase();
  if (d.includes("descri") || d.includes("image") || d.includes("vision")) return "👁";
  if (d.includes("funny") || d.includes("joke") || d.includes("humor") || d.includes("absurd")) return "😂";
  if (d.includes("caption") || d.includes("write") || d.includes("generat")) return "✍️";
  if (d.includes("summar") || d.includes("rewrite")) return "📝";
  if (d.includes("tone") || d.includes("style")) return "🎨";
  return "⚙️";
}

function stepLabel(desc: string | null, order: number): string {
  if (!desc) return `Step ${order}`;
  return desc.length > 16 ? desc.slice(0, 16) + "…" : desc;
}

export default async function FlavorsPage() {
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

  // Fetch steps alongside flavors for pipeline preview
  const { data: flavors } = await admin
    .from("humor_flavors")
    .select("id, slug, description, created_datetime_utc, humor_flavor_steps(id, description, order_by)")
    .order("slug");

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg-base)" }}>
      <main className="max-w-5xl mx-auto px-8 py-10">

        {/* ── Header ─────────────────────────────────────────── */}
        <div className="flex items-end justify-between mb-10 animate-fade-up">
          <div>
            <p className="text-xs font-mono uppercase tracking-widest mb-2" style={{ color: "var(--accent)" }}>
              ⛓ Prompt Chain Studio
            </p>
            <h1 className="text-4xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
              Humor Flavors
            </h1>
            <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
              Each flavor is a pipeline of LLM steps that transforms an image into captions.
            </p>
          </div>
          <CreateFlavorButton />
        </div>

        {/* ── Empty state ─────────────────────────────────────── */}
        {!flavors?.length && (
          <div
            className="rounded-2xl p-16 text-center animate-fade-up"
            style={{ backgroundColor: "var(--bg-card)", border: "2px dashed var(--border-accent)" }}
          >
            <div className="text-5xl mb-4">⛓</div>
            <p className="text-lg font-semibold mb-1" style={{ color: "var(--text-primary)" }}>No flavors yet</p>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Create your first humor flavor to start building prompt chains.
            </p>
          </div>
        )}

        {/* ── Flavor cards ────────────────────────────────────── */}
        <div className="flex flex-col gap-4">
          {flavors?.map((f: any, fi: number) => {
            const steps = [...(f.humor_flavor_steps ?? [])].sort(
              (a: any, b: any) => a.order_by - b.order_by
            );
            const preview = steps.slice(0, 4);
            const extra = steps.length - preview.length;

            return (
              <div
                key={f.id}
                className="rounded-2xl p-6 animate-fade-up transition-all duration-200"
                style={{
                  backgroundColor: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  animationDelay: `${fi * 60}ms`,
                }}
              >
                <div className="flex items-start justify-between gap-6">
                  {/* Left */}
                  <div className="flex-1 min-w-0">

                    {/* Slug + step count badge */}
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-xl font-bold font-mono" style={{ color: "var(--accent)" }}>
                        {f.slug}
                      </span>
                      <span
                        className="text-xs font-mono px-2 py-0.5 rounded-full"
                        style={{
                          background: "rgba(245,158,11,0.1)",
                          color: "var(--accent)",
                          border: "1px solid rgba(245,158,11,0.2)",
                        }}
                      >
                        {steps.length} step{steps.length !== 1 ? "s" : ""}
                      </span>
                    </div>

                    {f.description && (
                      <p className="text-sm mb-3" style={{ color: "var(--text-secondary)" }}>
                        {f.description}
                      </p>
                    )}

                    {/* ── Pipeline visualization ── */}
                    {steps.length > 0 ? (
                      <div className="flex items-center gap-2 flex-wrap mt-3">
                        {preview.map((s: any, i: number) => (
                          <div key={s.id} className="flex items-center gap-2">
                            <div
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs"
                              style={{
                                backgroundColor: "var(--bg-base)",
                                border: "1px solid var(--border)",
                                color: "var(--text-secondary)",
                              }}
                            >
                              <span>{stepIcon(s.description)}</span>
                              <span className="font-mono" style={{ color: "var(--text-muted)" }}>
                                {i + 1}.
                              </span>
                              <span>{stepLabel(s.description, i + 1)}</span>
                            </div>
                            {(i < preview.length - 1 || extra > 0) && (
                              <span className="text-sm" style={{ color: "var(--text-muted)" }}>→</span>
                            )}
                          </div>
                        ))}
                        {extra > 0 && (
                          <div
                            className="px-3 py-1.5 rounded-xl text-xs font-mono"
                            style={{
                              backgroundColor: "var(--bg-base)",
                              border: "1px dashed var(--border)",
                              color: "var(--text-muted)",
                            }}
                          >
                            +{extra} more
                          </div>
                        )}
                      </div>
                    ) : (
                      <div
                        className="flex items-center gap-2 px-4 py-2 rounded-xl w-fit mt-3"
                        style={{
                          border: "2px dashed var(--border)",
                          color: "var(--text-muted)",
                        }}
                      >
                        <span className="text-sm">＋</span>
                        <span className="text-xs">No steps yet — click Manage to add</span>
                      </div>
                    )}
                  </div>

                  {/* Right: actions */}
                  <div className="flex items-center gap-2 shrink-0 pt-1">
                    <Link
                      href={`/flavors/${f.id}`}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-90 active:scale-95"
                      style={{
                        background: "linear-gradient(135deg, #f59e0b, #f97316)",
                        color: "#0f172a",
                      }}
                    >
                      Manage →
                    </Link>
                    <DeleteFlavorButton id={f.id} slug={f.slug} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
