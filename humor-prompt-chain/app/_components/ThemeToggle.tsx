"use client";

import { useTheme } from "./ThemeProvider";

const OPTIONS = [
  { value: "light" as const, label: "Light", icon: "☀" },
  { value: "dark"  as const, label: "Dark",  icon: "◑" },
  { value: "system" as const, label: "Auto",  icon: "⬡" },
];

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

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
