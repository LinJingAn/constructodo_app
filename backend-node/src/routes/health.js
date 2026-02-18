import { Router } from 'express';
import { checkDatabaseHealth } from '../db.js';

export const healthRouter = Router();

healthRouter.get('/database/health', async (req, res) => {
  const isHealthy = await checkDatabaseHealth();
  res.json({
    status: isHealthy ? 'healthy' : 'unhealthy',
    service: 'database',
  });
});
