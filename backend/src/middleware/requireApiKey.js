import { config } from '../config.js';

export function requireApiKey(req, res, next) {
  if (!config.apiKey) {
    return next();
  }

  if (req.headers['x-api-key'] !== config.apiKey) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  return next();
}
