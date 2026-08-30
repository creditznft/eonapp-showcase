#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { getCredentialStoreTruth } from '../creator-companion/src/credential-store.mjs';
import { getPairingTruth } from '../creator-companion/src/pairing.mjs';
import { getCreatorCompanionClientTruth } from '../assets/js/direct-byok/companion-client.js';
const release = JSON.parse(fs.readFileSync(new URL('../config/w626-creator-companion-release.json', import.meta.url), 'utf8'));
const server = fs.readFileSync(new URL('../creator-companion/src/server.mjs', import.meta.url), 'utf8');
assert.equal(getCreatorCompanionClientTruth().loopbackHost, '127.0.0.1');
assert.equal(getCreatorCompanionClientTruth().lanAllowed, false);
assert.equal(getCredentialStoreTruth().plaintextFileFallback, false);
assert.equal(getPairingTruth().maxPairingAttempts, 5);
assert.match(server, /isAllowedEonAppOrigin/);
assert.match(server, /server\.listen\(PORT, HOST/);
assert.equal(release.sourceComplete, true);
assert.equal(release.publicReleaseAllowed, false);
console.log('[W626B] PASS 8/8 Creator Companion source and signing boundaries');
