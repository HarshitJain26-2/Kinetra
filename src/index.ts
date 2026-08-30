import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import { env, validateEnv } from './config/env.js';
import { logger } from './utils/logger.js';

// Validate environment on startup
const envValidation = validateEnv(env);
if (!envValidation.valid) {
  logger.error('❌ Environment validation failed on startup:');
  for (const err of envValidation.errors) {
    logger.error(`  - ${err}`);
  }
  process.exit(1);
}

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
