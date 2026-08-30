/** W777A — one-shot audio cue truth derived only from forward canonical zone-restoration transitions. */
const freeze = Object.freeze;

export const EON_EXPANSE_W777A_RESTORATION_AUDIO_CUE_SCHEMA = 'eon.expanse.restoration-audio-cue.w777a.v1';

const STAGE_RANK = freeze({ damaged: 0, restoring: 1, restored: 2 });
const safeStage = (value = '') => Object.hasOwn(STAGE_RANK, String(value)) ? String(value) : 'damaged';
const safeZone = (value = '') => String(value || '').replace(/[^a-z0-9_-]+/gi, '').slice(0, 80);

export function createEonExpanseW777ARestorationAudioCueDirector() {
  let seeded = false;
  let previous = new Map();
  let lastCueKey = '';

  const snapshot = (board = {}) => new Map((Array.isArray(board?.rows) ? board.rows : [])
    .map((row) => [safeZone(row?.zoneId), safeStage(row?.artStage)])
    .filter(([zoneId]) => Boolean(zoneId)));

  return freeze({
    schema: EON_EXPANSE_W777A_RESTORATION_AUDIO_CUE_SCHEMA,
    update(board = {}, { expanseActive = false, currentZoneId = '' } = {}) {
      const next = snapshot(board);
      if (!seeded || !expanseActive) {
        seeded = true;
        previous = next;
        return freeze({ ok: true, cue: null, seeded: true, reason: expanseActive ? 'initial-state-seeded' : 'world-inactive' });
      }
      const currentZone = safeZone(currentZoneId);
      const candidates = [];
      for (const [zoneId, nextStage] of next) {
        const priorStage = safeStage(previous.get(zoneId));
        if (STAGE_RANK[nextStage] > STAGE_RANK[priorStage]) candidates.push(freeze({ zoneId, priorStage, nextStage }));
      }
      previous = next;
      const transition = candidates.find((entry) => entry.zoneId === currentZone) || candidates[0] || null;
      if (!transition) return freeze({ ok: true, cue: null, reason: 'no-forward-restoration-transition' });
      const cueKey = `${transition.zoneId}:${transition.nextStage}`;
      if (cueKey === lastCueKey) return freeze({ ok: true, cue: null, reason: 'cue-already-emitted' });
      lastCueKey = cueKey;
      return freeze({
        ok: true,
        cue: freeze({
          schema: EON_EXPANSE_W777A_RESTORATION_AUDIO_CUE_SCHEMA,
          cueKey,
          zoneId: transition.zoneId,
          priorStage: transition.priorStage,
          nextStage: transition.nextStage,
          cueType: transition.nextStage === 'restored' ? 'zone-restored' : 'restoration-progress',
          durationMs: transition.nextStage === 'restored' ? 520 : 360,
          gain: transition.nextStage === 'restored' ? 0.055 : 0.035,
          requiresStartedAudio: true,
          startsAudioAutomatically: false,
          mutatesProgression: false,
          awardsXp: false,
          storesPrivateContent: false
        })
      });
    },
    reset(board = {}) {
      previous = snapshot(board);
      seeded = true;
      lastCueKey = '';
      return freeze({ ok: true });
    },
    getSummary() {
      return freeze({ schema: EON_EXPANSE_W777A_RESTORATION_AUDIO_CUE_SCHEMA, seeded, trackedZones: previous.size, lastCueKey, mutatesProgression: false });
    }
  });
}

export default freeze({ EON_EXPANSE_W777A_RESTORATION_AUDIO_CUE_SCHEMA, createEonExpanseW777ARestorationAudioCueDirector });
