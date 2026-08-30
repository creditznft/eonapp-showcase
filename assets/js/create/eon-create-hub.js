import { EON_CREATE_MODES, getEonCreateMode } from './eon-create-catalog.js';
import { buildEonDestinationHref, findEonDestinationByRoute } from '../contracts/navigation/eon-destination-registry.js';
import { consumeEonHandoffFromLocation, removeEonHandoffQuery } from '../contracts/navigation/eon-handoff-authority.js';
import { prepareCreateDestinationHandoff, resolveCreateModeAvailability } from './eon-create-continuity-authority.js';
import { recordEonCoreOutcome } from '../contracts/outcomes/eon-core-outcome-authority.js';
import { bindDirectByokWorkspace, renderDirectByokWorkspace } from '../direct-byok/direct-byok-workspace.js';
import { bindUnifiedCreatorWorkspace, renderUnifiedCreatorWorkspace } from './creator-unified-workspace.js';
import { bindEonMusicStudio, renderEonMusicStudio } from './eon-music-studio.js';
import { consumeEonCreatorIntentHandoff } from './eon-creator-intent-handoff.js';
import { consumeEonRemixDeepLinkFromLocation } from '../share/eon-remix-deep-link.js';
import { bindComfyUiImageLab, renderComfyUiImageLab } from '../local-ai/comfyui-image-lab.js';
import { bindComfyUiVideoLab, renderComfyUiVideoLab } from '../local-ai/comfyui-video-lab.js';

const root = document.getElementById('eon-create-root');
const PENDING_COMPOSER_PROMPT_KEY = 'eon:chat:pending-composer-prompt:v1';
const CREATE_REVIEW_GUIDE_KEY = 'eon:create:review-guides:w624g:v1';
let activeModeId = EON_CREATE_MODES[0].id;
let incomingHandoff = null;
let incomingCreatorDraft = null;
let incomingRemixStarter = null;
const embeddedLocalMediaState = { comfy: null, video: null };

function escapeHtml(value = '') {
  return String(value || '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' }[char]));
}



function isCompactCreatorDevice() {
  try {
    const shortest = Math.min(globalThis.innerWidth || 1280, globalThis.innerHeight || 720);
    const mobileUa = /Mobi|Android|iPhone|iPad|iPod/i.test(globalThis.navigator?.userAgent || '');
    return shortest < 680 || mobileUa;
  } catch { return false; }
}

function renderEmbeddedLocalMedia(modeId = '') {
  const compact = isCompactCreatorDevice();
  if (modeId === 'image') return `<section class="eon-create-execution-block" data-eon-create-local-execution="image"><div class="eon-create-execution-head"><p class="eon-create-eyebrow">Local execution · same maintained engine</p><h3>Create the image here</h3><p>This is the canonical ComfyUI Image Lab reused inside Create. Nothing scans, uploads, installs or generates until you press its controls.</p></div>${renderComfyUiImageLab(embeddedLocalMediaState, { compact })}</section>`;
  if (modeId === 'video') return `<section class="eon-create-execution-block" data-eon-create-local-execution="video"><div class="eon-create-execution-head"><p class="eon-create-eyebrow">Local execution · same maintained engine</p><h3>Create the video here</h3><p>This is the canonical ComfyUI Video Lab reused inside Create. Device and workflow checks remain required, and no job starts automatically.</p></div>${renderComfyUiVideoLab(embeddedLocalMediaState, { compact, embedded: true })}</section>`;
  return '';
}

function bindEmbeddedLocalMedia(modeId = '') {
  if (modeId === 'image') bindComfyUiImageLab(root, embeddedLocalMediaState, { rerender: () => render('image') });
  if (modeId === 'video') bindComfyUiVideoLab(root, embeddedLocalMediaState, { rerender: () => render('video') });
}

