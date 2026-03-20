import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("is_superadmin, is_matrix_admin")
    .eq("id", user.id)
    .single();

  const isAllowed = profile?.is_superadmin === true || profile?.is_matrix_admin === true;
  if (!isAllowed) {
    await supabase.auth.signOut();
    redirect("/login?error=unauthorized");
  }

  redirect("/flavors");
}
