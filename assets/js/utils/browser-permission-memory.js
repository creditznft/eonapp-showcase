
const STORAGE_KEY = 'eon_browser_permission_memory_v1';

function getStore() {
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveStore(entries) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {}
}

function now() {
  return Date.now();
}

export function isRememberableBrowserApproval(actionClass = 'read') {
  const normalized = String(actionClass || 'read').trim().toLowerCase();
  return normalized === 'read' || normalized === 'draft';
}

export function getBrowserPermissionTtlMs(actionClass = 'read') {
  const normalized = String(actionClass || 'read').trim().toLowerCase();
  return normalized === 'draft'
    ? 10 * 60 * 1000
    : 30 * 60 * 1000;
}

export function pruneBrowserPermissionMemory() {
  const ts = now()
  const entries = getStore().filter((entry) => entry && entry.expiresAt > ts);
  saveStore(entries);
  return entries;
}

export function listRememberedBrowserPermissions() {
  return pruneBrowserPermissionMemory();
}

export function getRememberedBrowserPermission({ host = '', actionClass = 'read' } = {}) {
  if (!isRememberableBrowserApproval(actionClass)) return null;
  const normalizedHost = String(host || '').trim().toLowerCase();
  if (!normalizedHost) return null;
  return pruneBrowserPermissionMemory().find((entry) =>
    entry.host === normalizedHost && entry.actionClass === String(actionClass || 'read').trim().toLowerCase()
  ) || null;
}

export function rememberBrowserPermission({ host = '', actionClass = 'read', title = '', scope = 'host' } = {}) {
  if (!isRememberableBrowserApproval(actionClass)) return null;
  const normalizedHost = String(host || '').trim().toLowerCase();
  if (!normalizedHost) return null;
  const normalizedActionClass = String(actionClass || 'read').trim().toLowerCase();
  const entries = pruneBrowserPermissionMemory().filter((entry) =>
    !(entry.host === normalizedHost && entry.actionClass === normalizedActionClass)
  );
  const entry = {
    id: `${normalizedHost}:${normalizedActionClass}`,
    host: normalizedHost,
    actionClass: normalizedActionClass,
    title: String(title || '').trim(),
    scope: String(scope || 'host').trim().toLowerCase(),
    grantedAt: now(),
    expiresAt: now() + getBrowserPermissionTtlMs(normalizedActionClass)
  };
  entries.push(entry);
  saveStore(entries);
  return entry;
}

export function forgetBrowserPermission({ host = '', actionClass = '' } = {}) {
  const normalizedHost = String(host || '').trim().toLowerCase();
  const normalizedActionClass = String(actionClass || '').trim().toLowerCase();
  const entries = pruneBrowserPermissionMemory().filter((entry) => {
    if (normalizedHost && entry.host !== normalizedHost) return true
    if (normalizedActionClass && entry.actionClass !== normalizedActionClass) return true
    return false
  });
  saveStore(entries);
  return entries;
}

export function clearBrowserPermissionMemory() {
  saveStore([]);
}
