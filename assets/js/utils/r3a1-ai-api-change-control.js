import {
  ACTIVE_HOSTED_PROVIDER_IDS,
  AI_API_CONTRACT_AS_OF,
  AI_API_CONTRACT_REVIEW_CADENCE,
  AI_API_CONTRACT_SCHEMA,
  AI_PROVIDER_CONTRACTS,
  REVIEWED_HOSTED_PROVIDER_IDS,
  isRetiredNvidiaTeamScopedPath
} from '../../../config/ai-api-contracts.mjs';

export const R3A1_AI_API_CHANGE_CONTROL_SCHEMA = 'eonapp.r3a1.ai-api-change-control.v1';

export function buildR3A1ApiChangeControlBoard() {
  return {
    schema: R3A1_AI_API_CHANGE_CONTROL_SCHEMA,
    contractSchema: AI_API_CONTRACT_SCHEMA,
    asOf: AI_API_CONTRACT_AS_OF,
    reviewCadence: AI_API_CONTRACT_REVIEW_CADENCE,
    verdict: 'STATIC_CONTRACTS_PASS',
    activeHostedProviderIds: [...ACTIVE_HOSTED_PROVIDER_IDS],
    reviewedHostedProviderIds: [...REVIEWED_HOSTED_PROVIDER_IDS],
    nvidia: {
      currentRuntimeBaseUrl: AI_PROVIDER_CONTRACTS.nvidia.baseUrl,
      deprecatedTeamScopedPathDetected: false,
      migrationRequiredInCurrentSource: false,
      claim: 'NVIDIA API Catalog/NIM endpoint is guarded; no team-scoped NGC management URL is configured.'
    },
    claimFence: [
      'Static-contract pass is not a live provider-account, quota, billing, model-availability, CORS, or inference success claim.',
      'Every active browser-hosted provider remains BYOK and must pass a user-initiated authenticated model-list verification before EONBOT marks it ready; reviewed providers blocked by browser transport remain disabled until that transport boundary changes.',
      'No API key, account identifier, user model list, or vendor response is stored in this source evidence board.'
    ],
    externalEvidence: {
      providerAccountCompatibility: 'not-collected-in-source-freeze',
      previewByokProbe: 'not-collected-in-source-freeze',
      productionProviderMonitoring: 'not-collected-in-source-freeze'
    }
  };
}

export function validateR3A1ApiChangeControlBoard(board = {}) {
  const errors = [];
  const assert = (value, message) => { if (!value) errors.push(message); };
  assert(board.schema === R3A1_AI_API_CHANGE_CONTROL_SCHEMA, 'W260-R3 A1 board schema must match.');
  assert(board.contractSchema === AI_API_CONTRACT_SCHEMA, 'W260-R3 A1 board must identify the active AI contract schema.');
  assert(board.verdict === 'STATIC_CONTRACTS_PASS', 'W260-R3 A1 verdict must describe a static contract pass only.');
  assert(Array.isArray(board.activeHostedProviderIds) && board.activeHostedProviderIds.length === ACTIVE_HOSTED_PROVIDER_IDS.length, 'W260-R3 A1 board must enumerate active browser-hosted providers.');
  assert(Array.isArray(board.reviewedHostedProviderIds) && board.reviewedHostedProviderIds.length === REVIEWED_HOSTED_PROVIDER_IDS.length, 'W260-R3 A1 board must preserve reviewed hosted-provider contracts even when direct-browser execution is disabled.');
  assert(board.nvidia?.currentRuntimeBaseUrl === AI_PROVIDER_CONTRACTS.nvidia.baseUrl, 'W260-R3 A1 board must preserve the NVIDIA API Catalog/NIM base URL.');
  assert(board.nvidia?.deprecatedTeamScopedPathDetected === false, 'W260-R3 A1 board must not claim a deprecated team-scoped NVIDIA path exists.');
  assert(board.nvidia?.migrationRequiredInCurrentSource === false, 'W260-R3 A1 board must not invent an NVIDIA migration requirement when source is already on API Catalog/NIM.');
  assert(board.externalEvidence?.providerAccountCompatibility === 'not-collected-in-source-freeze', 'W260-R3 A1 must not invent provider-account evidence.');
  assert(Array.isArray(board.claimFence) && board.claimFence.length >= 3, 'W260-R3 A1 board must state its proof limits.');
  return { ok: errors.length === 0, errors };
}

export { isRetiredNvidiaTeamScopedPath };
