import { deriveEonExpanseR06FirstMinuteGuide } from '../r06/eon-expanse-r06-flagship-experience.js';

const freeze = (value) => Object.freeze(value);
const finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;

export const EON_EXPANSE_W767F_ONBOARDING_SCHEMA = 'eon.city.expanse.onboarding-director.w767f.v2';

const emptyChecklist = () => freeze({
  locationExplained: false,
  firstGoalVisible: false,
  companionTargetExplained: false,
  mapControlPresented: false,
  returnControlPresented: false
});

const inactiveState = (status = 'idle') => freeze({
  schema: EON_EXPANSE_W767F_ONBOARDING_SCHEMA,
  active: false,
  status,
  stepId: '',
  title: '',
  detail: '',
  shortcut: '',
  elapsedMs: 0,
  mapOpened: false,
  checklist: emptyChecklist(),
  acceptanceReady: false,
  certifiedWithinTarget: false,
  privateContentStored: false
});

export function createEonExpanseW767FOnboardingDirector({
  now = Date.now,
  durationMs = 60000,
  clarityTargetMs = 30000
} = {}) {
  let startedAt = 0;
  let mapOpened = false;
  let certification = null;
  let state = inactiveState();

  const project = ({ companion = {}, guidance = {}, expanseActive = true, at = now() } = {}) => {
    if (!state.active || !expanseActive) return state;
    const elapsedMs = Math.max(0, finite(at, now()) - startedAt);
    const checklist = freeze({
      locationExplained: true,
      firstGoalVisible: Boolean(guidance?.active && (guidance?.objective || guidance?.label || guidance?.prompt)),
      companionTargetExplained: Boolean(companion?.bonded || companion?.signalDetected || companion?.nextAction),
      mapControlPresented: true,
      returnControlPresented: true
    });
    const acceptanceReady = Object.values(checklist).every(Boolean);
    const targetMs = Math.max(5000, finite(clarityTargetMs, 30000));
    if (acceptanceReady && !certification) {
      certification = freeze({ ok: elapsedMs <= targetMs, elapsedMs, checklist, targetMs });
    }
    if (elapsedMs >= Math.max(15000, finite(durationMs, 60000))) {
      state = freeze({
        ...inactiveState('time-window-complete'),
        elapsedMs,
        mapOpened,
        checklist,
        acceptanceReady,
        certifiedWithinTarget: certification?.ok === true
      });
      return state;
    }

    const copy = deriveEonExpanseR06FirstMinuteGuide({ companion, guidance, mapOpened });
    const stepId = copy.stepId;
    state = freeze({
      schema: EON_EXPANSE_W767F_ONBOARDING_SCHEMA,
      active: true,
      status: 'active',
      stepId,
      title: copy.title,
      detail: copy.detail,
      shortcut: copy.shortcut,
      elapsedMs,
      mapOpened,
      checklist,
      acceptanceReady,
      certifiedWithinTarget: certification?.ok === true,
      privateContentStored: false
    });
    return state;
  };

  return freeze({
    begin(context = {}) {
      startedAt = finite(now(), Date.now());
      mapOpened = false;
      certification = null;
      state = freeze({ ...inactiveState('active'), active: true, status: 'active' });
      return project({ ...context, at: startedAt, expanseActive: true });
    },
    update(context = {}) { return project(context); },
    recordMapOpened({ explicitUserAction = false } = {}) {
      if (!explicitUserAction) return freeze({ ok: false, reason: 'explicit-user-action-required', state });
      mapOpened = true;
      if (state.active) state = freeze({ ...state, mapOpened: true });
      return freeze({ ok: true, state });
    },
    dismiss({ explicitUserAction = false } = {}) {
      if (!explicitUserAction) return freeze({ ok: false, reason: 'explicit-user-action-required', state });
      state = freeze({
        ...inactiveState('dismissed'),
        mapOpened,
        checklist: state.checklist,
        acceptanceReady: state.acceptanceReady,
        certifiedWithinTarget: certification?.ok === true
      });
      return freeze({ ok: true, state });
    },
    end(reason = 'expanse-ended') {
      state = freeze({
        ...inactiveState(String(reason || 'expanse-ended')),
        mapOpened,
        checklist: state.checklist,
        acceptanceReady: state.acceptanceReady,
        certifiedWithinTarget: certification?.ok === true
      });
      return state;
    },
    getState() { return state; },
    certify() {
      return freeze({
        schema: EON_EXPANSE_W767F_ONBOARDING_SCHEMA,
        ok: certification?.ok === true,
        elapsedMs: certification?.elapsedMs ?? null,
        targetMs: certification?.targetMs ?? Math.max(5000, finite(clarityTargetMs, 30000)),
        checklist: certification?.checklist || state.checklist,
        mapOpened: state.mapOpened,
        privateContentStored: false
      });
    }
  });
}
