import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';

const PORT = env.PORT || 5000;
const HOST = '0.0.0.0';

const server = app.listen(PORT, HOST, () => {
  logger.info(`🚀 Kinetra backend running on http://${HOST}:${PORT}`);
  logger.info(`📡 Health check available at http://${HOST}:${PORT}/health`);
  logger.info(`📖 API v1 root mounted at http://${HOST}:${PORT}/api/v1`);
});

// Graceful shutdown handling
const handleShutdown = (signal: string) => {
  logger.info(`Received ${signal}. Gracefully terminating server...`);
  server.close(() => {
    logger.info('HTTP server closed. Exiting process.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));
