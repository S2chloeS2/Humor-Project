import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://qihsgnfjqmkjmoowyfbn.supabase.co";
const supabaseAnonKey =
  "sb_publishable_M_xswaAEKZTJj9BCPkBxTA_2rfpKam8";

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);
