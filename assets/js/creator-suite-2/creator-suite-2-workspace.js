/** W321–W327 — Workspace-only Creator Suite 2 renderer and local export. */

import { buildCreatorSuiteExport, createCreatorSuiteDraft, CREATOR_SUITE_2_MODULES } from './creator-suite-2-engine.js';
import { listEonOutcomeKitPreviews, prepareEonOutcomeKitBrief } from './eon-outcome-kit-catalog.js';
import { writeEonOutputShareHandoff } from '../share/eon-output-share-handoff.js';

const session = { drafts: [] };

function escapeHtml(value = '') {
  return String(value || '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' }[char]));
}

function labelFor(module = '') {
  return ({ build: 'Build Studio', content: 'Content Studio', image: 'Image Studio', video: 'Video Studio', audio: 'Music / Audio Studio', voice: 'Voice Studio' })[module] || 'Creator Suite';
}

function remixKindFor(module = '') {
  if (module === 'build') return 'forge-starter';
  if (module === 'image') return 'image-concept';
  if (module === 'video') return 'video-storyboard';
  if (module === 'audio') return 'music-track';
  return module === 'content' ? 'content-series' : 'campaign-brief';
}

function buildOutputShareHandoff(draft) {
  const payload = draft?.payload || {};
  const studio = labelFor(draft?.module);
  const callToAction = String(payload.callToAction || '').trim();
  return writeEonOutputShareHandoff({
    explicitUserAction: true,
    origin: 'creator-draft',
    title: draft?.title,
    audience: payload.audience,
    usefulOutcome: payload.goal,
    firstRemixStep: `Adapt this ${studio} direction for your own audience, style and call to action${callToAction ? `: ${callToAction}` : '.'}`,
    remixKind: remixKindFor(draft?.module)
  });
}

function focusOutputShareForm(root, handoff, destination = 'share-pack') {
  const selector = destination === 'remix-card' ? '[data-eon-remix-card-form]' : '[data-eon-share-pack-form]';
  const form = root?.querySelector?.(selector);
  if (!form || !handoff) return false;
  form.elements.title.value = handoff.title;
  if (destination === 'remix-card') {
    form.elements.usefulOutcome.value = handoff.usefulOutcome;
    form.elements.firstRemixStep.value = handoff.firstRemixStep;
    if ([...form.elements.kind.options].some((option) => option.value === handoff.remixKind)) {
      form.elements.kind.value = handoff.remixKind;
    }
  } else {
    form.elements.audience.value = handoff.audience;
    form.elements.goal.value = handoff.usefulOutcome;
    form.elements.cta.value = handoff.firstRemixStep;
  }
  const section = form.closest('section');
  section?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
  form.elements.title?.focus?.();
  return true;
}

