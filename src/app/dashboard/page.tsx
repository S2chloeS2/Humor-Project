import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "./SignOutButton";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

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
        }}
      >
        {/* Avatar */}
        {user.user_metadata?.avatar_url && (
          <img
            src={user.user_metadata.avatar_url}
            alt="Avatar"
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              border: "2px solid #1f2937",
              marginBottom: 20,
              display: "block",
            }}
          />
        )}

        {/* Full name */}
        {user.user_metadata?.full_name && (
          <p
            style={{
              fontSize: 18,
              fontWeight: 600,
              marginBottom: 4,
              letterSpacing: "-0.01em",
            }}
          >
            {user.user_metadata.full_name}
          </p>
        )}

        {/* Email */}
        <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 32 }}>
          {user.email}
        </p>

        {/* Divider */}
        <div style={{ height: 1, background: "#1f2937", marginBottom: 24 }} />

        {/* Sign out */}
        <SignOutButton />
      </div>
    </main>
  );
}
