"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Flavor {
  id: string;
  name: string;
  description: string | null;
  created_datetime_utc: string;
}

export default function FlavorEditor({ flavor }: { flavor: Flavor }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(flavor.name);
  const [description, setDescription] = useState(flavor.description ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch(`/api/flavors/${flavor.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), description: description.trim() }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to update flavor");
      setLoading(false);
      return;
    }

    setEditing(false);
    setLoading(false);
    router.refresh();
  }

  if (editing) {
    return (
      <form
        onSubmit={handleSave}
        className="rounded-xl p-6"
        style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-accent)" }}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider mb-1.5" style={{ color: "var(--text-muted)" }}>
              Slug *
            </label>
            <input
              value={name}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
              required
              className="w-full px-3 py-2 rounded-lg text-sm font-mono outline-none"
              style={{ backgroundColor: "var(--bg-base)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
            />
          </div>
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider mb-1.5" style={{ color: "var(--text-muted)" }}>
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none"
              style={{ backgroundColor: "var(--bg-base)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
            />
          </div>
          {error && <p className="text-sm" style={{ color: "var(--danger)" }}>{error}</p>}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => { setEditing(false); setName(flavor.name); setDescription(flavor.description ?? ""); }}
              className="px-4 py-2 rounded-lg text-sm font-mono"
              style={{ border: "1px solid var(--border)", color: "var(--text-secondary)", background: "transparent" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #f59e0b, #f97316)", color: "#0f172a" }}
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </form>
    );
  }

  return (
    <div
      className="rounded-xl p-6 flex items-start justify-between gap-4"
      style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)" }}
    >
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-7 h-7 rounded flex items-center justify-center text-xs"
            style={{ background: "linear-gradient(135deg, #f59e0b, #f97316)" }}
          >
            ◈
          </div>
          <h1 className="text-xl font-bold font-mono" style={{ color: "var(--accent)" }}>
            {flavor.name}
          </h1>
        </div>
        {flavor.description && (
          <p className="text-sm ml-10" style={{ color: "var(--text-secondary)" }}>{flavor.description}</p>
        )}
        <p className="text-xs font-mono mt-2 ml-10" style={{ color: "var(--text-muted)" }}>
          Created {new Date(flavor.created_datetime_utc).toLocaleDateString()}
        </p>
      </div>
      <button
        onClick={() => setEditing(true)}
        className="shrink-0 text-xs px-3 py-1.5 rounded-lg font-mono hover:opacity-80"
        style={{ background: "rgba(245,158,11,0.1)", color: "var(--accent)", border: "1px solid rgba(245,158,11,0.2)" }}
      >
        Edit
      </button>
    </div>
  );
}
