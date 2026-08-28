import { Router } from 'express';
import { PoseAnalysisController } from '../controllers/poseAnalysis.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';
import { poseAnalysisBodySchema } from '../validators/poseAnalysis.validators.js';

export const poseAnalysisRouter = Router();

// POST /api/v1/pose-analysis (AI set summary ingestion)
poseAnalysisRouter.post(
  '/',
  requireAuth,
  validateRequest({ body: poseAnalysisBodySchema }),
  PoseAnalysisController.submitSetAnalysis
);
