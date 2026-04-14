"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteFlavorButton({ id, slug }: { id: string | number; slug: string }) {
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    await fetch(`/api/flavors/${id}`, { method: "DELETE" });
    setLoading(false);
    setConfirm(false);
    router.refresh();
  }

  if (confirm) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>Sure?</span>
        <button
          onClick={handleDelete}
          disabled={loading}
          className="px-3 py-2 rounded-xl text-sm font-semibold font-mono transition-all hover:opacity-90"
          style={{ background: "rgba(239,68,68,0.15)", color: "var(--danger)", border: "1px solid rgba(239,68,68,0.35)" }}
        >
          {loading ? "…" : "Yes"}
        </button>
        <button
          onClick={() => setConfirm(false)}
          className="px-3 py-2 rounded-xl text-sm font-mono transition-all hover:opacity-80"
          style={{ border: "1px solid var(--border)", color: "var(--text-muted)", background: "transparent" }}
        >
          No
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirm(true)}
      title={`Delete ${slug}`}
      className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-80 active:scale-95"
      style={{ background: "rgba(239,68,68,0.07)", color: "var(--danger)", border: "1px solid rgba(239,68,68,0.25)", whiteSpace: "nowrap" }}
    >
      🗑 Delete
    </button>
  );
}
