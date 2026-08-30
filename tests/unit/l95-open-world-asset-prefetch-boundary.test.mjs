import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

const root = new URL('../../', import.meta.url);
const text = async (path) => readFile(new URL(path, root), 'utf8');

test('L95 Command Hub does not eagerly construct Open World asset presenters', async () => {
  const [runtime, signalGateway, profile, manifest] = await Promise.all([
    text('assets/js/city/w731/eon-city-w731-command-hub-runtime.js'),
    text('assets/js/city/w766/eon-expanse-w766a-gateway-overlook.js'),
    text('assets/js/city/w649/eon-city-w649-performance-profile.js'),
    text('assets/js/city/eon-city-runtime-asset-manifest.js')
  ]);

  assert.match(runtime, /ensureMyFrontierRenderer[^]*trigger: 'first-explicit-entry'[^]*eagerBootMount: false/);
  assert.match(runtime, /ensureStormSectorPresenters[^]*trigger: 'first-certified-entry'[^]*eagerBootMount: false/);
  assert.match(signalGateway, /Heavy GLB-backed hero and NPC assets are intentionally deferred until[^]*explicit Expanse entry/);
  assert.match(signalGateway, /activate\(\) \{[^]*mountDeferredSignalWorld\(\)[^]*mountDeferredAssets\(\)/);
  assert.match(profile, /preloadAll:\s*false/);
  assert.match(manifest, /preloadAll:\s*false/);
});

test('L95 world asset residency is lazy-first, then same-session reusable', async () => {
  const [runtime, signalGateway] = await Promise.all([
    text('assets/js/city/w731/eon-city-w731-command-hub-runtime.js'),
    text('assets/js/city/w766/eon-expanse-w766a-gateway-overlook.js')
  ]);
  assert.match(runtime, /sameSessionReuse: true/);
  assert.match(signalGateway, /decodedAssetsRetained: true/);
  assert.match(signalGateway, /sameSessionReuse: signalMounted\.alreadyMounted === true/);
  assert.doesNotMatch(runtime, /preloadAll:\s*true/);
});
