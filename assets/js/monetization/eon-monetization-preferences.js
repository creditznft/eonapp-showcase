

import { fetchMonetizationStatus, readDisplayAdConsent, setDisplayAdConsent } from './eon-monetization-client.js';

const freeze = Object.freeze;

export function installEonMonetizationPreferences({ documentRef = globalThis.document, environment = globalThis } = {}) {
  const host = documentRef?.querySelector?.('[data-eon-monetization-preferences]');
  if (!host) return freeze({ ok: false, reason: 'preferences-host-missing' });
  const statusNode = host.querySelector('[data-eon-sponsored-preference-status]');
  const allow = host.querySelector('[data-eon-sponsored-preference-allow]');
  const disable = host.querySelector('[data-eon-sponsored-preference-disable]');

  const render = async () => {
    const status = await fetchMonetizationStatus({ force: true, environment });
    const consent = readDisplayAdConsent(environment);
    const paid = status?.paidAdFree === true;
    if (statusNode) {
      statusNode.textContent = paid
        ? 'Your current paid entitlement is ordinary-ad-free. EONAPP does not need to mount standard display-ad scripts for this account.'
        : consent.state === 'allowed'
          ? 'Sponsored cards are allowed on selected free-account surfaces. EONBOT chat content, Local AI prompts and BYOK keys are not intentionally supplied to the display-ad provider.'
          : consent.state === 'denied'
            ? 'Sponsored cards are disabled on this browser. You can allow them again here at any time.'
            : 'Sponsored cards are not enabled on this browser until you choose them. Rewarded Sponsor Transmissions and Vexrail are separate systems.';
    }
    if (allow) { allow.hidden = paid; allow.disabled = consent.state === 'allowed'; }
    if (disable) { disable.hidden = paid; disable.disabled = consent.state === 'denied'; }
    return freeze({ ok: true, paid, consent: consent.state });
  };

  allow?.addEventListener('click', async () => {
    setDisplayAdConsent('allowed', { explicitUserAction: true, environment });
    await render();
  });
  disable?.addEventListener('click', async () => {
    setDisplayAdConsent('denied', { explicitUserAction: true, environment });
    await render();
  });
  void render();
  return freeze({ ok: true, render });
}

if (typeof document !== 'undefined') {
  const boot = () => installEonMonetizationPreferences();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true }); else boot();
}

export default installEonMonetizationPreferences;
