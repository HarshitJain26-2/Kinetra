import { supabaseAdmin } from '../config/supabase.js';
import { NotFoundError, ForbiddenError } from '../utils/errors.js';
import { InjuryFlagRow } from '../types/database.js';

export class InjuryService {
  /**
   * List user's injury flags with optional status/severity filtering
   */
  static async listUserInjuries(
    userId: string,
    options: { resolved?: boolean; severity?: string; page?: number; limit?: number }
  ): Promise<{ data: InjuryFlagRow[]; total: number }> {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('injury_flags')
      .select('*', { count: 'exact' })
      .eq('user_id', userId);

    if (options.resolved !== undefined) {
      query = query.eq('resolved', options.resolved);
    }
    if (options.severity) {
      query = query.eq('severity', options.severity);
    }

    const { data, count, error } = await query
      .order('flagged_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to list injuries: ${error.message}`);
    }

    return {
      data: data || [],
      total: count || 0,
    };
  }

  /**
   * Get single injury detail with ownership check
   */
  static async getInjuryById(userId: string, injuryId: string): Promise<InjuryFlagRow> {
    const { data, error } = await supabaseAdmin
      .from('injury_flags')
      .select('*')
      .eq('id', injuryId)
      .single();

    if (error || !data) {
      throw new NotFoundError('Injury flag not found');
    }

    if (data.user_id !== userId) {
      throw new ForbiddenError('You do not have permission to view this injury flag');
    }

    return data;
  }

  /**
   * Patch injury record (e.g. mark resolved or update severity)
   */
  static async updateInjury(
    userId: string,
    injuryId: string,
    updates: { resolved?: boolean; severity?: 'low' | 'medium' | 'high'; description?: string }
  ): Promise<InjuryFlagRow> {
    const existing = await this.getInjuryById(userId, injuryId);

    const updatePayload: any = { ...updates };
    if (updates.resolved === true && !existing.resolved) {
      updatePayload.resolved_at = new Date().toISOString();
    } else if (updates.resolved === false) {
      updatePayload.resolved_at = null;
    }

    const { data, error } = await supabaseAdmin
      .from('injury_flags')
      .update(updatePayload)
      .eq('id', injuryId)
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Failed to update injury: ${error?.message}`);
    }

    return data;
  }
}
