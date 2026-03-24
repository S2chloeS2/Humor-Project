"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";

export default function CreateFlavorButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [rawName, setRawName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => setMounted(true), []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const name = rawName.trim();
    if (!name) return;
    setLoading(true);
    setError("");
    const res = await fetch("/api/flavors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description: description.trim() }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error || "Failed to create flavor"); return; }
    setOpen(false);
    setRawName("");
    setDescription("");
    router.refresh();
  }

  if (!mounted) return (
    <button
      className="px-6 py-3 rounded-xl text-sm font-bold"
      style={{ background: "linear-gradient(135deg, #f59e0b, #f97316)", color: "#0f172a" }}
    >
      + New Flavor
    </button>
  );

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-6 py-3 rounded-xl text-sm font-bold transition-all hover:opacity-90 active:scale-95"
        style={{ background: "linear-gradient(135deg, #f59e0b, #f97316)", color: "#0f172a" }}
      >
        + New Flavor
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
            <h2 className="text-lg font-bold mb-5" style={{ color: "var(--text-primary)" }}>
              New Humor Flavor
            </h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider mb-1.5" style={{ color: "var(--text-muted)" }}>
                  Name <span className="text-red-400">*</span>
                </label>
                <input
                  value={rawName}
                  onChange={(e) => setRawName(e.target.value)}
                  placeholder="My Humor Flavor"
                  autoFocus
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ backgroundColor: "var(--bg-base)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
                />
              </div>
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider mb-1.5" style={{ color: "var(--text-muted)" }}>
                  Description <span className="normal-case font-normal">(optional)</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What kind of humor does this flavor generate?"
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none"
                  style={{ backgroundColor: "var(--bg-base)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
                />
              </div>

              {error && <p className="text-sm" style={{ color: "var(--danger)" }}>{error}</p>}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => { setOpen(false); setError(""); setRawName(""); setDescription(""); }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-mono"
                  style={{ border: "1px solid var(--border)", color: "var(--text-secondary)", background: "transparent" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !rawName.trim()}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg, #f59e0b, #f97316)", color: "#0f172a" }}
                >
                  {loading ? "Creating…" : "Create Flavor"}
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
