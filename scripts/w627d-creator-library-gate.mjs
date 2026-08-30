#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { getCreatorLibraryTruth } from '../assets/js/create/creator-library-store.js';
const html = fs.readFileSync(new URL('../library.html', import.meta.url), 'utf8');
const truth = getCreatorLibraryTruth();
assert.equal(truth.metadataInLocalStorage, true);
assert.equal(truth.mediaInIndexedDbOnlyWhenExplicitlySaved, true);
assert.equal(truth.rawMediaInGenericCapsule, false);
assert.equal(truth.promptOptInOnly, true);
assert.equal(truth.credentialsAllowed, false);
assert.equal(truth.digestRequiredBeforeSave, true);
assert.equal(truth.userDeletionSupported, true);
assert.match(html, /eon-creator-library-root/);
console.log('[W627D] PASS 8/8 Creator Library invariants');
