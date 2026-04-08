"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
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
  const [file, setFile]                         = useState<File | null>(null);
  const [preview, setPreview]                   = useState<string | null>(null);
  const [loading, setLoading]                   = useState(false);
  const [error, setError]                       = useState<string | null>(null);
  const [step, setStep]                         = useState<Step | null>(null);
  const [captions, setCaptions]                 = useState<GeneratedCaption[] | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [copiedId, setCopiedId]                 = useState<number | null>(null);
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
    setCopiedId(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleCaptionCopy(text: string, index: number) {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(index);
      setTimeout(() => setCopiedId(null), 2000);
    });
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
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* ── Drop zone ────────────────────────────────────────────────────── */}
      <motion.div
        onClick={() => !loading && inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        animate={{
          borderColor: file ? "#f5c518" : "#2a2a2a",
          background: file ? "rgba(245,197,24,0.03)" : "#111",
        }}
        whileHover={{ borderColor: file ? "#f5c518" : "#3a3a3a" }}
        transition={{ duration: 0.2 }}
        style={{
          border: "1px dashed",
          borderRadius: 2,
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
                style={{
                  maxHeight: 200,
                  maxWidth: "100%",
                  objectFit: "contain",
                  filter: "grayscale(10%) contrast(1.05)",
                }}
              />
              <p
                style={{
                  fontFamily: "monospace",
                  color: "#f5c518",
                  fontSize: 11,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                }}
              >
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
                width={36} height={36} viewBox="0 0 24 24"
                fill="none" stroke="#2a2a2a" strokeWidth={1.5}
                strokeLinecap="round" strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <p style={{ color: "#3a3a3a", fontSize: 13, margin: 0 }}>
                Drag &amp; drop or{" "}
                <span style={{ color: "#f5c518", textDecoration: "underline" }}>browse</span>
              </p>
              <p
                style={{
                  fontFamily: "monospace",
                  color: "#2a2a2a",
                  fontSize: 10,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  margin: 0,
                }}
              >
                JPEG · PNG · WebP · GIF · HEIC
              </p>
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
              background: "#1a0a0a",
              border: "1px solid #5a1a1a",
              borderRadius: 2,
              padding: "12px 16px",
              color: "#fca5a5",
              fontSize: 12,
              fontFamily: "monospace",
              letterSpacing: "0.04em",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span style={{ fontSize: 14 }}>⚠</span>
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Loading state ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ display: "flex", flexDirection: "column", gap: 10 }}
          >
            <p
              style={{
                fontFamily: "monospace",
                color: "#f5c518",
                fontSize: 10,
                textAlign: "center",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
              }}
            >
              {step ? STEP_LABELS[step] : "Working…"}
            </p>
            {[100, 75, 55].map((w, i) => (
              <motion.div
                key={i}
                animate={{ opacity: [0.15, 0.5, 0.15] }}
                transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.18 }}
                style={{
                  height: 2,
                  width: `${w}%`,
                  background: "linear-gradient(90deg, #f5c518, transparent)",
                  borderRadius: 1,
                  alignSelf: "flex-start",
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Action buttons ────────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: 8 }}>
        {file && !loading && (
          <motion.button
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ borderColor: "#3a3a3a", color: "#9ca3af" }}
            onClick={handleRemove}
            style={{
              flex: "0 0 auto",
              padding: "12px 20px",
              borderRadius: 2,
              border: "1px solid #2a2a2a",
              background: "transparent",
              color: "#3a3a3a",
              fontSize: 11,
              fontFamily: "monospace",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            Remove
          </motion.button>
        )}

        <motion.button
          onClick={handleUpload}
          disabled={!file || loading}
          whileHover={file && !loading ? { background: "#e0b414" } : {}}
          whileTap={file && !loading ? { scale: 0.97 } : {}}
          transition={{ duration: 0.15 }}
          style={{
            flex: 1,
            padding: "12px 24px",
            borderRadius: 2,
            border: "none",
            background: !file || loading ? "#1a1a1a" : "#f5c518",
            color: !file || loading ? "#2a2a2a" : "#0c0c0c",
            fontSize: 11,
            fontWeight: 700,
            fontFamily: "monospace",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
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
                style={{ display: "inline-block", fontSize: 14 }}
              >
                ⟳
              </motion.span>
              {step ? STEP_LABELS[step] : "Working…"}
            </>
          ) : (
            "Generate Captions"
          )}
        </motion.button>
      </div>

      {/* ── Generated Captions ────────────────────────────────────────────── */}
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
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                paddingBottom: 16,
                borderBottom: "1px solid #1c1c1c",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 20, height: 1, background: "#f5c518" }} />
                <span
                  style={{
                    fontFamily: "monospace",
                    fontSize: 9,
                    letterSpacing: "0.24em",
                    color: "#f5c518",
                    textTransform: "uppercase",
                  }}
                >
                  Generated Captions
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Link
                  href="/list"
                  style={{
                    fontFamily: "monospace",
                    fontSize: 9,
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    color: "#f5c518",
                    textDecoration: "none",
                    border: "1px solid #f5c518",
                    borderRadius: 2,
                    padding: "6px 14px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    transition: "background 0.15s, color 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.background = "#f5c518";
                    (e.currentTarget as HTMLAnchorElement).style.color = "#0c0c0c";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
                    (e.currentTarget as HTMLAnchorElement).style.color = "#f5c518";
                  }}
                >
                  Browse Feed
                  <span style={{ fontSize: 11, fontWeight: 400 }}>↗</span>
                </Link>
                <motion.button
                  onClick={handleReset}
                  whileHover={{ borderColor: "#3a3a3a", color: "#9ca3af" }}
                  style={{
                    background: "transparent",
                    border: "1px solid #2a2a2a",
                    borderRadius: 2,
                    color: "#3a3a3a",
                    fontFamily: "monospace",
                    fontSize: 9,
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    padding: "6px 14px",
                    cursor: "pointer",
                  }}
                >
                  Upload another
                </motion.button>
              </div>
            </div>

            {/* Uploaded image thumbnail */}
            {uploadedImageUrl && (
              <div style={{ position: "relative", overflow: "hidden" }}>
                <img
                  src={uploadedImageUrl}
                  alt="Uploaded"
                  style={{
                    width: "100%",
                    maxHeight: 200,
                    objectFit: "cover",
                    display: "block",
                    filter: "grayscale(20%) contrast(1.05)",
                  }}
                />
                <div
                  aria-hidden
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "linear-gradient(to bottom, transparent 50%, rgba(12,12,12,0.9) 100%)",
                    pointerEvents: "none",
                  }}
                />
              </div>
            )}

            {/* Caption cards */}
            {captions.length === 0 ? (
              <p
                style={{
                  fontFamily: "monospace",
                  color: "#3a3a3a",
                  fontSize: 11,
                  letterSpacing: "0.1em",
                }}
              >
                No captions were generated. Try a different image.
              </p>
            ) : (
              captions.map((caption, i) => (
                <motion.div
                  key={caption.id ?? i}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.07, ease: "easeOut" }}
                  style={{
                    background: "#0e0e0e",
                    border: "1px solid #1c1c1c",
                    borderRadius: 2,
                    padding: "16px 18px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                  }}
                >
                  {/* Card header: number + copy button */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span
                      style={{
                        fontFamily: "monospace",
                        fontSize: 9,
                        letterSpacing: "0.1em",
                        color: "#2a2a2a",
                        textTransform: "uppercase",
                      }}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <motion.button
                      onClick={() => handleCaptionCopy(caption.content, i)}
                      whileHover={{ borderColor: "#f5c518", color: "#f5c518" }}
                      whileTap={{ scale: 0.9 }}
                      transition={{ duration: 0.15 }}
                      style={{
                        background: "transparent",
                        border: `1px solid ${copiedId === i ? "#f5c518" : "#2a2a2a"}`,
                        borderRadius: 2,
                        color: copiedId === i ? "#f5c518" : "#3a3a3a",
                        fontFamily: "monospace",
                        fontSize: 9,
                        letterSpacing: "0.16em",
                        textTransform: "uppercase",
                        padding: "4px 10px",
                        cursor: "pointer",
                        transition: "border-color 0.15s, color 0.15s",
                      }}
                    >
                      {copiedId === i ? "Copied!" : "Copy"}
                    </motion.button>
                  </div>
                  <p
                    style={{
                      color: "#c8c4bc",
                      fontSize: 13,
                      lineHeight: 1.65,
                      margin: 0,
                      fontStyle: "italic",
                    }}
                  >
                    "{caption.content}"
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
