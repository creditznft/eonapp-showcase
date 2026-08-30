#!/usr/bin/env node
/** R4-COMM-03 source gate: final solo pricing, public truth and Codex handover. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  R4_COMM03_CURRENCY_POLICY,
  R4_COMM03_EON_INVITE_BOUNDARY,
  R4_COMM03_ORGANISATION_SCOPE,
  R4_COMM03_PRICE_BOOKS,
  R4_COMM03_SOLO_TIER_DESIGN,
  R4_COMM03_STATUS,
  validateR4Comm03Contract
} from '../config/r4-comm03-solo-pricing-contract.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REQUIRED_FILES = Object.freeze([
  'config/r4-comm03-solo-pricing-contract.mjs',
  'docs/R4_COMM03_SOLO_PRICING_AND_CATALOGUE_DECISION_2026-06-26.md',
  'docs/CODEX_W379_FINAL_MERGE_AND_RETURN_EVIDENCE_2026-06-26.md',
  'CURRENT_HANDOFF_2026-06-26/R4_W379_START_HERE.md',
  'CURRENT_HANDOFF_2026-06-26/R4_W379_CONTINUATION_PROMPT.md',
  'CURRENT_HANDOFF_2026-06-26/R4_W379_FULL_SOURCE_HANDOVER_STATUS.md',
  'CHANGELOG_W379_SOLO_PRICING_FINAL_HANDOVER_2026-06-26.md'
]);
const ACTIVE_LEGACY_PLAN_LINK_FILES = Object.freeze([
  '404.html',
  'blog/index.html',
  'blog/5-ways-to-earn-pool-points-eonl.html',
  'blog/build-side-hustle-with-ai.html',
  'blog/eon-signal-thesis-generator.html',
  'blog/how-to-run-ai-missions-free.html',
  'blog/how-to-set-up-local-ai-ollama.html',
  'tools/archetype-scan.html',
  'tools/creator-workspace.html',
  'tools/dream-interpreter.html'
]);

function read(root, relative) { return fs.readFileSync(path.join(root, relative), 'utf8'); }
function exists(root, relative) { return fs.existsSync(path.join(root, relative)); }

export function inspectR4Comm03({ root = ROOT } = {}) {
  const errors = [...validateR4Comm03Contract()];
  for (const relative of REQUIRED_FILES) if (!exists(root, relative)) errors.push(`Missing W379 required file: ${relative}`);
  if (errors.length) return Object.freeze({ ok: false, errors, sourceOnly: true });

  const pkg = JSON.parse(read(root, 'package.json'));
  if (!pkg.scripts?.['qa:r4-comm03-solo-pricing']) errors.push('Missing qa:r4-comm03-solo-pricing package command.');
  const currentProgram = String(pkg.scripts?.['qa:r4-current-program'] || '');
  if (!currentProgram.includes('qa:r4-comm03-solo-pricing')) errors.push('Current program gate must include R4-COMM-03.');
  const syntax = String(pkg.scripts?.['qa:w216-source-syntax'] || '');
  for (const marker of ['r4-comm03-solo-pricing-contract.mjs', 'r4-comm03-solo-pricing-gate.mjs']) if (!syntax.includes(marker)) errors.push(`Source syntax gate missing ${marker}.`);

  const decision = read(root, 'docs/R4_COMM03_SOLO_PRICING_AND_CATALOGUE_DECISION_2026-06-26.md');
  for (const marker of ['$4.99 / ₹499', '$14.99 / ₹1,499', '$29.99 / ₹2,999', '$49.99 / ₹4,999', 'not for sale', 'not in the current roadmap', 'EON Invite']) {
    if (!decision.toLowerCase().includes(marker.toLowerCase())) errors.push(`W379 decision document missing marker: ${marker}`);
  }
  const ladderSection = decision.split('## Not in the current roadmap')[0];
  if (/\|\s*EON (?:Team|Scale)\b|\|\s*Enterprise\b/.test(ladderSection)) errors.push('W379 decision must not position organisation plans inside the active solo ladder.');
  if (!/not runtime FX conversion/i.test(decision)) errors.push('W379 decision must state fixed-price rather than runtime FX truth.');

  const codex = read(root, 'docs/CODEX_W379_FINAL_MERGE_AND_RETURN_EVIDENCE_2026-06-26.md');
  for (const marker of ['final commit SHA', 'GitHub CI run URL/status', 'W276', 'No paid claim']) {
    if (!codex.toLowerCase().includes(marker.toLowerCase())) errors.push(`Codex return evidence handover missing: ${marker}`);
  }
  if (!/Do not add or ask for Google, Cloudflare, payment-provider or any other\s+secret/i.test(codex)) errors.push('Codex return evidence handover must forbid secret requests.');

  const ledger = JSON.parse(read(root, 'program/R4_PROGRAM_LEDGER_2026-06-26.json'));
  const priceLane = (ledger.lanes || []).find((lane) => lane.id === 'M-00A');
  if (priceLane?.status !== 'complete-source' || priceLane?.sourceProofOnly !== true) errors.push('M-00A must remain a source-only completed pricing decision.');
  if (!Array.isArray(priceLane?.evidenceRefs) || !priceLane.evidenceRefs.includes('docs/R4_COMM03_SOLO_PRICING_AND_CATALOGUE_DECISION_2026-06-26.md')) errors.push('M-00A must point to the W379 decision document.');
  const merchantLane = (ledger.lanes || []).find((lane) => lane.id === 'M-00');
  if (merchantLane?.status !== 'hold-governance') errors.push('M-00 must remain hold-governance.');

  if (Object.values(R4_COMM03_STATUS).some((value) => value === true && value !== R4_COMM03_STATUS.sourcePlanningOnly)) errors.push('W379 cannot activate commercial status flags.');
  if (R4_COMM03_PRICE_BOOKS.status !== 'planned-not-public-not-for-sale') errors.push('W379 prices must remain internal planning entries.');
  if (R4_COMM03_CURRENCY_POLICY.browserSideFxAllowed !== false) errors.push('W379 must prohibit browser-side FX.');
  if (R4_COMM03_ORGANISATION_SCOPE.excluded.includes('Enterprise') === false) errors.push('W379 must keep Enterprise out of the current roadmap.');
  if (R4_COMM03_EON_INVITE_BOUNDARY.currentActivation !== false) errors.push('W379 must keep EON Invite inactive.');
  if (R4_COMM03_SOLO_TIER_DESIGN.find((tier) => tier.id === 'eon-max')?.state !== 'designed-not-for-sale') errors.push('W379 must keep EON Max unavailable.');

  for (const relative of ACTIVE_LEGACY_PLAN_LINK_FILES) {
    const html = read(root, relative);
    if (html.includes('href="/subscription"')) errors.push(`${relative} still links active navigation to retired /subscription.`);
    if (!html.includes('href="/billing"')) errors.push(`${relative} must provide Billing status instead of a retired Plans link.`);
  }
  const terms = read(root, 'terms.html');
  if (/Terms for EONAPP\.ch digital tools, subscriptions, AI features, wallet payments, and NFT surfaces\./.test(terms)) errors.push('Terms metadata still advertises historic payment/wallet/NFT product copy.');
  if (!/local-first browser tools, optional identity access, and current product boundaries/i.test(terms)) errors.push('Terms metadata must reflect current source truth.');

  return Object.freeze({
    ok: errors.length === 0,
    errors,
    sourceOnly: true,
    publicPricingActive: false,
    paymentsActivated: false,
    eonInviteActive: false,
    enterpriseActive: false
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const report = inspectR4Comm03();
  fs.mkdirSync(path.join(ROOT, 'artifacts'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, 'artifacts', 'R4_COMM03_SOLO_PRICING_REPORT_2026-06-26.json'), `${JSON.stringify(report, null, 2)}\n`);
  if (!report.ok) {
    report.errors.forEach((error) => console.error(`[R4-COMM-03] ${error}`));
    process.exitCode = 1;
  } else {
    console.log('R4-COMM-03 gate: PASS (solo price books are planning-only; no commerce, referral or enterprise activation).');
  }
}
