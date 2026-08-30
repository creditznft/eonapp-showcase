// ── Provider definitions ──────────────────────────────────────────────────────
import { getApiKey, getOptionalHostedProviders, saveAISettings, setApiKey, verifyProviderReadiness } from './chat/ai-runtime.js';
import { ApiKeyVault } from './utils/api-key-vault.js';
import multiLanguageService from './utils/multi-language.js';
import getLocalRuntimeDetector from './services/LocalRuntimeDetector.js';
import { detectLocalAiCapabilityProfile, buildLocalWorkloadMatrix, buildLocalModelDiscoveryPlan, summarizeLocalCapabilityTruth } from './utils/local-ai-capability-matrix.js';
import { buildGuidedInstallPlan, buildInstallTruthPolicy } from './utils/local-model-source-registry.js';

// DOM type cast for property access
const aiDoc = (() => /** @type {any} */ (document))();

// W260-R3 A1: only active EONBOT hosted providers can be marked ready, after a user-triggered model-list check.
const VERIFIED_HOSTED_PROVIDER_IDS = new Set(getOptionalHostedProviders());
const LEGACY_DISABLED_PROVIDER_KEY_IDS = Object.freeze(['cohere', 'anthropic', 'nvidia', 'sambanova', 'custom']);

function esc(/** @type {any} */ value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const /** @type {any} */
PROVIDER_GUIDES = [
  { id: 'groq', label: 'Groq', mode: 'Chat', hint: 'Hosted BYOK provider. Verify the current authenticated model list before use.', signupUrl: 'https://console.groq.com/keys', docsUrl: 'https://console.groq.com/docs/quickstart', keyPrefix: 'gsk_' },
  { id: 'gemini', label: 'Google Gemini', mode: 'Gemini API', hint: 'Hosted BYOK provider. Verify models that currently support generateContent before use.', signupUrl: 'https://aistudio.google.com/app/apikey', docsUrl: 'https://ai.google.dev/gemini-api/docs', keyPrefix: 'AIza' },
  { id: 'cerebras', label: 'Cerebras', mode: 'Chat', hint: 'Hosted BYOK provider. Availability, quota, and models come from your account at verification time.', signupUrl: 'https://cloud.cerebras.ai', docsUrl: 'https://inference-docs.cerebras.ai', keyPrefix: '' },
  { id: 'mistral', label: 'Mistral AI', mode: 'Chat', hint: 'Hosted BYOK provider. Verify the current authenticated model list before use.', signupUrl: 'https://console.mistral.ai', docsUrl: 'https://docs.mistral.ai', keyPrefix: '' },
  { id: 'deepseek', label: 'DeepSeek', mode: 'Chat', hint: 'Hosted BYOK provider. Retired aliases are filtered before model selection.', signupUrl: 'https://platform.deepseek.com', docsUrl: 'https://api-docs.deepseek.com', keyPrefix: 'sk-' },
  { id: 'perplexity', label: 'Perplexity', mode: 'Sonar', hint: 'Hosted BYOK research provider. Verify the current account model list before use.', signupUrl: 'https://docs.perplexity.ai', docsUrl: 'https://docs.perplexity.ai', keyPrefix: '' },
  { id: 'together', label: 'Together AI', mode: 'Chat', hint: 'Hosted BYOK provider. EONAPP accepts provider-namespaced model IDs only.', signupUrl: 'https://api.together.ai', docsUrl: 'https://docs.together.ai', keyPrefix: '' },
  { id: 'fireworks', label: 'Fireworks AI', mode: 'Chat', hint: 'Hosted BYOK provider. Serverless-capable models are discovered from the current account-scoped model API.', signupUrl: 'https://fireworks.ai/login', docsUrl: 'https://docs.fireworks.ai', keyPrefix: 'fw_' },
  { id: 'huggingface', label: 'Hugging Face', mode: 'Inference', hint: 'Hosted BYOK Inference Providers router. EON verifies the current model catalogue and pins one live upstream provider so router failover is not hidden.', signupUrl: 'https://huggingface.co/settings/tokens', docsUrl: 'https://huggingface.co/docs/inference-providers', keyPrefix: 'hf_' },
  { id: 'openai', label: 'OpenAI', mode: 'Chat', hint: 'Hosted BYOK provider. EONAPP uses authenticated dynamic model discovery for text chat.', signupUrl: 'https://platform.openai.com/api-keys', docsUrl: 'https://platform.openai.com/docs/api-reference', keyPrefix: 'sk-' },
  { id: 'openrouter', label: 'OpenRouter', mode: 'Routing', hint: 'Hosted BYOK model router. Verify the current account-visible model list before use.', signupUrl: 'https://openrouter.ai/keys', docsUrl: 'https://openrouter.ai/docs', keyPrefix: 'sk-or-' },
  { id: 'xai', label: 'xAI', mode: 'Chat', hint: 'Hosted BYOK provider. EONAPP currently uses Chat Completions after authenticated model verification.', signupUrl: 'https://console.x.ai', docsUrl: 'https://docs.x.ai', keyPrefix: '' },
  { id: 'qwen', label: 'Qwen / Alibaba Model Studio', mode: 'Chat', hint: 'Hosted BYOK provider. API keys and endpoints are region-bound; verify your account endpoint and current model list.', signupUrl: 'https://www.alibabacloud.com/help/en/model-studio/get-api-key', docsUrl: 'https://www.alibabacloud.com/help/en/model-studio/qwen-api-via-openai-chat-completions', keyPrefix: '' },
];

// Render and accept keys only for providers the maintained runtime currently
// exposes as browser-verifiable BYOK choices. Reviewed-but-disabled transports
// never ask the user for a key on this setup surface.
const /** @type {any} */
PROVIDERS = PROVIDER_GUIDES.filter((/** @type {any} */ p) => VERIFIED_HOSTED_PROVIDER_IDS.has(p.id));


// ── Local runtime endpoints ───────────────────────────────────────────────────
const /** @type {any} */
LOCAL_ENDPOINTS = [
  { id: 'ollama',   label: 'Ollama',         modelsUrl: 'http://127.0.0.1:11434/api/tags',   type: 'ollama' },
  { id: 'lmstudio', label: 'LM Studio',      modelsUrl: 'http://127.0.0.1:1234/v1/models',  type: 'openai' },
  { id: 'llamacpp', label: 'llama.cpp',      modelsUrl: 'http://127.0.0.1:8080/v1/models',  type: 'openai' },
  { id: 'jan',      label: 'Jan',            modelsUrl: 'http://127.0.0.1:1337/v1/models',  type: 'openai' },
  { id: 'textgen',  label: 'Text Gen WebUI', modelsUrl: 'http://127.0.0.1:5000/v1/models',  type: 'openai' },
  { id: 'msty',     label: 'Msty',           modelsUrl: 'http://127.0.0.1:10000/v1/models', type: 'openai' },
  { id: 'gpt4all',  label: 'GPT4All',        modelsUrl: 'http://127.0.0.1:4891/v1/models',  type: 'openai' },
];

function getLocalModelCandidates(/** @type {any} */ endpoint) {
  const base = String(endpoint || '').trim().replace(/\/$/, '');
  if (!base) return [];
  const candidates = new Set([base]);
  try {
    const url = new URL(base);
    const hostVariants = new Set([url.hostname]);
    if (['127.0.0.1', 'localhost'].includes(url.hostname)) {
      hostVariants.add('127.0.0.1');
      hostVariants.add('localhost');
    }
    for (const host of hostVariants) {
      const next = new URL(url.toString());
      next.hostname = host;
      candidates.add(next.toString().replace(/\/$/, ''));
    }
  } catch {}
  if (base.includes('/api/tags')) candidates.add(base.replace('/api/tags', '/v1/models'));
  if (base.includes('/v1/models')) candidates.add(base.replace('/v1/models', '/api/tags'));
  return Array.from(candidates);
}

function t(/** @type {any} */ key, /** @type {any} */ fallback) {
  try {
    return multiLanguageService.t(key, fallback);
  } catch {
    return fallback;
  }
}

const STORAGE_KEY = 'eon:workbench:provider-state:v2';
const LEGACY_STORAGE_KEY = 'eon:workbench:provider-keys:v1';
const LOCAL_KEY   = 'eon:workbench:local-models:v1';

// ── Provider capability tags ──────────────────────────────────────────────────
const /** @type {any} */
PROVIDER_CAPABILITIES = Object.freeze(Object.fromEntries(
  PROVIDERS.map((/** @type {any} */ p) => [p.id, [`☁️ ${p.mode}`, '✅ Live model check']])
));


// ── Key sync ──────────────────────────────────────────────────────────────────
function syncKeysToAiRuntime(/** @type {any} */ _state) {
  try {
    const settingsRaw = localStorage.getItem('eon:ai-chat-settings:v1');
    const settings = settingsRaw ? JSON.parse(settingsRaw) : {};
    if (!settings.provider) {
      const first = PROVIDERS.find((/** @type {any} */ p) => !!String(getApiKey(p.id) || '').trim());
      if (first && VERIFIED_HOSTED_PROVIDER_IDS.has(first.id)) {
        saveAISettings({ ...settings, provider: first.id });
      }
    }
  } catch {}
}

function loadState() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return {
      runtimeMode: ['cloud', 'hybrid', 'local'].includes(raw.runtimeMode) ? raw.runtimeMode : 'cloud'
    };
  } catch {
    return { runtimeMode: 'cloud' };
  }
}
function saveState(/** @type {any} */ state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ runtimeMode: state.runtimeMode || 'cloud', updatedAt: Date.now() }));
}

