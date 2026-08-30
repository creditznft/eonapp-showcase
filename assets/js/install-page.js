import { initEonPwaManager, requestEonPwaInstall } from './eon-pwa-manager.js';
import { getEonLocalCompanionDistributionTruth } from '../../config/eon-local-companion-distribution-contract.mjs';
import { getVerifiedEonLocalCompanionArtifact } from '../../config/eon-local-companion-release-contract.mjs';
import { detectLocalAiPlatformFamily, projectLocalAiPlatformSupport } from '../../config/local-ai-platform-support-contract.mjs';
import { getBrowserLocalLiteCapability } from './local-ai/browser-local-lite.js';
import {
  getEonOfflineState,
  initEonOfflineManager,
  installEonOfflinePack,
  refreshEonOfflineState,
  uninstallEonOfflinePack
} from './eon-offline-manager.js';

function cleanPlatform(value = '') {
  return String(value || '').trim().toLowerCase();
}

export function detectEonLocalCompanionPlatformFamily(input = {}) {
  const family = detectLocalAiPlatformFamily(input);
  if (['ios', 'android', 'mobile-other'].includes(family)) return 'mobile';
  if (['windows', 'macos', 'linux'].includes(family)) return family;
  return 'unknown';
}

export async function resolveEonLocalCompanionPlatformKey(navigatorLike = globalThis.navigator) {
  const nav = navigatorLike || {};
  const family = detectEonLocalCompanionPlatformFamily({
    userAgentDataPlatform: nav.userAgentData?.platform,
    platform: nav.platform,
    userAgent: nav.userAgent,
    maxTouchPoints: nav.maxTouchPoints,
    mobile: nav.userAgentData?.mobile === true
  });
  if (family === 'mobile' || family === 'unknown') return family;
  let architecture = '';
  try {
    const values = typeof nav.userAgentData?.getHighEntropyValues === 'function'
      ? await nav.userAgentData.getHighEntropyValues(['architecture', 'bitness'])
      : {};
    architecture = cleanPlatform(values?.architecture || '');
  } catch {}
  if (!architecture) architecture = /arm64|aarch64/.test(cleanPlatform(nav.userAgent || '')) ? 'arm64' : 'x64';
  if (/arm|aarch/.test(architecture)) architecture = 'arm64';
  else architecture = 'x64';
  if (family === 'macos') return architecture === 'arm64' ? 'macos-arm64' : 'macos-x64';
  return `${family}-${architecture}`;
}

async function renderLocalCompanionInstall() {
  const section = document.querySelector('[data-eon-local-companion-install]');
  if (!section) return;
  const badge = section.querySelector('[data-eon-companion-badge]');
  const status = section.querySelector('[data-eon-companion-status]');
  const download = section.querySelector('[data-eon-companion-download]');
  const unavailable = section.querySelector('[data-eon-companion-unavailable]');
  const platformKey = await resolveEonLocalCompanionPlatformKey();
  const truth = getEonLocalCompanionDistributionTruth();
  const platformFamily = platformKey === 'mobile' ? detectLocalAiPlatformFamily({
    userAgentDataPlatform: globalThis.navigator?.userAgentData?.platform,
    platform: globalThis.navigator?.platform,
    userAgent: globalThis.navigator?.userAgent,
    maxTouchPoints: globalThis.navigator?.maxTouchPoints,
    mobile: globalThis.navigator?.userAgentData?.mobile === true
  }) : String(platformKey || '').split('-')[0];
  const liteCapability = getBrowserLocalLiteCapability();
  const platformTruth = projectLocalAiPlatformSupport({ family: platformFamily, browserLiteSupported: liteCapability.supported === true, companionArtifactVerified: Boolean(getVerifiedEonLocalCompanionArtifact(platformKey)) });

  if (platformKey === 'mobile') {
    if (badge) badge.textContent = 'Local Lite first';
    if (status) status.textContent = `${platformTruth.headline}. ${platformTruth.guidance}`;
    if (download) download.hidden = true;
    if (unavailable) unavailable.hidden = true;
    return;
  }
  if (platformKey === 'unknown') {
    if (badge) badge.textContent = 'Check Local AI';
    if (status) status.textContent = `${platformTruth.headline}. ${platformTruth.guidance}`;
    if (download) download.hidden = true;
    if (unavailable) { unavailable.hidden = false; unavailable.textContent = 'No certified Companion for this device'; }
    return;
  }

  const artifact = getVerifiedEonLocalCompanionArtifact(platformKey);
  if (artifact) {
    if (badge) badge.textContent = 'Certified for this device';
    if (status) status.textContent = `EON Local Companion ${artifact.version} is certified for ${platformKey}. Install it once; EONAPP will guide the local approval and runtime checks afterward.`;
    if (download) {
      download.hidden = false;
      download.href = artifact.url;
      download.textContent = `Download EON Local Companion ${artifact.version}`;
      download.setAttribute('download', '');
      download.setAttribute('data-eon-companion-platform', platformKey);
    }
    if (unavailable) unavailable.hidden = true;
    return;
  }

  if (badge) badge.textContent = truth.nativeBuildRecipeImplemented ? 'Device certification pending' : 'Not ready';
  if (status) status.textContent = `${platformTruth.headline}. No signed device-certified Companion installer is published for ${platformKey} yet. Local Lite and a supported installed runtime remain separate proof-based options; EON will not offer a developer launcher as a substitute.`;
  if (download) download.hidden = true;
  if (unavailable) { unavailable.hidden = false; unavailable.textContent = 'Companion installer is being certified'; }
}

