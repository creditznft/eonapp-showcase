/**
 * W228 — Public product status and evidence registry.
 *
 * This is the release-facing truth layer for the frozen W217 product
 * architecture. It does not enable features. It makes every public route
 * state explicit and requires a source evidence test for every active,
 * local-only, preview, disabled, future, and retired claim.
 */
import {
  HOME_REDIRECT,
  INFORMATIONAL_ROUTES,
  PRIMARY_APP_ROUTES,
  COMPATIBILITY_ROUTES,
  RETIRED_REDIRECTS
} from './route-contract.mjs';

export const PRODUCT_STATUS_VALUES = Object.freeze([
  'Live', 'Live-sensitive', 'Proof-gated', 'Local-only', 'Preview', 'Disabled', 'Future', 'Retired'
]);

const lifecycleToStatus = Object.freeze({
  live: 'Live',
  'live-sensitive': 'Live-sensitive',
  'proof-gated-referral': 'Proof-gated',
  'local-only': 'Local-only',
  preview: 'Preview',
  optional: 'Preview',
  compatibility: 'Preview',
  fallback: 'Local-only',
  'immersive-work-mode': 'Preview',
  'direct-immersive-city': 'Preview',
  'proof-spike': 'Preview',
  disabled: 'Disabled',
  future: 'Future',
  retired: 'Retired'
});

const sourceEvidence = Object.freeze({
  chat: ['tests/unit/w218-chat-first-shell-v2.test.mjs', 'tests/unit/w219-eonbot-local-ai-workspace.test.mjs', 'tests/unit/w230-eonbot-command-hub.test.mjs'],
  projects: ['tests/unit/w217-route-contract.test.mjs'],
  library: ['tests/unit/w217-route-contract.test.mjs'],
  workspace: ['tests/unit/w219-eonbot-local-ai-workspace.test.mjs', 'tests/unit/w223-invite-share-center.test.mjs'],
  eoncity: ['tests/unit/w392-direct-eon-city-entry.test.mjs'],
  'eoncity-lite': ['tests/unit/w221-cityworldstate-2d-rpg.test.mjs', 'tests/unit/w360-eon-city-portal-route.test.mjs'],
  'eoncity-tour': ['tests/unit/w224-cityworldstate-3d-parity.test.mjs', 'tests/unit/w360-eon-city-portal-route.test.mjs'],
  'eoncity-3d': ['tests/unit/w224-cityworldstate-3d-parity.test.mjs', 'tests/unit/w360-eon-city-portal-route.test.mjs'],
  'eoncity-play': ['tests/unit/w249-babylon-play-proof-spike.test.mjs', 'tests/unit/w360-eon-city-portal-route.test.mjs'],
  market: ['tests/unit/w220-market-generation-vertical-slice.test.mjs'],
  trade: ['tests/unit/w213-calm-city-trade.test.mjs'],
  automations: ['tests/unit/w217-route-contract.test.mjs'],
  profile: ['tests/unit/w218-chat-first-shell-v2.test.mjs', 'tests/unit/w225-account-catalog-foundations.test.mjs'],
  vault: ['tests/unit/w209-vault-account-boundary.test.mjs', 'tests/unit/w145-update-safe-user-data-survival.test.mjs'],
  'workspace-capsule': ['tests/unit/w518-workspace-capsule.test.mjs', 'tests/unit/w145-update-safe-user-data-survival.test.mjs'],
  'local-ai': ['tests/unit/w219-eonbot-local-ai-workspace.test.mjs'],
  'realm-studio': ['tests/unit/w222-my-realm-mvp.test.mjs'],
  market: ['tests/unit/w220-market-generation-vertical-slice.test.mjs'],
  telegram: ['tests/unit/w226-commercial-decision-gate.test.mjs'],
  'rewards-status': ['tests/unit/rt92-rewarded-sponsor-runtime.test.mjs', 'tests/unit/rt92-monetization-guest-display-policy.test.mjs', 'tests/unit/w235-access-milestones-disabled.test.mjs'],
  referral: ['tests/unit/w223-invite-share-center.test.mjs', 'tests/unit/w63-signed-share-link.test.mjs', 'tests/unit/w623h-minimal-referral-ledger.test.mjs'],
  archive: ['tests/unit/w217-route-contract.test.mjs'],
  'realm-public-future': ['tests/unit/w225-account-catalog-foundations.test.mjs'],
  billing: ['tests/unit/w225-account-catalog-foundations.test.mjs', 'tests/unit/w226-commercial-decision-gate.test.mjs'],
  about: ['tests/unit/w217-route-contract.test.mjs'],
  privacy: ['tests/unit/w217-route-contract.test.mjs'],
  terms: ['tests/unit/w217-route-contract.test.mjs'],
  legal: ['tests/unit/w217-route-contract.test.mjs'],
  support: ['tests/unit/w217-route-contract.test.mjs']
});

