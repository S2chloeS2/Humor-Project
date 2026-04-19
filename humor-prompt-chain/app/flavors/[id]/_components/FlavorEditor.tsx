"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";

interface Flavor {
  id: string | number;
  slug: string;
  description: string | null;
  created_datetime_utc: string;
}

export default function FlavorEditor({ flavor }: { flavor: Flavor }) {
  const router = useRouter();
  const [slug, setSlug] = useState(flavor.slug);
  const [description, setDescription] = useState(flavor.description ?? "");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saved, setSaved] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDirty =
    slug.trim() !== flavor.slug ||
    description.trim() !== (flavor.description ?? "");

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!slug.trim()) return;
    setSaving(true);
    setSaveError("");

    const res = await fetch(`/api/flavors/${flavor.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: slug.trim(), description: description.trim() }),
    });

    setSaving(false);

    if (!res.ok) {
      const data = await res.json();
      setSaveError(data.error || "Failed to save");
      return;
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    router.refresh();
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/flavors/${flavor.id}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/flavors");
      } else {
        setDeleting(false);
        setDeleteOpen(false);
        alert("Failed to delete flavor. Please try again.");
      }
    } catch {
      setDeleting(false);
      setDeleteOpen(false);
      alert("Network error. Please check your connection and try again.");
    }
  }

  return (
    <>
      <div
        className="rounded-xl overflow-hidden"
        style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-accent)" }}
      >
        {/* Header band */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: "1px solid var(--border)", background: "rgba(245,158,11,0.04)" }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded flex items-center justify-center text-xs shrink-0"
              style={{ background: "linear-gradient(135deg, #f59e0b, #f97316)" }}
            >
              ◈
            </div>
            <p className="text-xs font-mono uppercase tracking-widest font-semibold" style={{ color: "var(--accent)" }}>
              Flavor Settings
            </p>
          </div>

          {/* Delete button */}
          <button
            onClick={() => setDeleteOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-80"
            style={{ background: "rgba(239,68,68,0.07)", color: "var(--danger)", border: "1px solid rgba(239,68,68,0.22)" }}
          >
            🗑 Delete Flavor
          </button>
        </div>

        {/* Edit form */}
        <form onSubmit={handleSave} className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider mb-1.5" style={{ color: "var(--text-muted)" }}>
                Slug <span className="text-red-400">*</span>
              </label>
              <input
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                required
                className="w-full px-3 py-2 rounded-lg text-sm font-mono outline-none"
                style={{ backgroundColor: "var(--bg-base)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
              />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider mb-1.5" style={{ color: "var(--text-muted)" }}>
                Created
              </label>
              <div
                className="px-3 py-2 rounded-lg text-sm font-mono"
                style={{ backgroundColor: "var(--bg-base)", border: "1px solid var(--border)", color: "var(--text-muted)" }}
              >
                {new Date(flavor.created_datetime_utc).toLocaleDateString()}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider mb-1.5" style={{ color: "var(--text-muted)" }}>
              Description <span className="normal-case font-normal">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="What does this flavor do?"
              className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none"
              style={{ backgroundColor: "var(--bg-base)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
            />
          </div>

          {saveError && <p className="text-xs" style={{ color: "var(--danger)" }}>{saveError}</p>}

          <div className="flex items-center justify-end gap-3">
            {!isDirty && !saved && (
              <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
                No unsaved changes
              </span>
            )}
            {saved && (
              <span className="text-xs font-mono" style={{ color: "#34d399" }}>
                ✓ Saved
              </span>
            )}
            {isDirty && (
              <button
                type="button"
                onClick={() => {
                  setSlug(flavor.slug);
                  setDescription(flavor.description ?? "");
                  setSaveError("");
                }}
                className="px-4 py-2 rounded-xl text-sm font-mono transition-all hover:opacity-80"
                style={{ border: "1px solid var(--border)", color: "var(--text-secondary)", background: "transparent" }}
              >
                Discard
              </button>
            )}
            <button
              type="submit"
              disabled={!isDirty || saving || !slug.trim()}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all hover:opacity-90 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ background: "linear-gradient(135deg, #f59e0b, #f97316)", color: "#0f172a" }}
            >
              {saving ? "Saving…" : "💾 Save Changes"}
            </button>
          </div>
        </form>
      </div>

      {/* Delete modal */}
      {mounted && deleteOpen && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget && !deleting) setDeleteOpen(false); }}
        >
          <div
            className="w-full max-w-sm rounded-xl p-6 animate-fade-up"
            style={{ backgroundColor: "var(--bg-card)", border: "1px solid rgba(239,68,68,0.4)" }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)" }}
              >
                🗑
              </div>
              <div>
                <h2 className="text-base font-bold leading-none mb-1" style={{ color: "var(--text-primary)" }}>
                  Delete Flavor
                </h2>
                <p className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
                  This action cannot be undone
                </p>
              </div>
            </div>

            <div
              className="rounded-xl px-4 py-3 mb-5"
              style={{ background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.18)" }}
            >
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                Are you sure you want to delete{" "}
                <span className="font-mono font-bold" style={{ color: "var(--danger)" }}>
                  {flavor.slug}
                </span>
                ? All steps will also be permanently deleted.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setDeleteOpen(false)}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl text-sm font-mono transition-all hover:opacity-80 disabled:opacity-40"
                style={{ border: "1px solid var(--border)", color: "var(--text-secondary)", background: "transparent" }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)", color: "#fff" }}
              >
                {deleting ? "Deleting…" : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
