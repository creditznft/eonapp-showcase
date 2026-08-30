/**
 * W390A/B — EON Collection and deterministic Vault Reveal foundations.
 *
 * This module intentionally creates no value, account entitlement, referral
 * credit, cloud record, token, sale, transfer, or random chance. It models the
 * future product vocabulary and deterministic mission-to-artifact mapping only.
 */
export const EON_COLLECTION_SCHEMA = 'eonapp.collection.foundation.v1';
export const EON_COLLECTION_ROLLOUT = 'disabled';
export const EON_COLLECTION_STORAGE_POLICY = 'no-grant-storage-before-release-proof';

const freeze = (value) => Object.freeze(value);

export const EON_COLLECTION_ARTIFACTS = freeze([
  freeze({
    id: 'forge-keystone',
    label: 'Forge Keystone',
    tier: 'Foundational',
    missionId: 'forge-local-export-reviewed',
    utility: 'Optional Forge cover treatment after the account-bound Collection pilot is approved.',
    visual: 'A graphite build marker with a violet edge.',
    nonFinancial: true
  }),
  freeze({
    id: 'share-signal',
    label: 'Share Signal',
    tier: 'Foundational',
    missionId: 'share-pack-reviewed',
    utility: 'Optional Share Pack frame after the account-bound Collection pilot is approved.',
    visual: 'A cyan signal ring for creator output presentation.',
    nonFinancial: true
  }),
  freeze({
    id: 'remix-wayfinder',
    label: 'Remix Wayfinder',
    tier: 'Foundational',
    missionId: 'remix-card-reviewed',
    utility: 'Optional Remix Card presentation accent after the account-bound Collection pilot is approved.',
    visual: 'A mint route marker for remix-ready work.',
    nonFinancial: true
  })
]);

export const EON_COLLECTION_MISSIONS = freeze([
  freeze({ id: 'forge-local-export-reviewed', label: 'Forge export reviewed', evidenceKind: 'forge-source-review', artifactId: 'forge-keystone' }),
  freeze({ id: 'share-pack-reviewed', label: 'Share Pack reviewed', evidenceKind: 'share-pack-review', artifactId: 'share-signal' }),
  freeze({ id: 'remix-card-reviewed', label: 'Remix Card reviewed', evidenceKind: 'remix-card-review', artifactId: 'remix-wayfinder' })
]);

function cleanId(value = '', expression = /^[a-z0-9-]{2,80}$/) {
  const text = String(value || '').trim().toLowerCase();
  return expression.test(text) ? text : '';
}

export function listEonCollectionArtifacts() {
  return EON_COLLECTION_ARTIFACTS.map((artifact) => ({ ...artifact }));
}

export function listEonCollectionMissions() {
  return EON_COLLECTION_MISSIONS.map((mission) => ({ ...mission }));
}

export function getEonCollectionArtifact(artifactId = '') {
  const id = cleanId(artifactId);
  const artifact = EON_COLLECTION_ARTIFACTS.find((candidate) => candidate.id === id);
  return artifact ? freeze({ ...artifact }) : null;
}

/**
 * Resolves a predetermined reveal plan. The returned plan never grants an item,
 * writes storage, consults a referral, or varies by chance.
 */
export function resolveDeterministicVaultReveal({ missionId = '', evidenceKind = '' } = {}) {
  const mission = EON_COLLECTION_MISSIONS.find((candidate) => candidate.id === cleanId(missionId));
  if (!mission || cleanId(evidenceKind) !== mission.evidenceKind) {
    return freeze({ ok: false, status: 'not-eligible', artifact: null, reason: 'evidence-does-not-match-mission' });
  }
  const artifact = getEonCollectionArtifact(mission.artifactId);
  return freeze({
    ok: true,
    status: EON_COLLECTION_ROLLOUT === 'enabled' ? 'eligible-for-server-review' : 'locked-until-release-proof',
    mission: freeze({ ...mission }),
    artifact,
    deterministic: true,
    randomChance: false,
    paidOpening: false,
    transferable: false,
    marketValue: false,
    grantCreated: false,
    storageWritten: false,
    reason: 'The artifact is fixed by the mission. Granting remains disabled until identity, restore, legal and human-release gates are complete.'
  });
}

/** Future-facing product truth for UI and release gates. */
export function getEonCollectionTruth() {
  return freeze({
    schema: EON_COLLECTION_SCHEMA,
    rollout: EON_COLLECTION_ROLLOUT,
    enabled: false,
    accountBound: false,
    deterministicVaultReveal: true,
    randomChance: false,
    paidOpening: false,
    cashValue: false,
    credits: false,
    discount: false,
    subscriptionTime: false,
    transferable: false,
    sale: false,
    exchange: false,
    blockchain: false,
    nft: false,
    remoteGrantCreated: false,
    localGrantCreated: false,
    storagePolicy: EON_COLLECTION_STORAGE_POLICY,
    activationPrerequisites: freeze([
      'controlled-google-oauth-testing-proof',
      'encrypted-backup-empty-target-recovery-proof',
      'privacy-terms-support-copy-reviewed',
      'anti-abuse-and-reversal-policy-reviewed',
      'human-release-signoff'
    ])
  });
}

export default freeze({
  EON_COLLECTION_SCHEMA,
  EON_COLLECTION_ROLLOUT,
  EON_COLLECTION_ARTIFACTS,
  EON_COLLECTION_MISSIONS,
  listEonCollectionArtifacts,
  listEonCollectionMissions,
  getEonCollectionArtifact,
  resolveDeterministicVaultReveal,
  getEonCollectionTruth
});
