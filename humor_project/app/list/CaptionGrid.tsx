"use client";

import { useEffect, useRef, useState } from "react";
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
  const [sortBy, setSortBy] = useState<"newest" | "top">("newest");
  const [hasMore, setHasMore] = useState(true);

  const supabase = createClient();
  // Ref to track the current sort inside the async loadMore closure
  const sortByRef = useRef(sortBy);
  sortByRef.current = sortBy;

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-fetch from scratch whenever sortBy changes
  useEffect(() => {
    setCaptions([]);
    setPage(0);
    setHasMore(true);
    loadMore(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy]);

  async function loadMore(overridePage?: number) {
    if (loading) return;
    setLoading(true);

    const currentPage = overridePage ?? page;
    const currentSort = sortByRef.current;

    const { data, error } = await supabase
      .from("captions")
      .select(`
        id,
        content,
        like_count,
        images!inner (
          url
        )
      `)
      .eq("is_public", true)
      .not("content", "is", null)
      .neq("content", "")
      .order(currentSort === "top" ? "like_count" : "created_datetime_utc", { ascending: false })
      .range(currentPage * PAGE_SIZE, currentPage * PAGE_SIZE + PAGE_SIZE - 1);

    if (error) {
      console.error("Caption load error:", error);
    } else if (data) {
      setCaptions((prev) => currentPage === 0 ? data : [...prev, ...data]);
      setPage(currentPage + 1);
      if (data.length < PAGE_SIZE) {
        setHasMore(false);
      }
    }

    setLoading(false);
  }

  async function handleVote(captionId: string, vote: number) {
    if (!userId) return;

    const previousVote = userVotes[captionId];

    // ── Calculate like_count delta ──────────────────────────────────────
    let likeDelta = 0;
    if (previousVote === vote) {
      // Toggle off: same button re-clicked
      likeDelta = -vote; // upvote(1) cancel → -1 / downvote(-1) cancel → +1
    } else if (previousVote !== undefined) {
      // Change vote: remove old + add new
      likeDelta = vote - previousVote; // e.g. -1→+1 = +2, +1→-1 = -2
    } else {
      // New vote
      likeDelta = vote; // +1 or -1
    }

    // 1. Optimistic UI update
    if (previousVote === vote) {
      setUserVotes((prev) => {
        const updated = { ...prev };
        delete updated[captionId];
        return updated;
      });
    } else {
      setUserVotes((prev) => ({ ...prev, [captionId]: vote }));
    }

    // Optimistic like_count update
    setCaptions((prev) =>
      prev.map((c) =>
        c.id === captionId
          ? { ...c, like_count: (c.like_count ?? 0) + likeDelta }
          : c
      )
    );

    // 2. DB request
    let error: any = null;

    if (previousVote === vote) {
      ({ error } = await supabase
        .from("caption_votes")
        .delete()
        .eq("profile_id", userId)
        .eq("caption_id", captionId));
    } else if (previousVote !== undefined) {
      ({ error } = await supabase
        .from("caption_votes")
        .update({ vote_value: vote, modified_datetime_utc: new Date().toISOString(), modified_by_user_id: userId })
        .eq("profile_id", userId)
        .eq("caption_id", captionId));
    } else {
      const now = new Date().toISOString();
      ({ error } = await supabase
        .from("caption_votes")
        .insert({
          profile_id: userId,
          caption_id: captionId,
          vote_value: vote,
          created_datetime_utc: now,
          modified_datetime_utc: now,
          created_by_user_id: userId,
          modified_by_user_id: userId,
        }));
    }

    // 3. Rollback on failure
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
      // Rollback like_count
      setCaptions((prev) =>
        prev.map((c) =>
          c.id === captionId
            ? { ...c, like_count: (c.like_count ?? 0) - likeDelta }
            : c
        )
      );
      console.error("Vote failed:", error.message);
    }
  }

  return (
    <main style={{ padding: "48px 40px", maxWidth: 1280, margin: "0 auto" }}>

      {/* ── Page header ──────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        style={{
          marginBottom: 48,
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        {/* Title block */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <div style={{ width: 24, height: 1, background: "#f5c518" }} />
            <span
              style={{
                fontFamily: "monospace",
                fontSize: 9,
                letterSpacing: "0.28em",
                color: "#f5c518",
                textTransform: "uppercase",
              }}
            >
              Community Archive
            </span>
            <div style={{ width: 24, height: 1, background: "#f5c518" }} />
          </div>

          <h1
            style={{
              fontSize: "clamp(32px, 5vw, 56px)",
              fontWeight: 800,
              lineHeight: 0.95,
              letterSpacing: "-0.04em",
              color: "#f0ece4",
              margin: "0 0 14px 0",
            }}
          >
            The Captions
          </h1>
          <p
            style={{
              fontFamily: "monospace",
              fontSize: 11,
              color: "#c8c4bc",
              margin: 0,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            Community-voted · AI-generated
          </p>
        </div>

        {/* ── Sort toggle ──────────────────────────────────────────────────── */}
        <div style={{ display: "flex", border: "1px solid #6a6a6a", borderRadius: 2 }}>
          {(["newest", "top"] as const).map((mode) => (
            <motion.button
              key={mode}
              onClick={() => setSortBy(mode)}
              whileHover={sortBy !== mode ? { color: "#f5c518" } : {}}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.15 }}
              style={{
                padding: "7px 16px",
                background: sortBy === mode ? "#f5c518" : "transparent",
                color: sortBy === mode ? "#0c0c0c" : "#c8c4bc",
                border: "none",
                borderRadius: 2,
                fontFamily: "monospace",
                fontSize: 9,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                cursor: "pointer",
                fontWeight: sortBy === mode ? 700 : 400,
                transition: "background 0.15s, color 0.15s",
              }}
            >
              {mode === "newest" ? "Newest" : "Top Voted"}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* ── Caption grid ─────────────────────────────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: 16,
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

      {/* ── Load more / End of list ───────────────────────────────────────── */}
      <div style={{ textAlign: "center", marginTop: 64 }}>
        {hasMore ? (
          <motion.button
            whileHover={{ borderColor: "#f5c518", color: "#f5c518" }}
            whileTap={{ scale: 0.96 }}
            onClick={() => loadMore()}
            disabled={loading}
            transition={{ duration: 0.15 }}
            style={{
              padding: "12px 40px",
              borderRadius: 2,
              border: "1px solid #6a6a6a",
              background: "transparent",
              color: loading ? "#6a6a6a" : "#c8c4bc",
              fontSize: 10,
              fontFamily: "monospace",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              cursor: loading ? "not-allowed" : "pointer",
              transition: "border-color 0.15s, color 0.15s",
            }}
          >
            {loading ? "Loading…" : "Load More"}
          </motion.button>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            style={{ display: "flex", alignItems: "center", gap: 20 }}
          >
            <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, transparent, #1c1c1c)" }} />
            <span
              style={{
                fontFamily: "monospace",
                fontSize: 9,
                letterSpacing: "0.24em",
                color: "#6a6a6a",
                textTransform: "uppercase",
                flexShrink: 0,
              }}
            >
              End of Archive
            </span>
            <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, #1c1c1c, transparent)" }} />
          </motion.div>
        )}
      </div>
    </main>
  );
}
