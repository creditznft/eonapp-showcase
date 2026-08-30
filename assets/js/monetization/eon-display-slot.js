import { EON_DISPLAY_AD_PROVIDERS, EON_SPONSORED_SLOT_CATALOG } from './eon-monetization-policy.js';
import { emitMonetizationEvent, fetchMonetizationStatus, readDisplayAdConsent, setDisplayAdConsent } from './eon-monetization-client.js';

const ACTIVE_KEY = '__EON_SPONSORED_SLOT_ACTIVE_RT92__';
const SCRIPT_KEY = '__EON_EXOCLICK_PROVIDER_PROMISE_RT92__';
const freeze = (value) => Object.freeze(value);

function hide(host, reason = '') {
  if (!host) return;
  host.hidden = true;
  host.dataset.eonSponsoredState = reason || 'hidden';
}

function consentCard(host, slotId, environment) {
  host.hidden = false;
  host.dataset.eonSponsoredState = 'consent-required';
  host.innerHTML = `<div class="eon-sponsored-consent"><div><strong>Optional sponsored card</strong><p>Guests and signed-in Free accounts can support EONAPP with a restrained third-party sponsored placement on this screen. It never receives your EONBOT prompt or BYOK key.</p></div><div class="eon-sponsored-actions"><button type="button" data-eon-sponsored-allow>Allow sponsored cards</button><button type="button" data-eon-sponsored-decline>Not now</button><a href="/privacy">Privacy</a></div></div>`;
  host.querySelector('[data-eon-sponsored-allow]')?.addEventListener('click', () => {
    setDisplayAdConsent('allowed', { explicitUserAction: true, environment });
    environment.location?.reload?.();
  }, { once: true });
  host.querySelector('[data-eon-sponsored-decline]')?.addEventListener('click', () => {
    setDisplayAdConsent('denied', { explicitUserAction: true, environment });
    hide(host, 'consent-denied');
    emitMonetizationEvent('slot-hidden', { slot: slotId, reason: 'consent-denied' }, environment);
  }, { once: true });
}

function ensureExoClickProvider(environment) {
  if (environment[SCRIPT_KEY]) return environment[SCRIPT_KEY];
  const provider = EON_DISPLAY_AD_PROVIDERS.exoclick;
  const existing = environment.document.querySelector(`script[src="${provider.script}"]`);
  if (existing && existing.dataset.eonSponsoredProviderReady === 'true') {
    environment[SCRIPT_KEY] = Promise.resolve(existing);
    return environment[SCRIPT_KEY];
  }
  environment[SCRIPT_KEY] = new Promise((resolve, reject) => {
    const script = existing || environment.document.createElement('script');
    if (!existing) {
      script.async = true;
      script.type = 'application/javascript';
      script.src = provider.script;
      script.dataset.eonSponsoredProviderScript = 'exoclick';
      environment.document.head?.append(script);
    }
    const ready = () => {
      script.dataset.eonSponsoredProviderReady = 'true';
      resolve(script);
    };
    if (existing && typeof environment.AdProvider !== 'undefined') return ready();
    script.addEventListener('load', ready, { once: true });
    script.addEventListener('error', () => reject(new Error('exoclick-provider-load-failed')), { once: true });
  }).catch((error) => {
    try { delete environment[SCRIPT_KEY]; } catch { environment[SCRIPT_KEY] = undefined; }
    throw error;
  });
  return environment[SCRIPT_KEY];
}

function mountExoClickZone(host, zone, environment) {
  const provider = EON_DISPLAY_AD_PROVIDERS.exoclick;
  const content = host.querySelector('[data-eon-sponsored-content]');
  if (!content || !zone?.zoneId || !zone?.className) return null;
  const ins = environment.document.createElement('ins');
  ins.className = zone.className;
  ins.dataset.zoneid = zone.zoneId;
  // Defense in depth: ExoClick dashboard filters remain mandatory, but the
  // embed itself also requests only SFW / not-age-verified inventory.
  ins.dataset.blockAdTypes = provider.sfw.blockAdTypes;
  ins.dataset.ex_av = provider.sfw.ageVerification;
  ins.dataset.eonExoclickZone = zone.zoneId;
  content.append(ins);
  const serve = () => {
    const queue = environment.AdProvider = environment.AdProvider || [];
    queue.push({ serve: {} });
  };
  const providerPromise = ensureExoClickProvider(environment).then(() => serve());
  return { ins, zone, providerPromise };
}

function selectExoClickZone(slot, status) {
  const flags = status?.display?.exoclick || {};
  const provider = EON_DISPLAY_AD_PROVIDERS.exoclick;
  const enabled = {
    native: flags.native === true,
    multiformat: flags.multiformat === true,
    outstream: slot.allowOutstream === true && flags.outstream === true
  };
  const order = [slot.preferredFormat, ...(slot.fallbackFormats || [])];
  for (const format of order) {
    if (format && enabled[format] && provider.zones[format]) return provider.zones[format];
  }
  return null;
}

