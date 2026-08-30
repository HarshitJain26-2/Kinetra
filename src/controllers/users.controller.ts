import { Request, Response, NextFunction } from 'express';
import { UsersService } from '../services/users.service.js';
import { sendSuccess } from '../utils/response.js';
import { UnauthorizedError } from '../utils/errors.js';

export class AuthController {
  static async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError();
      }

      const userProfile = await UsersService.getCurrentUserProfile(req.user.id);
      sendSuccess(res, {
        id: userProfile.id,
        email: req.user.email,
        display_name: userProfile.display_name,
        avatar_url: userProfile.avatar_url,
        fitness_level: userProfile.fitness_level,
        onboarding_done: userProfile.onboarding_done,
      });
    } catch (error) {
      next(error);
    }
  }
}

export class UsersController {
  static async getPublicProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const profile = await UsersService.getPublicProfile(req.params.id as string);
      sendSuccess(res, profile);
    } catch (error) {
      next(error);
    }
  }

  static async getMyFullProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError();
      }

      const fullProfile = await UsersService.getCurrentUserProfile(req.user.id);
      sendSuccess(res, {
        ...fullProfile,
        email: req.user.email,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateMyProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError();
      }

      const updated = await UsersService.updateProfile(req.user.id, req.body);
      sendSuccess(res, {
        ...updated,
        email: req.user.email,
      });
    } catch (error) {
      next(error);
    }
  }
}

