#!/usr/bin/env node
import assert from 'node:assert/strict';
import { getFalAdapterTruth } from '../assets/js/direct-byok/provider-adapters/fal.js';
import { getReplicateAdapterTruth } from '../assets/js/direct-byok/provider-adapters/replicate.js';
import { getDirectProviderRegistryTruth } from '../assets/js/direct-byok/provider-registry.js';
const fal = getFalAdapterTruth();
const replicate = getReplicateAdapterTruth();
const registry = getDirectProviderRegistryTruth();
assert.equal(registry.twoImageAdaptersPresent, true);
assert.equal(fal.submit, true);
assert.equal(fal.cancel, true);
assert.equal(replicate.capabilityDiscovery, true);
assert.equal(replicate.submit, true);
assert.equal(replicate.cancel, true);
assert.equal(fal.automaticPaidRetry, false);
assert.equal(registry.realProviderProofComplete, false);
console.log('[W626C] PASS 8/8 external image adapter source invariants');
