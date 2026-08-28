import { Router } from 'express';
import { authRouter, usersRouter } from './users.routes.js';
import { exercisesRouter } from './exercises.routes.js';
import { workoutsRouter } from './workouts.routes.js';
import { sessionsRouter } from './sessions.routes.js';
import { poseAnalysisRouter } from './poseAnalysis.routes.js';
import {
  injuriesRouter,
  nutritionRouter,
  challengesRouter,
  leaderboardRouter,
} from './misc.routes.js';

export const apiV1Router = Router();

// Mount all contract domains under /api/v1
apiV1Router.use('/auth', authRouter);
apiV1Router.use('/users', usersRouter);
apiV1Router.use('/exercises', exercisesRouter);
apiV1Router.use('/workouts', workoutsRouter);
apiV1Router.use('/sessions', sessionsRouter);
apiV1Router.use('/pose-analysis', poseAnalysisRouter);
apiV1Router.use('/injuries', injuriesRouter);
apiV1Router.use('/nutrition', nutritionRouter);
apiV1Router.use('/challenges', challengesRouter);
apiV1Router.use('/leaderboard', leaderboardRouter);
