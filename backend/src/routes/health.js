import { Router } from 'express';

export const healthRouter = Router();

healthRouter.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});
