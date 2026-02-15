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
        height: "100vh",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <h1 style={{ fontSize: 32, marginBottom: 24 }}>Sign In</h1>
        <button
          onClick={handleLogin}
          style={{
            padding: "12px 24px",
            borderRadius: 8,
            border: "1px solid #333",
            background: "#111",
            color: "#fff",
            fontSize: 16,
            cursor: "pointer",
          }}
        >
          Sign in with Google
        </button>
      </div>
    </main>
  );
}
