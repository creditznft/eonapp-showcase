#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { classifyPortableStateKey } from '../config/w476-portable-state-contract.mjs';
import { getCreatorDataSurvivalTruth } from '../assets/js/create/creator-data-survival.js';
const capsule = fs.readFileSync(new URL('../assets/js/local-first/eon-workspace-capsule.js', import.meta.url), 'utf8');
const truth = getCreatorDataSurvivalTruth();
assert.equal(classifyPortableStateKey('eon:creator-library:v1').category, 'included-encrypted-backup');
assert.equal(classifyPortableStateKey('eon:creator-jobs:v1').category, 'included-encrypted-backup');
assert.equal(truth.rawMediaInGenericCapsule, false);
assert.equal(truth.restorePreviewRequired, true);
assert.equal(truth.perConflictChoiceRequired, true);
assert.equal(truth.futureVersionsRejected, true);
assert.equal(truth.automaticMerge, false);
assert.match(capsule, /raw creator media/);
console.log('[W627F] PASS 8/8 Creator data survival invariants');
