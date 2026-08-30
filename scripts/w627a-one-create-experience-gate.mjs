#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { getCreatorModeTruth } from '../assets/js/create/creator-mode-contract.js';
const html = fs.readFileSync(new URL('../create.html', import.meta.url), 'utf8');
const hub = fs.readFileSync(new URL('../assets/js/create/eon-create-hub.js', import.meta.url), 'utf8');
const truth = getCreatorModeTruth();
assert.equal(truth.oneCreateSurface, true);
assert.equal(truth.localDirectGuideRailsOnly, true);
assert.match(html, /eon-create-root/);
assert.match(hub, /renderUnifiedCreatorWorkspace/);
assert.match(hub, /EON_CREATE_MODES/);
assert.match(hub, /renderDirectByokWorkspace/);
assert.equal(truth.hiddenCloudFallback, false);
assert.equal(truth.draftCreationStartsGeneration, false);
console.log('[W627A] PASS 8/8 one Create experience invariants');
