#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { R4_COMM01_PLANNED_CATALOG, validateR4Comm01Contract } from '../config/r4-comm01-graphite-commerce-contract.mjs';
import { W450_DODO_CATALOGUE_ENVELOPE } from '../config/w450-dodo-approval-readiness-contract.mjs';
import { W450A_DODO_CATALOGUE_ENVELOPE_SCHEMA, W450A_PAID_TIER_IDS, validateW450aDodoCatalogueEnvelopeContract } from '../config/w450a-dodo-catalogue-envelope-contract.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

export function inspectW450aDodoCatalogueEnvelope({ writeArtifact = false } = {}) {
  const errors = [...validateW450aDodoCatalogueEnvelopeContract(), ...validateR4Comm01Contract()];
  const billing = read('billing.html');
  const publicDodo = read('assets/js/commerce/dodo-approval-readiness.js');
  const r4Paid = R4_COMM01_PLANNED_CATALOG.filter((entry) => W450A_PAID_TIER_IDS.includes(entry.id));
  if (r4Paid.length !== 4 || r4Paid.some((entry) => entry.plannedPriceUsdReference !== 'not-finalized-within-49.99-monthly-cap')) errors.push('R4 catalogue must not retain stale INR figures or activate paid tier pricing.');
  if (!/No checkout, subscription, free trial, payment callback, or payment rail is active/i.test(billing)) errors.push('Billing must keep the approval-pending no-checkout statement.');
  if (!/checkoutActive: false/.test(publicDodo) || !/publicTrialActive: false/.test(publicDodo)) errors.push('Public Dodo status must remain fail-closed.');
  const report = Object.freeze({
    schema: W450A_DODO_CATALOGUE_ENVELOPE_SCHEMA,
    wave: 'W461', sourceOnly: true, status: errors.length ? 'fail' : 'pass',
    maximumMonthlyUsd: W450_DODO_CATALOGUE_ENVELOPE.maximumMonthlyUsd,
    paidTierIds: W450A_PAID_TIER_IDS,
    errors: Object.freeze(errors),
    limitations: Object.freeze([
      'This source envelope is not a Dodo catalogue, price list, tax quote, checkout, trial, mandate, webhook or entitlement implementation.',
      'Exact price, regional conversion, tax, refund/cancellation copy and renewal timing require approved-account and end-to-end lifecycle proof.'
    ])
  });
  if (writeArtifact) {
    const dir = path.join(root, 'artifacts', 'w450a-dodo-catalogue-envelope-gate');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'stats.json'), `${JSON.stringify(report, null, 2)}\n`);
  }
  return report;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const report = inspectW450aDodoCatalogueEnvelope({ writeArtifact: true });
  assert.equal(report.status, 'pass', report.errors.join('\n'));
  process.stdout.write(`W450.1 Dodo catalogue envelope gate passed (${report.paidTierIds.length} planned paid tiers; $${report.maximumMonthlyUsd.toFixed(2)} cap; no public billing).\n`);
}
