/** RT91 Signal — mission presentation cues; never owns completion or camera runtime. */
export const EON_CITY_RT91_SIGNAL_CINEMATIC_POLISH_SCHEMA = 'eon.city.signal.cinematic-polish.rt91.v1';
const freeze = Object.freeze;
const VALID_BEATS = freeze(['arrival', 'objective-handoff', 'discovery', 'repair', 'completion', 'return']);

export function buildEonCityRt91SignalCinematicCue({ missionId = '', zoneId = '', objective = null, beat = 'objective-handoff', reducedMotion = false } = {}) {
  const resolvedBeat = VALID_BEATS.includes(String(beat)) ? String(beat) : 'objective-handoff';
  const objectiveLabel = String(objective?.label || objective?.id || '').slice(0, 160);
  return freeze({
    schema: EON_CITY_RT91_SIGNAL_CINEMATIC_POLISH_SCHEMA,
    missionId: String(missionId || ''),
    zoneId: String(zoneId || ''),
    beat: resolvedBeat,
    presentation: freeze({
      durationMs: reducedMotion ? 0 : resolvedBeat === 'arrival' ? 1500 : resolvedBeat === 'completion' ? 1200 : 700,
      routePulse: ['objective-handoff', 'return'].includes(resolvedBeat),
      objectiveFocus: Boolean(objectiveLabel),
      environmentAccent: ['arrival', 'discovery', 'repair', 'completion'].includes(resolvedBeat),
      cameraSuggestion: reducedMotion ? 'none' : resolvedBeat === 'arrival' ? 'brief-landmark-reveal' : 'maintain-player-agency',
      audioSuggestion: `signal-${resolvedBeat}`
    }),
    objectiveLabel,
    skippable: true,
    blocksInputAfterCue: false,
    ownsCamera: false,
    ownsAudioContext: false,
    completesObjective: false,
    writesMissionState: false,
    grantsProgression: false
  });
}

export function validateEonCityRt91SignalCinematicCue(cue = {}) {
  const errors = [];
  if (cue.schema !== EON_CITY_RT91_SIGNAL_CINEMATIC_POLISH_SCHEMA || !VALID_BEATS.includes(cue.beat)) errors.push('schema-beat');
  if (!cue.missionId || !cue.zoneId) errors.push('identity');
  if (cue.skippable !== true || cue.blocksInputAfterCue !== false) errors.push('player-agency');
  if (cue.ownsCamera || cue.ownsAudioContext || cue.completesObjective || cue.writesMissionState || cue.grantsProgression) errors.push('authority');
  return freeze({ ok: errors.length === 0, errors: freeze(errors) });
}

export default freeze({ EON_CITY_RT91_SIGNAL_CINEMATIC_POLISH_SCHEMA, buildEonCityRt91SignalCinematicCue, validateEonCityRt91SignalCinematicCue });
