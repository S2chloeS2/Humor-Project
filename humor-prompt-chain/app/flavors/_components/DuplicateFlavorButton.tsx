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

  async function handleDuplicate() {
    if (loading) return;
    setLoading(true);

    const res = await fetch(`/api/flavors/${id}/duplicate`, { method: "POST" });
    const data = await res.json();

    if (!res.ok) {
      setLoading(false);
      alert(data.error || "Failed to duplicate flavor");
      return;
    }

    // 복사된 새 flavor Studio로 바로 이동
    router.push(`/flavors/${data.id}`);
  }

  return (
    <button
      onClick={handleDuplicate}
      disabled={loading}
      title={`Duplicate "${slug}"`}
      className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
      style={{
        border: "1px solid var(--border-accent)",
        color: "var(--accent)",
        background: "rgba(245,158,11,0.07)",
        whiteSpace: "nowrap",
      }}
    >
      {loading ? (
        <>
          <span style={{ display: "inline-block", animation: "spin 0.7s linear infinite" }}>⟳</span>
          Copying…
        </>
      ) : (
        <>⧉ Duplicate</>
      )}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </button>
  );
}
