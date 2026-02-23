"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import SignOutButton from "@/app/dashboard/SignOutButton";

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
    <header className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
      <Link href="/" className="text-lg font-semibold">
        Humor Project
      </Link>

      <nav className="flex items-center gap-4">
        <Link href="/list" className="text-sm text-gray-400 hover:text-white transition-colors">
          Captions
        </Link>
        {email ? (
          <>
            <Link href="/upload" className="text-sm text-gray-400 hover:text-white transition-colors">
              Upload
            </Link>
            <span className="text-sm text-gray-400">{email}</span>
            <SignOutButton />
          </>
        ) : (
          <Link
            href="/login"
            className="rounded-md bg-white px-4 py-2 text-sm text-black hover:bg-gray-200"
          >
            Login
          </Link>
        )}
      </nav>
    </header>
  );
}
