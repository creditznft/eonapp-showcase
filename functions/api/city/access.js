/** W554 — safe City access preflight. No project, provider, prompt, file, token, or account identifier is returned. */
import { getIdentityConfig, jsonResponse, publicAuthStatus, readSession } from '../../_shared/eon-auth.js';
import { buildEonCityAccessDecision, normalizeEonCityAccessMode } from '../../../config/w554-eon-city-access-project-portals-contract.mjs';

/** Review-world access is server allowlisted; a browser query cannot unlock it. */
export function isEonCityOwnerWorldReview(env = {}, session = null) {
  const accountId = String(session?.accountId || '').trim();
  if (!accountId) return false;
  const allowlisted = String(env?.EON_CITY_OWNER_REVIEW_ACCOUNT_IDS || '')
    .split(',').map((value) => value.trim()).filter(Boolean);
  return allowlisted.includes(accountId);
}

export async function onRequestGet(context) {
  const config = getIdentityConfig(context.request, context.env);
  const session = config.configured ? await readSession(config, context.request) : null;
  const identity = publicAuthStatus(config, session);
  const decision = buildEonCityAccessDecision({
    mode: normalizeEonCityAccessMode(context.env?.EON_CITY_ACCESS_MODE),
    identityAvailable: identity.available,
    signedIn: identity.signedIn
  });
  return jsonResponse({
    ...decision,
    identity: {
      available: identity.available,
      rollout: identity.rollout,
      signedIn: identity.signedIn,
      guestUseAvailable: identity.guestUseAvailable,
      automaticCloudBackup: false,
      automaticCrossDeviceSync: false
    },
    // Never disclose account identifiers or the server-held allowlist.
    ownerWorldReview: isEonCityOwnerWorldReview(context.env, session)
  }, 200, { vary: 'Cookie' });
}
