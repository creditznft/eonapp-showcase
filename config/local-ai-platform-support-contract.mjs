/** RT90 — canonical Local AI platform projection. Live capability/release proof remains authoritative. */
export const LOCAL_AI_PLATFORM_SUPPORT_SCHEMA = 'eon.local-ai.platform-support.rt90.v1';

const text = (value = '') => String(value || '').trim().toLowerCase();

export function detectLocalAiPlatformFamily(input = {}) {
  const ua = text(input.userAgent || input.ua || '');
  const platform = text(input.userAgentDataPlatform || input.platform || '');
  const touchPoints = Math.max(0, Number(input.maxTouchPoints || 0) || 0);
  const mobileHint = input.mobile === true;
  // iPadOS can identify itself as MacIntel. Touch capability must win before macOS routing.
  if (/iphone|ipad|ipod/.test(ua) || (touchPoints > 1 && /mac/.test(platform || ua)) || (mobileHint && /mac/.test(platform || ua))) return 'ios';
  if (/android/.test(`${platform} ${ua}`)) return 'android';
  if (/windows|win32|win64/.test(`${platform} ${ua}`)) return 'windows';
  if (/macintosh|mac os|macintel|macos/.test(`${platform} ${ua}`)) return 'macos';
  if (/linux|x11/.test(`${platform} ${ua}`)) return 'linux';
  if (mobileHint || /mobile/.test(ua)) return 'mobile-other';
  return 'desktop-other';
}

export function projectLocalAiPlatformSupport(input = {}) {
  const family = text(input.family || '') || detectLocalAiPlatformFamily(input);
  const browserLiteSupported = input.browserLiteSupported === true;
  const verifiedDesktopRuntime = input.verifiedDesktopRuntime === true;
  const companionArtifactVerified = input.companionArtifactVerified === true;
  const desktop = ['windows', 'macos', 'linux', 'desktop-other'].includes(family);
  const mobile = ['ios', 'android', 'mobile-other'].includes(family);
  const runtimeEligible = ['windows', 'macos', 'linux'].includes(family);
  const companionReleaseTarget = family === 'windows' || family === 'macos';
  const companionAvailable = companionReleaseTarget && companionArtifactVerified;

  let primaryAction = 'check-browser-lite';
  let headline = 'Check Local AI on this device';
  let guidance = 'EON will use only Local AI paths that pass on this device.';
  if (mobile) {
    primaryAction = browserLiteSupported ? 'use-browser-lite' : 'browser-lite-unavailable';
    headline = browserLiteSupported ? 'Local Lite is ready for this phone or tablet' : 'Local Lite is not ready in this browser';
    guidance = browserLiteSupported
      ? 'Use the reviewed small text model inside this browser. Desktop runtimes, Companion installers and heavy local Creator media are not offered on phones or tablets.'
      : 'Guide Mode remains available. EON does not silently redirect Local mode to a cloud provider.';
  } else if (verifiedDesktopRuntime) {
    primaryAction = 'use-verified-runtime';
    headline = 'An installed Local AI runtime is verified';
    guidance = 'Reuse the tested runtime. Do not download another runtime or model unless the user explicitly chooses it.';
  } else if (companionAvailable) {
    primaryAction = 'use-certified-companion';
    headline = 'EON Local Companion is certified for this platform';
    guidance = 'Use the signed device-certified Companion to coordinate approved local runtimes without normal-user port or CORS editing.';
  } else if (browserLiteSupported) {
    primaryAction = 'use-browser-lite';
    headline = 'Local Lite is the simplest private starting point';
    guidance = runtimeEligible
      ? 'Local Lite can start now. Make Local AI ready can also test supported runtimes already installed on this computer.'
      : 'Local Lite can start now. No uncertified desktop Companion is offered for this platform.';
  } else if (runtimeEligible) {
    primaryAction = 'check-installed-runtime';
    headline = 'Check an installed desktop Local AI runtime';
    guidance = 'EON may test an approved loopback runtime after the user starts setup. It must not silently install software or weaken browser/runtime security.';
  }

  return Object.freeze({
    schema: LOCAL_AI_PLATFORM_SUPPORT_SCHEMA,
    family,
    desktop,
    mobile,
    browserLite: Object.freeze({ offered: browserLiteSupported, requiresLiveCapabilityProof: true }),
    desktopRuntime: Object.freeze({ offered: runtimeEligible, verified: runtimeEligible && verifiedDesktopRuntime }),
    companion: Object.freeze({
      offered: companionReleaseTarget,
      status: companionAvailable ? 'certified' : companionReleaseTarget ? 'not-certified' : 'not-offered',
      verifiedArtifactRequired: true
    }),
    creator: Object.freeze({ localImageOffered: runtimeEligible, localVideoOffered: runtimeEligible, mobileHeavyMediaOffered: false, proofRequired: true }),
    primaryAction,
    headline,
    guidance,
    boundaries: Object.freeze({ silentCloudFallback: false, silentRuntimeInstall: false, silentModelDownload: false, mobileDesktopInstaller: false, uncertifiedCompanionDownload: false })
  });
}

export function getLocalAiPlatformSupportTruth() {
  return Object.freeze({
    schema: LOCAL_AI_PLATFORM_SUPPORT_SCHEMA,
    windows: Object.freeze({ browserLite: true, desktopRuntime: true, companionReleaseTarget: true }),
    macos: Object.freeze({ browserLite: true, desktopRuntime: true, companionReleaseTarget: true, certificationIndependentFromWindows: true }),
    ios: Object.freeze({ browserLite: true, desktopRuntime: false, companion: false, heavyLocalMedia: false }),
    android: Object.freeze({ browserLite: true, desktopRuntime: false, companion: false, heavyLocalMedia: false }),
    linux: Object.freeze({ browserLite: true, desktopRuntime: true, packagedCompanionClaim: false }),
    liveCapabilityProofRequired: true,
    releaseArtifactProofRequired: true,
    silentCloudFallback: false
  });
}
