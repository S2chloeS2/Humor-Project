"use client";

import { useState } from "react";

// Sample test images from the test set
const TEST_IMAGES = [
  { label: "Test Image 1", url: "" },
  { label: "Custom URL", url: "" },
];

export default function TestFlavor({ flavorId, flavorSlug }: { flavorId: string; flavorSlug: string }) {
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  async function handleTest(e: React.FormEvent) {
    e.preventDefault();
    if (!imageUrl.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);

    const res = await fetch("/api/test-flavor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ flavorId, flavorSlug, imageUrl: imageUrl.trim() }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Failed to generate captions");
    } else {
      setResult(data);
    }

    setLoading(false);
  }

  return (
    <div className="space-y-4">
      <div
        className="rounded-xl p-6"
        style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)" }}
      >
        <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
          Test Humor Flavor: <span style={{ color: "var(--accent)" }}>{flavorSlug}</span>
        </h2>

        <form onSubmit={handleTest} className="space-y-4">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider mb-1.5" style={{ color: "var(--text-muted)" }}>
              Image URL *
            </label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
              required
              className="w-full px-3 py-2 rounded-lg text-sm outline-none"
              style={{ backgroundColor: "var(--bg-base)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
            />
          </div>

          {/* Preview */}
          {imageUrl && (
            <div className="rounded-lg overflow-hidden" style={{ border: "1px solid var(--border)", maxWidth: 280 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt="Preview"
                className="w-full h-40 object-cover"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
              />
            </div>
          )}

          {error && (
            <div
              className="p-3 rounded-lg text-sm"
              style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "var(--danger)" }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !imageUrl.trim()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #f59e0b, #f97316)", color: "#0f172a" }}
          >
            {loading ? (
              <>
                <span className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Generating...
              </>
            ) : (
              "▶ Generate Captions"
            )}
          </button>
        </form>
      </div>

      {/* Results */}
      {result && (
        <div
          className="rounded-xl p-6 animate-fade-up"
          style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-accent)" }}
        >
          <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
            Generated Captions
          </h3>

          {/* Step outputs */}
          {result.steps && result.steps.length > 0 && (
            <div className="space-y-3 mb-4">
              {result.steps.map((step: any, i: number) => (
                <div
                  key={i}
                  className="rounded-lg p-3"
                  style={{ backgroundColor: "var(--bg-base)", border: "1px solid var(--border)" }}
                >
                  <p className="text-xs font-mono uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>
                    Step {i + 1} Output
                  </p>
                  <p className="text-sm whitespace-pre-wrap" style={{ color: "var(--text-secondary)" }}>
                    {step.output}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Final captions */}
          {result.captions && result.captions.length > 0 && (
            <div>
              <p className="text-xs font-mono uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
                Final Captions
              </p>
              <div className="space-y-2">
                {result.captions.map((caption: string, i: number) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-3 rounded-lg"
                    style={{ backgroundColor: "var(--bg-base)", border: "1px solid rgba(245,158,11,0.15)" }}
                  >
                    <span
                      className="text-xs font-mono font-bold shrink-0 mt-0.5"
                      style={{ color: "var(--accent)" }}
                    >
                      {i + 1}.
                    </span>
                    <p className="text-sm" style={{ color: "var(--text-primary)" }}>{caption}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Raw response fallback */}
          {!result.captions && !result.steps && (
            <pre
              className="text-xs font-mono whitespace-pre-wrap overflow-auto p-3 rounded-lg"
              style={{ backgroundColor: "var(--bg-base)", color: "var(--text-secondary)", border: "1px solid var(--border)", maxHeight: 400 }}
            >
              {JSON.stringify(result, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
