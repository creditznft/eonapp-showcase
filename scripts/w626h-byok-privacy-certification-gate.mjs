#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { getDirectByokPrivacyTruth } from '../assets/js/direct-byok/byok-certification.js';
const truth = getDirectByokPrivacyTruth();
const board = JSON.parse(fs.readFileSync(new URL('../config/w626-byok-certification-board.json', import.meta.url), 'utf8'));
assert.equal(truth.providerDisclosureBeforeSubmit, true);
assert.equal(truth.promptsAndMediaDirectFromUserDevice, true);
assert.equal(truth.eonappServerLogsAllowed, false);
assert.equal(truth.eonappServerMediaStorageAllowed, false);
assert.equal(truth.localHistoryDeleteSupported, true);
assert.equal(truth.desktopAndSupportedMobileRealOutputsRequired, true);
assert.equal(truth.sourceIntegrationAloneCanPass, false);
assert.equal(board.verdict, 'no-go-real-provider-evidence-pending');
assert.equal(board.publicAvailabilityClaimAllowed, false);
console.log('[W626H] PASS 9/9 Direct BYOK privacy and certification invariants');