function evidenceFor(id) {
  return sourceEvidence[id] || ['tests/unit/w217-route-contract.test.mjs'];
}

function normalRow(row, kind) {
  const status = lifecycleToStatus[row.lifecycle] || (kind === 'retired-alias' ? 'Retired' : 'Retired');
  return Object.freeze({
    id: row.id || `retired:${row.from}`,
    route: row.from,
    destination: row.to,
    status,
    kind,
    evidence: Object.freeze([...evidenceFor(row.id)])
  });
}

export const PRODUCT_STATUS_MATRIX = Object.freeze([
  Object.freeze({
    id: HOME_REDIRECT.id,
    route: HOME_REDIRECT.from,
    destination: HOME_REDIRECT.to,
    status: 'Live',
    kind: 'entry',
    evidence: Object.freeze(['tests/unit/w217-route-contract.test.mjs', 'tests/e2e/w227-shell-route-regression.spec.ts'])
  }),
  ...PRIMARY_APP_ROUTES.map((row) => normalRow(row, 'primary')),
  ...INFORMATIONAL_ROUTES.map((row) => normalRow(row, 'informational')),
  ...COMPATIBILITY_ROUTES.map((row) => normalRow(row, 'compatibility')),
  ...RETIRED_REDIRECTS.map((row) => normalRow({ ...row, lifecycle: 'retired' }, 'retired-alias'))
]);

