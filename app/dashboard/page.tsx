import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "./SignOutButton";

export default async function DashboardPage() {
  const supabase = createClient();
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
        height: "100vh",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <h1 style={{ fontSize: 32, marginBottom: 16 }}>Dashboard</h1>
        {user.user_metadata?.avatar_url && (
          <img
            src={user.user_metadata.avatar_url}
            alt="Avatar"
            style={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              margin: "0 auto 16px",
            }}
          />
        )}
        <p style={{ fontSize: 18, marginBottom: 24 }}>{user.email}</p>
        <SignOutButton />
      </div>
    </main>
  );
}