function setMessage(/** @type {any} */ text, /** @type {any} */ type = 'warn') {
  const /** @type {any} */
el = aiDoc.getElementById('setupMessage');
  if (!el) return;
  el.textContent = text;
  el.classList.remove('msg-ok', 'msg-warn', 'msg-err');
  el.classList.add(type === 'ok' ? 'msg-ok' : type === 'err' ? 'msg-err' : 'msg-warn');
}
function getInputValue(/** @type {any} */ id) { const /** @type {any} */
el = aiDoc.getElementById(id); return el ? String((/** @type {any} */ (el)).value || '').trim() : ''; }

function validateFormat(/** @type {any} */ p, /** @type {any} */ value) {
  if (!value) return { valid: true };
  if (p.keyPrefix && !value.startsWith(p.keyPrefix)) return { valid: false, message: `${p.label} key should start with "${p.keyPrefix}"` };
  if (value.length < 16) return { valid: false, message: `${p.label} key looks too short` };
  return { valid: true };
}

function buildHints(/** @type {any} */ _state) {
  const hints = PROVIDERS
    .filter((/** @type {any} */ p) => Boolean(String(getApiKey(p.id) || '').trim()))
    .map((/** @type {any} */ p) => `${p.label} → ${p.mode}`);
  try {
    const ld = JSON.parse(localStorage.getItem(LOCAL_KEY) || '{}');
    if (ld.detected && ld.detected.length) hints.push(`Local: ${ld.detected.map((/** @type {any} */ d) => d.label).join(', ')}`);
  } catch {}
  if (!hints.length) hints.push('Add a provider key, then verify its live model list before use');
  return hints;
}
function renderHints(/** @type {any} */ state) {
  const /** @type {any} */
el = aiDoc.getElementById('setupHints');
  if (el) el.innerHTML = buildHints(state).map((/** @type {any} */ h) => `<span class="chip">${esc(h)}</span>`).join('');
}

