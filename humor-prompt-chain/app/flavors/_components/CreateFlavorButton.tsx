"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateFlavorButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!slug.trim()) return;
    setLoading(true);
    setError("");

    const res = await fetch("/api/flavors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: slug.trim(), description: description.trim() }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Failed to create flavor");
      setLoading(false);
      return;
    }

    // Navigate directly to the new flavor — more reliable than router.refresh()
    router.push(`/flavors/${data.id}`);
  }

  function handleClose() {
    setOpen(false);
    setSlug("");
    setDescription("");
    setError("");
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90 active:scale-95"
        style={{ background: "linear-gradient(135deg, #f59e0b, #f97316)", color: "#0f172a" }}
      >
        + New Flavor
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
        >
          <div
            className="w-full max-w-md rounded-2xl overflow-hidden animate-fade-up"
            style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-accent)" }}
          >
            {/* Modal header */}
            <div
              className="px-6 py-5"
              style={{
                background: "linear-gradient(135deg, rgba(245,158,11,0.1), rgba(249,115,22,0.05))",
                borderBottom: "1px solid var(--border-accent)",
              }}
            >
              <p className="text-xs font-mono uppercase tracking-widest mb-1" style={{ color: "var(--accent)" }}>
                New Flavor
              </p>
              <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                Create a Humor Flavor
              </h2>
              <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                A flavor is a named pipeline of LLM steps.
              </p>
            </div>

            {/* Modal body */}
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
                  Slug *
                </label>
                <input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-"))}
                  placeholder="e.g. dry-sarcasm"
                  required
                  autoFocus
                  className="w-full px-4 py-3 rounded-xl text-sm font-mono outline-none transition-all"
                  style={{
                    backgroundColor: "var(--bg-base)",
                    border: "1px solid var(--border)",
                    color: "var(--text-primary)",
                  }}
                  onFocus={(e) => { (e.target as HTMLInputElement).style.border = "1px solid var(--border-accent)"; }}
                  onBlur={(e) => { (e.target as HTMLInputElement).style.border = "1px solid var(--border)"; }}
                />
                {slug && (
                  <p className="text-xs font-mono mt-1.5" style={{ color: "var(--accent)" }}>
                    → {slug}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What makes this humor flavor unique?"
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none transition-all"
                  style={{
                    backgroundColor: "var(--bg-base)",
                    border: "1px solid var(--border)",
                    color: "var(--text-primary)",
                  }}
                  onFocus={(e) => { (e.target as HTMLTextAreaElement).style.border = "1px solid var(--border-accent)"; }}
                  onBlur={(e) => { (e.target as HTMLTextAreaElement).style.border = "1px solid var(--border)"; }}
                />
              </div>

              {error && (
                <div
                  className="rounded-xl px-4 py-3 text-sm"
                  style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "var(--danger)" }}
                >
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 py-3 rounded-xl text-sm font-mono transition-all hover:opacity-80"
                  style={{ border: "1px solid var(--border)", color: "var(--text-secondary)", backgroundColor: "transparent" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !slug.trim()}
                  className="flex-1 py-3 rounded-xl text-sm font-bold transition-all hover:opacity-90 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: "linear-gradient(135deg, #f59e0b, #f97316)", color: "#0f172a" }}
                >
                  {loading ? "Creating…" : "Create & Open →"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