export async function mountEonSponsoredSlot({ slotId = '', host = null, environment = globalThis } = {}) {
  const slot = EON_SPONSORED_SLOT_CATALOG[String(slotId || '')] || null;
  if (!slot || !host || !environment.document) return freeze({ ok: false, reason: 'slot_not_supported' });
  if (environment[ACTIVE_KEY]) { hide(host, 'one-slot-per-view'); return freeze({ ok: false, reason: 'one_slot_per_view' }); }
  const status = await fetchMonetizationStatus({ force: true, environment });
  if (!status?.display?.eligible || status.display.provider !== 'exoclick') {
    hide(host, status?.paidAdFree ? 'paid-ad-free' : status?.reason || 'not-eligible');
    return freeze({ ok: false, reason: host.dataset.eonSponsoredState });
  }
  const consent = readDisplayAdConsent(environment);
  if (consent.state !== 'allowed') {
    if (consent.state === 'denied') { hide(host, 'consent-denied'); return freeze({ ok: false, reason: 'consent-denied' }); }
    consentCard(host, slot.id, environment);
    return freeze({ ok: false, reason: 'consent-required' });
  }
  const zone = selectExoClickZone(slot, status);
  if (!zone) { hide(host, 'no-enabled-format'); return freeze({ ok: false, reason: 'no_enabled_format' }); }
  environment[ACTIVE_KEY] = slot.id;
  host.hidden = false;
  host.dataset.eonSponsoredState = 'loading';
  host.dataset.eonSponsoredFormat = zone.id;
  host.innerHTML = `<div class="eon-sponsored-label">Sponsored</div><div class="eon-sponsored-content" data-eon-sponsored-content aria-label="Sponsored third-party content"></div><div class="eon-sponsored-first-party-cta"><a href="/billing" data-eon-sponsored-upgrade aria-label="View EONAPP paid plans to remove ordinary ads">Go ad-free · View plans</a></div>`;
  const mounted = mountExoClickZone(host, zone, environment);
  if (!mounted) { hide(host, 'mount-failed'); delete environment[ACTIVE_KEY]; return freeze({ ok: false, reason: 'mount_failed' }); }
  emitMonetizationEvent('provider-script-requested', { provider: 'exoclick', slot: slot.id, surface: slot.surface, format: zone.id, zoneId: zone.zoneId }, environment);
  try {
    await mounted.providerPromise;
  } catch {
    hide(host, 'provider-load-failed');
    try { delete environment[ACTIVE_KEY]; } catch { environment[ACTIVE_KEY] = undefined; }
    emitMonetizationEvent('slot-hidden', { provider: 'exoclick', slot: slot.id, surface: slot.surface, format: zone.id, reason: 'provider-load-failed' }, environment);
    return freeze({ ok: false, reason: 'provider_load_failed' });
  }
  host.dataset.eonSponsoredState = 'mounted';
  const timer = environment.setTimeout?.(() => {
    const content = host.querySelector('[data-eon-sponsored-content]');
    const rendered = Boolean(content?.querySelector?.('iframe, [data-ad-status], a[href], img, video'))
      || [...(content?.children || [])].some((child) => child.tagName !== 'SCRIPT' && child !== mounted.ins && (child.childElementCount > 0 || Number(child.clientHeight || 0) > 8));
    const zoneRendered = Boolean(mounted.ins && (mounted.ins.childElementCount > 0 || Number(mounted.ins.clientHeight || 0) > 8));
    if (!rendered && !zoneRendered) {
      hide(host, 'no-fill-or-blocked');
      emitMonetizationEvent('slot-hidden', { provider: 'exoclick', slot: slot.id, surface: slot.surface, format: zone.id, zoneId: zone.zoneId, reason: 'no-fill-or-blocked' }, environment);
    }
  }, 7000);
  return freeze({
    ok: true,
    provider: 'exoclick',
    slot: slot.id,
    surface: slot.surface,
    format: zone.id,
    zoneId: zone.zoneId,
    dispose() {
      if (timer) environment.clearTimeout?.(timer);
      try { delete environment[ACTIVE_KEY]; } catch { environment[ACTIVE_KEY] = undefined; }
      host.replaceChildren();
      hide(host, 'disposed');
    }
  });
}

export async function autoMountEonSponsoredSlot({ environment = globalThis } = {}) {
  const host = environment.document?.querySelector?.('[data-eon-sponsored-slot]');
  if (!host) return freeze({ ok: false, reason: 'no_slot_host' });
  return mountEonSponsoredSlot({ slotId: host.dataset.eonSponsoredSlot, host, environment });
}

if (typeof document !== 'undefined') {
  const boot = () => void autoMountEonSponsoredSlot();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true }); else boot();
}

export default mountEonSponsoredSlot;
