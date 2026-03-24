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

interface StepTypeMeta { id: number; slug: string; description: string | null; }
interface ModelMeta { id: number; name: string; llm_provider_id: number; is_temperature_supported: boolean; }
interface IOMeta { id: number; slug: string; description: string | null; }

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

  // Metadata
  const [stepTypes, setStepTypes] = useState<StepTypeMeta[]>([]);
  const [models, setModels] = useState<ModelMeta[]>([]);
  const [inputTypes, setInputTypes] = useState<IOMeta[]>([]);
  const [outputTypes, setOutputTypes] = useState<IOMeta[]>([]);
  const [metaLoading, setMetaLoading] = useState(true);

  // Form fields
  const [description, setDescription] = useState(step?.description ?? "");
  const [stepTypeId, setStepTypeId] = useState<number | "">(step?.humor_flavor_step_type_id ?? "");
  const [modelId, setModelId] = useState<number | "">(step?.llm_model_id ?? "");
  const [inputTypeId, setInputTypeId] = useState<number | "">(step?.llm_input_type_id ?? "");
  const [outputTypeId, setOutputTypeId] = useState<number | "">(step?.llm_output_type_id ?? "");
  const [systemPrompt, setSystemPrompt] = useState(step?.llm_system_prompt ?? "");
  const [userPrompt, setUserPrompt] = useState(step?.llm_user_prompt ?? "");
  const [temperature, setTemperature] = useState(String(step?.llm_temperature ?? "0.7"));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    fetch("/api/step-types")
      .then((r) => r.json())
      .then((d) => {
        setStepTypes(d.stepTypes ?? []);
        setModels(d.models ?? []);
        setInputTypes(d.inputTypes ?? []);
        setOutputTypes(d.outputTypes ?? []);
      })
      .finally(() => setMetaLoading(false));
  }, []);

  function handleStepTypeChange(id: number) {
    setStepTypeId(id);
    if (!isEdit) {
      if (id === 1 || id === 2) {
        setInputTypeId(1);  // image-and-text
        setOutputTypeId(1); // string
      } else {
        setInputTypeId(2);  // text-only
        setOutputTypeId(1); // string
      }
    }
  }

  const selectedModel = models.find((m) => m.id === modelId);
  const tempSupported = selectedModel?.is_temperature_supported ?? true;
  const isPresetType = stepTypeId === 1 || stepTypeId === 2;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stepTypeId) { setError("Step type is required"); return; }
    if (!modelId) { setError("Model is required"); return; }
    if (!inputTypeId) { setError("Input type is required"); return; }
    if (!outputTypeId) { setError("Output type is required"); return; }
    setLoading(true);
    setError("");

    const body = {
      description: description.trim() || null,
      humor_flavor_step_type_id: stepTypeId,
      llm_model_id: modelId,
      llm_input_type_id: inputTypeId,
      llm_output_type_id: outputTypeId,
      llm_system_prompt: systemPrompt.trim() || null,
      llm_user_prompt: userPrompt.trim() || null,
      llm_temperature: (tempSupported && temperature) ? (parseFloat(temperature) || null) : null,
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

        {metaLoading ? (
          <p className="text-sm text-center py-8" style={{ color: "var(--text-muted)" }}>Loading options…</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Description */}
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider mb-1.5" style={{ color: "var(--text-muted)" }}>
                Description <span className="normal-case font-normal">(optional label)</span>
              </label>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What does this step do?"
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{ backgroundColor: "var(--bg-base)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
              />
            </div>

            {/* Step Type */}
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider mb-1.5" style={{ color: "var(--text-muted)" }}>
                Step Type <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {stepTypes.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleStepTypeChange(t.id)}
                    className="px-3 py-3 rounded-lg text-xs font-semibold text-left transition-all"
                    style={{
                      background: stepTypeId === t.id ? "rgba(245,158,11,0.15)" : "var(--bg-base)",
                      border: stepTypeId === t.id ? "1.5px solid rgba(245,158,11,0.5)" : "1px solid var(--border)",
                      color: stepTypeId === t.id ? "var(--accent)" : "var(--text-secondary)",
                    }}
                  >
                    <span className="block font-mono font-bold text-xs mb-0.5">
                      {t.slug === "celebrity-recognition" ? "🌟 Celebrity" :
                       t.slug === "image-description" ? "👁 Vision" : "⚙️ General"}
                    </span>
                    <span className="text-xs" style={{ opacity: 0.7 }}>{t.slug}</span>
                  </button>
                ))}
              </div>
              {isPresetType && (
                <p className="text-xs mt-1.5 px-1" style={{ color: "rgba(96,165,250,0.8)" }}>
                  ℹ️ Built-in preprocessing — uses cached vision model. Prompts below are optional overrides.
                </p>
              )}
            </div>

            {/* Model */}
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider mb-1.5" style={{ color: "var(--text-muted)" }}>
                Model <span className="text-red-400">*</span>
              </label>
              <select
                value={modelId}
                onChange={(e) => setModelId(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{ backgroundColor: "var(--bg-base)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
              >
                <option value="">— select model —</option>
                {models.filter((m) => m.id < 50).map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>

            {/* Input / Output Types */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider mb-1.5" style={{ color: "var(--text-muted)" }}>
                  Input Type <span className="text-red-400">*</span>
                </label>
                <select
                  value={inputTypeId}
                  onChange={(e) => setInputTypeId(Number(e.target.value))}
                  disabled={isPresetType}
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none disabled:opacity-60"
                  style={{ backgroundColor: "var(--bg-base)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
                >
                  <option value="">— select —</option>
                  {inputTypes.map((t) => (
                    <option key={t.id} value={t.id}>{t.slug} — {t.description}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider mb-1.5" style={{ color: "var(--text-muted)" }}>
                  Output Type <span className="text-red-400">*</span>
                </label>
                <select
                  value={outputTypeId}
                  onChange={(e) => setOutputTypeId(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ backgroundColor: "var(--bg-base)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
                >
                  <option value="">— select —</option>
                  {outputTypes.map((t) => (
                    <option key={t.id} value={t.id}>{t.slug} — {t.description}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* System Prompt */}
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider mb-1.5" style={{ color: "var(--text-muted)" }}>
                System Prompt {isPresetType && <span className="normal-case font-normal">(optional override)</span>}
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

            {/* User Prompt */}
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider mb-1.5" style={{ color: "var(--text-muted)" }}>
                User Prompt {isPresetType && <span className="normal-case font-normal">(optional override)</span>}
                <span className="ml-2 normal-case text-xs" style={{ color: "rgba(96,165,250,0.7)" }}>
                  vars: {"${step1Output}"}, {"${imageDescription}"}, {"${tenRandomTerms}"}…
                </span>
              </label>
              <textarea
                value={userPrompt}
                onChange={(e) => setUserPrompt(e.target.value)}
                placeholder="Given this image: ${imageDescription}, write something funny..."
                rows={4}
                className="w-full px-3 py-2 rounded-lg text-sm font-mono outline-none resize-y"
                style={{ backgroundColor: "var(--bg-base)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
              />
            </div>

            {/* Temperature */}
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider mb-1.5" style={{ color: "var(--text-muted)" }}>
                Temperature <span className="normal-case">(0.0 – 2.0){!tempSupported && modelId ? " — not supported by selected model" : ""}</span>
              </label>
              <input
                type="number"
                value={temperature}
                onChange={(e) => setTemperature(e.target.value)}
                min="0"
                max="2"
                step="0.1"
                disabled={!tempSupported && !!modelId}
                className="w-32 px-3 py-2 rounded-lg text-sm font-mono outline-none disabled:opacity-40"
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
        )}
      </div>
    </div>,
    document.body
  );
}
