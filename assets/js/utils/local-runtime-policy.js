/**
 * local-runtime-policy.js
 *
 * Shared guard for local runtime discovery.
 *
 * The live site should stay quiet by default and only probe localhost when:
 * - the app is running on a local origin, or
 * - the user has explicitly opted in to auto-detection.
 */

const LOCAL_RUNTIME_AUTO_DETECT_KEY = 'eon:local-runtime:auto-detect:v1';

function isLocalhostOrigin() {
  try {
    if (typeof location === 'undefined') return false;
    const host = String(location.hostname || '').toLowerCase();
    return host === 'localhost' || host === '127.0.0.1' || host === '::1';
  } catch {
    return false;
  }
}

function isAutoDetectEnabled() {
  try {
    return localStorage.getItem(LOCAL_RUNTIME_AUTO_DETECT_KEY) === 'true';
  } catch {
    return false;
  }
}

function shouldProbeLocalRuntimes(/** @type {{ force?: boolean } | boolean | undefined } */ options = {}) {
  const force = typeof options === 'boolean' ? options : Boolean(options?.force);
  return force || isLocalhostOrigin() || isAutoDetectEnabled();
}

function setLocalRuntimeAutoDetectEnabled(/** @type {any} */ enabled) {
  try {
    localStorage.setItem(LOCAL_RUNTIME_AUTO_DETECT_KEY, enabled ? 'true' : 'false');
    return true;
  } catch {
    return false;
  }
}

function getLocalRuntimeAutoDetectEnabled() {
  return isAutoDetectEnabled();
}

if (typeof window !== 'undefined') {
  window.shouldProbeLocalRuntimes = shouldProbeLocalRuntimes;
  window.setLocalRuntimeAutoDetectEnabled = setLocalRuntimeAutoDetectEnabled;
  window.getLocalRuntimeAutoDetectEnabled = getLocalRuntimeAutoDetectEnabled;
}

export {
  getLocalRuntimeAutoDetectEnabled,
  isAutoDetectEnabled,
  isLocalhostOrigin,
  setLocalRuntimeAutoDetectEnabled,
  shouldProbeLocalRuntimes
};
export default shouldProbeLocalRuntimes;
