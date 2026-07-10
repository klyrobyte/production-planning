import { AppError } from '../../common/errors/AppError';
import {
  getSiteConfig,
  updateSiteConfig,
  ALLOWED_CONFIG_KEYS,
  ConfigKey,
  SiteConfig,
} from './site-config.repository';

// Regex: valid CSS hex color — 3 or 6 hex digits, with leading #
const HEX_COLOR_REGEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export async function getConfig(): Promise<SiteConfig> {
  return getSiteConfig();
}

export async function patchConfig(
  body: unknown,
  updatedBy: string,
): Promise<SiteConfig> {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    throw new AppError('Request body harus berupa JSON object.', 400, 'VALIDATION_ERROR');
  }

  const input = body as Record<string, unknown>;

  // Filter to only allowed keys — ignore unknown keys silently
  const updates: Partial<SiteConfig> = {};

  for (const key of ALLOWED_CONFIG_KEYS) {
    if (key in input) {
      const value = input[key];
      if (typeof value !== 'string' || !HEX_COLOR_REGEX.test(value)) {
        throw new AppError(
          `Nilai untuk "${key}" harus berupa hex color yang valid (contoh: #008d51 atau #fff).`,
          400,
          'VALIDATION_ERROR',
        );
      }
      updates[key as ConfigKey] = value;
    }
  }

  if (Object.keys(updates).length === 0) {
    throw new AppError(
      `Tidak ada key yang valid. Key yang diperbolehkan: ${ALLOWED_CONFIG_KEYS.join(', ')}.`,
      400,
      'VALIDATION_ERROR',
    );
  }

  return updateSiteConfig(updates, updatedBy);
}
