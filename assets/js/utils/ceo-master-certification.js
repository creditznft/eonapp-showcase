/**
 * ceo-master-certification.js
 * Final CEO certification matrix for the post-audit handoff.
 *
 * This is intentionally static/data-driven so it can run in ChatGPT, Codex,
 * local Node, and browser contexts without network calls or backend state.
 */

export const CEO_CERTIFICATION_SCHEMA = 'eon.ceo-master-certification.v1';

export const CEO_EXTRA_WAVES = Object.freeze([
  {
    id: 'wave14',
    title: 'Wave 14 — Audit consolidation, gap closure map, and product coherence',
    objective: 'Prove that old audit blockers are either coded, safely deferred, or external/live-proof only, then tighten product story and route ownership.',
    outcome: 'Single CEO master gap matrix, short launch checklist, route ownership decision table, and app-story consistency pass.',
    codeFocus: [
      'old audit gap registry',
      'whole-app page ownership map',
      'RealmWorld-first product hierarchy',
      'soft-launch vs hard-launch criteria'
    ]
  },
  {
    id: 'wave15',
    title: 'Wave 15 — Security, privacy, wallet, ads, and quality gates',
    objective: 'Add static gates for the biggest launch risks: secrets, stale service-worker caching, localStorage trust, financial overclaiming, sensitive-page ads, and creator-commerce split visibility.',
    outcome: 'No-build static gate suite that Codex can run before build/deploy to catch regressions.',
    codeFocus: [
      'financial copy guardrails',
      'sensitive route cache safety',
      'ad/sponsor placement policy',
      'admin and entitlement trust boundaries',
      'API-key storage language'
    ]
  },
  {
    id: 'wave16',
    title: 'Wave 16 — Codex handoff certification and launch freeze pack',
    objective: 'Package a concrete local execution checklist for Codex: build, smoke, unit triage, browser/mobile QA, Dodo/server proof, service-worker proof, rollback, and CEO go/no-go evidence.',
    outcome: 'Final handoff pack with exact local commands, proof artifacts, evidence slots, and go/soft-launch/no-go decision rules.',
    codeFocus: [
      'Codex handoff commands',
      'proof artifact manifest',
      'launch freeze checklist',
      'final CEO scorecard'
    ]
  }
]);

