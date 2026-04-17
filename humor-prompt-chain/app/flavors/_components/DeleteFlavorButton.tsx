"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";

export default function DeleteFlavorButton({ id, slug }: { id: string | number; slug: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => setMounted(true), []);

  async function handleDelete() {
    setLoading(true);
    await fetch(`/api/flavors/${id}`, { method: "DELETE" });
    setLoading(false);
    setOpen(false);
    router.refresh();
  }

  if (!mounted) return (
    <button
      className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold"
      style={{ background: "rgba(239,68,68,0.07)", color: "var(--danger)", border: "1px solid rgba(239,68,68,0.25)", whiteSpace: "nowrap" }}
    >
      🗑 Delete
    </button>
  );

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title={`Delete ${slug}`}
        className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-80 active:scale-95"
        style={{ background: "rgba(239,68,68,0.07)", color: "var(--danger)", border: "1px solid rgba(239,68,68,0.25)", whiteSpace: "nowrap" }}
      >
        🗑 Delete
      </button>

      {open && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div
            className="w-full max-w-sm rounded-xl p-6 animate-fade-up"
            style={{ backgroundColor: "var(--bg-card)", border: "1px solid rgba(239,68,68,0.4)" }}
          >
            {/* Icon + Title */}
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

            {/* Warning message */}
            <div
              className="rounded-xl px-4 py-3 mb-5"
              style={{ background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.18)" }}
            >
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                Are you sure you want to delete{" "}
                <span className="font-mono font-bold" style={{ color: "var(--danger)" }}>
                  {slug}
                </span>
                ? All steps in this flavor will also be permanently deleted.
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-mono transition-all hover:opacity-80"
                style={{ border: "1px solid var(--border)", color: "var(--text-secondary)", background: "transparent" }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)", color: "#fff" }}
              >
                {loading ? "Deleting…" : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
