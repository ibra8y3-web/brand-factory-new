import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

let supabase: any = null;

export const getSupabase = () => {
  if (!supabase) {
    const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "https://bldvvarzrojvrhqtvdhe.supabase.co";
    const key = process.env.SUPABASE_KEY || process.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_CECOp77IItlylxuFt89xEw_jGiRLHkl";
    supabase = createClient(url, key);
  }
  return supabase;
};
