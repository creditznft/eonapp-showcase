/**
 * realmworld-p2p.js
 * No-worker network policy helpers for future RealmWorld ghost visits.
 *
 * This module intentionally does not call /api, Cloudflare Workers, or any
 * central game server. The MVP stays browser-only. Later P2P should start with
 * owner-approved invite envelopes and tiny ghost-avatar WebRTC rooms.
 */

const SAFE_EMOTES = Object.freeze(['wave', 'spark', 'bow', 'cheer', 'trade', 'thanks']);

function normalizeMode(value = 'solo') {
  const mode = String(value || 'solo').trim().toLowerCase().replace(/[\s_]+/g, '-');
  if (mode === 'public' || mode === 'public-listed') return 'public-listed';
  if (mode === 'invite' || mode === 'invite-only') return 'invite-only';
  return 'solo';
}

function safeRealmId(value = '') {
  return String(value || 'local-realm')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9:-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .slice(0, 96) || 'local-realm';
}

export function getRealmWorldNetworkPolicy(mode = 'solo') {
  const presenceMode = normalizeMode(mode);
  return {
    presenceMode,
    transport: presenceMode === 'solo' ? 'none' : 'webrtc-datachannel-later',
    requiresCloudflareWorker: false,
    requiresCentralGameServer: false,
    discovery: presenceMode === 'public-listed' ? 'owner-approved-static-snapshot' : 'manual-owner-invite',
    signaling: presenceMode === 'solo' ? 'none' : 'manual-offer-answer-or-static-invite',
    maxPeers: presenceMode === 'solo' ? 0 : 4,
    chat: false,
    uploads: false,
    allowedEmotes: [...SAFE_EMOTES]
  };
}

export function buildRealmWorldInviteEnvelope(snapshot = {}, options = {}) {
  const mode = normalizeMode(options.mode || snapshot.safety?.presenceMode || 'invite-only');
  const policy = getRealmWorldNetworkPolicy(mode);
  const owner = snapshot.owner && typeof snapshot.owner === 'object' ? snapshot.owner : {};
  return {
    schema: 'eon.realmworld.invite.v1',
    realmId: safeRealmId(snapshot.seed || owner.username || 'local-realm'),
    owner: {
      username: safeRealmId(owner.username || 'local-operator'),
      displayName: String(owner.displayName || 'Local Operator').slice(0, 80),
      walletHint: String(owner.wallet || '').toLowerCase().slice(0, 12)
    },
    mode,
    createdAt: options.now || new Date().toISOString(),
    policy,
    snapshotDigestHint: safeRealmId(`${snapshot.schema || 'snapshot'}:${snapshot.generatedAt || ''}`),
    note: 'No Cloudflare Worker or central game-state server is required for this invite envelope.'
  };
}

export function validateRealmWorldP2PPolicy(policy = {}) {
  const normalized = getRealmWorldNetworkPolicy(policy.presenceMode || 'solo');
  const problems = [];
  if (policy.requiresCloudflareWorker === true) problems.push('Cloudflare Worker dependency is not allowed for RealmWorld game state.');
  if (policy.requiresCentralGameServer === true) problems.push('Central game server dependency is not allowed for RealmWorld MVP.');
  if (policy.chat === true) problems.push('Free-text chat is disabled for RealmWorld launch safety.');
  if (policy.uploads === true) problems.push('User uploads are disabled for RealmWorld launch safety.');
  if (Number(policy.maxPeers || normalized.maxPeers) > 4) problems.push('Max peer count must stay at 4 or lower.');
  return {
    ok: problems.length === 0,
    problems,
    policy: { ...normalized, ...policy, requiresCloudflareWorker: false, requiresCentralGameServer: false, chat: false, uploads: false, maxPeers: Math.min(4, Number(policy.maxPeers ?? normalized.maxPeers)) }
  };
}
