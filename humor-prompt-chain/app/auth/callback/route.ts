import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { data: sessionData } = await supabase.auth.exchangeCodeForSession(code);

    if (sessionData?.user) {
      // Check admin permissions
      const admin = createAdminClient();
      const { data: profile } = await admin
        .from("profiles")
        .select("is_superadmin, is_matrix_admin")
        .eq("id", sessionData.user.id)
        .single();

      const isAllowed = profile?.is_superadmin === true || profile?.is_matrix_admin === true;

      if (!isAllowed) {
        await supabase.auth.signOut();
        return NextResponse.redirect(`${origin}/login?error=unauthorized`);
      }
    }
  }

  return NextResponse.redirect(`${origin}/flavors`);
}
