const freeze = (value) => Object.freeze(value);

export const EON_EXPANSE_W767A_COMPANION_SCHEMA = 'eon.city.expanse.companion-continuity.w767a.v1';
export const EON_EXPANSE_W767A_COMPANION_MISSION_ID = 'companion-in-the-static';
export const EON_EXPANSE_W767A_RESCUE_POSE = freeze({ x: 5.4, y: 0.92, z: 3.2, heading: Math.PI * 0.82 });
export const EON_EXPANSE_W767A_SIGNAL_CORE_POSE = freeze({ x: 7.35, y: 0.72, z: 2.1 });
export const EON_EXPANSE_W767A_COMPANION_PHASES = freeze({
  LOST: 'lost',
  SIGNAL_DETECTED: 'signal-detected',
  SCANNED: 'scanned',
  CORE_RECOVERED: 'core-recovered',
  BONDED: 'bonded'
});

const objectiveSet = (missionLedger = {}) => new Set(
  missionLedger?.missions?.[EON_EXPANSE_W767A_COMPANION_MISSION_ID]?.completedObjectives || []
);

export function deriveEonExpanseW767ACompanionState({ missionLedger = null, worldMode = 'COMMAND_HUB', transitState = null } = {}) {
  const completed = objectiveSet(missionLedger);
  const missionCompleted = missionLedger?.completedMissions?.includes?.(EON_EXPANSE_W767A_COMPANION_MISSION_ID) === true
    || missionLedger?.missions?.[EON_EXPANSE_W767A_COMPANION_MISSION_ID]?.status === 'completed';
  const bonded = missionCompleted || completed.has('restore-companion-link');
  const coreRecovered = bonded || completed.has('recover-signal-core');
  const scanned = coreRecovered || completed.has('scan-dormant-eonbot');
  const signalDetected = scanned || completed.has('detect-companion-signal');
  const phase = bonded ? EON_EXPANSE_W767A_COMPANION_PHASES.BONDED
    : coreRecovered ? EON_EXPANSE_W767A_COMPANION_PHASES.CORE_RECOVERED
      : scanned ? EON_EXPANSE_W767A_COMPANION_PHASES.SCANNED
        : signalDetected ? EON_EXPANSE_W767A_COMPANION_PHASES.SIGNAL_DETECTED
          : EON_EXPANSE_W767A_COMPANION_PHASES.LOST;
  const expanseActive = worldMode === 'EXPANSE_ACTIVE' || worldMode === 'EXPANSE_LOADING' || worldMode === 'RETURNING_TO_HUB';
  const transitActive = transitState?.status === 'active';
  const nextAction = phase === EON_EXPANSE_W767A_COMPANION_PHASES.SIGNAL_DETECTED ? 'scan-dormant-eonbot'
    : phase === EON_EXPANSE_W767A_COMPANION_PHASES.SCANNED ? 'recover-companion-signal-core'
      : phase === EON_EXPANSE_W767A_COMPANION_PHASES.CORE_RECOVERED ? 'restore-companion-link'
        : '';
  const nextObjective = phase === EON_EXPANSE_W767A_COMPANION_PHASES.LOST ? 'detect-companion-signal'
    : phase === EON_EXPANSE_W767A_COMPANION_PHASES.SIGNAL_DETECTED ? 'scan-dormant-eonbot'
      : phase === EON_EXPANSE_W767A_COMPANION_PHASES.SCANNED ? 'recover-signal-core'
        : phase === EON_EXPANSE_W767A_COMPANION_PHASES.CORE_RECOVERED ? 'restore-companion-link'
          : '';
  const label = bonded ? 'EONBOT linked'
    : coreRecovered ? 'Signal core recovered'
      : scanned ? 'EONBOT scan complete'
        : signalDetected ? 'Companion signal detected'
          : 'Companion signal unavailable';
  return freeze({
    schema: EON_EXPANSE_W767A_COMPANION_SCHEMA,
    phase,
    bonded,
    signalDetected,
    scanned,
    coreRecovered,
    nextAction,
    nextObjective,
    label,
    expanseActive,
    visible: worldMode === 'COMMAND_HUB' || (expanseActive && signalDetected),
    rescuePresentationVisible: expanseActive && !bonded,
    movementMode: worldMode === 'COMMAND_HUB' ? 'hub-companion'
      : !bonded ? 'dormant-rescue'
        : transitActive ? 'transit-formation'
          : 'formation-follow',
    rescuePose: EON_EXPANSE_W767A_RESCUE_POSE,
    signalCorePose: EON_EXPANSE_W767A_SIGNAL_CORE_POSE,
    privateContentStored: false,
    oneCanonicalCompanion: true
  });
}

export function validateEonExpanseW767ACompanionState(state = {}) {
  const errors = [];
  if (state?.schema !== EON_EXPANSE_W767A_COMPANION_SCHEMA) errors.push('schema-invalid');
  if (!Object.values(EON_EXPANSE_W767A_COMPANION_PHASES).includes(state?.phase)) errors.push('phase-invalid');
  if (state?.privateContentStored) errors.push('private-content-forbidden');
  if (state?.oneCanonicalCompanion !== true) errors.push('canonical-companion-required');
  if (state?.bonded && state?.phase !== EON_EXPANSE_W767A_COMPANION_PHASES.BONDED) errors.push('bond-phase-invalid');
  return freeze({ ok: errors.length === 0, errors: freeze(errors) });
}
