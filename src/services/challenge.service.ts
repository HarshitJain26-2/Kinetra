import { supabaseAdmin } from '../config/supabase.js';
import { NotFoundError, BadRequestError, InternalServerError } from '../utils/errors.js';
import { ChallengeRow, ChallengeParticipantRow } from '../types/database.js';

export interface CreateChallengeInput {
  title: string;
  description?: string | null;
  type?: 'streak' | 'volume' | 'time' | 'custom';
  metric_key?: string | null;
  target_value?: number | null;
  start_date: string;
  end_date: string;
}

export class ChallengeService {
  /**
   * Create a new fitness challenge
   */
  static async createChallenge(userId: string, input: CreateChallengeInput): Promise<ChallengeRow> {
    const { data, error } = await supabaseAdmin
      .from('challenges')
      .insert({
        creator_id: userId,
        title: input.title,
        description: input.description || null,
        type: input.type || 'custom',
        metric_key: input.metric_key || 'total_reps',
        target_value: input.target_value ?? null,
        start_date: input.start_date,
        end_date: input.end_date,
        is_active: true,
      })
      .select()
      .single();

    if (error || !data) {
      throw new InternalServerError(`Failed to create challenge: ${error?.message}`);
    }

    return data;
  }

  /**
   * List challenges with filters
   */
  static async listChallenges(
    userId: string,
    options: { type?: string; mine?: boolean; page?: number; limit?: number }
  ): Promise<{ data: ChallengeRow[]; total: number }> {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const offset = (page - 1) * limit;

    let query = supabaseAdmin.from('challenges').select('*', { count: 'exact' });

    if (options.mine) {
      query = query.eq('creator_id', userId);
    }
    if (options.type) {
      query = query.eq('type', options.type);
    }

    const { data, count, error } = await query
      .order('start_date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new InternalServerError('Failed to list challenges');
    }

    return {
      data: data || [],
      total: count ?? (data ? data.length : 0),
    };
  }

  /**
   * Get challenge details by ID
   */
  static async getChallengeById(challengeId: string): Promise<ChallengeRow & { participant_count: number }> {
    const { data: challenge, error } = await supabaseAdmin
      .from('challenges')
      .select('*')
      .eq('id', challengeId)
      .single();

    if (error || !challenge) {
      throw new NotFoundError('Challenge not found', 'CHALLENGE_NOT_FOUND');
    }

    const { count } = await supabaseAdmin
      .from('challenge_participants')
      .select('id', { count: 'exact', head: true })
      .eq('challenge_id', challengeId);

    return {
      ...challenge,
      participant_count: count || 0,
    };
  }

  /**
   * Join a challenge
   */
  static async joinChallenge(userId: string, challengeId: string): Promise<ChallengeParticipantRow> {
    const challenge = await this.getChallengeById(challengeId);

    if (new Date(challenge.end_date) < new Date()) {
      throw new BadRequestError('Challenge has already ended', 'CHALLENGE_ENDED');
    }

    const { data: existing } = await supabaseAdmin
      .from('challenge_participants')
      .select('id')
      .eq('challenge_id', challengeId)
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) {
      throw new BadRequestError('User has already joined this challenge', 'ALREADY_JOINED');
    }

    const { data, error } = await supabaseAdmin
      .from('challenge_participants')
      .insert({
        challenge_id: challengeId,
        user_id: userId,
        current_value: 0,
      })
      .select()
      .single();

    if (error || !data) {
      throw new InternalServerError(`Failed to join challenge: ${error?.message}`);
    }

    return data;
  }

  /**
   * Get challenge participants / leaderboard
   */
  static async getChallengeParticipants(
    challengeId: string,
    options: { page?: number; limit?: number }
  ): Promise<{ data: any[]; total: number }> {
    // Verify challenge existence
    await this.getChallengeById(challengeId);

    const page = options.page || 1;
    const limit = options.limit || 50;
    const offset = (page - 1) * limit;

    const { data, count, error } = await supabaseAdmin
      .from('challenge_participants')
      .select('id, current_value, joined_at, user:public_profiles(id, display_name, avatar_url)', {
        count: 'exact',
      })
      .eq('challenge_id', challengeId)
      .order('current_value', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new InternalServerError('Failed to fetch challenge participants');
    }

    const rankedData = (data || []).map((p, index) => ({
      rank: offset + index + 1,
      user: p.user,
      value: p.current_value,
      metric: 'current_value',
    }));

    return {
      data: rankedData,
      total: count ?? (data ? data.length : 0),
    };
  }
}