function getDetectedLocalRuntimeData() {
  try {
    const raw = JSON.parse(localStorage.getItem(LOCAL_KEY) || '{}');
    return Array.isArray(raw.detected) ? raw.detected : [];
  } catch {
    return [];
  }
}

function buildLocalModelRecommendations() {
  const detected = getDetectedLocalRuntimeData();
  const models = [...new Set(detected.flatMap((/** @type {any} */ rt) => Array.isArray(rt?.models) ? rt.models : []))].filter(Boolean);
  const lower = models.map((/** @type {string} */ name) => String(name).toLowerCase());

  const groups = [
    {
      title: 'Fast chat',
      note: 'Best for quick replies, planning, and chat-first missions.',
      matches: ['phi4-mini', 'qwen3:4b', 'qwen2.5:3b', 'phi3:mini'],
    },
    {
      title: 'Code / build',
      note: 'Good for website work, app scaffolding, and coding help.',
      matches: ['qwen2.5-coder', 'deepseek-coder', 'codellama', 'starcoder'],
    },
    {
      title: 'Vision / image understanding',
      note: 'Useful when the cockpit needs to read screenshots, images, or UI states.',
      matches: ['llava', 'vision', 'minicpm-v', 'qwen2.5-vl', 'janus'],
    },
    {
      title: 'Image generation',
      note: 'Best when you have a local image model runtime installed.',
      matches: ['flux', 'sdxl', 'stable-diffusion', 'sd3', 'kolors', 'imagen'],
    },
    {
      title: 'Video generation',
      note: 'Reserved for local video-capable models when present.',
      matches: ['sana', 'video', 'wan', 'hunyuan', 'movie'],
    },
  ];

  const cards = groups.map(group => {
    const found = models.filter((/** @type {any} */ _name, idx) => group.matches.some(match => lower[idx].includes(match)));
    if (!found.length) return '';
    return `
      <div class="gfap-provider-row" style="margin-top:.75rem">
        <div class="gfap-provider-head">
          <span class="gfap-provider-label">${esc(group.title)}</span>
          <span class="badge badge-sm badge-green">Recommended</span>
        </div>
        <p class="gfap-provider-hint">${esc(group.note)}</p>
        <div class="chip-wrap">${found.slice(0, 4).map((name) => `<span class="chip">${esc(name)}</span>`).join('')}</div>
      </div>
    `;
  }).filter(Boolean);

  if (cards.length) {
    return `
      <div class="gfap-section-head">
        <h3>Recommended for this device</h3>
        <p>These are the local models already available on your machine, grouped by the kind of work they’re best at.</p>
      </div>
      ${cards.join('')}
    `;
  }

  return `
    <div class="gfap-section-head">
      <h3>Recommended local setup</h3>
      <p>Install Ollama first for the easiest local model path, then add LM Studio or Jan if you want a second runtime. EON will auto-detect them when they appear.</p>
      <div class="gfap-provider-links" style="margin-top:.5rem">
        <a href="https://ollama.ai" target="_blank" rel="noopener noreferrer" class="btn btn-xs btn-outline">📥 Ollama</a>
        <a href="https://lmstudio.ai" target="_blank" rel="noopener noreferrer" class="btn btn-xs btn-outline">📥 LM Studio</a>
        <a href="https://jan.ai" target="_blank" rel="noopener noreferrer" class="btn btn-xs btn-outline">📥 Jan</a>
      </div>
    </div>
  `;
}

function renderLocalModelRecommendations() {
  const el = aiDoc.getElementById('local-model-recommendations');
  if (el) el.innerHTML = buildLocalModelRecommendations() + buildLocalCapabilitySummary() + buildGuidedLocalInstallSection();
}

function getDetectedLocalProvidersForCapability() {
  try {
    const raw = JSON.parse(localStorage.getItem(LOCAL_KEY) || '{}');
    const detected = Array.isArray(raw.detected) ? raw.detected : [];
    return detected.map((row) => ({ provider: row.id || row.provider, available: true, models: Array.isArray(row.models) ? row.models : [] }));
  } catch {
    return [];
  }
}


