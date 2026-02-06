"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import CaptionCard from "./CaptionCard";

const PAGE_SIZE = 24;

export default function CaptionGrid() {
  const [page, setPage] = useState(0);
  const [captions, setCaptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadMore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadMore() {
    if (loading) return;
    setLoading(true);

    const { data, error } = await supabase
      .from("captions")
      .select(`
        id,
        content,
        like_count,
        images (
          url
        )
      `)
      .eq("is_public", true)
      .order("created_datetime_utc", { ascending: false })
      .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

    if (!error && data) {
      setCaptions((prev) => [...prev, ...data]);
      setPage((p) => p + 1);
    }

    setLoading(false);
  }

  return (
    <main style={{ padding: 40 }}>
      <h1 style={{ fontSize: 32, marginBottom: 24 }}>Captions</h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: 20,
        }}
      >
        {captions.map((c, idx) => (
          <CaptionCard
            key={`${c.id}-${idx}`}
            imageUrl={c.images?.url}
            content={c.content}
            likes={c.like_count}
          />
        ))}
      </div>

      <div style={{ textAlign: "center", marginTop: 40 }}>
        <button
          onClick={loadMore}
          disabled={loading}
          style={{
            padding: "12px 24px",
            borderRadius: 20,
            border: "none",
            cursor: "pointer",
            fontSize: 16,
          }}
        >
          {loading ? "Loading..." : "View more"}
        </button>
      </div>
    </main>
  );
}