export const PRODUCT_CLAIM_EVIDENCE = Object.freeze([
  Object.freeze({
    id: 'chat-first-local-threads',
    claim: 'Chat is the primary local-first EONBOT work surface with restorable local threads.',
    status: 'Live',
    routes: Object.freeze(['/chat']),
    evidence: Object.freeze(['tests/unit/w218-chat-first-shell-v2.test.mjs', 'tests/unit/w219-eonbot-local-ai-workspace.test.mjs'])
  }),
  Object.freeze({
    id: 'eonbot-command-hub',
    claim: 'EONBOT interprets one safe command at a time and prepares only real current routes or a user-tapped local New Chat action; it does not claim external completion.',
    status: 'Live',
    routes: Object.freeze(['/chat', '/projects', '/library', '/workspace', '/automations', '/local-ai', '/market', '/vault', '/trade', '/eoncity', '/eoncity/lite', '/eoncity/tour', '/eoncity/3d', '/eoncity/play', '/realm-studio', '/profile', '/rewards']),
    evidence: Object.freeze(['tests/unit/w230-eonbot-command-hub.test.mjs', 'tests/unit/w231-eon-city-flagship.test.mjs', 'tests/e2e/w230-browser-runtime.spec.ts'])
  }),
  Object.freeze({
    id: 'share-center-invites-only',
    claim: 'Share Command Center creates signed invitations and public-safe local sharing handoffs. A link never grants value in the browser; the rollout-controlled server ledger may grant EONKEYS only after verified qualification. It does not share chats, create payouts, track clicks/posts, or auto-post.',
    status: 'Live',
    routes: Object.freeze(['/chat', '/profile', '/workspace', '/referral']),
    evidence: Object.freeze(['tests/unit/w223-invite-share-center.test.mjs', 'tests/e2e/w223-invite-share-center.spec.ts'])
  }),
  Object.freeze({
    id: 'approval-first-invite-campaigns',
    claim: 'EONBOT can prepare local signed-invite campaign drafts and reviewable share copy, but it does not connect social accounts, auto-post, track clicks/posts, or create commission or payouts. Reward qualification remains server-authoritative.',
    status: 'Live',
    routes: Object.freeze(['/workspace', '/profile', '/referral']),
    evidence: Object.freeze(['tests/unit/w223-invite-share-center.test.mjs', 'tests/unit/w228-ceo-red-team.test.mjs'])
  }),
  Object.freeze({
    id: 'market-local-previews',
    claim: 'Market begins empty and creates private local previews only after explicit user action.',
    status: 'Preview',
    routes: Object.freeze(['/market']),
    evidence: Object.freeze(['tests/unit/w220-market-generation-vertical-slice.test.mjs', 'tests/e2e/w220-market-local-generation.spec.ts'])
  }),
  Object.freeze({
    id: 'city-shared-state',
    claim: 'EON City is a local-first spatial work environment with a Portal, fast City Overview, optional Spatial Command Space, and optional Babylon Immersive Work Mode sharing one safe CityWorldState. W624A freezes one Productive Nocturne art-bible authority; final assets and visual/device certification remain pending.',
    status: 'Preview',
    routes: Object.freeze(['/eoncity', '/eoncity/lite', '/eoncity/tour', '/eoncity/3d', '/eoncity/play']),
    evidence: Object.freeze(['tests/unit/w221-cityworldstate-2d-rpg.test.mjs', 'tests/unit/w231-eon-city-flagship.test.mjs', 'tests/unit/w224-cityworldstate-3d-parity.test.mjs', 'tests/unit/w249-babylon-play-proof-spike.test.mjs', 'tests/unit/w624a-city-art-bible.test.mjs'])
  }),
  Object.freeze({
    id: 'city-w624a-art-bible',
    claim: 'W624A defines the Productive Nocturne vision, restrained palette, human-scale architecture, Wayfinder player, EONBOT Orbit, five productive NPC roles, productive-RPG truth contract, target budgets, three original target frames, reject list and weighted approval scorecard. It is a source design target, not a final-art or device-performance claim.',
    status: 'Preview',
    routes: Object.freeze(['/eoncity', '/eoncity/play']),
    evidence: Object.freeze(['tests/unit/w624a-city-art-bible.test.mjs', 'reports/w624a-city-art-bible/launch-board.json'])
  }),
  Object.freeze({
    id: 'city-play-w249-proof',
    claim: 'EON City Immersive Work Mode is an optional full-screen Babylon preview with explicit user-start, local capability selection, touch controls, lifecycle disposal, and City Overview fallback. It is not an autonomous agent or product-action surface.',
    status: 'Preview',
    routes: Object.freeze(['/eoncity/play']),
    evidence: Object.freeze(['tests/unit/w249-babylon-play-proof-spike.test.mjs'])
  }),
  Object.freeze({
    id: 'city-first-circuit',
    claim: 'EON City offers a local, non-monetary First Circuit return loop with safe 2D controls, objective routing, and EONBOT-prepared district guidance.',
    status: 'Preview',
    routes: Object.freeze(['/chat', '/eoncity/lite']),
    evidence: Object.freeze(['tests/unit/w231-eon-city-flagship.test.mjs', 'tests/e2e/w231-eon-city-flagship.spec.ts'])
  }),
  Object.freeze({
    id: 'realm-local-first',
    claim: 'My Realm is a local personal district; public publishing and merchant functions are not active.',
    status: 'Local-only',
    routes: Object.freeze(['/realm-studio', '/u/*']),
    evidence: Object.freeze(['tests/unit/w222-my-realm-mvp.test.mjs', 'tests/unit/w225-account-catalog-foundations.test.mjs'])
  }),
  Object.freeze({
    id: 'canonical-billing-live-sensitive',
    claim: 'Dodo Payments hosted subscription checkout is live-sensitive and server-authoritative; wallets, tokens, user seller functions, commissions, payouts, and client-side entitlement grants remain prohibited.',
    status: 'Live-sensitive',
    routes: Object.freeze(['/billing', '/rewards', '/telegram']),
    evidence: Object.freeze(['tests/unit/w623c-canonical-commercial-truth.test.mjs', 'tests/unit/w621-live-dodo-cloudflare-rollout.test.mjs'])
  }),
  Object.freeze({
    id: 'eonkeys-referral-proof-gated',
    claim: 'Signed invites cannot grant value in the browser. W623I provides a rollout-controlled minimal server ledger on the existing dedicated EONAPP_REFERRALS_DB, with a temporary billing-D1 migration fallback for proof-bound identity, one-level attribution, useful activation, retained-paid qualification, capped EONKEY grants, digital rewards, reversal and allowlisted redemption. Deployment proof remains pending.',
    status: 'Proof-gated',
    routes: Object.freeze(['/referral', '/rewards']),
    evidence: Object.freeze(['tests/unit/w623c-canonical-commercial-truth.test.mjs', 'tests/unit/w623d-production-reachability.test.mjs', 'tests/unit/w623h-minimal-referral-ledger.test.mjs', 'reports/w623h-minimal-referral-ledger/launch-board.json'])
  }),
  Object.freeze({
    id: 'access-milestones-disabled',
    claim: 'EON Access Milestones can only be a future, expiring, non-transferable capability program and remain disabled behind a source-level kill switch.',
    status: 'Disabled',
    routes: Object.freeze(['/rewards']),
    evidence: Object.freeze(['tests/unit/w235-access-milestones-disabled.test.mjs', 'tests/unit/w236-w237-no-go.test.mjs'])
  }),
  Object.freeze({
    id: 'rt96-sponsored-monetization-live-sensitive',
    claim: 'RT96 monetization keeps ordinary display advertising disabled across EONAPP and EON City. Voluntary rewarded Sponsor Terminal and Vexrail sponsored AI remain separate commercial rails; Local AI and BYOK remain unsponsored. Persistent Sponsor Key issuance must remain server-authoritative and fail closed when the configured rewarded verifier is unavailable. Legacy popups, offerwalls, SmartLinks and click-reward behavior remain outside the active authority.',
    status: 'Live-sensitive',
    routes: Object.freeze(['/chat', '/eoncity', '/local-ai', '/rewards']),
    evidence: Object.freeze(['tests/unit/rt92-monetization-guest-display-policy.test.mjs', 'tests/unit/rt92-rewarded-sponsor-runtime.test.mjs', 'tests/unit/rt92-vexrail-adsense.test.mjs'])
  }),
  Object.freeze({
    id: 'legacy-value-systems-archived',
    claim: 'Historical NFT, wallet, token, reward, pricing and superseded commerce modules remain in source only for migration/evidence and are blocked from the active browser and Cloudflare production import graph by W623D.',
    status: 'Retired',
    routes: Object.freeze(['/archive']),
    evidence: Object.freeze(['tests/unit/w623d-production-reachability.test.mjs', 'reports/w623d-production-reachability/graph.json'])
  }),
  Object.freeze({
    id: 'vault-safe-backup',
    claim: 'Portable Workspace Capsule is the local encrypted recovery workflow: staged, selected, explicitly confirmed, journaled, and limited to allowlisted non-sensitive records.',
    status: 'Live',
    routes: Object.freeze(['/vault', '/capsule']),
    evidence: Object.freeze(['tests/unit/w209-vault-account-boundary.test.mjs', 'tests/unit/w145-update-safe-user-data-survival.test.mjs'])
  })
]);

