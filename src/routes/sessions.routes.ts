import { Router } from 'express';
import { SessionsController } from '../controllers/sessions.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';
import {
  sessionIdParamSchema,
  startSessionBodySchema,
  logExerciseBodySchema,
  endSessionBodySchema,
  sessionFilterQuerySchema,
} from '../validators/session.validators.js';

export const sessionsRouter = Router();

// POST /api/v1/sessions/start
sessionsRouter.post(
  '/start',
  requireAuth,
  validateRequest({ body: startSessionBodySchema }),
  SessionsController.start
);

// POST /api/v1/sessions/:id/log-exercise (manual logging only)
sessionsRouter.post(
  '/:id/log-exercise',
  requireAuth,
  validateRequest({ params: sessionIdParamSchema, body: logExerciseBodySchema }),
  SessionsController.logExercise
);

// POST /api/v1/sessions/:id/end
sessionsRouter.post(
  '/:id/end',
  requireAuth,
  validateRequest({ params: sessionIdParamSchema, body: endSessionBodySchema }),
  SessionsController.end
);

// GET /api/v1/sessions
sessionsRouter.get(
  '/',
  requireAuth,
  validateRequest({ query: sessionFilterQuerySchema }),
  SessionsController.list
);

// GET /api/v1/sessions/:id
sessionsRouter.get(
  '/:id',
  requireAuth,
  validateRequest({ params: sessionIdParamSchema }),
  SessionsController.getById
);
