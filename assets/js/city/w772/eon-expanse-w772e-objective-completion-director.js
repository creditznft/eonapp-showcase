/** W772E — non-blocking objective/mission completion feedback derived from canonical campaign state. */
import { EON_EXPANSE_W766E_OBJECTIVE_GUIDANCE } from '../w766/eon-expanse-w766e-mission-runtime.js';

const freeze = Object.freeze;
export const EON_EXPANSE_W772E_OBJECTIVE_FEEDBACK_SCHEMA = 'eon.expanse.objective-feedback.w772e.v1';

const snapshot = (campaignBoard = {}) => freeze({
  missionId: String(campaignBoard?.activeMission?.id || ''),
  missionLabel: String(campaignBoard?.activeMission?.label || campaignBoard?.activeMission?.id || ''),
  objectiveId: String(campaignBoard?.activeMission?.currentObjective || ''),
  completedMissionCount: Number(campaignBoard?.completion?.completed || 0),
  campaignComplete: campaignBoard?.completion?.campaignComplete === true
});

const nextObjectiveLabel = (objectiveId = '') => String(EON_EXPANSE_W766E_OBJECTIVE_GUIDANCE[String(objectiveId || '')]?.label || '').trim();

export function createEonExpanseW772EObjectiveCompletionDirector() {
  let previous = null;
  let emittedKey = '';
  const reset = (campaignBoard = null, reason = 'reset') => {
    previous = campaignBoard ? snapshot(campaignBoard) : null;
    emittedKey = '';
    return freeze({ ok: true, reason, seeded: Boolean(previous) });
  };
  const update = (campaignBoard = {}, { expanseActive = false } = {}) => {
    const current = snapshot(campaignBoard);
    if (!previous) {
      previous = current;
      return freeze({ ok: false, reason: 'seeded', current });
    }
    const prior = previous;
    previous = current;
    if (!expanseActive) return freeze({ ok: false, reason: 'expanse-not-active', current });
    if (!prior.objectiveId) return freeze({ ok: false, reason: 'no-prior-objective', current });
    const missionCompleted = current.completedMissionCount > prior.completedMissionCount;
    const objectiveAdvanced = prior.missionId === current.missionId && prior.objectiveId !== current.objectiveId && Boolean(current.objectiveId);
    if (!missionCompleted && !objectiveAdvanced) return freeze({ ok: false, reason: 'no-completion-transition', current });
    const key = missionCompleted
      ? `mission:${prior.missionId}:${current.completedMissionCount}`
      : `objective:${prior.missionId}:${prior.objectiveId}:${current.objectiveId}`;
    if (key === emittedKey) return freeze({ ok: false, reason: 'already-emitted', current });
    emittedKey = key;
    if (missionCompleted) {
      return freeze({
        ok: true,
        type: current.campaignComplete ? 'campaign-complete' : 'mission-complete',
        completedMissionId: prior.missionId,
        card: freeze({
          title: current.campaignComplete ? 'SIGNAL FRONTIER RESTORED' : 'MISSION COMPLETE',
          network: current.campaignComplete ? 'Campaign receipt ready for review' : 'Verified mission progression',
          detail: current.campaignComplete ? 'Return to the Mission Board to review the completed campaign receipt.' : `${prior.missionLabel || prior.missionId} complete. Open the Mission Board for the next operation.`,
          durationMs: 3200
        })
      });
    }
    return freeze({
      ok: true,
      type: 'objective-complete',
      completedObjectiveId: prior.objectiveId,
      nextObjectiveId: current.objectiveId,
      card: freeze({
        title: 'OBJECTIVE COMPLETE',
        network: 'Verified mission progression',
        detail: nextObjectiveLabel(current.objectiveId) ? `Next: ${nextObjectiveLabel(current.objectiveId)}` : 'Open the Mission Board for the next objective.',
        durationMs: 2400
      })
    });
  };
  return freeze({ schema: EON_EXPANSE_W772E_OBJECTIVE_FEEDBACK_SCHEMA, reset, update, getState: () => freeze({ previous, emittedKey }) });
}

export default freeze({ EON_EXPANSE_W772E_OBJECTIVE_FEEDBACK_SCHEMA, createEonExpanseW772EObjectiveCompletionDirector });