function buildGuidedLocalInstallSection() {
  const profile = detectLocalAiCapabilityProfile();
  const localProviders = getDetectedLocalProvidersForCapability();
  const plan = buildGuidedInstallPlan(profile, { localProviders });
  const truth = buildInstallTruthPolicy();
  const runtimeRows = (plan.runtimeRails || []).slice(0, 4).map((rail) => `
    <div class="gfap-provider-row" style="margin-top:.65rem">
      <div class="gfap-provider-head">
        <span class="gfap-provider-label">${esc(rail.label)}</span>
        <span class="badge badge-sm badge-blue">Recommended runtime</span>
      </div>
      <p class="gfap-provider-hint">${esc((rail.bestFor || []).join(' · '))}</p>
      <div class="gfap-provider-links" style="margin-top:.35rem">
        <a href="${esc(rail.installUrl)}" target="_blank" rel="noopener noreferrer" class="btn btn-xs btn-outline">Install ${esc(rail.label)} →</a>
      </div>
    </div>`).join('');
  const publisherRows = (plan.trustedPublishers || []).slice(0, 5).map((pub) => `
    <div class="gfap-provider-row" style="margin-top:.65rem">
      <div class="gfap-provider-head">
        <span class="gfap-provider-label">${esc(pub.label)}</span>
        <span class="badge badge-sm badge-gray">${esc(pub.kind)}</span>
      </div>
      <p class="gfap-provider-hint">${esc(pub.notes)}</p>
      <div class="gfap-provider-links" style="margin-top:.35rem">
        <a href="${esc(pub.homepage)}" target="_blank" rel="noopener noreferrer" class="btn btn-xs btn-outline">Browse</a>
        <a href="${esc(pub.installUrl)}" target="_blank" rel="noopener noreferrer" class="btn btn-xs btn-outline">Install / Setup</a>
      </div>
    </div>`).join('');
  const steps = (plan.steps || []).map((step) => `<li>${esc(step)}</li>`).join('');
  return `
    <div class="gfap-section-head" style="margin-top:1rem">
      <h3>Device-aware local install path</h3>
      <p>${esc(plan.summary)}</p>
      <p class="gfap-provider-hint">${esc(truth.oneClickMeaning)}</p>
      <p class="gfap-provider-hint">${esc(truth.futureProofing)}</p>
    </div>
    <div class="gfap-card-grid" style="display:grid;gap:.8rem">
      <div class="gfap-provider-row">
        <div class="gfap-provider-head"><span class="gfap-provider-label">How EON should help</span></div>
        <ol style="margin:.35rem 0 0 1.2rem;padding:0;display:grid;gap:.35rem">${steps}</ol>
      </div>
      ${runtimeRows}
      <div class="gfap-section-head" style="margin-top:.8rem"><h3>Trusted model publishers</h3><p>Recommend official or curated open sources by default so non-technical users are not dropped into random model hunting.</p></div>
      ${publisherRows}
    </div>
  `;
}

function buildLocalCapabilitySummary() {
  const profile = detectLocalAiCapabilityProfile();
  const localProviders = getDetectedLocalProvidersForCapability();
  const workloadMatrix = buildLocalWorkloadMatrix(profile, { localProviders });
  const truth = summarizeLocalCapabilityTruth(profile, workloadMatrix);
  const discoveryPlan = buildLocalModelDiscoveryPlan(profile, { localProviders, workloadMatrix });
  const badges = {
    'browser-native': 'badge-green',
    'ready-local': 'badge-green',
    'installable-local': 'badge-yellow',
    'advanced-local': 'badge-yellow',
    'cloud-preferred': 'badge-gray'
  };
  const labels = {
    'browser-native': 'Browser native',
    'ready-local': 'Ready local',
    'installable-local': 'Install local',
    'advanced-local': 'Advanced local',
    'cloud-preferred': 'Cloud preferred'
  };
  const workloadCards = workloadMatrix.map((row) => `
    <div class="gfap-provider-row" style="margin-top:.65rem">
      <div class="gfap-provider-head">
        <span class="gfap-provider-label">${esc(row.label)}</span>
        <span class="badge badge-sm ${badges[row.status] || 'badge-gray'}">${esc(labels[row.status] || row.status)}</span>
      </div>
      <p class="gfap-provider-hint">${esc(row.reason)}</p>
    </div>`).join('');
  const channels = (discoveryPlan.channels || []).slice(0, 4).map((channel) => `
      <div class="gfap-provider-row" style="margin-top:.65rem">
        <div class="gfap-provider-head"><span class="gfap-provider-label">${esc(channel.label)}</span></div>
        <p class="gfap-provider-hint">${esc(channel.publishers.join(' · '))}</p>
        <div class="chip-wrap">${channel.runtimes.map((item) => `<span class="chip">${esc(item)}</span>`).join('')}</div>
      </div>`).join('');
  return `
    <div class="gfap-section-head">
      <h3>${esc(profile.label)}</h3>
      <p>${esc(truth.headline)}</p>
      <p class="gfap-provider-hint">${esc(truth.summary)}</p>
      <p class="gfap-provider-hint">${esc((discoveryPlan.runtimeHints || []).slice(0, 2).join(' '))}</p>
    </div>
    ${workloadCards}
    <div class="gfap-section-head" style="margin-top:1rem"><h3>Curated local rails</h3><p>These are the model families and runtimes EON should recommend for this device class.</p></div>
    ${channels}
  `;
}

