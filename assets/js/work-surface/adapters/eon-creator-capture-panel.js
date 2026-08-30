import {
  createEonCreatorCaptureController,
  getEonCreatorCaptureCapability
} from '../../contracts/creator/eon-creator-capture.js';
import { saveCreatorAsset } from '../../create/creator-library-store.js';
import { createShareCenterDraft } from '../../utils/eon-share-sheet.js';
import { shareEonLocalMedia } from '../../share/eon-viral-share-kit.js';
import { recordEonShareW753ReviewedHandoffReceipt } from '../../share/eon-share-w753-reviewed-handoff-receipt.js';

function downloadFile(environment, file) {
  if (!file || typeof environment?.URL?.createObjectURL !== 'function') return false;
  const url = environment.URL.createObjectURL(file);
  const anchor = environment.document.createElement('a');
  anchor.href = url;
  anchor.download = file.name || 'eonapp-capture.webm';
  anchor.rel = 'noopener';
  anchor.click();
  environment.setTimeout?.(() => environment.URL.revokeObjectURL(url), 1200);
  return true;
}


function toHex(bytes) {
  return [...new Uint8Array(bytes)].map((value) => value.toString(16).padStart(2, '0')).join('');
}

export async function saveEonCreatorCaptureToLibrary(file, receipt = {}, options = {}) {
  const environment = options.environment || globalThis;
  const saveAsset = options.saveAsset || saveCreatorAsset;
  if (!(file instanceof Blob)) return Object.freeze({ ok: false, reason: 'capture-file-required' });
  if (typeof environment?.crypto?.subtle?.digest !== 'function') return Object.freeze({ ok: false, reason: 'sha256-unavailable' });
  const sha256 = toHex(await environment.crypto.subtle.digest('SHA-256', await file.arrayBuffer()));
  const nowValue = Number(options.now || Date.now());
  const durationMs = Math.max(0, Number(receipt.durationMs || 0));
  const result = await saveAsset({
    mediaKind: 'video',
    title: String(file.name || 'EONAPP Creator Capture').replace(/\.webm$/i, ''),
    providerId: 'browser-capture',
    runtimeId: 'media-recorder',
    rail: 'local-runtime',
    sourceJobId: '',
    sha256,
    digestMatched: true,
    jobState: 'saved',
    contentType: file.type || 'video/webm',
    durationSeconds: durationMs / 1000,
    bytes: file.size,
    mediaBlob: file
  }, {
    explicitUserAction: true,
    storage: options.storage || environment?.localStorage,
    indexedDb: options.indexedDb || environment?.indexedDB,
    now: () => nowValue
  });
  return Object.freeze({ ...result, sha256, localOnly: true, uploaded: false, posted: false });
}

async function copyText(environment, value = '') {
  try {
    if (typeof environment?.navigator?.clipboard?.writeText !== 'function') return false;
    await environment.navigator.clipboard.writeText(String(value || ''));
    return true;
  } catch {
    return false;
  }
}

