"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DuplicateFlavorButton({
  id,
  slug,
}: {
  id: string;
  slug: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleDuplicate() {
    if (loading) return;
    setLoading(true);

    const res = await fetch(`/api/flavors/${id}/duplicate`, { method: "POST" });
    const data = await res.json();

    setLoading(false);

    if (!res.ok) {
      alert(data.error || "Failed to duplicate flavor");
      return;
    }

    setDone(true);
    setTimeout(() => setDone(false), 2000);
    router.refresh();
  }

  return (
    <button
      onClick={handleDuplicate}
      disabled={loading}
      title={`Duplicate "${slug}"`}
      className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-mono font-semibold transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
      style={{
        border: "1px solid var(--border-accent)",
        color: done ? "#34d399" : "var(--accent)",
        background: done
          ? "rgba(52,211,153,0.08)"
          : "rgba(245,158,11,0.07)",
      }}
    >
      {loading ? (
        <>
          <span
            style={{
              display: "inline-block",
              animation: "spin 0.7s linear infinite",
            }}
          >
            ⟳
          </span>
          Copying…
        </>
      ) : done ? (
        <>✓ Copied!</>
      ) : (
        <>⧉ Duplicate</>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </button>
  );
}
