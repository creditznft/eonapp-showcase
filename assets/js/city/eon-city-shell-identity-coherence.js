export const EON_CITY_SHELL_IDENTITY_COHERENCE_SCHEMA = 'eon.city.shell-identity-coherence.w670.v1';

export function getEonCityShellIdentityLabel(identityState = '') {
  return String(identityState || '').trim().toLowerCase() === 'signed-in'
    ? 'Open profile and settings'
    : 'Sign in to EONAPP';
}

export function applyEonCityShellIdentityCoherence({ documentRef = globalThis.document } = {}) {
  const body = documentRef?.body;
  const shortcut = documentRef?.querySelector?.('[data-eon-mobile-profile]');
  if (!body || !shortcut) {
    return Object.freeze({ ok: false, reason: 'city-shell-identity-control-unavailable' });
  }

  const signedIn = body.dataset.eonIdentityState === 'signed-in';
  const label = getEonCityShellIdentityLabel(signedIn ? 'signed-in' : 'guest');
  shortcut.dataset.identityState = signedIn ? 'signed-in' : 'guest';
  shortcut.setAttribute('aria-label', label);
  shortcut.setAttribute('title', signedIn ? 'Profile and settings' : 'Sign in');

  return Object.freeze({
    ok: true,
    schema: EON_CITY_SHELL_IDENTITY_COHERENCE_SCHEMA,
    signedIn,
    label
  });
}

export function installEonCityShellIdentityCoherence({
  environment = globalThis,
  documentRef = environment?.document || globalThis.document
} = {}) {
  if (!documentRef?.body) {
    return Object.freeze({ ok: false, reason: 'city-shell-document-unavailable', dispose() {} });
  }
  if (documentRef.documentElement?.dataset?.eonCityShellIdentityCoherence === '1') {
    return Object.freeze({ ok: false, reason: 'city-shell-identity-coherence-already-installed', dispose() {} });
  }

  documentRef.documentElement.dataset.eonCityShellIdentityCoherence = '1';
  let disposed = false;
  const apply = () => {
    if (disposed) return;
    applyEonCityShellIdentityCoherence({ documentRef });
  };

  apply();
  environment.requestAnimationFrame?.(() => environment.requestAnimationFrame?.(apply));
  const timer = environment.setTimeout?.(apply, 1200);
  const Observer = environment.MutationObserver;
  const observer = typeof Observer === 'function'
    ? new Observer((records = []) => {
        if (records.some((record) => record.type === 'attributes' || record.type === 'childList')) apply();
      })
    : null;
  observer?.observe?.(documentRef.body, {
    attributes: true,
    attributeFilter: ['data-eon-identity-state'],
    childList: true,
    subtree: true
  });

  return Object.freeze({
    ok: true,
    schema: EON_CITY_SHELL_IDENTITY_COHERENCE_SCHEMA,
    apply,
    dispose() {
      if (disposed) return;
      disposed = true;
      observer?.disconnect?.();
      if (timer) environment.clearTimeout?.(timer);
      delete documentRef.documentElement.dataset.eonCityShellIdentityCoherence;
    }
  });
}

if (globalThis.document?.body) {
  globalThis.EONCityShellIdentityCoherence = installEonCityShellIdentityCoherence({
    environment: globalThis,
    documentRef: globalThis.document
  });
}

export default Object.freeze({
  EON_CITY_SHELL_IDENTITY_COHERENCE_SCHEMA,
  getEonCityShellIdentityLabel,
  applyEonCityShellIdentityCoherence,
  installEonCityShellIdentityCoherence
});
