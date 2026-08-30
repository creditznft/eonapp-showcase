import { createSignedShareLink, createDerivedShareLink, verifySignedShareToken } from '../utils/signed-share-link.js';
import { buildPlatformShareTargets } from './social-platform-adapters.js';
import { verifyXPublicProof } from './x-public-proof.js';
import { verifyGenericPublicProof } from './generic-public-proof.js';
import { recordSharePerformance } from '../utils/share-performance.js';

const MISSION_KEY = 'eon:social-missions:v1';
const PROOF_URL_KEY = 'eon:social-proof-urls:v1';

function read(key, fallback) { try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback; } catch { return fallback; } }
function write(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} }

export async function createSocialMission(options = {}) {
  const wantsRealm = options.linkKind === 'realm' || Boolean(options.realmHandle || options.realm?.handle || options.realm?.id);
  const shareOptions = {
    ...options,
    linkKind: wantsRealm ? 'realm' : 'referral',
    realmId: options.realmId || options.realm?.id || options.publicRealmId,
    realmHandle: options.realmHandle || options.realm?.handle || options.handle || options.username,
    realmLabel: options.realmLabel || options.realm?.displayName || options.displayName,
    realmTheme: options.realmTheme || options.realm?.theme || options.theme,
  };
  const share = options.parentToken
    ? await createDerivedShareLink(options.parentToken, shareOptions)
    : await createSignedShareLink(shareOptions);
  const mission = /** @type {any} */ ({
    schema: 'eon.social-proof.v1',
    missionId: `mission:${share.payload.shareId}`,
    platform: String(options.platform || share.payload.source || 'generic'),
    missionType: String(options.missionType || 'public_share'),
    title: String(options.title || 'Share EON Apps'),
    createdAt: Date.now(),
    expiresAt: share.payload.expiresAt,
    proofStatus: 'not_submitted',
    ...share
  });
  mission.targets = buildPlatformShareTargets({
    link: mission.link,
    missionCode: mission.missionCode,
    title: mission.title,
    message: options.message,
    hashtags: options.hashtags
  });
  const missions = read(MISSION_KEY, []);
  missions.unshift(mission);
  write(MISSION_KEY, missions.slice(0, 200));
  return mission;
}

export function listSocialMissions() { return read(MISSION_KEY, []); }

export async function submitPublicProof(options = {}) {
  const mission = /** @type {any} */ ((/** @type {any} */ (options)).mission);
  const proofUrl = (/** @type {any} */ (options)).proofUrl;
  const beneficiaryId = (/** @type {any} */ (options)).beneficiaryId || '';
  if (!mission?.token || !proofUrl) return { status: 'rejected', reason: 'missing-input' };
  const tokenCheck = await verifySignedShareToken(mission.token);
  if (!tokenCheck.ok) return { status: 'rejected', reason: tokenCheck.reason };
  const claimed = read(PROOF_URL_KEY, {});
  const normalizedKey = String(proofUrl).trim().toLowerCase();
  if (claimed[normalizedKey] && claimed[normalizedKey] !== mission.missionId) return { status: 'rejected', reason: 'proof-url-already-claimed' };
  const platform = String(mission.platform || 'generic').toLowerCase();
  const result = platform === 'x'
    ? await verifyXPublicProof({ proofUrl, signedToken: mission.token, missionCode: mission.missionCode, trackingLink: mission.link })
    : await verifyGenericPublicProof({ platform, proofUrl, signedToken: mission.token, missionCode: mission.missionCode, trackingLink: mission.link });
  if (result.status === 'accepted') {
    claimed[normalizedKey] = mission.missionId;
    write(PROOF_URL_KEY, claimed);
    await recordSharePerformance('public_proof_verified', {
      shareId: mission.payload.shareId,
      rootReferralId: mission.payload.rootReferralId,
      campaignId: mission.payload.campaignId,
      missionCode: mission.missionCode,
      proof: { platform, proofUrl, postId: result.postId || '' }
    });
    // W215 decision gate: public proof may be recorded locally for a user to
    // inspect, but it never creates points, credits, payouts, access, or a
    // referral reward while no campaign has been approved and verified.
    if (beneficiaryId) result.campaignDecision = { active: false, reason: 'no_active_reward_campaign' };
  }
  const missions = listSocialMissions();
  const index = missions.findIndex((row) => row.missionId === mission.missionId);
  if (index >= 0) missions[index] = { ...missions[index], proofStatus: result.status, proofUrl, proofCheckedAt: Date.now(), proofResult: result };
  write(MISSION_KEY, missions);
  return result;
}
