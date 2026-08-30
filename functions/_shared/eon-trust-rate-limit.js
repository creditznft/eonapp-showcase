/** Privacy-minimal Trust rate limiter: salted buckets, never raw network identifiers. */
const encoder = new TextEncoder();
const WINDOW_MS = 60 * 60 * 1000;
const LIMITS = Object.freeze({ support: 5, operator: 60, vexrail: 20, vexrail_account_daily: 60, vexrail_paid_fair_use: 30, vexrail_paid_daily: 100, vexrail_network_hourly: 80, vexrail_network_daily: 300, vexrail_country_daily: 400, vexrail_global_daily: 1000 });

async function hash(value) {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function consumeTrustRateLimit(database, env = {}, scope = 'support', subject = '', now = Date.now(), options = {}) {
  if (!database?.prepare) return Object.freeze({ ok: false, error: 'trust_rate_limit_unavailable' });
  const salt = String(env.EON_TRUST_RATE_LIMIT_SALT || '');
  if (salt.length < 32) return Object.freeze({ ok: false, error: 'trust_rate_limit_unavailable' });
  const raw = String(subject || '');
  if (!raw) return Object.freeze({ ok: false, error: 'trust_rate_limit_unavailable' });
  const bucketKey = await hash(`${scope}:${salt}:${raw}`);
  const requestedWindowMs = Number(options?.windowMs);
  const windowMs = Number.isFinite(requestedWindowMs) ? Math.min(30 * 24 * 60 * 60 * 1000, Math.max(60_000, Math.floor(requestedWindowMs))) : WINDOW_MS;
  const windowStart = Math.floor(Number(now) / windowMs) * windowMs;
  const requestedLimit = Number(options?.limit);
  const defaultLimit = LIMITS[scope] || LIMITS.support;
  const limit = Number.isFinite(requestedLimit) ? Math.min(1_000_000_000, Math.max(1, Math.floor(requestedLimit))) : defaultLimit;
  const requestedIncrement = Number(options?.increment);
  const increment = Number.isFinite(requestedIncrement) ? Math.min(1_000_000_000, Math.max(1, Math.floor(requestedIncrement))) : 1;
  await database.prepare(`INSERT INTO eon_trust_submission_limits(bucket_key, window_started_at, submission_count, updated_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(bucket_key) DO UPDATE SET
      window_started_at = CASE WHEN window_started_at < excluded.window_started_at THEN excluded.window_started_at ELSE window_started_at END,
      submission_count = CASE WHEN window_started_at < excluded.window_started_at THEN excluded.submission_count ELSE submission_count + excluded.submission_count END,
      updated_at = excluded.updated_at`).bind(bucketKey, windowStart, increment, Number(now)).run();
  const row = await database.prepare('SELECT submission_count, window_started_at FROM eon_trust_submission_limits WHERE bucket_key = ? LIMIT 1').bind(bucketKey).first();
  const count = Number(row?.submission_count || 0);
  const ok = Number(row?.window_started_at) === windowStart && count <= limit;
  return Object.freeze({ ok, error: ok ? '' : 'trust_rate_limit_exceeded', limit, count, increment, remaining: Math.max(0, limit - count), windowMs, windowStart });
}

export function trustRateLimitSubject(request, fallback = '') {
  // The raw value is only used transiently to derive a salted hash; it is never persisted or logged.
  return String(request?.headers?.get?.('cf-connecting-ip') || fallback || '').trim().slice(0, 200);
}
