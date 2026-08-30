/**
 * W476 storage gateway.
 *
 * This module replaces the old localStorage monkeypatch pattern with explicit,
 * inspectable results. It never changes browser storage prototypes and it does
 * not turn a failed durable write into success.
 */

export const EON_STORAGE_STATUSES = Object.freeze({
  OK: 'ok',
  UNAVAILABLE: 'unavailable',
  QUOTA_EXCEEDED: 'quota-exceeded',
  SECURITY_ERROR: 'security-error',
  SERIALIZATION_ERROR: 'serialization-error',
  VERIFICATION_FAILED: 'verification-failed'
});

export const EON_STORAGE_CLASSES = Object.freeze({
  DURABLE: 'durable',
  EPHEMERAL: 'ephemeral'
});

function statusResult(status, extra = {}) {
  return Object.freeze({ ok: status === EON_STORAGE_STATUSES.OK, status, ...extra });
}

function classifyStorageError(error) {
  const name = String(error?.name || '');
  const code = Number(error?.code || 0);
  if (name === 'QuotaExceededError' || name === 'NS_ERROR_DOM_QUOTA_REACHED' || code === 22 || code === 1014) return EON_STORAGE_STATUSES.QUOTA_EXCEEDED;
  if (name === 'SecurityError') return EON_STORAGE_STATUSES.SECURITY_ERROR;
  return EON_STORAGE_STATUSES.UNAVAILABLE;
}

function resolveStorage(storage) {
  if (storage) return statusResult(EON_STORAGE_STATUSES.OK, { storage });
  try {
    const candidate = globalThis?.localStorage;
    return candidate ? statusResult(EON_STORAGE_STATUSES.OK, { storage: candidate }) : statusResult(EON_STORAGE_STATUSES.UNAVAILABLE);
  } catch (error) {
    return statusResult(classifyStorageError(error), { error });
  }
}

export function createEonStorageGateway(storage = null) {
  const resolved = resolveStorage(storage);

  function getRaw(key) {
    if (!resolved.ok) return resolved;
    try {
      return statusResult(EON_STORAGE_STATUSES.OK, { value: resolved.storage.getItem(String(key)) });
    } catch (error) {
      return statusResult(classifyStorageError(error), { error });
    }
  }

  function remove(key) {
    if (!resolved.ok) return resolved;
    try {
      resolved.storage.removeItem(String(key));
      const readback = resolved.storage.getItem(String(key));
      if (readback !== null) return statusResult(EON_STORAGE_STATUSES.VERIFICATION_FAILED, { value: readback });
      return statusResult(EON_STORAGE_STATUSES.OK);
    } catch (error) {
      return statusResult(classifyStorageError(error), { error });
    }
  }

  function setRaw(key, value, options = {}) {
    if (!resolved.ok) return resolved;
    const storageClass = options.storageClass === EON_STORAGE_CLASSES.EPHEMERAL ? EON_STORAGE_CLASSES.EPHEMERAL : EON_STORAGE_CLASSES.DURABLE;
    try {
      const expected = String(value);
      resolved.storage.setItem(String(key), expected);
      if (storageClass === EON_STORAGE_CLASSES.EPHEMERAL || options.verify === false) return statusResult(EON_STORAGE_STATUSES.OK, { storageClass });
      const actual = resolved.storage.getItem(String(key));
      if (actual !== expected) return statusResult(EON_STORAGE_STATUSES.VERIFICATION_FAILED, { storageClass, expected, actual });
      return statusResult(EON_STORAGE_STATUSES.OK, { storageClass });
    } catch (error) {
      return statusResult(classifyStorageError(error), { error, storageClass });
    }
  }

  function getJson(key, fallback = null) {
    const raw = getRaw(key);
    if (!raw.ok) return raw;
    if (raw.value === null || raw.value === undefined || raw.value === '') return statusResult(EON_STORAGE_STATUSES.OK, { value: fallback, found: false });
    try {
      return statusResult(EON_STORAGE_STATUSES.OK, { value: JSON.parse(raw.value), found: true });
    } catch (error) {
      return statusResult(EON_STORAGE_STATUSES.SERIALIZATION_ERROR, { error, value: fallback, found: true });
    }
  }

  function setJson(key, value, options = {}) {
    let encoded;
    try {
      encoded = JSON.stringify(value);
    } catch (error) {
      return statusResult(EON_STORAGE_STATUSES.SERIALIZATION_ERROR, { error });
    }
    if (encoded === undefined) return statusResult(EON_STORAGE_STATUSES.SERIALIZATION_ERROR);
    return setRaw(key, encoded, options);
  }

  function available() {
    return resolved.ok ? statusResult(EON_STORAGE_STATUSES.OK) : resolved;
  }

  return Object.freeze({ available, getRaw, setRaw, remove, getJson, setJson });
}

export const eonStorageGateway = createEonStorageGateway();

export function getEonStorageRecoveryMessage(result) {
  const status = String(result?.status || EON_STORAGE_STATUSES.UNAVAILABLE);
  if (status === EON_STORAGE_STATUSES.QUOTA_EXCEEDED) return 'Your browser storage is full. Export a backup, remove old browser data, then try saving again.';
  if (status === EON_STORAGE_STATUSES.SECURITY_ERROR) return 'Your browser blocked local storage. Allow site storage for EONAPP or use a normal browser profile, then try again.';
  if (status === EON_STORAGE_STATUSES.SERIALIZATION_ERROR) return 'This item could not be prepared for storage. Copy your work before retrying.';
  if (status === EON_STORAGE_STATUSES.VERIFICATION_FAILED) return 'EONAPP could not verify the saved copy. Export your work and retry before closing this tab.';
  return 'Local storage is unavailable in this browser profile. Export or copy your work before closing this tab.';
}
