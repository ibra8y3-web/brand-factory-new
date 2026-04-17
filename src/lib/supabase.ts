import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://bldvvarzrojvrhqtvdhe.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_CECOp77IItlylxuFt89xEw_jGiRLHkl";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const getSupabase = () => supabase;
