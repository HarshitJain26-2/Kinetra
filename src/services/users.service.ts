import { supabaseAdmin } from '../config/supabase.js';
import { NotFoundError } from '../utils/errors.js';
import { UserRow, PublicProfileRow } from '../types/database.js';

export class UsersService {
  /**
   * Fetch current authenticated user's complete profile
   */
  static async getCurrentUserProfile(userId: string): Promise<UserRow & { email?: string }> {
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !user) {
      throw new NotFoundError('User profile not found');
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
      throw new NotFoundError('User profile not found');
    }

    return profile;
  }

  /**
   * Update authenticated user's own profile
   */
  static async updateProfile(
    userId: string,
    updates: Partial<Omit<UserRow, 'id' | 'created_at' | 'updated_at'>>
  ): Promise<UserRow> {
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error || !user) {
      throw new NotFoundError('Failed to update user profile');
    }

    return user;
  }
}
