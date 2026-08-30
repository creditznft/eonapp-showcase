import { ApiKeyVault } from './utils/api-key-vault.js';
import { saveAISettings, setApiKey, loadAISettings, verifyProviderReadiness, detectLocalProviders, PROVIDERS as RUNTIME_PROVIDERS } from './chat/ai-runtime.js';
import { autoLocalizePage, initAppLanguage, localizeStatic, normalizeLanguageCode, translateForUser } from './utils/app-language.js';
import multiLanguageService from './utils/multi-language.js';
import { initSiteShell } from './utils/site-shell.js';
import { getPersonaPlaybook } from './utils/persona-playbooks.js';
import { getSuperappSetupPlan } from './utils/ai-readiness.js';
import { ensureProfile, getDecentralIdentitySummary, updateRecoveryState } from './utils/profile.js';

import { detectLocalAiCapabilityProfile } from './utils/local-ai-capability-matrix.js';
import { buildGuidedInstallPlan } from './utils/local-model-source-registry.js';
import { getLocalFirstBoundaryNotice } from './local-first/local-first-boundary.js';
import { buildEonDestinationHref, findEonDestinationByRoute } from './contracts/navigation/eon-destination-registry.js';
import { recordEonSetupProgress } from './activation/eon-activation-service.js';

async function localizeSetupText(/** @type {any} */ text) {
  try {
    if (typeof multiLanguageService?.t === 'function') {
      const lang = document?.documentElement?.lang || localStorage.getItem('eonapp_language') || 'en';
      if (lang && lang !== 'en' && typeof translateForUser === 'function') {
        return await translateForUser(String(text || ''), { toLang: lang, category: 'guide' });
      }
    }
  } catch {}
  return String(text || '');
}


async function localizeOnboardingRuntimeText(/** @type {any} */ text) {
  try {
    if (typeof translateForUser === 'function') {
      return await translateForUser(String(text || ''), { toLang: (document?.documentElement?.lang || 'en'), category: 'guide' });
    }
  } catch {}
  return String(text || '');
}

// ── EON Onboarding Wizard ────────────────────────────────────
// Steps: 0=Welcome/HW detect, 1=Provider pick, 2=Key save+test, 3=Mission launch

// DOM type cast for property access
const doc = /** @type {any} */ (document);

const OB_DONE_KEY  = 'eon:onboarding-done:v1';

let _selectedProvider = 'groq';
let _selectedPrompt   = '';
let _selectedMode     = 'agent';
let _providerTouched  = false;
/** @type {any} */
let _hardwareProfile  = null;
/** @type {any[]} */
let _localProviders   = [];
let _languageChoiceRendered = false;

const /** @type {any} */
ONBOARDING_PRESETS = {
  fast_free: {
    label: 'Fast + Free',
    provider: 'groq',
    mode: 'ask',
    persona: 'creator',
    prompt: 'Create a 7-day content plan with 1 short-form post per day and clear CTA.'
  },
  balanced: {
    label: 'Balanced',
    provider: 'gemini',
    mode: 'agent',
    persona: 'operator',
    prompt: 'Build this week\'s operating board with top 3 goals, blockers, and KPI checkpoints.'
  },
  premium: {
    label: 'Premium',
    provider: 'openai',
    mode: 'agent',
    persona: 'founder',
    prompt: 'Prepare a CEO-grade launch memo with risks, mitigations, and execution milestones.'
  },
  local_private: {
    label: 'Local Private',
    provider: 'ollama',
    mode: 'build',
    persona: 'operator',
    prompt: 'Draft a private local-first weekly operations plan with no external APIs.'
  }
};

function markSelectedProviderCard(/** @type {any} */ providerId) {
  const /** @type {any} */
cards = document.querySelectorAll('.ob-provider');
  cards.forEach((/** @type {any} */ card) => {
    const selected = card.dataset.provider === providerId;
    card.classList.toggle('selected', selected);
    card.setAttribute('aria-pressed', selected ? 'true' : 'false');
  });
}

function providerRequiresKey(/** @type {any} */ providerId) {
  const meta = (/** @type {any} */ (PROVIDER_META))[providerId];
  return meta ? meta.requiresKey !== false : true;
}

async function getDefaultKeyPrompt(/** @type {any} */ providerId) {
  const meta = (/** @type {any} */ (PROVIDER_META))[providerId];
  if (meta && meta.requiresKey === false) return await localizeSetupText('No API key required for this local runtime.');
  return await localizeSetupText('Paste key here…');
}