export function buildOldAuditGapRegistry() {
  return [
    {
      id: 'W1-GATES',
      sourceWave: 'Wave 1',
      finding: 'Launch gates contradicted each other; one green script was not enough.',
      currentStatus: 'coded-improved',
      evidence: ['site-audit pass', 'page-invariants pass', 'launch-readiness pass'],
      remainingAction: 'Codex must still run build/smoke/full local checks before deploy.',
      owner: 'Codex/local'
    },
    {
      id: 'W1-SECRETS',
      sourceWave: 'Wave 1 / Wave 6',
      finding: 'Historical Smart Contracts/.env and private-key material were unsafe in release backups.',
      currentStatus: 'coded-improved',
      evidence: ['dangerous .env removed from later backups', 'historical private-key strings redacted where found'],
      remainingAction: 'Run workspace secret scan locally before pushing or deploying.',
      owner: 'Codex/local'
    },
    {
      id: 'W2-DODO-IDEMPOTENCY',
      sourceWave: 'W616B/W616C/W616D/W617B',
      finding: 'Dodo billing must use signed webhooks and stable server idempotency before any subscription entitlement is granted.',
      currentStatus: 'planned-next',
      evidence: ['EON Keys catalogue added', 'locked-feature resolver added', 'W617B launch contract added'],
      remainingAction: 'W617C/W617D must add disabled Dodo webhook, entitlement and referral-ledger contracts before paid activation.',
      owner: 'Codex/local/server-proof'
    },
    {
      id: 'W2-CREATOR-COMMERCE-DISABLED',
      sourceWave: 'W617B',
      finding: 'Creator commerce, wallet checkout and marketplace purchase flows are not part of the Dodo-first launch path.',
      currentStatus: 'coded-improved',
      evidence: ['billing route stays disabled', 'EON Keys are non-transferable app capability/cosmetics', 'financial guardrails block profit/resale copy'],
      remainingAction: 'Keep creator commerce disabled until a separate reviewed payment/seller policy wave exists.',
      owner: 'CEO/Codex-later'
    },
    {
      id: 'W4-LEGAL',
      sourceWave: 'Wave 4',
      finding: 'Terms, billing, refund, wallet-risk, support, and trust surfaces were launch blockers.',
      currentStatus: 'coded-improved',
      evidence: ['legal/trust pages added', 'refund language uses lawful exceptions', 'wallet-risk rail exists'],
      remainingAction: 'Professional counsel review before scaling paid traffic.',
      owner: 'business/legal'
    },
    {
      id: 'W5-MARKET-SELLER-POLICY',
      sourceWave: 'Wave 05 / Wave 13',
      finding: 'Market seller/listing policy is outside the Dodo-first subscription launch and must not be implied by locked-feature UI.',
      currentStatus: 'planned-next',
      evidence: ['market kept beta', 'creator commerce remains disabled', 'W617B keeps billing focused on subscriptions'],
      remainingAction: 'Add seller/listing policy only before any public paid seller marketplace.',
      owner: 'wave14-16'
    },
    {
      id: 'W5-ADS-SPONSORS',
      sourceWave: 'Wave 05 / Specialist B',
      finding: 'Ads and sponsor placement need final decision, especially around paid users and sensitive pages.',
      currentStatus: 'planned-next',
      evidence: ['whole-app audit plan includes ad/monetization review'],
      remainingAction: 'Add explicit ad placement policy and static sensitive-page ad check.',
      owner: 'wave15'
    },
    {
      id: 'W6-VAULT',
      sourceWave: 'Wave 06',
      finding: 'Vault is strong but local-first only; server features must not trust localStorage.',
      currentStatus: 'coded-improved',
      evidence: ['plaintext export blocked by default', 'admin role spoofing locally hardened'],
      remainingAction: 'Codex/browser QA encrypted export/restore and entitlement portability.',
      owner: 'Codex/local'
    },
    {
      id: 'W7-AI-BYOK',
      sourceWave: 'Wave 07',
      finding: 'BYOK should be session-first; local runtimes and provider keys still require live/browser tests.',
      currentStatus: 'coded-improved',
      evidence: ['plaintext persistent keys disabled', 'AI Wallet language approval-first'],
      remainingAction: 'Test one provider key and one local runtime on Windows.',
      owner: 'Codex/local'
    },
    {
      id: 'W8-NFT-MARKET',
      sourceWave: 'Wave 08 / Wave 10E',
      finding: 'NFTs should be utility-first; Arweave/OpenSea/permanence must not be promised before proof.',
      currentStatus: 'coded-improved',
      evidence: ['utility catalog expanded', 'RealmWorld mapping added', 'financial guardrails block resale/profit copy'],
      remainingAction: 'Human visual gallery QA and Arweave upload proof later.',
      owner: 'Codex/local'
    },
    {
      id: 'W9-REALMWORLD',
      sourceWave: 'Wave 09 / W10B-W10E',
      finding: 'EON City needed mobile, renderer, private workspace boundary, subscription upsell truth, and browser QA.',
      currentStatus: 'coded-improved',
      evidence: ['EON City default world', 'private workstation', 'NPC life', 'renderer phases', 'locked-feature surface boundary'],
      remainingAction: 'Browser/mobile performance QA is still required outside chat.',
      owner: 'Codex/local'
    },
    {
      id: 'W11-DEPLOY',
      sourceWave: 'Wave 11 / Wave 12 / Wave 13',
      finding: 'Build, smoke, deploy, Dodo/server proof, service-worker proof, browser/mobile proof, and full test triage cannot be fully completed inside this chat.',
      currentStatus: 'external-blocker',
      evidence: ['deploy proof plan added', 'final signoff helper added'],
      remainingAction: 'Codex/local must run npm ci, build, smoke, full tests, browser/mobile proof, Cloudflare deploy proof and Dodo/server proof before paid activation.',
      owner: 'Codex/local/live'
    }
  ];
}

