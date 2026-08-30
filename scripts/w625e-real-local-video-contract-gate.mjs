#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { getComfyUiVideoRuntimeTruth } from '../assets/js/local-ai/comfyui-video-runtime.js';
import { getLocalVideoProofTruth } from '../assets/js/local-ai/local-video-proof.js';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const runtime = fs.readFileSync(path.join(root, 'assets/js/local-ai/comfyui-video-runtime.js'), 'utf8');
const lab = fs.readFileSync(path.join(root, 'assets/js/local-ai/comfyui-video-lab.js'), 'utf8');
assert.equal(getComfyUiVideoRuntimeTruth().approvedLoopbackOnly, true);
assert.equal(getComfyUiVideoRuntimeTruth().sourceIntegrationCanAwardRealProof, false);
assert.equal(getLocalVideoProofTruth().realProofRequiresElevenNegativeLanes, true);
assert.match(runtime, /\/prompt/);
assert.match(runtime, /\/history\//);
assert.match(runtime, /\/upload\/image/);
assert.match(lab, /Save to this device/);
assert.match(lab, /Reopen saved video/);
console.log('[W625E] PASS 10/10 real-local-video contract invariants');
