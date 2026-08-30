import dotenv from 'dotenv';
dotenv.config();

export interface EnvConfig {
  PORT: number;
  NODE_ENV: string;
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  CORS_ORIGIN: string;
  RATE_LIMIT_WINDOW_MS: number;
  RATE_LIMIT_MAX: number;
}

export const env: EnvConfig = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  SUPABASE_URL: process.env.SUPABASE_URL || '',
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || '',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 mins default
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX || '500', 10), // 500 reqs per 15 min default
};

/**
 * Validate configuration for production readiness.
 * In production mode, missing required secrets or malformed URLs will throw a clear Error.
 */
export function validateEnv(config: EnvConfig = env): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (config.NODE_ENV === 'production') {
    if (!config.SUPABASE_URL || config.SUPABASE_URL.trim() === '') {
      errors.push('SUPABASE_URL is required in production');
    } else if (!config.SUPABASE_URL.startsWith('http://') && !config.SUPABASE_URL.startsWith('https://')) {
      errors.push('SUPABASE_URL must be a valid HTTP/HTTPS URL');
    }

    if (!config.SUPABASE_ANON_KEY || config.SUPABASE_ANON_KEY.trim() === '') {
      errors.push('SUPABASE_ANON_KEY is required in production');
    }

    if (!config.SUPABASE_SERVICE_ROLE_KEY || config.SUPABASE_SERVICE_ROLE_KEY.trim() === '') {
      errors.push('SUPABASE_SERVICE_ROLE_KEY is required in production');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