function readReviewGuides() {
  try {
    const parsed = JSON.parse(localStorage.getItem(CREATE_REVIEW_GUIDE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed.filter((entry) => ['image', 'video'].includes(entry?.modeId)).slice(0, 12) : [];
  } catch { return []; }
}

function checklistFor(modeId = '') {
  if (modeId === 'video') return ['Choose text-to-video or image-to-video', 'Define subject and intended use', 'Set duration and aspect ratio', 'Describe camera motion', 'Review first/last-frame needs', 'Choose Local, Direct BYOK or Guide mode'];
  if (modeId === 'music') return ['Choose pattern, EONBOT-assisted pattern, Auto DJ or Radio', 'Define style and mood', 'Choose instrumental or vocal direction', 'Set BPM or energy when useful', 'Review audio rights', 'Choose Local, Direct BYOK or Guide mode'];
  return ['Define subject and intended use', 'Choose visual direction', 'Set aspect ratio', 'List reference-image needs', 'Review rights and disclosure needs', 'Choose Local, Direct BYOK or Guide mode'];
}

function prepareReviewGuide(mode) {
  if (!['image', 'video', 'music'].includes(mode?.id)) return { ok: false, reason: 'image-or-video-mode-required' };
  const createdAt = Date.now();
  const guide = Object.freeze({
    schema: 'eon.create.review-guide.w624g.v1',
    id: `creator-guide-${createdAt}`,
    modeId: mode.id,
    title: `${mode.label} review guide`,
    checklist: Object.freeze(checklistFor(mode.id)),
    executionStatus: 'proposal-only',
    generationClaimed: false,
    uploadClaimed: false,
    publishingClaimed: false,
    createdAt
  });
  try {
    const guides = [guide, ...readReviewGuides().filter((entry) => entry.modeId !== mode.id)].slice(0, 12);
    localStorage.setItem(CREATE_REVIEW_GUIDE_KEY, JSON.stringify(guides));
    recordEonCoreOutcome({ kind: 'creator-guide-artifact', route: '/create', source: 'create-local-guide', receiptId: guide.id, verified: true });
    return { ok: true, guide };
  } catch { return { ok: false, reason: 'local-storage-unavailable' }; }
}

function storeChatPrompt(prompt = '') {
  try { sessionStorage.setItem(PENDING_COMPOSER_PROMPT_KEY, String(prompt || '').trim()); } catch {}
}

async function openPrimary(mode) {
  if (mode.primary.kind === 'chat') {
    storeChatPrompt(mode.primary.prompt);
    window.location.assign(buildEonDestinationHref('home', { new: '1' }));
    return;
  }
  const destination = findEonDestinationByRoute(mode.primary.href);
  if (!destination) { window.location.assign(mode.primary.href); return; }
  const handoff = await prepareCreateDestinationHandoff(mode.id, { explicitUserAction: true });
  window.location.assign(handoff.ok ? handoff.href : mode.primary.href);
}

function railLabel(rail = '') {
  return ({
    'local-runtime': 'Local',
    'direct-user-owned-byok': 'Direct BYOK',
    guide: 'Guide'
  })[rail] || rail;
}

function renderMediaExecutionLauncher(mode = {}) {
  if (!['image', 'video'].includes(mode?.id)) return '';
  const noun = mode.id === 'video' ? 'video' : 'image';
  return `<section class="eon-create-execution-launcher" aria-label="${escapeHtml(mode.label)} execution paths"><div><strong>Ready to make the ${noun}?</strong><p>Choose where generation runs. Nothing scans, pairs, uploads or spends until you use the controls in that rail.</p></div><div class="eon-create-execution-launcher-actions"><button type="button" class="eon-create-primary" data-eon-create-execution-rail="local-runtime">Use Local</button><button type="button" class="eon-create-secondary" data-eon-create-execution-rail="direct-user-owned-byok">Use Direct BYOK</button></div></section>`;
}

function focusMediaExecutionRail(modeId = '', rail = '') {
  if (!root || !['image', 'video'].includes(modeId)) return false;
  const details = root.querySelector('.eon-create-advanced-workspaces');
  if (details) details.open = true;
  const selector = rail === 'local-runtime'
    ? `[data-eon-create-local-execution="${modeId}"]`
    : rail === 'direct-user-owned-byok'
      ? '[data-eon-direct-byok]'
      : '';
  if (!selector) return false;
  const section = root.querySelector(selector);
  if (!section) return false;
  section.scrollIntoView?.({ block: 'start', behavior: 'smooth' });
  const target = rail === 'local-runtime'
    ? section.querySelector(modeId === 'video' ? '[data-video-scan]' : '[data-comfy-scan]')
    : section.querySelector('[data-eon-direct-scan]');
  target?.focus?.();
  return true;
}

function renderCard(mode, selected) {
  const availability = resolveCreateModeAvailability(mode.id);
  return `<button type="button" class="eon-create-card${selected ? ' is-selected' : ''}" data-eon-create-select="${escapeHtml(mode.id)}" data-eon-create-availability="${escapeHtml(availability.availability)}" aria-pressed="${selected}">
    <span class="eon-create-card-head"><span class="eon-create-icon" aria-hidden="true">${escapeHtml(mode.icon)}</span><span><strong>${escapeHtml(mode.label)}</strong><small>${escapeHtml(mode.status)}</small></span></span>
    <span class="eon-create-card-title">${escapeHtml(mode.title)}</span>
    <span class="eon-create-card-copy">${escapeHtml(mode.summary)}</span>
  </button>`;
}

function renderDetail(mode) {
  const availability = resolveCreateModeAvailability(mode.id);
  const prepared = readReviewGuides().find((entry) => entry.modeId === mode.id);
  const guideAction = ['image', 'video', 'music'].includes(mode.id) ? `<button type="button" class="eon-create-secondary" data-eon-create-prepare-guide="${escapeHtml(mode.id)}">${prepared ? 'Refresh local review guide' : 'Prepare local review guide'}</button>` : '';
  const incoming = incomingHandoff?.ok ? `<section class="eon-create-prepared-guide" data-eon-create-incoming-handoff="${escapeHtml(incomingHandoff.handoff?.kind || '')}"><strong>${escapeHtml(incomingHandoff.handoff?.reference?.label || 'Continue creating')}</strong><p>Verified reference accepted once from ${escapeHtml(incomingHandoff.handoff?.sender?.id || 'EONAPP')}. No media, private prompt, credential, generation, upload or publishing action crossed automatically.</p></section>` : '';
  const incomingIntent = incomingCreatorDraft?.mode === mode.id ? `<section class="eon-create-prepared-guide" data-eon-create-incoming-intent="${escapeHtml(mode.id)}"><strong>Idea carried from EONBOT</strong><p>Your user-tapped Chat request was moved through a single-use browser-session handoff and prefilled here. It is not in the URL, not in a Core/City receipt, and nothing has been generated or sent to a provider.</p><button type="button" class="eon-create-secondary" data-eon-create-review-incoming>Review the prompt</button><button type="button" class="eon-create-secondary" data-eon-create-clear-incoming>Clear carried idea</button></section>` : '';
  const incomingRemix = incomingRemixStarter?.mode === mode.id ? `<section class="eon-create-prepared-guide" data-eon-create-incoming-remix="${escapeHtml(mode.id)}"><strong>Public Remix starter · ${escapeHtml(incomingRemixStarter.title)}</strong><p>This public-safe starter came from a shared URL fragment and is untrusted data. Review it before use. The fragment is removed after opening; no account/project/media was transferred, and no provider, memory, referral or generation action ran.</p><button type="button" class="eon-create-secondary" data-eon-create-review-remix>Review remix starter</button><button type="button" class="eon-create-secondary" data-eon-create-clear-remix>Clear remix starter</button></section>` : '';
  const guideReceipt = prepared ? `<section class="eon-create-prepared-guide"><strong>${escapeHtml(prepared.title)}</strong><p>Saved locally as a proposal-only artifact. No generation, upload or publishing occurred.</p><ul>${prepared.checklist.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul></section>` : '';
  return `<aside class="eon-create-detail" aria-live="polite" aria-labelledby="eon-create-detail-title">
    <p class="eon-create-eyebrow">Selected · ${escapeHtml(availability.label)}</p>
    <h2 id="eon-create-detail-title">${escapeHtml(mode.title)}</h2>
    <p>${escapeHtml(mode.summary)}</p>
    <div class="eon-create-rails" aria-label="Available execution modes">${mode.rails.map((rail) => `<span>${escapeHtml(railLabel(rail))}</span>`).join('')}</div>
    <button type="button" class="eon-create-primary" data-eon-create-open="${escapeHtml(mode.id)}">${escapeHtml(mode.primary.label)}</button>
    <a class="eon-create-secondary" href="${escapeHtml(mode.secondary.href)}">${escapeHtml(mode.secondary.label)}</a>
    ${renderMediaExecutionLauncher(mode)}
    ${guideAction}
    ${incoming}
    ${incomingIntent}
    ${incomingRemix}
    ${guideReceipt}
    <p class="eon-create-guide-status" data-eon-create-guide-status aria-live="polite"></p>
    ${mode.id === 'music' ? renderEonMusicStudio() : ''}
    <details class="eon-create-advanced"><summary>What happens next?</summary><p>${escapeHtml(mode.truth)}</p><p>Advanced provider, model, workflow and generation controls remain hidden until you deliberately open the relevant setup surface.</p></details>
  </aside>`;
}

function creatorDraftField(modeId = '') {
  if (!root || incomingCreatorDraft?.mode !== modeId) return null;
  if (modeId === 'music') return root.querySelector('[data-music-idea]');
  if (modeId === 'image') return root.querySelector('[data-comfy-prompt]') || root.querySelector('[data-eon-unified-creator] textarea[name="goal"]');
  if (modeId === 'video') return root.querySelector('[data-video-prompt]') || root.querySelector('[data-eon-unified-creator] textarea[name="goal"]');
  return null;
}

function applyIncomingCreatorDraft(modeId = '') {
  if (!root || incomingCreatorDraft?.mode !== modeId) return;
  const prompt = String(incomingCreatorDraft.prompt || '').trim();
  if (!prompt) return;
  const primary = creatorDraftField(modeId);
  if (primary && incomingCreatorDraft.applied !== true) {
    primary.value = prompt;
    primary.dispatchEvent(new Event('input', { bubbles: true }));
    incomingCreatorDraft.applied = true;
  }
  if (primary && primary.dataset.eonIncomingBound !== '1') {
    primary.dataset.eonIncomingBound = '1';
    primary.addEventListener('input', () => {
      if (incomingCreatorDraft?.mode === modeId) incomingCreatorDraft.prompt = String(primary.value || '').slice(0, 1200);
    });
  }
  if (modeId === 'music') {
    const acePrompt = root.querySelector('[data-music-acestep-prompt]');
    if (acePrompt && !String(acePrompt.value || '').trim()) acePrompt.value = prompt;
  }
  if (['image', 'video'].includes(modeId)) {
    const hostedPrompt = root.querySelector('[data-direct-media-prompt]');
    if (hostedPrompt && !String(hostedPrompt.value || '').trim()) hostedPrompt.value = prompt;
    if (hostedPrompt && hostedPrompt.dataset.eonIncomingBound !== '1') {
      hostedPrompt.dataset.eonIncomingBound = '1';
      hostedPrompt.addEventListener('input', () => {
        if (incomingCreatorDraft?.mode === modeId) incomingCreatorDraft.prompt = String(hostedPrompt.value || '').slice(0, 1200);
      });
    }
  }
}

function remixStarterField(modeId = '') {
  if (!root || incomingRemixStarter?.mode !== modeId) return null;
  if (modeId === 'music') return root.querySelector('[data-music-idea]');
  if (modeId === 'image') return root.querySelector('[data-comfy-prompt]') || root.querySelector('[data-eon-unified-creator] textarea[name="goal"]');
  if (modeId === 'video') return root.querySelector('[data-video-prompt]') || root.querySelector('[data-eon-unified-creator] textarea[name="goal"]');
  return null;
}

function remixStarterPrompt(starter = {}) {
  const outcome = String(starter?.usefulOutcome || '').trim();
  const step = String(starter?.firstRemixStep || '').trim();
  return [outcome, step ? `First remix step: ${step}` : ''].filter(Boolean).join(' ').slice(0, 1100);
}

function applyIncomingRemixStarter(modeId = '') {
  if (!root || incomingRemixStarter?.mode !== modeId) return;
  const field = remixStarterField(modeId);
  const prompt = remixStarterPrompt(incomingRemixStarter);
  if (field && incomingRemixStarter.applied !== true) {
    field.value = prompt;
    field.dispatchEvent(new Event('input', { bubbles: true }));
    incomingRemixStarter.applied = true;
  }
  if (['image', 'video'].includes(modeId)) {
    const hostedPrompt = root.querySelector('[data-direct-media-prompt]');
    if (hostedPrompt && !String(hostedPrompt.value || '').trim()) hostedPrompt.value = prompt;
  }
}

function focusIncomingRemixStarter(modeId = '') {
  if (!root || incomingRemixStarter?.mode !== modeId) return;
  if (['image', 'video'].includes(modeId)) {
    const details = root.querySelector('.eon-create-advanced-workspaces');
    if (details) details.open = true;
  }
  applyIncomingRemixStarter(modeId);
  const field = remixStarterField(modeId);
  field?.scrollIntoView?.({ block: 'center', behavior: 'smooth' });
  field?.focus?.();
}

function clearIncomingRemixStarter(modeId = '') {
  if (!root || incomingRemixStarter?.mode !== modeId) return;
  const field = remixStarterField(modeId);
  const prompt = remixStarterPrompt(incomingRemixStarter);
  if (field && String(field.value || '').trim() === prompt) field.value = '';
  incomingRemixStarter = null;
  render(modeId);
}

function focusIncomingCreatorDraft(modeId = '') {
  if (!root || incomingCreatorDraft?.mode !== modeId) return;
  if (['image', 'video'].includes(modeId)) {
    const details = root.querySelector('.eon-create-advanced-workspaces');
    if (details) details.open = true;
  }
  applyIncomingCreatorDraft(modeId);
  const field = creatorDraftField(modeId);
  field?.scrollIntoView?.({ block: 'center', behavior: 'smooth' });
  field?.focus?.();
}

function clearIncomingCreatorDraft(modeId = '') {
  if (!root || incomingCreatorDraft?.mode !== modeId) return;
  const field = creatorDraftField(modeId);
  if (field) field.value = '';
  const acePrompt = modeId === 'music' ? root.querySelector('[data-music-acestep-prompt]') : null;
  if (acePrompt) acePrompt.value = '';
  const hostedPrompt = ['image', 'video'].includes(modeId) ? root.querySelector('[data-direct-media-prompt]') : null;
  if (hostedPrompt) hostedPrompt.value = '';
  incomingCreatorDraft = null;
  render(modeId);
}

function render(selectedId = EON_CREATE_MODES[0].id) {
  if (!root) return;
  const selected = getEonCreateMode(selectedId);
  activeModeId = selected.id;
  root.innerHTML = `<section class="eon-create-hub" aria-labelledby="eon-create-title">
    <header class="eon-create-hero">
      <div><p class="eon-create-eyebrow">One place to begin</p><h1 id="eon-create-title">Create something</h1><p>Choose the result you want. EONAPP opens the simplest honest path and keeps advanced controls out of the way until they matter.</p></div>
      <div class="eon-create-hero-actions"><a href="${escapeHtml(buildEonDestinationHref('home', { new: '1' }))}">Ask EONBOT</a><a href="${escapeHtml(buildEonDestinationHref('projects'))}">Continue a project</a></div>
    </header>
    <div class="eon-create-layout">
      <section class="eon-create-grid" aria-label="Create choices">${EON_CREATE_MODES.map((mode) => renderCard(mode, mode.id === selected.id)).join('')}</section>
      ${renderDetail(selected)}
    </div>
    <details class="eon-create-advanced eon-create-advanced-workspaces"><summary>Advanced creation workspaces</summary><div><p>Open these only when you need detailed local runtime, provider, model or BYOK controls. Opening this section never scans a runtime or starts a generation job.</p>${renderEmbeddedLocalMedia(selected.id)}${renderUnifiedCreatorWorkspace(selected.id)}${renderDirectByokWorkspace({ mediaKind: selected.id })}</div></details>
    <footer class="eon-create-truth"><strong>Private by default.</strong><span>Opening Create never publishes, purchases, uploads, spends, schedules, or grants access. Image, video and generative music must use Local, Direct BYOK, or Guide mode. Browser music sequencing stays local and user-triggered.</span></footer>
  </section>`;

  bindEmbeddedLocalMedia(selected.id);
  bindUnifiedCreatorWorkspace(root);
  bindDirectByokWorkspace(root, { mediaKind: selected.id, rerender: () => render(selected.id) });
  bindEonMusicStudio(root, { rerender: () => render('music') });
  applyIncomingCreatorDraft(selected.id);
  applyIncomingRemixStarter(selected.id);
  root.querySelector('[data-eon-create-review-incoming]')?.addEventListener('click', () => focusIncomingCreatorDraft(selected.id));
  root.querySelector('[data-eon-create-clear-incoming]')?.addEventListener('click', () => clearIncomingCreatorDraft(selected.id));
  root.querySelector('[data-eon-create-review-remix]')?.addEventListener('click', () => focusIncomingRemixStarter(selected.id));
  root.querySelector('[data-eon-create-clear-remix]')?.addEventListener('click', () => clearIncomingRemixStarter(selected.id));
  root.querySelectorAll('[data-eon-create-select]').forEach((button) => button.addEventListener('click', () => render(button.dataset.eonCreateSelect)));
  root.querySelector('[data-eon-create-open]')?.addEventListener('click', () => { void openPrimary(selected); });
  root.querySelectorAll('[data-eon-create-execution-rail]').forEach((button) => button.addEventListener('click', () => {
    focusMediaExecutionRail(selected.id, button.dataset.eonCreateExecutionRail || '');
  }));
  root.querySelector('[data-eon-create-prepare-guide]')?.addEventListener('click', () => {
    const result = prepareReviewGuide(selected);
    const status = root.querySelector('[data-eon-create-guide-status]');
    if (status) status.textContent = result.ok ? 'Local review guide saved. It is a proposal only; no media was generated or uploaded.' : 'The local review guide could not be saved in this browser.';
    if (result.ok) render(selected.id);
  });
}

root?.addEventListener('eon:creator-rerender', (event) => render(event.detail?.mediaKind || activeModeId));

function initialMode() {
  try { return new URLSearchParams(window.location.search).get('mode') || EON_CREATE_MODES[0].id; } catch { return EON_CREATE_MODES[0].id; }
}

async function bootCreate() {
  const remix = consumeEonRemixDeepLinkFromLocation();
  if (remix.ok) incomingRemixStarter = { ...remix.starter, applied: false };
  const incoming = await consumeEonHandoffFromLocation({ receiverId: 'create' });
  if (incoming.ok) {
    incomingHandoff = incoming;
    removeEonHandoffQuery();
  } else if (!['handoff-query-missing', 'handoff-not-found'].includes(incoming.reason)) removeEonHandoffQuery();
  const selectedMode = getEonCreateMode(incoming.handoff?.payload?.mediaKind || incoming.handoff?.payload?.modeId || incomingRemixStarter?.mode || initialMode()).id;
  const creatorIntent = consumeEonCreatorIntentHandoff({ mode: selectedMode });
  if (creatorIntent.ok) incomingCreatorDraft = { mode: creatorIntent.handoff.mode, prompt: creatorIntent.handoff.prompt, applied: false };
  render(selectedMode);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => { void bootCreate(); }, { once: true });
else void bootCreate();
