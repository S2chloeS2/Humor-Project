"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import CaptionCard from "./CaptionCard";

const PAGE_SIZE = 24;

export default function CaptionGrid() {
  const [page, setPage] = useState(0);
  const [captions, setCaptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userVotes, setUserVotes] = useState<Record<number, number>>({});

  const supabase = createClient();

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        // Load existing votes for the user
        const { data: votes } = await supabase
          .from("caption_votes")
          .select("caption_id, vote")
          .eq("user_id", user.id);
        if (votes) {
          const voteMap: Record<number, number> = {};
          votes.forEach((v: any) => {
            voteMap[v.caption_id] = v.vote;
          });
          setUserVotes(voteMap);
        }
      }
    }
    init();
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

  async function handleVote(captionId: number, vote: number) {
    if (!userId) return;

    const existingVote = userVotes[captionId];

    if (existingVote === vote) {
      // Remove vote if clicking the same button
      await supabase
        .from("caption_votes")
        .delete()
        .eq("user_id", userId)
        .eq("caption_id", captionId);
      setUserVotes((prev) => {
        const updated = { ...prev };
        delete updated[captionId];
        return updated;
      });
    } else if (existingVote !== undefined) {
      // Update existing vote
      await supabase
        .from("caption_votes")
        .update({ vote })
        .eq("user_id", userId)
        .eq("caption_id", captionId);
      setUserVotes((prev) => ({ ...prev, [captionId]: vote }));
    } else {
      // Insert new vote
      await supabase
        .from("caption_votes")
        .insert({ user_id: userId, caption_id: captionId, vote });
      setUserVotes((prev) => ({ ...prev, [captionId]: vote }));
    }
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
            captionId={c.id}
            imageUrl={c.images?.url}
            content={c.content}
            likes={c.like_count}
            isLoggedIn={!!userId}
            userVote={userVotes[c.id] ?? null}
            onVote={handleVote}
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
