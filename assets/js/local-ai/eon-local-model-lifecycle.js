/**
 * Institutional Local AI model lifecycle authority.
 *
 * This module only reasons over device hints, the reviewed starter catalogue
 * and model rows already returned by a user-triggered loopback scan. It never
 * probes a runtime, fetches a remote catalogue, downloads weights, starts a
 * runtime, changes Chat provider authority or marks a model verified.
 */
import {
  buildOllamaPullCommand,
  findPreferredDiscoveredLocalModel,
  getLocalAiStarterCatalog
} from './local-ai-catalog.js';
import { getLocalAiRuntimeContract, normalizeLocalAiRuntimeId } from '../../../config/local-ai-browser-contract.mjs';

export const EON_LOCAL_MODEL_LIFECYCLE_SCHEMA = 'eonapp.local-model-lifecycle.v1';
export const EON_LOCAL_MODEL_SCAN_FRESH_MS = 15 * 60 * 1000;

const clean = (value = '') => String(value || '').trim();
const modelKey = (value = '') => clean(value).toLowerCase();

function isWeakDevice(device = {}) {
  const computeClass = clean(device.computeClass).toLowerCase();
  const platform = clean(device.platformFamily).toLowerCase();
  const memoryGb = Number(device.memoryGB || device.memoryGb || 0) || 0;
  return computeClass === 'mobile' || /mobile|android|ios/.test(platform) || (memoryGb > 0 && memoryGb <= 4);
}

function installedRows(models = []) {
  return (Array.isArray(models) ? models : [])
    .filter((row) => row && typeof row === 'object' && clean(row.model))
    .map((row) => Object.freeze({
      model: clean(row.model),
      sizeBytes: Math.max(0, Number(row.sizeBytes || row.size || 0) || 0),
      localOnly: row.localOnly !== false,
      modifiedAt: clean(row.modifiedAt || row.modified_at || ''),
      digest: clean(row.digest || '')
    }));
}

function matchesModel(installed = '', reviewed = '') {
  const left = modelKey(installed);
  const right = modelKey(reviewed);
  return Boolean(left && right && (left === right || left.startsWith(`${right}:`)));
}

function reviewedInstallCandidate(device = {}, installed = []) {
  const catalog = getLocalAiStarterCatalog({ device });
  return catalog.profiles
    .filter((profile) => profile.fit.level !== 'not-recommended')
    .sort((a, b) => Number(a.priority ?? 999) - Number(b.priority ?? 999))
    .find((profile) => !installed.some((row) => matchesModel(row.model, profile.model))) || null;
}

export function buildLocalModelInstallHandoff(profile, runtimeValue = '') {
  const runtimeId = normalizeLocalAiRuntimeId(runtimeValue);
  const runtime = getLocalAiRuntimeContract(runtimeId);
  if (!profile || !runtime || !profile.model) return null;
  if (runtimeId === 'ollama') {
    return Object.freeze({
      schema: EON_LOCAL_MODEL_LIFECYCLE_SCHEMA,
      runtimeId,
      kind: 'copy-command',
      model: profile.model,
      label: `Copy Ollama pull command for ${profile.model}`,
      command: buildOllamaPullCommand(profile),
      officialUrl: profile.officialUrl,
      explicitUserActionRequired: true,
      downloadStarted: false,
      installStarted: false
    });
  }
  return Object.freeze({
    schema: EON_LOCAL_MODEL_LIFECYCLE_SCHEMA,
    runtimeId,
    kind: 'open-runtime-model-manager',
    model: profile.model,
    label: `Review ${runtime.label} model manager`,
    command: '',
    officialUrl: runtime.officialDocs,
    explicitUserActionRequired: true,
    downloadStarted: false,
    installStarted: false,
    note: `EONAPP does not assume the reviewed Ollama tag maps to an identical ${runtime.label} catalogue identifier. Choose and download a compatible model inside ${runtime.label}.`
  });
}

