import { Request, Response, NextFunction } from 'express';
import { InjuryService } from '../services/injury.service.js';
import { sendSuccess } from '../utils/response.js';
import { UnauthorizedError } from '../utils/errors.js';

export class InjuriesController {
  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();

      const page = req.query.page ? Number(req.query.page) : 1;
      const limit = req.query.limit ? Number(req.query.limit) : 20;
      const resolved =
        req.query.resolved !== undefined ? req.query.resolved === 'true' : undefined;
      const severity = req.query.severity as string | undefined;

      const result = await InjuryService.listUserInjuries(req.user.id, {
        page,
        limit,
        resolved,
        severity,
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
      const injury = await InjuryService.getInjuryById(req.user.id, req.params.id as string);
      sendSuccess(res, injury);
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      const updated = await InjuryService.updateInjury(req.user.id, req.params.id as string, req.body);
      sendSuccess(res, updated);
    } catch (error) {
      next(error);
    }
  }
}
