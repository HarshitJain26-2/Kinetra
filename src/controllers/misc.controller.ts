import { Request, Response, NextFunction } from 'express';
import { NutritionService } from '../services/nutrition.service.js';
import { ChallengeService } from '../services/challenge.service.js';
import { LeaderboardService } from '../services/leaderboard.service.js';
import { sendSuccess } from '../utils/response.js';
import { UnauthorizedError } from '../utils/errors.js';

export class NutritionController {
  static async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      const profile = await NutritionService.getProfile(req.user.id);
      sendSuccess(res, profile);
    } catch (error) {
      next(error);
    }
  }

  static async upsertProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      const profile = await NutritionService.upsertProfile(req.user.id, req.body);
      sendSuccess(res, profile);
    } catch (error) {
      next(error);
    }
  }

  static async recommend(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      const result = await NutritionService.generateRecommendation(req.user.id, req.body);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
}

export class ChallengesController {
  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      const challenge = await ChallengeService.createChallenge(req.user.id, req.body);
      sendSuccess(res, challenge, 201);
    } catch (error) {
      next(error);
    }
  }

  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      const page = req.query.page ? Number(req.query.page) : 1;
      const limit = req.query.limit ? Number(req.query.limit) : 20;
      const type = req.query.type as string | undefined;
      const mine =
        req.query.mine !== undefined
          ? typeof req.query.mine === 'boolean'
            ? req.query.mine
            : String(req.query.mine) === 'true'
          : undefined;

      const result = await ChallengeService.listChallenges(req.user.id, {
        page,
        limit,
        type,
        mine,
      });

      sendSuccess(res, result.data, 200, { page, limit, total: result.total });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const challenge = await ChallengeService.getChallengeById(req.params.id as string);
      sendSuccess(res, challenge);
    } catch (error) {
      next(error);
    }
  }

  static async join(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      const participant = await ChallengeService.joinChallenge(req.user.id, req.params.id as string);
      sendSuccess(res, participant, 201);
    } catch (error) {
      next(error);
    }
  }

  static async getParticipants(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = req.query.page ? Number(req.query.page) : 1;
      const limit = req.query.limit ? Number(req.query.limit) : 50;

      const result = await ChallengeService.getChallengeParticipants(req.params.id as string, {
        page,
        limit,
      });

      sendSuccess(res, result.data, 200, { page, limit, total: result.total });
    } catch (error) {
      next(error);
    }
  }
}

export class LeaderboardController {
  static async getLeaderboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = req.query.page ? Number(req.query.page) : 1;
      const limit = req.query.limit ? Number(req.query.limit) : 50;
      const challenge_id = req.query.challenge_id as string | undefined;
      const metric = req.query.metric as string | undefined;

      const result = await LeaderboardService.getLeaderboard({
        page,
        limit,
        challenge_id,
        metric,
      });

      sendSuccess(res, result.data, 200, { page, limit, total: result.total });
    } catch (error) {
      next(error);
    }
  }
}
