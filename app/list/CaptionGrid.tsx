"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import CaptionCard from "./CaptionCard";

const PAGE_SIZE = 24;

export default function CaptionGrid() {
  const [page, setPage] = useState(0);
  const [captions, setCaptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userVotes, setUserVotes] = useState<Record<string, number>>({});

  const supabase = createClient();

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        // Load existing votes for the user
        const { data: votes } = await supabase
          .from("caption_votes")
          .select("caption_id, vote_value")
          .eq("profile_id", user.id);
        if (votes) {
          const voteMap: Record<string, number> = {};
          votes.forEach((v: any) => {
            voteMap[v.caption_id] = v.vote_value;
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

  async function handleVote(captionId: string, vote: number) {
    if (!userId) return;

    const previousVote = userVotes[captionId]; // snapshot for rollback

    // 1. Optimistic UI update first
    if (previousVote === vote) {
      setUserVotes((prev) => {
        const updated = { ...prev };
        delete updated[captionId];
        return updated;
      });
    } else {
      setUserVotes((prev) => ({ ...prev, [captionId]: vote }));
    }

    // 2. DB request
    let error: any = null;

    if (previousVote === vote) {
      // Remove vote if clicking the same button
      ({ error } = await supabase
        .from("caption_votes")
        .delete()
        .eq("profile_id", userId)
        .eq("caption_id", captionId));
    } else if (previousVote !== undefined) {
      // Update existing vote
      ({ error } = await supabase
        .from("caption_votes")
        .update({ vote_value: vote })
        .eq("profile_id", userId)
        .eq("caption_id", captionId));
    } else {
      // Insert new vote
      ({ error } = await supabase
        .from("caption_votes")
        .insert({ profile_id: userId, caption_id: captionId, vote_value: vote }));
    }

    // 3. Rollback UI on failure
    if (error) {
      setUserVotes((prev) => {
        const updated = { ...prev };
        if (previousVote === undefined) {
          delete updated[captionId];
        } else {
          updated[captionId] = previousVote;
        }
        return updated;
      });
      console.error("Vote failed:", error.message);
    }
  }

  return (
    <main
      style={{
        padding: "48px 40px",
        maxWidth: 1280,
        margin: "0 auto",
      }}
    >
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        style={{ marginBottom: 40 }}
      >
        <h1
          style={{
            fontSize: 40,
            fontWeight: 600,
            marginBottom: 8,
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
          }}
        >
          Captions
        </h1>
        <p style={{ fontSize: 15, color: "#6b7280", lineHeight: 1.6, margin: 0 }}>
          Community-generated captions, ranked by votes.
        </p>
      </motion.div>

      {/* Caption grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
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

      {/* Load more button */}
      <div style={{ textAlign: "center", marginTop: 48 }}>
        <button
          onClick={loadMore}
          disabled={loading}
          style={{
            padding: "12px 32px",
            borderRadius: 10,
            border: "1px solid #374151",
            background: "transparent",
            color: loading ? "#4b5563" : "#9ca3af",
            fontSize: 14,
            cursor: loading ? "not-allowed" : "pointer",
            transition: "border-color 0.15s, color 0.15s",
          }}
        >
          {loading ? "Loading…" : "Load more"}
        </button>
      </div>
    </main>
  );
}
