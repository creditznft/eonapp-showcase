import musicLabService, { PRESET_PATTERNS } from '../utils/music-lab.js';
import { buildEonMusicCapabilityPlan } from '../creator/music/eon-music-capability-router.js';
import { buildAutoDjSetPlan } from '../creator/music/eon-auto-dj.js';
import { eonAutoDjPreviewSession } from '../creator/music/eon-auto-dj-preview.js';
import { createEonRadioStation, deleteEonRadioStation, listEonRadioStations } from '../creator/music/eon-radio-store.js';
import { eonRadioSession } from '../creator/music/eon-radio-session.js';
import { eonRadioPlayer } from '../creator/music/eon-radio-player.js';
import {
  canRecordMusicOutcome,
  prepareMusicArtifactProof,
  verifyMusicArtifactReopen
} from '../creator/music/eon-music-artifact-proof.js';
import { buildEonRadioNextTrackPlan } from '../creator/music/eon-radio-next-track.js';
import {
  EON_ACESTEP_DEFAULT_ENDPOINT,
  discoverAceStepLocalMusic,
  generateAceStepLocalMusic
} from '../creator/music/eon-acestep-local-adapter.js';
import {
  clearLocalRuntimeSessionCredential,
  getLocalRuntimeSessionCredentialMetadata,
  saveLocalRuntimeSessionCredential
} from '../local-ai/eon-local-connection-authority.js';
import { recordEonCoreOutcome } from '../contracts/outcomes/eon-core-outcome-authority.js';
import { buildCreatorVariationPrompt } from '../creator/eon-creator-iteration-planner.js';
import { writeEonOutputShareHandoff } from '../share/eon-output-share-handoff.js';
import { shareEonLocalMedia } from '../share/eon-viral-share-kit.js';
import { openEonShareSheet } from '../utils/eon-share-sheet.js';
import { rememberEonAiStructuredSignal } from '../ai-kernel/eon-ai-structured-memory.js';
import { readEonRememberedRadioPreferences } from '../creator/music/eon-radio-preference-memory.js';
import {
  beginCreatorCompanionPairing,
  confirmCreatorCompanionPairing,
  deleteDirectProviderCredential,
  listDirectProviders,
  readDirectJobOutput,
  scanCreatorCompanion,
  setDirectProviderCredential,
  submitDirectJob
} from '../direct-byok/companion-client.js';
import { buildDirectJobRequest, toDirectJobPublicReceipt } from '../direct-byok/direct-job-contract.js';
import { recordDirectHistoryReceipt } from '../direct-byok/direct-history.js';

let lastMusicArtifact = null;
let lastGenerativeArtifact = null;
let lastHostedMusicArtifact = null;
const DEFAULT_MUSIC_STATUS = 'Ready. No audio starts until you press Play or explicitly generate/preview a track.';
let musicStatusMessage = DEFAULT_MUSIC_STATUS;
let lastRadioStation = null;
let lastRadioNextTrackPlan = null;
let radioNextTrackIteration = 0;
const radioPreferenceState = { genre: 'electronic', vocals: 'mixed', energy: 'balanced' };
let radioPreferencesHydrated = false;
const aceStepState = {
  endpoint: EON_ACESTEP_DEFAULT_ENDPOINT,
  models: [],
  selectedModel: '',
  busy: false,
  abortController: null,
  status: 'Not scanned. EONAPP never starts ACE-Step or downloads music models.',
  service: '',
  version: '',
  preparedPrompt: '',
  lastSubmittedPrompt: '',
  variationIndex: 0
};
const hostedMusicState = {
  detected: false,
  paired: false,
  busy: false,
  pairingChallengeId: '',
  models: [],
  selectedModel: 'elevenlabs-music-v2',
  credentialConfigured: false,
  preparedPrompt: '',
  lastSubmittedPrompt: '',
  variationIndex: 0,
  status: 'Not connected. Hosted Music is optional Direct BYOK through your paired local Creator Companion.'
};

