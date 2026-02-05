"use client";

import { motion } from "framer-motion";

export default function CaptionCard({
  imageUrl,
  content,
  likes,
}: {
  imageUrl?: string;
  content: string;
  likes: number;
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

      {/* Hover Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to top, rgba(0,0,0,0.8), transparent)",
          padding: 16,
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
        }}
      >
        <p
          style={{
            color: "white",
            marginBottom: 6,
            fontSize: 14,
            lineHeight: 1.4,
          }}
        >
          {content}
        </p>
        <span
          style={{
            color: "#9ef5c3",
            fontSize: 13,
          }}
        >
          ♥ {likes}
        </span>
      </motion.div>
    </motion.div>
  );
}
