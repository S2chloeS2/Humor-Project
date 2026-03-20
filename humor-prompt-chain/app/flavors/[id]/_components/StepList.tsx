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

export default function StepList({ steps: initialSteps, flavorId }: { steps: Step[]; flavorId: string }) {
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

    // Swap order_by values
    const tempOrder = newSteps[idx].order_by;
    newSteps[idx] = { ...newSteps[idx], order_by: newSteps[swapIdx].order_by };
    newSteps[swapIdx] = { ...newSteps[swapIdx], order_by: tempOrder };

    // Re-sort
    newSteps.sort((a, b) => a.order_by - b.order_by);
    setSteps(newSteps);

    // Persist both swapped steps
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
      {/* Add step button */}
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:opacity-90"
          style={{ background: "linear-gradient(135deg, #f59e0b, #f97316)", color: "#0f172a" }}
        >
          + Add Step
        </button>
      </div>

      {/* Empty state */}
      {steps.length === 0 && (
        <div
          className="rounded-xl p-10 text-center"
          style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)" }}
        >
          <p className="text-3xl mb-2">◇</p>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>No steps yet. Add the first step to build the prompt chain.</p>
        </div>
      )}

      {/* Step cards */}
      <div className="space-y-3">
        {steps.map((step, idx) => (
          <div
            key={step.id}
            className="rounded-xl p-5 transition-all"
            style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)" }}
          >
            <div className="flex items-start gap-4">
              {/* Order badge + move buttons */}
              <div className="flex flex-col items-center gap-1 shrink-0">
                <button
                  onClick={() => move(step.id, "up")}
                  disabled={idx === 0 || movingId === step.id}
                  className="w-6 h-5 flex items-center justify-center rounded text-xs transition-all disabled:opacity-20 hover:opacity-70"
                  style={{ background: "rgba(245,158,11,0.1)", color: "var(--accent)" }}
                >
                  ▲
                </button>
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold font-mono"
                  style={{ background: "rgba(245,158,11,0.15)", color: "var(--accent)", border: "1px solid rgba(245,158,11,0.25)" }}
                >
                  {idx + 1}
                </div>
                <button
                  onClick={() => move(step.id, "down")}
                  disabled={idx === steps.length - 1 || movingId === step.id}
                  className="w-6 h-5 flex items-center justify-center rounded text-xs transition-all disabled:opacity-20 hover:opacity-70"
                  style={{ background: "rgba(245,158,11,0.1)", color: "var(--accent)" }}
                >
                  ▼
                </button>
              </div>

              {/* Step content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="text-sm font-semibold mb-0.5" style={{ color: "var(--text-primary)" }}>
                      {step.description || <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>No description</span>}
                    </p>
                    {step.llm_temperature !== null && (
                      <span
                        className="inline-block text-xs font-mono px-2 py-0.5 rounded-full"
                        style={{ background: "rgba(96,165,250,0.1)", color: "#60a5fa", border: "1px solid rgba(96,165,250,0.2)" }}
                      >
                        temp: {step.llm_temperature}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => setEditingStep(step)}
                      className="text-xs px-3 py-1.5 rounded-lg font-mono hover:opacity-80"
                      style={{ background: "rgba(245,158,11,0.1)", color: "var(--accent)", border: "1px solid rgba(245,158,11,0.2)" }}
                    >
                      Edit
                    </button>
                    <DeleteStepButton onDelete={() => deleteStep(step.id)} />
                  </div>
                </div>

                {/* Prompts preview */}
                <div className="space-y-2">
                  {step.llm_system_prompt && (
                    <PromptPreview label="System" content={step.llm_system_prompt} />
                  )}
                  {step.llm_user_prompt && (
                    <PromptPreview label="User" content={step.llm_user_prompt} />
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create modal */}
      {showCreate && (
        <StepModal
          flavorId={flavorId}
          nextOrder={(steps[steps.length - 1]?.order_by ?? 0) + 1}
          onClose={() => setShowCreate(false)}
          onSaved={(s) => { setSteps([...steps, s]); setShowCreate(false); router.refresh(); }}
        />
      )}

      {/* Edit modal */}
      {editingStep && (
        <StepModal
          flavorId={flavorId}
          step={editingStep}
          onClose={() => setEditingStep(null)}
          onSaved={(updated) => {
            setSteps(steps.map((s) => s.id === updated.id ? updated : s));
            setEditingStep(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

function PromptPreview({ label, content }: { label: string; content: string }) {
  const [expanded, setExpanded] = useState(false);
  const short = content.length > 120 ? content.slice(0, 120) + "…" : content;
  return (
    <div
      className="rounded-lg p-3 cursor-pointer"
      style={{ backgroundColor: "var(--bg-base)", border: "1px solid var(--border)" }}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs font-mono font-bold uppercase" style={{ color: "var(--text-muted)" }}>
          {label}
        </span>
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>{expanded ? "▲" : "▼"}</span>
      </div>
      <p
        className="text-xs font-mono whitespace-pre-wrap"
        style={{ color: "var(--text-secondary)" }}
      >
        {expanded ? content : short}
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
          className="text-xs px-2 py-1 rounded font-mono"
          style={{ background: "rgba(239,68,68,0.15)", color: "var(--danger)", border: "1px solid rgba(239,68,68,0.3)" }}
        >
          Yes
        </button>
        <button
          onClick={() => setConfirm(false)}
          className="text-xs px-2 py-1 rounded font-mono"
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
      className="text-xs px-3 py-1.5 rounded-lg font-mono hover:opacity-80"
      style={{ background: "rgba(239,68,68,0.08)", color: "var(--danger)", border: "1px solid rgba(239,68,68,0.2)" }}
    >
      Delete
    </button>
  );
}
