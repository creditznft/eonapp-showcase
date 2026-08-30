#!/usr/bin/env node
/**
 * Historical diagnostic only. This command never certifies the current product.
 */
import { W393A_HISTORICAL_EVIDENCE_DIAGNOSTIC_TESTS, getW393ALeanHandoverStatus } from '../config/w393a-lean-handover-integrity-contract.mjs';
import { W624D_ARCHIVED_CONTRACT_ASSERTIONS } from '../config/w624d-current-contract-alignment-contract.mjs';

const status = getW393ALeanHandoverStatus();
console.log('[historical-evidence-diagnostic] NOT CERTIFIED: this output is archaeology and migration context only.');
console.log(`[historical-evidence-diagnostic] Current source boundary: ${status.currentSourceBoundary}.`);
console.log(`[historical-evidence-diagnostic] Evidence-dependent archival files excluded from current certification: ${W393A_HISTORICAL_EVIDENCE_DIAGNOSTIC_TESTS.length}.`);
for (const entry of W393A_HISTORICAL_EVIDENCE_DIAGNOSTIC_TESTS) {
  console.log(`- ${entry.test} :: ${entry.reason} (${entry.evidence})`);
}
console.log(`[historical-evidence-diagnostic] Exact superseded assertions retained as explicit skips: ${W624D_ARCHIVED_CONTRACT_ASSERTIONS.length}.`);
for (const entry of W624D_ARCHIVED_CONTRACT_ASSERTIONS) {
  console.log(`- ${entry.file} :: ${entry.name}`);
  console.log(`  reason: ${entry.reason}`);
  console.log(`  maintained replacements: ${entry.replacements.join(', ')}`);
}
console.log('[historical-evidence-diagnostic] This report is informational only and must not be used as release, security, legal, accessibility, visual, browser, device, or operational certification.');