async function renderSetupRecommendations() {
  const plan = getSuperappSetupPlan(loadAISettings(), {
    hardwareTier: _hardwareProfile?.tier || 'unknown',
    ram: _hardwareProfile?.memoryGB || _hardwareProfile?.ram,
    cpuCores: _hardwareProfile?.cpuCores,
    gpu: _hardwareProfile?.gpuRenderer || _hardwareProfile?.gpu,
    localProviders: _localProviders
  });

  const recTitle = doc.getElementById('ob-rec-title');
  const recBody = doc.getElementById('ob-rec-body');
  const localTitle = doc.getElementById('ob-local-rec-title');
  const localBody = doc.getElementById('ob-local-rec-body');

  if (recTitle) {
    if (plan.readiness.ready) {
      recTitle.textContent = `✅ ${plan.readiness.providerLabel} is ready`;
    } else if (plan.hasLocalRuntime) {
      recTitle.textContent = `🖥️ ${plan.suggestedLocalLabel}`;
    } else if (plan.hardwareTier === 'high') {
      recTitle.textContent = `🔥 ${multiLanguageService.t('onboarding.setup.high-title', 'High-end device detected')}`;
    } else if (plan.hardwareTier === 'medium') {
      recTitle.textContent = `✅ ${multiLanguageService.t('onboarding.setup.medium-title', 'Mid-tier device — hosted BYOK + local are available')}`;
    } else {
      recTitle.textContent = `📱 ${multiLanguageService.t('onboarding.setup.light-title', 'Lightweight device — hosted BYOK is available')}`;
    }
  }

  if (recBody) {
    if (plan.readiness.ready) {
      recBody.textContent = await localizeSetupText(`${plan.readiness.bannerBody} ${plan.readiness.trustSummary || ''} ${plan.routeSummary ? `Routing: ${plan.routeSummary}.` : ''} You can open EONBOT immediately or manage keys from Vault.`.trim());
    } else if (plan.hasLocalRuntime) {
      recBody.textContent = await localizeSetupText(`${plan.recommendedReason} ${plan.readiness.modeGuidance || ''} ${plan.readiness.trustSummary || ''} ${plan.routeSummary ? `Routing: ${plan.routeSummary}.` : ''} Choose a local runtime below, or use a hosted BYOK provider after verifying its current model list.`.trim());
    } else if (plan.hardwareTier === 'high') {
      recBody.textContent = multiLanguageService.t('onboarding.setup.high-body', 'This machine can run local models. Install Ollama, LM Studio, or Jan for private inference, or choose any currently enabled hosted BYOK provider after verification.');
    } else if (plan.hardwareTier === 'medium') {
      recBody.textContent = multiLanguageService.t('onboarding.setup.medium-body', 'A hosted BYOK provider can start without a local model install. You can also add Ollama, LM Studio, or Jan later for private local inference.');
    } else {
      recBody.textContent = multiLanguageService.t('onboarding.setup.light-body', 'Start with a currently enabled hosted BYOK provider after verification, or add a local runtime later for private inference on a stronger device.');
    }
  }

  if (localTitle || localBody) {
    if (plan.hasLocalRuntime) {
      if (localTitle) localTitle.textContent = multiLanguageService.t('onboarding.local.detected', 'Local model repository detected');
      if (localBody) { const installPlan = buildGuidedInstallPlan(detectLocalAiCapabilityProfile(), { localProviders: (plan.localProviderLabels || []).map((label) => ({ provider: label, available: true })) }); localBody.textContent = await localizeSetupText(`Available locally: ${plan.localProviderLabels.join(', ')}${plan.localModelNames.length ? ` · Models: ${plan.localModelNames.slice(0, 4).join(', ')}` : ''}. ${plan.capabilityTruth?.headline || ''} ${plan.capabilityTruth?.summary || ''} ${installPlan.summary || ''} ${plan.readiness.modeHeadline || ''} ${plan.readiness.trustSummary || ''} ${plan.routeSummary ? `Routing: ${plan.routeSummary}.` : ''}`.trim()); }
    } else {
      if (localTitle) localTitle.textContent = multiLanguageService.t('onboarding.local.title', 'Local model repository');
      if (localBody) localBody.textContent = await localizeSetupText(`${plan.capabilityTruth?.headline || ''} ${plan.capabilityTruth?.summary || ''} ${(plan.discoveryPlan?.runtimeHints || []).slice(0,1).join(' ')}`.trim() || multiLanguageService.t('onboarding.local.missing', 'No local runtime detected yet. Install Ollama, LM Studio, or Jan for private inference, or continue with a currently enabled hosted BYOK provider after verification.'));
    }
  }

  if (!_providerTouched && plan.recommendedProviderId) {
    _selectedProvider = plan.recommendedProviderId;
    markSelectedProviderCard(_selectedProvider);
  }

  const stepOneNext = doc.getElementById('ob-step-1-next');
  if (stepOneNext) {
    stepOneNext.textContent = providerRequiresKey(_selectedProvider)
      ? multiLanguageService.t('onboarding.next.key', 'Next: Add your key →')
      : multiLanguageService.t('onboarding.next.runtime', 'Next: Confirm runtime →');
  }
}

