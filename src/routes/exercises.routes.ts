import { Router } from 'express';
import { ExercisesController } from '../controllers/exercises.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';
import {
  exerciseIdParamSchema,
  exerciseFilterQuerySchema,
} from '../validators/exercise.validators.js';

export const exercisesRouter = Router();

// GET /api/v1/exercises
exercisesRouter.get(
  '/',
  requireAuth,
  validateRequest({ query: exerciseFilterQuerySchema }),
  ExercisesController.list
);

// GET /api/v1/exercises/:id
exercisesRouter.get(
  '/:id',
  requireAuth,
  validateRequest({ params: exerciseIdParamSchema }),
  ExercisesController.getById
);
