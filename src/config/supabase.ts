import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from './env.js';

if (!env.SUPABASE_URL && env.NODE_ENV !== 'test') {
  console.warn('⚠️ SUPABASE_URL is not defined in environment variables.');
}

// Anonymous / Client-facing Supabase instance (respects RLS)
export const supabaseAnon: SupabaseClient = createClient(
  env.SUPABASE_URL || 'https://placeholder.supabase.co',
  env.SUPABASE_ANON_KEY || 'placeholder-anon-key'
);

// Admin / Service Role Supabase instance (bypasses RLS for trusted backend operations)
export const supabaseAdmin: SupabaseClient = createClient(
  env.SUPABASE_URL || 'https://placeholder.supabase.co',
  env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY || 'placeholder-admin-key'
);
