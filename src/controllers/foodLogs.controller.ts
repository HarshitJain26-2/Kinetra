import { Request, Response, NextFunction } from 'express';
import { FoodLogsService } from '../services/foodLogs.service.js';

export class FoodLogsController {
  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const date = req.query.date as string | undefined;
      const logs = await FoodLogsService.listLogs(userId, date);
      res.status(200).json({ success: true, data: logs });
    } catch (err) {
      next(err);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const newLog = await FoodLogsService.createLog(userId, req.body);
      res.status(201).json({ success: true, data: newLog });
    } catch (err) {
      next(err);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const logId = String(req.params.id);
      await FoodLogsService.deleteLog(userId, logId);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
}
