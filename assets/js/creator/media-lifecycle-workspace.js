/** W403 — Workspace-only lean media lifecycle desk. */
import { buildCreatorMediaLifecycleExport, createCreatorMediaLifecycleEntry, CREATOR_MEDIA_ROLES } from './media-lifecycle.js';

const session = { entries: [] };

function escapeHtml(value = '') {
  return String(value || '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' }[char]));
}

function renderEntry(entry) {
  const urgency = entry.keep ? 'is-active' : '';
  return `<article class="eon-record-card eon-media-lifecycle-entry"><div><p class="eon-record-type">${escapeHtml(entry.retention.replaceAll('-', ' '))}</p><h3>${escapeHtml(entry.title)}</h3><p>${escapeHtml(entry.roleLabel)}${entry.format ? ` · ${escapeHtml(entry.format)}` : ''}</p><p class="eon-record-meta">${entry.keep ? 'Final-output intent · user save required' : 'Temporary work · do not retain as a hidden app cache'}</p>${entry.note ? `<p class="eon-record-meta">${escapeHtml(entry.note)}</p>` : ''}</div><div class="eon-record-actions"><span class="eon-record-status ${urgency}">${entry.keep ? 'Save intentionally' : 'Temporary'}</span><button type="button" class="eon-record-button" data-creator-media-remove="${escapeHtml(entry.id)}">Remove local entry</button></div></article>`;
}

function downloadJson(payload) {
  const blob = new Blob([`${JSON.stringify(payload, null, 2)}\n`], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `eonapp-creator-media-lifecycle-${new Date().toISOString().slice(0, 10)}.json`;
  anchor.hidden = true;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function renderCreatorMediaLifecycleWorkspace() {
  return `<section class="eon-hub-card eon-hub-card-full eon-media-lifecycle" aria-labelledby="eon-media-lifecycle-title"><div class="eon-city-work-mission-head"><div><p class="eon-hub-kicker">Lean media lifecycle · W403</p><h2 id="eon-media-lifecycle-title">Keep the final, not hidden piles of originals</h2><p>Plan what is temporary and what deserves an explicit final save. This is a metadata-only desk: it does not store, download, upload, delete, or back up an actual image, video, audio file, proxy, or render cache.</p></div><span class="eon-record-status">No hidden cache</span></div><div class="eon-record-list"><article class="eon-record-card"><div><p class="eon-record-type">Default lifecycle</p><h3>Source → preview/cache → reviewed final → explicit save</h3><p>Inputs, proxies, and render caches should be disposable after a task. A final output should go to a user-selected save/export location, not into browser localStorage.</p></div></article></div><form class="eon-record-form" data-creator-media-form><label>Media work name<input name="title" maxlength="180" required placeholder="Vertical launch video — final cut" /></label><label>Lifecycle role<select name="role">${CREATOR_MEDIA_ROLES.map((role) => `<option value="${escapeHtml(role.id)}">${escapeHtml(role.label)} · ${escapeHtml(role.retention.replaceAll('-', ' '))}</option>`).join('')}</select></label><label>Format or project note<input name="format" maxlength="80" placeholder="1080×1920 MP4, still image, voiceover draft" /></label><label>Review note<textarea name="note" maxlength="600" placeholder="What should be cleared after review, or where should the final be saved? Do not paste a secret."></textarea></label><p class="eon-record-form-note">Adding a “Final output” entry does not save a file. It records that the final must be saved explicitly when a real renderer/export path exists. This page does not claim external deletion.</p><p class="eon-record-form-error" data-creator-media-status></p><div class="eon-record-form-actions"><button class="eon-hub-primary" type="submit">Add local lifecycle entry</button><button type="button" class="eon-record-button" data-creator-media-export ${session.entries.length ? '' : 'disabled'}>Export lifecycle plan</button><button type="button" class="eon-record-button is-danger" data-creator-media-clear ${session.entries.length ? '' : 'disabled'}>Clear page entries</button></div></form><div class="eon-record-list" data-creator-media-list>${session.entries.length ? session.entries.map(renderEntry).join('') : '<p class="eon-hub-empty">No media lifecycle entry in this page session yet.</p>'}</div></section>`;
}

function refresh(root, status = '') {
  const host = root.querySelector('[data-creator-media-list]');
  if (host) host.innerHTML = session.entries.length ? session.entries.map(renderEntry).join('') : '<p class="eon-hub-empty">No media lifecycle entry in this page session yet.</p>';
  root.querySelectorAll('[data-creator-media-export],[data-creator-media-clear]').forEach((button) => { button.disabled = !session.entries.length; });
  const output = root.querySelector('[data-creator-media-status]');
  if (output) output.textContent = status;
}

export function bindCreatorMediaLifecycleWorkspace(root) {
  const form = root?.querySelector?.('[data-creator-media-form]');
  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    try {
      const entry = createCreatorMediaLifecycleEntry({ title: form.elements.title.value, role: form.elements.role.value, format: form.elements.format.value, note: form.elements.note.value });
      session.entries.unshift(entry);
      form.reset();
      refresh(root, entry.keep ? 'Final-output intent recorded. A real file is saved only when you explicitly choose an export location later.' : 'Temporary media lifecycle entry added. No file body was stored.');
    } catch (error) {
      refresh(root, String(error?.message || error || 'Could not create the local lifecycle entry.'));
    }
  });
  root?.querySelector?.('[data-creator-media-export]')?.addEventListener('click', () => {
    if (!session.entries.length) return;
    downloadJson(buildCreatorMediaLifecycleExport(session.entries));
    refresh(root, 'Lifecycle plan exported. It includes metadata only; no media file, original, cache, or credential is included.');
  });
  root?.querySelector?.('[data-creator-media-clear]')?.addEventListener('click', () => {
    session.entries = [];
    refresh(root, 'Page-session lifecycle entries cleared. No external file was deleted.');
  });
  root?.querySelector?.('[data-creator-media-list]')?.addEventListener('click', (event) => {
    const button = event.target?.closest?.('[data-creator-media-remove]');
    if (!button) return;
    session.entries = session.entries.filter((item) => item.id !== button.dataset.creatorMediaRemove);
    refresh(root, 'Local lifecycle entry removed.');
  });
}

export function getCreatorMediaLifecycleSessionTruth() {
  return Object.freeze({ currentPageMemory: true, localStorage: false, indexedDb: false, mediaBodyStored: false, exportRequiresUserAction: true, externalDeletionProof: false });
}