async function renderIdentityGenesis() {
  const profile = ensureProfile();
  const summary = getDecentralIdentitySummary(profile);
  const titleEl = doc.getElementById('ob-identity-title');
  const bodyEl = doc.getElementById('ob-identity-body');
  const detailEl = doc.getElementById('ob-identity-detail');
  const recoverEl = doc.getElementById('ob-identity-recovery');
  const phraseEl = doc.getElementById('ob-identity-phrase');
  const passkeyEl = doc.getElementById('ob-identity-passkey');
  const backupEl = doc.getElementById('ob-identity-backup');
  const openVaultBtn = doc.getElementById('ob-open-vault-backup');
  const savedBtn = doc.getElementById('ob-recovery-saved-btn');

  if (titleEl) {
    titleEl.textContent = summary.alias ? `Your EON identity is ready: ${summary.alias}` : 'Your EON identity is ready';
  }
  if (bodyEl) {
    bodyEl.textContent = await localizeOnboardingRuntimeText('This identity is generated locally. Your recovery path is: save a passphrase, export an encrypted vault, and keep one safe copy.');
  }
  if (detailEl) {
    detailEl.textContent = `UID ${summary.uid.slice(0, 8)}… · ${summary.browserAttachmentCount} browser attachments · ${summary.entitlementReceiptCount} portable receipts`;
  }
  if (recoverEl) {
    recoverEl.textContent = summary.recoveryLabel;
  }
  if (phraseEl) {
    phraseEl.textContent = summary.recovery?.recoveryPhraseSet ? 'Saved' : 'Not saved yet';
  }
  if (passkeyEl) {
    passkeyEl.textContent = summary.recovery?.passkeyReady ? 'Ready' : 'Not ready';
  }
  if (backupEl) {
    backupEl.textContent = summary.recovery?.lastExportAt ? new Date(summary.recovery.lastExportAt).toLocaleDateString() : 'No encrypted export yet';
  }

  openVaultBtn?.addEventListener('click', () => {
    window.location.href = '/vault#backup';
  });

  savedBtn?.addEventListener('click', () => {
    updateRecoveryState({
      recoveryPhraseSet: true,
      notes: 'Onboarding recovery kit confirmed by user'
    });
    void renderIdentityGenesis();
  });
}

function applyOnboardingPreset(/** @type {any} */ presetId) {
  const preset = (/** @type {any} */ (ONBOARDING_PRESETS))[presetId];
  if (!preset) return;
  const persona = getPersonaPlaybook(preset.persona);
  _selectedProvider = preset.provider;
  _selectedMode = preset.mode;
  _selectedPrompt = `${preset.prompt}\n\nDaily briefing:\n- ${persona.dailyBriefing.join('\n- ')}`;
  _providerTouched = true;
  markSelectedProviderCard(_selectedProvider);

  const /** @type {any} */
recBody = doc.getElementById('ob-rec-body');
  if (recBody) {
    recBody.textContent = `${preset.label} preset selected. Persona: ${persona.title}.`;
  }
}

function renderOnboardingPresetButtons() {
  const /** @type {any} */
rec = doc.getElementById('ob-rec');
  if (!rec) return;
  const /** @type {any} */
existing = doc.getElementById('ob-preset-picker');
  if (existing) existing.remove();

  const /** @type {any} */
holder = doc.createElement('div');
  holder.id = 'ob-preset-picker';
  holder.style.marginTop = '10px';
  holder.innerHTML = `
    <div style="font-size:12px;color:#8b95a7;margin-bottom:6px;">${multiLanguageService.t('onboarding.preset.choose', 'Choose onboarding preset:')}</div>
    <div style="display:flex;gap:6px;flex-wrap:wrap;">
      ${Object.entries(ONBOARDING_PRESETS).map((/** @type {any} */ [id, preset]) => `
        <button type="button" data-ob-preset="${id}" class="ob-btn-ghost">${preset.label}</button>
      `).join('')}
    </div>
  `;
  rec.appendChild(holder);

  holder.querySelectorAll('[data-ob-preset]').forEach((/** @type {any} */ btn) => {
    btn.addEventListener('click', () => {
      applyOnboardingPreset(btn.dataset.obPreset);
    });
  });
}

async function toUserLang(/** @type {any} */ text) {
  return translateForUser(text, { fromLang: 'en', category: 'guide' });
}

function getSupportedLanguageOptions() {
  return multiLanguageService.getSelectableLanguages().map((/** @type {any} */ lang) => ({
    code: lang.code,
    label: `${lang.nativeName || lang.englishName} · ${lang.englishName}`,
    rtl: Boolean(lang.rtl)
  }));
}

function getBrowserLanguageChoice() {
  const /** @type {any} */
  candidates = Array.isArray(navigator.languages) && navigator.languages.length
    ? navigator.languages
    : [navigator.language || 'en'];
  for (const /** @type {any} */ candidate of candidates) {
    const code = String(candidate || '').toLowerCase().split('-')[0];
    if (!code) continue;
    if (multiLanguageService.isLanguageSupported(code)) return code;
  }
  return multiLanguageService.detectBrowserLanguage?.() || 'en';
}

function setOnboardingLanguage(/** @type {any} */ langCode) {
  const next = normalizeLanguageCode(langCode, { allowAuto: true });
  if (!next) return;
  try {
    localStorage.setItem('eon:lang:preference:v1', next);
    localStorage.setItem('eon:lang:v1', next);
  } catch {}
  const resolved = next === 'auto'
    ? (multiLanguageService.detectBrowserLanguage?.() || 'en')
    : next;
  const normalizedResolved = normalizeLanguageCode(resolved) || 'en';
  try {
    multiLanguageService.setUserLanguage(normalizedResolved);
  } catch {}
  document.documentElement.lang = normalizedResolved;
  document.documentElement.dir = multiLanguageService.isRTL(normalizedResolved) ? 'rtl' : 'ltr';
  void renderLanguageChooser();
  localizeStatic(doc);
  void autoLocalizePage(doc);
}

