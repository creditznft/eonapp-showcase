import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { validateEonDestinationRegistry } from '../../assets/js/contracts/navigation/eon-destination-registry.js';

const read = (relative) => fs.readFileSync(new URL(`../../${relative}`, import.meta.url), 'utf8');

test('A15 I04 integrates Create, Projects, Creator and Forge through one handoff authority', () => {
  const create = read('assets/js/create/eon-create-hub.js');
  const projects = read('assets/js/projects/eon-projects-page.js');
  const creator = read('assets/js/create/creator-project-integration.js');
  const forge = read('assets/js/forge/eon-forge-quick-build.js');
  assert.match(create, /prepareCreateDestinationHandoff/);
  assert.match(create, /findEonDestinationByRoute/);
  assert.match(projects, /consumeEonHandoffFromLocation\(\{ receiverId: 'projects' \}\)/);
  assert.match(projects, /Nothing was created, changed, published or sent automatically|No project was created, changed, published or sent automatically/);
  assert.match(creator, /kind: 'creator-asset-reference'/);
  assert.match(creator, /rawPromptIncluded: false/);
  assert.match(creator, /mediaBodyIncluded: false/);
  assert.match(forge, /consumeEonHandoffFromLocation\(\{ receiverId: 'forge' \}\)/);
  assert.match(forge, /Nothing was applied automatically/);
});

test('A15 I04 support prefill is versioned, session-only and consumed by EONBOT home', () => {
  const support = read('assets/js/support-page.js');
  const home = read('assets/js/eonbot-home.js');
  assert.match(support, /kind: 'support-prefill'/);
  assert.match(support, /writeEonHandoff/);
  assert.doesNotMatch(support, /eon:support:prefill:v1/);
  assert.match(home, /consumeEonHandoffFromLocation\(\{ receiverId: 'home' \}\)/);
  assert.match(home, /supportPromptFromHandoff/);
  assert.match(home, /Do not ask me for seed phrases/);
});

test('A15 I04 Continue, Atlas and Create catalogue resolve current destinations centrally', () => {
  assert.equal(validateEonDestinationRegistry().ok, true);
  assert.match(read('assets/js/retention/eon-continue-resolver.js'), /buildEonDestinationHref/);
  assert.match(read('assets/js/retention/eon-continue-surface.js'), /eonContinueDestination/);
  assert.match(read('assets/js/nexus/w705/eon-nexus-w705-atlas-entry.js'), /buildEonDestinationHref/);
  assert.match(read('assets/js/create/eon-create-catalog.js'), /buildEonDestinationHref/);
});

test('A15 I04 receivers remove consumed or invalid handoff query tokens', () => {
  for (const relative of [
    'assets/js/eonbot-home.js',
    'assets/js/create/eon-create-hub.js',
    'assets/js/create/creator-library-page.js',
    'assets/js/forge/eon-forge-quick-build.js',
    'assets/js/projects/eon-projects-page.js'
  ]) {
    const source = read(relative);
    assert.match(source, /removeEonHandoffQuery/);
  }
});
