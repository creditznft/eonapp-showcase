// SF-7: backend-client.js removed — frontend is decentralised (no server dependency).
// Always return local/cached preview; backend block is unreachable but kept for future opt-in.
const hasConfiguredBackend = () => false;
const getApiBase = () => '';
const fetchVaultSummary = async (/** @type {any} */ _uid) => { throw new Error('no-backend'); };
import { normalizeIdentityId } from './identity.js';
const appWin = /** @type {any} */ (window);

const CLAIM_CACHE_KEY = 'eon:claim-cache:v1';
const CLAIM_CACHE_TTL_MS = 10 * 60 * 1000;
const /** @type {any} */
ALLOWED_CLAIM_STATUS = new Set(['published', 'expired', 'swept', 'invalidated', 'awaiting-published-epoch', 'local-pool-preview']);

function normalizeWalletAddress(/** @type {any} */ value = '') {
  const normalized = String(value || '').trim().toLowerCase();
  return /^0x[a-f0-9]{40}$/i.test(normalized) ? normalized : '';
}

function readCache() {
  try {
    const parsed = JSON.parse(localStorage.getItem(CLAIM_CACHE_KEY) || 'null');
    if (!parsed || typeof parsed !== 'object') {
      return null;
    }
    const cachedAt = Date.parse(parsed.cachedAt || '');
    if (!Number.isFinite(cachedAt) || Date.now() - cachedAt > CLAIM_CACHE_TTL_MS) {
      return null;
    }
    if (!normalizeIdentityId(parsed.uid)) {
      return null;
    }
    return normalizeSummaryPayload(parsed);
  } catch {
    return null;
  }
}

function saveCache(/** @type {any} */ payload) {
  const uid = normalizeIdentityId(payload?.uid);
  if (!uid) {
    return;
  }
  try {
    localStorage.setItem(CLAIM_CACHE_KEY, JSON.stringify({
      ...normalizeSummaryPayload(payload),
      uid,
      cachedAt: new Date().toISOString()
    }));
  } catch {}
}

