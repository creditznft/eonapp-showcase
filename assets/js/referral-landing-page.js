import { captureShareAttribution } from './utils/share-attribution.js';
import { extractSignedToken, verifySignedShareToken } from './utils/signed-share-link.js';
import { captureSignedReferralFromCurrentLocation } from './utils/referral-par.js';
import { saveIncomingRealmShare } from './utils/realm-share-runtime.js';
import { EON_REALM_RELIC_PASSPORT_EVENTS, awardLocalRealmShareRelic } from './realm-relic/eon-realm-relic-passport.js';

const status = document.getElementById('referral-status');
const detail = document.getElementById('referral-detail');
const continueLink = document.getElementById('referral-continue');

function setState(title, text, mode = '') {
  if (status) status.textContent = title;
  if (detail) detail.textContent = text;
  document.body.dataset.state = mode;
}

function hasRetiredAliasPath() {
  return /^\/(?:r|m)\/[^/?#]+/i.test(window.location.pathname || '');
}

async function boot() {
  const token = extractSignedToken(window.location.href);
  if (!token) {
    const reason = hasRetiredAliasPath()
      ? 'This old database-backed alias is retired. Ask the sender to share their current self-contained signed link.'
      : 'This page needs a complete signed EONAPP link.';
    setState('This share link cannot be verified.', `${reason} A valid link carries its proof inside the URL and does not need a central short-link database.`, 'error');
    if (continueLink) { continueLink.href = '/'; continueLink.hidden = false; continueLink.textContent = 'Open EONAPP'; }
    return;
  }

  const verified = await verifySignedShareToken(token);
  if (!verified.ok) {
    setState('This share link could not be verified.', `Reason: ${verified.reason}. You can still open EONAPP safely.`, 'error');
    if (continueLink) { continueLink.href = '/'; continueLink.hidden = false; continueLink.textContent = 'Open EONAPP'; }
    return;
  }

  const captured = await captureShareAttribution(verified.token);
  if (captured.ok) {
    await captureSignedReferralFromCurrentLocation({});
  }

  const isRealm = verified.payload?.linkKind === 'realm' && verified.payload?.realm;
  let welcomeRelic = null;
  if (isRealm) {
    saveIncomingRealmShare(verified.payload, verified.missionCode);
    welcomeRelic = awardLocalRealmShareRelic({
      eventType: EON_REALM_RELIC_PASSPORT_EVENTS.INCOMING_VERIFIED_REALM_LINK,
      realm: verified.payload.realm
    });
  }

  setState(
    isRealm ? `Verified Realm · ${verified.payload.realm.displayName || verified.payload.realm.handle}` : `Verified mission ${verified.missionCode}`,
    isRealm
      ? `This portable Realm identity was verified in this browser. The public link contains its own signed realm id and needs no Cloudflare link registry. ${welcomeRelic?.created ? 'A free local Welcome Relic was saved on this device.' : 'This device already has its Welcome Relic for this Realm.'} It does not create a referral conversion, click record, public profile, premium access, payout, wallet asset, NFT, or financial reward.`
      : 'The signature was verified in this browser. Referral context is saved locally. Opening or sharing this link does not create a reward, click record, central database record, or referral conversion.',
    'ok'
  );

  const destination = verified.payload.destination || '/';
  if (continueLink) {
    continueLink.href = destination;
    continueLink.hidden = false;
    continueLink.textContent = isRealm ? 'Open verified Realm' : 'Continue to EONAPP';
  }
  setTimeout(() => window.location.replace(destination), isRealm ? 1300 : 1100);
}

boot().catch((error) => {
  setState('Unable to open this share link.', String(error?.message || error), 'error');
  if (continueLink) { continueLink.href = '/'; continueLink.hidden = false; continueLink.textContent = 'Open EONAPP'; }
});
