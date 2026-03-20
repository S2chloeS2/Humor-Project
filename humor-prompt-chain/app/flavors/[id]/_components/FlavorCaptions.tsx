import { createAdminClient } from "@/lib/supabase/admin";

export default async function FlavorCaptions({ flavorId }: { flavorId: string }) {
  const admin = createAdminClient();

  // Load captions that were generated using this flavor
  const { data: captions } = await admin
    .from("captions")
    .select("id, content, like_count, is_public, created_at, images(url)")
    .eq("humor_flavor_id", flavorId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (!captions || captions.length === 0) {
    return (
      <div
        className="rounded-xl p-10 text-center"
        style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)" }}
      >
        <p className="text-3xl mb-2">▤</p>
        <p className="text-sm font-semibold mb-1" style={{ color: "var(--text-secondary)" }}>
          No captions yet
        </p>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Test this flavor to generate captions
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm font-mono mb-4" style={{ color: "var(--text-muted)" }}>
        {captions.length} caption{captions.length !== 1 ? "s" : ""} generated with this flavor
      </p>
      <div className="space-y-3">
        {captions.map((c: any) => (
          <div
            key={c.id}
            className="rounded-xl p-4 flex items-start gap-4"
            style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)" }}
          >
            {c.images?.url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={c.images.url}
                alt=""
                className="w-14 h-14 object-cover rounded-lg shrink-0"
                style={{ border: "1px solid var(--border)" }}
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm italic mb-1" style={{ color: "var(--text-primary)" }}>
                "{c.content}"
              </p>
              <div className="flex items-center gap-3 text-xs font-mono" style={{ color: "var(--text-muted)" }}>
                <span style={{ color: "var(--accent)" }}>★ {c.like_count ?? 0}</span>
                <span
                  className="px-1.5 py-0.5 rounded-full text-xs"
                  style={
                    c.is_public
                      ? { background: "rgba(34,197,94,0.1)", color: "var(--success)", border: "1px solid rgba(34,197,94,0.2)" }
                      : { background: "rgba(148,163,184,0.1)", color: "var(--text-muted)", border: "1px solid var(--border)" }
                  }
                >
                  {c.is_public ? "public" : "private"}
                </span>
                <span>{new Date(c.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
