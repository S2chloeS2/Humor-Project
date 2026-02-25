"use client";

import { motion } from "framer-motion";

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
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{
        scale: 1.02,
        boxShadow: "0 16px 40px rgba(34,197,94,0.12)",
      }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      style={{
        background: "#111",
        border: "1px solid #1f2937",
        borderRadius: 16,
        overflow: "hidden",
        position: "relative",
        cursor: "pointer",
      }}
    >
      {/* Image */}
      {typeof imageUrl === "string" && imageUrl.startsWith("http") ? (
        <img
          src={imageUrl}
          alt=""
          loading="lazy"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
          style={{
            width: "100%",
            height: 220,
            objectFit: "cover",
          }}
        />
      ) : (
        <div
          style={{
            height: 220,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#0d1f14",
            color: "#4b5563",
            fontSize: 13,
          }}
        >
          No image
        </div>
      )}

      {/* Content */}
      <div style={{ padding: 20 }}>
        <p
          style={{
            color: "#e5e7eb",
            marginBottom: 12,
            fontSize: 14,
            lineHeight: 1.6,
            margin: "0 0 12px 0",
          }}
        >
          {content}
        </p>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Like count */}
          <span style={{ color: "#9ef5c3", fontSize: 13, fontWeight: 500 }}>
            ♥ {likes}
          </span>

          {/* Vote buttons — only for logged-in users */}
          {isLoggedIn && (
            <div style={{ display: "flex", gap: 6 }}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onVote(captionId, 1);
                }}
                style={{
                  background: userVote === 1 ? "#22c55e" : "transparent",
                  color: userVote === 1 ? "#000" : "#6b7280",
                  border: `1px solid ${userVote === 1 ? "#22c55e" : "#374151"}`,
                  borderRadius: 6,
                  padding: "4px 10px",
                  cursor: "pointer",
                  fontSize: 14,
                  transition: "background 0.2s, color 0.2s, border-color 0.2s",
                }}
              >
                ▲
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onVote(captionId, -1);
                }}
                style={{
                  background: userVote === -1 ? "#ef4444" : "transparent",
                  color: userVote === -1 ? "#fff" : "#6b7280",
                  border: `1px solid ${userVote === -1 ? "#ef4444" : "#374151"}`,
                  borderRadius: 6,
                  padding: "4px 10px",
                  cursor: "pointer",
                  fontSize: 14,
                  transition: "background 0.2s, color 0.2s, border-color 0.2s",
                }}
              >
                ▼
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
