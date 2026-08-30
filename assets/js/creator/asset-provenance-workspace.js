/** W401 — Workspace-only in-memory asset provenance desk. */
import { buildCreatorAssetReceiptExport, createCreatorAssetReceipt, CREATOR_ASSET_SOURCE_TYPES } from './asset-provenance.js';

const session = { receipts: [] };

function escapeHtml(value = '') {
  return String(value || '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' }[char]));
}

function renderReceipt(receipt) {
  return `<article class="eon-record-card eon-asset-provenance-receipt"><div><p class="eon-record-type">${escapeHtml(receipt.rightsStatus.replaceAll('-', ' '))}</p><h3>${escapeHtml(receipt.title)}</h3><p>${escapeHtml(receipt.sourceLabel)}</p><p class="eon-record-meta">${receipt.reference ? `Reference noted · ${escapeHtml(receipt.reference)}` : 'No reference noted · review before use'}</p>${receipt.attribution ? `<p class="eon-record-meta">Attribution · ${escapeHtml(receipt.attribution)}</p>` : ''}<p class="eon-record-meta">${escapeHtml(receipt.reviewNote)}</p></div><div class="eon-record-actions"><button type="button" class="eon-record-button" data-creator-asset-remove="${escapeHtml(receipt.id)}">Remove local receipt</button></div></article>`;
}

function downloadJson(payload) {
  const blob = new Blob([`${JSON.stringify(payload, null, 2)}\n`], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `eonapp-creator-asset-provenance-${new Date().toISOString().slice(0, 10)}.json`;
  anchor.hidden = true;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function renderCreatorAssetProvenanceWorkspace() {
  return `<section class="eon-hub-card eon-hub-card-full eon-asset-provenance" aria-labelledby="eon-asset-provenance-title"><div class="eon-city-work-mission-head"><div><p class="eon-hub-kicker">Asset rights desk · W401</p><h2 id="eon-asset-provenance-title">Keep a truthful source receipt before you publish</h2><p>Record the origin and rights context of an asset you plan to use. This does not upload a file, verify a licence, make a fair-use claim, search the web, or approve publishing. Receipts stay only in this page session unless you explicitly export them.</p></div><span class="eon-record-status">Local receipt</span></div><form class="eon-record-form" data-creator-asset-form><label>Asset name<input name="title" maxlength="180" required placeholder="Opening shot, brand image, voiceover cue" /></label><label>Source context<select name="sourceType">${CREATOR_ASSET_SOURCE_TYPES.map((source) => `<option value="${escapeHtml(source.id)}">${escapeHtml(source.label)}</option>`).join('')}</select></label><label>Reference or licence note<textarea name="reference" maxlength="500" placeholder="Where you obtained it or where the permission/licence record is kept. Do not paste a secret."></textarea></label><label>Required attribution<input name="attribution" maxlength="280" placeholder="Creator name, licence attribution, or none stated" /></label><label>Private review note<textarea name="note" maxlength="900" placeholder="What still needs checking before use?"></textarea></label><p class="eon-record-form-note">Use this for creator-reported context only. An empty reference or unknown origin remains “needs review.” Do not paste keys, passwords, seed phrases, or private chats.</p><p class="eon-record-form-error" data-creator-asset-status></p><div class="eon-record-form-actions"><button class="eon-hub-primary" type="submit">Add local receipt</button><button type="button" class="eon-record-button" data-creator-asset-export ${session.receipts.length ? '' : 'disabled'}>Export receipts</button><button type="button" class="eon-record-button is-danger" data-creator-asset-clear ${session.receipts.length ? '' : 'disabled'}>Clear page receipts</button></div></form><div class="eon-record-list" data-creator-asset-list>${session.receipts.length ? session.receipts.map(renderReceipt).join('') : '<p class="eon-hub-empty">No provenance receipt in this page session yet.</p>'}</div></section>`;
}

function refresh(root, status = '') {
  const host = root.querySelector('[data-creator-asset-list]');
  if (host) host.innerHTML = session.receipts.length ? session.receipts.map(renderReceipt).join('') : '<p class="eon-hub-empty">No provenance receipt in this page session yet.</p>';
  root.querySelectorAll('[data-creator-asset-export],[data-creator-asset-clear]').forEach((button) => { button.disabled = !session.receipts.length; });
  const output = root.querySelector('[data-creator-asset-status]');
  if (output) output.textContent = status;
}

export function bindCreatorAssetProvenanceWorkspace(root) {
  const form = root?.querySelector?.('[data-creator-asset-form]');
  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    try {
      const receipt = createCreatorAssetReceipt({
        title: form.elements.title.value,
        sourceType: form.elements.sourceType.value,
        reference: form.elements.reference.value,
        attribution: form.elements.attribution.value,
        note: form.elements.note.value
      });
      session.receipts.unshift(receipt);
      form.reset();
      refresh(root, 'Local source receipt added. It is not rights verification or publishing approval.');
    } catch (error) {
      refresh(root, String(error?.message || error || 'Could not create the local source receipt.'));
    }
  });
  root?.querySelector?.('[data-creator-asset-export]')?.addEventListener('click', () => {
    if (!session.receipts.length) return;
    downloadJson(buildCreatorAssetReceiptExport(session.receipts));
    refresh(root, 'Local receipts exported. The export contains no media file, secret, or remote verification.');
  });
  root?.querySelector?.('[data-creator-asset-clear]')?.addEventListener('click', () => {
    session.receipts = [];
    refresh(root, 'Page-session receipts cleared. No media file or external record was affected.');
  });
  root?.querySelector?.('[data-creator-asset-list]')?.addEventListener('click', (event) => {
    const button = event.target?.closest?.('[data-creator-asset-remove]');
    if (!button) return;
    session.receipts = session.receipts.filter((item) => item.id !== button.dataset.creatorAssetRemove);
    refresh(root, 'Local receipt removed.');
  });
}

export function getCreatorAssetProvenanceSessionTruth() {
  return Object.freeze({ currentPageMemory: true, localStorage: false, upload: false, remoteLookup: false, rightsVerification: false, publicationApproval: false, exportRequiresUserAction: true });
}
