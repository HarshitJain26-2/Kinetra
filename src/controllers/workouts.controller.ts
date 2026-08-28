import { Request, Response, NextFunction } from 'express';
import { WorkoutsService } from '../services/workouts.service.js';
import { sendSuccess } from '../utils/response.js';
import { UnauthorizedError } from '../utils/errors.js';

export class WorkoutsController {
  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      const workout = await WorkoutsService.createWorkout(req.user.id, req.body);
      sendSuccess(res, workout, 201);
    } catch (error) {
      next(error);
    }
  }

  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();

      const page = req.query.page ? Number(req.query.page) : 1;
      const limit = req.query.limit ? Number(req.query.limit) : 20;
      const category = req.query.category as string | undefined;
      const difficulty = req.query.difficulty as string | undefined;
      const mine = req.query.mine ? req.query.mine === 'true' : undefined;

      const result = await WorkoutsService.listWorkouts(req.user.id, {
        page,
        limit,
        category,
        difficulty,
        mine,
      });

      sendSuccess(res, result.data, 200, {
        page,
        limit,
        total: result.total,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      const workout = await WorkoutsService.getWorkoutById(req.user.id, req.params.id as string);
      sendSuccess(res, workout);
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      const workout = await WorkoutsService.updateWorkout(req.user.id, req.params.id as string, req.body);
      sendSuccess(res, workout);
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      await WorkoutsService.deleteWorkout(req.user.id, req.params.id as string);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}
