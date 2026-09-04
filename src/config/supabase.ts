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

export const isTestEnv =
  env.NODE_ENV === 'test' ||
  process.env.NODE_ENV === 'test' ||
  process.execArgv.some((a) => a.includes('test')) ||
  process.argv.some((a) => a.includes('test'));

/**
 * Resolves the appropriate Supabase client for user operations.
 * - In test mode or when SUPABASE_SERVICE_ROLE_KEY is present, returns supabaseAdmin.
 * - When a user token is provided, returns a client scoped with the user's JWT
 *   so PostgreSQL RLS evaluates auth.uid() to the user's ID.
 */
export function getUserSupabaseClient(token?: string): SupabaseClient {
  if (isTestEnv || (env.SUPABASE_SERVICE_ROLE_KEY && env.SUPABASE_SERVICE_ROLE_KEY.trim() !== '')) {
    return supabaseAdmin;
  }

  if (token) {
    return createClient(
      env.SUPABASE_URL || 'https://placeholder.supabase.co',
      env.SUPABASE_ANON_KEY || 'placeholder-anon-key',
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );
  }
  return supabaseAdmin;
}