// ── Provider form rendering ───────────────────────────────────────────────────
function renderProviderForm() {
  const /** @type {any} */
form = aiDoc.getElementById('providerKeyForm');
  if (!form) return;
  const state = loadState();

  function row(/** @type {any} */ p) {
    const hasStoredKey = Boolean(String(getApiKey(p.id) || '').trim());
    const canTest = VERIFIED_HOSTED_PROVIDER_IDS.has(p.id);
    return `
    <div class="gfap-provider-row" id="gfap-row-${esc(p.id)}">
      <div class="gfap-provider-head">
        <span class="gfap-provider-label">${esc(p.label)}</span>
        <span class="badge badge-sm">${esc(p.mode)}</span>
        <span class="badge badge-sm badge-blue">BYOK · verify</span>
        ${hasStoredKey ? '<span class="badge badge-sm badge-green">✓ Saved</span>' : ''}
        <span class="gfap-test-status" id="gfap-test-status-${esc(p.id)}" aria-live="polite"></span>
      </div>
      <p class="gfap-provider-hint">${esc(p.hint)}</p>
      <div class="gfap-provider-links">
        <a href="${esc(p.signupUrl)}" target="_blank" rel="noopener noreferrer" class="btn btn-xs btn-outline">Get Key →</a>
        <a href="${esc(p.docsUrl)}" target="_blank" rel="noopener noreferrer" class="btn btn-xs btn-outline">Docs</a>
        ${canTest ? `<button class="btn btn-xs btn-outline gfap-test-btn" type="button" data-provider="${esc(p.id)}" aria-label="${esc(t('freeai.keys.test.short', 'Test'))} ${esc(p.label)} connection">${esc(t('freeai.keys.test.short', 'Test'))}</button>` : ''}
      </div>
      <input type="password" id="${esc(p.id)}Key" class="gfap-input" placeholder="${hasStoredKey ? 'Stored securely. Paste to replace key…' : `Paste ${esc(p.label)} API key…`}" value="" autocomplete="off" aria-label="${esc(p.label)} API key" />
    </div>`;
  }

  form.innerHTML = `
    <div class="gfap-section-head"><h3>☁️ Hosted BYOK providers</h3><p>Only currently enabled browser-verifiable providers are shown. Availability, pricing, quotas, and supported models come from your provider account; Test checks the current authenticated model list.</p></div>
    ${PROVIDERS.map(row).join('')}
    <div class="gfap-section-head"><h3>⚡ Runtime Mode</h3><p>How EON executes your missions — cloud, hybrid, or fully local.</p></div>
    <select id="runtimeMode" class="gfap-input" aria-label="Runtime mode">
      <option value="cloud">☁️ Cloud — Use APIs only, no local required</option>
      <option value="hybrid">⚡ Hybrid — Local when fast enough, API fallback</option>
      <option value="local">🖥️ Local — Local models first, API optional</option>
    </select>`;

  const /** @type {any} */
rt = aiDoc.getElementById('runtimeMode');
  if (rt) (/** @type {any} */ (rt)).value = state.runtimeMode || 'cloud';
}

function currentFormState() {
  const /** @type {any} */
state = { runtimeMode: getInputValue('runtimeMode') || 'cloud' };
  PROVIDERS.forEach((/** @type {any} */ p) => { (/** @type {any} */ (state))[p.id + 'InputKey'] = getInputValue(p.id + 'Key'); });
  return state;
}

function handleValidate() {
  const state = currentFormState();
  for (const /** @type {any} */
p of PROVIDERS) {
    const r = validateFormat(p, (/** @type {any} */ (state))[p.id + 'InputKey']);
    if (!r.valid) { setMessage(`Validation failed: ${r.message}`, 'err'); return; }
  }
  setMessage('All key formats look valid. Ready to save.', 'ok');
}

async function handleSave() {
  const state = currentFormState();

  let changed = 0;
  for (const /** @type {any} */ p of PROVIDERS) {
    const candidate = String((/** @type {any} */ (state))[p.id + 'InputKey'] || '').trim();
    if (!candidate) continue;
    await ApiKeyVault.store(p.id, candidate).catch(() => {});
    setApiKey(p.id, candidate, false);
    changed += 1;
  }

  const availableCount = PROVIDERS.filter((/** @type {any} */ p) => Boolean(String(getApiKey(p.id) || '').trim())).length;
  if (!availableCount) { setMessage('Add at least one API key before saving.', 'err'); return; }

  saveState(state);
  syncKeysToAiRuntime(state);
  renderHints(state);
  renderProviderForm();
  renderCapabilityMap();
  renderLocalModelRecommendations();
  setMessage(`Saved for this browser session. ${availableCount} provider key(s) available, ${changed} updated this pass. Use Vault with a separate passphrase only when you explicitly want durable recovery. Test a provider to verify its current model list. Mode: ${state.runtimeMode.toUpperCase()}.`, 'ok');
}

