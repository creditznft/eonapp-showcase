/** W659F — explicit EONBOT state and dock target controller. */
import { getEonCityW659fFunctionalAsset } from './eon-city-w659f-functional-asset-manifest.js';

export const EON_CITY_W659F_EONBOT_STATES = Object.freeze(['follow', 'wait', 'explore', 'inspect', 'return', 'dock', 'speak', 'open']);
export const EON_CITY_W659F_EONBOT_CONTROLLER_SCHEMA = 'eon.city.w659f.eonbot-controller.v1';
const freeze = (value) => Object.freeze(value);
const dockPoint = getEonCityW659fFunctionalAsset('eonbot-companion-dock')?.dockPoint || freeze({ x: -10.38, y: 0.82, z: -5.22, heading: Math.PI / 2 });

export function createEonCityW659fEonbotController({ now = () => Date.now() } = {}) {
  let state = 'follow';
  let until = 0;
  let reason = 'default-follow';
  let revision = 0;
  const setState = (next = 'follow', { durationMs = 0, explicitUserAction = false, source = 'runtime' } = {}) => {
    const normalized = String(next || '').trim().toLowerCase();
    if (!EON_CITY_W659F_EONBOT_STATES.includes(normalized)) return freeze({ ok: false, reason: 'invalid-state', state });
    if (['dock', 'open', 'explore'].includes(normalized) && explicitUserAction !== true) return freeze({ ok: false, reason: 'explicit-user-action-required', state });
    state = normalized;
    until = durationMs > 0 ? now() + Math.min(15_000, Math.max(240, Number(durationMs) || 0)) : 0;
    reason = String(source || 'runtime').slice(0, 80);
    revision += 1;
    return freeze({ ok: true, state, until, revision, localOnly: true, autonomousAgent: false });
  };
  const getSnapshot = () => {
    if (state === 'return' && until > 0 && now() >= until) {
      state = 'follow';
      until = 0;
      reason = 'returned-to-follow';
      revision += 1;
    } else if (until > 0 && now() >= until && !['dock', 'wait'].includes(state)) {
      state = 'return';
      until = now() + 900;
      reason = 'bounded-state-expired';
      revision += 1;
    }
    return freeze({ schema: EON_CITY_W659F_EONBOT_CONTROLLER_SCHEMA, state, until, reason, revision, dockPoint, targetHeight: 0.82, minFollowDistance: 1.05, maxFollowDistance: 4.8, localOnly: true, autonomousAgent: false, microphoneRequested: false, remoteNetwork: false });
  };
  return freeze({ setState, getSnapshot, dockPoint });
}
