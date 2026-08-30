import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const renderer = await readFile(new URL('../../assets/js/city/w766/eon-expanse-w766i-open-world-renderer.js', import.meta.url), 'utf8');
const frontier = await readFile(new URL('../../assets/js/city/w766/eon-expanse-w766b-signal-frontier.js', import.meta.url), 'utf8');

test('W784A defaults deterministic development previews off in the release runtime', () => {
  assert.match(renderer, /developmentPreview = false/);
  assert.match(renderer, /mesh\.setEnabled\(developmentPreview === true\)/);
  assert.match(renderer, /plaza\.setEnabled\(developmentPreview === true\)/);
  assert.doesNotMatch(frontier, /developmentPreview:\s*true/);
});

test('W784A disables collisions for hidden development buildings while preserving explicit markers', () => {
  assert.match(renderer, /collisions: ring === 'interactive' && developmentPreview === true/);
  assert.match(renderer, /presentationTruth: 'interaction-target-only'/);
  assert.doesNotMatch(renderer, /interaction-target-only'[^\n]*setEnabled\(developmentPreview/);
});

test('W784A reports visible development proxies separately from unresolved authored replacements', () => {
  assert.match(renderer, /visibleDevelopmentProxyCount/);
  assert.match(renderer, /developmentPreviewEnabled: developmentPreview === true/);
  assert.match(renderer, /releasePresentationHidesDevelopmentProxies: developmentPreview !== true/);
  assert.match(renderer, /futureRegionReleaseArtReady: developmentBuildingProxyCount === 0 && ambientDevelopmentProxyCount === 0/);
});

test('W784A preserves terrain, routes, distant silhouettes and reviewed contract gameplay', () => {
  assert.match(renderer, /w766i-ground-/);
  assert.match(renderer, /w766i-road-x-/);
  assert.match(renderer, /presentationTruth: 'distant-silhouette'/);
  assert.match(renderer, /frontier-contract-interaction/);
  assert.match(renderer, /frontier-contract-step/);
});