function setInstallStatus(message = '') {
  const status = document.querySelector('[data-eon-install-status]');
  if (status) status.textContent = String(message || '');
}

async function requestInstallFromPage() {
  const result = await requestEonPwaInstall({ explicitUserAction: true });
  if (result.ok) {
    setInstallStatus('Install request sent to your browser.');
    return;
  }
  setInstallStatus(result.guidance || 'This browser did not offer an install prompt. Use its install option or continue in this tab.');
}

function renderOfflineState(state = {}) {
  const status = document.querySelector('[data-eon-offline-pack-status]');
  const badge = document.querySelector('[data-eon-offline-pack-badge]');
  const buttons = document.querySelectorAll('[data-eon-offline-core-install], [data-eon-offline-full-install], [data-eon-offline-refresh], [data-eon-offline-remove]');
  for (const button of buttons) button.disabled = state.busy === true;
  const remove = document.querySelector('[data-eon-offline-remove]');
  if (remove) remove.disabled = state.busy === true || state.installed !== true;

  if (badge) {
    badge.textContent = state.busy ? 'Installing…' : state.repairRequired ? 'Offline repair needed' : state.updateAvailable ? 'Offline update available' : state.cityReady ? 'Full pack ready' : state.coreReady && state.cityAuthorizationExpired ? 'EONAPP ready · City renewal needed' : state.coreReady ? 'Core pack ready' : 'Not installed';
    badge.classList.toggle('is-active', state.coreReady === true);
  }
  if (!status) return;
  if (state.busy && state.progress) {
    const completed = Number(state.progress.completed || 0);
    const total = Number(state.progress.total || 0);
    const reused = Number(state.progress.reusedEntries || 0);
    const downloaded = Number(state.progress.downloadedEntries || 0);
    status.textContent = total > 0
      ? `Installing verified offline files: ${completed} of ${total} · ${reused} reused from this browser · ${downloaded} downloaded. Keep this tab open.`
      : 'Preparing the offline pack…';
    return;
  }
  if (state.lastError) {
    status.textContent = state.lastError;
    return;
  }
  if (state.repairRequired) {
    status.textContent = `The installed offline pack is incomplete (${Number(state.missingEntries || 0)} missing file${Number(state.missingEntries || 0) === 1 ? '' : 's'}). Stay online and use Check or repair pack; the previous verified files will be reused.`;
    return;
  }
  if (state.coreReady && state.cityAuthorizationExpired) {
    status.textContent = 'Core EONAPP and Local AI remain available offline. The private City capability has expired; reconnect and use Check or repair pack once while signed in to renew City and Expanse access.';
    return;
  }
  if (state.cityReady) {
    const updateNote = state.updateAvailable ? ' A newer app release is active; use “Check or repair pack” once to install only its new or changed offline files.' : '';
    const persistence = state.storagePersisted
      ? ' The browser granted persistent storage for stronger protection from automatic eviction.'
      : ' Browser storage is best-effort and may be evicted under storage pressure; use Check or repair pack before an important offline session.';
    status.textContent = `Full offline coverage is ready in this browser (${Number(state.cachedEntries || 0)} installed entries). The last installation reused ${Number(state.reusedEntries || 0)} unchanged files and downloaded ${Number(state.downloadedEntries || 0)} new or changed files. EONAPP, EON City and installed Expanse content can reopen without public internet until the capability receipt expires. Local AI continues when its device runtime is running.${persistence}${updateNote}`;
    return;
  }
  if (state.coreReady) {
    status.textContent = `Core EONAPP offline coverage is ready in this browser (${Number(state.cachedEntries || 0)} shell entries). Install the Full pack while signed in to add City and Expanse.`;
    return;
  }
  status.textContent = state.serviceWorkerAvailable === false
    ? 'This browser has not activated the EONAPP service worker yet. Reload once while online, then return here.'
    : 'No explicit offline pack is installed. Normal browser caching may still help, but a hard offline reload is not certified.';
}

async function runOfflineInstall(packs) {
  const result = await installEonOfflinePack({ packs, explicitUserAction: true });
  if (!result.ok) renderOfflineState({ ...result, lastError: result.message || result.error });
}

function installPageController() {
  initEonPwaManager();
  void renderLocalCompanionInstall();
  initEonOfflineManager({ onStateChange: renderOfflineState });
  for (const button of document.querySelectorAll('[data-eon-install-request]')) {
    button.addEventListener('click', () => { void requestInstallFromPage(); });
  }
  document.querySelector('[data-eon-offline-core-install]')?.addEventListener('click', () => { void runOfflineInstall(['core']); });
  document.querySelector('[data-eon-offline-full-install]')?.addEventListener('click', () => { void runOfflineInstall(['core', 'city']); });
  document.querySelector('[data-eon-offline-refresh]')?.addEventListener('click', async () => {
    const state = getEonOfflineState();
    if (state.installed === true) {
      await runOfflineInstall(state.packs?.includes('city') ? ['core', 'city'] : ['core']);
      return;
    }
    renderOfflineState(await refreshEonOfflineState());
  });
  document.querySelector('[data-eon-offline-remove]')?.addEventListener('click', async () => {
    const result = await uninstallEonOfflinePack({ explicitUserAction: true });
    if (!result.ok) renderOfflineState({ ...result, lastError: result.message || result.error });
  });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', installPageController, { once: true });
else installPageController();
