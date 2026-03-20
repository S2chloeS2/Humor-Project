"use client";

import { useState } from "react";
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
}

function stepIcon(desc: string | null): string {
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
      {/* ── Top bar ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-xs font-mono uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
          {steps.length} step{steps.length !== 1 ? "s" : ""} in pipeline
        </p>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-90 active:scale-95"
          style={{ background: "linear-gradient(135deg, #f59e0b, #f97316)", color: "#0f172a" }}
        >
          + Add Step
        </button>
      </div>

      {/* ── Empty state ─────────────────────────────────────── */}
      {steps.length === 0 && (
        <div
          className="rounded-2xl p-12 text-center"
          style={{ border: "2px dashed var(--border-accent)", backgroundColor: "var(--bg-card)" }}
        >
          <p className="text-4xl mb-3">⛓</p>
          <p className="font-semibold mb-1" style={{ color: "var(--text-secondary)" }}>No steps yet</p>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Add your first step to start building the prompt chain.
          </p>
        </div>
      )}

      {/* ── Pipeline ────────────────────────────────────────── */}
      <div className="relative">
        {/* Vertical connector line */}
        {steps.length > 1 && (
          <div
            className="absolute left-[27px] top-12 bottom-12 w-0.5 z-0"
            style={{ background: "linear-gradient(to bottom, rgba(245,158,11,0.4), rgba(245,158,11,0.05))" }}
          />
        )}

        <div className="relative z-10 flex flex-col gap-3">
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
      </div>

      {/* ── Modals ──────────────────────────────────────────── */}
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

// ── Step Card ───────────────────────────────────────────────────────────────

function StepCard({
  step, idx, total, moving,
  onMoveUp, onMoveDown, onEdit, onDelete,
}: {
  step: Step; idx: number; total: number; moving: boolean;
  onMoveUp: () => void; onMoveDown: () => void;
  onEdit: () => void; onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="rounded-2xl transition-all duration-200"
      style={{
        backgroundColor: "var(--bg-card)",
        border: "1px solid var(--border)",
        opacity: moving ? 0.5 : 1,
      }}
    >
      {/* ── Main row ─────────────────────────────── */}
      <div className="flex items-center gap-4 px-5 py-4">

        {/* Step circle */}
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-bold font-mono"
          style={{
            background: "linear-gradient(135deg, rgba(245,158,11,0.2), rgba(249,115,22,0.1))",
            border: "2px solid rgba(245,158,11,0.35)",
            color: "var(--accent)",
            fontSize: 14,
          }}
        >
          {idx + 1}
        </div>

        {/* Icon + title */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xl">{stepIcon(step.description)}</span>
            <span className="font-semibold" style={{ color: "var(--text-primary)" }}>
              {step.description || (
                <span style={{ color: "var(--text-muted)", fontStyle: "italic", fontWeight: 400 }}>
                  Untitled step
                </span>
              )}
            </span>
            {step.llm_temperature !== null && (
              <span
                className="text-xs font-mono px-2 py-0.5 rounded-full"
                style={{
                  background: "rgba(96,165,250,0.08)",
                  color: "#60a5fa",
                  border: "1px solid rgba(96,165,250,0.2)",
                }}
              >
                🌡 {step.llm_temperature}
              </span>
            )}
          </div>
          {/* Prompt preview when collapsed */}
          {!expanded && step.llm_system_prompt && (
            <p
              className="text-xs font-mono mt-1 truncate"
              style={{ color: "var(--text-muted)", maxWidth: 460 }}
            >
              {step.llm_system_prompt}
            </p>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="flex flex-col gap-0.5">
            <button
              onClick={onMoveUp}
              disabled={idx === 0 || moving}
              title="Move up"
              className="w-6 h-5 flex items-center justify-center rounded text-xs disabled:opacity-20 hover:opacity-70 transition-opacity"
              style={{ background: "rgba(245,158,11,0.1)", color: "var(--accent)" }}
            >
              ▲
            </button>
            <button
              onClick={onMoveDown}
              disabled={idx === total - 1 || moving}
              title="Move down"
              className="w-6 h-5 flex items-center justify-center rounded text-xs disabled:opacity-20 hover:opacity-70 transition-opacity"
              style={{ background: "rgba(245,158,11,0.1)", color: "var(--accent)" }}
            >
              ▼
            </button>
          </div>

          <button
            onClick={() => setExpanded(!expanded)}
            className="px-2.5 py-1.5 rounded-lg text-xs font-mono transition-all hover:opacity-80"
            style={{
              background: expanded ? "rgba(245,158,11,0.12)" : "var(--bg-base)",
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
              background: "rgba(245,158,11,0.1)",
              color: "var(--accent)",
              border: "1px solid rgba(245,158,11,0.2)",
            }}
          >
            Edit
          </button>

          <DeleteStepButton onDelete={onDelete} />
        </div>
      </div>

      {/* ── Expanded prompts ─────────────────────── */}
      {expanded && (
        <div
          className="px-5 pb-5 pt-3 flex flex-col gap-3"
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
              No prompts configured yet. Click Edit to add them.
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
      <p className="text-xs font-mono font-bold uppercase tracking-wider mb-2" style={{ color }}>
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

function DeleteStepButton({ onDelete }: { onDelete: () => void }) {
  const [confirm, setConfirm] = useState(false);
  if (confirm) {
    return (
      <div className="flex gap-1 items-center">
        <button
          onClick={onDelete}
          className="text-xs px-2 py-1.5 rounded-lg font-mono"
          style={{ background: "rgba(239,68,68,0.15)", color: "var(--danger)", border: "1px solid rgba(239,68,68,0.3)" }}
        >
          Yes
        </button>
        <button
          onClick={() => setConfirm(false)}
          className="text-xs px-2 py-1.5 rounded-lg font-mono"
          style={{ border: "1px solid var(--border)", color: "var(--text-muted)", background: "transparent" }}
        >
          No
        </button>
      </div>
    );
  }
  return (
    <button
      onClick={() => setConfirm(true)}
      className="px-3 py-1.5 rounded-lg text-xs font-mono transition-all hover:opacity-80"
      style={{ background: "rgba(239,68,68,0.08)", color: "var(--danger)", border: "1px solid rgba(239,68,68,0.2)" }}
    >
      Delete
    </button>
  );
}
