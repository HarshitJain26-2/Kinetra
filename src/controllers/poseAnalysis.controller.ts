import { Request, Response, NextFunction } from 'express';
import { PoseAnalysisService } from '../services/poseAnalysis.service.js';
import { sendSuccess } from '../utils/response.js';
import { UnauthorizedError } from '../utils/errors.js';

export class PoseAnalysisController {
  static async submitSetAnalysis(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      const result = await PoseAnalysisService.submitSetAnalysis(req.user.id, req.body);
      sendSuccess(res, result, 201);
    } catch (error) {
      next(error);
    }
  }
}