function handleClear() {
  const providerIdsToClear = new Set([...PROVIDERS.map((/** @type {any} */ p) => p.id), ...LEGACY_DISABLED_PROVIDER_KEY_IDS]);
  providerIdsToClear.forEach((providerId) => {
    try { ApiKeyVault.remove(providerId); } catch {}
    try { setApiKey(providerId, '', false); } catch {}
  });
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(LEGACY_STORAGE_KEY);
  localStorage.removeItem('eon:ai-chat-device-keys:v1');
  renderProviderForm();
  renderHints({});
  renderLocalModelRecommendations();
  setMessage('All saved keys cleared from secure vault and runtime session.', 'warn');
}

// ── Local model auto-discovery ────────────────────────────────────────────────
async function discoverLocalModels(/** @type {{ force?: boolean } | boolean } */ options = {}) {
  const /** @type {any} */
resultEl = aiDoc.getElementById('local-discovery-result');
  const /** @type {any} */
btn = aiDoc.getElementById('discoverLocalBtn');
  if (!resultEl) return;
  if (btn) { (/** @type {any} */ (btn)).disabled = true; btn.textContent = t('freeai.local.scanning', '⏳ Scanning ports…'); }

  let /** @type {any} */
detected = [];
  try {
    const detector = typeof getLocalRuntimeDetector === 'function' ? getLocalRuntimeDetector() : null;
    if (detector?.scan) {
      const runtimes = await detector.scan(options);
      if (Array.isArray(runtimes) && runtimes.length) {
        detected = runtimes.map((/** @type {any} */ rt) => ({
          id: String(rt.name || 'local').toLowerCase(),
          label: rt.name || 'Local',
          models: Array.isArray(rt.models) ? rt.models.map((/** @type {any} */ m) => m.name || m.id || '').filter(Boolean) : [],
        }));
      }
    }
  } catch {}

  if (!detected.length) {
    for (const /** @type {any} */
    ep of LOCAL_ENDPOINTS) {
      for (const url of getLocalModelCandidates(ep.modelsUrl)) {
        try {
          const resp = await fetch(url, { signal: AbortSignal.timeout(1500) });
          if (!resp.ok) continue;
          let /** @type {any} */
          models = [];
          try {
            const data = await resp.json();
            const raw = ep.type === 'ollama' ? (data.models || data.data || []) : (data.data || data.models || []);
            models = raw.map((/** @type {any} */ m) => m.name || m.id || '').filter(Boolean);
          } catch {}
          detected.push({ ...ep, models, endpoint: url });
          break;
        } catch {}
      }
    }
  }

  localStorage.setItem(LOCAL_KEY, JSON.stringify({ detected, scannedAt: Date.now() }));

  if (!detected.length) {
    resultEl.innerHTML = `<p class="gfap-provider-hint">${esc(t('freeai.local.none', 'No local runtimes detected on standard ports.'))} <a href="https://ollama.ai" target="_blank" rel="noopener noreferrer">Install Ollama</a> ${esc(t('freeai.local.none.tail', 'for free local AI — runs on any modern laptop or desktop.'))}</p>`;
  } else {
    resultEl.innerHTML = detected.map((/** @type {any} */ d) => `
      <div class="gfap-local-runtime">
        <strong>${esc(d.label)}</strong> <span class="badge badge-sm badge-green">${esc(t('freeai.local.running', 'Running'))}</span>
        ${d.models.length ? `<br><span class="gfap-provider-hint">${esc(d.models.slice(0, 6).join(' · '))}${d.models.length > 6 ? ` +${d.models.length - 6} more` : ''}</span>` : ''}
      </div>`).join('');
    const /** @type {any} */
rt = aiDoc.getElementById('runtimeMode');
    if (rt && (/** @type {any} */ (rt)).value === 'cloud') { (/** @type {any} */ (rt)).value = 'hybrid'; setMessage('Local runtime found — mode set to Hybrid.', 'ok'); }
  }

  renderHints(currentFormState());
  renderCapabilityMap();
  renderLocalModelRecommendations();
  if (btn) { (/** @type {any} */ (btn)).disabled = false; btn.textContent = t('freeai.local.scan', '🔍 Scan for Local AI'); }
}