async function renderLanguageChooser() {
  const select = doc.getElementById('ob-language-select');
  const deviceBtn = doc.getElementById('ob-language-device-btn');
  const englishBtn = doc.getElementById('ob-language-english-btn');
  const note = doc.getElementById('ob-language-note');
  const titleEl = doc.getElementById('ob-language-title');
  const bodyEl = doc.getElementById('ob-language-body');
  if (!select || !deviceBtn || !englishBtn) return;

  const currentLang = String(
    localStorage.getItem('eon:lang:preference:v1')
    || localStorage.getItem('eon:lang:v1')
    || document.documentElement.lang
    || ''
  ).toLowerCase();
  const browserChoice = getBrowserLanguageChoice();
  const options = getSupportedLanguageOptions();
  const current = multiLanguageService.isLanguageSupported(currentLang) ? currentLang : 'en';

  if (!_languageChoiceRendered) {
    select.innerHTML = [
      `<option value="auto">Auto · ${browserChoice.toUpperCase() || 'EN'}</option>`,
      ...options.map((item) => `<option value="${item.code}">${item.label}</option>`)
    ].join('');
    _languageChoiceRendered = true;
  }

  select.value = current === 'en' && browserChoice !== 'en' ? browserChoice : current;
  deviceBtn.textContent = browserChoice === 'en' ? 'Use browser language' : `Use ${browserChoice.toUpperCase()} on this device`;
  englishBtn.textContent = await localizeOnboardingRuntimeText('Use English');
  if (note) {
    note.textContent = browserChoice === 'en'
      ? 'Your browser language is English, but you can still choose any supported language below.'
      : `Detected browser language: ${browserChoice.toUpperCase()}. You can switch to that language or choose English instead.`;
  }
  if (titleEl && bodyEl) {
    const langName = options.find((item) => item.code === browserChoice)?.label?.split(' · ')?.[0] || browserChoice.toUpperCase();
    titleEl.textContent = browserChoice === 'en' ? 'Choose your language' : `Switch to ${langName}?`;
    bodyEl.textContent = browserChoice === 'en'
      ? 'If English is not your language, switch now. Chat, voice, and page copy can follow your choice.'
      : 'We detected a likely local language from your browser. You can use it or keep English, and change later at any time.';
  }

  select.onchange = () => {
    const value = String(select.value || '').toLowerCase();
    if (value === 'auto') {
      setOnboardingLanguage(browserChoice || 'en');
      return;
    }
    setOnboardingLanguage(value || 'en');
  };
  deviceBtn.onclick = () => setOnboardingLanguage(browserChoice || 'en');
  englishBtn.onclick = () => setOnboardingLanguage('en');
}

