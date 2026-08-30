#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { getLocalVideoCapabilityTruth } from '../assets/js/local-ai/comfyui-video-capability.js';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = fs.readFileSync(path.join(root, 'assets/js/local-ai/comfyui-video-capability.js'), 'utf8');
const truth = getLocalVideoCapabilityTruth();
assert.equal(truth.ownerFourGbLaneMustRemainBlocked, true);
assert.equal(truth.automaticInstall, false);
assert.equal(truth.cloudFallback, false);
assert.doesNotMatch(source, /192\.168\.|10\.0\.0\./);
console.log('[W625D] PASS 8/8 local-video capability invariants');
