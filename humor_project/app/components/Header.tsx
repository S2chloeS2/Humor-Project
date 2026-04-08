"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import SignOutButton from "@/app/dashboard/SignOutButton";

export default function Header({ email: initialEmail }: { email: string | null }) {
  const [email, setEmail] = useState(initialEmail);

  useEffect(() => {
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user?.email ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 40px",
        height: 60,
        borderBottom: "1px solid #1c1c1c",
        position: "sticky",
        top: 0,
        background: "rgba(12,12,12,0.92)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        zIndex: 50,
      }}
    >
      {/* Logo */}
      <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
        <motion.span
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "#f5c518",
            display: "inline-block",
            flexShrink: 0,
            boxShadow: "0 0 8px rgba(245,197,24,0.6)",
          }}
          animate={{ boxShadow: ["0 0 6px rgba(245,197,24,0.4)", "0 0 14px rgba(245,197,24,0.8)", "0 0 6px rgba(245,197,24,0.4)"] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        />
        <span style={{ fontSize: 14, fontWeight: 600, color: "#f0ece4", letterSpacing: "0.06em", textTransform: "uppercase" }}>
          Humor Project
        </span>
      </Link>

      {/* Nav */}
      <nav style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <Link href="/list" style={{ fontSize: 12, color: "#c8c4bc", textDecoration: "none", padding: "6px 12px", letterSpacing: "0.1em", textTransform: "uppercase", transition: "color 0.15s" }}>
          Browse
        </Link>
        {email ? (
          <>
            <Link href="/upload" style={{ fontSize: 12, color: "#c8c4bc", textDecoration: "none", padding: "6px 12px", letterSpacing: "0.1em", textTransform: "uppercase", transition: "color 0.15s" }}>
              Upload
            </Link>
            <span style={{ width: 1, height: 16, background: "#5a5a5a", margin: "0 4px" }} />
            <span style={{ fontSize: 11, color: "#9a9a9a", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {email}
            </span>
            <SignOutButton />
          </>
        ) : (
          <Link
            href="/login"
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "#0c0c0c",
              background: "#f5c518",
              border: "none",
              borderRadius: 4,
              padding: "6px 14px",
              textDecoration: "none",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginLeft: 8,
            }}
          >
            Sign In
          </Link>
        )}
      </nav>
    </header>
  );
}
