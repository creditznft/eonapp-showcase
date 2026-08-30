#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { getDirectProviderRegistryTruth } from '../assets/js/direct-byok/provider-registry.js';
const registry = getDirectProviderRegistryTruth();
const models = JSON.parse(fs.readFileSync(new URL('../config/w626-reviewed-provider-models.json', import.meta.url), 'utf8'));
assert.equal(registry.twoVideoAdaptersPresent, true);
assert.equal(models.models.filter((row) => row.mediaKind === 'video').length, 2);
const videoModels = models.models.filter((row) => row.mediaKind === 'video');
assert.equal(videoModels.every((row) => row.enabled === true), true);
assert.equal(models.status, 'reviewed-source-rails-enabled-real-user-owned-provider-proof-pending');
assert.equal(registry.arbitraryProviderEndpointsAllowed, false);
assert.equal(registry.arbitraryModelIdsAllowed, false);
assert.equal(registry.realProviderProofComplete, false);
assert.match(registry.currentProofState, /pending/);
console.log('[W626D] PASS 8/8 external video adapter source and review gates');
