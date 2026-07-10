import { Request, Response, NextFunction } from 'express';
import { getConfig, patchConfig } from './site-config.service';

/**
 * GET /api/site-config
 * Public — frontend needs this before login to apply theme colors.
 */
export async function handleGetConfig(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const config = await getConfig();
    res.json(config);
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/site-config
 * super-admin only — partial update supported.
 */
export async function handlePutConfig(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const updatedBy = (req as any).user?.username ?? 'unknown';
    const config = await patchConfig(req.body, updatedBy);
    res.json(config);
  } catch (err) {
    next(err);
  }
}
