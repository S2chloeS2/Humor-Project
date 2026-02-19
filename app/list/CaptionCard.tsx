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
  captionId: number;
  imageUrl?: string;
  content: string;
  likes: number;
  isLoggedIn: boolean;
  userVote: number | null;
  onVote: (captionId: number, vote: number) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{
        scale: 1.04,
        boxShadow: "0 20px 40px rgba(0,255,150,0.25)",
      }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      style={{
        background: "#111",
        borderRadius: 16,
        overflow: "hidden",
        position: "relative",
        cursor: "pointer",
      }}
    >
      {typeof imageUrl === "string" &&
      imageUrl.startsWith("http") ? (
        <img
          src={imageUrl}
          alt=""
          loading="lazy"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display =
              "none";
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
            color: "#777",
            fontSize: 14,
          }}
        >
          No Image
        </div>
      )}

      {/* Caption info & vote buttons */}
      <div style={{ padding: 16 }}>
        <p
          style={{
            color: "white",
            marginBottom: 8,
            fontSize: 14,
            lineHeight: 1.4,
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
          <span style={{ color: "#9ef5c3", fontSize: 13 }}>
            &#9829; {likes}
          </span>

          {isLoggedIn && (
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onVote(captionId, 1);
                }}
                style={{
                  background: userVote === 1 ? "#22c55e" : "#333",
                  color: userVote === 1 ? "#fff" : "#aaa",
                  border: "none",
                  borderRadius: 8,
                  padding: "4px 12px",
                  cursor: "pointer",
                  fontSize: 16,
                  transition: "background 0.2s, color 0.2s",
                }}
              >
                &#9650;
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onVote(captionId, -1);
                }}
                style={{
                  background: userVote === -1 ? "#ef4444" : "#333",
                  color: userVote === -1 ? "#fff" : "#aaa",
                  border: "none",
                  borderRadius: 8,
                  padding: "4px 12px",
                  cursor: "pointer",
                  fontSize: 16,
                  transition: "background 0.2s, color 0.2s",
                }}
              >
                &#9660;
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
