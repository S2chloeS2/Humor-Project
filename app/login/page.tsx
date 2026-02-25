"use client";

import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const handleLogin = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <main
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "calc(100vh - 60px)",
        padding: "0 24px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* ── Gold ambient glow ────────────────────────────────────────────── */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: "30%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 600,
          height: 400,
          borderRadius: "50%",
          background: "radial-gradient(ellipse at center, rgba(245,197,24,0.05) 0%, transparent 65%)",
          pointerEvents: "none",
          filter: "blur(40px)",
        }}
      />

      {/* ── Card ─────────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        style={{
          width: "100%",
          maxWidth: 380,
          background: "#111",
          border: "1px solid #1c1c1c",
          borderRadius: 2,
          padding: "48px 40px",
          textAlign: "center",
          position: "relative",
        }}
      >
        {/* Gold top-edge accent */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: 0,
            left: "20%",
            right: "20%",
            height: 1,
            background: "linear-gradient(90deg, transparent, #f5c518, transparent)",
          }}
        />

        {/* ── Brand mark ───────────────────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            marginBottom: 40,
          }}
        >
          <motion.span
            animate={{
              boxShadow: [
                "0 0 6px rgba(245,197,24,0.4)",
                "0 0 14px rgba(245,197,24,0.8)",
                "0 0 6px rgba(245,197,24,0.4)",
              ],
            }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#f5c518",
              display: "inline-block",
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "#f0ece4",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            Humor Project
          </span>
        </div>

        {/* ── Headline ─────────────────────────────────────────────────── */}
        <div style={{ marginBottom: 32 }}>
          <div
            style={{
              fontFamily: "monospace",
              fontSize: 9,
              letterSpacing: "0.24em",
              color: "#3a3a3a",
              textTransform: "uppercase",
              marginBottom: 10,
            }}
          >
            Members Only
          </div>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 800,
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
              color: "#f0ece4",
              margin: "0 0 10px 0",
            }}
          >
            Sign In
          </h1>
          <p
            style={{
              fontSize: 13,
              color: "#3a3a3a",
              lineHeight: 1.7,
              margin: 0,
              fontFamily: "monospace",
              letterSpacing: "0.04em",
            }}
          >
            Upload photos · Generate captions · Vote
          </p>
        </div>

        {/* ── Divider ──────────────────────────────────────────────────── */}
        <div
          style={{
            height: 1,
            background: "linear-gradient(90deg, transparent, #2a2a2a, transparent)",
            marginBottom: 32,
          }}
        />

        {/* ── Google button ────────────────────────────────────────────── */}
        <motion.button
          onClick={handleLogin}
          whileHover={{ borderColor: "#f5c518" }}
          whileTap={{ scale: 0.97 }}
          transition={{ duration: 0.15 }}
          style={{
            width: "100%",
            padding: "14px 24px",
            borderRadius: 2,
            border: "1px solid #2a2a2a",
            background: "#f5c518",
            color: "#0c0c0c",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
          }}
        >
          {/* Google G icon */}
          <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
            <path
              d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"
              fill="#0c0c0c"
            />
            <path
              d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"
              fill="#0c0c0c"
            />
            <path
              d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z"
              fill="#0c0c0c"
            />
            <path
              d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z"
              fill="#0c0c0c"
            />
          </svg>
          Continue with Google
        </motion.button>

        {/* ── Footer note ──────────────────────────────────────────────── */}
        <p
          style={{
            marginTop: 24,
            fontFamily: "monospace",
            fontSize: 9,
            letterSpacing: "0.14em",
            color: "#2a2a2a",
            textTransform: "uppercase",
          }}
        >
          No password required
        </p>
      </motion.div>
    </main>
  );
}
