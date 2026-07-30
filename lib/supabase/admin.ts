import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * Client dengan Service Role Key — HANYA dipakai di sisi server
 * (API routes / Route Handlers), tidak pernah diekspos ke browser.
 * Client ini melewati Row Level Security sehingga dipakai untuk
 * operasi tulis (insert/update/delete) dan akses Storage dari panel admin.
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
