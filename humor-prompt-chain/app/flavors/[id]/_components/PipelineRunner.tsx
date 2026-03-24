"use client";

import { useState, useRef, useCallback } from "react";

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
  const [imgError, setImgError] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("이미지 파일만 업로드 가능합니다.");
      return;
    }
    setUploading(true);
    setError("");
    setImgError(false);
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/upload-image", { method: "POST", body: form });
    const data = await res.json();
    setUploading(false);
    if (!res.ok) {
      setError(data.error || "Upload failed");
      return;
    }
    setImageUrl(data.url);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  }, [uploadFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => setDragOver(false), []);

  const hasSteps = steps.length > 0;

  async function handleRun(e: React.FormEvent) {
    e.preventDefault();
    if (!imageUrl.trim() || running) return;

    setRunning(true);
    setError("");
    setFinalCaptions([]);
    setRan(false);
    setImgError(false);
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

    const rawSteps: any[] = data.steps ?? [];
    for (let i = 0; i < steps.length; i++) {
      setStepResults((prev) =>
        prev.map((r, ri) => (ri === i ? { ...r, status: "running" } : r))
      );
      await new Promise((r) => setTimeout(r, 400));

      const output = rawSteps[i]?.output ?? "";
      setStepResults((prev) =>
        prev.map((r, ri) => (ri === i ? { ...r, status: "done", output } : r))
      );
      await new Promise((r) => setTimeout(r, 200));
    }

    setFinalCaptions(data.captions ?? []);
    setRan(true);
    setRunning(false);
  }

  function handleReset() {
    setStepResults([]);
    setFinalCaptions([]);
    setError("");
    setRan(false);
    setRunning(false);
    setImgError(false);
    setUploading(false);
    setImageUrl("");
  }

  const lastDoneIdx = stepResults.reduceRight(
    (found, r, i) => (found === -1 && r.status === "done" ? i : found),
    -1
  );
  const displayResult = lastDoneIdx >= 0 ? stepResults[lastDoneIdx] : null;
  const displayStepInfo = lastDoneIdx >= 0 ? steps[lastDoneIdx] : null;

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        backgroundColor: "var(--bg-card)",
        border: "1px solid var(--border-accent)",
        boxShadow: "0 0 60px rgba(245,158,11,0.06), 0 8px 32px rgba(0,0,0,0.12)",
      }}
    >
      {/* Header */}
      <div
        className="px-8 py-5 flex items-center justify-between"
        style={{
          background: "linear-gradient(135deg, rgba(245,158,11,0.1), rgba(249,115,22,0.04))",
          borderBottom: "1px solid var(--border-accent)",
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold"
            style={{ background: "linear-gradient(135deg, #f59e0b, #f97316)", color: "#0f172a" }}
          >
            ▶
          </div>
          <div>
            <p className="text-xs font-mono uppercase tracking-widest" style={{ color: "var(--accent)" }}>
              Run Pipeline
            </p>
            <p className="text-sm font-bold font-mono mt-0.5" style={{ color: "var(--text-primary)" }}>
              {flavorSlug}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {!hasSteps && (
            <span
              className="text-xs px-3 py-1.5 rounded-full font-mono"
              style={{
                background: "rgba(245,158,11,0.08)",
                color: "var(--accent)",
                border: "1px solid rgba(245,158,11,0.2)",
              }}
            >
              ⚠ Add steps below first
            </span>
          )}
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
      </div>

      <div className="p-8">
        {/* Image Section */}
        <form onSubmit={handleRun}>
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(f); e.target.value = ""; }}
          />

          {/* Drop zone */}
          <div
            className="rounded-2xl mb-4 flex items-center justify-center overflow-hidden cursor-pointer transition-all duration-200"
            style={{
              minHeight: 220,
              background: dragOver
                ? "rgba(245,158,11,0.06)"
                : imageUrl && !imgError
                  ? "var(--bg-base)"
                  : `repeating-linear-gradient(-45deg, transparent, transparent 12px, rgba(245,158,11,0.025) 12px, rgba(245,158,11,0.025) 24px)`,
              border: dragOver
                ? "2px dashed rgba(245,158,11,0.6)"
                : imageUrl && !imgError
                  ? "2px solid rgba(245,158,11,0.25)"
                  : "2px dashed rgba(245,158,11,0.18)",
              boxShadow: dragOver ? "0 0 30px rgba(245,158,11,0.12)" : "none",
            }}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => !running && !uploading && fileInputRef.current?.click()}
          >
            {uploading ? (
              <div className="text-center px-8 py-10 select-none">
                <span
                  className="inline-block w-8 h-8 rounded-full border-2 border-current border-t-transparent mb-4"
                  style={{ animation: "spin 0.7s linear infinite", color: "var(--accent)" }}
                />
                <p className="text-sm font-medium" style={{ color: "var(--accent)" }}>Uploading…</p>
              </div>
            ) : imageUrl && !imgError ? (
              <div className="relative w-full h-full flex items-center justify-center group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageUrl}
                  alt="preview"
                  className="max-h-72 max-w-full object-contain"
                  onError={() => setImgError(true)}
                />
                <div
                  className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"
                  style={{ background: "rgba(0,0,0,0.45)" }}
                >
                  <p className="text-sm font-medium text-white">클릭하여 이미지 교체</p>
                </div>
              </div>
            ) : (
              <div className="text-center px-8 py-10 select-none pointer-events-none">
                <div className="text-5xl mb-4" style={{ opacity: dragOver ? 0.5 : 0.2 }}>
                  {dragOver ? "⬇️" : "🖼"}
                </div>
                <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
                  {imgError
                    ? "이미지를 불러올 수 없습니다 — URL을 확인하세요"
                    : dragOver
                      ? "여기에 놓으세요"
                      : "이미지를 드래그하거나 클릭해서 업로드"}
                </p>
                <p className="text-xs mt-1.5" style={{ color: "var(--text-muted)", opacity: 0.6 }}>
                  또는 아래에 URL 붙여넣기 · 최대 10MB
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <input
              type="text"
              value={imageUrl}
              onChange={(e) => { setImageUrl(e.target.value); setImgError(false); }}
              placeholder="https://example.com/image.jpg"
              disabled={running || uploading}
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
              disabled={!imageUrl.trim() || running || uploading || !hasSteps}
              className="flex items-center gap-2.5 px-8 py-3 rounded-xl font-bold text-sm transition-all hover:opacity-90 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: "linear-gradient(135deg, #f59e0b, #f97316)",
                color: "#0f172a",
                minWidth: 168,
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
        </form>

        {/* Error */}
        {error && (
          <div
            className="rounded-xl px-5 py-4 mt-6 text-sm"
            style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "var(--danger)" }}
          >
            {error}
          </div>
        )}

        {/* Pipeline Progress */}
        {stepResults.length > 0 && (
          <div className="mt-8">
            <p className="text-xs font-mono uppercase tracking-widest mb-5" style={{ color: "var(--text-muted)" }}>
              Pipeline Progress
            </p>

            <div className="flex items-start gap-2 flex-wrap">
              {steps.map((step, i) => {
                const result = stepResults[i];
                const status = result?.status ?? "idle";

                return (
                  <div key={step.id} className="flex items-center gap-2">
                    <div
                      className="flex flex-col items-center gap-2 px-4 py-4 rounded-2xl transition-all duration-300"
                      style={{
                        minWidth: 100,
                        backgroundColor:
                          status === "done" ? "rgba(52,211,153,0.07)"
                          : status === "running" ? "rgba(245,158,11,0.09)"
                          : "var(--bg-base)",
                        border:
                          status === "done" ? "1px solid rgba(52,211,153,0.3)"
                          : status === "running" ? "1px solid rgba(245,158,11,0.5)"
                          : "1px solid var(--border)",
                        boxShadow: status === "running" ? "0 0 24px rgba(245,158,11,0.15)" : "none",
                      }}
                    >
                      <div className="w-6 h-6 flex items-center justify-center">
                        {status === "idle" && (
                          <div className="w-2.5 h-2.5 rounded-full" style={{ background: "var(--border)", opacity: 0.6 }} />
                        )}
                        {status === "running" && (
                          <span
                            className="inline-block w-5 h-5 rounded-full border-2 border-current border-t-transparent"
                            style={{ animation: "spin 0.7s linear infinite", color: "var(--accent)" }}
                          />
                        )}
                        {status === "done" && (
                          <div
                            className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                            style={{ background: "rgba(52,211,153,0.15)", color: "#34d399", border: "1px solid rgba(52,211,153,0.35)" }}
                          >
                            ✓
                          </div>
                        )}
                        {status === "error" && (
                          <div
                            className="w-5 h-5 rounded-full flex items-center justify-center text-xs"
                            style={{ background: "rgba(239,68,68,0.12)", color: "var(--danger)" }}
                          >
                            ✗
                          </div>
                        )}
                      </div>

                      <span className="text-2xl leading-none">{stepIcon(step.description)}</span>

                      <span
                        className="text-xs text-center leading-tight font-medium"
                        style={{
                          color:
                            status === "done" ? "#34d399"
                            : status === "running" ? "var(--accent)"
                            : "var(--text-muted)",
                          maxWidth: 88,
                        }}
                      >
                        {step.description ?? `Step ${i + 1}`}
                      </span>
                    </div>

                    {i < steps.length - 1 && (
                      <span className="text-xl shrink-0" style={{ color: "rgba(245,158,11,0.3)" }}>→</span>
                    )}
                  </div>
                );
              })}
            </div>

            {displayResult?.output && (
              <div
                className="mt-5 rounded-xl p-5"
                style={{ backgroundColor: "var(--bg-base)", border: "1px solid var(--border)" }}
              >
                <p className="text-xs font-mono uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
                  {displayStepInfo?.description ?? "Step"} · output
                </p>
                <p
                  className="text-sm font-mono whitespace-pre-wrap leading-relaxed"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {displayResult.output}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Final Captions */}
        {finalCaptions.length > 0 && (
          <div
            className="mt-6 rounded-2xl overflow-hidden"
            style={{
              border: "1px solid rgba(245,158,11,0.3)",
              background: "linear-gradient(135deg, rgba(245,158,11,0.06), rgba(249,115,22,0.03))",
            }}
          >
            <div
              className="px-6 py-4 flex items-center gap-3"
              style={{ borderBottom: "1px solid rgba(245,158,11,0.15)" }}
            >
              <span className="text-xl">✍️</span>
              <p className="text-base font-bold" style={{ color: "var(--accent)" }}>
                Generated Captions
              </p>
              <span
                className="ml-auto text-xs font-mono px-2.5 py-1 rounded-full font-bold"
                style={{ background: "rgba(245,158,11,0.15)", color: "var(--accent)" }}
              >
                {finalCaptions.length}
              </span>
            </div>

            <div className="p-5 space-y-3">
              {finalCaptions.map((caption, i) => (
                <div
                  key={i}
                  className="flex items-start gap-4 p-4 rounded-xl"
                  style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)" }}
                >
                  <span
                    className="text-sm font-mono font-bold shrink-0 mt-0.5"
                    style={{ color: "var(--accent)", minWidth: 20 }}
                  >
                    {i + 1}.
                  </span>
                  <p className="text-sm italic leading-relaxed" style={{ color: "var(--text-primary)" }}>
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
