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
  humor_flavor_step_type_id: number | null;
  llm_model_id: number | null;
  llm_input_type_id: number | null;
  llm_output_type_id: number | null;
}

interface Props {
  flavorId: string;
  step?: Step;
  nextOrder?: number;
  onClose: () => void;
  onSaved: (step: Step) => void;
}

// Auto-config based on step order:
// Step 1 → Celebrity recognition (type 1), Gemini, image input
// Step 2 → Image description (type 2), Gemini, image input
// Step 3+ → General / caption (type 3), GPT 5 Mini, text input
function getAutoConfig(order: number) {
  if (order === 1) return {
    stepTypeId: 1, modelId: 14, inputTypeId: 1, outputTypeId: 1,
    label: "🌟 Celebrity Recognition",
    hint: "Identifies celebrities, brands, and notable content in the image.",
    defaultSystemPrompt: "You are an expert at identifying celebrities, public figures, brands, and cultural references in images. Be thorough and specific.",
    defaultUserPrompt: "Identify any famous or recognizable people, brands, or cultural references in this image. Be specific about names and context.",
  };
  if (order === 2) return {
    stepTypeId: 2, modelId: 14, inputTypeId: 1, outputTypeId: 1,
    label: "👁 Image Description",
    hint: "Describes the image in detail using the recognition context from step 1.",
    defaultSystemPrompt: "You are a detailed image description assistant. Describe images vividly and accurately.",
    defaultUserPrompt: "Using this recognition context: ${step1Output}\n\nDescribe this image in rich detail including the subjects, setting, mood, and any humorous or interesting elements.",
  };
  return {
    stepTypeId: 3, modelId: 17, inputTypeId: 2, outputTypeId: 2,
    label: "⚙️ Caption Generation",
    hint: "Takes previous step outputs as text and generates funny captions.",
    defaultSystemPrompt: "You are a witty and funny caption writer. Generate short, punchy captions that are relatable and humorous. Return a JSON array of strings.",
    defaultUserPrompt: "Image description: ${step2Output}\n\nPeople/brands identified: ${step1Output}\n\nWrite 5 short funny captions (under 60 chars each). Return as a JSON array.",
  };
}

export default function StepModal({ flavorId, step, nextOrder = 1, onClose, onSaved }: Props) {
  const isEdit = !!step;
  const [mounted, setMounted] = useState(false);

  const autoConfig = getAutoConfig(isEdit ? (step?.order_by ?? nextOrder) : nextOrder);

  const [description, setDescription] = useState(step?.description ?? "");
  const [systemPrompt, setSystemPrompt] = useState(step?.llm_system_prompt ?? autoConfig.defaultSystemPrompt);
  const [userPrompt, setUserPrompt] = useState(step?.llm_user_prompt ?? autoConfig.defaultUserPrompt);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { setMounted(true); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    // For edit, keep existing type/model if already set; otherwise use auto config
    const body = {
      description: description.trim() || null,
      humor_flavor_step_type_id: step?.humor_flavor_step_type_id ?? autoConfig.stepTypeId,
      llm_model_id: step?.llm_model_id ?? autoConfig.modelId,
      llm_input_type_id: step?.llm_input_type_id ?? autoConfig.inputTypeId,
      llm_output_type_id: step?.llm_output_type_id ?? autoConfig.outputTypeId,
      llm_system_prompt: systemPrompt.trim() || null,
      llm_user_prompt: userPrompt.trim() || null,
      llm_temperature: null,
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

  const stepLabel = isEdit
    ? (step?.humor_flavor_step_type_id === 1 ? "🌟 Celebrity Recognition"
      : step?.humor_flavor_step_type_id === 2 ? "👁 Image Description"
      : "⚙️ Caption Generation")
    : autoConfig.label;

  const stepHint = isEdit ? "" : autoConfig.hint;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-xl rounded-xl p-6 animate-fade-up max-h-[90vh] overflow-y-auto"
        style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-accent)" }}
      >
        <div className="mb-5">
          <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
            {isEdit ? "Edit Step" : `Add Step ${nextOrder}`}
          </h2>
          <div className="mt-2 flex items-center gap-2">
            <span
              className="text-xs font-mono px-2.5 py-1 rounded-full font-semibold"
              style={{ background: "rgba(245,158,11,0.12)", color: "var(--accent)", border: "1px solid rgba(245,158,11,0.25)" }}
            >
              {stepLabel}
            </span>
          </div>
          {stepHint && (
            <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>{stepHint}</p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Description */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider mb-1.5" style={{ color: "var(--text-muted)" }}>
              Label <span className="normal-case font-normal">(optional)</span>
            </label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={isEdit ? "" : `e.g. "${nextOrder === 1 ? "Spot the famous faces" : nextOrder === 2 ? "Describe the scene" : "Write funny captions"}"`}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none"
              style={{ backgroundColor: "var(--bg-base)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
            />
          </div>

          {/* System Prompt */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider mb-1.5" style={{ color: "var(--text-muted)" }}>
              System Prompt <span className="text-red-400">*</span>
            </label>
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="You are a helpful assistant that..."
              rows={3}
              className="w-full px-3 py-2 rounded-lg text-sm font-mono outline-none resize-y"
              style={{ backgroundColor: "var(--bg-base)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
            />
          </div>

          {/* User Prompt */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider mb-1.5" style={{ color: "var(--text-muted)" }}>
              User Prompt <span className="normal-case font-normal">(optional)</span>
            </label>
            <p className="text-xs mb-1.5" style={{ color: "rgba(96,165,250,0.7)" }}>
              Use <code>{"${step1Output}"}</code>, <code>{"${step2Output}"}</code> to chain previous outputs
            </p>
            <textarea
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              placeholder={
                nextOrder === 3
                  ? "Based on: ${step2Output}\nCelebrities: ${step1Output}\nWrite 5 funny captions."
                  : "Describe this image in detail..."
              }
              rows={4}
              className="w-full px-3 py-2 rounded-lg text-sm font-mono outline-none resize-y"
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
