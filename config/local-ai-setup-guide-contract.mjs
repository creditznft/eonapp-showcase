import { LOCAL_AI_LITE_PACK } from './local-ai-consumer-experience-contract.mjs';

/**
 * RT90 Local AI Setup Guide contract.
 *
 * The beginner layer now prefers one consumer setup action. After that explicit
 * action, EON may scan only approved loopback runtimes and run bounded self-
 * tests so a novice does not have to understand ports/CORS. Third-party app
 * installation, model download, OS elevation and cloud fallback remain
 * explicit; none happens silently.
 */
export const LOCAL_AI_SETUP_GUIDE_VERSION = 'eon.local-ai.setup-guide.v3';
export const LOCAL_AI_SETUP_GUIDE_REVIEWED_AT = '2026-08-14';

const freezeRows = (rows) => Object.freeze(rows.map((row) => Object.freeze({ ...row })));

export const LOCAL_AI_SETUP_GOALS = freezeRows([
  {
    id: 'private-chat',
    label: 'Private chat and everyday help',
    description: 'Private notes, summaries, language help and EONBOT conversations.',
    firstModelProfile: 'compact-private-chat',
    fallbackProfile: 'starter-private-chat',
    mediaBoundary: 'Text setup only. Images, video and music have separate readiness checks and never become enabled just because text AI works.'
  },
  {
    id: 'coding',
    label: 'Coding and building',
    description: 'Small code explanations, drafts and private project help.',
    firstModelProfile: 'balanced-private-chat',
    fallbackProfile: 'starter-private-chat',
    mediaBoundary: 'Text/code setup only. Creator media remains independently verified.'
  },
  {
    id: 'creator-planning',
    label: 'Creator ideas and content planning',
    description: 'Captions, scripts, concepts, shot lists and prompt drafts before media generation.',
    firstModelProfile: 'compact-private-chat',
    fallbackProfile: 'starter-private-chat',
    mediaBoundary: 'This prepares local text help. Local image, video and music use separate Creator readiness rails.'
  }
]);

export const REVIEWED_LOCAL_AI_RUNTIME_GUIDES = freezeRows([
  {
    id: 'lmstudio',
    label: 'LM Studio',
    style: 'Visual desktop app',
    officialDownloadUrl: 'https://lmstudio.ai/download',
    officialModelGuideUrl: 'https://lmstudio.ai/docs/app/basics/download-model',
    supportedPlatforms: ['windows', 'mac-desktop', 'apple-silicon', 'linux', 'desktop'],
    setupHint: 'If LM Studio is already installed, EON can check its approved local server during the setup action. Otherwise EON opens the official installer and guides the minimum one-time app setup.',
    eonRuntimeId: 'lmstudio',
    preferredFor: ['private-chat', 'coding', 'creator-planning']
  },
  {
    id: 'ollama',
    label: 'Ollama',
    style: 'Simple local runtime',
    officialDownloadUrl: 'https://ollama.com/download',
    officialModelGuideUrl: 'https://ollama.com/library',
    supportedPlatforms: ['windows', 'mac-desktop', 'apple-silicon', 'linux', 'desktop'],
    setupHint: 'If Ollama is installed, EON checks its approved loopback API and tests only a model that conservatively fits this device. Missing model downloads still require your approval.',
    eonRuntimeId: 'ollama',
    preferredFor: ['private-chat', 'coding', 'creator-planning']
  },
  {
    id: 'jan',
    label: 'Jan',
    style: 'All-in-one desktop app',
    officialDownloadUrl: 'https://www.jan.ai/download',
    officialModelGuideUrl: 'https://www.jan.ai/docs',
    supportedPlatforms: ['windows', 'apple-silicon', 'linux', 'desktop'],
    setupHint: 'If Jan is already serving a local model on an approved loopback port, EON can find and self-test it from the same setup action.',
    eonRuntimeId: 'jan',
    preferredFor: ['private-chat', 'creator-planning']
  }
]);

function asNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function findLocalAiSetupGoal(goalId = '') {
  return LOCAL_AI_SETUP_GOALS.find((goal) => goal.id === String(goalId || '').trim()) || null;
}

export function findReviewedLocalAiRuntimeGuide(runtimeId = '') {
  return REVIEWED_LOCAL_AI_RUNTIME_GUIDES.find((runtime) => runtime.id === String(runtimeId || '').trim()) || null;
}

function isMobile(profile = {}) {
  return String(profile?.computeClass || '').toLowerCase() === 'mobile' || /mobile/i.test(String(profile?.platformFamily || ''));
}

