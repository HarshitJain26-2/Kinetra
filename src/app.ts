import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { apiV1Router } from './routes/index.js';
import { notFoundHandler } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';
import { env } from './config/env.js';

const app: Application = express();

// Security headers & Cross-Origin Resource Sharing
app.use(helmet());
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint (Phase 18 compliant)
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// Mount Version 1 API
app.use('/api/v1', apiV1Router);

// Catch 404s and pass to central error handler
app.use(notFoundHandler);

// Centralized error handling middleware
app.use(errorHandler);

export default app;
