import { emitEonGrowthEvent } from '../growth/eon-growth-attribution.js';

const DRAFT_KEY = 'eon:chat:draft:v1';


function guidePlacement() {
  const path = String(globalThis.location?.pathname || '/guides').replace(/^\/+|\/+$/g, '');
  return `guide:${path || 'guides'}`.slice(0, 120);
}

void emitEonGrowthEvent('guide_engaged', { placement: guidePlacement() });

function normalizeText(value, max = 1600) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, max);
}

function handoffDraft(prompt, source = 'guide') {
  const text = normalizeText(prompt);
  if (!text) return false;
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({
      schema: 'eon.chat.review-draft.v1',
      text,
      source: normalizeText(source, 80) || 'guide',
      createdAt: Date.now()
    }));
    window.location.assign('/?new=1');
    return true;
  } catch {
    return false;
  }
}

document.addEventListener('click', (event) => {
  const button = event.target instanceof Element ? event.target.closest('[data-eonbot-draft]') : null;
  if (!button) return;
  event.preventDefault();
  void emitEonGrowthEvent('eonbot_cta_open', { placement: guidePlacement(), oncePerSession: false });
  handoffDraft(button.getAttribute('data-eonbot-draft'), button.getAttribute('data-eonbot-draft-source') || 'guide');
});

function numberValue(id, fallback = 0) {
  const node = document.getElementById(id);
  const value = Number(node?.value);
  return Number.isFinite(value) ? value : fallback;
}

const API_PRESETS = Object.freeze({
  'gpt-5.6-luna': { label: 'GPT-5.6 Luna', input: 0.20, output: 1.20 },
  'gpt-5.6-sol': { label: 'GPT-5.6 Sol', input: 4.00, output: 20.00 },
  'claude-sonnet-5': { label: 'Claude Sonnet 5', input: 2.00, output: 10.00 },
  'gemini-3.5-flash-lite': { label: 'Gemini 3.5 Flash-Lite', input: 0.30, output: 2.50 },
  'mistral-small-4': { label: 'Mistral Small 4', input: 0.15, output: 0.60 },
  'custom': { label: 'Custom model', input: 1, output: 4 }
});

function renderApiCost() {
  const select = document.getElementById('api-model');
  const result = document.getElementById('api-cost-result');
  if (!select || !result) return;
  const preset = API_PRESETS[select.value] || API_PRESETS.custom;
  const custom = select.value === 'custom';
  const inputRateNode = document.getElementById('api-input-rate');
  const outputRateNode = document.getElementById('api-output-rate');
  if (inputRateNode && document.activeElement !== inputRateNode && !custom) inputRateNode.value = String(preset.input);
  if (outputRateNode && document.activeElement !== outputRateNode && !custom) outputRateNode.value = String(preset.output);
  const inputRate = Math.max(0, numberValue('api-input-rate', preset.input));
  const outputRate = Math.max(0, numberValue('api-output-rate', preset.output));
  const inputTokens = Math.max(0, numberValue('api-input-tokens', 2000));
  const outputTokens = Math.max(0, numberValue('api-output-tokens', 500));
  const requests = Math.max(0, numberValue('api-requests', 1000));
  const perRequest = (inputTokens / 1_000_000 * inputRate) + (outputTokens / 1_000_000 * outputRate);
  const monthly = perRequest * requests;
  result.innerHTML = `<strong>$${monthly.toFixed(monthly < 1 ? 4 : 2)} estimated monthly token cost</strong><span>$${perRequest.toFixed(6)} per request · ${requests.toLocaleString()} requests/month. Excludes tools, caching/storage, search/grounding, audio/video and provider-specific fees.</span>`;
}

function renderHardware() {
  const result = document.getElementById('hardware-result');
  if (!result) return;
  const ram = Math.max(0, numberValue('hardware-ram', 16));
  const vram = Math.max(0, numberValue('hardware-vram', 0));
  const device = document.getElementById('hardware-device')?.value || 'laptop';
  let tier = 'Start with lightweight local text models';
  let note = 'Prioritize small quantized text models and keep context sizes conservative. Browser-local support depends on the browser and available graphics/runtime features.';
  if (ram >= 32 && vram >= 12) { tier = 'Strong local-AI candidate'; note = 'This class of hardware can usually explore substantially larger local text workloads, but model architecture, quantization and context still determine real memory use.'; }
  else if (ram >= 16 && vram >= 6) { tier = 'Balanced local-AI candidate'; note = 'A practical range for many small-to-mid local text models. Start smaller, measure memory and speed, then move upward.'; }
  else if (ram >= 8) { tier = 'Lite local-AI candidate'; note = 'Use lightweight local models first. Avoid assuming that advertised model parameter count equals memory required at runtime.'; }
  if (device === 'phone') note += ' On phones, thermal limits, browser memory ceilings and background tab behavior matter as much as headline RAM.';
  result.innerHTML = `<strong>${tier}</strong><span>${note}</span>`;
}

function renderLocalCloudDecision() {
  const result = document.getElementById('local-cloud-result');
  if (!result) return;
  let local = 0, cloud = 0;
  document.querySelectorAll('[data-local-cloud-factor]').forEach((node) => {
    const value = Number(node.value || 0);
    if (node.dataset.direction === 'local') local += value;
    else cloud += value;
  });
  const delta = local - cloud;
  let title = 'A hybrid setup is probably the best starting point';
  let text = 'Keep sensitive or offline-friendly work local when practical, and deliberately choose hosted models for workloads that need stronger frontier capability, web services or easier device support.';
  if (delta >= 4) { title = 'Local-first looks like the better fit'; text = 'Your priorities lean toward privacy, offline use and control. Start with Local AI, then make cloud use an explicit exception for tasks that genuinely need it.'; }
  if (delta <= -4) { title = 'Cloud-first looks like the easier fit'; text = 'Your priorities lean toward convenience and stronger hosted capability. Keep privacy boundaries explicit and consider BYOK when you want provider choice and direct cost control.'; }
  result.innerHTML = `<strong>${title}</strong><span>${text}</span>`;
}

function renderBusinessRoi() {
  const result = document.getElementById('business-roi-result');
  if (!result) return;
  const hours = Math.max(0, numberValue('business-hours', 20));
  const hourly = Math.max(0, numberValue('business-hourly', 25));
  const tools = Math.max(0, numberValue('business-tools', 50));
  const implementation = Math.max(0, numberValue('business-implementation', 0));
  const value = hours * hourly;
  const net = value - tools - implementation;
  result.innerHTML = `<strong>$${net.toFixed(2)} scenario value per month</strong><span>$${value.toFixed(2)} time-value estimate − $${tools.toFixed(2)} recurring tools − $${implementation.toFixed(2)} monthly implementation cost. This is a planning scenario, not a promise of savings or financial return.</span>`;
}

for (const id of ['api-cost-tool','hardware-tool','local-cloud-tool','business-roi-tool']) {
  document.getElementById(id)?.addEventListener('input', () => {
    void emitEonGrowthEvent('guide_tool_used', { placement: guidePlacement() });
    if (id === 'api-cost-tool') renderApiCost();
    if (id === 'hardware-tool') renderHardware();
    if (id === 'local-cloud-tool') renderLocalCloudDecision();
    if (id === 'business-roi-tool') renderBusinessRoi();
  });
}
renderApiCost(); renderHardware(); renderLocalCloudDecision(); renderBusinessRoi();
