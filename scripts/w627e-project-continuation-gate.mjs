#!/usr/bin/env node
import assert from 'node:assert/strict';
import { getCreatorProjectIntegrationTruth } from '../assets/js/create/creator-project-integration.js';
const truth = getCreatorProjectIntegrationTruth();
assert.equal(truth.projectAttachmentExplicit, true);
assert.equal(truth.forgeHandoffSessionOnly, true);
assert.equal(truth.cityReceivesSafeReferenceOnly, true);
assert.equal(truth.rawPromptShared, false);
assert.equal(truth.mediaBodyShared, false);
assert.equal(truth.backgroundPublish, false);
assert.equal(truth.remoteDeploy, false);
assert.equal(truth.schema, 'eon.creator-project-handoff.w627e.v1');
console.log('[W627E] PASS 8/8 project continuation invariants');
