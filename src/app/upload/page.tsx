import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import UploadForm from "./UploadForm";

export default async function UploadPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main
      style={{
        minHeight: "calc(100vh - 60px)",
        padding: "48px 40px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div style={{ width: "100%", maxWidth: 540 }}>
        <h1
          style={{
            fontSize: 40,
            fontWeight: 600,
            marginBottom: 8,
            letterSpacing: "-0.02em",
            lineHeight: 1.1,
          }}
        >
          Upload an Image
        </h1>
        <p
          style={{
            fontSize: 15,
            color: "#6b7280",
            marginBottom: 40,
            lineHeight: 1.6,
          }}
        >
          Upload a photo and we&apos;ll generate captions for it.
        </p>
        <UploadForm />
      </div>
    </main>
  );
}
