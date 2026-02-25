"use client";

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
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 400,
          background: "#111",
          border: "1px solid #1f2937",
          borderRadius: 16,
          padding: "40px 36px",
          textAlign: "center",
        }}
      >
        {/* Brand mark */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            marginBottom: 36,
          }}
        >
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: "#22c55e",
              display: "inline-block",
              flexShrink: 0,
            }}
          />
          <span style={{ fontSize: 15, fontWeight: 600, color: "#ededed" }}>
            Humor Project
          </span>
        </div>

        <h1
          style={{
            fontSize: 26,
            fontWeight: 600,
            marginBottom: 8,
            letterSpacing: "-0.01em",
          }}
        >
          Welcome back
        </h1>
        <p
          style={{
            fontSize: 14,
            color: "#6b7280",
            marginBottom: 32,
            lineHeight: 1.6,
          }}
        >
          Sign in to upload images and vote on captions.
        </p>

        <button
          onClick={handleLogin}
          style={{
            width: "100%",
            padding: "13px 24px",
            borderRadius: 10,
            border: "none",
            background: "#22c55e",
            color: "#000",
            fontSize: 15,
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            transition: "opacity 0.15s",
          }}
        >
          {/* Google G icon */}
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path
              d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"
              fill="#000"
            />
            <path
              d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"
              fill="#000"
            />
            <path
              d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z"
              fill="#000"
            />
            <path
              d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z"
              fill="#000"
            />
          </svg>
          Continue with Google
        </button>
      </div>
    </main>
  );
}
