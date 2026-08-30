/**
 * Institutional Direct BYOK adapter — ElevenLabs Music v2.
 *
 * The browser never calls ElevenLabs directly. The paired loopback Creator
 * Companion injects the OS-vault credential and performs one reviewed request.
 * This first rail intentionally excludes uploads, inpainting, reference songs,
 * composition-plan mutation, automatic retries and background generation.
 */

const freeze = Object.freeze;
const MAX_PROMPT_CHARS = 4100;
const MIN_DURATION_MS = 3_000;
const MAX_DURATION_MS = 600_000;
const EON_UI_MAX_DURATION_MS = 180_000;
const OUTPUT_FORMAT = 'mp3_48000_192';
const CONTENT_TYPE = 'application/json';

function boundedDuration(value) {
  const numeric = Math.round(Number(value || 0));
  if (!Number.isFinite(numeric)) return 30_000;
  return Math.max(MIN_DURATION_MS, Math.min(EON_UI_MAX_DURATION_MS, numeric));
}

export function validateElevenLabsMusicInput(job = {}) {
  const prompt = String(job?.input?.prompt || '').trim();
  if (!prompt || prompt.length > MAX_PROMPT_CHARS) return freeze({ ok: false, reason: 'elevenlabs-music-prompt-rejected' });
  if (job?.reference) return freeze({ ok: false, reason: 'elevenlabs-music-reference-audio-not-supported' });
  if (job?.input?.composition_plan || job?.input?.compositionPlan || job?.input?.source_audio || job?.input?.sourceAudio) {
    return freeze({ ok: false, reason: 'elevenlabs-music-advanced-input-not-supported' });
  }
  const requested = Math.round(Number(job?.input?.durationMs || job?.input?.music_length_ms || 30_000));
  if (!Number.isFinite(requested) || requested < MIN_DURATION_MS || requested > EON_UI_MAX_DURATION_MS) {
    return freeze({ ok: false, reason: 'elevenlabs-music-duration-rejected' });
  }
  return freeze({
    ok: true,
    prompt,
    durationMs: boundedDuration(requested),
    instrumental: job?.input?.instrumental === true || job?.input?.force_instrumental === true
  });
}

export function buildElevenLabsMusicComposeRequest(job = {}, model = {}, credential = '') {
  const valid = validateElevenLabsMusicInput(job);
  if (!valid.ok) throw new Error(valid.reason);
  if (String(model?.remoteId || '') !== 'music_v2') throw new Error('elevenlabs-music-v2-reviewed-model-required');
  const key = String(credential || '').trim();
  if (key.length < 8 || key.length > 512 || /[\r\n]/.test(key)) throw new Error('elevenlabs-credential-rejected');
  return freeze({
    method: 'POST',
    url: `https://api.elevenlabs.io/v1/music?output_format=${OUTPUT_FORMAT}`,
    headers: freeze({
      Accept: 'audio/mpeg',
      'Content-Type': CONTENT_TYPE,
      'xi-api-key': key
    }),
    body: JSON.stringify({
      prompt: valid.prompt,
      music_length_ms: valid.durationMs,
      model_id: 'music_v2',
      force_instrumental: valid.instrumental,
      store_for_inpainting: false,
      sign_with_c2pa: true
    })
  });
}

export function getElevenLabsMusicAdapterTruth() {
  return freeze({
    providerId: 'elevenlabs',
    mediaKind: 'music',
    modelId: 'music_v2',
    endpoint: 'https://api.elevenlabs.io/v1/music',
    promptMaxChars: MAX_PROMPT_CHARS,
    providerDurationMinMs: MIN_DURATION_MS,
    providerDurationMaxMs: MAX_DURATION_MS,
    eonUiDurationMaxMs: EON_UI_MAX_DURATION_MS,
    outputFormat: OUTPUT_FORMAT,
    referenceAudioUpload: false,
    inpainting: false,
    compositionPlans: false,
    automaticRetry: false,
    supportsCancel: false,
    c2paRequested: true,
    eonappServerProxy: false,
    browserCredentialPersistence: false,
    realProviderProofComplete: false
  });
}
