"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import StepModal from "./StepModal";

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

const STEP_TYPE_LABELS: Record<number, string> = {
  1: "🌟 Celebrity",
  2: "👁 Vision",
  3: "⚙️ General",
};

const INPUT_TYPE_LABELS: Record<number, string> = {
  1: "image+text",
  2: "text",
};

const OUTPUT_TYPE_LABELS: Record<number, string> = {
  1: "string",
  2: "array",
};

function stepIcon(desc: string | null, typeId: number | null): string {
  if (typeId === 1) return "🌟";
  if (typeId === 2) return "👁";
  const d = (desc ?? "").toLowerCase();
  if (d.includes("descri") || d.includes("image") || d.includes("vision")) return "👁";
  if (d.includes("funny") || d.includes("joke") || d.includes("humor") || d.includes("absurd")) return "😂";
  if (d.includes("caption") || d.includes("write") || d.includes("generat")) return "✍️";
  if (d.includes("summar") || d.includes("rewrite")) return "📝";
  if (d.includes("tone") || d.includes("style")) return "🎨";
  return "⚙️";
}

export default function StepList({
  steps: initialSteps,
  flavorId,
}: {
  steps: Step[];
  flavorId: string;
}) {
  const router = useRouter();
  const [steps, setSteps] = useState(initialSteps);
  const [editingStep, setEditingStep] = useState<Step | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [movingId, setMovingId] = useState<string | null>(null);

  async function move(stepId: string, direction: "up" | "down") {
    setMovingId(stepId);
    const idx = steps.findIndex((s) => s.id === stepId);
    if (direction === "up" && idx === 0) { setMovingId(null); return; }
    if (direction === "down" && idx === steps.length - 1) { setMovingId(null); return; }

    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    const newSteps = [...steps];
    const tempOrder = newSteps[idx].order_by;
    newSteps[idx] = { ...newSteps[idx], order_by: newSteps[swapIdx].order_by };
    newSteps[swapIdx] = { ...newSteps[swapIdx], order_by: tempOrder };
    newSteps.sort((a, b) => a.order_by - b.order_by);
    setSteps(newSteps);

    await Promise.all([
      fetch(`/api/flavors/${flavorId}/steps/${newSteps[idx].id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_by: newSteps[idx].order_by }),
      }),
      fetch(`/api/flavors/${flavorId}/steps/${newSteps[swapIdx].id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_by: newSteps[swapIdx].order_by }),
      }),
    ]);

    setMovingId(null);
    router.refresh();
  }

  async function deleteStep(stepId: string) {
    await fetch(`/api/flavors/${flavorId}/steps/${stepId}`, { method: "DELETE" });
    setSteps(steps.filter((s) => s.id !== stepId));
    router.refresh();
  }

  return (
    <div>
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            Pipeline Steps
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            {steps.length === 0
              ? "No steps yet"
              : `${steps.length} step${steps.length !== 1 ? "s" : ""} · runs top to bottom`}
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90 active:scale-95"
          style={{ background: "linear-gradient(135deg, #f59e0b, #f97316)", color: "#0f172a" }}
        >
          + Add Step
        </button>
      </div>

      {/* Empty state */}
      {steps.length === 0 && (
        <div
          className="rounded-2xl p-14 text-center"
          style={{ border: "2px dashed var(--border-accent)", backgroundColor: "var(--bg-card)" }}
        >
          <p className="text-4xl mb-4">⛓</p>
          <p className="font-semibold text-base mb-1" style={{ color: "var(--text-secondary)" }}>
            No steps in this pipeline
          </p>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Add your first step to start building the prompt chain.
          </p>
        </div>
      )}

      {/* Steps */}
      <div className="space-y-3">
        {steps.map((step, idx) => (
          <StepCard
            key={step.id}
            step={step}
            idx={idx}
            total={steps.length}
            moving={movingId === step.id}
            onMoveUp={() => move(step.id, "up")}
            onMoveDown={() => move(step.id, "down")}
            onEdit={() => setEditingStep(step)}
            onDelete={() => deleteStep(step.id)}
          />
        ))}
      </div>

      {/* Modals */}
      {showCreate && (
        <StepModal
          flavorId={flavorId}
          nextOrder={(steps[steps.length - 1]?.order_by ?? 0) + 1}
          onClose={() => setShowCreate(false)}
          onSaved={(s) => {
            setSteps([...steps, s]);
            setShowCreate(false);
            router.refresh();
          }}
        />
      )}
      {editingStep && (
        <StepModal
          flavorId={flavorId}
          step={editingStep}
          onClose={() => setEditingStep(null)}
          onSaved={(updated) => {
            setSteps(steps.map((s) => (s.id === updated.id ? updated : s)));
            setEditingStep(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

// ── Step Card ─────────────────────────────────────────────────────────

function StepCard({
  step, idx, total, moving,
  onMoveUp, onMoveDown, onEdit, onDelete,
}: {
  step: Step; idx: number; total: number; moving: boolean;
  onMoveUp: () => void; onMoveDown: () => void;
  onEdit: () => void; onDelete: () => Promise<void> | void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="rounded-2xl transition-all duration-200 group"
      style={{
        backgroundColor: "var(--bg-card)",
        border: "1px solid var(--border)",
        opacity: moving ? 0.5 : 1,
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
      }}
    >
      <div className="flex items-center gap-4 px-6 py-5">
        {/* Step number */}
        <div className="flex flex-col items-center gap-1 shrink-0">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center font-bold font-mono text-sm"
            style={{
              background: "linear-gradient(135deg, rgba(245,158,11,0.15), rgba(249,115,22,0.08))",
              border: "1.5px solid rgba(245,158,11,0.3)",
              color: "var(--accent)",
            }}
          >
            {idx + 1}
          </div>
        </div>

        {/* Icon + title + meta */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 mb-1 flex-wrap">
            <span className="text-xl">{stepIcon(step.description, step.humor_flavor_step_type_id)}</span>
            <span className="font-semibold text-base" style={{ color: "var(--text-primary)" }}>
              {step.description || (
                <span style={{ color: "var(--text-muted)", fontStyle: "italic", fontWeight: 400, fontSize: 14 }}>
                  Untitled step
                </span>
              )}
            </span>
            {step.humor_flavor_step_type_id && (
              <span
                className="text-xs font-mono px-2 py-0.5 rounded-full"
                style={{
                  background: "rgba(167,139,250,0.08)",
                  color: "#a78bfa",
                  border: "1px solid rgba(167,139,250,0.18)",
                }}
              >
                {STEP_TYPE_LABELS[step.humor_flavor_step_type_id] ?? `type:${step.humor_flavor_step_type_id}`}
              </span>
            )}
            {step.llm_input_type_id && (
              <span
                className="text-xs font-mono px-2 py-0.5 rounded-full"
                style={{
                  background: "rgba(52,211,153,0.08)",
                  color: "#34d399",
                  border: "1px solid rgba(52,211,153,0.18)",
                }}
              >
                in:{INPUT_TYPE_LABELS[step.llm_input_type_id] ?? step.llm_input_type_id}
              </span>
            )}
            {step.llm_output_type_id && (
              <span
                className="text-xs font-mono px-2 py-0.5 rounded-full"
                style={{
                  background: "rgba(96,165,250,0.08)",
                  color: "#60a5fa",
                  border: "1px solid rgba(96,165,250,0.18)",
                }}
              >
                out:{OUTPUT_TYPE_LABELS[step.llm_output_type_id] ?? step.llm_output_type_id}
              </span>
            )}
            {step.llm_temperature !== null && (
              <span
                className="text-xs font-mono px-2 py-0.5 rounded-full"
                style={{
                  background: "rgba(249,115,22,0.08)",
                  color: "#f97316",
                  border: "1px solid rgba(249,115,22,0.18)",
                }}
              >
                🌡 {step.llm_temperature}
              </span>
            )}
          </div>
          {!expanded && step.llm_system_prompt && (
            <p
              className="text-xs font-mono truncate"
              style={{ color: "var(--text-muted)", maxWidth: 420 }}
            >
              {step.llm_system_prompt}
            </p>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Reorder */}
          <div className="flex flex-col gap-0.5">
            <button
              onClick={onMoveUp}
              disabled={idx === 0 || moving}
              title="Move up"
              className="w-7 h-6 flex items-center justify-center rounded-lg text-xs disabled:opacity-20 hover:opacity-70 transition-opacity"
              style={{ background: "var(--bg-base)", color: "var(--accent)", border: "1px solid var(--border)" }}
            >
              ▲
            </button>
            <button
              onClick={onMoveDown}
              disabled={idx === total - 1 || moving}
              title="Move down"
              className="w-7 h-6 flex items-center justify-center rounded-lg text-xs disabled:opacity-20 hover:opacity-70 transition-opacity"
              style={{ background: "var(--bg-base)", color: "var(--accent)", border: "1px solid var(--border)" }}
            >
              ▼
            </button>
          </div>

          <button
            onClick={() => setExpanded(!expanded)}
            className="px-3 py-1.5 rounded-lg text-xs font-mono transition-all hover:opacity-80"
            style={{
              background: expanded ? "rgba(245,158,11,0.1)" : "var(--bg-base)",
              color: expanded ? "var(--accent)" : "var(--text-muted)",
              border: "1px solid var(--border)",
            }}
          >
            {expanded ? "▲ hide" : "▼ prompts"}
          </button>

          <button
            onClick={onEdit}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-80"
            style={{
              background: "rgba(245,158,11,0.08)",
              color: "var(--accent)",
              border: "1px solid rgba(245,158,11,0.2)",
            }}
          >
            Edit
          </button>

          <DeleteStepButton onDelete={onDelete} stepName={step.description} />
        </div>
      </div>

      {/* Expanded prompts */}
      {expanded && (
        <div
          className="px-6 pb-6 pt-4 flex flex-col gap-3"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          {step.llm_system_prompt && (
            <PromptBlock label="System Prompt" content={step.llm_system_prompt} color="#a78bfa" />
          )}
          {step.llm_user_prompt && (
            <PromptBlock label="User Prompt" content={step.llm_user_prompt} color="#34d399" />
          )}
          {!step.llm_system_prompt && !step.llm_user_prompt && (
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              No prompts configured. Click Edit to add them.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function PromptBlock({ label, content, color }: { label: string; content: string; color: string }) {
  return (
    <div
      className="rounded-xl p-4"
      style={{ backgroundColor: "var(--bg-base)", border: "1px solid var(--border)" }}
    >
      <p className="text-xs font-mono font-bold uppercase tracking-wider mb-2.5" style={{ color }}>
        {label}
      </p>
      <p
        className="text-xs font-mono whitespace-pre-wrap leading-relaxed"
        style={{ color: "var(--text-secondary)" }}
      >
        {content}
      </p>
    </div>
  );
}

function DeleteStepButton({ onDelete, stepName }: { onDelete: () => void; stepName?: string | null }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  async function handleConfirm() {
    setLoading(true);
    await onDelete();
    setLoading(false);
    setOpen(false);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-3 py-1.5 rounded-lg text-xs font-mono transition-all hover:opacity-80"
        style={{ background: "rgba(239,68,68,0.06)", color: "var(--danger)", border: "1px solid rgba(239,68,68,0.18)" }}
      >
        🗑
      </button>

      {mounted && open && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget && !loading) setOpen(false); }}
        >
          <div
            className="w-full max-w-sm rounded-xl p-6 animate-fade-up"
            style={{ backgroundColor: "var(--bg-card)", border: "1px solid rgba(239,68,68,0.4)" }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)" }}
              >
                🗑
              </div>
              <div>
                <h2 className="text-base font-bold leading-none mb-1" style={{ color: "var(--text-primary)" }}>
                  Delete Step
                </h2>
                <p className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
                  This action cannot be undone
                </p>
              </div>
            </div>

            <div
              className="rounded-xl px-4 py-3 mb-5"
              style={{ background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.18)" }}
            >
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                Delete{" "}
                {stepName
                  ? <><span className="font-mono font-bold" style={{ color: "var(--danger)" }}>{stepName}</span>?</>
                  : "this step?"
                }
                {" "}This step and all its prompts will be permanently removed.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={loading}
                className="flex-1 py-2.5 rounded-xl text-sm font-mono transition-all hover:opacity-80 disabled:opacity-40"
                style={{ border: "1px solid var(--border)", color: "var(--text-secondary)", background: "transparent" }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={loading}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)", color: "#fff" }}
              >
                {loading ? "Deleting…" : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
