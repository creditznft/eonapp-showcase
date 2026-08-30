/** W627D/W627E — Creator Library page projection and explicit continuation actions. */

import { deleteCreatorAsset, listCreatorAssets } from './creator-library-store.js';
import { buildCreatorLibraryExport } from './creator-data-survival.js';
import { prepareCreatorContinuation } from './creator-project-integration.js';
import { consumeEonHandoffFromLocation, removeEonHandoffQuery } from '../contracts/navigation/eon-handoff-authority.js';

function escapeHtml(value = '') { return String(value || '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' })[char]); }
let incomingHandoff = null;

function formatDate(value = '') { const date = new Date(value); return Number.isNaN(date.getTime()) ? 'Saved locally' : new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(date); }

function downloadJson(payload, filename) {
  const blob = new Blob([`${JSON.stringify(payload, null, 2)}\n`], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url; anchor.download = filename; anchor.hidden = true;
  document.body.appendChild(anchor); anchor.click(); anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function renderCreatorLibraryPage(root = document.getElementById('eon-creator-library-root')) {
  if (!root) return;
  const assets = listCreatorAssets();
  const incoming = incomingHandoff?.ok ? `<section class="eon-creator-library-handoff" data-eon-creator-library-handoff="${escapeHtml(incomingHandoff.handoff?.kind || '')}"><strong>${escapeHtml(incomingHandoff.handoff?.reference?.label || 'Incoming Creator reference')}</strong><p>Verified reference accepted once. Nothing was published, copied to a remote service, or attached automatically.</p></section>` : '';
  root.innerHTML = `${incoming}<section id="creator-library" class="eon-creator-library-panel" aria-labelledby="eon-creator-library-title"><header><div><p class="eon-hub-kicker">Verified creator outputs</p><h2 id="eon-creator-library-title">Creator Library</h2><p>Only outputs with a matching save/reopen digest may enter this list. Media blobs stay in local IndexedDB when explicitly saved; the generic encrypted Capsule carries metadata only.</p></div><button type="button" class="eon-record-button" data-eon-creator-export ${assets.length ? '' : 'disabled'}>Export metadata</button></header>${assets.length ? `<div class="eon-creator-library-grid">${assets.map((asset) => `<article data-creator-asset="${escapeHtml(asset.assetId)}"><div><span>${escapeHtml(asset.mediaKind)} · ${escapeHtml(asset.versionId)}</span><h3>${escapeHtml(asset.title)}</h3><p>${escapeHtml(asset.width)}×${escapeHtml(asset.height)}${asset.durationSeconds ? ` · ${escapeHtml(asset.durationSeconds)}s` : ''} · ${escapeHtml(asset.rail.replaceAll('-', ' '))}</p><small>${escapeHtml(formatDate(asset.updatedAt))} · digest ${escapeHtml(asset.sha256.slice(0, 12))}… · media ${asset.mediaStoredLocally ? 'stored locally' : 'metadata only'}</small></div><div class="eon-creator-library-actions"><button type="button" data-eon-creator-continue="create" data-asset-id="${escapeHtml(asset.assetId)}">Continue editing</button><button type="button" data-eon-creator-continue="forge" data-asset-id="${escapeHtml(asset.assetId)}">Use in Forge</button><button type="button" data-eon-creator-continue="city" data-asset-id="${escapeHtml(asset.assetId)}">Use in City</button><button type="button" data-eon-creator-asset-export="${escapeHtml(asset.assetId)}">Export reference</button><button type="button" data-eon-creator-delete="${escapeHtml(asset.assetId)}">Delete</button></div></article>`).join('')}</div>` : '<p class="eon-hub-empty">No verified creator outputs have been saved yet. Real image and video proof remains required.</p>'}<p data-eon-creator-library-status aria-live="polite"></p></section>`;
  const status = root.querySelector('[data-eon-creator-library-status]');
  root.querySelector('[data-eon-creator-export]')?.addEventListener('click', () => { downloadJson(buildCreatorLibraryExport(), 'EONAPP_CREATOR_LIBRARY_METADATA.json'); if (status) status.textContent = 'Creator Library metadata exported. Raw media and credentials were excluded.'; });
  root.addEventListener('click', async (event) => {
    const remove = event.target.closest?.('[data-eon-creator-delete]');
    const continuation = event.target.closest?.('[data-eon-creator-continue]');
    const exportButton = event.target.closest?.('[data-eon-creator-asset-export]');
    if (remove) {
      const result = await deleteCreatorAsset(remove.dataset.eonCreatorDelete, { explicitUserAction: true, confirmed: true });
      if (status) status.textContent = result.ok ? 'Creator asset and its local media record were deleted.' : result.reason.replaceAll('-', ' ');
      if (result.ok) renderCreatorLibraryPage(root);
    }
    if (continuation) {
      const asset = listCreatorAssets().find((row) => row.assetId === continuation.dataset.assetId);
      const result = await prepareCreatorContinuation(asset, continuation.dataset.eonCreatorContinue, { explicitUserAction: true, sessionStorage });
      if (result.ok) window.location.assign(result.href);
      else if (status) status.textContent = result.reason.replaceAll('-', ' ');
    }
    if (exportButton) {
      const asset = listCreatorAssets().find((row) => row.assetId === exportButton.dataset.eonCreatorAssetExport);
      const result = await prepareCreatorContinuation(asset, 'export', { explicitUserAction: true });
      if (result.ok) downloadJson(result.reference, result.filename);
    }
  }, { once: true });
}

async function bootCreatorLibrary() {
  const incoming = await consumeEonHandoffFromLocation({ receiverId: 'library' });
  if (incoming.ok) { incomingHandoff = incoming; removeEonHandoffQuery(); }
  else if (!['handoff-query-missing', 'handoff-not-found'].includes(incoming.reason)) removeEonHandoffQuery();
  renderCreatorLibraryPage();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => { void bootCreatorLibrary(); }, { once: true });
else void bootCreatorLibrary();
