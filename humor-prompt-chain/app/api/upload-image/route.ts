import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

const API_BASE = "https://api.almostcrackd.ai";

export async function POST(request: Request) {
  // Auth check
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (!user || userError) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("is_superadmin, is_matrix_admin")
    .eq("id", user.id)
    .single();
  if (!profile?.is_superadmin && !profile?.is_matrix_admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get JWT token
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData?.session?.access_token;
  if (!token) return NextResponse.json({ error: "No session token" }, { status: 401 });

  // Parse multipart form
  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "File must be an image" }, { status: 400 });
  }

  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 });
  }

  // Step 1: Get presigned upload URL
  const presignedRes = await fetch(`${API_BASE}/pipeline/generate-presigned-url`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ contentType: file.type }),
  });

  if (!presignedRes.ok) {
    const err = await presignedRes.text();
    return NextResponse.json({ error: `Presigned URL error: ${err}` }, { status: 500 });
  }

  const { presignedUrl, cdnUrl } = await presignedRes.json();

  // Step 2: Upload image bytes to presigned URL (S3)
  const buffer = Buffer.from(await file.arrayBuffer());
  const uploadRes = await fetch(presignedUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: buffer,
  });

  if (!uploadRes.ok) {
    return NextResponse.json({ error: "Upload to storage failed" }, { status: 500 });
  }

  return NextResponse.json({ url: cdnUrl });
}