function safeNumber(/** @type {any} */ value, /** @type {any} */ fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function sanitizeIso(/** @type {any} */ value) {
  const ms = Date.parse(String(value || ''));
  return Number.isFinite(ms) ? new Date(ms).toISOString() : null;
}

function sanitizeClaim(/** @type {any} */ claim = {}) {
  if (!claim || typeof claim !== 'object') return null;
  const status = String(claim.status || '').trim().toLowerCase();
  const payload = claim.payload && typeof claim.payload === 'object' ? claim.payload : {};
  return {
    sequence: Number.isFinite(Number(claim.sequence)) ? Number(claim.sequence) : null,
    domain: String(claim.domain || '').trim().slice(0, 60),
    wallet_address: normalizeWalletAddress(claim.wallet_address || ''),
    points: String(Math.max(0, Math.floor(safeNumber(claim.points)))),
    claim_amount: String(Math.max(0, Math.floor(safeNumber(claim.claim_amount)))),
    proof_root: String(claim.proof_root || '').trim().slice(0, 256),
    status: ALLOWED_CLAIM_STATUS.has(status) ? status : 'published',
    payload: {
      ...payload,
      claim_window_end: sanitizeIso(payload.claim_window_end),
      remainder_receiver: normalizeWalletAddress(payload.remainder_receiver || ''),
      remainder_amount: String(Math.max(0, Math.floor(safeNumber(payload.remainder_amount))))
    }
  };
}

function normalizeSummaryPayload(/** @type {any} */ summary = {}) {
  const normalized = summary && typeof summary === 'object' ? summary : {};
  const latestEpoch = normalized.latestEpoch && typeof normalized.latestEpoch === 'object' ? normalized.latestEpoch : null;
  return {
    ...normalized,
    uid: normalizeIdentityId(normalized.uid),
    claims: Array.isArray(normalized.claims) ? normalized.claims.map(sanitizeClaim).filter(Boolean) : [],
    latestEpoch: latestEpoch
      ? {
          ...latestEpoch,
          sequence: Number.isFinite(Number(latestEpoch.sequence)) ? Number(latestEpoch.sequence) : null,
          status: ALLOWED_CLAIM_STATUS.has(String(latestEpoch.status || '').trim().toLowerCase()) ? String(latestEpoch.status).trim().toLowerCase() : 'published',
          claim_window_end: sanitizeIso(latestEpoch.claim_window_end),
          remainder_receiver: normalizeWalletAddress(latestEpoch.remainder_receiver || ''),
          remainder_amount: String(Math.max(0, Math.floor(safeNumber(latestEpoch.remainder_amount))))
        }
      : null
  };
}

function buildPoolClaims(/** @type {any} */ _profile, /** @type {any} */ walletAddress, /** @type {any} */ poolSnapshot) {
  if (!poolSnapshot || typeof poolSnapshot !== 'object') {
    return [];
  }
  const participation = poolSnapshot.participation || {};
  const claims = poolSnapshot.estimatedClaims || {};
  const holder = poolSnapshot.holder || { score: 0, itemCount: 0 };
  const sharePct = (safeNumber(poolSnapshot.estimatedShares?.nft) * 100).toFixed(2);
  const status = 'local-pool-preview';
  const /** @type {any} */
basePayload = {
    source: 'local-pool-ledger',
    pooledMintShare: poolSnapshot.policy?.pooledMintShare || 0.75,
    walletAddress
  };
  return [
    {
      sequence: null,
      domain: 'gamer-pool',
      wallet_address: walletAddress || '',
      points: String(Math.max(0, Math.floor(safeNumber(participation.gamer)))),
      claim_amount: String(Math.max(0, Math.floor(safeNumber(claims.gamer)))),
      proof_root: '',
      status,
      payload: { ...basePayload, pool: 'gamer', note: 'Gameplay pool preview based on local participation.' }
    },
    {
      sequence: null,
      domain: 'tool-pool',
      wallet_address: walletAddress || '',
      points: String(Math.max(0, Math.floor(safeNumber(participation.tools)))),
      claim_amount: String(Math.max(0, Math.floor(safeNumber(claims.tools)))),
      proof_root: '',
      status,
      payload: { ...basePayload, pool: 'tools', note: 'Tool utility pool preview based on local participation.' }
    },
    {
      sequence: null,
      domain: 'creator-pool',
      wallet_address: walletAddress || '',
      points: String(Math.max(0, Math.floor(safeNumber(participation.creator)))),
      claim_amount: String(Math.max(0, Math.floor(safeNumber(claims.creator)))),
      proof_root: '',
      status,
      payload: { ...basePayload, pool: 'creator', note: 'Creator pool preview based on referrals/shares and local profile activity.' }
    },
    {
      sequence: null,
      domain: 'referral-pool',
      wallet_address: walletAddress || '',
      points: String(Math.max(0, Math.floor(safeNumber(participation.referral)))),
      claim_amount: String(Math.max(0, Math.floor(safeNumber(claims.referral)))),
      proof_root: '',
      status,
      payload: { ...basePayload, pool: 'referral', note: 'Referral loop pool preview from local invite attribution.' }
    },
    {
      sequence: null,
      domain: 'nft-holder-pool',
      wallet_address: walletAddress || '',
      points: String(Math.max(0, Math.floor(safeNumber(participation.nft) + safeNumber(holder.score)))),
      claim_amount: String(Math.max(0, Math.floor(safeNumber(claims.nft)))),
      proof_root: '',
      status,
      payload: {
        ...basePayload,
        pool: 'nft',
        holderScore: Math.max(0, Math.floor(safeNumber(holder.score))),
        itemCount: Math.max(0, Math.floor(safeNumber(holder.itemCount))),
        nftSharePct: sharePct,
        rarityCounts: holder.rarityCounts || {},
        note: 'NFT holder pool preview. Higher collectible score increases weighted claim share.'
      }
    }
  ];
}

function injectLocalNftClaim(/** @type {any} */ summary, /** @type {any} */ walletAddress, /** @type {any} */ poolSnapshot) {
  const claims = Array.isArray(summary?.claims) ? summary.claims.slice() : [];
  if (claims.some((/** @type {any} */ claim) => String(claim?.domain || '').toLowerCase() === 'nft-holder-pool')) {
    return claims;
  }
  const holder = poolSnapshot?.holder;
  const estimatedNftClaim = safeNumber(poolSnapshot?.estimatedClaims?.nft);
  if (!holder || estimatedNftClaim <= 0) {
    return claims;
  }
  claims.push({
    sequence: null,
    domain: 'nft-holder-pool',
    wallet_address: walletAddress || '',
    points: String(Math.max(0, Math.floor(safeNumber(holder.score)))),
    claim_amount: String(Math.max(0, Math.floor(estimatedNftClaim))),
    proof_root: '',
    status: 'local-pool-preview',
    payload: {
      source: 'local-pool-ledger',
      note: 'Local NFT holder estimate appended while waiting for published NFT pool snapshots.'
    }
  });
  return claims;
}

function localPreview(/** @type {any} */ profile, /** @type {any} */ walletAddress, /** @type {any} */ collectionCount = 0) {
  const runs = Number(profile?.stats?.totalRuns || 0);
  const shares = Number(profile?.stats?.totalShares || 0);
  const referralReturns = Number(profile?.stats?.referralReturns || 0);
  const challengeXp = Number(profile?.stats?.challengeXp || 0);
  const historyCount = Array.isArray(profile?.history) ? profile.history.length : 0;
  const collection = appWin.EonLootbox?.getCollection?.() || [];
  const poolSnapshot = appWin.EonWallet?.getPoolSnapshot?.({
    collection,
    historyCount,
    shareCount: shares,
    referralReturns
  }) || null;
  const derivedPoints = Math.max(
    0,
    (runs * 12) + (shares * 6) + (referralReturns * 35) + Math.floor(challengeXp / 12) + (collectionCount * 2)
  );
  const /** @type {any} */
baseClaim = {
    sequence: null,
    domain: 'activity-preview',
    wallet_address: walletAddress || '',
    points: String(derivedPoints),
    claim_amount: String(Math.floor(derivedPoints * 0.18)),
    proof_root: '',
    status: 'awaiting-published-epoch',
    payload: {
      note: 'Static fallback preview. Publish a signed epoch snapshot to unlock on-chain claims.',
      source: 'local-vault-estimate'
    }
  };
  const poolClaims = buildPoolClaims(profile, walletAddress, poolSnapshot)
    .filter((/** @type {any} */ claim) => safeNumber(claim.claim_amount) > 0 || safeNumber(claim.points) > 0);
  const claims = [baseClaim, ...poolClaims]
    .sort((/** @type {any} */ a, /** @type {any} */ b) => safeNumber(b.claim_amount) - safeNumber(a.claim_amount));

  return {
    ok: true,
    mode: 'local-preview',
    uid: profile?.uid || null,
    latestEpoch: null,
    claims,
    pools: poolSnapshot,
    entitlement: null,
    backend: {
      apiBase: getApiBase(),
      reachable: false
    }
  };
}

/**
 * Returns a human-readable label and detail for the current claim lifecycle state.
 * Pure function with no side effects.
 * @param {Object} summary - The vault summary object including latestEpoch data.
 * @param {Object} claim - The claim object with optional status field.
 * @returns {{ label: string, detail: string }} Human-readable lifecycle descriptor.
 */
export function describeClaimLifecycle(/** @type {any} */ summary, /** @type {any} */ claim) {
  const epochStatus = String(summary?.latestEpoch?.status || '').trim().toLowerCase();
  const claimStatus = String(claim?.status || '').trim().toLowerCase();
  const effectiveStatus = claimStatus || epochStatus || 'local-preview';
  const remainderAmount = summary?.latestEpoch?.remainder_amount || '0';

  if (effectiveStatus === 'swept') {
    return {
      label: 'Swept',
      detail: remainderAmount !== '0'
        ? `Expired claim remainder was swept (${remainderAmount} EonLite) after the claim window closed.`
        : 'This claim window was closed and any remaining emission was swept after expiry.'
    };
  }

  if (effectiveStatus === 'invalidated') {
    return {
      label: 'Invalidated',
      detail: 'The epoch root was invalidated, so claims from this publication are no longer live.'
    };
  }

  if (effectiveStatus === 'expired') {
    return {
      label: 'Expired',
      detail: 'The claim window ended. The backend may close or sweep any leftover emission.'
    };
  }

  if (effectiveStatus === 'awaiting-published-epoch' || summary?.mode === 'local-preview') {
    return {
      label: 'Preview only',
      detail: 'This is a deterministic local preview until a signed epoch snapshot is published.'
    };
  }

  if (effectiveStatus === 'local-pool-preview') {
    return {
      label: 'Pool preview',
      detail: 'Pool claim values are deterministic local estimates until a signed pool epoch is published.'
    };
  }

  return {
    label: 'Published',
    detail: 'This claim is live under the current published epoch snapshot.'
  };
}

export async function loadVaultSummary(/** @type {any} */ profile, /** @type {any} */ options = {}) {
  const uid = normalizeIdentityId(profile?.uid);
  const walletAddress = normalizeWalletAddress(options.walletAddress || '');
  const collectionCount = Number(options.collectionCount || 0);
  const collection = appWin.EonLootbox?.getCollection?.() || [];
  const poolSnapshot = appWin.EonWallet?.getPoolSnapshot?.({
    collection,
    historyCount: Array.isArray(profile?.history) ? profile.history.length : 0,
    shareCount: Number(profile?.stats?.totalShares || 0),
    referralReturns: Number(profile?.stats?.referralReturns || 0)
  }) || null;
  if (!uid) {
    return localPreview({ uid: null, stats: {} }, walletAddress, collectionCount);
  }

  if (!hasConfiguredBackend()) {
    const cached = readCache();
    if (cached && cached.uid === uid) {
      return {
        ...cached,
        pools: poolSnapshot || cached?.pools || null,
        backend: {
          ...(cached.backend || {}),
          apiBase: '',
          reachable: false,
          staticOnly: true,
          stale: true
        }
      };
    }
    return localPreview({ ...profile, uid }, walletAddress, collectionCount);
  }

  try {
    const summary = /** @type {any} */ (await fetchVaultSummary(uid));
    const /** @type {any} */
normalized = {
      ...normalizeSummaryPayload(summary),
      uid,
      pools: poolSnapshot || summary?.pools || null,
      claims: injectLocalNftClaim(normalizeSummaryPayload(summary), walletAddress, poolSnapshot),
      backend: {
        apiBase: getApiBase(),
        reachable: true
      }
    };
    saveCache(normalized);
    return normalized;
  } catch {
    const cached = readCache();
    if (cached && cached.uid === uid) {
      return {
        ...cached,
        pools: poolSnapshot || cached?.pools || null,
        claims: injectLocalNftClaim(cached, walletAddress, poolSnapshot),
        backend: {
          ...(cached.backend || {}),
          apiBase: getApiBase(),
          reachable: false,
          stale: true
        }
      };
    }
    return localPreview({ ...profile, uid }, walletAddress, collectionCount);
  }
}
