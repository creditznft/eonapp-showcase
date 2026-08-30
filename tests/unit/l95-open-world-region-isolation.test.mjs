import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

test('L95 Signal presentation has a dedicated region root that can suspend without destroying decoded assets', async () => {
  const source = await readFile(new URL('../../assets/js/city/w766/eon-expanse-w766a-gateway-overlook.js', import.meta.url), 'utf8');
  assert.match(source, /w766a-signal-frontier-region-root/);
  assert.match(source, /suspendSignalPresentation\(reason = 'region-switch'\)/);
  assert.match(source, /resumeSignalPresentation\(reason = 'region-switch'\)/);
  assert.match(source, /decodedSignalAssetsRetained: true/);
  assert.match(source, /signalRegionActive: signalRoot\.isEnabled/);
});

test('L95 My Frontier owns its own active-region identity and does not keep Signal ambience/update work alive', async () => {
  const source = await readFile(new URL('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js', import.meta.url), 'utf8');
  assert.match(source, /expanseActiveRegionId = 'my-frontier'/);
  assert.match(source, /suspendSignalPresentation\?\.\('my-frontier-entry'\)/);
  assert.match(source, /expanseVisuals\.deactivate\?\.\(\)/);
  assert.match(source, /expanseAudio\.suspend\?\.\('my-frontier-entry'\)/);
  assert.match(source, /if \(expanseActiveRegionId === 'my-frontier'\) expanseMyFrontierRenderer\?\.update/);
});

test('L95 Storm takes exclusive world presentation and restores Signal atmosphere on return', async () => {
  const source = await readFile(new URL('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js', import.meta.url), 'utf8');
  assert.match(source, /transition\.type === 'enter-storm-sector'[\s\S]*expanseMyFrontierRenderer\?\.deactivate/);
  assert.match(source, /expanseAudio\.suspend\?\.\('storm-sector-entry'\)/);
  assert.match(source, /transition\.type === 'return-signal-frontier'[\s\S]*expanseVisuals\.activate\?\.\(expansePresentation\)/);
  assert.match(source, /expanseAudio\.applyPresentation\?\.\(expansePresentation\)/);
});
