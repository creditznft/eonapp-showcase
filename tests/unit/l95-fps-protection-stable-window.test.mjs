import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js', import.meta.url), 'utf8');

test('L95 FPS protection starts a fresh evidence window after the authored visible frame is ready', () => {
  assert.match(source, /AUTHORED_VISIBLE_FRAME_READY[^]*lowFpsSamples = 0;[^]*fpsFrames = 0;[^]*fpsSampleAt = now\(\);[^]*lastPerformanceProtectionAt = fpsSampleAt;/);
  assert.match(source, /lowFpsSamples >= 3 && frameAt - lastPerformanceProtectionAt >= 8_000/);
});

test('L95 startup guard does not lower selected graphics quality directly', () => {
  const guard = source.slice(source.indexOf('// L95-W56'), source.indexOf('onInitialAssetsReady?.', source.indexOf('// L95-W56')));
  assert.doesNotMatch(guard, /setHardwareScalingLevel|applyPerformanceProtection|resolvedQuality\s*=/);
});

test('L95 FPS samples explicitly identify startup versus stable-session evidence', () => {
  assert.match(source, /samplePhase: 'startup'/);
  assert.match(source, /samplePhase: !visibleFrameState\.gateComplete \? 'startup' : \(fpsProtectionWindowEligible \? 'stable-session' : 'scheduling-gap'\)/);
  assert.match(source, /protectionEligible: fpsProtectionWindowEligible/);
});


test('RT92 scheduling gaps remain diagnostic evidence but cannot impersonate sustained FPS', () => {
  assert.match(source, /const fpsProtectionWindowEligible = visibleFrameState\.gateComplete/);
  assert.match(source, /sampleMs >= 700/);
  assert.match(source, /sampleMs <= 1_600/);
  assert.match(source, /lowFpsSamples = fpsProtectionWindowEligible && measuredFps > 0/);
  assert.match(source, /'scheduling-gap'/);
});

test('RT92 local GLB cleanup detaches externally-parented roots before AssetContainer removal', async () => {
  const localAssets = await readFile(new URL('../../assets/js/city/w731/eon-city-w731-local-assets.js', import.meta.url), 'utf8');
  assert.match(localAssets, /for \(const root of container\.rootNodes \|\| \[\]\) \{[^]*root\.parent = null;[^]*container\.removeAllFromScene/);
  assert.match(localAssets, /for \(const root of container\?\.rootNodes \|\| \[\]\) \{[^]*root\.parent = null;[^]*container\?\.removeAllFromScene/);
});
