import { Request, Response, NextFunction } from 'express';
import { SessionsService } from '../services/sessions.service.js';
import { sendSuccess } from '../utils/response.js';
import { UnauthorizedError } from '../utils/errors.js';

export class SessionsController {
  static async start(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      const session = await SessionsService.startSession(req.user.id, req.body);
      sendSuccess(res, session, 201);
    } catch (error) {
      next(error);
    }
  }

  static async logExercise(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      const logged = await SessionsService.logExercise(req.user.id, req.params.id as string, req.body);
      sendSuccess(res, logged, 201);
    } catch (error) {
      next(error);
    }
  }

  static async end(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      const endedSession = await SessionsService.endSession(
        req.user.id,
        req.params.id as string,
        req.body.notes
      );
      sendSuccess(res, endedSession, 200);
    } catch (error) {
      next(error);
    }
  }

  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();

      const page = req.query.page ? Number(req.query.page) : 1;
      const limit = req.query.limit ? Number(req.query.limit) : 20;
      const status = req.query.status as string | undefined;

      const result = await SessionsService.listSessions(req.user.id, {
        page,
        limit,
        status,
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
      const session = await SessionsService.getSessionById(req.user.id, req.params.id as string);
      sendSuccess(res, session);
    } catch (error) {
      next(error);
    }
  }
}
