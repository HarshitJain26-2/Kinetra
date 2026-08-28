import { Router } from 'express';
import { AuthController, UsersController } from '../controllers/users.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';
import { userIdParamSchema, updateProfileBodySchema } from '../validators/user.validators.js';

export const authRouter = Router();
export const usersRouter = Router();

// GET /api/v1/auth/me
authRouter.get('/me', requireAuth, AuthController.getMe);

// GET /api/v1/users/me
usersRouter.get('/me', requireAuth, UsersController.getMyFullProfile);

// PUT /api/v1/users/me
usersRouter.put(
  '/me',
  requireAuth,
  validateRequest({ body: updateProfileBodySchema }),
  UsersController.updateMyProfile
);

// GET /api/v1/users/:id (public profile)
usersRouter.get(
  '/:id',
  requireAuth,
  validateRequest({ params: userIdParamSchema }),
  UsersController.getPublicProfile
);