function downloadExport(draft) {
  const exportData = buildCreatorSuiteExport(draft);
  const blob = new Blob([`${JSON.stringify(exportData, null, 2)}\n`], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${String(draft.title || 'creator-draft').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 48) || 'creator-draft'}-eonapp-local-draft.json`;
  anchor.hidden = true;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function renderOutcomeKitPreviews() {
  const kits = listEonOutcomeKitPreviews();
  return `<section class="eon-outcome-kits" aria-labelledby="eon-outcome-kits-title"><div class="eon-city-work-mission-head"><div><p class="eon-hub-kicker">Outcome Kit previews</p><h3 id="eon-outcome-kits-title">Start with a useful local brief</h3><p>Choose a starting direction, then edit it before preparing a local draft. These previews are free and local. They are not prices, purchases, paid packs, licences, subscriptions, provider calls, generated assets, NFTs, referral rewards, or feature unlocks.</p></div><span class="eon-record-status">Local preview</span></div><div class="eon-outcome-kit-list">${kits.map((kit) => `<article class="eon-record-card eon-outcome-kit-card"><span class="eon-outcome-kit-meta">${escapeHtml(kit.category)}</span><h3>${escapeHtml(kit.label)}</h3><p>${escapeHtml(kit.summary)}</p><p class="eon-record-meta">${kit.deliverables.map(escapeHtml).join(' · ')}</p><button class="eon-record-button" type="button" data-eon-outcome-kit="${escapeHtml(kit.id)}">Use local starting brief</button></article>`).join('')}</div><p class="eon-profile-status eon-outcome-kit-status" role="status" aria-live="polite" data-eon-outcome-kit-status></p></section>`;
}

function renderDraft(draft) {
  const payload = draft.payload || {};
  return `<article class="eon-record-card" data-creator-suite-draft="${escapeHtml(draft.draftId)}"><div><p class="eon-record-type">${escapeHtml(labelFor(draft.module))} · local draft</p><h3>${escapeHtml(draft.title)}</h3><p>${escapeHtml(payload.goal || '')}</p><p class="eon-record-meta">Prepared for export · rights review required · no provider call, render, upload, schedule, publication, sale, or ownership claim.</p><ul>${(payload.deliverables || []).map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul></div><div class="eon-record-actions"><button type="button" class="eon-record-button" data-creator-suite-share-pack="${escapeHtml(draft.draftId)}">Prepare Ready-to-Post kit</button><button type="button" class="eon-record-button" data-creator-suite-remix-card="${escapeHtml(draft.draftId)}">Prepare Remix Card</button><button type="button" class="eon-record-button" data-creator-suite-export="${escapeHtml(draft.draftId)}">Export local draft</button><button type="button" class="eon-record-button is-danger" data-creator-suite-remove="${escapeHtml(draft.draftId)}">Remove</button></div></article>`;
}

export function renderCreatorSuite2Workspace() {
  return `<section class="eon-hub-card eon-hub-card-full" aria-labelledby="creator-suite-2-title"><div class="eon-city-work-mission-head"><div><p class="eon-hub-kicker">Creator Suite 2 · Workspace</p><h2 id="creator-suite-2-title">Prepare creator work without pretending it ran</h2><p>Draft briefs, storyboards, prompt decks, audio direction, voice scripts, and developer handoffs locally. This section keeps drafts only in current page memory until you export them. It never calls a media provider, stores a credential, uploads, schedules, publishes, sells, or proves rights.</p></div><span class="eon-record-status">Local draft</span></div>${renderOutcomeKitPreviews()}<form class="eon-record-form" data-creator-suite-form><label>Studio<select name="module">${CREATOR_SUITE_2_MODULES.map((module) => `<option value="${module}">${escapeHtml(labelFor(module))}</option>`).join('')}</select></label><label>Title<input name="title" maxlength="180" required placeholder="Friday campaign launch pack" /></label><label>Audience<input name="audience" maxlength="280" placeholder="People discovering the offer" /></label><label>Goal<textarea name="goal" maxlength="4000" required placeholder="Describe the message, asset, site, or story you want to prepare. Do not include credentials."></textarea></label><label>Style<input name="style" maxlength="280" placeholder="Clear, bold, welcoming" /></label><label>Call to action<input name="callToAction" maxlength="180" placeholder="Book a table" /></label><p class="eon-record-form-note">Creator Suite 2 prepares a local export draft. Use a user-selected provider later only after its own compatibility and rights review.</p><p class="eon-record-form-error" data-creator-suite-error></p><div class="eon-record-form-actions"><button class="eon-hub-primary" type="submit">Prepare local draft</button></div></form><div class="eon-record-list" data-creator-suite-list>${session.drafts.length ? session.drafts.map(renderDraft).join('') : '<p class="eon-hub-empty">No creator drafts in this page session. Prepare one and export it when ready.</p>'}</div></section>`;
}

export function applyEonOutcomeKitPreview(root, kitId = '') {
  const form = root?.querySelector?.('[data-creator-suite-form]');
  const status = root?.querySelector?.('[data-eon-outcome-kit-status]');
  const prepared = prepareEonOutcomeKitBrief(kitId);
  if (!prepared.ok || !form) {
    if (status) status.textContent = 'That local Outcome Kit preview is unavailable. No draft was created.';
    return Object.freeze({ ok: false, reason: prepared.ok ? 'creator-suite-form-unavailable' : 'unknown-local-kit' });
  }
  const brief = prepared.brief;
  form.elements.module.value = brief.module;
  form.elements.title.value = brief.title;
  form.elements.audience.value = brief.audience;
  form.elements.goal.value = brief.goal;
  form.elements.style.value = brief.style;
  form.elements.callToAction.value = brief.callToAction;
  if (status) status.textContent = `${prepared.kit.label} applied as an editable local starting brief. Review and choose “Prepare local draft” yourself.`;
  form.elements.goal.focus();
  return Object.freeze({ ok: true, kitId: prepared.kit.id, draftCreated: false, providerCall: false, externalEffect: false });
}

export function bindCreatorSuite2Workspace(root) {
  const form = root.querySelector('[data-creator-suite-form]');
  root.querySelectorAll('[data-eon-outcome-kit]').forEach((button) => button.addEventListener('click', () => {
    applyEonOutcomeKitPreview(root, button.dataset.eonOutcomeKit || '');
  }));
  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    const error = root.querySelector('[data-creator-suite-error]');
    try {
      const draft = createCreatorSuiteDraft({
        module: form.elements.module.value,
        title: form.elements.title.value,
        audience: form.elements.audience.value,
        goal: form.elements.goal.value,
        style: form.elements.style.value,
        callToAction: form.elements.callToAction.value
      });
      session.drafts.unshift(draft);
      error.textContent = 'Local draft prepared. It is held only in this page session until you export it.';
      root.querySelector('[data-creator-suite-list]').innerHTML = session.drafts.map(renderDraft).join('');
      form.reset();
    } catch (reason) {
      error.textContent = String(reason?.message || reason || 'The local draft could not be prepared.');
    }
  });
  root.querySelector('[data-creator-suite-list]')?.addEventListener('click', (event) => {
    const target = event.target?.closest?.('button');
    if (!target) return;
    const id = target.dataset.creatorSuiteExport || target.dataset.creatorSuiteRemove || target.dataset.creatorSuiteSharePack || target.dataset.creatorSuiteRemixCard;
    const draft = session.drafts.find((item) => item.draftId === id);
    if (!draft) return;
    if (target.dataset.creatorSuiteSharePack || target.dataset.creatorSuiteRemixCard) {
      const result = buildOutputShareHandoff(draft);
      const error = root.querySelector('[data-creator-suite-error]');
      if (!result.ok) {
        if (error) error.textContent = result.reason || 'That local draft could not be prepared for Share or Remix.';
        return;
      }
      const destination = target.dataset.creatorSuiteRemixCard ? 'remix-card' : 'share-pack';
      const focused = focusOutputShareForm(root, result.handoff, destination);
      if (error) {
        error.textContent = focused
          ? `Creator draft prepared as a browser-session ${destination === 'remix-card' ? 'Remix Card' : 'Ready-to-Post kit'} starter. Review every field before creating it.`
          : 'Creator draft prepared as a browser-session Ready-to-Post/Remix starter. Open the matching workspace card to review it.';
      }
      return;
    }
    if (target.dataset.creatorSuiteExport) downloadExport(draft);
    if (target.dataset.creatorSuiteRemove) {
      session.drafts = session.drafts.filter((item) => item.draftId !== id);
      root.querySelector('[data-creator-suite-list]').innerHTML = session.drafts.length ? session.drafts.map(renderDraft).join('') : '<p class="eon-hub-empty">No creator drafts in this page session. Prepare one and export it when ready.</p>';
    }
  });
}

export function getCreatorSuite2SessionTruth() {
  return Object.freeze({
    currentPageMemory: true,
    sessionStorage: false,
    outputShareHandoffSessionStorage: true,
    localStorage: false,
    encryptedVaultPersistence: false,
    exportRequiresUserAction: true,
    providerCall: false,
    externalEffect: false
  });
}
