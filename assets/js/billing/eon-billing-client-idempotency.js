/** A15 I17 — secure client idempotency keys for explicit billing commands. */
export function createBillingIdempotencyKey(operation = 'billing', cryptoApi = globalThis.crypto) {
  const prefix = String(operation || 'billing').toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 36) || 'billing';
  if (typeof cryptoApi?.randomUUID === 'function') return `${prefix}:${cryptoApi.randomUUID()}`;
  if (typeof cryptoApi?.getRandomValues === 'function') {
    const bytes = cryptoApi.getRandomValues(new Uint8Array(16));
    return `${prefix}:${[...bytes].map((value) => value.toString(16).padStart(2, '0')).join('')}`;
  }
  throw new Error('secure-idempotency-key-unavailable');
}
