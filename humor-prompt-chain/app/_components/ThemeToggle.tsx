"use client";

import { useTheme } from "./ThemeProvider";

const OPTIONS = [
  { value: "light" as const, label: "Light", icon: "☀" },
  { value: "dark"  as const, label: "Dark",  icon: "◑" },
  { value: "system" as const, label: "Auto",  icon: "⬡" },
];

export default function ThemeToggle({ compact }: { compact?: boolean }) {
  const { theme, setTheme } = useTheme();

  if (compact) {
    const current = OPTIONS.find((o) => o.value === theme) ?? OPTIONS[0];
    const next = OPTIONS[(OPTIONS.indexOf(current) + 1) % OPTIONS.length];
    return (
      <button
        onClick={() => setTheme(next.value)}
        title={`Switch to ${next.label}`}
        className="w-7 h-7 rounded-lg flex items-center justify-center text-sm transition-all hover:opacity-80"
        style={{ border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text-muted)" }}
      >
        {current.icon}
      </button>
    );
  }

  return (
    <div
      className="flex rounded-lg overflow-hidden"
      style={{ border: "1px solid var(--border)", backgroundColor: "var(--bg-card)" }}
    >
      {OPTIONS.map((o) => {
        const active = theme === o.value;
        return (
          <button
            key={o.value}
            onClick={() => setTheme(o.value)}
            title={o.label}
            className="flex items-center gap-1 px-2 py-1.5 text-xs font-mono transition-all"
            style={{
              background: active ? "var(--accent)" : "transparent",
              color: active ? "#0f172a" : "var(--text-muted)",
              fontWeight: active ? "700" : "400",
            }}
          >
            <span>{o.icon}</span>
            <span className="hidden sm:inline">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}