export function mountEonWorkSurface({ root, environment, invocation, open }) {
  const capability = getEonCreatorCaptureCapability(environment);
  const cityContext = invocation?.context?.type === 'city' || invocation?.source === 'eoncity';
  const returnHref = cityContext ? '/eoncity' : '/create';
  const returnLabel = cityContext ? 'Return to City' : 'Return to Create';
  root.innerHTML = `<section class="eon-work-panel"><header class="eon-work-panel-intro"><div><p class="eon-work-panel-kicker">Creator Capture · local recording</p><h2>Record, review and keep your work</h2><p>Select the tab or window you choose, record locally, then download it, save it to Creator Library or prepare a reviewed share handoff. Nothing uploads or posts automatically.</p></div><div class="eon-work-panel-actions"><button type="button" data-capture-open-share>Share Command Center</button><a href="${returnHref}">${returnLabel}</a></div></header><div class="eon-capture-layout"><section class="eon-capture-preview" data-capture-preview-host><div class="eon-capture-placeholder"><strong>Local preview</strong><p>${capability.ready ? 'Start recording when you are ready.' : 'This browser does not expose the complete recording APIs required for safe local capture.'}</p></div><video data-capture-preview controls playsinline hidden></video></section><aside class="eon-work-card"><form class="eon-work-form" data-capture-form><label><span><input type="checkbox" name="microphone"> Include microphone (off by default)</span></label><label><span><input type="checkbox" name="facecam"> Include facecam</span></label><label>Facecam position<select name="facecamPosition"><option value="top-right">Top right</option><option value="top-left">Top left</option></select></label><label><span><input type="checkbox" name="creatorFrame"> Add Creator Capture frame</span></label><div class="eon-work-panel-actions"><button class="is-primary" type="button" data-capture-start${capability.ready ? '' : ' disabled'}>Start recording</button><button type="button" data-capture-pause disabled>Pause</button><button type="button" data-capture-stop disabled>Stop</button></div><div class="eon-work-panel-actions"><button type="button" data-capture-save disabled>Download WebM</button><button type="button" data-capture-save-library disabled>Save to Creator Library</button><button class="is-primary" type="button" data-capture-prepare-share disabled>Prepare video + invite</button></div><p class="eon-work-status" data-capture-status role="status" aria-live="polite">${capability.ready ? 'Ready. Every capture permission requires your direct browser approval.' : 'Recording is unavailable in this browser. No permission was requested.'}</p></form><section class="eon-capture-share-review" data-capture-share-review hidden aria-labelledby="eon-capture-share-review-title"><h3 id="eon-capture-share-review-title">Review before sharing</h3><label>Caption<textarea maxlength="1600" data-capture-share-caption></textarea></label><label>Signed EONAPP invite<input type="url" readonly data-capture-share-link></label><label><span><input type="checkbox" data-capture-review-confirm> I reviewed the video, caption and signed invite.</span></label><div class="eon-work-panel-actions"><button type="button" data-capture-copy-link>Copy invite</button><button type="button" data-capture-confirm-review disabled>Confirm reviewed handoff</button><button class="is-primary" type="button" data-capture-open-native>Open device share menu</button></div><p>Review the video, caption and invite first. The operating system—not EONAPP—controls the final destination and posting confirmation.</p></section><details class="eon-work-details"><summary>Privacy and referral details</summary><div>Screen/tab capture, microphone and camera each require direct browser permission. The WebM stays on this device. Native sharing opens the operating-system share menu; EONAPP cannot see where you post. The signed link may support server-verified referral milestones, but sharing alone creates no reward or subscription.</div></details></aside></div></section>`;

  const form = root.querySelector('[data-capture-form]');
  const preview = root.querySelector('[data-capture-preview]');
  const placeholder = root.querySelector('.eon-capture-placeholder');
  const start = root.querySelector('[data-capture-start]');
  const pause = root.querySelector('[data-capture-pause]');
  const stop = root.querySelector('[data-capture-stop]');
  const save = root.querySelector('[data-capture-save]');
  const saveLibrary = root.querySelector('[data-capture-save-library]');
  const prepareShare = root.querySelector('[data-capture-prepare-share]');
  const shareReview = root.querySelector('[data-capture-share-review]');
  const shareCaption = root.querySelector('[data-capture-share-caption]');
  const shareLink = root.querySelector('[data-capture-share-link]');
  const copyLink = root.querySelector('[data-capture-copy-link]');
  const reviewConfirm = root.querySelector('[data-capture-review-confirm]');
  const confirmReview = root.querySelector('[data-capture-confirm-review]');
  const openNative = root.querySelector('[data-capture-open-native]');
  const status = root.querySelector('[data-capture-status]');
  let currentFile = null;
  let preparedDraft = null;

  const setStatus = (message = '') => { if (status) status.textContent = String(message || ''); };
  const resetShareReview = () => {
    preparedDraft = null;
    if (shareReview) shareReview.hidden = true;
    if (shareCaption) shareCaption.value = '';
    if (shareLink) shareLink.value = '';
    if (reviewConfirm) { reviewConfirm.checked = false; reviewConfirm.disabled = false; }
    if (confirmReview) confirmReview.disabled = true;
  };

  let currentReceipt = null;
  const controller = createEonCreatorCaptureController({ environment, filenamePrefix: cityContext ? 'eoncity-gameplay' : 'eonapp-capture', frameLabel: cityContext ? 'EONCITY · PRODUCTIVE PLAY' : 'EONAPP · CREATOR CAPTURE', onVerifiedCapture(receipt) { currentReceipt = receipt; }, onState(state) {
    if (state.file && state.file !== currentFile) {
      currentFile = state.file;
      resetShareReview();
    } else if (!state.file && state.status !== 'disposed') {
      currentFile = null;
      resetShareReview();
    }
    const active = state.active === true;
    start.disabled = !capability.ready || active || state.status === 'encoding';
    pause.disabled = !active;
    pause.textContent = state.paused ? 'Resume' : 'Pause';
    stop.disabled = !active;
    save.disabled = !state.file;
    saveLibrary.disabled = !state.file;
    prepareShare.disabled = !state.file;
    if (state.previewUrl) {
      preview.src = state.previewUrl;
      preview.hidden = false;
      if (placeholder) placeholder.hidden = true;
    }
    if (state.status === 'requesting-display') setStatus('Choose the tab or window in the browser picker. No recording starts until you approve it.');
    if (state.status === 'recording') setStatus('Recording locally. Stop when the gameplay moment is complete.');
    if (state.status === 'paused') setStatus('Recording paused locally.');
    if (state.status === 'encoding') setStatus('Finishing the local WebM file…');
    if (state.status === 'ready') setStatus(`Recording ready (${Math.max(1, Math.round(Number(state.durationMs || 0) / 1000))}s). Review it, save it or prepare a signed invite.`);
    if (state.status === 'error') setStatus('Recording stopped safely. Check the browser permission or capture support and try again.');
  }});

  start?.addEventListener('click', () => {
    const data = new FormData(form);
    void controller.start({
      microphone: data.get('microphone') === 'on',
      facecam: data.get('facecam') === 'on',
      creatorFrame: data.get('creatorFrame') === 'on',
      facecamPosition: String(data.get('facecamPosition') || 'top-right')
    });
  });
  pause?.addEventListener('click', () => { const state = controller.getState(); if (state.paused) controller.resume(); else controller.pause(); });
  stop?.addEventListener('click', () => controller.stop());
  const recordSavedWebm = () => recordEonShareW753ReviewedHandoffReceipt({
    kind: 'creator-capture-saved',
    source: 'creator-capture-local',
    explicitUserAction: true,
    localWebmSaved: true
  }, { storage: environment?.localStorage, environment, now: Date.now() });
  save?.addEventListener('click', () => {
    if (!currentFile || !downloadFile(environment, currentFile)) return;
    const receipt = recordSavedWebm();
    setStatus(receipt.ok
      ? 'WebM saved locally. The duplicate-protected Share & Capture mission receipt is ready to claim explicitly; nothing was uploaded.'
      : 'WebM saved locally. The mission receipt could not be stored; nothing was uploaded.');
  });
  saveLibrary?.addEventListener('click', async () => {
    if (!currentFile) return;
    saveLibrary.disabled = true;
    setStatus('Hashing and saving the local WebM to Creator Library…');
    try {
      const result = await saveEonCreatorCaptureToLibrary(currentFile, currentReceipt || controller.getState(), { environment });
      setStatus(result.ok
        ? 'Saved to Creator Library with a verified SHA-256 digest. The media remains on this device and nothing was uploaded.'
        : `Creator Library save failed safely (${result.reason || 'unknown'}). The recording remains available to download.`);
    } catch (error) {
      environment.console?.warn?.('[EON_CREATOR_CAPTURE_LIBRARY_SAVE_FAILED]', error);
      setStatus('Creator Library save failed safely. The recording remains available to download and nothing was uploaded.');
    } finally {
      saveLibrary.disabled = !currentFile;
    }
  });
  prepareShare?.addEventListener('click', async () => {
    if (!currentFile) return;
    prepareShare.disabled = true;
    setStatus('Preparing a fresh signed EON City invite for your review…');
    try {
      const draft = await createShareCenterDraft({ type: cityContext ? 'city' : 'eonapp', source: 'creator-capture', persist: true });
      preparedDraft = draft;
      shareCaption.value = `${draft.message}\n\nRecorded locally with EONAPP Creator Capture. Review the video and invite before posting.`;
      shareLink.value = draft.url;
      shareReview.hidden = false;
      openNative.disabled = false;
      copyLink.disabled = false;
      if (reviewConfirm) reviewConfirm.disabled = false;
      if (confirmReview) confirmReview.disabled = true;
      setStatus('Share package prepared. Review the caption and signed invite before opening the device share menu.');
      shareReview.scrollIntoView?.({ behavior: 'smooth', block: 'nearest' });
    } catch (error) {
      environment.console?.warn?.('[EON_CREATOR_CAPTURE_SHARE_DRAFT_UNAVAILABLE]', error);
      setStatus('The signed invite could not be prepared. The local video remains available to save.');
    } finally {
      prepareShare.disabled = !currentFile;
    }
  });

  reviewConfirm?.addEventListener('change', () => {
    if (confirmReview) confirmReview.disabled = !preparedDraft?.url || reviewConfirm.checked !== true;
  });
  confirmReview?.addEventListener('click', () => {
    const result = recordEonShareW753ReviewedHandoffReceipt({
      kind: 'reviewed-signed-handoff',
      source: 'creator-capture-local',
      explicitUserAction: true,
      signedLinkReviewed: Boolean(preparedDraft?.url && reviewConfirm?.checked)
    }, { storage: environment?.localStorage, environment, now: Date.now() });
    if (result.ok) {
      setStatus(result.duplicate
        ? 'This reviewed handoff was already verified. The mission remains duplicate-protected.'
        : 'Reviewed handoff verified. Return to Missions & Vault to claim the Share & Capture mission explicitly.');
      if (reviewConfirm) reviewConfirm.disabled = true;
      if (confirmReview) confirmReview.disabled = true;
    } else setStatus('The reviewed handoff receipt could not be stored. No mission completion or XP was claimed.');
  });

  copyLink?.addEventListener('click', async () => {
    if (!preparedDraft?.url) return;
    const copied = await copyText(environment, preparedDraft.url);
    setStatus(copied ? 'Signed invite copied. Nothing was posted.' : 'Copy was unavailable. Select the visible invite link and copy it manually.');
    if (!copied) shareLink?.select?.();
  });
  openNative?.addEventListener('click', async () => {
    if (!currentFile || !preparedDraft?.url) return;
    openNative.disabled = true;
    const caption = String(shareCaption?.value || preparedDraft.message || '').trim();
    const reviewedText = `${caption}\n\n${preparedDraft.url}`.trim();
    setStatus('Opening the operating-system share menu with the reviewed local video and invite…');
    try {
      const result = await shareEonLocalMedia({ file: currentFile, title: cityContext ? 'EON City gameplay' : 'EONAPP Creator Capture', text: reviewedText }, { userGesture: true, navigator: environment.navigator });
      if (result.ok) {
        setStatus('System share menu opened. The final destination and post remain your decision.');
      } else {
        const copied = await copyText(environment, preparedDraft.url);
        const saved = downloadFile(environment, currentFile);
        if (saved) recordSavedWebm();
        setStatus(copied
          ? 'Native file sharing is unavailable. The video was saved and the signed invite was copied for manual posting.'
          : 'Native file sharing is unavailable. The video was saved; copy the visible signed invite manually.');
      }
    } catch (error) {
      environment.console?.warn?.('[EON_CREATOR_CAPTURE_NATIVE_SHARE_CANCELLED]', error);
      setStatus('Sharing was cancelled or unavailable. The video and signed invite remain local and unchanged.');
    } finally {
      openNative.disabled = !currentFile || !preparedDraft?.url;
    }
  });
  root.querySelector('[data-capture-open-share]')?.addEventListener('click', (event) => open({ id: 'share', source: invocation.source || 'creator-capture', explicitUserAction: true, context: { type: cityContext ? 'city' : 'eonapp' } }, event.currentTarget));
  return { dispose() { controller.dispose(); } };
}

export default mountEonWorkSurface;
