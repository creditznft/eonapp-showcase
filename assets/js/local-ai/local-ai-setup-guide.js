import { buildLocalAiSetupGuide, LOCAL_AI_SETUP_GOALS } from '../../../config/local-ai-setup-guide-contract.mjs';
import { findLocalAiStarterProfile } from './local-ai-catalog.js';
import { buildLocalAiGuidedSetupProgress } from './local-ai-guided-setup-progress.js';

function escapeHtml(value = '') {
  return String(value || '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char]));
}

function modelCard(profileId = '') {
  const profile = findLocalAiStarterProfile(profileId);
  if (!profile) return '<p class="local-ai-runtime-note">A final text-model recommendation becomes available only after EONBOT has a conservative device signal.</p>';
  return `<div class="local-ai-guide-model"><span class="local-ai-fit">Suggested first text model</span><strong>${escapeHtml(profile.label)}</strong><code>${escapeHtml(profile.model)}</code><p>${escapeHtml(profile.summary)}</p><a class="local-ai-inline-link" href="${escapeHtml(profile.officialUrl)}" target="_blank" rel="noreferrer noopener">Review the official model page</a></div>`;
}

function runtimeCard(runtime, isPrimary = false) {
  const title = isPrimary ? 'Recommended first route' : 'Optional alternative';
  return `<article class="local-ai-guide-runtime${isPrimary ? ' is-primary' : ''}">
    <span class="local-ai-fit">${escapeHtml(title)}</span>
    <h3>${escapeHtml(runtime.label)}</h3>
    <p>${escapeHtml(runtime.style)}</p>
    <p class="local-ai-profile-reason">${escapeHtml(runtime.setupHint)}</p>
    <div class="local-ai-actions">
      <a class="eon-hub-primary" href="${escapeHtml(runtime.officialDownloadUrl)}" target="_blank" rel="noreferrer noopener" data-local-runtime-acquire="${escapeHtml(runtime.eonRuntimeId)}">1. Open official installer</a>
      <a class="local-ai-secondary" href="${escapeHtml(runtime.officialModelGuideUrl)}" target="_blank" rel="noreferrer noopener">2. Official model guide</a>
      <button class="local-ai-secondary is-quiet" type="button" data-local-guide-runtime="${escapeHtml(runtime.eonRuntimeId)}">I installed it — take me to test</button>
    </div>
  </article>`;
}

function progressCard(guide, options = {}) {
  const progress = buildLocalAiGuidedSetupProgress({
    guide,
    runtimeId: options.runtimeId,
    runtimeLabel: options.runtimeLabel,
    discovery: options.discovery,
    proof: options.proof,
    selectedModel: options.selectedModel,
    chatSettings: options.chatSettings,
    bridgeChecked: options.bridgeChecked,
    bridgeAvailable: options.bridgeAvailable,
    bridgePaired: options.bridgePaired
  });
  if (progress.phase === 'guide-mode') return '';
  const runtime = [guide.primaryRuntime, ...(guide.alternativeRuntimes || [])].find((row) => row?.eonRuntimeId === progress.runtimeId || row?.id === progress.runtimeId) || guide.primaryRuntime;
  const href = progress.action === 'open-model-guide' ? runtime?.officialModelGuideUrl : '';
  const action = href
    ? `<a class="eon-hub-primary" href="${escapeHtml(href)}" target="_blank" rel="noreferrer noopener">${escapeHtml(progress.actionLabel)}</a>`
    : progress.action === 'open-chat'
      ? `<a class="eon-hub-primary" href="/">${escapeHtml(progress.actionLabel)}</a>`
      : `<button class="eon-hub-primary" type="button" data-local-guide-next="${escapeHtml(progress.action)}" data-local-guide-next-runtime="${escapeHtml(progress.runtimeId)}">${escapeHtml(progress.actionLabel)}</button>`;
  return `<section class="local-ai-guide-progress is-${escapeHtml(progress.phase)}" data-local-guide-progress="${escapeHtml(progress.phase)}" aria-label="Local AI setup progress"><div><span class="local-ai-fit">Next step</span><h3>${escapeHtml(progress.title)}</h3><p>${escapeHtml(progress.detail)}</p></div><div class="local-ai-actions">${action}</div></section>`;
}

function desktopGuide(guide, options = {}) {
  const primary = guide.primaryRuntime;
  const alternatives = guide.alternativeRuntimes || [];
  return `<div class="local-ai-guide-result" aria-live="polite">
    <div class="local-ai-guide-result-head"><div><p class="local-ai-eyebrow">Your simple setup path</p><h3>${escapeHtml(guide.goal.label)}</h3><p>${escapeHtml(guide.goal.description)}</p></div><span class="local-ai-chip">one guided setup</span></div>
    <div class="local-ai-actions"><button class="eon-hub-primary" type="button" data-local-consumer-start>Make Local AI ready</button></div>
    <ol class="local-ai-guide-steps"><li>EON checks this device only after your tap and reuses a supported local AI app if one is already available.</li><li>If the Local Companion is needed, EON asks for one local approval instead of asking you for ports, CORS or a pairing code.</li><li>If your installed runtime needs a small model, EON shows one reviewed starter with its size, licence and source before downloading anything.</li><li>If a desktop runtime is not the best route, EON can offer Local Lite in this browser. A failed local setup never silently switches to cloud AI.</li></ol>
    <details class="local-ai-guide-alternatives"><summary>Manual fallback if EON says an AI app is missing</summary>${progressCard(guide, options)}${modelCard(guide.suggestedProfileId)}<div class="local-ai-profile-grid">${primary ? runtimeCard(primary, true) : ''}${alternatives.map((runtime) => runtimeCard(runtime)).join('')}</div></details>
    <p class="local-ai-disclosure">${escapeHtml(guide.goal.mediaBoundary)}</p>
  </div>`;
}

function mobileGuide() {
  return `<div class="local-ai-guide-result" aria-live="polite"><div class="local-ai-guide-result-head"><div><p class="local-ai-eyebrow">Best local route for this device</p><h3>Local Lite — no desktop AI app required</h3><p>EON can run a small reviewed text model directly inside a supported browser for private basic chat, rewriting and guidance.</p></div><span class="local-ai-chip">on-device text AI</span></div><div class="local-ai-actions"><button class="eon-hub-primary" type="button" data-local-consumer-start>Make Local AI ready</button></div><ol class="local-ai-guide-steps"><li>EON checks whether this browser can run Local Lite.</li><li>Before the first model download, EON shows the approximate size and asks you.</li><li>After setup, prompts run in this browser. EON does not silently fall back to cloud AI.</li></ol><p class="local-ai-disclosure">Local Lite is intentionally small. Heavy local image/video generation stays on a capable desktop through EON Local Companion and its separate readiness checks.</p></div>`;
}

export function renderLocalAiBeginnerSetupGuide(profile, options = {}) {
  const selectedGoal = String(options.goalId || 'private-chat');
  const guide = buildLocalAiSetupGuide(profile, { goalId: selectedGoal });
  return `<section id="eonbot-local-ai-setup" class="local-ai-catalog-card local-ai-beginner-guide" aria-labelledby="eonbot-local-ai-setup-title">
    <div class="local-ai-catalog-head"><div><p class="local-ai-eyebrow">EONBOT setup guide</p><h2 id="eonbot-local-ai-setup-title">Tell EONBOT what you want to do</h2><p>Choose one outcome. EONBOT keeps setup simple: it checks this device after your setup tap, reuses supported Local AI you already have, and offers Local Lite when that is the better fit.</p></div><a class="local-ai-secondary" href="/">Ask EONBOT in Chat</a></div>
    <div class="local-ai-goal-grid" role="group" aria-label="Choose your Local AI goal">${LOCAL_AI_SETUP_GOALS.map((goal) => `<button type="button" class="local-ai-goal${goal.id === guide.goal.id ? ' is-selected' : ''}" data-local-setup-goal="${escapeHtml(goal.id)}" aria-pressed="${goal.id === guide.goal.id ? 'true' : 'false'}"><strong>${escapeHtml(goal.label)}</strong><span>${escapeHtml(goal.description)}</span></button>`).join('')}</div>
    ${guide.mobile ? mobileGuide() : desktopGuide(guide, options)}
  </section>`;
}
