export const EON_RADIO_NEXT_TRACK_SCHEMA = 'eonapp.creator.radio-next-track-plan.v1';

const freeze = (value) => Object.freeze(value);
const ARRANGEMENT_ARCS = freeze([
  freeze({ id: 'arrival', label: 'Arrival', direction: 'open spaciously, establish the station identity, then land on a memorable motif' }),
  freeze({ id: 'lift', label: 'Lift', direction: 'build steadily from a restrained opening into a brighter, more propulsive middle section' }),
  freeze({ id: 'peak', label: 'Peak', direction: 'reach the station’s strongest energy early enough to sustain a confident peak without becoming harsh' }),
  freeze({ id: 'glide', label: 'Glide', direction: 'keep momentum smooth and hypnotic, with evolving texture and a clean transition-friendly ending' }),
  freeze({ id: 'comedown', label: 'Come down', direction: 'start with familiar station colors, reduce density gradually, and finish warm and resolved' })
]);

function clean(value = '', max = 360) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, max);
}

function finiteIteration(value = 0) {
  const parsed = Number.parseInt(String(value ?? 0), 10);
  return Number.isFinite(parsed) ? Math.max(0, Math.min(parsed, 9999)) : 0;
}

function describeEnergy(value) {
  const energy = Math.max(0, Math.min(1, Number(value ?? 0.55)));
  if (energy <= 0.34) return 'calm, spacious energy';
  if (energy >= 0.72) return 'high, driving energy';
  return 'balanced, steadily moving energy';
}

function describeVocals(value = 'mixed') {
  const normalized = clean(value, 40).toLowerCase();
  if (normalized === 'instrumental') return 'instrumental; do not require vocals';
  if (normalized === 'vocal' || normalized === 'vocal-forward') return 'vocal-forward, while preserving musical space';
  return 'mixed vocal/instrumental balance; vocals are optional';
}

export function buildEonRadioNextTrackPlan(station = {}, options = {}) {
  const stationPrompt = clean(station?.prompt || station?.description || '', 360);
  if (!stationPrompt) {
    return freeze({ ok: false, reason: 'station-description-required', plan: null });
  }

  const iteration = finiteIteration(options.iteration);
  const arc = ARRANGEMENT_ARCS[iteration % ARRANGEMENT_ARCS.length];
  const genres = (Array.isArray(station?.genres) ? station.genres : [])
    .map((value) => clean(value, 40))
    .filter(Boolean)
    .slice(0, 4);
  const genreText = genres.length ? genres.join(', ') : 'station-defined style';
  const stationName = clean(station?.name || 'My EON Radio', 80);
  const energy = describeEnergy(station?.energy);
  const vocals = describeVocals(station?.vocalPreference);

  const prompt = clean([
    `Create one original track for the EON Radio station “${stationName}”.`,
    `Station direction: ${stationPrompt}.`,
    `Style: ${genreText}; ${energy}; ${vocals}.`,
    `Arrangement arc — ${arc.label}: ${arc.direction}.`,
    'Make this track distinct from the previous one while keeping a recognizable station identity. Produce original music; do not imitate a named living artist or copy an existing recording.'
  ].join(' '), 1100);

  return freeze({
    ok: true,
    reason: null,
    plan: freeze({
      schema: EON_RADIO_NEXT_TRACK_SCHEMA,
      stationId: clean(station?.id || '', 100),
      stationName,
      iteration,
      arcId: arc.id,
      arcLabel: arc.label,
      prompt,
      providerCalled: false,
      automaticGeneration: false,
      automaticPaidRequest: false,
      automaticLocalCompute: false,
      commercialCatalogueAccess: false,
      stationPromptPersistedByPlanner: false,
      generatedAudio: false,
      requiresSeparateGenerateAction: true
    })
  });
}

export function getEonRadioNextTrackTruth() {
  return freeze({
    schema: EON_RADIO_NEXT_TRACK_SCHEMA,
    localPlanningOnly: true,
    providerCalled: false,
    automaticGeneration: false,
    automaticPaidRequest: false,
    automaticLocalCompute: false,
    commercialCatalogueAccess: false,
    stationPromptPersistedByPlanner: false,
    generatedAudio: false,
    requiresSeparateGenerateAction: true,
    maxPromptChars: 1100,
    arrangementArcCount: ARRANGEMENT_ARCS.length
  });
}

export default freeze({ EON_RADIO_NEXT_TRACK_SCHEMA, buildEonRadioNextTrackPlan, getEonRadioNextTrackTruth });
