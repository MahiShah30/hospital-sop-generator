import { createClient } from '@supabase/supabase-js';

export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE as string;
  if (!url || !serviceRole) throw new Error('Missing Supabase envs');
  return createClient(url, serviceRole, { auth: { persistSession: false } });
}


