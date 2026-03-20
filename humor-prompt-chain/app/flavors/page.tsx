import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import CreateFlavorButton from "./_components/CreateFlavorButton";
import DeleteFlavorButton from "./_components/DeleteFlavorButton";

export default async function FlavorsPage() {
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

  // Load flavors with step counts
  const { data: flavors } = await admin
    .from("humor_flavors")
    .select("id, slug, description, created_datetime_utc, humor_flavor_steps(count)")
    .order("slug");

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg-base)" }}>
      <main className="max-w-5xl mx-auto px-8 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 animate-fade-up">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                style={{ background: "linear-gradient(135deg, #f59e0b, #f97316)", boxShadow: "0 0 20px rgba(245,158,11,0.4)" }}
              >
                ◈
              </div>
              <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
                Humor Flavors
              </h1>
            </div>
            <p className="text-sm font-mono ml-11" style={{ color: "var(--text-muted)" }}>
              {flavors?.length ?? 0} flavor{flavors?.length !== 1 ? "s" : ""}
            </p>
          </div>
          <CreateFlavorButton />
        </div>

        {/* Empty state */}
        {!flavors?.length ? (
          <div
            className="rounded-xl p-12 text-center animate-fade-up"
            style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)" }}
          >
            <p className="text-4xl mb-3">◈</p>
            <p className="font-semibold mb-1" style={{ color: "var(--text-secondary)" }}>
              No humor flavors yet
            </p>
            <p className="text-sm font-mono" style={{ color: "var(--text-muted)" }}>
              Create your first flavor to get started
            </p>
          </div>
        ) : (
          <div
            className="rounded-xl overflow-hidden animate-fade-up"
            style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)" }}
          >
            <table className="w-full">
              <thead>
                <tr
                  className="text-left text-xs font-mono uppercase tracking-wider"
                  style={{ borderBottom: "1px solid var(--border)", color: "var(--text-muted)" }}
                >
                  <th className="px-6 py-3">Slug</th>
                  <th className="px-6 py-3">Description</th>
                  <th className="px-6 py-3 text-center">Steps</th>
                  <th className="px-6 py-3">Created</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {flavors?.map((f: any) => {
                  const stepCount = f.humor_flavor_steps?.[0]?.count ?? 0;
                  return (
                    <tr
                      key={f.id}
                      style={{ borderBottom: "1px solid var(--border)" }}
                    >
                      <td className="px-6 py-4">
                        <Link
                          href={`/flavors/${f.id}`}
                          className="text-sm font-mono font-semibold hover:underline"
                          style={{ color: "var(--accent)" }}
                        >
                          {f.slug}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-sm max-w-xs" style={{ color: "var(--text-secondary)" }}>
                        {f.description || (
                          <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>
                            No description
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className="inline-block px-2 py-0.5 rounded-full text-xs font-mono font-bold"
                          style={{
                            background: "rgba(245,158,11,0.12)",
                            color: "var(--accent)",
                            border: "1px solid rgba(245,158,11,0.2)",
                          }}
                        >
                          {stepCount}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-mono" style={{ color: "var(--text-muted)" }}>
                        {new Date(f.created_datetime_utc).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/flavors/${f.id}`}
                            className="text-xs px-3 py-1.5 rounded-lg font-mono hover:opacity-80"
                            style={{
                              background: "rgba(245,158,11,0.1)",
                              color: "var(--accent)",
                              border: "1px solid rgba(245,158,11,0.2)",
                            }}
                          >
                            Manage →
                          </Link>
                          <DeleteFlavorButton id={f.id} slug={f.slug} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
