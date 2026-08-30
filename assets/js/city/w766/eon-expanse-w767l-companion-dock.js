const freeze = (value) => Object.freeze(value);

export const EON_EXPANSE_W767L_COMPANION_DOCK_SCHEMA = 'eon.city.expanse.companion-dock.w767l.v1';
export const EON_EXPANSE_W767L_DOCK_POSE = freeze({ x: -5.8, y: 0.18, z: 4.2, heading: Math.PI * 0.12 });

export function deriveEonExpanseW767LCompanionDockPresentation({
  expanseActive = false,
  bonded = false,
  transitActive = false,
  guideActive = false
} = {}) {
  const visible = Boolean(expanseActive && bonded);
  const interactive = Boolean(visible && !transitActive && !guideActive);
  return freeze({
    schema: EON_EXPANSE_W767L_COMPANION_DOCK_SCHEMA,
    visible,
    interactive,
    action: interactive ? 'dock-eonbot' : '',
    label: bonded ? 'EONBOT recharge dock' : 'Companion dock offline',
    pose: EON_EXPANSE_W767L_DOCK_POSE,
    grantsXp: false,
    mutatesMissionState: false,
    automaticDocking: false,
    explicitUserActionRequired: true,
    oneCanonicalCompanion: true,
    storesPrivateContent: false
  });
}

export function validateEonExpanseW767LCompanionDockRequest({
  explicitUserAction = false,
  expanseActive = false,
  bonded = false,
  transitActive = false,
  guideActive = false
} = {}) {
  if (!explicitUserAction) return freeze({ ok: false, reason: 'explicit-user-action-required' });
  const presentation = deriveEonExpanseW767LCompanionDockPresentation({ expanseActive, bonded, transitActive, guideActive });
  if (!expanseActive) return freeze({ ok: false, reason: 'expanse-not-active', presentation });
  if (!bonded) return freeze({ ok: false, reason: 'companion-not-bonded', presentation });
  if (transitActive) return freeze({ ok: false, reason: 'expanse-transit-active', presentation });
  if (guideActive) return freeze({ ok: false, reason: 'explicit-guidance-active', presentation });
  return freeze({
    ok: true,
    action: 'dock-eonbot',
    pose: presentation.pose,
    explicitUserAction: true,
    delegatesToCanonicalCompanionBehavior: true,
    grantsXp: false,
    mutatesMissionState: false
  });
}
