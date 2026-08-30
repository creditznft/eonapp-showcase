#!/usr/bin/env node
import assert from 'node:assert/strict';
import { getUnifiedDirectJobFabricTruth } from '../assets/js/direct-byok/direct-job-fabric.js';
const truth = getUnifiedDirectJobFabricTruth();
assert.equal(truth.localAndDirectShareStates, true);
assert.equal(truth.providerSpecificControlsConditional, true);
assert.equal(truth.agentTheatreReceiptsRedacted, true);
assert.equal(truth.directExecutionOwner, 'creator-companion');
assert.equal(truth.eonappServerProxy, false);
assert.equal(truth.browserRefreshRecovery, true);
assert.equal(truth.realProviderProofComplete, false);
assert.equal(Object.keys(truth).length, 7);
console.log('[W626E] PASS 8/8 unified direct job fabric invariants');
