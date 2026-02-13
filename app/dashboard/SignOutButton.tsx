"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignOutButton() {
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <button
      onClick={handleSignOut}
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
      Sign Out
    </button>
  );
}
