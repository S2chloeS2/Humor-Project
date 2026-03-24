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
      <div className="flex items-center gap-1">
        <span className="text-xs font-mono mr-1" style={{ color: "var(--text-muted)" }}>Sure?</span>
        <button
          onClick={handleDelete}
          disabled={loading}
          className="text-xs px-2 py-1 rounded font-mono"
          style={{ background: "rgba(239,68,68,0.15)", color: "var(--danger)", border: "1px solid rgba(239,68,68,0.3)" }}
        >
          {loading ? "..." : "Yes"}
        </button>
        <button
          onClick={() => setConfirm(false)}
          className="text-xs px-2 py-1 rounded font-mono"
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
      className="text-xs px-2.5 py-1.5 rounded-lg font-mono transition-all hover:opacity-80"
      style={{ background: "rgba(239,68,68,0.08)", color: "var(--danger)", border: "1px solid rgba(239,68,68,0.2)" }}
    >
      Delete
    </button>
  );
}
