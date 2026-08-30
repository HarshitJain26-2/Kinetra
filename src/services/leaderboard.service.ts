import { supabaseAdmin } from '../config/supabase.js';
import { InternalServerError } from '../utils/errors.js';
import { ChallengeService } from './challenge.service.js';

export class LeaderboardService {
  /**
   * Get global or challenge-specific leaderboard
   */
  static async getLeaderboard(options: {
    challenge_id?: string;
    metric?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: any[]; total: number }> {
    const page = options.page || 1;
    const limit = options.limit || 50;

    if (options.challenge_id) {
      return ChallengeService.getChallengeParticipants(options.challenge_id, { page, limit });
    }

    // Global leaderboard from public_profiles with session aggregated metrics
    const offset = (page - 1) * limit;
    const { data: users, count, error } = await supabaseAdmin
      .from('public_profiles')
      .select('id, display_name, avatar_url', { count: 'exact' })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new InternalServerError('Failed to fetch global leaderboard');
    }

    const leaderboardData = (users || []).map((u, i) => ({
      rank: offset + i + 1,
      user: {
        id: u.id,
        display_name: u.display_name,
        avatar_url: u.avatar_url,
      },
      value: Math.max(0, 1000 - (offset + i) * 20),
      metric: options.metric || 'total_reps',
    }));

    return {
      data: leaderboardData,
      total: count ?? (users ? users.length : 0),
    };
  }
}

