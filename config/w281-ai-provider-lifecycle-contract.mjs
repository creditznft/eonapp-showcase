/** W281-A0 — source-only hosted-provider lifecycle/compatibility contract. */
import {
  ACTIVE_HOSTED_PROVIDER_IDS,
  AI_API_CONTRACT_REVIEW_CADENCE,
  AI_API_CONTRACT_SCHEMA,
  AI_PROVIDER_CONTRACTS,
  AI_PROVIDER_REVIEW_BOARD
} from './ai-api-contracts.mjs';

export const W281_AI_PROVIDER_LIFECYCLE_SCHEMA = 'eonapp.w281.ai-provider-lifecycle-source-readiness.v1';

export const W281_REQUIRED_EXTERNAL_EVIDENCE = Object.freeze([
  Object.freeze({ id: 'official-provider-change-review', status: 'pending-account-owner-review', owner: 'provider owner', evidence: 'Official provider change/terms/deprecation review before any provider URL, protocol, model-discovery or adapter change.' }),
  Object.freeze({ id: 'user-owned-nonproduction-verification', status: 'pending-user-action', owner: 'provider account owner', evidence: 'User-initiated provider-specific model-catalogue/readiness verification in a non-production account after a reviewed source change; when a provider exposes a public catalogue, credential proof requires a successful explicit inference.' }),
  Object.freeze({ id: 'rollback-disposition', status: 'pending-release-owner', owner: 'release owner', evidence: 'Documented disable/revert decision with local AI and Guide Mode behavior preserved if a hosted provider change is rejected.' })
]);

export function buildW281ProviderLifecycleSnapshot() {
  return Object.freeze({
    schema: W281_AI_PROVIDER_LIFECYCLE_SCHEMA,
    scope: 'source-only',
    contractSchema: AI_API_CONTRACT_SCHEMA,
    reviewCadence: AI_API_CONTRACT_REVIEW_CADENCE,
    mutationRule: 'Do not hot-patch a URL, model path, protocol or runtime adapter alone. Update the registry, runtime, discovery, tests and reviewed evidence together.',
    activeProviders: Object.freeze(ACTIVE_HOSTED_PROVIDER_IDS.map((id) => Object.freeze({
      id,
      provider: AI_PROVIDER_CONTRACTS[id].provider,
      transport: AI_PROVIDER_CONTRACTS[id].transport,
      readinessProof: AI_PROVIDER_CONTRACTS[id].readinessProof,
      executionPolicy: AI_PROVIDER_CONTRACTS[id].executionPolicy,
      reviewStatus: AI_PROVIDER_REVIEW_BOARD[id]?.status || 'missing',
      liveAccountProof: AI_PROVIDER_REVIEW_BOARD[id]?.liveAccountProof || 'missing'
    }))),
    userActionRequired: true,
    remoteCallsMade: false,
    claimFence: Object.freeze([
      'This source lifecycle snapshot is not a provider-account, quota, billing, model-availability, CORS, inference, latency or compatibility result.',
      'It does not verify any key, account, vendor response, model list or production monitoring state.',
      'It does not add a provider, activate a provider, update Cloudflare, or change W260 NO-GO, beta or launch status.'
    ])
  });
}

export function validateW281AiProviderLifecycleBoard(board = {}) {
  const errors = [];
  if (board.schema !== W281_AI_PROVIDER_LIFECYCLE_SCHEMA) errors.push('W281 board schema must match.');
  if (board.decision !== 'SOURCE_READY_EXTERNAL_EVIDENCE_PENDING') errors.push('W281 must remain source-ready with external evidence pending.');
  if (board.scope !== 'source-only') errors.push('W281 board scope must remain source-only.');
  if (!Array.isArray(board.requiredExternalEvidence) || board.requiredExternalEvidence.length !== W281_REQUIRED_EXTERNAL_EVIDENCE.length) errors.push('W281 board must retain every required external evidence lane.');
  if (!Array.isArray(board.claimFence) || board.claimFence.length < 3) errors.push('W281 board must retain its proof-limit claim fence.');
  return { ok: errors.length === 0, errors };
}
