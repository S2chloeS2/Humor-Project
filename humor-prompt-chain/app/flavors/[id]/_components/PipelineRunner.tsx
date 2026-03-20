"use client";

import { useState, useRef } from "react";

interface Step {
  id: string;
  order_by: number;
  description: string | null;
  llm_system_prompt: string | null;
  llm_user_prompt: string | null;
  llm_temperature: number | null;
  humor_flavor_id: string;
}

type StepStatus = "idle" | "running" | "done" | "error";

interface StepResult {
  stepId: string;
  status: StepStatus;
  output?: string;
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

export default function PipelineRunner({
  flavorId,
  flavorSlug,
  steps,
}: {
  flavorId: string;
  flavorSlug: string;
  steps: Step[];
}) {
  const [imageUrl, setImageUrl] = useState("");
  const [running, setRunning] = useState(false);
  const [stepResults, setStepResults] = useState<StepResult[]>([]);
  const [finalCaptions, setFinalCaptions] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [ran, setRan] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const hasSteps = steps.length > 0;

  async function handleRun(e: React.FormEvent) {
    e.preventDefault();
    if (!imageUrl.trim() || running) return;

    setRunning(true);
    setError("");
    setFinalCaptions([]);
    setRan(false);

    // Init all steps as idle
    setStepResults(steps.map((s) => ({ stepId: s.id, status: "idle" })));

    const res = await fetch("/api/test-flavor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ flavorId, flavorSlug, imageUrl: imageUrl.trim() }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Pipeline failed");
      setStepResults(steps.map((s) => ({ stepId: s.id, status: "error" })));
      setRunning(false);
      return;
    }

    // Animate results arriving step by step
    const rawSteps: any[] = data.steps ?? [];
    for (let i = 0; i < steps.length; i++) {
      // Mark current step running
      setStepResults((prev) =>
        prev.map((r, ri) => (ri === i ? { ...r, status: "running" } : r))
      );
      await new Promise((r) => setTimeout(r, 350));

      // Mark done with output
      const output = rawSteps[i]?.output ?? "";
      setStepResults((prev) =>
        prev.map((r, ri) =>
          ri === i ? { ...r, status: "done", output } : r
        )
      );
      await new Promise((r) => setTimeout(r, 200));
    }

    // Show final captions
    const captions: string[] = data.captions ?? [];
    setFinalCaptions(captions);
    setRan(true);
    setRunning(false);
  }

