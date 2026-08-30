#!/usr/bin/env node
import assert from 'node:assert/strict';
import { getDirectJobThreatModel } from '../assets/js/direct-byok/direct-job-contract.js';
import { getDirectProviderRegistryTruth } from '../assets/js/direct-byok/provider-registry.js';
const threat = getDirectJobThreatModel();
const registry = getDirectProviderRegistryTruth();
assert.equal(threat.providerAllowlistRequired, true);
assert.equal(threat.endpointAllowlistRequired, true);
assert.equal(threat.reviewedModelRequired, true);
assert.equal(threat.redirectsFollowedAutomatically, false);
assert.equal(threat.browserPermanentCredentialsAllowed, false);
assert.equal(threat.eonappCloudflareProxyAllowed, false);
assert.deepEqual([...registry.providers].sort(), ['elevenlabs', 'fal', 'replicate']);
assert.equal(registry.hostedMusicAdapterPresent, true);
assert.equal(registry.arbitraryModelIdsAllowed, false);
console.log('[W626A] PASS 9/9 provider-neutral job and threat invariants');
