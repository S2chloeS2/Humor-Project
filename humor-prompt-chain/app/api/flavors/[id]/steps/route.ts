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

  const { id: flavorId } = await params;
  const body = await request.json();

  const { data, error } = await ctx.admin
    .from("humor_flavor_steps")
    .insert({
      humor_flavor_id: parseInt(flavorId, 10),
      order_by: body.order_by ?? 1,
      description: body.description ?? null,
      humor_flavor_step_type_id: body.humor_flavor_step_type_id ?? null,
      llm_model_id: body.llm_model_id ?? null,
      llm_input_type_id: body.llm_input_type_id ?? null,
      llm_output_type_id: body.llm_output_type_id ?? null,
      llm_system_prompt: body.llm_system_prompt ?? null,
      llm_user_prompt: body.llm_user_prompt ?? null,
      llm_temperature: body.llm_temperature ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
