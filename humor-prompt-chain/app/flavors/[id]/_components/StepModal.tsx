"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

interface Step {
  id: string;
  order_by: number;
  description: string | null;
  llm_system_prompt: string | null;
  llm_user_prompt: string | null;
  llm_temperature: number | null;
  humor_flavor_id: string;
}

interface Props {
  flavorId: string;
  step?: Step;
  nextOrder?: number;
  onClose: () => void;
  onSaved: (step: Step) => void;
}

export default function StepModal({ flavorId, step, nextOrder = 1, onClose, onSaved }: Props) {
  const isEdit = !!step;
  const [mounted, setMounted] = useState(false);

  const [description, setDescription] = useState(step?.description ?? "");
  const [systemPrompt, setSystemPrompt] = useState(step?.llm_system_prompt ?? "");
  const [userPrompt, setUserPrompt] = useState(step?.llm_user_prompt ?? "");
  const [temperature, setTemperature] = useState(String(step?.llm_temperature ?? "0.7"));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => setMounted(true), []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const body = {
      description: description.trim() || null,
      llm_system_prompt: systemPrompt.trim() || null,
      llm_user_prompt: userPrompt.trim() || null,
      llm_temperature: parseFloat(temperature) || 0.7,
      ...(isEdit ? {} : { order_by: nextOrder }),
    };

    const url = isEdit
      ? `/api/flavors/${flavorId}/steps/${step!.id}`
      : `/api/flavors/${flavorId}/steps`;
    const method = isEdit ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to save step");
      setLoading(false);
      return;
    }

    const saved = await res.json();
    onSaved(saved);
  }

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-2xl rounded-xl p-6 animate-fade-up max-h-[90vh] overflow-y-auto"
        style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-accent)" }}
      >
        <h2 className="text-lg font-bold mb-5" style={{ color: "var(--text-primary)" }}>
          {isEdit ? "Edit Step" : `Add Step ${nextOrder}`}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider mb-1.5" style={{ color: "var(--text-muted)" }}>
              Description
            </label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this step do?"
              className="w-full px-3 py-2 rounded-lg text-sm outline-none"
              style={{ backgroundColor: "var(--bg-base)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider mb-1.5" style={{ color: "var(--text-muted)" }}>
              System Prompt
            </label>
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="You are a helpful assistant that..."
              rows={4}
              className="w-full px-3 py-2 rounded-lg text-sm font-mono outline-none resize-y"
              style={{ backgroundColor: "var(--bg-base)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider mb-1.5" style={{ color: "var(--text-muted)" }}>
              User Prompt
              <span className="ml-2 normal-case text-xs" style={{ color: "rgba(96,165,250,0.7)" }}>
                use {"{{input}}"} for previous step output
              </span>
            </label>
            <textarea
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              placeholder="Given this image description: {{input}}, write something funny..."
              rows={4}
              className="w-full px-3 py-2 rounded-lg text-sm font-mono outline-none resize-y"
              style={{ backgroundColor: "var(--bg-base)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider mb-1.5" style={{ color: "var(--text-muted)" }}>
              Temperature <span className="normal-case">(0.0 – 2.0)</span>
            </label>
            <input
              type="number"
              value={temperature}
              onChange={(e) => setTemperature(e.target.value)}
              min="0"
              max="2"
              step="0.1"
              className="w-32 px-3 py-2 rounded-lg text-sm font-mono outline-none"
              style={{ backgroundColor: "var(--bg-base)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
            />
          </div>

          {error && <p className="text-sm" style={{ color: "var(--danger)" }}>{error}</p>}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-lg text-sm font-mono"
              style={{ border: "1px solid var(--border)", color: "var(--text-secondary)", background: "transparent" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #f59e0b, #f97316)", color: "#0f172a" }}
            >
              {loading ? "Saving..." : isEdit ? "Save Changes" : "Add Step"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