const /** @type {any} */
PROVIDER_META = {
  ollama: {
    label: 'Ollama',
    hint: 'Run private on-device models. No API key required — just confirm the endpoint and local model inventory.',
    signupUrl: 'https://ollama.com/download',
    signupLabel: 'Install Ollama →',
    docsUrl: 'https://ollama.com/library',
    docsLabel: 'Model library',
    badge: '🖥️ Local · Private',
    requiresKey: false,
  },
  lmstudio: {
    label: 'LM Studio',
    hint: 'Run a desktop model server with local endpoints. No API key required.',
    signupUrl: 'https://lmstudio.ai/',
    signupLabel: 'Get LM Studio →',
    docsUrl: 'https://lmstudio.ai/docs',
    docsLabel: 'Docs',
    badge: '🖥️ Local · Desktop',
    requiresKey: false,
  },
  jan: {
    label: 'Jan',
    hint: 'Private local assistant runtime. No API key required.',
    signupUrl: 'https://jan.ai/',
    signupLabel: 'Get Jan →',
    docsUrl: 'https://jan.ai/docs',
    docsLabel: 'Docs',
    badge: '🖥️ Local · Private',
    requiresKey: false,
  },
  groq: {
    label: 'Groq API key',
    hint: 'Hosted BYOK provider. Add your key, then verify the current authenticated model list before use.',
    signupUrl: 'https://console.groq.com/keys',
    signupLabel: 'Get Groq key →',
    docsUrl: 'https://console.groq.com/docs/quickstart',
    docsLabel: 'Sign up free',
    badge: 'BYOK · verify',
    recommended: true,
  },
  gemini: {
    label: 'Gemini API key',
    hint: 'Hosted BYOK provider. Add your key, then verify models that currently support the required Gemini API operation.',
    signupUrl: 'https://aistudio.google.com/app/apikey',
    signupLabel: 'Get Gemini key →',
    docsUrl: 'https://ai.google.dev/gemini-api/docs',
    docsLabel: 'Sign up free',
    badge: 'BYOK · verify',
    recommended: true,
  },
  cerebras: {
    label: 'Cerebras API key',
    hint: 'Hosted BYOK provider. Availability, quota, and models are determined from your account at verification time.',
    signupUrl: 'https://cloud.cerebras.ai',
    signupLabel: 'Get Cerebras key →',
    docsUrl: 'https://inference-docs.cerebras.ai',
    docsLabel: 'Docs',
    badge: 'BYOK · verify',
  },
  sambanova: {
    label: 'SambaNova API key',
    hint: 'Unavailable in the current direct-browser runtime. This reviewed transport stays disabled until browser support is re-verified.',
    signupUrl: 'https://cloud.sambanova.ai',
    signupLabel: 'Get SambaNova key →',
    docsUrl: 'https://docs.sambanova.ai',
    docsLabel: 'Docs',
    badge: 'Unavailable · reviewed',
  },
  fireworks: {
    label: 'Fireworks AI key',
    hint: 'Hosted BYOK provider. Add your key, then verify the current serverless-capable model list before use.',
    signupUrl: 'https://fireworks.ai/login',
    signupLabel: 'Get Fireworks key →',
    docsUrl: 'https://docs.fireworks.ai',
    docsLabel: 'Docs',
    badge: 'BYOK · verify',
  },
  nvidia: {
    label: 'NVIDIA NIM API key',
    hint: 'Unavailable in the current direct-browser runtime. This reviewed transport stays disabled until browser support is re-verified.',
    signupUrl: 'https://build.nvidia.com',
    signupLabel: 'Get NVIDIA key →',
    docsUrl: 'https://docs.api.nvidia.com',
    docsLabel: 'Docs',
    badge: 'Unavailable · reviewed',
  },
  together: {
    label: 'Together AI key',
    hint: 'Hosted BYOK provider. Add your key, then verify the current account-visible namespaced model list before use.',
    signupUrl: 'https://api.together.ai',
    signupLabel: 'Get Together key →',
    docsUrl: 'https://docs.together.ai',
    docsLabel: 'Docs',
    badge: 'BYOK · verify',
  },
  openrouter: {
    label: 'OpenRouter key',
    hint: 'Hosted BYOK model router. Add your key, then verify the current account-visible model list before use.',
    signupUrl: 'https://openrouter.ai/keys',
    signupLabel: 'Get OpenRouter key →',
    docsUrl: 'https://openrouter.ai/docs',
    docsLabel: 'Sign up free',
    badge: 'BYOK · verify',
  },
  xai: {
    label: 'xAI Grok key',
    hint: 'Hosted BYOK provider. Add your key, then verify the current authenticated model list before use.',
    signupUrl: 'https://console.x.ai',
    signupLabel: 'Get xAI key →',
    docsUrl: 'https://docs.x.ai',
    docsLabel: 'Docs',
    badge: 'BYOK · verify',
  },
  qwen: {
    label: 'Qwen Cloud key',
    hint: 'Hosted BYOK provider. Alibaba Model Studio keys and endpoints are region-bound; verify your account endpoint and current model list.',
    signupUrl: 'https://www.alibabacloud.com/help/en/model-studio/get-api-key',
    signupLabel: 'Get Qwen key →',
    docsUrl: 'https://www.alibabacloud.com/help/en/model-studio/qwen-api-via-openai-chat-completions',
    docsLabel: 'Docs',
    badge: 'BYOK · verify',
  },
  huggingface: {
    label: 'HuggingFace API key',
    hint: 'Hosted BYOK Inference Providers router. Add your token, then verify the current chat-capable model list before use.',
    signupUrl: 'https://huggingface.co/settings/tokens',
    signupLabel: 'Get HuggingFace key →',
    docsUrl: 'https://huggingface.co/docs/inference-providers',
    docsLabel: 'Docs',
    badge: 'BYOK · verify',
  },
  mistral: {
    label: 'Mistral API key',
    hint: 'Hosted BYOK provider. Add your key, then verify the current authenticated model list before use.',
    signupUrl: 'https://console.mistral.ai',
    signupLabel: 'Get Mistral key →',
    docsUrl: 'https://docs.mistral.ai',
    docsLabel: 'Docs',
    badge: 'BYOK · verify',
  },
  deepseek: {
    label: 'DeepSeek API key',
    hint: 'Hosted BYOK provider. Add your key, then verify the current model list; retired aliases are filtered before selection.',
    signupUrl: 'https://platform.deepseek.com',
    signupLabel: 'Get DeepSeek key →',
    docsUrl: 'https://api-docs.deepseek.com',
    docsLabel: 'Docs',
    badge: 'BYOK · verify',
  },
  perplexity: {
    label: 'Perplexity API key',
    hint: 'Hosted BYOK research provider. Add your key, then verify the current account model list before use.',
    signupUrl: 'https://docs.perplexity.ai/',
    signupLabel: 'Get Perplexity key →',
    docsUrl: 'https://docs.perplexity.ai',
    docsLabel: 'Docs',
    badge: 'BYOK · verify',
  },
  openai: {
    label: 'OpenAI API key',
    hint: 'Hosted BYOK provider. Add your key, then verify the current authenticated model list before use.',
    signupUrl: 'https://platform.openai.com/api-keys',
    signupLabel: 'Get OpenAI key →',
    docsUrl: 'https://platform.openai.com/docs/api-reference',
    docsLabel: 'Docs',
    badge: 'BYOK · verify',
  },
  anthropic: {
    label: 'Anthropic API key',
    hint: 'Unavailable in the current browser runtime. The dormant adapter cannot be selected until it is separately re-reviewed and enabled.',
    signupUrl: 'https://console.anthropic.com',
    signupLabel: 'Get Anthropic key →',
    docsUrl: 'https://docs.anthropic.com',
    docsLabel: 'Docs',
    badge: 'Unavailable · dormant',
  },
};

