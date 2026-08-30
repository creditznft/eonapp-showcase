#!/usr/bin/env node
import assert from 'node:assert/strict';
import { EON_CREATOR_JOB_STATES, getCreatorLifecycleTruth } from '../assets/js/create/creator-job-lifecycle.js';
const truth = getCreatorLifecycleTruth();
assert.deepEqual(EON_CREATOR_JOB_STATES, ['draft', 'preparing', 'waiting', 'running', 'failed', 'cancelled', 'complete', 'saved', 'deleted']);
assert.equal(truth.localAndDirectAreProjectedNotReimplemented, true);
assert.equal(truth.deletedIsTerminal, true);
assert.equal(truth.completeDoesNotEqualSaved, true);
assert.equal(truth.rawPromptStored, false);
assert.equal(truth.credentialsStored, false);
assert.equal(truth.states.length, 9);
assert.equal(truth.schema, 'eon.creator.job.w627c.v1');
console.log('[W627C] PASS 8/8 unified creator lifecycle invariants');