  function handleReset() {
    setStepResults([]);
    setFinalCaptions([]);
    setError("");
    setRan(false);
    setRunning(false);
  }

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        backgroundColor: "var(--bg-card)",
        border: "1px solid var(--border-accent)",
        boxShadow: "0 0 48px rgba(245,158,11,0.05)",
      }}
    >
      {/* ── Header bar ──────────────────────────────── */}
      <div
        className="px-6 py-4 flex items-center justify-between"
        style={{
          background: "linear-gradient(135deg, rgba(245,158,11,0.08), rgba(249,115,22,0.04))",
          borderBottom: "1px solid var(--border-accent)",
        }}
      >
        <div>
          <p className="text-xs font-mono uppercase tracking-widest" style={{ color: "var(--accent)" }}>
            ▶ Run Pipeline
          </p>
          <p className="text-sm font-semibold mt-0.5" style={{ color: "var(--text-primary)" }}>
            {flavorSlug}
          </p>
        </div>
        {ran && (
          <button
            onClick={handleReset}
            className="text-xs font-mono px-3 py-1.5 rounded-lg transition-all hover:opacity-80"
            style={{ border: "1px solid var(--border)", color: "var(--text-muted)", background: "transparent" }}
          >
            ↺ Reset
          </button>
        )}
      </div>

      <div className="p-6">
        {/* ── No steps warning ──────────────────────── */}
        {!hasSteps && (
          <div
            className="rounded-xl p-4 mb-5 flex items-center gap-3"
            style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)" }}
          >
            <span className="text-lg">⚠️</span>
            <p className="text-sm" style={{ color: "var(--accent)" }}>
              Add steps to the pipeline below before running.
            </p>
          </div>
        )}

        {/* ── Image input ───────────────────────────── */}
        <form onSubmit={handleRun} className="mb-6">
          <label className="block text-xs font-mono uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>
            Image URL
          </label>
          <div className="flex gap-3">
            <input
              ref={inputRef}
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
              required
              disabled={running}
              className="flex-1 px-4 py-3 rounded-xl text-sm outline-none transition-all"
              style={{
                backgroundColor: "var(--bg-base)",
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
              }}
              onFocus={(e) => { (e.target as HTMLInputElement).style.border = "1px solid var(--border-accent)"; }}
              onBlur={(e) => { (e.target as HTMLInputElement).style.border = "1px solid var(--border)"; }}
            />
            <button
              type="submit"
              disabled={!imageUrl.trim() || running || !hasSteps}
              className="flex items-center gap-2.5 px-6 py-3 rounded-xl font-bold text-sm transition-all hover:opacity-90 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: "linear-gradient(135deg, #f59e0b, #f97316)",
                color: "#0f172a",
                minWidth: 148,
                justifyContent: "center",
              }}
            >
              {running ? (
                <>
                  <span
                    className="inline-block w-4 h-4 rounded-full border-2 border-current border-t-transparent"
                    style={{ animation: "spin 0.7s linear infinite" }}
                  />
                  Running…
                </>
              ) : (
                <>▶ Run Pipeline</>
              )}
            </button>
          </div>

          {/* Image preview */}
          {imageUrl && (
            <div className="mt-3 flex items-start gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt="preview"
                className="w-20 h-20 object-cover rounded-xl"
                style={{ border: "1px solid var(--border)" }}
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
              />
              <p className="text-xs font-mono mt-1" style={{ color: "var(--text-muted)" }}>
                Preview · will be processed through {steps.length} step{steps.length !== 1 ? "s" : ""}
              </p>
            </div>
          )}
        </form>

        {/* ── Error ─────────────────────────────────── */}
        {error && (
          <div
            className="rounded-xl p-4 mb-4 text-sm"
            style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "var(--danger)" }}
          >
            {error}
          </div>
        )}

        {/* ── Step-by-step results ──────────────────── */}
        {stepResults.length > 0 && (
          <div className="space-y-3 mb-5">
            {steps.map((step, i) => {
              const result = stepResults[i];
              const status = result?.status ?? "idle";

              return (
                <div key={step.id}>
                  <div
                    className="rounded-xl overflow-hidden transition-all duration-300"
                    style={{
                      border: status === "running"
                        ? "1px solid rgba(245,158,11,0.5)"
                        : status === "done"
                        ? "1px solid rgba(52,211,153,0.3)"
                        : "1px solid var(--border)",
                      backgroundColor: "var(--bg-base)",
                    }}
                  >
                    {/* Step header */}
                    <div
                      className="flex items-center gap-3 px-4 py-3"
                      style={{
                        background: status === "running"
                          ? "linear-gradient(135deg, rgba(245,158,11,0.08), transparent)"
                          : status === "done"
                          ? "linear-gradient(135deg, rgba(52,211,153,0.06), transparent)"
                          : "transparent",
                      }}
                    >
                      {/* Status indicator */}
                      <div className="shrink-0 w-6 h-6 flex items-center justify-center">
                        {status === "idle" && (
                          <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-mono font-bold"
                            style={{ border: "1px solid var(--border)", color: "var(--text-muted)" }}>
                            {i + 1}
                          </div>
                        )}
                        {status === "running" && (
                          <span
                            className="inline-block w-5 h-5 rounded-full border-2 border-current border-t-transparent"
                            style={{ animation: "spin 0.7s linear infinite", color: "var(--accent)" }}
                          />
                        )}
                        {status === "done" && (
                          <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs"
                            style={{ background: "rgba(52,211,153,0.15)", color: "#34d399", border: "1px solid rgba(52,211,153,0.3)" }}>
                            ✓
                          </div>
                        )}
                        {status === "error" && (
                          <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs"
                            style={{ background: "rgba(239,68,68,0.12)", color: "var(--danger)" }}>
                            ✗
                          </div>
                        )}
                      </div>

                      <span className="text-base">{stepIcon(step.description)}</span>
                      <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                        {step.description ?? `Step ${i + 1}`}
                      </span>
                      {status === "running" && (
                        <span className="text-xs font-mono ml-auto" style={{ color: "var(--accent)" }}>processing…</span>
                      )}
                      {status === "done" && (
                        <span className="text-xs font-mono ml-auto" style={{ color: "#34d399" }}>done</span>
                      )}
                    </div>

                    {/* Output */}
                    {status === "done" && result?.output && (
                      <div
                        className="px-4 pb-4 pt-1 text-sm font-mono whitespace-pre-wrap"
                        style={{ color: "var(--text-secondary)", borderTop: "1px solid var(--border)" }}
                      >
                        {result.output}
                      </div>
                    )}
                  </div>

                  {/* Arrow between steps */}
                  {i < steps.length - 1 && (
                    <div className="flex justify-center py-1">
                      <span className="text-sm" style={{ color: "rgba(245,158,11,0.4)" }}>↓</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── Final captions ────────────────────────── */}
        {finalCaptions.length > 0 && (
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              border: "1px solid rgba(245,158,11,0.3)",
              background: "linear-gradient(135deg, rgba(245,158,11,0.06), rgba(249,115,22,0.03))",
            }}
          >
            <div
              className="px-5 py-3 flex items-center gap-2"
              style={{ borderBottom: "1px solid rgba(245,158,11,0.15)" }}
            >
              <span className="text-lg">✍️</span>
              <p className="text-sm font-bold" style={{ color: "var(--accent)" }}>
                Generated Captions
              </p>
              <span
                className="ml-auto text-xs font-mono px-2 py-0.5 rounded-full"
                style={{ background: "rgba(245,158,11,0.12)", color: "var(--accent)" }}
              >
                {finalCaptions.length}
              </span>
            </div>
            <div className="p-4 space-y-2.5">
              {finalCaptions.map((caption, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-3 rounded-xl"
                  style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)" }}
                >
                  <span
                    className="text-xs font-mono font-bold shrink-0 mt-0.5 w-5 text-right"
                    style={{ color: "var(--accent)" }}
                  >
                    {i + 1}.
                  </span>
                  <p className="text-sm italic" style={{ color: "var(--text-primary)" }}>
                    "{caption}"
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