export function buildLocalModelLifecycleState(input = {}) {
  const runtimeId = normalizeLocalAiRuntimeId(input.runtimeId || input.runtimeName || '');
  const runtime = getLocalAiRuntimeContract(runtimeId);
  const device = input.device && typeof input.device === 'object' ? input.device : {};
  const models = installedRows(input.models);
  const selectedModel = clean(input.selectedModel || '');
  const now = Number(input.now || Date.now());
  const scannedAt = Number(input.scannedAt || 0);
  const weakDevice = isWeakDevice(device);
  const preferred = weakDevice ? null : findPreferredDiscoveredLocalModel(models, { device });
  const selectedInstalled = Boolean(selectedModel && models.some((row) => modelKey(row.model) === modelKey(selectedModel)));
  const installCandidate = weakDevice ? null : reviewedInstallCandidate(device, models);
  const installHandoff = installCandidate && runtimeId ? buildLocalModelInstallHandoff(installCandidate, runtimeId) : null;
  const catalog = getLocalAiStarterCatalog({ device });
  const preferredProfile = preferred ? catalog.profiles.find((profile) => matchesModel(preferred.model, profile.model)) || null : null;
  const reviewedUpgradeAvailable = Boolean(installCandidate && (!preferredProfile || Number(installCandidate.priority ?? 999) < Number(preferredProfile.priority ?? 999)));
  const scanAgeMs = scannedAt > 0 && now >= scannedAt ? now - scannedAt : null;
  const scanFresh = scanAgeMs !== null && scanAgeMs <= EON_LOCAL_MODEL_SCAN_FRESH_MS;

  let state = 'scan-required';
  let message = 'Scan installed models after you start the runtime. EONAPP will not probe it in the background.';
  if (weakDevice) {
    state = 'guide-mode-default';
    message = 'This device is not eligible for an automatic local-model recommendation. You may inspect an already-running runtime, but EONAPP will not auto-fill or auto-install a model.';
  } else if (scannedAt > 0 && !models.length) {
    state = 'no-installed-models';
    message = 'The runtime responded, but no installed local-only text model is available. Review a model in the runtime yourself; nothing will download automatically.';
  } else if (preferred && selectedModel && modelKey(preferred.model) === modelKey(selectedModel)) {
    state = reviewedUpgradeAvailable ? 'reviewed-current-upgrade-available' : 'reviewed-current-model';
    message = reviewedUpgradeAvailable
      ? `${selectedModel} is the best reviewed model already installed, while ${installCandidate.model} is a higher-priority reviewed option that is not installed. Keep using the installed model or review the explicit install handoff; nothing downloads automatically.`
      : `${selectedModel} is the current reviewed installed candidate for this device. A self-test is still required before EONBOT can use it.`;
  } else if (preferred && selectedModel && selectedInstalled) {
    state = 'better-installed-candidate';
    message = `${preferred.model} is a more conservative reviewed installed candidate than ${selectedModel}. Changing the field does not activate it; run the self-test first.`;
  } else if (preferred) {
    state = 'reviewed-installed-candidate';
    message = `${preferred.model} is the preferred reviewed installed candidate for a self-test on this device.`;
  } else if (models.length) {
    state = 'manual-installed-choice';
    message = 'Installed local models were found, but none matches a reviewed starter profile closely enough for EONAPP to auto-recommend it. Choose one manually and run the self-test.';
  }

  return Object.freeze({
    schema: EON_LOCAL_MODEL_LIFECYCLE_SCHEMA,
    runtimeId,
    runtimeLabel: runtime?.label || clean(input.runtimeName || '') || 'Local runtime',
    state,
    message,
    weakDevice,
    selectedModel,
    selectedInstalled,
    preferredInstalledModel: preferred?.model || '',
    installedCount: models.length,
    scannedAt: scannedAt || 0,
    scanAgeMs,
    scanFresh,
    refreshRecommended: scannedAt > 0 && !scanFresh,
    automaticScan: false,
    automaticModelFillOnWeakDevice: false,
    automaticDownload: false,
    automaticInstall: false,
    automaticRuntimeStart: false,
    automaticChatSelection: false,
    selfTestRequired: true,
    reviewedUpgradeAvailable,
    installCandidate: installCandidate ? Object.freeze({
      id: installCandidate.id,
      label: installCandidate.label,
      model: installCandidate.model,
      fit: installCandidate.fit
    }) : null,
    installHandoff
  });
}

export function getLocalModelLifecycleTruth() {
  return Object.freeze({
    schema: EON_LOCAL_MODEL_LIFECYCLE_SCHEMA,
    userTriggeredRuntimeScanOnly: true,
    backgroundRuntimeProbe: false,
    reviewedInstalledRecommendation: true,
    weakDeviceAutoRecommendation: false,
    arbitraryInstalledModelAutoRecommendation: false,
    explicitInstallHandoffOnly: true,
    automaticModelDownload: false,
    automaticRuntimeInstall: false,
    automaticRuntimeStart: false,
    automaticChatSelection: false,
    selfTestBeforeChatSelection: true,
    providerSwitching: false,
    localModelRemoteCatalogueFetch: false
  });
}