// ── Step navigation ──────────────────────────────────────────

function goTo(/** @type {any} */ step) {
  const TOTAL = 4;
  for (let i = 0; i < TOTAL; i++) {
    const /** @type {any} */
el = doc.getElementById(`ob-step-${i}`);
    if (el) el.classList.toggle('active', i === step);
  }
  // Update progress dots
  for (let i = 0; i < TOTAL; i++) {
    const /** @type {any} */
dot = doc.getElementById(`dot-${i}`);
    if (!dot) continue;
    dot.classList.remove('active', 'done');
    if (i < step) dot.classList.add('done');
    else if (i === step) dot.classList.add('active');
  }
}

// ── Step 0: Hardware detection ───────────────────────────────

function detectHardware() {
  const profile = detectLocalAiCapabilityProfile();
  _hardwareProfile = profile;

  const tierEl = doc.getElementById('ob-hw-tier');
  if (tierEl) tierEl.innerHTML = `<span class="ob-hw-tier tier-${profile.tier}">${String(profile.tier || 'low').toUpperCase()}</span>`;
  const ramEl = doc.getElementById('ob-hw-ram');
  if (ramEl) ramEl.textContent = profile.memoryGB ? `${profile.memoryGB} GB` : 'Unknown';
  const cpuEl = doc.getElementById('ob-hw-cpu');
  if (cpuEl) cpuEl.textContent = profile.cpuCores ? `${profile.cpuCores} cores` : 'Unknown';
  const gpuEl = doc.getElementById('ob-hw-gpu');
  if (gpuEl) gpuEl.textContent = String(profile.gpuRenderer || 'Unknown').slice(0, 28);

  void renderSetupRecommendations();
  return profile;
}

// ── Step 1: Provider selection ───────────────────────────────

function initProviderPicker() {
  const /** @type {any} */
cards = document.querySelectorAll('.ob-provider');
  cards.forEach((/** @type {any} */ card) => {
    const providerId = String(card?.dataset?.provider || '').trim();
    const runtimeProvider = (/** @type {any} */ (RUNTIME_PROVIDERS))[providerId] || null;
    if (runtimeProvider?.enabled === false) {
      card.hidden = true;
      card.setAttribute('aria-disabled', 'true');
      return;
    }
    card.addEventListener('click', () => {
      _selectedProvider = card.dataset.provider;
      _providerTouched = true;
      cards.forEach((/** @type {any} */ c) => {
        c.classList.remove('selected');
        c.setAttribute('aria-pressed', 'false');
      });
      card.classList.add('selected');
      card.setAttribute('aria-pressed', 'true');
      void updateKeyStepUI(_selectedProvider);
      void renderSetupRecommendations();
    });
    card.addEventListener('keydown', (/** @type {any} */ e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); card.click(); }
    });
  });
}

// ── Step 2: Key input ────────────────────────────────────────

async function updateKeyStepUI(/** @type {any} */ provider) {
  const meta = (/** @type {any} */ (PROVIDER_META))[provider];
  if (!meta) return;
  const /** @type {any} */
titleEl = doc.getElementById('ob-key-step-title');
  const /** @type {any} */
labelEl = doc.getElementById('ob-key-label');
  const /** @type {any} */
hintEl  = doc.getElementById('ob-key-hint');
  const /** @type {any} */
linksEl = doc.getElementById('ob-key-links');
  if (titleEl) {
    titleEl.textContent = meta.requiresKey === false
      ? `Confirm your ${meta.label} runtime`
      : `Add your ${meta.label.split(' ')[0]} API key`;
  }
  if (labelEl) labelEl.textContent = meta.requiresKey === false ? `${meta.label} runtime` : meta.label;
  if (hintEl)  hintEl.innerHTML    = meta.hint;
  if (linksEl) {
    linksEl.innerHTML = `
      <a href="${meta.signupUrl}" target="_blank" rel="noopener">${meta.signupLabel}</a>
      <a href="${meta.docsUrl}" target="_blank" rel="noopener">${meta.docsLabel}</a>
    `;
  }
  // Clear previous result
  const /** @type {any} */
resultEl = doc.getElementById('ob-test-result');
  if (resultEl) { resultEl.className = 'ob-test-result'; resultEl.textContent = ''; }
  const /** @type {any} */
input = doc.getElementById('ob-api-key-input');
  if (input) {
    (/** @type {any} */ (input)).value = '';
    (/** @type {any} */ (input)).disabled = meta.requiresKey === false;
    (/** @type {any} */ (input)).placeholder = await getDefaultKeyPrompt(provider);
  }
}