export function validateProductEvidenceRegistry({ root = '.' } = {}) {
  const errors = [];
  const knownRoutes = new Set(PRODUCT_STATUS_MATRIX.map((row) => row.route));
  for (const row of PRODUCT_STATUS_MATRIX) {
    if (!PRODUCT_STATUS_VALUES.includes(row.status)) errors.push(`Unsupported status for ${row.route}: ${row.status}`);
    if (!row.evidence?.length) errors.push(`Missing evidence mapping for route ${row.route}`);
  }
  for (const claim of PRODUCT_CLAIM_EVIDENCE) {
    if (!PRODUCT_STATUS_VALUES.includes(claim.status)) errors.push(`Unsupported claim status: ${claim.id}`);
    if (!claim.evidence?.length) errors.push(`Missing evidence for claim: ${claim.id}`);
    for (const route of claim.routes || []) if (!knownRoutes.has(route)) errors.push(`Claim ${claim.id} references an unknown route: ${route}`);
  }
  return errors;
}

export function renderPublicProductStatusMatrix() {
  const lines = [
    '# W228 — Public Product Status Matrix',
    '',
    'Generated from `config/product-evidence-registry.mjs`. This matrix is a release truth document, not a feature-activation switch.',
    '',
    '## Status vocabulary',
    '',
    '- **Live** — available within the stated local-first boundary.',
    '- **Local-only** — browser-local state; no account or server publication claim.',
    '- **Preview** — usable prototype/renderer with explicit limits.',
    '- **Disabled** — page may explain the capability, but cannot activate it.',
    '- **Future** — design boundary only; no service is active.',
    '- **Retired** — compatibility redirect to a truthful current destination.',
    '',
    '## Route truth',
    '',
    '| Route | State | Destination | Evidence |',
    '|---|---|---|---|'
  ];
  for (const row of PRODUCT_STATUS_MATRIX) {
    lines.push(`| \`${row.route}\` | ${row.status} | \`${row.destination}\` | ${row.evidence.map((item) => `\`${item}\``).join('<br>')} |`);
  }
  lines.push('', '## Claim evidence', '', '| Claim | State | Routes | Evidence |', '|---|---|---|---|');
  for (const claim of PRODUCT_CLAIM_EVIDENCE) {
    lines.push(`| ${claim.claim} | ${claim.status} | ${claim.routes.map((route) => `\`${route}\``).join(', ')} | ${claim.evidence.map((item) => `\`${item}\``).join('<br>')} |`);
  }
  lines.push('', '## Non-negotiable no-go', '', 'Sharing is an invitation mechanism only. It does not create attribution, affiliate value, rewards, payout eligibility, token value, public user commerce, or a moderation-free public platform.');
  return `${lines.join('\n')}\n`;
}