export function summarizeGapRegistry(registry = buildOldAuditGapRegistry()) {
  const summary = { codedImproved: 0, plannedNext: 0, externalBlockers: 0, total: registry.length };
  for (const gap of registry) {
    if (gap.currentStatus === 'coded-improved') summary.codedImproved += 1;
    if (gap.currentStatus === 'planned-next') summary.plannedNext += 1;
    if (gap.currentStatus === 'external-blocker') summary.externalBlockers += 1;
  }
  return summary;
}

export function buildShortCEOChecklist(options = {}) {
  const enablePaid = Boolean(options.enablePaidFeatures);
  const enableCreatorCommerce = Boolean(options.enableCreatorCommerce);
  return [
    'Keep EON City as the single flagship game/world surface.',
    'Keep every user workstation private by default; visitors and P2P ghosts cannot enter it.',
    'Keep launch revenue simple: Dodo subscriptions first; creator commerce, wallet checkout and seller marketplace remain disabled.',
    enableCreatorCommerce
      ? 'Do not enable live creator commerce in this launch path; create a separate reviewed seller/payment wave first.'
      : 'Creator commerce stays disabled.',
    enablePaid
      ? 'Do not enable paid CTAs until Dodo checkout, signed webhook and entitlement-ledger proof are recorded.'
      : 'Paid CTAs may remain visible as disabled plan paths, but checkout/trial activation waits for proof.',
    'Run build, smoke, full tests, secret scan, mobile QA, browser QA, and service-worker proof in Codex/local before deploy.',
    'Broad launch only after CEO accepts remaining legal/payment/browser risks.'
  ];
}

export function buildCEOCertificationPlan(options = {}) {
  const gaps = buildOldAuditGapRegistry();
  const summary = summarizeGapRegistry(gaps);
  return {
    schema: CEO_CERTIFICATION_SCHEMA,
    date: options.date || '2026-07-10',
    target: 'GPT-5.5 CEO certification for Codex handoff',
    launchStance: 'not-broad-launch-from-chat; soft-launch-candidate-after-local-proof',
    extraWaves: CEO_EXTRA_WAVES,
    oldAuditGapSummary: summary,
    oldAuditGaps: gaps,
    shortCEOChecklist: buildShortCEOChecklist(options),
    hardStop: [
      'No broad launch without local build/smoke proof.',
      'No paid activation without Dodo checkout, signed webhook and server entitlement-ledger proof.',
      'No referral/EON Key grants without server referral ledger, idempotency and abuse-cap proof.',
      'No creator-commerce, wallet checkout or seller marketplace activation in this launch path.',
      'No profit/resale/passive-income claims.'
    ]
  };
}

export function validateCEOCertificationPlan(plan = buildCEOCertificationPlan()) {
  const problems = [];
  if (plan.schema !== CEO_CERTIFICATION_SCHEMA) problems.push('Unexpected CEO certification schema.');
  if ((plan.extraWaves || []).length !== 3) problems.push('Plan must include exactly 3 extra CEO waves.');
  if (!plan.oldAuditGaps?.some((gap) => gap.id === 'W11-DEPLOY')) problems.push('Plan must include deploy/live-proof external blocker.');
  if (!plan.oldAuditGaps?.some((gap) => gap.id === 'W5-ADS-SPONSORS')) problems.push('Plan must include ad/sponsor decision gap.');
  if (!plan.oldAuditGaps?.some((gap) => gap.id === 'W5-MARKET-SELLER-POLICY')) problems.push('Plan must include market seller policy gap.');
  if (!plan.oldAuditGaps?.some((gap) => gap.id === 'W2-DODO-IDEMPOTENCY')) problems.push('Plan must include Dodo idempotency/server proof gap.');
  if (!plan.shortCEOChecklist?.some((item) => /private/i.test(item) && /workstation/i.test(item))) problems.push('Private workstation rule missing.');
  if (!plan.hardStop?.some((item) => /Dodo/i.test(item))) problems.push('Dodo activation hard stop missing.');
  if (!plan.hardStop?.some((item) => /No profit|profit/i.test(item))) problems.push('Financial overclaim hard stop missing.');
  return { ok: problems.length === 0, problems };
}
