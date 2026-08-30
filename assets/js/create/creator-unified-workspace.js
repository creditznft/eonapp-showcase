/** W627A–W627C — one review-first Creator workspace for image and video. */

import { buildCreatorIntent, getCreatorModeTruth, getCreatorRailContinuation, normalizeCreatorUiMode } from './creator-mode-contract.js';
import { createCreatorJob, loadCreatorJobs, transitionCreatorJob } from './creator-job-lifecycle.js';

const UI_MODE_KEY = 'eon:creator:ui-mode:v1';

function escapeHtml(value = '') {
  return String(value || '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' })[char]);
}

function currentUiMode() {
  try { return normalizeCreatorUiMode(localStorage.getItem(UI_MODE_KEY)); } catch { return 'beginner'; }
}

function stateLabel(state = '') {
  return ({ draft: 'Draft', preparing: 'Preparing', waiting: 'Waiting', running: 'Running', failed: 'Failed', cancelled: 'Cancelled', complete: 'Complete', saved: 'Saved', deleted: 'Deleted' })[state] || state;
}

function renderJobs(mediaKind = '') {
  const rows = loadCreatorJobs().filter((job) => job.mediaKind === mediaKind && job.state !== 'deleted').slice(0, 6);
  if (!rows.length) return '<p class="eon-creator-empty">No local creator drafts yet. Creating a draft does not start a runtime or paid provider job.</p>';
  return `<ol class="eon-creator-jobs">${rows.map((job) => `<li><div><strong>${escapeHtml(job.safeLabel)}</strong><span>${escapeHtml(stateLabel(job.state))} · ${escapeHtml(job.rail.replaceAll('-', ' '))}</span></div><div class="eon-creator-job-actions">${['draft', 'failed', 'cancelled'].includes(job.state) ? `<button type="button" data-eon-creator-prepare="${escapeHtml(job.jobId)}">Prepare</button>` : ''}<button type="button" data-eon-creator-delete="${escapeHtml(job.jobId)}">Delete</button></div></li>`).join('')}</ol>`;
}

export function renderUnifiedCreatorWorkspace(mediaKind = 'image') {
  if (!['image', 'video'].includes(mediaKind)) return '';
  const uiMode = currentUiMode();
  const advanced = uiMode === 'advanced';
  const truth = getCreatorModeTruth();
  return `<section class="eon-unified-creator" data-eon-unified-creator data-media-kind="${escapeHtml(mediaKind)}" aria-labelledby="eon-unified-creator-title">
    <header class="eon-unified-creator-head"><div><p class="eon-create-eyebrow">Unified Creator</p><h2 id="eon-unified-creator-title">Plan once, continue through the rail you choose</h2><p>One draft can continue to the existing Local, Direct BYOK or Guide path. This workspace does not create a second execution system and never starts generation when you save a draft.</p></div><div class="eon-creator-mode-toggle" role="group" aria-label="Creator control level"><button type="button" data-eon-creator-ui-mode="beginner" aria-pressed="${!advanced}">Beginner</button><button type="button" data-eon-creator-ui-mode="advanced" aria-pressed="${advanced}">Advanced</button></div></header>
    <form data-eon-creator-form class="eon-creator-form">
      <label class="eon-creator-goal">What do you want to make?<textarea name="goal" maxlength="12000" required placeholder="Describe the subject, purpose and look. Do not paste provider keys or passwords."></textarea></label>
      <fieldset><legend>Choose the execution rail</legend><label><input type="radio" name="rail" value="local-runtime" /> Local runtime</label><label><input type="radio" name="rail" value="direct-user-owned-byok" /> Direct BYOK</label><label><input type="radio" name="rail" value="guide" checked /> Guide only</label></fieldset>
      <div class="eon-creator-advanced-fields" ${advanced ? '' : 'hidden'} data-eon-creator-advanced>
        <label>Aspect ratio<select name="aspectRatio"><option>1:1</option><option>4:5</option><option>16:9</option><option>9:16</option></select></label>
        <label>Quality profile<select name="qualityProfile"><option value="balanced">Balanced</option><option value="fast">Fast</option><option value="quality">Quality</option></select></label>
        <label>Seed (optional)<input name="seed" inputmode="numeric" pattern="[0-9]*" /></label>
        ${mediaKind === 'video' ? '<label>Duration seconds<input name="durationSeconds" type="number" min="1" max="30" value="4" /></label>' : ''}
        <label class="eon-creator-prompt-choice"><input type="checkbox" name="savePromptToLibrary" /> Save the prompt only when I later save a verified output to Creator Library</label>
      </div>
      <div class="eon-creator-form-actions"><button type="submit" class="eon-create-primary">Create local draft</button><span data-eon-creator-status aria-live="polite">Beginner mode uses conservative defaults.</span></div>
    </form>
    <section class="eon-creator-lifecycle" aria-labelledby="eon-creator-lifecycle-title"><div><h3 id="eon-creator-lifecycle-title">Recent ${escapeHtml(mediaKind)} work</h3><a href="/library#creator-library">Open Creator Library</a></div>${renderJobs(mediaKind)}</section>
    <p class="eon-creator-truth">Draft creation starts generation: <strong>${truth.draftCreationStartsGeneration ? 'yes' : 'no'}</strong>. Hidden cloud fallback: <strong>${truth.hiddenCloudFallback ? 'yes' : 'no'}</strong>.</p>
  </section>`;
}

