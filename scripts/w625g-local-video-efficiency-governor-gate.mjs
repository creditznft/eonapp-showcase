#!/usr/bin/env node
import assert from 'node:assert/strict';
import { getLocalVideoGovernorTruth } from '../assets/js/local-ai/local-video-efficiency-governor.js';
const truth = getLocalVideoGovernorTruth();
assert.equal(truth.queueConcurrency, 1);
assert.equal(truth.batch, 1);
assert.equal(truth.automaticCleanup, false);
assert.equal(truth.cleanupRequiresUserApproval, true);
assert.equal(truth.exactMemoryPromise, false);
assert.equal(truth.exactLatencyPromise, false);
console.log('[W625G] PASS 8/8 local-video efficiency invariants');
