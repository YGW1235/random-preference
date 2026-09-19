import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://pxtrxthfgnoxqbkhdygg.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_2GZB_HZONfPvKabFHYl1oA_GejymBT3";

export function getSupabasePublic() {
  return createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
