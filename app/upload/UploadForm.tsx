"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = "presigning" | "uploading" | "registering" | "generating";

interface GeneratedCaption {
  id: string;
  content: string;
  [key: string]: unknown;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ACCEPTED_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
];

const API_BASE = "https://api.almostcrackd.ai/pipeline";

const STEP_LABELS: Record<Step, string> = {
  presigning:  "Getting upload slot…",
  uploading:   "Uploading your image…",
  registering: "Registering image…",
  generating:  "Generating captions…",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function UploadForm() {
  const [file, setFile]                       = useState<File | null>(null);
  const [preview, setPreview]                 = useState<string | null>(null);
  const [loading, setLoading]                 = useState(false);
  const [error, setError]                     = useState<string | null>(null);
  const [step, setStep]                       = useState<Step | null>(null);
  const [captions, setCaptions]               = useState<GeneratedCaption[] | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ─── Handlers ───────────────────────────────────────────────────────────────

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    const selected = e.target.files?.[0] ?? null;

    if (!selected) {
      setFile(null);
      setPreview(null);
      return;
    }

    if (!ACCEPTED_TYPES.includes(selected.type)) {
      setError("Unsupported file type. Please upload a JPEG, PNG, WebP, GIF, or HEIC image.");
      setFile(null);
      setPreview(null);
      return;
    }

    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setError(null);
    const dropped = e.dataTransfer.files?.[0] ?? null;

    if (!dropped) return;

    if (!ACCEPTED_TYPES.includes(dropped.type)) {
      setError("Unsupported file type. Please upload a JPEG, PNG, WebP, GIF, or HEIC image.");
      return;
    }

    setFile(dropped);
    setPreview(URL.createObjectURL(dropped));
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
  }

  function handleRemove() {
    setFile(null);
    setPreview(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleReset() {
    setFile(null);
    setPreview(null);
    setError(null);
    setCaptions(null);
    setUploadedImageUrl(null);
    setStep(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleUpload() {
    if (!file) return;

    setLoading(true);
    setError(null);
    setCaptions(null);
    setUploadedImageUrl(null);

    try {
      // ── Auth ──────────────────────────────────────────────────────────────
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("Session expired. Please log in again.");
      }
      const auth = { Authorization: `Bearer ${session.access_token}` };

      // ── Step 1: Generate Presigned URL ────────────────────────────────────
      setStep("presigning");
      const r1 = await fetch(`${API_BASE}/generate-presigned-url`, {
        method: "POST",
        headers: { ...auth, "Content-Type": "application/json" },
        body: JSON.stringify({ contentType: file.type }),
      });
      if (!r1.ok) {
        const msg = await r1.text().catch(() => "");
        throw new Error(`Failed to get upload URL (step 1).${msg ? " " + msg : ""}`);
      }
      const { presignedUrl, cdnUrl } = await r1.json();
      setUploadedImageUrl(cdnUrl);

      // ── Step 2: Upload image bytes to S3 ──────────────────────────────────
      setStep("uploading");
      const r2 = await fetch(presignedUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!r2.ok) {
        throw new Error(`Image upload failed (step 2). Status: ${r2.status}`);
      }

      // ── Step 3: Register image URL in the pipeline ────────────────────────
      setStep("registering");
      const r3 = await fetch(`${API_BASE}/upload-image-from-url`, {
        method: "POST",
        headers: { ...auth, "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: cdnUrl, isCommonUse: false }),
      });
      if (!r3.ok) {
        const msg = await r3.text().catch(() => "");
        throw new Error(`Failed to register image (step 3).${msg ? " " + msg : ""}`);
      }
      const { imageId } = await r3.json();

      // ── Step 4: Generate captions ─────────────────────────────────────────
      setStep("generating");
      const r4 = await fetch(`${API_BASE}/generate-captions`, {
        method: "POST",
        headers: { ...auth, "Content-Type": "application/json" },
        body: JSON.stringify({ imageId }),
      });
      if (!r4.ok) {
        const msg = await r4.text().catch(() => "");
        throw new Error(`Caption generation failed (step 4).${msg ? " " + msg : ""}`);
      }
      const generated: GeneratedCaption[] = await r4.json();
      setCaptions(generated);

    } catch (err: any) {
      setError(err.message ?? "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
      setStep(null);
    }
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* ── Drop zone ────────────────────────────────────────────────────── */}
      <motion.div
        onClick={() => !loading && inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        animate={{
          borderColor: file ? "#22c55e" : "#374151",
          background: file ? "#0d1f14" : "#111",
        }}
        whileHover={{ borderColor: file ? "#22c55e" : "#4b5563" }}
        transition={{ duration: 0.2 }}
        style={{
          border: "2px dashed",
          borderRadius: 16,
          padding: 32,
          textAlign: "center",
          cursor: loading ? "not-allowed" : "pointer",
          minHeight: 220,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(",")}
          onChange={handleFileChange}
          disabled={loading}
          style={{ display: "none" }}
        />

        <AnimatePresence mode="wait">
          {preview ? (
            <motion.div
              key="preview"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}
            >
              <img
                src={preview}
                alt="Preview"
                style={{ maxHeight: 200, maxWidth: "100%", borderRadius: 10, objectFit: "contain" }}
              />
              <p style={{ color: "#9ef5c3", fontSize: 13 }}>
                {file?.name}&nbsp;·&nbsp;{file ? (file.size / 1024).toFixed(1) + " KB" : ""}
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="placeholder"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}
            >
              <svg
                width={40} height={40} viewBox="0 0 24 24"
                fill="none" stroke="#4b5563" strokeWidth={1.5}
                strokeLinecap="round" strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <p style={{ color: "#6b7280", fontSize: 15 }}>
                Drag &amp; drop or{" "}
                <span style={{ color: "#9ef5c3", textDecoration: "underline" }}>browse</span>
              </p>
              <p style={{ color: "#4b5563", fontSize: 12 }}>JPEG · PNG · WebP · GIF · HEIC</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── Error message ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            style={{
              background: "#2d0a0a",
              border: "1px solid #7f1d1d",
              borderRadius: 10,
              padding: "12px 16px",
              color: "#fca5a5",
              fontSize: 14,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span style={{ fontSize: 16 }}>⚠</span>
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Loading skeleton ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ display: "flex", flexDirection: "column", gap: 10 }}
          >
            <p style={{ color: "#6b7280", fontSize: 13, textAlign: "center" }}>
              {step ? STEP_LABELS[step] : "Working…"}
            </p>
            {[100, 80, 60].map((w, i) => (
              <motion.div
                key={i}
                animate={{ opacity: [0.3, 0.7, 0.3] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.15 }}
                style={{
                  height: 14,
                  width: `${w}%`,
                  background: "#1f2937",
                  borderRadius: 6,
                  alignSelf: "flex-start",
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Action buttons ────────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: 10 }}>
        {file && !loading && (
          <motion.button
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={handleRemove}
            style={{
              flex: "0 0 auto",
              padding: "12px 20px",
              borderRadius: 10,
              border: "1px solid #374151",
              background: "transparent",
              color: "#9ca3af",
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Remove
          </motion.button>
        )}

        <button
          onClick={handleUpload}
          disabled={!file || loading}
          style={{
            flex: 1,
            padding: "12px 24px",
            borderRadius: 10,
            border: "none",
            background: !file || loading ? "#1f2937" : "#22c55e",
            color: !file || loading ? "#4b5563" : "#000",
            fontSize: 15,
            fontWeight: 600,
            cursor: !file || loading ? "not-allowed" : "pointer",
            transition: "background 0.2s, color 0.2s",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          {loading ? (
            <>
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                style={{ display: "inline-block", fontSize: 16 }}
              >
                ⟳
              </motion.span>
              {step ? STEP_LABELS[step] : "Working…"}
            </>
          ) : (
            "Generate Captions"
          )}
        </button>
      </div>

      {/* ── Generated Captions (success UI) ──────────────────────────────── */}
      <AnimatePresence>
        {captions !== null && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 8 }}
          >
            {/* Section header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h2 style={{ color: "#9ef5c3", fontSize: 18, fontWeight: 600, margin: 0 }}>
                Generated Captions
              </h2>
              <button
                onClick={handleReset}
                style={{
                  background: "transparent",
                  border: "1px solid #374151",
                  borderRadius: 8,
                  color: "#9ca3af",
                  fontSize: 13,
                  padding: "6px 14px",
                  cursor: "pointer",
                }}
              >
                Upload another
              </button>
            </div>

            {/* Uploaded image thumbnail */}
            {uploadedImageUrl && (
              <img
                src={uploadedImageUrl}
                alt="Uploaded"
                style={{
                  width: "100%",
                  maxHeight: 200,
                  objectFit: "cover",
                  borderRadius: 12,
                  border: "1px solid #22c55e33",
                }}
              />
            )}

            {/* Caption cards */}
            {captions.length === 0 ? (
              <p style={{ color: "#6b7280", fontSize: 14 }}>
                No captions were generated. Try a different image.
              </p>
            ) : (
              captions.map((caption, i) => (
                <motion.div
                  key={caption.id ?? i}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.07 }}
                  style={{
                    background: "#0d1f14",
                    border: "1px solid #22c55e33",
                    borderRadius: 12,
                    padding: "14px 18px",
                  }}
                >
                  <p style={{ color: "#fff", fontSize: 14, lineHeight: 1.6, margin: 0 }}>
                    {caption.content}
                  </p>
                </motion.div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
