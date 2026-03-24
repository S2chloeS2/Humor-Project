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

  const { flavorId, imageUrl } = await request.json();
  if (!imageUrl) return NextResponse.json({ error: "imageUrl is required" }, { status: 400 });
  if (!flavorId) return NextResponse.json({ error: "flavorId is required" }, { status: 400 });

  // Parse flavorId as integer (API requires numeric ID, not string)
  const humorFlavorId = flavorId;
  // humorFlavorId is now a UUID string
  if (!humorFlavorId) {
    return NextResponse.json({ error: "Invalid flavorId" }, { status: 400 });
  }

  // Get JWT token
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData?.session?.access_token;
  if (!token) return NextResponse.json({ error: "No session token" }, { status: 401 });

  const headers = {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  // Step 3: Register image URL
  const registerRes = await fetch(`${API_BASE}/pipeline/upload-image-from-url`, {
    method: "POST",
    headers,
    body: JSON.stringify({ imageUrl, isCommonUse: false }),
  });

  if (!registerRes.ok) {
    const err = await registerRes.text();
    return NextResponse.json(
      { error: `Image register error (${registerRes.status}): ${err}` },
      { status: registerRes.status }
    );
  }

  const { imageId } = await registerRes.json();
  if (!imageId) return NextResponse.json({ error: "No imageId returned from API" }, { status: 500 });

  // Step 4: Generate captions
  const captionRes = await fetch(`${API_BASE}/pipeline/generate-captions`, {
    method: "POST",
    headers,
    body: JSON.stringify({ imageId, humorFlavorId }),
  });

  if (!captionRes.ok) {
    const err = await captionRes.text();
    return NextResponse.json(
      { error: `Caption error (${captionRes.status}): ${err}` },
      { status: captionRes.status }
    );
  }

  const captionData = await captionRes.json();

  // Extract caption strings from response array
  const captions: string[] = Array.isArray(captionData)
    ? captionData.map((c: any) =>
        c.caption ?? c.caption_text ?? c.text ?? c.content ?? JSON.stringify(c)
      )
    : [];

  return NextResponse.json({ captions, steps: [] });
}
