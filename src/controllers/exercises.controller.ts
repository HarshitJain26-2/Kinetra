import { Request, Response, NextFunction } from 'express';
import { ExercisesService } from '../services/exercises.service.js';
import { sendSuccess } from '../utils/response.js';

export class ExercisesController {
  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = req.query.page ? Number(req.query.page) : 1;
      const limit = req.query.limit ? Number(req.query.limit) : 20;
      const muscle_group = req.query.muscle_group as string | undefined;
      const difficulty = req.query.difficulty as string | undefined;
      const equipment = req.query.equipment as string | undefined;
      const search = req.query.search as string | undefined;

      const result = await ExercisesService.listExercises({
        page,
        limit,
        muscle_group,
        difficulty,
        equipment,
        search,
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
      const exercise = await ExercisesService.getExerciseById(req.params.id as string);
      sendSuccess(res, exercise);
    } catch (error) {
      next(error);
    }
  }
}

