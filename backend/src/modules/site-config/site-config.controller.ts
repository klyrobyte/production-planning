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

/**
 * POST /api/site-config/test-endpoint
 * Test connectivity & fetch response from external endpoint URL
 */
export async function handleTestEndpoint(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { url } = req.body;
    if (!url || typeof url !== 'string' || !/^https?:\/\//i.test(url)) {
      res.status(400).json({ error: 'URL tidak valid. Harus diawali dengan http:// atau https://' });
      return;
    }

    const startTime = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);

    try {
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      const latencyMs = Date.now() - startTime;
      const contentType = response.headers.get('content-type') || '';

      let bodyData: any;
      if (contentType.includes('application/json')) {
        bodyData = await response.json();
      } else {
        const text = await response.text();
        try {
          bodyData = JSON.parse(text);
        } catch {
          bodyData = text;
        }
      }

      res.json({
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        latencyMs,
        contentType,
        data: bodyData,
      });
    } catch (fetchErr: any) {
      clearTimeout(timeoutId);
      const latencyMs = Date.now() - startTime;
      res.json({
        ok: false,
        status: 0,
        statusText: fetchErr.name === 'AbortError' ? 'Request Timeout (7s)' : 'Connection Failed',
        latencyMs,
        error: fetchErr.message || 'Gagal terhubung ke target endpoint',
      });
    }
  } catch (err) {
    next(err);
  }
}