export function bindUnifiedCreatorWorkspace(root, { navigate = (href) => window.location.assign(href) } = {}) {
  const host = root?.querySelector?.('[data-eon-unified-creator]');
  if (!host) return;
  const mediaKind = String(host.dataset.mediaKind || 'image');
  host.querySelectorAll('[data-eon-creator-ui-mode]').forEach((button) => button.addEventListener('click', () => {
    try { localStorage.setItem(UI_MODE_KEY, normalizeCreatorUiMode(button.dataset.eonCreatorUiMode)); } catch {}
    root.dispatchEvent(new CustomEvent('eon:creator-rerender', { bubbles: true, detail: { mediaKind } }));
  }));
  host.querySelector('[data-eon-creator-form]')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const result = buildCreatorIntent({ mediaKind, rail: data.get('rail'), uiMode: currentUiMode(), goal: data.get('goal'), aspectRatio: data.get('aspectRatio'), qualityProfile: data.get('qualityProfile'), seed: data.get('seed'), durationSeconds: data.get('durationSeconds'), savePromptToLibrary: data.get('savePromptToLibrary') === 'on' }, { explicitUserAction: true });
    const status = host.querySelector('[data-eon-creator-status]');
    if (!result.ok) { if (status) status.textContent = result.reason.replaceAll('-', ' '); return; }
    const created = createCreatorJob(result.intent, { explicitUserAction: true });
    if (!created.ok) { if (status) status.textContent = created.reason.replaceAll('-', ' '); return; }
    const continuation = getCreatorRailContinuation(result.intent);
    if (status) status.innerHTML = `Draft saved locally. <button type="button" data-eon-creator-continue="${escapeHtml(created.job.jobId)}" data-href="${escapeHtml(continuation.href)}">${escapeHtml(continuation.label)}</button>`;
    root.dispatchEvent(new CustomEvent('eon:creator-rerender-later', { bubbles: true, detail: { mediaKind } }));
  });
  host.addEventListener('click', (event) => {
    const prepare = event.target.closest?.('[data-eon-creator-prepare]');
    const remove = event.target.closest?.('[data-eon-creator-delete]');
    const continuation = event.target.closest?.('[data-eon-creator-continue]');
    if (prepare) {
      transitionCreatorJob(prepare.dataset.eonCreatorPrepare, 'preparing', { code: 'user-preparing', message: 'The user chose to prepare this job on its established rail.' }, { explicitUserAction: true });
      root.dispatchEvent(new CustomEvent('eon:creator-rerender', { bubbles: true, detail: { mediaKind } }));
    }
    if (remove) {
      transitionCreatorJob(remove.dataset.eonCreatorDelete, 'deleted', { code: 'user-deleted', message: 'Creator job deleted locally.' }, { explicitUserAction: true });
      root.dispatchEvent(new CustomEvent('eon:creator-rerender', { bubbles: true, detail: { mediaKind } }));
    }
    if (continuation) navigate(continuation.dataset.href);
  });
}
