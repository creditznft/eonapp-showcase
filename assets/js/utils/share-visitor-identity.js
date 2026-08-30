import { randomId, sha256Base64Url } from './share-link-codec.js';

const KEY = 'eon:share-visitor-device-key:v1';

export function getOrCreateVisitorDeviceKey() {
  try {
    const current = localStorage.getItem(KEY);
    if (current) return current;
    const next = randomId(32);
    localStorage.setItem(KEY, next);
    return next;
  } catch {
    if (!globalThis.__eonVisitorDeviceKey) globalThis.__eonVisitorDeviceKey = randomId(32);
    return globalThis.__eonVisitorDeviceKey;
  }
}

export async function createShareScopedVisitorPseudonym(shareId, deviceKey = getOrCreateVisitorDeviceKey()) {
  return (await sha256Base64Url(`${deviceKey}:${String(shareId || 'direct')}`)).slice(0, 32);
}

export function resetVisitorIdentity() {
  try { localStorage.removeItem(KEY); } catch {}
  delete globalThis.__eonVisitorDeviceKey;
}
