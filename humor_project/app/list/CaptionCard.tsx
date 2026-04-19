"use client";

import { useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

export default function CaptionCard({
  captionId,
  imageUrl,
  content,
  likes,
  isLoggedIn,
  userVote,
  onVote,
}: {
  captionId: string;
  imageUrl?: string;
  content: string;
  likes: number;
  isLoggedIn: boolean;
  userVote: number | null;
  onVote: (captionId: string, vote: number) => void;
}) {
  const [copied, setCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [6, -6]), { stiffness: 200, damping: 25 });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-6, 6]), { stiffness: 200, damping: 25 });
  const glowX = useTransform(mouseX, [-0.5, 0.5], ["0%", "100%"]);
  const glowY = useTransform(mouseY, [-0.5, 0.5], ["0%", "100%"]);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
  }

  function handleMouseLeave() {
    mouseX.set(0);
    mouseY.set(0);
  }

  function handleCopy(e: React.MouseEvent) {
    e.stopPropagation();
    navigator.clipboard.writeText(content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      // clipboard denied — fallback: select text
      const el = document.createElement("textarea");
      el.value = content;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      initial={{ opacity: 0, y: 48 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 24 }}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
        perspective: 800,
        borderRadius: 2,
        overflow: "hidden",
        position: "relative",
        cursor: "default",
        background: "#111",
        border: "1px solid #1c1c1c",
      }}
    >
      {/* ── Specular highlight overlay (follows mouse) ─────────────── */}
      <motion.div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 2,
          pointerEvents: "none",
          borderRadius: 2,
          background: `radial-gradient(circle at ${glowX} ${glowY}, rgba(245,197,24,0.06) 0%, transparent 60%)`,
        }}
      />

      {/* ── Image ─────────────────────────────────────────────────── */}
      {typeof imageUrl === "string" && imageUrl.startsWith("http") ? (
        <div style={{ position: "relative", overflow: "hidden" }}>
          <img
            src={imageUrl}
            alt=""
            loading="lazy"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
            style={{ width: "100%", height: 240, objectFit: "cover", display: "block", filter: "grayscale(20%) contrast(1.05)" }}
          />
          {/* Film strip overlay on image */}
          <div
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(to bottom, transparent 55%, rgba(12,12,12,0.95) 100%)",
              pointerEvents: "none",
            }}
          />
        </div>
      ) : (
        <div
          style={{
            height: 240,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#0e0e0e",
            color: "#6a6a6a",
            fontSize: 11,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            fontFamily: "monospace",
          }}
        >
          No Image
        </div>
      )}

      {/* ── Content ───────────────────────────────────────────────── */}
      <div style={{ padding: "16px 18px 18px", position: "relative", zIndex: 1 }}>
        {/* Caption text */}
        <p
          style={{
            color: "#c8c4bc",
            fontSize: 13,
            lineHeight: 1.65,
            margin: "0 0 16px 0",
            fontStyle: "italic",
            letterSpacing: "0.01em",
          }}
        >
          "{content}"
        </p>

        {/* Footer row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {/* Like count */}
          <span
            style={{
              fontFamily: "monospace",
              fontSize: 11,
              letterSpacing: "0.1em",
              color: likes > 0 ? "#f5c518" : "#c8c4bc",
              display: "flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            <span style={{ fontSize: 13 }}>★</span>
            <span style={{ fontWeight: 700 }}>{likes}</span>
            <span style={{ fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase", opacity: 0.7 }}>
              votes
            </span>
          </span>

          {/* Copy button */}
          <motion.button
            onClick={handleCopy}
            whileHover={{ borderColor: "#f5c518", color: "#f5c518" }}
            whileTap={{ scale: 0.9 }}
            transition={{ duration: 0.15 }}
            style={{
              background: "transparent",
              border: `1px solid ${copied ? "#f5c518" : "#6a6a6a"}`,
              borderRadius: 2,
              color: copied ? "#f5c518" : "#c8c4bc",
              fontFamily: "monospace",
              fontSize: 9,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              padding: "4px 10px",
              cursor: "pointer",
              transition: "border-color 0.15s, color 0.15s",
            }}
          >
            {copied ? "Copied!" : "Copy"}
          </motion.button>

          {/* Vote buttons */}
          {isLoggedIn ? (
            <div style={{ display: "flex", gap: 4 }}>
              <motion.button
                whileTap={{ scale: 0.88 }}
                whileHover={userVote !== 1 ? { borderColor: "#f5c518", color: "#f5c518" } : {}}
                onClick={(e) => { e.stopPropagation(); onVote(captionId, 1); }}
                style={{
                  background: userVote === 1 ? "#f5c518" : "transparent",
                  color: userVote === 1 ? "#0c0c0c" : "#c8c4bc",
                  border: `1px solid ${userVote === 1 ? "#f5c518" : "#4a4a4a"}`,
                  borderRadius: 2,
                  padding: "4px 10px",
                  cursor: "pointer",
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: "0.06em",
                  transition: "all 0.18s",
                }}
              >
                ▲
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.88 }}
                whileHover={userVote !== -1 ? { borderColor: "#c0392b", color: "#c0392b" } : {}}
                onClick={(e) => { e.stopPropagation(); onVote(captionId, -1); }}
                style={{
                  background: userVote === -1 ? "#c0392b" : "transparent",
                  color: userVote === -1 ? "#fff" : "#c8c4bc",
                  border: `1px solid ${userVote === -1 ? "#c0392b" : "#4a4a4a"}`,
                  borderRadius: 2,
                  padding: "4px 10px",
                  cursor: "pointer",
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: "0.06em",
                  transition: "all 0.18s",
                }}
              >
                ▼
              </motion.button>
            </div>
          ) : (
            <a
              href="/login"
              style={{
                fontFamily: "monospace",
                fontSize: 9,
                letterSpacing: "0.14em",
                color: "#6b6b6b",
                textDecoration: "underline",
                textUnderlineOffset: "3px",
                textTransform: "uppercase",
                transition: "color 0.15s",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "#f5c518"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "#6b6b6b"; }}
            >
              Sign in to vote
            </a>
          )}
        </div>
      </div>

      {/* ── Gold border on hover via motion ───────────────────────── */}
      <motion.div
        aria-hidden
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 2,
          border: "1px solid rgba(245,197,24,0.3)",
          pointerEvents: "none",
          zIndex: 3,
        }}
      />
    </motion.div>
  );
}
