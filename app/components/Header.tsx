"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import SignOutButton from "@/app/dashboard/SignOutButton";

const NAV_LINK_STYLE: React.CSSProperties = {
  fontSize: 14,
  color: "#6b7280",
  textDecoration: "none",
  padding: "6px 10px",
  borderRadius: 6,
  transition: "color 0.15s",
};

export default function Header({ email: initialEmail }: { email: string | null }) {
  const [email, setEmail] = useState(initialEmail);

  useEffect(() => {
    const supabase = createClient();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user?.email ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 40px",
        height: 60,
        borderBottom: "1px solid #1f2937",
        position: "sticky",
        top: 0,
        background: "#0a0a0a",
        zIndex: 50,
      }}
    >
      {/* Logo */}
      <Link
        href="/"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          textDecoration: "none",
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "#22c55e",
            display: "inline-block",
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: "#ededed",
            letterSpacing: "-0.01em",
          }}
        >
          Humor Project
        </span>
      </Link>

      {/* Nav */}
      <nav style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <Link href="/list" style={NAV_LINK_STYLE}>
          Captions
        </Link>

        {email ? (
          <>
            <Link href="/upload" style={NAV_LINK_STYLE}>
              Upload
            </Link>
            <span
              style={{
                fontSize: 12,
                color: "#4b5563",
                margin: "0 6px",
                maxWidth: 180,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {email}
            </span>
            <SignOutButton />
          </>
        ) : (
          <Link
            href="/login"
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: "#ededed",
              background: "transparent",
              border: "1px solid #374151",
              borderRadius: 8,
              padding: "6px 16px",
              textDecoration: "none",
              marginLeft: 4,
              transition: "border-color 0.15s",
            }}
          >
            Login
          </Link>
        )}
      </nav>
    </header>
  );
}
