/** A15 I06 — exact same-origin storage snapshots for reversible multi-index writes. */

export const EON_STORAGE_TRANSACTION_SCHEMA = 'eonapp.storage-transaction.a15.v1';

function storageRef(options = {}) {
  if (options.storage) return options.storage;
  try { return globalThis.localStorage || null; } catch { return null; }
}

function cleanKey(value = '') {
  return String(value || '').replaceAll(String.fromCharCode(0), '').trim().slice(0, 260);
}

export function captureEonStorageSnapshot(keys = [], options = {}) {
  const target = storageRef(options);
  if (!target?.getItem) return Object.freeze({ ok: false, reason: 'storage-unavailable' });
  const uniqueKeys = [...new Set((Array.isArray(keys) ? keys : []).map(cleanKey).filter(Boolean))];
  const values = {};
  try {
    for (const key of uniqueKeys) values[key] = target.getItem(key);
  } catch (error) {
    return Object.freeze({ ok: false, reason: 'snapshot-read-failed', message: String(error?.message || error).slice(0, 220) });
  }
  return Object.freeze({
    ok: true,
    schema: EON_STORAGE_TRANSACTION_SCHEMA,
    keys: Object.freeze(uniqueKeys),
    values: Object.freeze(values),
    privateInMemoryOnly: true,
    exportable: false
  });
}

export function restoreEonStorageSnapshot(snapshot = {}, options = {}) {
  const target = storageRef(options);
  if (!target?.setItem || !target?.removeItem || snapshot?.schema !== EON_STORAGE_TRANSACTION_SCHEMA) {
    return Object.freeze({ ok: false, reason: 'invalid-storage-snapshot' });
  }
  try {
    for (const key of snapshot.keys || []) {
      const value = snapshot.values?.[key];
      if (value == null) target.removeItem(key);
      else target.setItem(key, String(value));
    }
    for (const key of snapshot.keys || []) {
      const expected = snapshot.values?.[key] == null ? null : String(snapshot.values[key]);
      if (target.getItem(key) !== expected) return Object.freeze({ ok: false, reason: 'restore-verification-failed', key });
    }
  } catch (error) {
    return Object.freeze({ ok: false, reason: 'restore-write-failed', message: String(error?.message || error).slice(0, 220) });
  }
  return Object.freeze({ ok: true, restoredKeys: Object.freeze([...(snapshot.keys || [])]), exact: true });
}

export function verifyEonStorageSnapshot(snapshot = {}, options = {}) {
  const target = storageRef(options);
  if (!target?.getItem || snapshot?.schema !== EON_STORAGE_TRANSACTION_SCHEMA) return false;
  try {
    return (snapshot.keys || []).every((key) => {
      const expected = snapshot.values?.[key] == null ? null : String(snapshot.values[key]);
      return target.getItem(key) === expected;
    });
  } catch {
    return false;
  }
}
