#!/usr/bin/env node
import assert from 'node:assert/strict';
import { getComfyUiVideoWorkflowRegistryTruth } from '../assets/js/local-ai/comfyui-video-workflow-registry.js';
const truth = getComfyUiVideoWorkflowRegistryTruth();
assert.equal(truth.firstProofMode, 'image-to-video');
assert.equal(truth.arbitraryWorkflowExecutionAllowed, false);
assert.equal(truth.customNodesAllowed, false);
assert.equal(truth.automaticWorkflowDownload, false);
assert.equal(truth.automaticModelDownload, false);
assert.equal(truth.digestConfirmationRequiredEverySession, true);
console.log('[W625F] PASS 8/8 local-video workflow invariants');
