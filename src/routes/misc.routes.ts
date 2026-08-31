import { Router } from 'express';
import { InjuriesController } from '../controllers/injuries.controller.js';
import {
  NutritionController,
  ChallengesController,
  LeaderboardController,
} from '../controllers/misc.controller.js';
import { FoodLogsController } from '../controllers/foodLogs.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';
import {
  injuryIdParamSchema,
  injuryFilterQuerySchema,
  patchInjuryBodySchema,
  upsertNutritionProfileBodySchema,
  nutritionRecommendBodySchema,
  challengeIdParamSchema,
  createChallengeBodySchema,
  challengeFilterQuerySchema,
  leaderboardQuerySchema,
} from '../validators/misc.validators.js';
import {
  foodLogIdParamSchema,
  foodLogFilterQuerySchema,
  createFoodLogBodySchema,
} from '../validators/foodLogs.validators.js';
import { paginationQuerySchema } from '../validators/common.validators.js';

export const injuriesRouter = Router();
export const nutritionRouter = Router();
export const challengesRouter = Router();
export const leaderboardRouter = Router();

// ── Injuries ───────────────────────────────────────────────────
// GET /api/v1/injuries
injuriesRouter.get(
  '/',
  requireAuth,
  validateRequest({ query: injuryFilterQuerySchema }),
  InjuriesController.list
);

// GET /api/v1/injuries/:id
injuriesRouter.get(
  '/:id',
  requireAuth,
  validateRequest({ params: injuryIdParamSchema }),
  InjuriesController.getById
);

// PATCH /api/v1/injuries/:id
injuriesRouter.patch(
  '/:id',
  requireAuth,
  validateRequest({ params: injuryIdParamSchema, body: patchInjuryBodySchema }),
  InjuriesController.update
);

// ── Nutrition ──────────────────────────────────────────────────
// GET /api/v1/nutrition/profile
nutritionRouter.get('/profile', requireAuth, NutritionController.getProfile);

// PUT /api/v1/nutrition/profile
nutritionRouter.put(
  '/profile',
  requireAuth,
  validateRequest({ body: upsertNutritionProfileBodySchema }),
  NutritionController.upsertProfile
);

// POST /api/v1/nutrition/recommend
nutritionRouter.post(
  '/recommend',
  requireAuth,
  validateRequest({ body: nutritionRecommendBodySchema }),
  NutritionController.recommend
);

// GET /api/v1/nutrition/logs
nutritionRouter.get(
  '/logs',
  requireAuth,
  validateRequest({ query: foodLogFilterQuerySchema }),
  FoodLogsController.list
);

// POST /api/v1/nutrition/logs
nutritionRouter.post(
  '/logs',
  requireAuth,
  validateRequest({ body: createFoodLogBodySchema }),
  FoodLogsController.create
);

// DELETE /api/v1/nutrition/logs/:id
nutritionRouter.delete(
  '/logs/:id',
  requireAuth,
  validateRequest({ params: foodLogIdParamSchema }),
  FoodLogsController.delete
);

// ── Challenges ─────────────────────────────────────────────────
// POST /api/v1/challenges
challengesRouter.post(
  '/',
  requireAuth,
  validateRequest({ body: createChallengeBodySchema }),
  ChallengesController.create
);

// GET /api/v1/challenges
challengesRouter.get(
  '/',
  requireAuth,
  validateRequest({ query: challengeFilterQuerySchema }),
  ChallengesController.list
);

// GET /api/v1/challenges/:id
challengesRouter.get(
  '/:id',
  requireAuth,
  validateRequest({ params: challengeIdParamSchema }),
  ChallengesController.getById
);

// POST /api/v1/challenges/:id/join
challengesRouter.post(
  '/:id/join',
  requireAuth,
  validateRequest({ params: challengeIdParamSchema }),
  ChallengesController.join
);

// GET /api/v1/challenges/:id/participants
challengesRouter.get(
  '/:id/participants',
  requireAuth,
  validateRequest({ params: challengeIdParamSchema, query: paginationQuerySchema }),
  ChallengesController.getParticipants
);

// ── Leaderboard ────────────────────────────────────────────────
// GET /api/v1/leaderboard
leaderboardRouter.get(
  '/',
  requireAuth,
  validateRequest({ query: leaderboardQuerySchema }),
  LeaderboardController.getLeaderboard
);
