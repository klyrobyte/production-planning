import { pool } from '../../config/database';
import { redis } from '../../config/redis';

// The only allowed config keys
export const ALLOWED_CONFIG_KEYS = ['color_primary', 'color_secondary', 'color_navbar'] as const;
export type ConfigKey = (typeof ALLOWED_CONFIG_KEYS)[number];

export type SiteConfig = Record<ConfigKey, string>;

const REDIS_CACHE_KEY = 'site_config';
const CACHE_TTL_SECONDS = 60;

export async function getSiteConfig(): Promise<SiteConfig> {
  // 1. Try Redis cache first
  const cached = await redis.get(REDIS_CACHE_KEY);
  if (cached) {
    return JSON.parse(cached) as SiteConfig;
  }

  // 2. Fallback to DB
  const result = await pool.query<{ key: string; value: string }>(
    `SELECT key, value FROM site_config WHERE key = ANY($1)`,
    [ALLOWED_CONFIG_KEYS],
  );

  const config = Object.fromEntries(
    result.rows.map((row) => [row.key, row.value]),
  ) as SiteConfig;

  // 3. Populate cache
  await redis.set(REDIS_CACHE_KEY, JSON.stringify(config), 'EX', CACHE_TTL_SECONDS);

  return config;
}

export async function updateSiteConfig(
  updates: Partial<SiteConfig>,
  updatedBy: string,
): Promise<SiteConfig> {
  const entries = Object.entries(updates) as [ConfigKey, string][];

  if (entries.length > 0) {
    // Upsert each key individually (simple and readable)
    for (const [key, value] of entries) {
      await pool.query(
        `INSERT INTO site_config (key, value, updated_by, updated_at)
         VALUES ($1, $2, $3, NOW())
         ON CONFLICT (key) DO UPDATE
           SET value      = EXCLUDED.value,
               updated_by = EXCLUDED.updated_by,
               updated_at = NOW()`,
        [key, value, updatedBy],
      );
    }
  }

  // Invalidate cache so next read gets fresh data
  await redis.del(REDIS_CACHE_KEY);

  // Return the full config after update
  return getSiteConfig();
}
