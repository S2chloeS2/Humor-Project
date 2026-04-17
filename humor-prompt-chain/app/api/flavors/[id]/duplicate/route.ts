import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

async function checkAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("is_superadmin, is_matrix_admin")
    .eq("id", user.id)
    .single();
  if (!profile?.is_superadmin && !profile?.is_matrix_admin) return null;
  return { user, admin };
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await checkAdmin();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  // 요청 body에서 slug, description 읽기
  let bodySlug: string | undefined;
  let bodyDescription: string | undefined;
  try {
    const body = await request.json();
    bodySlug = body.slug?.trim() || undefined;
    bodyDescription = body.description?.trim() ?? undefined;
  } catch {
    // body 없으면 무시
  }

  // 1. 원본 flavor 가져오기
  const { data: original, error: flavorErr } = await ctx.admin
    .from("humor_flavors")
    .select("slug, description")
    .eq("id", id)
    .single();

  if (flavorErr || !original) {
    return NextResponse.json({ error: "Flavor not found" }, { status: 404 });
  }

  // 2. 유니크한 slug 만들기
  const baseSlug = bodySlug ?? `copy-of-${original.slug}`;
  let uniqueSlug = baseSlug;
  let attempt = 1;

  while (true) {
    const { data: existing } = await ctx.admin
      .from("humor_flavors")
      .select("id")
      .eq("slug", uniqueSlug)
      .maybeSingle();

    if (!existing) break; // 사용 가능한 slug 찾음

    attempt++;
    uniqueSlug = `${baseSlug}-${attempt}`;
  }

  // description 결정: body에서 온 값 우선, 없으면 원본 기반 자동 생성
  const finalDescription =
    bodyDescription !== undefined
      ? bodyDescription
      : original.description
      ? `[Copy] ${original.description}`
      : `Copy of ${original.slug}`;

  // 3. 새 flavor 생성
  const now = new Date().toISOString();
  const { data: newFlavor, error: createErr } = await ctx.admin
    .from("humor_flavors")
    .insert({
      slug: uniqueSlug,
      description: finalDescription,
      created_datetime_utc: now,
      created_by_user_id: ctx.user.id,
      modified_by_user_id: ctx.user.id,
      modified_datetime_utc: now,
    })
    .select()
    .single();

  if (createErr || !newFlavor) {
    return NextResponse.json({ error: createErr?.message ?? "Failed to create flavor" }, { status: 500 });
  }

  // 4. 원본 steps 가져오기
  const { data: steps } = await ctx.admin
    .from("humor_flavor_steps")
    .select("*")
    .eq("humor_flavor_id", id)
    .order("order_by");

  // 5. steps를 새 flavor에 복제
  if (steps && steps.length > 0) {
    const newSteps = steps.map((s: any) => ({
      humor_flavor_id: newFlavor.id,
      order_by: s.order_by,
      description: s.description,
      humor_flavor_step_type_id: s.humor_flavor_step_type_id,
      llm_model_id: s.llm_model_id,
      llm_input_type_id: s.llm_input_type_id,
      llm_output_type_id: s.llm_output_type_id,
      llm_system_prompt: s.llm_system_prompt,
      llm_user_prompt: s.llm_user_prompt,
      llm_temperature: s.llm_temperature,
      created_datetime_utc: now,
      created_by_user_id: ctx.user.id,
      modified_by_user_id: ctx.user.id,
      modified_datetime_utc: now,
    }));

    const { error: stepsErr } = await ctx.admin
      .from("humor_flavor_steps")
      .insert(newSteps);

    if (stepsErr) {
      return NextResponse.json({ error: stepsErr.message }, { status: 500 });
    }
  }

  return NextResponse.json({ id: newFlavor.id, slug: uniqueSlug }, { status: 201 });
}