function escapeHtml(value = '') { return String(value || '').replace(/[&<>"']/g, (char) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;' }[char])); }

function hydrateRadioPreferencesFromSafeMemory() {
  if (radioPreferencesHydrated) return;
  radioPreferencesHydrated = true;
  const remembered = readEonRememberedRadioPreferences();
  if (remembered.genre) radioPreferenceState.genre = remembered.genre;
  if (remembered.vocals) radioPreferenceState.vocals = remembered.vocals;
  if (remembered.energy) radioPreferenceState.energy = remembered.energy;
}

function renderSteps() {
  return musicLabService.tracks.map((track) => `<div class="eon-music-track"><strong>${escapeHtml(track.label)}</strong><div class="eon-music-steps">${track.pattern.map((on, step) => `<button type="button" data-music-step="${track.id}:${step}" aria-pressed="${on ? 'true' : 'false'}" title="${escapeHtml(track.label)} step ${step + 1}">${on ? '●' : '·'}</button>`).join('')}</div></div>`).join('');
}

function renderAceStepStudio() {
  const hasCredential = Boolean(getLocalRuntimeSessionCredentialMetadata('acestep'));
  const hasModels = aceStepState.models.length > 0;
  const artifact = lastGenerativeArtifact;
  return `<details data-music-acestep-panel><summary>Generative Music · local ACE-Step</summary>
    <p>Optional local text-to-music. Start ACE-Step yourself, then scan its loopback API. EONAPP does not start the runtime, initialize or download models, train adapters, send reference audio, or fall back to cloud.</p>
    <div class="eon-music-controls">
      <label>Local endpoint <input type="url" value="${escapeHtml(aceStepState.endpoint)}" data-music-acestep-endpoint spellcheck="false"></label>
      <button type="button" data-music-acestep-scan ${aceStepState.busy ? 'disabled' : ''}>Scan loaded models</button>
      ${hasCredential ? '<span>API key: session only</span><button type="button" data-music-acestep-key-clear>Clear API key</button>' : '<label>Optional API key <input type="password" autocomplete="off" data-music-acestep-key placeholder="kept in this browser session only"></label><button type="button" data-music-acestep-key-save>Use API key this session</button>'}
    </div>
    <p data-music-acestep-status aria-live="polite">${escapeHtml(aceStepState.status)}</p>
    ${hasModels ? `<div class="eon-music-idea">
      <label>Loaded model <select data-music-acestep-model>${aceStepState.models.map((row) => `<option value="${escapeHtml(row.id)}" ${row.id === aceStepState.selectedModel ? 'selected' : ''}>${escapeHtml(row.id)}${row.isDefault ? ' · default' : ''}</option>`).join('')}</select></label>
      <label>Duration <input type="number" min="10" max="180" step="5" value="30" data-music-acestep-duration> sec</label>
      <label>Format <select data-music-acestep-format><option value="wav">WAV</option><option value="mp3">MP3</option><option value="flac">FLAC</option><option value="opus">Opus</option><option value="aac">AAC</option></select></label>
    </div>
    <textarea data-music-acestep-prompt maxlength="1200" placeholder="Dreamy Goa sunset electronic track, warm analog synths, melodic, cinematic…">${escapeHtml(aceStepState.preparedPrompt || '')}</textarea>
    <textarea data-music-acestep-lyrics maxlength="6000" placeholder="Optional lyrics. Leave blank for instrumental / model-directed output."></textarea>
    <label><input type="checkbox" checked data-music-acestep-enhanced> Enhanced local LM assistance when the ACE-Step runtime supports it</label>
    <div class="eon-music-controls"><button type="button" data-music-acestep-generate ${aceStepState.busy ? 'disabled' : ''}>Generate local track</button>${aceStepState.busy ? '<button type="button" data-music-acestep-cancel>Stop waiting</button>' : ''}</div>` : '<p>Scan first. Only already-loaded ACE-Step models become selectable.</p>'}
    ${artifact?.objectUrl ? `<div class="eon-music-radio-session"><p><strong>Generated local track ready.</strong> Previewing or adding it to Radio does not prove this runtime is ready on every device. Keep this device/runtime as unverified until its real-output check is completed.</p><audio controls preload="metadata" src="${escapeHtml(artifact.objectUrl)}" data-music-acestep-player></audio><div class="eon-music-controls"><button type="button" data-music-acestep-save>${artifact.saved ? 'Save again' : 'Save locally'}</button>${artifact.saved && !artifact.digestMatched ? '<label>Verify saved copy <input type="file" accept="audio/*,.wav,.mp3,.m4a,.aac,.ogg,.opus,.flac,.webm" data-music-acestep-verify></label>' : ''}${artifact.digestMatched ? '<span>✓ saved copy verified</span>' : ''}<button type="button" data-music-acestep-variation>Prepare variation</button><button type="button" data-music-acestep-share>Share track…</button><button type="button" data-music-acestep-radio>Add to EON Radio</button><button type="button" data-music-acestep-remix>Share / Remix</button></div></div>` : ''}
  </details>`;
}

function renderHostedMusicStudio() {
  const modelReady = hostedMusicState.models.some((row) => row.id === hostedMusicState.selectedModel && row.providerId === 'elevenlabs' && row.mediaKind === 'music' && row.enabled === true);
  const artifact = lastHostedMusicArtifact;
  return `<details data-music-hosted-panel><summary>Generative Music · hosted BYOK</summary>
    <p>Optional hosted Music v2 through your own paired Creator Companion. Your provider key is written only to the operating-system credential vault after an explicit action. EONAPP has no Cloudflare generation proxy and does not store the generated audio centrally.</p>
    <div class="eon-music-controls"><button type="button" data-music-hosted-scan ${hostedMusicState.busy ? 'disabled' : ''}>Check Creator Companion</button>${hostedMusicState.detected && !hostedMusicState.paired ? '<button type="button" data-music-hosted-pair>Pair this browser</button>' : ''}</div>
    ${hostedMusicState.pairingChallengeId && !hostedMusicState.paired ? '<div class="eon-music-idea"><label>Pairing code <input inputmode="numeric" pattern="[0-9]{6}" maxlength="6" data-music-hosted-code autocomplete="one-time-code"></label><button type="button" data-music-hosted-confirm>Confirm pairing</button></div>' : ''}
    ${hostedMusicState.paired ? `<div class="eon-music-controls">${hostedMusicState.credentialConfigured ? '<span>ElevenLabs key: stored in OS vault</span><button type="button" data-music-hosted-key-clear>Remove provider key</button>' : '<label>ElevenLabs API key <input type="password" autocomplete="off" data-music-hosted-key placeholder="sent only to your paired 127.0.0.1 companion"></label><button type="button" data-music-hosted-key-save>Store in OS vault</button>'}</div>` : ''}
    <p data-music-hosted-status aria-live="polite">${escapeHtml(hostedMusicState.status)}</p>
    ${hostedMusicState.paired && hostedMusicState.credentialConfigured && modelReady ? `<div class="eon-music-idea"><textarea maxlength="4100" data-music-hosted-prompt placeholder="Dreamy Goa sunset electronic track, warm synths, cinematic rise…">${escapeHtml(hostedMusicState.preparedPrompt || '')}</textarea><label>Duration <input type="number" min="10" max="180" step="5" value="30" data-music-hosted-duration> sec</label><label><input type="checkbox" data-music-hosted-instrumental> Instrumental</label><label><input type="checkbox" data-music-hosted-budget> I reviewed my provider plan/credits and approve one Music v2 request. EONAPP cannot preflight the final provider charge.</label><button type="button" data-music-hosted-generate ${hostedMusicState.busy ? 'disabled' : ''}>Generate hosted track</button></div>` : '<p>Pair the companion and add your provider key to unlock the reviewed Music v2 action. No request starts automatically.</p>'}
    ${artifact?.objectUrl ? `<div class="eon-music-radio-session"><p><strong>Hosted BYOK track ready in this browser.</strong> The companion keeps the binary only briefly in memory; save it if you want to keep it. Keep this provider rail marked unverified until a real authenticated output check succeeds on this device.</p><audio controls preload="metadata" src="${escapeHtml(artifact.objectUrl)}" data-music-hosted-player></audio><div class="eon-music-controls"><button type="button" data-music-hosted-save>${artifact.saved ? 'Save again' : 'Save locally'}</button>${artifact.saved && !artifact.digestMatched ? '<label>Verify saved copy <input type="file" accept="audio/*,.wav,.mp3,.m4a,.aac,.ogg,.opus,.flac,.webm" data-music-hosted-verify></label>' : ''}${artifact.digestMatched ? '<span>✓ saved copy verified</span>' : ''}<button type="button" data-music-hosted-variation>Prepare variation</button><button type="button" data-music-hosted-share>Share track…</button><button type="button" data-music-hosted-radio>Add to EON Radio</button><button type="button" data-music-hosted-remix>Share / Remix</button></div></div>` : ''}
  </details>`;
}

export function renderEonMusicStudio() {
  hydrateRadioPreferencesFromSafeMemory();
  const capability = buildEonMusicCapabilityPlan({ aceStepDetected: aceStepState.models.length > 0 });
  const stations = listEonRadioStations({ limit: 4 });
  const activeRadioStation = lastRadioStation || stations[0] || null;
  const radioSession = eonRadioSession.snapshot();
  const radioPlayer = eonRadioPlayer.snapshot();
  const djPreview = eonAutoDjPreviewSession.snapshot();
  const currentRadioTrack = radioSession.items.find((item) => item.current) || radioSession.items[0] || null;
  return `<section class="eon-music-studio" data-eon-music-studio aria-labelledby="eon-music-studio-title">
    <div class="eon-music-head"><div><p class="eon-create-eyebrow">EON Music · browser + optional local/hosted AI</p><h3 id="eon-music-studio-title">Make a beat now. Generate a full track only after you explicitly connect a music engine.</h3><p>The sequencer is real local Web Audio. Pattern generation is deterministic unless the status explicitly says EONBOT model. Full text-to-music is a separate explicit local ACE-Step or hosted Direct BYOK action.</p></div><span>${escapeHtml(capability.device.label)}</span></div>
    <div class="eon-music-controls">
      <label>BPM <input type="number" min="40" max="300" value="${musicLabService.bpm}" data-music-bpm></label>
      <label>Preset <select data-music-preset><option value="">Choose…</option>${Object.entries(PRESET_PATTERNS).map(([id, preset]) => `<option value="${escapeHtml(id)}">${escapeHtml(preset.name)}</option>`).join('')}</select></label>
      <button type="button" data-music-play>Play</button><button type="button" data-music-stop>Stop</button><button type="button" data-music-export>Export WAV</button>${lastMusicArtifact ? `<button type="button" data-music-share-file>Share WAV…</button><button type="button" data-music-share-remix>Share / Remix</button>${lastMusicArtifact.saved && !lastMusicArtifact.digestMatched ? '<label>Verify saved WAV <input type="file" accept="audio/wav,.wav" data-music-verify-wav></label>' : ''}${lastMusicArtifact.digestMatched ? '<span>✓ saved copy verified</span>' : ''}` : ''}
    </div>
    <div class="eon-music-idea"><input type="text" data-music-idea placeholder="dark Goa sunset melodic techno, 122 BPM…"><button type="button" data-music-pattern>Smart pattern</button><button type="button" data-music-eonbot>Generate pattern with EONBOT</button></div>
    <p data-music-status aria-live="polite">${escapeHtml(musicStatusMessage)}</p>
    <div class="eon-music-sequencer">${renderSteps()}</div>
    ${renderAceStepStudio()}
    ${renderHostedMusicStudio()}
    <details><summary>Auto DJ</summary><p>Plan an energy flow from optional BPM/energy metadata, then preview a real local crossfade queue with audio you own or are allowed to use. Preview does not beat-match, time-stretch, separate stems, upload files or export a mixed master.</p><textarea data-music-dj placeholder="Track A|122|0.4\nTrack B|124|0.7"></textarea><button type="button" data-music-dj-plan>Plan DJ set</button><pre data-music-dj-output></pre><div class="eon-music-radio-session"><label>Add DJ audio <input type="file" accept="audio/*,.wav,.mp3,.m4a,.aac,.ogg,.opus,.flac,.webm" multiple data-music-dj-files></label>${lastMusicArtifact?.blob ? '<button type="button" data-music-dj-add-wav>Add exported WAV</button>' : ''}${lastGenerativeArtifact?.blob ? '<button type="button" data-music-dj-add-ai>Add generated local track</button>' : ''}${lastHostedMusicArtifact?.blob ? '<button type="button" data-music-dj-add-hosted>Add hosted BYOK track</button>' : ''}${djPreview.itemCount ? '<label>Crossfade seconds <input type="number" min="2" max="16" value="8" data-music-dj-crossfade></label><button type="button" data-music-dj-preview>Preview crossfade set</button><button type="button" data-music-dj-stop>Stop preview</button><button type="button" data-music-dj-clear>Clear DJ session</button>' : ''}<p data-music-dj-status>${djPreview.itemCount ? `${djPreview.itemCount} local DJ track${djPreview.itemCount === 1 ? '' : 's'} ready · ${djPreview.playing ? 'preview playing' : 'stopped'}` : 'No DJ audio loaded. Files stay in this browser session.'}</p></div></details>
    <details><summary>EON Radio</summary><p>Create a private station profile, then listen to your own authorized audio and EON-generated tracks in a session-only radio queue. No commercial streaming catalogue is connected and audio files are not uploaded or persisted by EON Radio. Safe Auto memory, when enabled, may learn only the finite controls below after you change them — never the free-text station prompt.</p>${activeRadioStation ? `<div class="eon-music-idea"><p><strong>Next original track · ${escapeHtml(activeRadioStation.name)}</strong></p><button type="button" data-music-radio-plan-next>Plan next original track</button>${lastRadioNextTrackPlan ? `<p data-music-radio-plan-status>Plan ${lastRadioNextTrackPlan.iteration + 1} · ${escapeHtml(lastRadioNextTrackPlan.arcLabel)}. Prompt prepared locally only; choose a generator below, then press Generate separately.</p><textarea readonly data-music-radio-next-prompt>${escapeHtml(lastRadioNextTrackPlan.prompt)}</textarea><div class="eon-music-controls"><button type="button" data-music-radio-use-local>Use in Local generator</button><button type="button" data-music-radio-use-hosted>Use in Hosted generator</button></div>` : `<p data-music-radio-plan-status>Planning is local and free. It does not call a provider or generate audio.</p>`}</div>` : '<p>Save a station first to plan the next original track.</p>'}<div class="eon-music-controls"><label>Genre <select data-music-radio-genre>${[['ambient','Ambient'],['electronic','Electronic'],['house','House'],['techno','Techno'],['hip-hop','Hip-hop'],['pop','Pop'],['rock','Rock'],['jazz','Jazz'],['classical','Classical'],['cinematic','Cinematic'],['world','World'],['experimental','Experimental']].map(([id,label]) => `<option value="${id}" ${radioPreferenceState.genre === id ? 'selected' : ''}>${label}</option>`).join('')}</select></label><label>Vocals <select data-music-radio-vocals>${[['instrumental','Instrumental'],['mixed','Mixed'],['vocal','Vocal-forward']].map(([id,label]) => `<option value="${id}" ${radioPreferenceState.vocals === id ? 'selected' : ''}>${label}</option>`).join('')}</select></label><label>Energy <select data-music-radio-energy>${[['calm','Calm'],['balanced','Balanced'],['high','High']].map(([id,label]) => `<option value="${id}" ${radioPreferenceState.energy === id ? 'selected' : ''}>${label}</option>`).join('')}</select></label></div><input data-music-radio-name placeholder="Night Drive"><input data-music-radio-prompt placeholder="dark melodic techno, occasional Hindi vocals"><button type="button" data-music-radio-save>Save station</button>${lastRadioStation ? '<button type="button" data-music-radio-share>Share station idea</button>' : ''}<div data-music-radio-list>${stations.map((station) => `<span>${escapeHtml(station.name)} <button type="button" data-music-radio-delete="${escapeHtml(station.id)}" aria-label="Delete ${escapeHtml(station.name)}">Delete</button></span>`).join('') || 'No stations yet.'}</div><div class="eon-music-radio-session"><label>Add your music <input type="file" accept="audio/*,.wav,.mp3,.m4a,.aac,.ogg,.opus,.flac,.webm" multiple data-music-radio-files></label>${lastMusicArtifact ? '<button type="button" data-music-radio-add-generated>Add exported WAV</button>' : ''}${lastGenerativeArtifact?.blob ? '<button type="button" data-music-radio-add-ai>Add generated local track</button>' : ''}${lastHostedMusicArtifact?.blob ? '<button type="button" data-music-radio-add-hosted>Add hosted BYOK track</button>' : ''}${radioSession.itemCount ? `${radioPlayer.playing ? '<button type="button" data-music-radio-stop-station>Stop station</button>' : '<button type="button" data-music-radio-play-station>Play station</button>'}<button type="button" data-music-radio-prev>Previous</button><button type="button" data-music-radio-next>Next</button><button type="button" data-music-radio-share-track>Share current track…</button><button type="button" data-music-radio-clear>Clear session</button>` : ''}<p data-music-radio-session-status>${radioSession.itemCount ? `${radioSession.itemCount} session track${radioSession.itemCount === 1 ? '' : 's'} · ${escapeHtml(currentRadioTrack?.name || '')} · ${radioPlayer.playing ? 'station playing' : 'station stopped'}` : 'No session tracks. Choose audio you own/have permission to use, export an EON WAV, or explicitly generate a local/hosted BYOK track.'}</p>${currentRadioTrack ? `<audio controls preload="metadata" data-music-radio-player src="${escapeHtml(currentRadioTrack.objectUrl)}"></audio><div class="eon-music-radio-queue">${radioSession.items.map((item, index) => `<button type="button" data-music-radio-track="${index}" aria-pressed="${item.current}">${escapeHtml(item.name)}</button>`).join('')}</div>` : ''}</div></details>
  </section>`;
}


function currentMusicOutcomeRoute() {
  const path = String(globalThis.location?.pathname || '').trim();
  return path === '/eoncity' ? '/eoncity' : '/create';
}

async function buildMusicArtifactProof(blob, { fileName = '', mimeType = '' } = {}) {
  const proof = await prepareMusicArtifactProof(blob, { fileName, contentType: mimeType || blob?.type || '' });
  return {
    sha256: proof.ok ? proof.sha256 : '',
    expectedBytes: proof.ok ? proof.sizeBytes : Number(blob?.size || 0),
    saved: false,
    digestMatched: false,
    receiptRecorded: false
  };
}

async function verifySavedMusicArtifact(artifact, file, { source = '', receiptPrefix = '' } = {}) {
  if (!artifact?.blob || artifact.saved !== true) return Object.freeze({ ok: false, reason: 'save-before-reopen-required' });
  const proof = await verifyMusicArtifactReopen(file, { expectedSha256: artifact.sha256, expectedBytes: artifact.expectedBytes });
  artifact.digestMatched = proof.ok === true;
  if (!proof.ok) return proof;
  if (!artifact.receiptRecorded && canRecordMusicOutcome(artifact)) {
    const receiptId = `${receiptPrefix || source}:${artifact.createdAt}:${artifact.sha256}`;
    const receipt = recordEonCoreOutcome({ kind: 'creator-music-exported', route: currentMusicOutcomeRoute(), source, receiptId, verified: true });
    artifact.receiptRecorded = receipt?.ok === true;
  }
  return Object.freeze({ ...proof, receiptRecorded: artifact.receiptRecorded === true });
}

function downloadBlob(blob, name) {
  const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = name; link.click(); setTimeout(() => URL.revokeObjectURL(url), 0);
}

function asLocalAudioFile(artifact, fallbackType = 'audio/wav') {
  if (!artifact?.blob) return null;
  return typeof File === 'function'
    ? new File([artifact.blob], artifact.fileName, { type: artifact.mimeType || artifact.blob.type || fallbackType, lastModified: artifact.createdAt })
    : Object.assign(artifact.blob, { name: artifact.fileName });
}

async function replaceGenerativeArtifact(result) {
  if (lastGenerativeArtifact?.objectUrl) {
    try { URL.revokeObjectURL(lastGenerativeArtifact.objectUrl); } catch { /* session cleanup best effort */ }
  }
  const createdAt = Date.now();
  const fileName = result.filename || `eon-ai-music-${createdAt}.wav`;
  const mimeType = result.mimeType || result.blob.type || 'audio/wav';
  const proof = await buildMusicArtifactProof(result.blob, { fileName, mimeType });
  lastGenerativeArtifact = {
    blob: result.blob,
    objectUrl: URL.createObjectURL(result.blob),
    fileName,
    mimeType,
    createdAt,
    metadata: result.metadata || {},
    receipt: result.receipt || null,
    ...proof
  };
}

async function replaceHostedMusicArtifact(result) {
  if (lastHostedMusicArtifact?.objectUrl) {
    try { URL.revokeObjectURL(lastHostedMusicArtifact.objectUrl); } catch { /* session cleanup best effort */ }
  }
  const createdAt = Date.now();
  const fileName = result.fileName || `eon-hosted-music-${createdAt}.mp3`;
  const mimeType = result.mimeType || result.blob.type || 'audio/mpeg';
  const proof = await buildMusicArtifactProof(result.blob, { fileName, mimeType });
  lastHostedMusicArtifact = {
    blob: result.blob,
    objectUrl: URL.createObjectURL(result.blob),
    fileName,
    mimeType,
    createdAt,
    jobId: result.jobId || '',
    ...proof
  };
}

function applyHostedProviderSnapshot(payload = {}) {
  const providers = Array.isArray(payload.providers) ? payload.providers : [];
  hostedMusicState.models = (Array.isArray(payload.models) ? payload.models : []).filter((row) => row.providerId === 'elevenlabs' && row.mediaKind === 'music' && row.enabled === true);
  hostedMusicState.selectedModel = hostedMusicState.models.find((row) => row.id === hostedMusicState.selectedModel)?.id || hostedMusicState.models[0]?.id || 'elevenlabs-music-v2';
  hostedMusicState.credentialConfigured = providers.find((row) => row.id === 'elevenlabs')?.credentialConfigured === true;
  hostedMusicState.paired = true;
}

export function bindEonMusicStudio(root, { rerender } = {}) {
  const studio = root?.querySelector?.('[data-eon-music-studio]'); if (!studio) return;
  const status = (message) => {
    musicStatusMessage = String(message || DEFAULT_MUSIC_STATUS);
    const node = studio.querySelector('[data-music-status]');
    if (node) node.textContent = musicStatusMessage;
  };
  const aceStatus = (message) => { aceStepState.status = String(message || ''); const node = studio.querySelector('[data-music-acestep-status]'); if (node) node.textContent = aceStepState.status; };
  const hostedStatus = (message) => { hostedMusicState.status = String(message || ''); const node = studio.querySelector('[data-music-hosted-status]'); if (node) node.textContent = hostedMusicState.status; };
  studio.querySelector('[data-music-bpm]')?.addEventListener('change', (event) => { musicLabService.setBPM(Number(event.target.value)); rerender?.(); });
  studio.querySelector('[data-music-preset]')?.addEventListener('change', (event) => { if (event.target.value) { musicLabService.loadPreset(event.target.value); rerender?.(); } });
  studio.querySelectorAll('[data-music-step]').forEach((button) => button.addEventListener('click', () => { const [track, step] = String(button.dataset.musicStep || '').split(':').map(Number); musicLabService.toggleStep(track, step); rerender?.(); }));
  studio.querySelector('[data-music-play]')?.addEventListener('click', () => { const result = musicLabService.play(); status(result?.success ? 'Playing locally through Web Audio.' : result?.error || 'Playback could not start.'); });
  studio.querySelector('[data-music-stop]')?.addEventListener('click', () => { musicLabService.stop(); status('Stopped.'); });
  studio.querySelector('[data-music-export]')?.addEventListener('click', async () => {
    status('Rendering WAV locally…');
    const result = await musicLabService.exportWAV(16);
    if (result?.success && result.blob) {
      const createdAt = Date.now();
      const fileName = `eon-music-${createdAt}.wav`;
      const proof = await buildMusicArtifactProof(result.blob, { fileName, mimeType: 'audio/wav' });
      downloadBlob(result.blob, fileName);
      lastMusicArtifact = { blob: result.blob, fileName, createdAt, bpm: musicLabService.bpm, mimeType: 'audio/wav', ...proof, saved: true };
      status('Local WAV saved. Reopen the saved copy once to verify the byte-for-byte artifact before it can advance Create Forge.');
      rerender?.();
    } else status(result?.error || 'WAV export failed.');
  });
  studio.querySelector('[data-music-verify-wav]')?.addEventListener('change', async (event) => {
    const file = event.target?.files?.[0] || null;
    const result = await verifySavedMusicArtifact(lastMusicArtifact, file, { source: 'eon-music-studio', receiptPrefix: 'wav' });
    status(result.ok ? 'Saved WAV reopened and verified byte-for-byte. The redacted Creator receipt may now advance Create Forge.' : `Saved WAV verification failed: ${result.reason || 'digest mismatch'}.`);
    rerender?.();
  });
  studio.querySelector('[data-music-share-file]')?.addEventListener('click', async () => {
    if (!lastMusicArtifact?.blob) { status('Export a WAV first.'); return; }
    try {
      const file = asLocalAudioFile(lastMusicArtifact);
      const result = await shareEonLocalMedia({ file, title: 'Made with EON Music', text: `EON Music · ${lastMusicArtifact.bpm} BPM` }, { userGesture: true });
      status(result.ok ? 'Native share menu opened for your local WAV. EONAPP cannot claim where you post it.' : 'Native audio-file sharing is unavailable here. Your WAV remains downloaded locally.');
    } catch (error) { status(String(error?.message || 'Native sharing could not open.')); }
  });
  studio.querySelector('[data-music-share-remix]')?.addEventListener('click', async () => {
    if (!lastMusicArtifact) { status('Export a WAV first.'); return; }
    const handoff = writeEonOutputShareHandoff({ explicitUserAction: true, origin: 'creator-music', remixKind: 'music-track', title: 'Made with EON Music', audience: 'music makers and listeners', usefulOutcome: `A local ${lastMusicArtifact.bpm} BPM WAV was created and reviewed in EON Music.`, firstRemixStep: 'Try a new mood, BPM or arrangement while keeping the original local file private.' });
    if (!handoff.ok) { status(handoff.reason || 'Could not prepare the share handoff.'); return; }
    status('Public-safe music handoff prepared. Review it in Share Command Center before sending.');
    await openEonShareSheet({ type: 'eonapp' });
  });
  studio.querySelector('[data-music-pattern]')?.addEventListener('click', async () => { const idea = studio.querySelector('[data-music-idea]')?.value || 'creator groove'; const result = await musicLabService.generateWithAI(idea, null); status(result?.success ? 'Smart local pattern created — deterministic browser synthesis, not model-generated audio.' : result?.error || 'Pattern generation failed.'); rerender?.(); });
  studio.querySelector('[data-music-eonbot]')?.addEventListener('click', async () => {
    const idea = studio.querySelector('[data-music-idea]')?.value || 'creator groove'; status('Trying the currently verified EONBOT model for a sequencer pattern…');
    try {
      const aiRuntime = await import('../chat/ai-runtime.js'); const result = await musicLabService.generateWithAI(idea, aiRuntime);
      const source = result?.pattern?.source || '';
      status(result?.success ? (source === 'ai' || source === 'adapter' ? 'EONBOT model pattern applied.' : 'EONBOT was unavailable; a deterministic local pattern was applied instead.') : result?.error || 'EONBOT pattern generation failed.');
      rerender?.();
    } catch (error) { status(`EONBOT unavailable: ${String(error?.message || error || 'runtime error').slice(0, 160)}`); }
  });

  studio.querySelector('[data-music-acestep-endpoint]')?.addEventListener('change', (event) => {
    aceStepState.endpoint = String(event.target?.value || EON_ACESTEP_DEFAULT_ENDPOINT).trim() || EON_ACESTEP_DEFAULT_ENDPOINT;
    aceStepState.models = [];
    aceStepState.selectedModel = '';
    aceStepState.status = 'Endpoint changed. Scan explicitly to verify the local ACE-Step runtime.';
    rerender?.();
  });
  studio.querySelector('[data-music-acestep-key-save]')?.addEventListener('click', () => {
    const credential = String(studio.querySelector('[data-music-acestep-key]')?.value || '');
    const result = saveLocalRuntimeSessionCredential({ runtimeId: 'acestep', credential });
    aceStatus(result.ok ? 'ACE-Step API key stored in sessionStorage only. It is never written to receipts or durable memory.' : `API key was not stored: ${result.reason || 'credential required'}.`);
    if (result.ok) rerender?.();
  });
  studio.querySelector('[data-music-acestep-key-clear]')?.addEventListener('click', () => {
    clearLocalRuntimeSessionCredential('acestep');
    aceStepState.status = 'ACE-Step session API key cleared.';
    rerender?.();
  });
  studio.querySelector('[data-music-acestep-scan]')?.addEventListener('click', async () => {
    aceStepState.busy = true;
    aceStepState.status = 'Scanning the approved ACE-Step loopback endpoint for already-loaded models…';
    rerender?.();
    const result = await discoverAceStepLocalMusic({ endpoint: aceStepState.endpoint, explicitUserAction: true });
    aceStepState.busy = false;
    aceStepState.models = result.ok ? [...result.models] : [];
    aceStepState.selectedModel = result.ok ? result.defaultModel : '';
    aceStepState.service = result.ok ? result.service : '';
    aceStepState.version = result.ok ? result.version : '';
    aceStepState.status = result.ok
      ? `${result.service || 'ACE-Step'} ${result.version || ''} · ${result.models.length} loaded model${result.models.length === 1 ? '' : 's'} found. No model was downloaded or initialized by EONAPP.`
      : `ACE-Step scan did not become ready: ${result.reason || 'runtime unavailable'}. EONAPP did not start or modify the runtime.`;
    rerender?.();
  });
  studio.querySelector('[data-music-acestep-model]')?.addEventListener('change', (event) => { aceStepState.selectedModel = String(event.target?.value || ''); });
  studio.querySelector('[data-music-acestep-generate]')?.addEventListener('click', async () => {
    const prompt = String(studio.querySelector('[data-music-acestep-prompt]')?.value || aceStepState.preparedPrompt || '').trim();
    aceStepState.preparedPrompt = prompt.slice(0, 1200);
    if (!prompt) { aceStatus('Describe the track first.'); return; }
    const lyrics = String(studio.querySelector('[data-music-acestep-lyrics]')?.value || '');
    const durationSec = Number(studio.querySelector('[data-music-acestep-duration]')?.value || 30);
    const format = String(studio.querySelector('[data-music-acestep-format]')?.value || 'wav');
    const enhanced = Boolean(studio.querySelector('[data-music-acestep-enhanced]')?.checked);
    const controller = new AbortController();
    aceStepState.abortController = controller;
    aceStepState.busy = true;
    aceStepState.lastSubmittedPrompt = aceStepState.preparedPrompt;
    aceStepState.status = 'Generating locally with ACE-Step. EONAPP will poll the local job and fetch only its generated audio result.';
    rerender?.();
    const result = await generateAceStepLocalMusic({ prompt, lyrics, durationSec, format, enhanced, model: aceStepState.selectedModel }, {
      endpoint: aceStepState.endpoint,
      explicitUserAction: true,
      signal: controller.signal,
      onState: (state) => { aceStepState.status = state.state === 'running' ? 'ACE-Step is generating locally…' : state.state === 'fetching-output' ? 'Generation finished; fetching the generated audio into this browser…' : aceStepState.status; }
    });
    aceStepState.busy = false;
    aceStepState.abortController = null;
    if (result.ok) {
      await replaceGenerativeArtifact(result);
      aceStepState.status = `Local track generated and fetched (${Math.max(1, Math.round(result.blob.size / 1024))} KB). Preview, save, share or add it to Radio. Keep this runtime marked unverified until its real-device output check succeeds.`;
    } else {
      aceStepState.status = result.reason === 'acestep-wait-cancelled-local-job-may-continue'
        ? 'Stopped waiting in EONAPP. The ACE-Step server job may still continue because its reviewed generation API exposes no job-cancel endpoint.'
        : `Local generation did not complete: ${result.reason || 'unknown ACE-Step error'}.`;
    }
    rerender?.();
  });
  studio.querySelector('[data-music-acestep-cancel]')?.addEventListener('click', () => {
    aceStepState.abortController?.abort?.();
    aceStatus('Stopping EONAPP waiting. The local ACE-Step server job may continue.');
  });
  studio.querySelector('[data-music-acestep-save]')?.addEventListener('click', () => {
    if (!lastGenerativeArtifact?.blob) { aceStatus('Generate a local track first.'); return; }
    downloadBlob(lastGenerativeArtifact.blob, lastGenerativeArtifact.fileName);
    lastGenerativeArtifact.saved = true;
    lastGenerativeArtifact.digestMatched = false;
    aceStepState.status = 'Generated track saved locally. Reopen the saved copy once for byte-for-byte verification before a City/Create mission receipt is created.';
    rerender?.();
  });
  studio.querySelector('[data-music-acestep-verify]')?.addEventListener('change', async (event) => {
    const file = event.target?.files?.[0] || null;
    const result = await verifySavedMusicArtifact(lastGenerativeArtifact, file, { source: 'eon-acestep-local', receiptPrefix: 'acestep' });
    aceStepState.status = result.ok ? 'Saved ACE-Step track reopened and verified byte-for-byte. Only a redacted Creator receipt is shared with City.' : `Saved-track verification failed: ${result.reason || 'digest mismatch'}.`;
    rerender?.();
  });
  studio.querySelector('[data-music-acestep-variation]')?.addEventListener('click', () => {
    if (!lastGenerativeArtifact?.blob) { aceStatus('Generate a local track first.'); return; }
    const nextIndex = (Number(aceStepState.variationIndex) || 0) + 1;
    const plan = buildCreatorVariationPrompt({ mediaKind: 'music', prompt: aceStepState.lastSubmittedPrompt || aceStepState.preparedPrompt, iteration: nextIndex, maxChars: 1200 });
    if (!plan.ok) { aceStatus(`Variation could not be prepared: ${plan.reason}.`); return; }
    aceStepState.variationIndex = nextIndex;
    aceStepState.preparedPrompt = plan.prompt;
    aceStepState.status = `Music variation ${nextIndex} prepared locally. Review/edit it, then press Generate local track separately. No ACE-Step job started.`;
    rerender?.();
  });
  studio.querySelector('[data-music-acestep-share]')?.addEventListener('click', async () => {
    if (!lastGenerativeArtifact?.blob) { aceStatus('Generate a local track first.'); return; }
    try {
      const file = asLocalAudioFile(lastGenerativeArtifact);
      const result = await shareEonLocalMedia({ file, title: 'Made with EON Music', text: 'Local generative music created with my own EONAPP setup.' }, { userGesture: true });
      aceStatus(result.ok ? 'Native share menu opened for the generated local track. Sharing itself does not create referral/EONKEY proof.' : 'Native audio-file sharing is unavailable here; the generated track remains in this browser session.');
    } catch (error) { aceStatus(String(error?.message || 'Native sharing could not open.')); }
  });
  studio.querySelector('[data-music-acestep-radio]')?.addEventListener('click', () => {
    if (!lastGenerativeArtifact?.blob) { aceStatus('Generate a local track first.'); return; }
    const result = eonRadioSession.addGeneratedBlob(lastGenerativeArtifact.blob, { fileName: lastGenerativeArtifact.fileName, type: lastGenerativeArtifact.mimeType }, { explicitUserAction: true });
    aceStepState.status = result.ok ? 'Generated local track added to the private EON Radio session.' : `Could not add the generated track: ${result.reason || 'session unavailable'}.`;
    rerender?.();
  });
  studio.querySelector('[data-music-acestep-remix]')?.addEventListener('click', async () => {
    if (!lastGenerativeArtifact?.blob) { aceStatus('Generate a local track first.'); return; }
    const handoff = writeEonOutputShareHandoff({ explicitUserAction: true, origin: 'creator-music', remixKind: 'music-track', title: 'EON generated music', audience: 'music makers and listeners', usefulOutcome: 'A local generative music track was created and reviewed in EON Music.', firstRemixStep: 'Generate a new mood, duration or arrangement; the original prompt, lyrics and audio stay private unless you explicitly share the file.' });
    if (!handoff.ok) { aceStatus(handoff.reason || 'Could not prepare the music remix handoff.'); return; }
    await openEonShareSheet({ type: 'eonapp' });
  });

  studio.querySelector('[data-music-hosted-scan]')?.addEventListener('click', async () => {
    hostedMusicState.busy = true;
    hostedMusicState.status = 'Checking the fixed 127.0.0.1 Creator Companion. No LAN or public endpoint is scanned.';
    rerender?.();
    const scan = await scanCreatorCompanion();
    hostedMusicState.detected = scan.ok;
    if (!scan.ok) {
      hostedMusicState.paired = false;
      hostedMusicState.busy = false;
      hostedMusicState.status = 'Creator Companion was not detected. Start it on this device; EONAPP will not download or start it for you.';
      rerender?.();
      return;
    }
    try {
      const providers = await listDirectProviders();
      applyHostedProviderSnapshot(providers);
      hostedMusicState.status = hostedMusicState.credentialConfigured
        ? 'Creator Companion paired. ElevenLabs key is available from the OS secure credential vault; no hosted request has started.'
        : 'Creator Companion paired. Add your ElevenLabs key to the OS secure credential vault before generating.';
    } catch {
      hostedMusicState.paired = false;
      hostedMusicState.status = 'Creator Companion detected. Pair this browser before provider access.';
    }
    hostedMusicState.busy = false;
    rerender?.();
  });
  studio.querySelector('[data-music-hosted-pair]')?.addEventListener('click', async () => {
    try {
      const challenge = await beginCreatorCompanionPairing();
      hostedMusicState.pairingChallengeId = String(challenge?.challengeId || '');
      hostedMusicState.status = hostedMusicState.pairingChallengeId ? 'Enter the six-digit code shown by your local Creator Companion.' : 'The companion did not return a pairing challenge.';
    } catch (error) { hostedMusicState.status = String(error?.message || error); }
    rerender?.();
  });
  studio.querySelector('[data-music-hosted-confirm]')?.addEventListener('click', async () => {
    const code = String(studio.querySelector('[data-music-hosted-code]')?.value || '');
    try {
      await confirmCreatorCompanionPairing({ challengeId: hostedMusicState.pairingChallengeId, code });
      const providers = await listDirectProviders();
      applyHostedProviderSnapshot(providers);
      hostedMusicState.pairingChallengeId = '';
      hostedMusicState.status = hostedMusicState.credentialConfigured ? 'Paired. Hosted Music is ready for explicit review.' : 'Paired. Add your provider key to the OS vault.';
    } catch (error) { hostedMusicState.status = String(error?.message || error); }
    rerender?.();
  });
  studio.querySelector('[data-music-hosted-key-save]')?.addEventListener('click', async () => {
    const input = studio.querySelector('[data-music-hosted-key]');
    const credential = String(input?.value || '');
    try {
      const result = await setDirectProviderCredential('elevenlabs', credential);
      if (input) input.value = '';
      hostedMusicState.credentialConfigured = result?.configured === true;
      hostedMusicState.status = hostedMusicState.credentialConfigured ? 'Provider key moved to the OS secure vault and was not echoed back to the browser.' : 'Provider key was not configured.';
    } catch (error) { if (input) input.value = ''; hostedMusicState.status = String(error?.message || error); }
    rerender?.();
  });
  studio.querySelector('[data-music-hosted-key-clear]')?.addEventListener('click', async () => {
    try {
      await deleteDirectProviderCredential('elevenlabs');
      hostedMusicState.credentialConfigured = false;
      hostedMusicState.status = 'ElevenLabs key removed from the OS secure credential vault.';
    } catch (error) { hostedMusicState.status = String(error?.message || error); }
    rerender?.();
  });
  studio.querySelector('[data-music-hosted-generate]')?.addEventListener('click', async () => {
    const prompt = String(studio.querySelector('[data-music-hosted-prompt]')?.value || hostedMusicState.preparedPrompt || '').trim();
    hostedMusicState.preparedPrompt = prompt.slice(0, 4100);
    const budgetConfirmed = studio.querySelector('[data-music-hosted-budget]')?.checked === true;
    const durationMs = Math.round(Number(studio.querySelector('[data-music-hosted-duration]')?.value || 30) * 1000);
    const instrumental = studio.querySelector('[data-music-hosted-instrumental]')?.checked === true;
    if (!prompt) { hostedStatus('Describe the hosted track first.'); return; }
    if (!budgetConfirmed) { hostedStatus('Review your provider plan/credits and tick the one-job approval before any paid provider request.'); return; }
    const candidate = {
      providerId: 'elevenlabs', mediaKind: 'music', modelId: hostedMusicState.selectedModel,
      prompt, input: { durationMs, instrumental }, sourceSurface: 'create-music', safeLabel: 'Direct BYOK hosted music',
      userBudget: { currency: 'USD', warningAmount: 0, hardStopAmount: 0 }
    };
    const localVerdict = buildDirectJobRequest(candidate, { explicitUserAction: true, explicitUserApproval: true, budgetConfirmed: true });
    if (!localVerdict.ok) { hostedStatus(`Hosted Music review rejected: ${localVerdict.reason}.`); return; }
    hostedMusicState.busy = true;
    hostedMusicState.lastSubmittedPrompt = hostedMusicState.preparedPrompt;
    hostedMusicState.status = 'Submitting one reviewed Music v2 request through your paired companion. The provider rail exposes no reviewed cancel operation; no automatic retry will occur.';
    rerender?.();
    try {
      const response = await submitDirectJob({ ...candidate, jobId: localVerdict.job.jobId, explicitUserApproval: true, budgetConfirmed: true });
      if (response?.state !== 'completed' || response?.result?.outputAvailable !== true) throw new Error(response?.message || response?.code || 'hosted-music-generation-failed');
      const output = await readDirectJobOutput(localVerdict.job.jobId);
      await replaceHostedMusicArtifact({ blob: output.blob, mimeType: output.mimeType, jobId: localVerdict.job.jobId, fileName: `eon-hosted-music-${Date.now()}.mp3` });
      const receipt = toDirectJobPublicReceipt(localVerdict.job, { state: 'completed', progress: 100, authoritativeProgress: true, code: 'provider-completed', message: 'Hosted music completed through the paired Creator Companion.' });
      if (receipt) recordDirectHistoryReceipt(receipt);
      hostedMusicState.status = `Hosted BYOK track received into this browser (${Math.max(1, Math.round(output.byteLength / 1024))} KB). Save, share or add it to Radio. Real-provider launch proof is still pending.`;
    } catch (error) {
      hostedMusicState.status = `Hosted Music did not complete: ${String(error?.message || error).slice(0, 180)}. No automatic paid retry was attempted.`;
    }
    hostedMusicState.busy = false;
    rerender?.();
  });
  studio.querySelector('[data-music-hosted-save]')?.addEventListener('click', () => {
    if (!lastHostedMusicArtifact?.blob) { hostedStatus('Generate a hosted track first.'); return; }
    downloadBlob(lastHostedMusicArtifact.blob, lastHostedMusicArtifact.fileName);
    lastHostedMusicArtifact.saved = true;
    lastHostedMusicArtifact.digestMatched = false;
    hostedMusicState.status = 'Hosted BYOK track saved locally. Reopen the saved copy once for byte-for-byte verification before a City/Create mission receipt is created.';
    rerender?.();
  });
  studio.querySelector('[data-music-hosted-verify]')?.addEventListener('change', async (event) => {
    const file = event.target?.files?.[0] || null;
    const result = await verifySavedMusicArtifact(lastHostedMusicArtifact, file, { source: 'eon-direct-byok-elevenlabs', receiptPrefix: 'elevenlabs' });
    hostedMusicState.status = result.ok ? 'Saved hosted track reopened and verified byte-for-byte. City receives only the redacted Creator receipt.' : `Saved-track verification failed: ${result.reason || 'digest mismatch'}.`;
    rerender?.();
  });
  studio.querySelector('[data-music-hosted-variation]')?.addEventListener('click', () => {
    if (!lastHostedMusicArtifact?.blob) { hostedStatus('Generate a hosted track first.'); return; }
    const nextIndex = (Number(hostedMusicState.variationIndex) || 0) + 1;
    const plan = buildCreatorVariationPrompt({ mediaKind: 'music', prompt: hostedMusicState.lastSubmittedPrompt || hostedMusicState.preparedPrompt, iteration: nextIndex, maxChars: 4100 });
    if (!plan.ok) { hostedStatus(`Variation could not be prepared: ${plan.reason}.`); return; }
    hostedMusicState.variationIndex = nextIndex;
    hostedMusicState.preparedPrompt = plan.prompt;
    hostedMusicState.status = `Hosted Music variation ${nextIndex} prepared in this browser. Review/edit it, re-approve the one-job budget checkbox, then press Generate hosted track separately. Nothing was submitted or charged.`;
    rerender?.();
  });
  studio.querySelector('[data-music-hosted-share]')?.addEventListener('click', async () => {
    if (!lastHostedMusicArtifact?.blob) { hostedStatus('Generate a hosted track first.'); return; }
    try {
      const file = asLocalAudioFile(lastHostedMusicArtifact, 'audio/mpeg');
      const result = await shareEonLocalMedia({ file, title: 'Made with EON Music', text: 'Hosted BYOK music generated through my own paired provider connection.' }, { userGesture: true });
      hostedStatus(result.ok ? 'Native share menu opened. Sharing itself does not create referral/EONKEY proof.' : 'Native audio sharing is unavailable here; save the track locally instead.');
    } catch (error) { hostedStatus(String(error?.message || 'Native sharing could not open.')); }
  });
  studio.querySelector('[data-music-hosted-radio]')?.addEventListener('click', () => {
    if (!lastHostedMusicArtifact?.blob) { hostedStatus('Generate a hosted track first.'); return; }
    const result = eonRadioSession.addGeneratedBlob(lastHostedMusicArtifact.blob, { fileName: lastHostedMusicArtifact.fileName, type: lastHostedMusicArtifact.mimeType }, { explicitUserAction: true });
    hostedMusicState.status = result.ok ? 'Hosted BYOK track added to the private EON Radio session.' : `Could not add the hosted track: ${result.reason || 'session unavailable'}.`;
    rerender?.();
  });
  studio.querySelector('[data-music-hosted-remix]')?.addEventListener('click', async () => {
    if (!lastHostedMusicArtifact?.blob) { hostedStatus('Generate a hosted track first.'); return; }
    const handoff = writeEonOutputShareHandoff({ explicitUserAction: true, origin: 'creator-music', remixKind: 'music-track', title: 'EON hosted BYOK music', audience: 'music makers and listeners', usefulOutcome: 'A hosted BYOK music track was created and reviewed in EON Music.', firstRemixStep: 'Generate a new mood or duration with your own provider connection; the original prompt and audio remain private unless you explicitly share the file.' });
    if (!handoff.ok) { hostedStatus(handoff.reason || 'Could not prepare the hosted music remix handoff.'); return; }
    await openEonShareSheet({ type: 'eonapp' });
  });

  studio.querySelector('[data-music-dj-plan]')?.addEventListener('click', () => {
    const rows = String(studio.querySelector('[data-music-dj]')?.value || '').split('\n').map((line, index) => { const [title, bpm, energy] = line.split('|'); return title?.trim() ? { id: `dj-${index}`, title: title.trim(), bpm: Number(bpm || 120), energy: Number(energy || 0.5) } : null; }).filter(Boolean);
    const plan = buildAutoDjSetPlan(rows); const out = studio.querySelector('[data-music-dj-output]'); if (out) out.textContent = plan.ok ? plan.sequence.map((track, index) => `${index + 1}. ${track.title} · ${track.bpm} BPM`).join('\n') : 'Add tracks as Title|BPM|Energy.';
  });
  studio.querySelector('[data-music-dj-files]')?.addEventListener('change', (event) => {
    const result = eonAutoDjPreviewSession.addFiles(event.target?.files || [], { explicitUserAction: true });
    status(result.ok ? `Added ${result.added.length} authorized track${result.added.length === 1 ? '' : 's'} to the local Auto DJ preview.` : `Could not add DJ audio: ${result.reason || 'unsupported file'}.`);
    rerender?.();
  });
  const addGeneratedToDj = (artifact, label) => {
    if (!artifact?.blob) { status(`Create ${label} first.`); return; }
    const result = eonAutoDjPreviewSession.addGeneratedBlob(artifact.blob, { fileName: artifact.fileName, type: artifact.mimeType || artifact.blob.type }, { explicitUserAction: true });
    status(result.ok ? `${label} added to the private Auto DJ session.` : `Could not add ${label}: ${result.reason || 'session unavailable'}.`);
    rerender?.();
  };
  studio.querySelector('[data-music-dj-add-wav]')?.addEventListener('click', () => addGeneratedToDj(lastMusicArtifact, 'the exported WAV'));
  studio.querySelector('[data-music-dj-add-ai]')?.addEventListener('click', () => addGeneratedToDj(lastGenerativeArtifact, 'the generated local track'));
  studio.querySelector('[data-music-dj-add-hosted]')?.addEventListener('click', () => addGeneratedToDj(lastHostedMusicArtifact, 'the hosted BYOK track'));
  studio.querySelector('[data-music-dj-preview]')?.addEventListener('click', async () => {
    const seconds = Number(studio.querySelector('[data-music-dj-crossfade]')?.value || 8);
    const result = await eonAutoDjPreviewSession.play({ explicitUserAction: true, crossfadeSec: seconds });
    status(result.ok ? 'Auto DJ crossfade preview started locally. No upload, beat-match or rendered mix is claimed.' : `Auto DJ preview could not start: ${result.reason || 'browser audio unavailable'}.`);
    const djStatus = studio.querySelector('[data-music-dj-status]'); if (djStatus) djStatus.textContent = result.ok ? 'Local crossfade preview playing.' : 'Preview stopped.';
  });
  studio.querySelector('[data-music-dj-stop]')?.addEventListener('click', () => { eonAutoDjPreviewSession.stop({ explicitUserAction: true }); status('Auto DJ preview stopped.'); rerender?.(); });
  studio.querySelector('[data-music-dj-clear]')?.addEventListener('click', () => { eonAutoDjPreviewSession.clear({ explicitUserAction: true }); status('Auto DJ session cleared. Original files remain on your device.'); rerender?.(); });
  const rememberRadioControl = (signalId, value, label) => {
    const result = rememberEonAiStructuredSignal(signalId, value, { explicitControlChange: true });
    status(result.stored ? `${label} preference updated and safely remembered.` : `${label} preference updated for this session. Memory did not auto-save it (${result.reason || 'policy'}).`);
  };
  studio.querySelector('[data-music-radio-genre]')?.addEventListener('change', (event) => { radioPreferenceState.genre = String(event.target?.value || 'electronic'); rememberRadioControl('radio-genre', radioPreferenceState.genre, 'Radio genre'); });
  studio.querySelector('[data-music-radio-vocals]')?.addEventListener('change', (event) => { radioPreferenceState.vocals = String(event.target?.value || 'mixed'); rememberRadioControl('radio-vocals', radioPreferenceState.vocals, 'Radio vocals'); });
  studio.querySelector('[data-music-radio-energy]')?.addEventListener('change', (event) => { radioPreferenceState.energy = String(event.target?.value || 'balanced'); rememberRadioControl('radio-energy', radioPreferenceState.energy, 'Radio energy'); });
  studio.querySelector('[data-music-radio-plan-next]')?.addEventListener('click', () => {
    const activeStation = lastRadioStation || listEonRadioStations({ limit: 1 })[0] || null;
    const result = buildEonRadioNextTrackPlan(activeStation || {}, { iteration: radioNextTrackIteration });
    if (!result.ok || !result.plan) { status('Save a station with a description first.'); return; }
    lastRadioNextTrackPlan = result.plan;
    radioNextTrackIteration = (radioNextTrackIteration + 1) % 10000;
    status(`Next-track plan prepared locally · ${result.plan.arcLabel}. No model/provider was called.`);
    rerender?.();
  });
  studio.querySelector('[data-music-radio-use-local]')?.addEventListener('click', () => {
    if (!lastRadioNextTrackPlan?.prompt) { status('Plan the next original track first.'); return; }
    aceStepState.preparedPrompt = lastRadioNextTrackPlan.prompt;
    const promptNode = studio.querySelector('[data-music-acestep-prompt]');
    if (promptNode) promptNode.value = aceStepState.preparedPrompt;
    status('Radio plan copied to the Local generator. Scan/select a loaded ACE-Step model if needed, then press Generate local track separately.');
  });
  studio.querySelector('[data-music-radio-use-hosted]')?.addEventListener('click', () => {
    if (!lastRadioNextTrackPlan?.prompt) { status('Plan the next original track first.'); return; }
    hostedMusicState.preparedPrompt = lastRadioNextTrackPlan.prompt;
    const promptNode = studio.querySelector('[data-music-hosted-prompt]');
    if (promptNode) promptNode.value = hostedMusicState.preparedPrompt;
    status('Radio plan copied to the Hosted generator. Pair/review BYOK if needed, then separately approve and press Generate hosted track.');
  });
  studio.querySelector('[data-music-radio-save]')?.addEventListener('click', () => {
    const energy = radioPreferenceState.energy === 'calm' ? 0.25 : radioPreferenceState.energy === 'high' ? 0.85 : 0.55;
    const result = createEonRadioStation({ name: studio.querySelector('[data-music-radio-name]')?.value, prompt: studio.querySelector('[data-music-radio-prompt]')?.value, genres: [radioPreferenceState.genre], vocalPreference: radioPreferenceState.vocals, energy });
    if (result.ok) {
      lastRadioStation = result.station || null;
      recordEonCoreOutcome({ kind: 'creator-radio-station', route: currentMusicOutcomeRoute(), source: 'eon-radio-station', receiptId: `radio:${result.station?.id || Date.now()}`, verified: true });
      status('EON Radio station saved locally. It can advance the Create Forge mission without exposing the station prompt to City.');
    } else status('Describe the station first.');
    rerender?.();
  });
  studio.querySelectorAll('[data-music-radio-delete]').forEach((button) => button.addEventListener('click', () => {
    const id = String(button.dataset.musicRadioDelete || '');
    const deleted = deleteEonRadioStation(id);
    if (deleted && lastRadioStation?.id === id) lastRadioStation = null;
    if (deleted) { lastRadioNextTrackPlan = null; radioNextTrackIteration = 0; }
    status(deleted ? 'Radio station profile deleted. Session audio and source files were not deleted.' : 'Radio station could not be deleted.');
    rerender?.();
  }));
  studio.querySelector('[data-music-radio-files]')?.addEventListener('change', (event) => {
    const result = eonRadioSession.addFiles(event.target?.files || [], { explicitUserAction: true });
    status(result.ok ? `Added ${result.added.length} authorized audio track${result.added.length === 1 ? '' : 's'} to this private radio session.` : `Could not add audio: ${result.reason || 'unsupported file'}.`);
    rerender?.();
  });
  studio.querySelector('[data-music-radio-add-generated]')?.addEventListener('click', () => {
    if (!lastMusicArtifact?.blob) { status('Export an EON WAV first.'); return; }
    const result = eonRadioSession.addGeneratedBlob(lastMusicArtifact.blob, { fileName: lastMusicArtifact.fileName, type: 'audio/wav' }, { explicitUserAction: true });
    status(result.ok ? 'Added the exported EON WAV to this private radio session.' : `Could not add the WAV: ${result.reason || 'session unavailable'}.`);
    rerender?.();
  });
  studio.querySelector('[data-music-radio-add-ai]')?.addEventListener('click', () => {
    if (!lastGenerativeArtifact?.blob) { status('Generate a local track first.'); return; }
    const result = eonRadioSession.addGeneratedBlob(lastGenerativeArtifact.blob, { fileName: lastGenerativeArtifact.fileName, type: lastGenerativeArtifact.mimeType }, { explicitUserAction: true });
    status(result.ok ? 'Added the generated local track to this private radio session.' : `Could not add the track: ${result.reason || 'session unavailable'}.`);
    rerender?.();
  });
  studio.querySelector('[data-music-radio-add-hosted]')?.addEventListener('click', () => {
    if (!lastHostedMusicArtifact?.blob) { status('Generate a hosted BYOK track first.'); return; }
    const result = eonRadioSession.addGeneratedBlob(lastHostedMusicArtifact.blob, { fileName: lastHostedMusicArtifact.fileName, type: lastHostedMusicArtifact.mimeType }, { explicitUserAction: true });
    status(result.ok ? 'Added the hosted BYOK track to this private radio session.' : `Could not add the hosted track: ${result.reason || 'session unavailable'}.`);
    rerender?.();
  });
  studio.querySelector('[data-music-radio-play-station]')?.addEventListener('click', async () => {
    const result = await eonRadioPlayer.play({ explicitUserAction: true });
    status(result.ok ? 'EON Radio is playing this private queue and will advance locally while this page stays open.' : `Radio could not start: ${result.reason || 'browser audio unavailable'}.`);
    rerender?.();
  });
  studio.querySelector('[data-music-radio-stop-station]')?.addEventListener('click', () => {
    eonRadioPlayer.stop({ explicitUserAction: true });
    status('EON Radio stopped. No audio or station profile was deleted.');
    rerender?.();
  });
  studio.querySelector('[data-music-radio-prev]')?.addEventListener('click', async () => { await eonRadioPlayer.previous({ explicitUserAction: true }); rerender?.(); });
  studio.querySelector('[data-music-radio-next]')?.addEventListener('click', async () => { await eonRadioPlayer.next({ explicitUserAction: true }); rerender?.(); });
  studio.querySelectorAll('[data-music-radio-track]').forEach((button) => button.addEventListener('click', () => { eonRadioSession.setCurrent(Number(button.dataset.musicRadioTrack)); rerender?.(); }));
  studio.querySelector('[data-music-radio-player]')?.addEventListener('ended', () => { eonRadioSession.next(); rerender?.(); });
  studio.querySelector('[data-music-radio-clear]')?.addEventListener('click', () => { eonRadioPlayer.stop({ explicitUserAction: true }); const result = eonRadioSession.clear({ explicitUserAction: true }); status(result.ok ? 'Private radio session cleared. No audio was deleted from your device.' : result.reason); rerender?.(); });
  studio.querySelector('[data-music-radio-share-track]')?.addEventListener('click', async () => {
    const current = eonRadioSession.getCurrentMedia();
    if (!current?.media) { status('Choose a radio track first.'); return; }
    try {
      const file = typeof File === 'function' && !(current.media instanceof File) ? new File([current.media], current.name, { type: current.type || current.media.type || 'audio/wav' }) : current.media;
      const result = await shareEonLocalMedia({ file, title: 'EON Radio', text: 'Shared explicitly from my private EON Radio session.' }, { userGesture: true });
      status(result.ok ? 'Native share menu opened for the current authorized track. EONAPP cannot claim where you post it.' : 'Native file sharing is unavailable here.');
    } catch (error) { status(String(error?.message || 'Native track sharing could not open.')); }
  });
  studio.querySelector('[data-music-radio-share]')?.addEventListener('click', async () => {
    if (!lastRadioStation) { status('Save a station first.'); return; }
    const handoff = writeEonOutputShareHandoff({ explicitUserAction: true, origin: 'creator-music', remixKind: 'radio-station', title: lastRadioStation.name || 'My EON Radio', audience: 'music listeners', usefulOutcome: 'A private EON Radio station profile was created for EON-generated or user-authorized music.', firstRemixStep: 'Create your own station mood and only add music you generated or have permission to use.' });
    if (!handoff.ok) { status(handoff.reason || 'Could not prepare the station handoff.'); return; }
    await openEonShareSheet({ type: 'eonapp' });
  });
}
