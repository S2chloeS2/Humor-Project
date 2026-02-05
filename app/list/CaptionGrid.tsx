"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

const PAGE_SIZE = 24;

export default function CaptionGrid() {
  const [page, setPage] = useState(0);
  const [captions, setCaptions] = useState<any[]>([]);

  useEffect(() => {
    loadMore();
  }, []);

  async function loadMore() {
    const { data } = await supabase
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
      .range(
        page * PAGE_SIZE,
        page * PAGE_SIZE + PAGE_SIZE - 1
      );

    if (data) {
      setCaptions((prev) => [...prev, ...data]);
      setPage((p) => p + 1);
    }
  }

  return (
    <main style={{ padding: 40 }}>
      <h1>Captions</h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: 20,
        }}
      >
        {captions.map((c) => (
          <div key={c.id}>
            {c.images?.url && (
              <img
                src={c.images.url}
                style={{ width: "100%", height: 220, objectFit: "cover" }}
              />
            )}
            <p>{c.content}</p>
          </div>
        ))}
      </div>

      <button onClick={loadMore} style={{ marginTop: 32 }}>
        View more
      </button>
    </main>
  );
}