function chooseProfileId(profile = {}, goal = {}) {
  const memoryGb = asNumber(profile.memoryGB || profile.memoryGb);
  const goalId = String(goal.id || 'private-chat');
  if (goalId === 'coding' && memoryGb >= 16) return goal.firstModelProfile || 'balanced-private-chat';
  if (goalId === 'creator-planning' && memoryGb >= 8) return goal.firstModelProfile || 'compact-private-chat';
  if (memoryGb >= 8) return goal.firstModelProfile || 'starter-private-chat';
  return goal.fallbackProfile || 'starter-private-chat';
}

export function buildLocalAiSetupGuide(profile = {}, options = {}) {
  const goal = findLocalAiSetupGoal(options.goalId) || LOCAL_AI_SETUP_GOALS[0];
  const platform = String(profile.platformFamily || 'desktop');
  const mobile = isMobile(profile);
  const memoryGb = asNumber(profile.memoryGB || profile.memoryGb);
  const candidates = REVIEWED_LOCAL_AI_RUNTIME_GUIDES
    .filter((runtime) => runtime.supportedPlatforms.includes(platform) || runtime.supportedPlatforms.includes('desktop'))
    .filter((runtime) => runtime.preferredFor.includes(goal.id));
  const primaryRuntime = mobile ? null : (candidates.find((runtime) => runtime.id === 'lmstudio') || candidates[0] || null);
  const selectedProfileId = mobile ? null : chooseProfileId(profile, goal);
  const route = mobile
    ? 'browser-local-lite-first'
    : memoryGb > 0 && memoryGb < 8
      ? 'local-lite-first-then-small-desktop-runtime-if-needed'
      : 'one-click-detect-existing-runtime-then-offer-reviewed-setup';

  return Object.freeze({
    version: LOCAL_AI_SETUP_GUIDE_VERSION,
    reviewedAt: LOCAL_AI_SETUP_GUIDE_REVIEWED_AT,
    goal,
    platform,
    mobile,
    route,
    browserLite: Object.freeze({
      available: true,
      providerId: LOCAL_AI_LITE_PACK.providerId,
      label: LOCAL_AI_LITE_PACK.label,
      model: LOCAL_AI_LITE_PACK.model,
      firstUseDownloadRequired: true,
      intendedUse: LOCAL_AI_LITE_PACK.intendedUse
    }),
    primaryRuntime,
    alternativeRuntimes: Object.freeze(candidates.filter((runtime) => runtime.id !== primaryRuntime?.id)),
    suggestedProfileId: selectedProfileId,
    facts: Object.freeze([
      'One setup tap may check only EONAPP-approved local runtime endpoints and run bounded self-tests on this device.',
      'EON may automatically choose a local model only after that exact model passes a local self-test and fits conservative device limits.',
      'Desktop app installation, model downloads and operating-system elevation remain visible user-approved actions.',
      'A failed local test never silently switches the request to cloud AI.',
      'Phones and low-power browsers can use EON Local Lite when the browser supports on-device inference; heavy local image/video remains separately device-gated.'
    ])
  });
}

export function validateLocalAiSetupGuideContract() {
  const errors = [];
  for (const goal of LOCAL_AI_SETUP_GOALS) {
    if (!goal.id || !goal.label || !goal.firstModelProfile) errors.push(`Invalid Local AI goal: ${goal.id || '(missing id)'}`);
  }
  for (const runtime of REVIEWED_LOCAL_AI_RUNTIME_GUIDES) {
    if (!runtime.id || !runtime.eonRuntimeId || !runtime.officialDownloadUrl.startsWith('https://')) errors.push(`Invalid reviewed runtime guide: ${runtime.id || '(missing id)'}`);
    if (!runtime.officialModelGuideUrl.startsWith('https://')) errors.push(`Invalid model guide URL: ${runtime.id || '(missing id)'}`);
    if (!Array.isArray(runtime.supportedPlatforms) || !runtime.supportedPlatforms.length) errors.push(`Runtime platforms missing: ${runtime.id || '(missing id)'}`);
  }
  const mobile = buildLocalAiSetupGuide({ computeClass: 'mobile', platformFamily: 'android-mobile', memoryGB: 8 }, { goalId: 'private-chat' });
  if (mobile.primaryRuntime !== null || mobile.suggestedProfileId !== null) errors.push('Mobile guidance must not recommend a desktop runtime/model install as the first route.');
  if (mobile.route !== 'browser-local-lite-first' || mobile.browserLite?.available !== true) errors.push('Mobile guidance must expose Local Lite as the first local text route.');
  return errors;
}
