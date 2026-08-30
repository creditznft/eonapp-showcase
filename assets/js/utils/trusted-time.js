const TRUSTED_NOW_KEY = 'eon:trusted-now:v1';

function readStoredNow() {
  try {
    const raw = Number(localStorage.getItem(TRUSTED_NOW_KEY) || 0);
    return Number.isFinite(raw) && raw > 0 ? raw : 0;
  } catch {
    return 0;
  }
}

function writeStoredNow(/** @type {any} */ value) {
  try {
    localStorage.setItem(TRUSTED_NOW_KEY, String(Math.max(0, Math.floor(Number(value) || 0))));
  } catch {}
}

export function getTrustedNow() {
  const now = Date.now();
  const stored = readStoredNow();
  const trusted = Math.max(now, stored);
  if (trusted !== stored) writeStoredNow(trusted);
  return trusted;
}

export function observeTrustedTime(/** @type {any} */ value) {
  const ts = Math.floor(Number(value) || 0);
  if (!Number.isFinite(ts) || ts <= 0) return getTrustedNow();
  const trusted = Math.max(ts, readStoredNow(), Date.now());
  writeStoredNow(trusted);
  return trusted;
}