// ── Per-provider connection test ─────────────────────────────────────────────
async function handleTestProvider(/** @type {string} */ pid) {
  const p = PROVIDERS.find((/** @type {any} */ x) => x.id === pid);
  if (!p) return;

  const statusEl = aiDoc.getElementById(`gfap-test-status-${pid}`);
  const btn = aiDoc.querySelector(`.gfap-test-btn[data-provider="${pid}"]`);
  if (!VERIFIED_HOSTED_PROVIDER_IDS.has(pid)) {
    if (statusEl) { statusEl.textContent = 'Manual'; statusEl.className = 'gfap-test-status gfap-test-warn'; }
    setMessage(`${p.label} is not an active EONBOT hosted provider. It cannot be marked ready from this setup screen.`, 'warn');
    return;
  }

  const key = String(getInputValue(pid + 'Key') || '').trim() || String(getApiKey(pid) || '').trim();
  if (!key) {
    if (statusEl) { statusEl.textContent = t('freeai.keys.missing', '⚠ No key'); statusEl.className = 'gfap-test-status gfap-test-warn'; }
    setMessage(`Paste a ${p.label} key first — enter it in the field below the provider.`, 'err');
    return;
  }

  if (btn) { (/** @type {any} */ (btn)).disabled = true; (/** @type {any} */ (btn)).textContent = '⏳'; }
  if (statusEl) { statusEl.textContent = '…'; statusEl.className = 'gfap-test-status'; }

  if (String(getInputValue(pid + 'Key') || '').trim()) {
    await ApiKeyVault.store(pid, key).catch(() => {});
    setApiKey(pid, key, false);
  }

  try {
    const verification = await verifyProviderReadiness(pid, key, { forceRefresh: true });
    if (verification.ok) {
      if (statusEl) { statusEl.textContent = t('freeai.keys.live', '✓ Verified'); statusEl.className = 'gfap-test-status gfap-test-ok'; }
      setMessage(`✓ ${p.label} verified ${verification.discoveredCount || 0} current chat-capable model(s).`, 'ok');
    } else {
      const reason = String(verification.error || verification.status || 'Model-list verification failed').slice(0, 120);
      if (statusEl) { statusEl.textContent = '✗ Not ready'; statusEl.className = 'gfap-test-status gfap-test-err'; }
      setMessage(`${p.label} is not ready: ${reason}. Check the key, provider account access, and current provider documentation.`, 'err');
    }
  } catch (/** @type {any} */ err) {
    if (statusEl) { statusEl.textContent = t('freeai.keys.offline', '✗ Offline'); statusEl.className = 'gfap-test-status gfap-test-err'; }
    setMessage(`${p.label}: ${(/** @type {Error} */ (err)).message || 'Network error'}. Check key and connection.`, 'err');
  } finally {
    if (btn) { (/** @type {any} */ (btn)).disabled = false; (/** @type {any} */ (btn)).textContent = t('freeai.keys.test.short', 'Test'); }
  }
}

// ── Connection test ──────────────────────────────────────────────────────────
async function handleTestConnection() {
  const state = currentFormState();
  if (!PROVIDERS.some((/** @type {any} */ p) => VERIFIED_HOSTED_PROVIDER_IDS.has(p.id) && (String((/** @type {any} */ (state))[p.id + 'InputKey'] || '').trim() || String(getApiKey(p.id) || '').trim()))) {
    setMessage('Enter a key for an active hosted provider to test.', 'err');
    return;
  }
  saveState(state);
  syncKeysToAiRuntime(state);

  const /** @type {any} */
btn = aiDoc.getElementById('testConnectionBtn');
  if (btn) { (/** @type {any} */ (btn)).disabled = true; btn.textContent = '⏳ Testing…'; }
  setMessage('Verifying current provider model list…', 'warn');

  const toTest = PROVIDERS.find((/** @type {any} */ p) => VERIFIED_HOSTED_PROVIDER_IDS.has(p.id) && (String((/** @type {any} */ (state))[p.id + 'InputKey'] || '').trim() || String(getApiKey(p.id) || '').trim()));
  if (!toTest) {
    setMessage(t('freeai.keys.no-testable', 'No active hosted provider is configured.'), 'err');
    if (btn) { (/** @type {any} */ (btn)).disabled = false; btn.textContent = t('freeai.keys.test', 'Test Connection'); }
    return;
  }

  const key = String((/** @type {any} */ (state))[toTest.id + 'InputKey'] || '').trim() || String(getApiKey(toTest.id) || '').trim();
  if (String((/** @type {any} */ (state))[toTest.id + 'InputKey'] || '').trim()) {
    await ApiKeyVault.store(toTest.id, key).catch(() => {});
    setApiKey(toTest.id, key, false);
  }
  try {
    const verification = await verifyProviderReadiness(toTest.id, key, { forceRefresh: true });
    if (verification.ok) {
      setMessage(`✓ ${toTest.label} verified ${verification.discoveredCount || 0} current chat-capable model(s). Keys saved and ready to select.`, 'ok');
    } else {
      const reason = String(verification.error || verification.status || 'Model-list verification failed').slice(0, 120);
      setMessage(`${toTest.label} is not ready: ${reason}. Check the key, provider account access, and current documentation.`, 'err');
    }
  } catch (/** @type {any} */ err) {
    setMessage(`${t('freeai.keys.failed', 'Connection failed:')} ${(/** @type {Error} */ (err)).message || 'Network error'}. ${t('freeai.keys.retry', 'Check key and retry.')}`, 'err');
  } finally {
    if (btn) { (/** @type {any} */ (btn)).disabled = false; btn.textContent = t('freeai.keys.test', 'Test Connection'); }
  }
}

