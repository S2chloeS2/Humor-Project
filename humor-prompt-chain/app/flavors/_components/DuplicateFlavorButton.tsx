"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";

export default function DuplicateFlavorButton({
  id,
  slug,
  description,
}: {
  id: string;
  slug: string;
  description?: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => setMounted(true), []);

  function handleOpen() {
    setNewName(`copy-of-${slug}`);
    setNewDesc(description ? `[Copy] ${description}` : "");
    setError("");
    setOpen(true);
  }

  async function handleDuplicate(e: React.FormEvent) {
    e.preventDefault();
    const finalSlug = newName.trim().toLowerCase().replace(/\s+/g, "-");
    if (!finalSlug) return;

    setLoading(true);
    setError("");

    const res = await fetch(`/api/flavors/${id}/duplicate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: finalSlug, description: newDesc.trim() }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Failed to duplicate flavor");
      return;
    }

    setOpen(false);
    // 새로 만들어진 flavor Studio로 바로 이동
    router.push(`/flavors/${data.id}`);
  }

  if (!mounted) return (
    <button
      className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold"
      style={{ border: "1px solid var(--border-accent)", color: "var(--accent)", background: "rgba(245,158,11,0.07)", whiteSpace: "nowrap" }}
    >
      ⧉ Duplicate
    </button>
  );

  return (
    <>
      <button
        onClick={handleOpen}
        className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90 active:scale-95"
        style={{ border: "1px solid var(--border-accent)", color: "var(--accent)", background: "rgba(245,158,11,0.07)", whiteSpace: "nowrap" }}
      >
        ⧉ Duplicate
      </button>

      {open && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) { setOpen(false); setError(""); } }}
        >
          <div
            className="w-full max-w-md rounded-xl p-6 animate-fade-up"
            style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-accent)" }}
          >
            <div className="mb-5">
              <h2 className="text-lg font-bold mb-1" style={{ color: "var(--text-primary)" }}>
                Duplicate Flavor
              </h2>
              <p className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
                Copying <span style={{ color: "var(--accent)" }}>{slug}</span> and all its steps
              </p>
            </div>

            <form onSubmit={handleDuplicate} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider mb-1.5" style={{ color: "var(--text-muted)" }}>
                  New Name <span className="text-red-400">*</span>
                </label>
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="copy-of-my-flavor"
                  autoFocus
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ backgroundColor: "var(--bg-base)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
                />
                <p className="text-xs mt-1 font-mono" style={{ color: "var(--text-muted)" }}>
                  → {newName.trim().toLowerCase().replace(/\s+/g, "-") || "…"}
                </p>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider mb-1.5" style={{ color: "var(--text-muted)" }}>
                  Description <span className="normal-case font-normal">(optional)</span>
                </label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none"
                  style={{ backgroundColor: "var(--bg-base)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
                />
              </div>

              {error && <p className="text-sm" style={{ color: "var(--danger)" }}>{error}</p>}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => { setOpen(false); setError(""); }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-mono"
                  style={{ border: "1px solid var(--border)", color: "var(--text-secondary)", background: "transparent" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !newName.trim()}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg, #f59e0b, #f97316)", color: "#0f172a" }}
                >
                  {loading ? "Duplicating…" : "⧉ Duplicate & Open"}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
