/** W768P — explicit, non-teleporting navigation to the authored My Frontier arrival point. */
import { EON_EXPANSE_W768B_MY_FRONTIER_STATE_SCHEMA } from './eon-expanse-w768b-my-frontier-state.js';
import { deriveEonExpanseW768IVisualFoundation } from './eon-expanse-w768i-my-frontier-visual-model.js';

export const EON_EXPANSE_W768P_NAVIGATION_SCHEMA = 'eon.expanse.my-frontier-navigation.w768p.v1';
const freeze = Object.freeze;
const finite = (value) => Number.isFinite(Number(value)) ? Number(value) : 0;

export function deriveEonExpanseW768PMyFrontierNavigation({ myFrontierState = null, playerPosition = {} } = {}) {
  const unlocked = myFrontierState?.schema === EON_EXPANSE_W768B_MY_FRONTIER_STATE_SCHEMA && myFrontierState.unlocked === true;
  const model = deriveEonExpanseW768IVisualFoundation({ unlocked });
  const central = model.plots.find((entry) => entry.plotId === 'plot-central-command');
  const target = central?.interactionAnchor || null;
  const distance = target ? Math.hypot(finite(playerPosition.x) - target.x, finite(playerPosition.z) - target.z) : Number.POSITIVE_INFINITY;
  const arrived = unlocked && Number.isFinite(distance) && distance <= 7;
  const available = unlocked && Boolean(target) && !arrived;
  const targetToken = target ? `plot-central-command:${Math.round(target.x * 10)}:${Math.round(target.z * 10)}` : '';
  return freeze({
    schema: EON_EXPANSE_W768P_NAVIGATION_SCHEMA,
    visible: unlocked,
    available,
    arrived,
    distance,
    status: !unlocked ? 'locked' : arrived ? 'arrived' : 'route-available',
    detail: !unlocked ? 'My Frontier is still locked.' : arrived ? 'You have reached the authored My Frontier arrival point.' : 'EONBOT can guide the existing player toward My Frontier. No teleport or automatic movement occurs.',
    action: available ? freeze({
      type: 'guide-my-frontier',
      plotId: 'plot-central-command',
      targetToken,
      label: 'EONBOT, guide me to My Frontier',
      explicitUserActionRequired: true,
      automaticMovement: false,
      teleport: false
    }) : null,
    guidance: available ? freeze({
      objective: 'activity:my-frontier-arrival',
      label: 'My Frontier arrival',
      zoneId: 'my-frontier',
      zoneLabel: 'My Frontier',
      target,
      distance,
      active: true,
      nearTarget: false,
      prompt: 'Travel to the authored My Frontier arrival platform.',
      guidance: 'EONBOT route to My Frontier'
    }) : null,
    grantsXp: false,
    mutatesProgression: false,
    privateContentStored: false
  });
}

export function validateEonExpanseW768PNavigationAction(view = null, { explicitUserAction = false, expectedPlotId = '', expectedTargetToken = '' } = {}) {
  if (!explicitUserAction) return freeze({ ok: false, reason: 'explicit-user-action-required' });
  const action = view?.action || null;
  if (!view?.available || action?.type !== 'guide-my-frontier' || !view?.guidance?.target) return freeze({ ok: false, reason: 'my-frontier-guidance-unavailable' });
  if (expectedPlotId && action.plotId !== String(expectedPlotId)) return freeze({ ok: false, reason: 'my-frontier-guidance-plot-changed' });
  if (expectedTargetToken && action.targetToken !== String(expectedTargetToken)) return freeze({ ok: false, reason: 'my-frontier-guidance-target-changed' });
  return freeze({ ok: true, action, guidance: view.guidance, automaticMovement: false, teleport: false, mutatesProgression: false });
}

export default freeze({ EON_EXPANSE_W768P_NAVIGATION_SCHEMA, deriveEonExpanseW768PMyFrontierNavigation, validateEonExpanseW768PNavigationAction });