function saveProviderSelection(/** @type {any} */ provider, /** @type {any} */ key, /** @type {any} */ activeModel = '') {
  const runtimeProvider = (/** @type {any} */ (RUNTIME_PROVIDERS))[provider] || null;

  try {
    const settingsRaw = localStorage.getItem('eon:ai-chat-settings:v1');
    const settings = settingsRaw ? JSON.parse(settingsRaw) : {};
    const nextModel = String(activeModel || settings.model || runtimeProvider?.defaultModel || '').trim();
    const nextEndpoint = String(settings.endpoint || runtimeProvider?.defaultEndpoint || '').trim();
    saveAISettings({
      ...settings,
      provider,
      model: nextModel,
      endpoint: nextEndpoint,
      mode: 'hybrid'
    });
  } catch {}

  if (providerRequiresKey(provider)) {
    // Keep the provider key in the current browser session only. Durable recovery is configured separately in Vault with a user passphrase.
    ApiKeyVault.store(provider, key).catch(() => {});

    // Session-only runtime key path (no plaintext persistence at rest)
    try { setApiKey(provider, key, false); } catch {}
  }

  // Scrub any legacy plaintext key mirrors from prior versions
  try {
    const legacyWorkbenchKey = 'eon:workbench:provider-keys:v1';
    const legacyFieldMap = { groq: 'groqKey', gemini: 'geminiKey', together: 'togetherKey', openrouter: 'openrouterKey' };
    const legacyWorkbenchRaw = localStorage.getItem(legacyWorkbenchKey);
    if (legacyWorkbenchRaw) {
      const legacyWorkbench = JSON.parse(legacyWorkbenchRaw);
      const legacyField = (/** @type {any} */ (legacyFieldMap))[provider];
      if (legacyField && legacyWorkbench[legacyField]) {
        delete legacyWorkbench[legacyField];
        localStorage.setItem(legacyWorkbenchKey, JSON.stringify(legacyWorkbench));
      }
    }
  } catch {}

  try {
    const legacyDeviceKey = 'eon:ai-chat-device-keys:v1';
    const legacyDeviceRaw = localStorage.getItem(legacyDeviceKey);
    if (legacyDeviceRaw) {
      const legacyDevice = JSON.parse(legacyDeviceRaw);
      if (legacyDevice && legacyDevice[provider]) {
        delete legacyDevice[provider];
        localStorage.setItem(legacyDeviceKey, JSON.stringify(legacyDevice));
      }
    }
  } catch {}
}

async function testProvider(/** @type {any} */ provider, /** @type {any} */ key) {
  const meta = (/** @type {any} */ (PROVIDER_META))[provider];
  if (!meta) return { ok: false, message: await toUserLang('No provider selected.') };
  if (meta.requiresKey !== false && !key) return { ok: false, message: await toUserLang('Paste your API key before testing.') };

  const runtimeProvider = (/** @type {any} */ (RUNTIME_PROVIDERS))[provider] || null;
  if (!runtimeProvider) return { ok: false, message: await toUserLang('This provider is not available in the current runtime.') };
  if (runtimeProvider.enabled === false) return { ok: false, message: await toUserLang('This provider is disabled in the current browser runtime. Choose a currently enabled provider.') };

  // W260-R3 A1: a provider can only be marked ready after an authenticated,
  // user-initiated model-list proof. Do not POST a fixed sample model here:
  // providers retire aliases and a successful request would not prove the
  // selected account can use the current model list.
  if (meta.requiresKey !== false) {
    const verification = await verifyProviderReadiness(provider, key, { forceRefresh: true });
    const label = String(meta.label || provider).replace(/\s+API key$/i, '').replace(/\s+runtime$/i, '');
    if (verification?.ok && verification?.model) {
      return {
        ok: true,
        activeModel: String(verification.model),
        message: await toUserLang(`✓ ${label} verified using your current model list. Selected model: ${verification.model}.`)
      };
    }
    const reason = String(verification?.error || verification?.status || 'Provider verification failed.');
    return { ok: false, message: await toUserLang(`Connection could not be verified: ${reason.slice(0, 160)}`) };
  }

  // Local runtimes require their dedicated device-local self-test instead of a
  // cloud readiness claim from onboarding.
  return {
    ok: false,
    message: await toUserLang('Run the Local AI device self-test from Local AI before using this runtime in EONBOT.')
  };
}

// ── Step 3: Mission selection ────────────────────────────────

function initMissionPicker() {
  const /** @type {any} */
cards = document.querySelectorAll('.ob-mission-card');
  if (cards.length) {
    // Set default from first card
    _selectedPrompt = (/** @type {any} */ (cards[0])).dataset.prompt || '';
    _selectedMode   = (/** @type {any} */ (cards[0])).dataset.mode   || 'ask';
  }
  cards.forEach((/** @type {any} */ card) => {
    card.addEventListener('click', () => {
      _selectedPrompt = card.dataset.prompt || '';
      _selectedMode   = card.dataset.mode   || 'ask';
      cards.forEach((/** @type {any} */ c) => {
        c.classList.remove('selected');
        c.setAttribute('aria-pressed', 'false');
      });
      card.classList.add('selected');
      card.setAttribute('aria-pressed', 'true');
    });
    card.addEventListener('keydown', (/** @type {any} */ e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); card.click(); }
    });
  });
}

