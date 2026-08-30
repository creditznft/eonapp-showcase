#!/usr/bin/env node
/** W452.1 source gate: active route emitters use canonical destinations only. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  listEonAppDeckCards,
  validateEonAppDeckCatalog
} from '../assets/js/apps/eon-app-deck-catalog.js';
import { R4_COMM01_MONETISATION_DECISION, validateR4Comm01Contract } from '../config/r4-comm01-graphite-commerce-contract.mjs';
import {
  W452A_ACTIVE_CANONICAL_DESTINATION_SCHEMA,
  W452A_CANONICAL_DESTINATIONS,
  W452A_RETIRED_INBOUND_ALIASES,
  validateW452aActiveCanonicalDestinationContract
} from '../config/w452a-active-canonical-destination-contract.mjs';
import { W450_DODO_STATUS, validateW450DodoApprovalReadinessContract } from '../config/w450-dodo-approval-readiness-contract.mjs';
import { PRIMARY_APP_ROUTES, RETIRED_REDIRECTS } from '../config/route-contract.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const ensure = (condition, message, errors) => { if (!condition) errors.push(message); };

const EXPECTED_RESEARCH_DESKS = Object.freeze(['market', 'business', 'forecast', 'research', 'data']);

export function inspectW452aActiveCanonicalDestination({ writeArtifact = false } = {}) {
  const errors = [
    ...validateW452aActiveCanonicalDestinationContract(),
    ...validateEonAppDeckCatalog(),
    ...validateR4Comm01Contract(),
    ...validateW450DodoApprovalReadinessContract()
  ];
  const appDeckSource = read('assets/js/apps/eon-app-deck-catalog.js');
  const appsDecision = read('docs/R4_APPS_BLUEPRINTS_COMMERCE_DECISION_2026-06-26.md');
  const commercialDecision = read('docs/R4_COMM01_GRAPHITE_THEME_AND_MONETISATION_DECISION_2026-06-26.md');
  const insights = listEonAppDeckCards('insights');
  const publicResearch = PRIMARY_APP_ROUTES.find((route) => route.id === 'insights');
  const redirectMap = new Map(RETIRED_REDIRECTS.map((route) => [route.from, route]));

  ensure(insights.length === EXPECTED_RESEARCH_DESKS.length, 'App Deck must expose exactly five Research Lab desks.', errors);
  ensure(insights.every((card, index) => card.desk === EXPECTED_RESEARCH_DESKS[index] && card.route === `${W452A_CANONICAL_DESTINATIONS.research}?desk=${EXPECTED_RESEARCH_DESKS[index]}`), 'Every App Deck Research Lab card must emit its canonical /insights desk route.', errors);
  ensure(!/\broute\s*:\s*['"]\/trade(?:\.html)?(?:[?#][^'"]*)?['"]/.test(appDeckSource), 'Active App Deck source must not emit /trade as a foreground destination.', errors);
  ensure(publicResearch?.from === W452A_CANONICAL_DESTINATIONS.research && publicResearch?.lifecycle === 'local-research' && publicResearch?.file === 'trade.html', 'Route contract must expose /insights as public Research Lab while trade.html remains only a physical source document.', errors);
  ensure(W452A_RETIRED_INBOUND_ALIASES.research.every((alias) => redirectMap.get(alias)?.to === W452A_CANONICAL_DESTINATIONS.research && redirectMap.get(alias)?.status === 301), 'Every declared Research Lab alias must redirect to canonical /insights.', errors);
  ensure(/W450 supersession note/.test(appsDecision) && /Dodo Payments is the single approval-pending planning candidate/.test(appsDecision), 'Apps commerce decision must reference the current W450 Dodo status.', errors);
  ensure(!/Razorpay is the primary candidate/i.test(appsDecision) && !/Cashfree is the fallback/i.test(appsDecision), 'Apps commerce decision must not retain former processor selection copy.', errors);
  ensure(/Dodo Payments.*single approval-pending/i.test(commercialDecision) && !/Razorpay.*primary/i.test(commercialDecision), 'Commercial decision must retain Dodo as the only approval-pending candidate.', errors);
  ensure(R4_COMM01_MONETISATION_DECISION.processors.primaryCandidate === 'Dodo Payments' && R4_COMM01_MONETISATION_DECISION.processors.fallbackCandidate === null, 'R4 configuration must not queue a legacy processor fallback.', errors);
  ensure(W450_DODO_STATUS.merchantApproved === false && W450_DODO_STATUS.checkoutConnected === false && W450_DODO_STATUS.publicTrialActive === false, 'Dodo approval, checkout and trial must remain fail-closed.', errors);

  const report = Object.freeze({
    schema: W452A_ACTIVE_CANONICAL_DESTINATION_SCHEMA,
    wave: 'W459',
    status: errors.length ? 'fail' : 'pass',
    sourceOnly: true,
    canonicalDestinations: W452A_CANONICAL_DESTINATIONS,
    researchDeskRoutes: Object.freeze(insights.map((card) => card.route)),
    retiredResearchAliases: W452A_RETIRED_INBOUND_ALIASES.research,
    errors: Object.freeze(errors),
    limitations: Object.freeze([
      'This is a source contract only; it does not prove deployed redirects, browser history behaviour or service-worker cache adoption.',
      'Dodo Payments remains approval-pending. This gate does not connect a merchant account, hosted checkout, webhook, trial, customer portal or entitlement service.'
    ])
  });

  if (writeArtifact) {
    const directory = path.join(root, 'artifacts', 'w452a-active-canonical-destination-gate');
    fs.mkdirSync(directory, { recursive: true });
    fs.writeFileSync(path.join(directory, 'stats.json'), `${JSON.stringify(report, null, 2)}\n`);
  }
  return report;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const report = inspectW452aActiveCanonicalDestination({ writeArtifact: true });
  assert.equal(report.status, 'pass', report.errors.join('\n'));
  process.stdout.write(`W452.1 active canonical-destination gate passed (${report.researchDeskRoutes.length} Research Lab desks; Dodo remains fail-closed).\n`);
}
