"use client";

import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ThemeToggle from "./ThemeToggle";

const NAV_ITEMS = [
  { href: "/flavors",     label: "Humor Flavors", icon: "◈" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [email, setEmail] = useState("");

  // Don't render on auth pages
  if (pathname.startsWith("/login") || pathname.startsWith("/auth")) return null;

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setEmail(user?.email ?? "");
    });
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <aside
      className="w-56 shrink-0 flex flex-col min-h-screen"
      style={{
        backgroundColor: "var(--bg-sidebar)",
        borderRight: "1px solid var(--border-accent)",
      }}
    >
      {/* Logo */}
      <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border-accent)" }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded flex items-center justify-center text-xs"
              style={{ background: "linear-gradient(135deg, #f59e0b, #f97316)" }}
            >
              ⛓
            </div>
            <span className="font-bold font-mono text-xs tracking-widest shimmer-text">
              PROMPT CHAIN
            </span>
          </div>
          <ThemeToggle compact />
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        <p
          className="text-xs font-mono uppercase tracking-widest px-3 mb-2"
          style={{ color: "rgba(245,158,11,0.4)" }}
        >
          Manage
        </p>
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-200 mb-0.5"
              style={
                active
                  ? {
                      background: "linear-gradient(135deg, rgba(245,158,11,0.15), rgba(249,115,22,0.08))",
                      border: "1px solid rgba(245,158,11,0.25)",
                      boxShadow: "0 0 12px rgba(245,158,11,0.08)",
                      color: "#fff",
                    }
                  : {
                      background: "transparent",
                      border: "1px solid transparent",
                      color: "var(--text-sidebar)",
                    }
              }
            >
              <span className="text-xs" style={{ color: active ? "#f59e0b" : "var(--text-muted)" }}>
                {item.icon}
              </span>
              {item.label}
              {active && (
                <span
                  className="ml-auto w-1 h-4 rounded-full"
                  style={{ background: "linear-gradient(180deg, #f59e0b, #f97316)", boxShadow: "0 0 8px rgba(245,158,11,0.6)" }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User / Logout */}
      <div className="px-3 py-4 space-y-3" style={{ borderTop: "1px solid var(--border-accent)" }}>
        {/* User card */}
        <div
          className="px-3 py-2 rounded-lg"
          style={{ background: "rgba(15,23,42,0.6)", border: "1px solid var(--border)" }}
        >
          <div className="flex items-center gap-2">
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
              style={{ background: "linear-gradient(135deg, #f59e0b, #f97316)" }}
            >
              {email ? email[0].toUpperCase() : "A"}
            </div>
            <span className="text-xs font-mono truncate" style={{ color: "var(--text-secondary)" }}>
              {email || "admin"}
            </span>
          </div>
        </div>

        {/* Sign out */}
        <button
          onClick={handleLogout}
          className="w-full text-xs px-3 py-2 rounded-lg font-mono transition-all duration-200"
          style={{ border: "1px solid var(--border)", background: "transparent", color: "var(--text-muted)" }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.border = "1px solid rgba(239,68,68,0.3)";
            (e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.05)";
            (e.currentTarget as HTMLButtonElement).style.color = "var(--danger)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.border = "1px solid var(--border)";
            (e.currentTarget as HTMLButtonElement).style.background = "transparent";
            (e.currentTarget as HTMLButtonElement).style.color = "var(--text-muted)";
          }}
        >
          ↪ Sign out
        </button>
      </div>
    </aside>
  );
}
