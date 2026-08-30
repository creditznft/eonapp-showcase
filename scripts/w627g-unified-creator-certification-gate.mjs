#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildCreatorCertificationBoard, getUnifiedCreatorCertificationTruth } from '../assets/js/create/creator-certification.js';
const config = JSON.parse(fs.readFileSync(new URL('../config/w627-creator-certification-board.json', import.meta.url), 'utf8'));
const board = buildCreatorCertificationBoard({});
const truth = getUnifiedCreatorCertificationTruth();
assert.equal(board.pass, false);
assert.equal(board.verdict, 'no-go-real-creator-evidence-pending');
assert.equal(board.totalCount, 10);
assert.equal(truth.sourceIntegrationAloneCanPass, false);
assert.equal(truth.realImageAndVideoRequired, true);
assert.equal(truth.keyboardAndTouchRequired, true);
assert.equal(config.publicAvailabilityClaimAllowed, false);
assert.equal(config.verdict, 'no-go-real-creator-evidence-pending');
assert.equal(truth.publicClaimDefault, false);
console.log('[W627G] PASS 9/9 unified Creator certification invariants');
