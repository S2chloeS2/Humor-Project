import Link from "next/link";

export default function Home() {
  return (
    <main
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "calc(100vh - 60px)",
        padding: "0 24px",
        textAlign: "center",
      }}
    >
      {/* Eyebrow pill */}
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 7,
          background: "#0d1f14",
          border: "1px solid rgba(34,197,94,0.25)",
          borderRadius: 20,
          padding: "5px 14px",
          marginBottom: 36,
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "#22c55e",
            display: "inline-block",
            flexShrink: 0,
          }}
        />
        <span
          style={{
            color: "#9ef5c3",
            fontSize: 12,
            fontWeight: 500,
            letterSpacing: "0.04em",
          }}
        >
          AI-Powered Humor
        </span>
      </div>

      {/* Headline */}
      <h1
        style={{
          fontSize: "clamp(36px, 6vw, 64px)",
          fontWeight: 600,
          lineHeight: 1.1,
          letterSpacing: "-0.02em",
          marginBottom: 20,
          maxWidth: 640,
        }}
      >
        Captions that actually{" "}
        <span style={{ color: "#22c55e" }}>make you laugh</span>
      </h1>

      {/* Subheading */}
      <p
        style={{
          fontSize: 17,
          color: "#6b7280",
          lineHeight: 1.7,
          maxWidth: 460,
          marginBottom: 44,
        }}
      >
        Upload a photo, get AI-generated captions, and let the community vote
        on the funniest ones.
      </p>

      {/* CTA row */}
      <div
        style={{
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        <Link
          href="/list"
          style={{
            padding: "13px 28px",
            borderRadius: 10,
            background: "#22c55e",
            color: "#000",
            fontWeight: 600,
            fontSize: 15,
            textDecoration: "none",
            display: "inline-block",
            transition: "opacity 0.15s",
          }}
        >
          Browse Captions
        </Link>
        <Link
          href="/upload"
          style={{
            padding: "13px 28px",
            borderRadius: 10,
            background: "transparent",
            border: "1px solid #374151",
            color: "#9ca3af",
            fontWeight: 500,
            fontSize: 15,
            textDecoration: "none",
            display: "inline-block",
            transition: "border-color 0.15s, color 0.15s",
          }}
        >
          Upload Image
        </Link>
      </div>
    </main>
  );
}
