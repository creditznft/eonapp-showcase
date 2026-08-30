#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildBillingCertificationBoard, redactBillingEvidence, W628_REAL_EVIDENCE_KEYS } from '../assets/js/billing/eon-billing-lifecycle.js';
const config = JSON.parse(fs.readFileSync(new URL('../config/w628-billing-certification-board.json', import.meta.url), 'utf8'));
const board = buildBillingCertificationBoard({});
const redacted = redactBillingEvidence({ rows: [{ proof: 'forgedRejected', status: 'pending', rawPayload: 'secret', customerEmail: 'x@y.test' }] });
assert.equal(board.pass, false);
assert.equal(board.verdict, 'no-go-real-dodo-lifecycle-evidence-pending');
assert.equal(board.totalCount, 17);
assert.equal(W628_REAL_EVIDENCE_KEYS.length, 17);
assert.equal(config.publicAvailabilityClaimAllowed, false);
assert.equal(config.liveCustomerEvidenceIncluded, false);
assert.equal(redacted.containsRawPayload, false);
assert.equal(redacted.containsCustomerEmail, false);
assert.equal(redacted.containsWebhookSecret, false);
assert.equal(redacted.containsApiKey, false);
console.log('[W628F] PASS 10/10 genuine billing certification invariants');
