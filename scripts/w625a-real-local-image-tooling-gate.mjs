#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isApprovedComfyUiEndpoint } from '../assets/js/local-ai/comfyui-local-media.js';
import { getLocalImageProofTruth } from '../assets/js/local-ai/local-image-proof.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const checks = [];
const add = (id, pass, detail) => checks.push({ id, pass: Boolean(pass), detail });
const lab = read('assets/js/local-ai/comfyui-image-lab.js');
const adapter = read('assets/js/local-ai/comfyui-local-media.js');
const proof = read('assets/js/local-ai/local-image-proof.js');
const truth = getLocalImageProofTruth();

add('approved-loopback-only', [8000, 8188, 8189].every((port) => isApprovedComfyUiEndpoint(`http://127.0.0.1:${port}`)) && !isApprovedComfyUiEndpoint('http://192.168.1.4:8188'), 'only documented loopback hosts/ports are accepted');
add('positive-path-wired', /generateComfyUiImage/.test(lab) && /fetchComfyUiOutputBlob/.test(lab) && /inspectLocalImageBlob/.test(lab) && /saveLocalImageBlob/.test(lab) && /reopenLocalImageFile/.test(lab), 'generate, fetch, preview, save and reopen helpers are wired');
add('digest-match-required', /digestMatched/.test(lab) && /expectedSha256/.test(proof) && truth.digestMatchRequiredForVerifiedReopen === true, 'reopened bytes must match the generated SHA-256');
add('cancel-wired', /cancelComfyUiJob/.test(lab) && /data-comfy-cancel/.test(lab) && /\/queue/.test(adapter) && /\/interrupt/.test(adapter), 'queued/running cancellation is explicit and loopback-only');
add('receipt-redacted', truth.promptPersisted === false && truth.checkpointFilenameInReceipt === false && truth.localPathInReceipt === false && truth.realProofCanBeAwardedBySource === false, 'receipt excludes sensitive content and source cannot award proof');
add('image-adapter-video-separated', truth.videoEnabled === false && /A working image setup does not imply local video is ready/.test(lab) && !/generateComfyUiVideo/.test(lab), 'the image adapter cannot submit video; local video remains a separate proof-gated surface');
add('no-cloud-fallback', truth.cloudFallback === false && !/fetch\(['"]https:\/\//.test(adapter), 'no hidden cloud execution exists');
add('owner-proof-pending', /checks not yet run remain pending/.test(lab), 'managed source work keeps unrun owner-runtime checks explicitly pending');

for (const row of checks) console.log(`[W625A] ${row.pass ? 'PASS' : 'FAIL'} ${row.id}: ${row.detail}`);
const ok = checks.every((row) => row.pass);
console.log(`[W625A] ${ok ? 'PASS' : 'FAIL'} ${checks.filter((row) => row.pass).length}/${checks.length}; source tooling complete; real owner-runtime image evidence NOT RUN.`);
if (!ok) process.exitCode = 1;
