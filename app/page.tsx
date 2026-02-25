"use client";

import Link from "next/link";
import { motion } from "framer-motion";

function fadeUp(i: number) {
  return {
    initial: { opacity: 0, y: 32 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: "easeOut" as const, delay: i * 0.12 },
  };
}

export default function Home() {
  return (
    <main
      style={{
        minHeight: "calc(100vh - 60px)",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* ── Background grid texture ───────────────────────────────────── */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(34,197,94,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(34,197,94,0.03) 1px, transparent 1px)
          `,
          backgroundSize: "80px 80px",
          pointerEvents: "none",
        }}
      />

      {/* ── Glow blob ────────────────────────────────────────────────── */}
      <motion.div
        aria-hidden
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 2, ease: "easeOut" }}
        style={{
          position: "absolute",
          top: "-20%",
          left: "50%",
          transform: "translateX(-50%)",
          width: 700,
          height: 500,
          borderRadius: "50%",
          background:
            "radial-gradient(ellipse at center, rgba(34,197,94,0.08) 0%, transparent 70%)",
          pointerEvents: "none",
          filter: "blur(40px)",
        }}
      />

      {/* ── Main content ─────────────────────────────────────────────── */}
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "calc(100vh - 60px)",
          padding: "80px 24px",
          textAlign: "center",
        }}
      >
        {/* Issue tag — magazine masthead */}
        <motion.div
          {...fadeUp(0)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 48,
          }}
        >
          <span
            style={{
              fontFamily: "monospace",
              fontSize: 11,
              letterSpacing: "0.18em",
              color: "#4b5563",
              textTransform: "uppercase",
            }}
          >
            No. 001
          </span>
          <span style={{ width: 1, height: 12, background: "#1f2937" }} />
          <span
            style={{
              fontFamily: "monospace",
              fontSize: 11,
              letterSpacing: "0.18em",
              color: "#22c55e",
              textTransform: "uppercase",
            }}
          >
            AI-Powered Humor
          </span>
          <span style={{ width: 1, height: 12, background: "#1f2937" }} />
          <span
            style={{
              fontFamily: "monospace",
              fontSize: 11,
              letterSpacing: "0.18em",
              color: "#4b5563",
              textTransform: "uppercase",
            }}
          >
            Vol. 2026
          </span>
        </motion.div>

        {/* ── Hero headline — editorial oversized type ──────────────── */}
        <div style={{ maxWidth: 820, marginBottom: 40 }}>
          <motion.div {...fadeUp(1)}>
            <span
              style={{
                display: "block",
                fontSize: "clamp(52px, 9vw, 108px)",
                fontWeight: 700,
                lineHeight: 0.95,
                letterSpacing: "-0.04em",
                color: "#ededed",
              }}
            >
              CAPTIONS
            </span>
          </motion.div>

          <motion.div {...fadeUp(2)}>
            <span
              style={{
                display: "block",
                fontSize: "clamp(52px, 9vw, 108px)",
                fontWeight: 700,
                lineHeight: 0.95,
                letterSpacing: "-0.04em",
                color: "transparent",
                WebkitTextStroke: "1.5px #374151",
              }}
            >
              THAT KILL
            </span>
          </motion.div>

          <motion.div {...fadeUp(3)}>
            <span
              style={{
                display: "block",
                fontSize: "clamp(52px, 9vw, 108px)",
                fontWeight: 700,
                lineHeight: 0.95,
                letterSpacing: "-0.04em",
                color: "#22c55e",
              }}
            >
              EVERY TIME
            </span>
          </motion.div>
        </div>

        {/* Horizontal rule — editorial divider */}
        <motion.div
          {...fadeUp(4)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 40,
            width: "100%",
            maxWidth: 560,
          }}
        >
          <div style={{ flex: 1, height: 1, background: "#1f2937" }} />
          <span
            style={{
              fontFamily: "monospace",
              fontSize: 10,
              letterSpacing: "0.2em",
              color: "#374151",
              textTransform: "uppercase",
              flexShrink: 0,
            }}
          >
            community voted
          </span>
          <div style={{ flex: 1, height: 1, background: "#1f2937" }} />
        </motion.div>

        {/* Subheading */}
        <motion.p
          {...fadeUp(5)}
          style={{
            fontSize: 16,
            color: "#6b7280",
            lineHeight: 1.75,
            maxWidth: 400,
            marginBottom: 52,
          }}
        >
          Upload a photo. Get AI-generated captions.
          <br />
          Vote on the ones that actually land.
        </motion.p>

        {/* CTA row */}
        <motion.div
          {...fadeUp(6)}
          style={{
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          <Link
            href="/list"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              padding: "14px 28px",
              borderRadius: 10,
              background: "#22c55e",
              color: "#000",
              fontWeight: 700,
              fontSize: 14,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              textDecoration: "none",
            }}
          >
            Read the Issue
            <span style={{ fontSize: 16 }}>→</span>
          </Link>

          <Link
            href="/upload"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              padding: "14px 28px",
              borderRadius: 10,
              background: "transparent",
              border: "1px solid #1f2937",
              color: "#6b7280",
              fontWeight: 500,
              fontSize: 14,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              textDecoration: "none",
            }}
          >
            Submit a Photo
          </Link>
        </motion.div>

        {/* Bottom scroll hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4, duration: 1 }}
          style={{
            position: "absolute",
            bottom: 36,
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span
            style={{
              fontFamily: "monospace",
              fontSize: 10,
              letterSpacing: "0.18em",
              color: "#374151",
              textTransform: "uppercase",
            }}
          >
            Scroll
          </span>
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
            style={{
              width: 1,
              height: 28,
              background: "linear-gradient(to bottom, #374151, transparent)",
            }}
          />
        </motion.div>
      </div>
    </main>
  );
}
