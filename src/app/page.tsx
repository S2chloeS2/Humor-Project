"use client";

import Link from "next/link";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useRef } from "react";

function fadeUp(i: number) {
  return {
    initial: { opacity: 0, y: 40 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.7, ease: "easeOut" as const, delay: i * 0.1 },
  };
}

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 60, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 60, damping: 20 });
  const blobX = useTransform(springX, (v) => `calc(50% + ${v * 0.04}px)`);
  const blobY = useTransform(springY, (v) => `calc(-10% + ${v * 0.02}px)`);

  function handleMouseMove(e: React.MouseEvent) {
    const r = containerRef.current?.getBoundingClientRect();
    if (!r) return;
    mouseX.set(e.clientX - r.left - r.width / 2);
    mouseY.set(e.clientY - r.top - r.height / 2);
  }

  return (
    <main
      ref={containerRef}
      onMouseMove={handleMouseMove}
      style={{ minHeight: "calc(100vh - 60px)", position: "relative", overflow: "hidden" }}
    >
      {/* ── Film grain overlay ──────────────────────────────────────── */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          backgroundSize: "180px",
          pointerEvents: "none",
          opacity: 0.6,
          mixBlendMode: "overlay",
        }}
      />

      {/* ── Gold parallax glow ──────────────────────────────────────── */}
      <motion.div
        aria-hidden
        style={{
          position: "absolute",
          left: blobX,
          top: blobY,
          transform: "translate(-50%, 0)",
          width: 800,
          height: 600,
          borderRadius: "50%",
          background: "radial-gradient(ellipse at center, rgba(245,197,24,0.07) 0%, transparent 65%)",
          pointerEvents: "none",
          filter: "blur(60px)",
        }}
      />

      {/* ── Horizontal rule lines — cinematic frame ─────────────────── */}
      <div aria-hidden style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, #f5c51830, transparent)" }} />
      <div aria-hidden style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, #f5c51830, transparent)" }} />

      {/* ── Main content ────────────────────────────────────────────── */}
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "calc(100vh - 60px)",
          padding: "80px 24px 120px",
          textAlign: "center",
        }}
      >
        {/* Issue label */}
        <motion.div {...fadeUp(0)} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 56 }}>
          <div style={{ width: 28, height: 1, background: "#f5c518" }} />
          <span style={{ fontFamily: "monospace", fontSize: 10, letterSpacing: "0.28em", color: "#f5c518", textTransform: "uppercase" }}>
            Issue No. 001 · AI Caption Review
          </span>
          <div style={{ width: 28, height: 1, background: "#f5c518" }} />
        </motion.div>

        {/* ── Headline ────────────────────────────────────────────── */}
        <div style={{ maxWidth: 900, marginBottom: 0 }}>
          {/* Row 1 */}
          <motion.div {...fadeUp(1)} style={{ overflow: "hidden" }}>
            <span
              style={{
                display: "block",
                fontSize: "clamp(60px, 11vw, 130px)",
                fontWeight: 800,
                lineHeight: 0.9,
                letterSpacing: "-0.05em",
                color: "#f0ece4",
              }}
            >
              THE
            </span>
          </motion.div>

          {/* Row 2 — outlined */}
          <motion.div {...fadeUp(2)} style={{ overflow: "hidden" }}>
            <span
              style={{
                display: "block",
                fontSize: "clamp(60px, 11vw, 130px)",
                fontWeight: 800,
                lineHeight: 0.9,
                letterSpacing: "-0.05em",
                color: "transparent",
                WebkitTextStroke: "1px #2a2a2a",
              }}
            >
              FUNNIEST
            </span>
          </motion.div>

          {/* Row 3 — gold */}
          <motion.div {...fadeUp(3)} style={{ overflow: "hidden" }}>
            <span
              style={{
                display: "block",
                fontSize: "clamp(60px, 11vw, 130px)",
                fontWeight: 800,
                lineHeight: 0.9,
                letterSpacing: "-0.05em",
                color: "#f5c518",
                textShadow: "0 0 80px rgba(245,197,24,0.25)",
              }}
            >
              CAPTIONS
            </span>
          </motion.div>
        </div>

        {/* ── Divider + meta ──────────────────────────────────────── */}
        <motion.div
          {...fadeUp(4)}
          style={{ display: "flex", alignItems: "center", gap: 20, margin: "48px 0", width: "100%", maxWidth: 600 }}
        >
          <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, transparent, #2a2a2a)" }} />
          <span style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: "0.22em", color: "#3a3a3a", textTransform: "uppercase", flexShrink: 0 }}>
            Community Voted · AI Generated
          </span>
          <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, #2a2a2a, transparent)" }} />
        </motion.div>

        {/* Subheading */}
        <motion.p
          {...fadeUp(5)}
          style={{ fontSize: 15, color: "#555", lineHeight: 1.8, maxWidth: 380, marginBottom: 52, letterSpacing: "0.02em" }}
        >
          Upload any photo. Watch AI write the captions.
          <br />
          Vote on the one that kills.
        </motion.p>

        {/* ── CTAs ────────────────────────────────────────────────── */}
        <motion.div {...fadeUp(6)} style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
          <Link
            href="/list"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 12,
              padding: "15px 32px",
              background: "#f5c518",
              color: "#0c0c0c",
              fontWeight: 700,
              fontSize: 12,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              textDecoration: "none",
              borderRadius: 2,
            }}
          >
            View Captions
            <span style={{ fontSize: 14, fontWeight: 400 }}>↗</span>
          </Link>
          <Link
            href="/upload"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 12,
              padding: "15px 32px",
              background: "transparent",
              border: "1px solid #2a2a2a",
              color: "#555",
              fontWeight: 500,
              fontSize: 12,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              textDecoration: "none",
              borderRadius: 2,
            }}
          >
            Submit Photo
          </Link>
        </motion.div>

        {/* ── Scroll indicator ────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 1 }}
          style={{ position: "absolute", bottom: 40, left: "50%", transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}
        >
          <span style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: "0.2em", color: "#2a2a2a", textTransform: "uppercase" }}>Scroll</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            style={{ width: 1, height: 32, background: "linear-gradient(to bottom, #f5c518, transparent)" }}
          />
        </motion.div>
      </div>
    </main>
  );
}