function launchWorkBench() {
  // Mark onboarding done without creating an account, marketing permission or automatic execution.
  try { localStorage.setItem(OB_DONE_KEY, '1'); } catch {}
  recordEonSetupProgress({ setupId: 'onboarding', state: 'completed', destinationId: 'home', stepId: 'mission-selected' });

  const destCard = document.querySelector('.ob-mission-card.selected[data-dest]');
  if (destCard) {
    const requestedRoute = (/** @type {any} */ (destCard)).dataset.dest || '';
    const destination = findEonDestinationByRoute(requestedRoute);
    const href = destination ? buildEonDestinationHref(destination.id, { handoff: 'onboarding' }) : '';
    if (href) { window.location.href = href; return; }
  }

  // Keep only the selected starter in this browser tab. EONBOT remains the canonical guest-first home.
  try {
    sessionStorage.setItem('eon:launch-mission:v1', JSON.stringify({
      prompt: _selectedPrompt,
      mode: _selectedMode,
    }));
  } catch {}

  window.location.href = buildEonDestinationHref('home', { handoff: 'onboarding' }) || '/';
}

// ── Init ─────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  initAppLanguage();
  initSiteShell();
  recordEonSetupProgress({ setupId: 'onboarding', state: 'in-progress', destinationId: 'home', stepId: 'opened' });
  // If already onboarded, redirect to workbench
  if (localStorage.getItem(OB_DONE_KEY)) {
    // Still allow viewing by not redirecting — user chose this page
  }

  // Step 0 — hardware detect
  detectHardware();
  void (async () => {
    try {
      _localProviders = await detectLocalProviders();
    } catch {
      _localProviders = [];
    }
  void renderSetupRecommendations();
  })();
  void renderIdentityGenesis();
  void renderLanguageChooser();
  localizeStatic(doc);
  void autoLocalizePage(doc);
  renderOnboardingPresetButtons();

  doc.getElementById('ob-step-0-next')?.addEventListener('click', () => goTo(1));
  doc.addEventListener('language-changed', () => {
    void renderLanguageChooser();
    void renderIdentityGenesis();
    void renderSetupRecommendations();
    localizeStatic(doc);
    void autoLocalizePage(doc);
  });

  // Step 1 — provider picker
  initProviderPicker();

  const presetFromUrl = new URLSearchParams(window.location.search).get('preset');
  if (presetFromUrl) {
    applyOnboardingPreset(presetFromUrl);
  }

  doc.getElementById('ob-step-1-next')?.addEventListener('click', () => {
    void updateKeyStepUI(_selectedProvider);
    goTo(2);
  });
  doc.getElementById('ob-step-1-back')?.addEventListener('click', () => goTo(0));

  // Step 2 — key test & save
  doc.getElementById('ob-step-2-test')?.addEventListener('click', async () => {
    const /** @type {any} */
input = doc.getElementById('ob-api-key-input');
    const /** @type {any} */
resultEl = doc.getElementById('ob-test-result');
    const /** @type {any} */
btn = doc.getElementById('ob-step-2-test');
    const key = input ? (/** @type {any} */ (input)).value.trim() : '';

    if (providerRequiresKey(_selectedProvider) && !key) {
      if (resultEl) {
        resultEl.className = 'ob-test-result err';
        void toUserLang('Paste your API key before testing.').then((/** @type {any} */ text) => {
          resultEl.textContent = text;
        });
      }
      return;
    }

    if (btn) { (/** @type {any} */ (btn)).disabled = true; btn.textContent = await localizeOnboardingRuntimeText('⏳ Testing…'); }
    if (resultEl) {
      resultEl.className = 'ob-test-result pending';
      void toUserLang('Sending a quick ping to the provider...').then((/** @type {any} */ text) => {
        resultEl.textContent = text;
      });
    }

    const result = await testProvider(_selectedProvider, key);

    if (result.ok) {
      saveProviderSelection(_selectedProvider, key, result.activeModel);
      try {
        const settingsRaw = localStorage.getItem('eon:ai-chat-settings:v1');
        const settings = settingsRaw ? JSON.parse(settingsRaw) : {};
        const nextModel = String(result.activeModel || settings.model || '').trim();
        saveAISettings({
          ...settings,
          provider: _selectedProvider,
          model: nextModel,
          mode: 'hybrid'
        });
      } catch {}
      if (resultEl) {
        resultEl.className = 'ob-test-result ok';
        resultEl.textContent = result.message;
      }
      // Auto-advance after 1.2s
      setTimeout(() => {
        initMissionPicker();
        goTo(3);
      }, 1200);
    } else {
      if (resultEl) {
        resultEl.className = 'ob-test-result err';
        resultEl.textContent = result.message;
      }
    }

    if (btn) {
      (/** @type {any} */ (btn)).disabled = false;
      void toUserLang('Test & Save').then((/** @type {any} */ text) => {
        btn.textContent = text;
      });
    }
  });

  doc.getElementById('ob-step-2-skip')?.addEventListener('click', () => {
    initMissionPicker();
    goTo(3);
  });

  doc.getElementById('ob-step-2-back')?.addEventListener('click', () => goTo(1));

  // Step 3 — mission launch
  initMissionPicker();
  doc.getElementById('ob-step-3-launch')?.addEventListener('click', launchWorkBench);
  doc.getElementById('ob-step-3-back')?.addEventListener('click', () => goTo(2));

  // Provider keys remain separate from EONAPP identity. This line is intentionally
  // local UI truth only; it does not start an account, sign-in, or connection flow.
  const providerBoundary = doc.getElementById('ob-provider-boundary-status');
  if (providerBoundary) providerBoundary.textContent = getLocalFirstBoundaryNotice('geminiByok');

});
