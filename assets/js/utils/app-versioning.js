/**
 * EON App Versioning System
 * =========================
 * Manages app versions, deployment records, and user version switching.
 * Users can switch between deployed release tracks.
 * Version metadata is stored locally and synced via IPNS/Arweave.
 *
 * Version tracks:
 *   - stable: Production releases
 *   - beta: Internal key for preview releases
 *   - canary: Internal key for experimental releases
 *
 * Flow:
 *   1. Developer publishes new version (version + track + artifact URL)
 *   2. Version record stored in local manifest
 *   3. Users see available versions and can switch
 *   4. Service worker cache is invalidated on version switch
 *   5. Rollback supported by switching to previous version
 */
(function () {
  'use strict';
  const appWin = /** @type {any} */ (window);

  const VERSION_MANIFEST_KEY = 'eon:version-manifest:v1';
  const VERSION_PREFS_KEY = 'eon:version-prefs:v1';
  const CURRENT_VERSION_KEY = 'eon:current-version:v1';

  const /** @type {any} */
TRACKS = ['stable', 'beta', 'canary'];
  const DEFAULT_TRACK = 'stable';
  const /** @type {any} */
TRACK_LABELS = {
    stable: 'Stable',
    beta: 'Preview',
    canary: 'Experimental',
  };

  // ─── Helpers ──────────────────────────────────────────────────────────────────

  function uid(/** @type {any} */ len) {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    const buf = new Uint8Array(len);
    window.crypto.getRandomValues(buf);
    return Array.from(buf, /** @type {any} */ b => chars[b % chars.length]).join('');
  }

  function nowIso() { return new Date().toISOString(); }

  function getTrackLabel(/** @type {any} */ track) {
    const normalized = String(track || '').trim();
    return TRACK_LABELS[normalized] || 'Stable';
  }

  // ─── Persistence ──────────────────────────────────────────────────────────────

  function loadManifest() {
    try {
      return JSON.parse(localStorage.getItem(VERSION_MANIFEST_KEY) || 'null') || {
        versions: [],
        currentVersionId: null,
        updatedAt: nowIso(),
      };
    } catch {
      return { versions: [], currentVersionId: null, updatedAt: nowIso() };
    }
  }

  function saveManifest(/** @type {any} */ manifest) {
    try {
      localStorage.setItem(VERSION_MANIFEST_KEY, JSON.stringify(manifest));
    } catch {}
  }

  function loadPrefs() {
    try {
      return JSON.parse(localStorage.getItem(VERSION_PREFS_KEY) || 'null') || {
        preferredTrack: DEFAULT_TRACK,
        autoUpdate: true,
        notifyNewVersions: true,
      };
    } catch {
      return { preferredTrack: DEFAULT_TRACK, autoUpdate: true, notifyNewVersions: true };
    }
  }

  function savePrefs(/** @type {any} */ prefs) {
    try {
      localStorage.setItem(VERSION_PREFS_KEY, JSON.stringify(prefs));
    } catch {}
  }

  // ─── Core API ─────────────────────────────────────────────────────────────────

  /**
   * Publish a new app version.
   * Called by the developer/admin when deploying a new version.
   *
   * @param {object} config
   * @param {string} config.version - Semver string (e.g. '1.2.0')
   * @param {string} config.track - 'stable' | 'beta' | 'canary'
   * @param {string} [config.artifactUrl] - URL to the deployed artifact (IPNS/Arweave)
   * @param {string} [config.changelog] - Human-readable changelog
   * @param {string} [config.gitCommit] - Git commit hash
   * @param {boolean} [config.isLatest] - Mark as latest for this track
  * @returns {{ ok: boolean, versionId?: string, version?: object, message?: string }}
   */
  function publishVersion(/** @type {any} */ config) {
    if (!config || !config.version) return { ok: false, message: 'Version string required.' };

    const track = TRACKS.includes(config.track) ? config.track : DEFAULT_TRACK;
    const versionStr = String(config.version).trim();
    const versionId = `v-${versionStr.replace(/[^0-9.]/g, '')}-${track}-${uid(6)}`;

    // Parse semver
    const parts = versionStr.replace(/^v/, '').split('.').map(Number);
    const major = parts[0] || 0;
    const minor = parts[1] || 0;
    const patch = parts[2] || 0;

    const /** @type {any} */
version = {
      versionId,
      version: versionStr,
      major,
      minor,
      patch,
      track,
      artifactUrl: String(config.artifactUrl || '').slice(0, 500),
      changelog: String(config.changelog || '').slice(0, 2000),
      gitCommit: String(config.gitCommit || '').slice(0, 40),
      isLatest: Boolean(config.isLatest),
      publishedAt: nowIso(),
      status: 'published',
    };

    const manifest = loadManifest();

    // Mark previous latest as not-latest for this track
    for (const /** @type {any} */
v of manifest.versions) {
      if (v.track === track && v.isLatest) {
        v.isLatest = false;
      }
    }

    if (config.isLatest !== false) {
      version.isLatest = true;
    }

    manifest.versions.unshift(version);
    // Keep last 50 versions
    manifest.versions = manifest.versions.slice(0, 50);
    manifest.updatedAt = nowIso();

    // If no current version, set this as current
    if (!manifest.currentVersionId) {
      manifest.currentVersionId = versionId;
    }

    saveManifest(manifest);

    document.dispatchEvent(new CustomEvent('app-version-published', {
      detail: { versionId, version: versionStr, track }
    }));

    return { ok: true, versionId, version };
  }

  /**
   * Switch to a different version.
   * This updates the current version and triggers a service worker update.
   *
   * @param {string} versionId - The version ID to switch to
  * @returns {{ ok: boolean, version?: object, message?: string }}
   */
  function switchVersion(/** @type {any} */ versionId) {
    const manifest = loadManifest();
    const target = manifest.versions.find((/** @type {any} */ v) => v.versionId === versionId);
    if (!target) return { ok: false, message: 'Version not found.' };

    const previousVersionId = manifest.currentVersionId;
    manifest.currentVersionId = versionId;
    manifest.updatedAt = nowIso();
    saveManifest(manifest);

    // Save current version for service worker
    try {
      localStorage.setItem(CURRENT_VERSION_KEY, JSON.stringify({
        versionId: target.versionId,
        version: target.version,
        track: target.track,
        switchedAt: nowIso(),
      }));
    } catch {}

    // Request a service-worker update and reload the shell. W650 keeps the
    // release-stable City asset cache untouched, so unchanged content-hashed
    // GLBs are reused after the app update.
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((/** @type {any} */ reg) => {
        if (reg) {
          reg.update().then(() => {
            // Reload after the update check. No cache-clear message is sent.
            setTimeout(() => window.location.reload(), 1000);
          });
        }
      });
    }

    document.dispatchEvent(new CustomEvent('app-version-switched', {
      detail: { from: previousVersionId, to: versionId, version: target.version, track: target.track }
    }));

    return { ok: true, version: target };
  }

  /**
   * Get the current active version.
   */
  function getCurrentVersion() {
    const manifest = loadManifest();
    if (!manifest.currentVersionId) return null;
    return manifest.versions.find((/** @type {any} */ v) => v.versionId === manifest.currentVersionId) || null;
  }

  /**
   * Get all available versions, optionally filtered by track.
   */
  function getVersions(/** @type {any} */ track) {
    const manifest = loadManifest();
    let versions = manifest.versions;
    if (track && TRACKS.includes(track)) {
      versions = versions.filter((/** @type {any} */ v) => v.track === track);
    }
    return versions;
  }

  /**
   * Get the latest version for a given track.
   */
  function getLatestVersion(/** @type {any} */ track) {
    const t = track || DEFAULT_TRACK;
    const manifest = loadManifest();
        return manifest.versions.find((/** @type {any} */ v) => v.track === t && v.isLatest) ||
          manifest.versions.find((/** @type {any} */ v) => v.track === t) || null;
  }

  /**
   * Rollback to the previous version.
   */
  function rollback() {
    const manifest = loadManifest();
    const current = manifest.versions.find((/** @type {any} */ v) => v.versionId === manifest.currentVersionId);
    if (!current) return { ok: false, message: 'No current version.' };

    // Find the previous version on the same track
    const sameTrack = manifest.versions.filter((/** @type {any} */ v) =>
      v.track === current.track && v.versionId !== current.versionId
    );
    if (sameTrack.length === 0) return { ok: false, message: 'No previous version to rollback to.' };

    return switchVersion(sameTrack[0].versionId);
  }

  /**
   * Get version preferences.
   */
  function getPreferences() {
    return loadPrefs();
  }

  /**
   * Update version preferences.
   */
  function setPreferences(/** @type {any} */ prefs) {
    const current = loadPrefs();
    const /** @type {any} */
updated = { ...current, ...prefs };
    if (prefs.preferredTrack && !TRACKS.includes(prefs.preferredTrack)) {
      updated.preferredTrack = DEFAULT_TRACK;
    }
    savePrefs(updated);
    return updated;
  }

  /**
   * Compare two semver versions.
   * Returns: -1 if a < b, 0 if equal, 1 if a > b
   */
  function compareVersions(/** @type {any} */ a, /** @type {any} */ b) {
    const pa = String(a).replace(/^v/, '').split('.').map(Number);
    const pb = String(b).replace(/^v/, '').split('.').map(Number);
    for (let i = 0; i < 3; i++) {
      const na = pa[i] || 0;
      const nb = pb[i] || 0;
      if (na > nb) return 1;
      if (na < nb) return -1;
    }
    return 0;
  }

  /**
   * Check if an update is available for the user's preferred track.
   */
  function checkForUpdate() {
    const prefs = loadPrefs();
    const current = getCurrentVersion();
    if (!current) return { hasUpdate: false };

    const latest = getLatestVersion(prefs.preferredTrack);
    if (!latest) return { hasUpdate: false };

    if (latest.versionId === current.versionId) return { hasUpdate: false };

    const cmp = compareVersions(latest.version, current.version);
    return {
      hasUpdate: cmp > 0,
      currentVersion: current.version,
      latestVersion: latest.version,
      track: prefs.preferredTrack,
      changelog: latest.changelog,
    };
  }

  /**
   * Initialize versioning — set current version if none exists.
   */
  function init() {
    const manifest = loadManifest();
    if (manifest.versions.length === 0) {
      // Bootstrap with current app version
      const swVersion = (/** @type {HTMLMetaElement | null} */ (document.querySelector('meta[name="app-version"]')))?.content || '1.0.0';
      publishVersion({
        version: swVersion,
        track: 'stable',
        changelog: 'Initial version',
        isLatest: true,
      });
    }

    // Check for updates if auto-update enabled
    const prefs = loadPrefs();
    if (prefs.autoUpdate) {
      const update = checkForUpdate();
      if (update.hasUpdate) {
        document.dispatchEvent(new CustomEvent('app-update-available', {
          detail: update
        }));
      }
    }

    return getCurrentVersion();
  }

  // ─── Export ───────────────────────────────────────────────────────────────────

  const /** @type {any} */
AppVersion = {
    publishVersion,
    switchVersion,
    getCurrentVersion,
    getVersions,
    getLatestVersion,
    rollback,
    getPreferences,
    setPreferences,
    compareVersions,
    checkForUpdate,
    init,
    TRACKS,
    getTrackLabel,
  };

  appWin.EonAppVersion = AppVersion;
  document.dispatchEvent(new CustomEvent('app-versioning-ready', { detail: AppVersion }));
})();
