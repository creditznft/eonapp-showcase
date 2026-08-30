export const EON_AUTO_DJ_SCHEMA = 'eonapp.creator.auto-dj.v1';

function n(value, fallback = 0) { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : fallback; }
function clean(value = '') { return String(value || '').replace(/\s+/g, ' ').trim().slice(0, 160); }
function normalizeTrack(track = {}, index = 0) {
  return Object.freeze({
    id: clean(track.id || `track-${index + 1}`),
    title: clean(track.title || `Track ${index + 1}`),
    bpm: Math.max(40, Math.min(240, n(track.bpm, 120))),
    key: clean(track.key || ''),
    energy: Math.max(0, Math.min(1, n(track.energy, 0.5))),
    durationSec: Math.max(5, n(track.durationSec, 180)),
    source: clean(track.source || 'user-authorized')
  });
}

function transitionScore(a, b) {
  const bpmDistance = Math.abs(a.bpm - b.bpm) / Math.max(a.bpm, b.bpm, 1);
  const energyDistance = Math.abs(a.energy - b.energy);
  const keyBonus = a.key && b.key && a.key.toLowerCase() === b.key.toLowerCase() ? 0.16 : 0;
  return 1 - Math.min(1, bpmDistance * 1.8 + energyDistance * 0.55) + keyBonus;
}

export function buildAutoDjSetPlan(tracks = [], options = {}) {
  const normalized = (Array.isArray(tracks) ? tracks : []).map(normalizeTrack).filter((track) => track.id);
  if (!normalized.length) return Object.freeze({ schema: EON_AUTO_DJ_SCHEMA, ok: false, reason: 'tracks-required', sequence: Object.freeze([]), transitions: Object.freeze([]) });
  const remaining = normalized.slice();
  const start = String(options.energyArc || 'rise') === 'fall'
    ? remaining.sort((a, b) => b.energy - a.energy)[0]
    : remaining.sort((a, b) => a.energy - b.energy)[0];
  const sequence = [start];
  remaining.splice(remaining.findIndex((track) => track.id === start.id), 1);
  while (remaining.length) {
    const current = sequence.at(-1);
    remaining.sort((a, b) => transitionScore(current, b) - transitionScore(current, a));
    sequence.push(remaining.shift());
  }
  const transitions = sequence.slice(0, -1).map((from, index) => {
    const to = sequence[index + 1];
    const bpmDelta = Math.round((to.bpm - from.bpm) * 10) / 10;
    return Object.freeze({
      from: from.id,
      to: to.id,
      compatibility: Math.max(0, Math.min(1, transitionScore(from, to))),
      crossfadeSec: Math.max(4, Math.min(16, n(options.crossfadeSec, 8))),
      bpmDelta,
      suggestion: Math.abs(bpmDelta) <= 4 ? 'metadata-compatible-crossfade-preview' : 'crossfade-preview-with-clean-transition',
      beatMatchingApplied: false,
      tempoStretchApplied: false
    });
  });
  return Object.freeze({
    schema: EON_AUTO_DJ_SCHEMA,
    ok: true,
    sequence: Object.freeze(sequence),
    transitions: Object.freeze(transitions),
    renderState: 'plan-only',
    rightsBoundary: 'user-authorized-or-eon-generated-audio-only',
    beatMatchingApplied: false,
    tempoStretchApplied: false,
    stemSeparationApplied: false,
    renderedMixExport: false
  });
}

export function getEonAutoDjPlanTruth() {
  return Object.freeze({
    schema: EON_AUTO_DJ_SCHEMA,
    metadataSequencingOnly: true,
    bpmMetadataMayInfluenceOrder: true,
    energyMetadataMayInfluenceOrder: true,
    beatMatchingApplied: false,
    tempoStretchApplied: false,
    stemSeparationApplied: false,
    renderedMixExport: false,
    providerCalled: false,
    audioUploaded: false
  });
}
