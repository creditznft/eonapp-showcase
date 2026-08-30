/** W624J — City Sharing Center UI binding. */
import { EON_SHARING_CENTER_EXCLUSIONS, EON_SHARING_CENTER_FAMILIES, createEonSharingCenterController } from '../share/eon-sharing-center.js';
import { recordEonShareW753ReviewedHandoffReceipt } from '../contracts/share/eon-share-w753-reviewed-handoff-receipt.js';
import { projectEonCityDistribution } from '../contracts/city/eon-city-access-distribution-projection.js';

export const EON_CITY_SHARING_CENTER_SCHEMA = 'eon.city.sharing-center.w719.13.v2';

const ACTIVE_BINDINGS = new WeakMap();

const escapeHtml = (value) => String(value ?? '').replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));

function downloadText(payload) {
  const blob = new Blob([payload.combinedText], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = payload.filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

async function executePlatformAction(action, payload) {
  if (action === 'native-share') {
    if (typeof navigator?.share !== 'function') return { ok: false, reason: 'native-share-unavailable' };
    try { await navigator.share({ title: payload.title, text: payload.text, url: payload.url || undefined }); return { ok: true }; }
    catch (error) { return { ok: false, reason: error?.name === 'AbortError' ? 'native-share-cancelled' : 'native-share-failed' }; }
  }
  if (action === 'copy') {
    if (!navigator?.clipboard?.writeText) return { ok: false, reason: 'clipboard-unavailable' };
    try { await navigator.clipboard.writeText(payload.combinedText); return { ok: true }; }
    catch { return { ok: false, reason: 'clipboard-failed' }; }
  }
  if (action === 'download') {
    try { downloadText(payload); return { ok: true }; }
    catch { return { ok: false, reason: 'download-failed' }; }
  }
  return { ok: false, reason: 'unsupported-action' };
}

export function bindEonCitySharingCenter(root, { onStatus = () => {}, now = () => Date.now() } = {}) {
  if (!root?.ownerDocument) return () => {};
  const existing = ACTIVE_BINDINGS.get(root);
  if (existing) {
    existing.references += 1;
    existing.onStatus = onStatus;
    return () => {
      existing.references -= 1;
      if (existing.references <= 0) existing.dispose();
    };
  }

  const documentRef = root.ownerDocument;
  const environment = documentRef.defaultView || globalThis;
  const controller = createEonSharingCenterController({ now });
  const panel = documentRef.createElement('section');
  panel.className = 'eon-city-sharing-center';
  panel.dataset.eonCitySharingCenter = EON_CITY_SHARING_CENTER_SCHEMA;
  panel.hidden = true;
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'true');
  panel.setAttribute('aria-labelledby', 'eon-city-sharing-title');
  panel.innerHTML = `<div class="eon-city-sharing-card"><header><div><p class="eon-play-kicker">W719.13 · review-first public handoff</p><h2 id="eon-city-sharing-title">Sharing Center</h2><p>Prepare a finite public manifest, inspect every included and excluded field, then choose one separate platform action.</p></div><button type="button" data-eon-sharing-close aria-label="Close Sharing Center">Close</button></header><form data-eon-sharing-form><label>Share family<select name="family">${EON_SHARING_CENTER_FAMILIES.map((family) => `<option value="${escapeHtml(family.id)}">${escapeHtml(family.label)}</option>`).join('')}</select></label><label>Public title<input name="title" maxlength="120" value="EON City milestone" required /></label><label>Public summary<textarea name="summary" maxlength="720" required>A public-safe EONAPP milestone prepared for review.</textarea></label><label>Public preview URL (optional)<input name="publicUrl" type="url" maxlength="2048" placeholder="https://example.com/public-preview" /></label><button type="submit">Prepare manifest</button></form><div class="eon-city-sharing-review" data-eon-sharing-review aria-live="polite"><p>Choose a family and prepare a manifest. Nothing is copied, posted, invited or shared yet.</p></div><footer><p>Ordinary sharing is separate from referrals and EONKEY rewards. No click, impression or social-post tracking is created.</p></footer></div>`;
  root.append(panel);
  const form = panel.querySelector('[data-eon-sharing-form]');
  const review = panel.querySelector('[data-eon-sharing-review]');
  const close = panel.querySelector('[data-eon-sharing-close]');
  let activeManifestId = '';
  let lastOpener = null;

  const binding = {
    references: 1,
    onStatus,
    dispose: () => {}
  };
  ACTIVE_BINDINGS.set(root, binding);
  const publishStatus = (message) => binding.onStatus?.(message);

  const renderManifest = (manifest) => {
    activeManifestId = manifest.manifestId;
    const included = manifest.included.map((entry) => `<li><strong>${escapeHtml(entry.field)}</strong>: ${escapeHtml(entry.value)}</li>`).join('');
    const excluded = EON_SHARING_CENTER_EXCLUSIONS.map((entry) => `<li>${escapeHtml(entry)}</li>`).join('');
    const finalActions = manifest.state === 'reviewed' && manifest.authorityAvailable
      ? `<div class="eon-city-sharing-actions"><button type="button" data-eon-sharing-final="native-share">Native share…</button><button type="button" data-eon-sharing-final="copy">Copy reviewed payload</button><button type="button" data-eon-sharing-final="download">Download reviewed payload</button></div>`
      : manifest.authorityAvailable
        ? `<button type="button" data-eon-sharing-review-manifest>Review this exact manifest</button>`
        : `<p class="eon-city-sharing-unavailable"><strong>Unavailable:</strong> ${escapeHtml(manifest.authorityReason)}</p>`;
    review.innerHTML = `<article data-state="${escapeHtml(manifest.state)}"><p class="eon-play-kicker">${escapeHtml(manifest.familyLabel)} · ${escapeHtml(manifest.state)}</p><h3>${escapeHtml(manifest.title)}</h3><p>${escapeHtml(manifest.summary)}</p><dl><div><dt>Authority</dt><dd>${escapeHtml(manifest.authority)}</dd></div><div><dt>Destination</dt><dd>${escapeHtml(manifest.destination)}</dd></div><div><dt>Tracking</dt><dd>None</dd></div><div><dt>Referral/reward mutation</dt><dd>None</dd></div></dl><div class="eon-city-sharing-columns"><section><h4>Included</h4><ul>${included}</ul></section><section><h4>Never included</h4><ul>${excluded}</ul></section></div>${finalActions}</article>`;
  };

  const show = (opener = null) => {
    lastOpener = opener || lastOpener;
    root.querySelectorAll('[role="dialog"]:not([hidden]), [aria-modal="true"]:not([hidden])').forEach((dialog) => {
      if (dialog !== panel) dialog.hidden = true;
    });
    panel.hidden = false;
    form.querySelector('select, input, textarea, button')?.focus?.({ preventScroll: true });
    publishStatus('Sharing Center opened. Nothing has been shared. Prepare and review a public manifest first.');
  };
  const hide = () => {
    panel.hidden = true;
    lastOpener?.focus?.({ preventScroll: true });
  };
  const onRootClick = (event) => {
    const button = event.target?.closest?.('[data-eon-play-share-city]');
    if (!button || !root.contains(button)) return;
    event.preventDefault();
    show(button);
  };

  root.addEventListener('click', onRootClick);
  close.addEventListener('click', hide);
  panel.addEventListener('click', async (event) => {
    if (event.target === panel) { hide(); return; }
    if (event.target.closest('[data-eon-sharing-review-manifest]')) {
      const result = controller.review(activeManifestId, { explicitUserAction: true });
      if (result.ok) { renderManifest(result.manifest); publishStatus('Manifest reviewed. Choose one final platform action; nothing has been shared yet.'); }
      return;
    }
    const finalButton = event.target.closest('[data-eon-sharing-final]');
    if (!finalButton) return;
    const action = finalButton.dataset.eonSharingFinal;
    finalButton.disabled = true;
    const finalized = await controller.finalize(activeManifestId, action, { explicitUserAction: true });
    if (!finalized.ok) {
      finalButton.disabled = false;
      publishStatus(`Sharing Center could not prepare that action: ${finalized.reason}. Nothing was shared.`);
      return;
    }
    const executed = await executePlatformAction(action, finalized.payload);
    if (executed.ok) {
      const reviewedReceipt = recordEonShareW753ReviewedHandoffReceipt({
        kind: 'reviewed-signed-handoff', source: 'share-center-local', explicitUserAction: true, signedLinkReviewed: true
      }, { environment, storage: environment.localStorage, now: now() });
      const distribution = projectEonCityDistribution({ shareReceipt: reviewedReceipt.receipt, now: now() });
      panel.dataset.eonCityDistribution = distribution.schema;
      panel.dataset.eonCityShareReward = String(distribution.referralRewardIssued);
    }
    finalButton.disabled = false;
    publishStatus(executed.ok ? 'The reviewed platform action was opened. EONAPP does not track or confirm publication, issue an EONKEY or award a referral/XP reward.' : `The reviewed platform action did not complete: ${executed.reason}. No tracking or reward was created.`);
  });
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new environment.FormData(form);
    const result = controller.prepare({ family: data.get('family'), title: data.get('title'), summary: data.get('summary'), publicUrl: data.get('publicUrl'), destination: data.get('family') === 'signed-invite' ? '/eoncity' : undefined }, { explicitUserAction: true });
    if (!result.ok) { publishStatus(`Sharing manifest rejected: ${result.reason}.`); return; }
    renderManifest(result.manifest);
    publishStatus(result.manifest.authorityAvailable ? 'Public manifest prepared. Review every included and excluded field before sharing.' : `Manifest prepared with an honest unavailable boundary: ${result.manifest.authorityReason}.`);
  });
  const onKeydown = (event) => { if (event.key === 'Escape' && panel.hidden === false) { event.preventDefault(); hide(); } };
  panel.addEventListener('keydown', onKeydown);

  binding.dispose = () => {
    if (ACTIVE_BINDINGS.get(root) !== binding) return;
    ACTIVE_BINDINGS.delete(root);
    root.removeEventListener('click', onRootClick);
    panel.removeEventListener('keydown', onKeydown);
    controller.dispose();
    panel.remove();
  };
  return () => {
    binding.references -= 1;
    if (binding.references <= 0) binding.dispose();
  };
}
