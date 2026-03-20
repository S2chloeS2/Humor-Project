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

  const { flavorId, flavorSlug, imageUrl } = await request.json();
  if (!imageUrl) return NextResponse.json({ error: "imageUrl is required" }, { status: 400 });

  // Get Supabase session token for the API
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData?.session?.access_token;

  // Call the external pipeline API
  const apiRes = await fetch(`${API_BASE}/pipeline`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      image_url: imageUrl,
      humor_flavor_id: flavorId,
      humor_flavor_slug: flavorSlug,
    }),
  });

  if (!apiRes.ok) {
    let errText = "";
    try { errText = await apiRes.text(); } catch {}
    return NextResponse.json(
      { error: `Pipeline API error (${apiRes.status}): ${errText}` },
      { status: apiRes.status }
    );
  }

  const result = await apiRes.json();
  return NextResponse.json(result);
}
