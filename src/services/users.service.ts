import { supabaseAdmin } from '../config/supabase.js';
import { NotFoundError } from '../utils/errors.js';
import { UserRow, PublicProfileRow } from '../types/database.js';

export const ALLOWED_PROFILE_UPDATE_FIELDS: readonly (keyof Omit<UserRow, 'id' | 'created_at' | 'updated_at'>)[] = [
  'display_name',
  'avatar_url',
  'date_of_birth',
  'gender',
  'height_cm',
  'weight_kg',
  'fitness_level',
  'onboarding_done',
] as const;

export class UsersService {
  /**
   * Fetch current authenticated user's complete profile
   */
  static async getCurrentUserProfile(userId: string): Promise<UserRow> {
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !user) {
      throw new NotFoundError('User profile not found', 'PROFILE_NOT_FOUND');
    }

    return user;
  }

  /**
   * Fetch public user profile via public_profiles view (protects private metrics)
   */
  static async getPublicProfile(userId: string): Promise<PublicProfileRow> {
    const { data: profile, error } = await supabaseAdmin
      .from('public_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !profile) {
      throw new NotFoundError('User profile not found', 'USER_NOT_FOUND');
    }

    return profile;
  }

  /**
   * Update authenticated user's own profile with strict allowlist filtering
   */
  static async updateProfile(
    userId: string,
    updates: Partial<Omit<UserRow, 'id' | 'created_at' | 'updated_at'>>
  ): Promise<UserRow> {
    const sanitizedUpdates: Record<string, any> = {};

    for (const key of ALLOWED_PROFILE_UPDATE_FIELDS) {
      if (key in updates && updates[key] !== undefined) {
        sanitizedUpdates[key] = updates[key];
      }
    }

    sanitizedUpdates.updated_at = new Date().toISOString();

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .update(sanitizedUpdates)
      .eq('id', userId)
      .select()
      .single();

    if (error || !user) {
      throw new NotFoundError('User profile not found', 'PROFILE_NOT_FOUND');
    }

    return user;
  }
}

