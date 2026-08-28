import { Router } from 'express';
import { WorkoutsController } from '../controllers/workouts.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';
import {
  workoutIdParamSchema,
  createWorkoutBodySchema,
  updateWorkoutBodySchema,
  workoutFilterQuerySchema,
} from '../validators/workout.validators.js';

export const workoutsRouter = Router();

// POST /api/v1/workouts
workoutsRouter.post(
  '/',
  requireAuth,
  validateRequest({ body: createWorkoutBodySchema }),
  WorkoutsController.create
);

// GET /api/v1/workouts
workoutsRouter.get(
  '/',
  requireAuth,
  validateRequest({ query: workoutFilterQuerySchema }),
  WorkoutsController.list
);

// GET /api/v1/workouts/:id
workoutsRouter.get(
  '/:id',
  requireAuth,
  validateRequest({ params: workoutIdParamSchema }),
  WorkoutsController.getById
);

// PUT /api/v1/workouts/:id
workoutsRouter.put(
  '/:id',
  requireAuth,
  validateRequest({ params: workoutIdParamSchema, body: updateWorkoutBodySchema }),
  WorkoutsController.update
);

// DELETE /api/v1/workouts/:id
workoutsRouter.delete(
  '/:id',
  requireAuth,
  validateRequest({ params: workoutIdParamSchema }),
  WorkoutsController.delete
);
