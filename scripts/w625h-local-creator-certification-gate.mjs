#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { getLocalCreatorCertificationTruth } from '../assets/js/local-ai/local-creator-certification.js';
const truth = getLocalCreatorCertificationTruth();
const board = JSON.parse(fs.readFileSync(new URL('../config/w625h-local-creator-certification-board.json', import.meta.url), 'utf8'));
assert.equal(truth.realImageEvidenceRequired, true);
assert.equal(truth.realVideoEvidenceRequired, true);
assert.equal(truth.ownerFourGbFallbackRequired, true);
assert.equal(truth.supportedReferenceDeviceRequired, true);
assert.equal(truth.sourceIntegrationAloneCanPass, false);
assert.equal(truth.localVideoCurrentlyCertified, false);
assert.equal(board.verdict, 'no-go-real-evidence-pending');
assert.equal(board.sourceIntegrationAloneCanPass, false);
assert.equal(board.requiredEvidence.w625eRealVideoProof, 'pending');
console.log('[W625H] PASS 9/9 local-creator certification invariants');