// ── Capability map ────────────────────────────────────────────────────────────
function renderCapabilityMap() {
  const /** @type {any} */
el = aiDoc.getElementById('capability-map');
  if (!el) return;

  const savedProviders = PROVIDERS.filter((/** @type {any} */ p) => Boolean(String(getApiKey(p.id) || '').trim()));
  const localData = (() => { try { return JSON.parse(localStorage.getItem(LOCAL_KEY) || '{}'); } catch { return {}; } })();
  const localDetected = Array.isArray(localData.detected) ? localData.detected : [];

  if (!savedProviders.length && !localDetected.length) {
    el.innerHTML = '<p class="gfap-provider-hint" style="text-align:center;padding:1rem 0">Save at least one API key above to see your AI capability coverage map.</p>';
    return;
  }

  /** @type {Record<string,string[]>} */
  const capMap = {};
  savedProviders.forEach((/** @type {any} */ p) => {
    const caps = /** @type {string[]} */ (PROVIDER_CAPABILITIES[p.id] || ['💬 Chat']);
    caps.forEach(cap => {
      if (!capMap[cap]) capMap[cap] = [];
      capMap[cap].push(p.label);
    });
  });

  localDetected.forEach((/** @type {any} */ d) => {
    if (!capMap['🖥️ Local']) capMap['🖥️ Local'] = [];
    capMap['🖥️ Local'].push(`${d.label}${d.models && d.models.length ? ` (${d.models.length} model${d.models.length !== 1 ? 's' : ''})` : ''}`);
  });

  const rows = Object.entries(capMap).map(([cap, providers]) => `
    <div style="display:flex;align-items:flex-start;gap:.75rem;padding:.5rem 0;border-bottom:1px solid rgba(255,255,255,.06)">
      <span style="min-width:130px;font-size:.82rem;font-weight:600;color:var(--clr-accent,#6366f1)">${esc(cap)}</span>
      <span style="display:flex;flex-wrap:wrap;gap:.3rem">${providers.map(n => `<span class="chip">${esc(n)}</span>`).join('')}</span>
    </div>
  `).join('');

  const gapsHtml = !capMap['🖥️ Local']
    ? `<div style="margin-top:.75rem;padding:.65rem;background:rgba(251,191,36,.06);border-radius:10px;font-size:.82rem;color:var(--clr-text-muted)"><strong>Optional privacy rail: </strong><a href="https://ollama.com" target="_blank" rel="noopener noreferrer">Install Ollama</a> or use another detected local runtime for on-device inference.</div>`
    : `<div style="margin-top:.75rem;padding:.65rem;background:rgba(34,197,94,.06);border-radius:10px;font-size:.82rem;color:#86efac">✓ Hosted BYOK verification and a local-runtime option are both configured. Model capabilities still come from the verified model list.</div>`;

  el.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:.5rem;margin-bottom:.5rem">
      <div style="padding:.6rem .75rem;border:1px solid rgba(99,102,241,.25);border-radius:10px;background:rgba(99,102,241,.06)">
        <strong style="font-size:1.15rem">${savedProviders.length}</strong><br><span style="font-size:.8rem;color:var(--clr-text-muted)">Cloud providers active</span>
      </div>
      <div style="padding:.6rem .75rem;border:1px solid rgba(99,102,241,.25);border-radius:10px;background:rgba(99,102,241,.06)">
        <strong style="font-size:1.15rem">${localDetected.length}</strong><br><span style="font-size:.8rem;color:var(--clr-text-muted)">Local runtimes detected</span>
      </div>
      <div style="padding:.6rem .75rem;border:1px solid rgba(99,102,241,.25);border-radius:10px;background:rgba(99,102,241,.06)">
        <strong style="font-size:1.15rem">${Object.keys(capMap).length}</strong><br><span style="font-size:.8rem;color:var(--clr-text-muted)">Verified route types</span>
      </div>
    </div>
    <div style="margin:.5rem 0">${rows}</div>
    ${gapsHtml}
  `;
}

// ── Init ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Legacy plaintext provider containers are never read automatically.
  // Open Vault to review and migrate them with an explicit passphrase.


  void (async () => {
    for (const /** @type {any} */ p of PROVIDERS) {
      if (String(getApiKey(p.id) || '').trim()) continue;
      const restored = await ApiKeyVault.retrieve(p.id).catch(() => null);
      if (restored) setApiKey(p.id, restored, false);
    }
    renderProviderForm();
    renderHints(loadState());
    renderCapabilityMap();
    renderLocalModelRecommendations();
  })();

  renderProviderForm();
  const state = loadState();
  renderHints(state);
  renderCapabilityMap();
  renderLocalModelRecommendations();

  const savedCount = PROVIDERS.filter((/** @type {any} */ p) => Boolean(String(getApiKey(p.id) || '').trim())).length;
  if (savedCount) setMessage(`${savedCount} provider(s) loaded from this browser.`, 'ok');

  aiDoc.getElementById('validateKeysBtn')?.addEventListener('click', handleValidate);
  aiDoc.getElementById('saveKeysBtn')?.addEventListener('click', handleSave);
  aiDoc.getElementById('clearKeysBtn')?.addEventListener('click', handleClear);
  aiDoc.getElementById('testConnectionBtn')?.addEventListener('click', handleTestConnection);
  aiDoc.getElementById('discoverLocalBtn')?.addEventListener('click', () => discoverLocalModels({ force: true }));

  // Per-provider test button delegation (buttons rendered inside providerKeyForm)
  aiDoc.getElementById('providerKeyForm')?.addEventListener('click', (/** @type {MouseEvent} */ e) => {
    const btn = /** @type {HTMLElement} */ (/** @type {HTMLElement} */ (e.target).closest('.gfap-test-btn'));
    if (!btn) return;
    const pid = /** @type {any} */ (btn).dataset?.provider;
    if (pid) void handleTestProvider(pid);
  });

  if (state.runtimeMode === 'hybrid' || state.runtimeMode === 'local') discoverLocalModels();
});


