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
  const [voteFilter, setVoteFilter] = useState<"all" | "my-votes" | "upvoted" | "downvoted">("all");
  const [voteDropdownOpen, setVoteDropdownOpen] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const supabase = createClient();
  const sortByRef = useRef(sortBy);
  sortByRef.current = sortBy;
  const voteFilterRef = useRef(voteFilter);
  voteFilterRef.current = voteFilter;
  const userVotesRef = useRef(userVotes);
  userVotesRef.current = userVotes;

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

  // Re-fetch from scratch whenever any filter/sort changes
  useEffect(() => {
    setCaptions([]);
    setPage(0);
    setHasMore(true);
    loadMore(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy, voteFilter]);

  async function loadMore(overridePage?: number) {
    if (loading) return;
    setLoading(true);

    const currentPage = overridePage ?? page;
    const currentSort = sortByRef.current;
    const currentVote = voteFilterRef.current;
    const currentVotes = userVotesRef.current;

    let query = supabase
      .from("captions")
      .select("id, content, like_count, images!inner(url)")
      .eq("is_public", true)
      .not("content", "is", null)
      .neq("content", "");

    // Vote filter — DB-level filtering by caption IDs we know the user voted on
    if (currentVote !== "all") {
      const votedIds = Object.keys(currentVotes).filter((id) => {
        if (currentVote === "my-votes") return true;
        if (currentVote === "upvoted")   return currentVotes[id] === 1;
        if (currentVote === "downvoted") return currentVotes[id] === -1;
        return false;
      });
      if (votedIds.length === 0) {
        if (currentPage === 0) setCaptions([]);
        setHasMore(false);
        setLoading(false);
        return;
      }
      query = query.in("id", votedIds);
    }

    const { data, error } = await query
      .order(currentSort === "top" ? "like_count" : "created_datetime_utc", { ascending: false })
      .range(currentPage * PAGE_SIZE, currentPage * PAGE_SIZE + PAGE_SIZE - 1);

    if (error) {
      console.error("Caption load error:", error);
      setLoading(false);
      return;
    }

    if (data) {
      setCaptions((prev) => currentPage === 0 ? data : [...prev, ...data]);
      setPage(currentPage + 1);
      if (data.length < PAGE_SIZE) setHasMore(false);
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

        {/* ── Controls ─────────────────────────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>

            {/* Vote filter dropdown — only shown when logged in */}
            {userId && (() => {
              const VOTE_OPTIONS = [
                { val: "all",       label: "All Votes" },
                { val: "my-votes",  label: "My Votes" },
                { val: "upvoted",   label: "👍 Upvoted" },
                { val: "downvoted", label: "👎 Downvoted" },
              ] as const;
              const current = VOTE_OPTIONS.find(o => o.val === voteFilter)!;
              const isActive = voteFilter !== "all";
              return (
                <div style={{ position: "relative" }}>
                  <motion.button
                    onClick={() => setVoteDropdownOpen(o => !o)}
                    whileTap={{ scale: 0.95 }}
                    style={{
                      padding: "7px 14px",
                      background: isActive ? "#f5c518" : "transparent",
                      color: isActive ? "#0c0c0c" : "#c8c4bc",
                      border: "1px solid #6a6a6a",
                      borderRadius: 2,
                      fontFamily: "monospace",
                      fontSize: 9,
                      letterSpacing: "0.18em",
                      textTransform: "uppercase",
                      cursor: "pointer",
                      fontWeight: isActive ? 700 : 400,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {current.label} {voteDropdownOpen ? "▲" : "▼"}
                  </motion.button>

                  {voteDropdownOpen && (
                    <>
                      {/* backdrop to close */}
                      <div
                        style={{ position: "fixed", inset: 0, zIndex: 10 }}
                        onClick={() => setVoteDropdownOpen(false)}
                      />
                      <div style={{
                        position: "absolute",
                        top: "calc(100% + 6px)",
                        right: 0,
                        zIndex: 20,
                        background: "#111",
                        border: "1px solid #3a3a3a",
                        borderRadius: 4,
                        overflow: "hidden",
                        minWidth: 140,
                      }}>
                        {VOTE_OPTIONS.map(({ val, label }) => (
                          <button
                            key={val}
                            onClick={() => { setVoteFilter(val); setVoteDropdownOpen(false); }}
                            style={{
                              display: "block",
                              width: "100%",
                              padding: "9px 14px",
                              background: voteFilter === val ? "rgba(245,197,24,0.12)" : "transparent",
                              color: voteFilter === val ? "#f5c518" : "#c8c4bc",
                              border: "none",
                              borderBottom: "1px solid #1c1c1c",
                              fontFamily: "monospace",
                              fontSize: 9,
                              letterSpacing: "0.16em",
                              textTransform: "uppercase",
                              cursor: "pointer",
                              textAlign: "left",
                              fontWeight: voteFilter === val ? 700 : 400,
                            }}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              );
            })()}

          {/* Sort */}
          <div style={{ display: "flex", border: "1px solid #6a6a6a", borderRadius: 2 }}>
            {(["newest", "top"] as const).map((mode, i) => (
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
                  borderLeft: i > 0 ? "1px solid #3a3a3a" : "none",
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
