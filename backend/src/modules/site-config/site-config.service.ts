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
    throw new AppError(400, 'VALIDATION_ERROR', 'Request body harus berupa JSON object.');
  }

  const input = body as Record<string, unknown>;

  // Filter to only allowed keys — ignore unknown keys silently
  const updates: Partial<SiteConfig> = {};

  for (const key of ALLOWED_CONFIG_KEYS) {
    if (key in input) {
      const value = input[key];
      if (typeof value !== 'string') {
        throw new AppError(400, 'VALIDATION_ERROR', `Nilai untuk "${key}" harus berupa string.`);
      }

      const isColorKey = ['color_primary', 'color_secondary', 'color_navbar'].includes(key);
      if (isColorKey && !HEX_COLOR_REGEX.test(value)) {
        throw new AppError(
          400,
          'VALIDATION_ERROR',
          `Nilai untuk "${key}" harus berupa hex color yang valid (contoh: #008d51 atau #fff).`,
        );
      }

      if (key === 'qr_webhook_domain') {
        const trimmed = value.trim().replace(/\/+$/, '');
        if (!/^https?:\/\//i.test(trimmed)) {
          throw new AppError(400, 'VALIDATION_ERROR', 'Domain Webhook QR harus diawali dengan http:// atau https://');
        }
        updates[key as ConfigKey] = trimmed;
        continue;
      }

      if (['qr_webhook_endpoint_qr_list', 'qr_webhook_endpoint_mc_list', 'qr_webhook_endpoint_iot'].includes(key)) {
        const trimmed = value.trim();
        if (!trimmed.startsWith('/')) {
          throw new AppError(400, 'VALIDATION_ERROR', `Endpoint "${key}" harus diawali dengan karakter slash (/)...`);
        }
        if (key === 'qr_webhook_endpoint_iot' && (!trimmed.includes('{mc}') || !trimmed.includes('{qr}'))) {
          throw new AppError(400, 'VALIDATION_ERROR', 'Pattern Endpoint IoT harus mengandung placeholder {mc} dan {qr}.');
        }
        updates[key as ConfigKey] = trimmed;
        continue;
      }

      updates[key as ConfigKey] = value;
    }
  }

  if (Object.keys(updates).length === 0) {
    throw new AppError(
      400,
      'VALIDATION_ERROR',
      `Tidak ada key yang valid. Key yang diperbolehkan: ${ALLOWED_CONFIG_KEYS.join(', ')}.`,
    );
  }

  return updateSiteConfig(updates, updatedBy);
}
