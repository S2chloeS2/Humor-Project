import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();

  const [stepTypes, models, inputTypes, outputTypes] = await Promise.all([
    admin.from("humor_flavor_step_types").select("id, slug, description").order("id"),
    admin.from("llm_models").select("id, name, llm_provider_id, is_temperature_supported").order("id"),
    admin.from("llm_input_types").select("id, slug, description").order("id"),
    admin.from("llm_output_types").select("id, slug, description").order("id"),
  ]);

  return NextResponse.json({
    stepTypes: stepTypes.data ?? [],
    models: models.data ?? [],
    inputTypes: inputTypes.data ?? [],
    outputTypes: outputTypes.data ?? [],
  });
}
