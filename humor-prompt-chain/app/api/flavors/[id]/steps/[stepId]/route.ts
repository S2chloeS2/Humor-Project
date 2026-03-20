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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; stepId: string }> }
) {
  const ctx = await checkAdmin();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { stepId } = await params;
  const body = await request.json();

  const update: Record<string, any> = {};
  if (body.description !== undefined) update.description = body.description;
  if (body.llm_system_prompt !== undefined) update.llm_system_prompt = body.llm_system_prompt;
  if (body.llm_user_prompt !== undefined) update.llm_user_prompt = body.llm_user_prompt;
  if (body.llm_temperature !== undefined) update.llm_temperature = body.llm_temperature;
  if (body.order_by !== undefined) update.order_by = body.order_by;

  const { data, error } = await ctx.admin
    .from("humor_flavor_steps")
    .update(update)
    .eq("id", stepId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; stepId: string }> }
) {
  const ctx = await checkAdmin();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { stepId } = await params;
  const { error } = await ctx.admin
    .from("humor_flavor_steps")
    .delete()
    .eq("id", stepId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
