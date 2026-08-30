#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { EON_CREATOR_UI_MODES, getCreatorModeTruth, normalizeCreatorUiMode } from '../assets/js/create/creator-mode-contract.js';
const workspace = fs.readFileSync(new URL('../assets/js/create/creator-unified-workspace.js', import.meta.url), 'utf8');
const truth = getCreatorModeTruth();
assert.deepEqual(EON_CREATOR_UI_MODES, ['beginner', 'advanced']);
assert.equal(normalizeCreatorUiMode('unknown'), 'beginner');
assert.equal(truth.beginnerDefault, true);
assert.equal(truth.advancedControlsExplicit, true);
assert.match(workspace, /data-eon-creator-ui-mode="beginner"/);
assert.match(workspace, /data-eon-creator-ui-mode="advanced"/);
assert.match(workspace, /data-eon-creator-advanced/);
assert.match(workspace, /savePromptToLibrary/);
console.log('[W627B] PASS 8/8 beginner and advanced mode invariants');
