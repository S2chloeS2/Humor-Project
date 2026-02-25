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
        padding: "6px 14px",
        borderRadius: 8,
        border: "1px solid #7f1d1d",
        background: "transparent",
        color: "#ef4444",
        fontSize: 13,
        cursor: "pointer",
        transition: "border-color 0.15s, color 0.15s",
      }}
    >
      Sign out
    </button>
  );
}
