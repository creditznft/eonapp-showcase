import { EON_WORKLOAD_KINDS, getEonWorkloadGovernor } from '../runtime/eon-workload-governor.js';

export const LOCAL_MEDIA_WORKLOAD_ADMISSION_SCHEMA = 'eon.local-ai.media-workload-admission.rt90.v1';

const KIND_MAP = Object.freeze({
  image: EON_WORKLOAD_KINDS.IMAGE_GENERATION,
  video: EON_WORKLOAD_KINDS.VIDEO_GENERATION,
  'image-generation': EON_WORKLOAD_KINDS.IMAGE_GENERATION,
  'video-generation': EON_WORKLOAD_KINDS.VIDEO_GENERATION
});

function normalizeKind(value = '') {
  return KIND_MAP[String(value || '').trim().toLowerCase()] || '';
}

function result(value = {}) {
  return Object.freeze({ schema: LOCAL_MEDIA_WORKLOAD_ADMISSION_SCHEMA, ...value });
}

export function getLocalMediaWorkloadKind(value = '') {
  return normalizeKind(value);
}

export async function acquireLocalMediaWorkload(kindInput, {
  governor = getEonWorkloadGovernor(),
  source = 'local-media',
  label = '',
  confirmPauseCity = async () => false
} = {}) {
  const kind = normalizeKind(kindInput);
  if (!kind) return result({ ok: false, error: 'unsupported-media-workload', lease: null });
  if (!governor || typeof governor.acquire !== 'function') return result({ ok: false, error: 'workload-governor-unavailable', lease: null });
  const options = {
    source: String(source || 'local-media').slice(0, 80),
    label: String(label || (kind === EON_WORKLOAD_KINDS.IMAGE_GENERATION ? 'Local image generation' : 'Local video generation')).slice(0, 96),
    userInitiated: true
  };

  let acquired = governor.acquire(kind, options);
  if (acquired?.ok) return result({ ok: true, lease: acquired.lease, decision: acquired.decision, cityPauseApproved: false });
  const decision = acquired?.decision || null;
  if (decision?.userChoiceRequired !== true || decision?.requiredAction !== 'city:pause') {
    return result({ ok: false, error: decision?.reason || 'workload-not-admitted', lease: null, decision });
  }

  let approved = false;
  try {
    approved = await confirmPauseCity(Object.freeze({
      kind,
      reason: decision.reason,
      action: decision.requiredAction,
      description: decision.requiredActionDetail || 'Pause EON City while this heavy local job runs.'
    })) === true;
  } catch {}
  if (!approved) return result({ ok: false, cancelled: true, error: 'city-pause-not-approved', lease: null, decision });

  acquired = governor.acquire(kind, { ...options, confirmPreemptCity: true });
  if (!acquired?.ok) return result({ ok: false, error: acquired?.decision?.reason || 'workload-not-admitted-after-confirmation', lease: null, decision: acquired?.decision || decision });
  return result({ ok: true, lease: acquired.lease, decision: acquired.decision, cityPauseApproved: true });
}

export function releaseLocalMediaWorkload(admission, reason = 'completed') {
  if (typeof admission?.lease?.release !== 'function') return false;
  try { return admission.lease.release(String(reason || 'completed').slice(0, 80)); } catch { return false; }
}
