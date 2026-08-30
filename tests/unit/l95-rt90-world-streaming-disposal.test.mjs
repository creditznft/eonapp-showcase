import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  deriveEonCityL95WorldStreamingFocus,
  distanceToEonCityL95StreamingFocus,
  getEonCityL95WorldStreamingProfile
} from '../../assets/js/city/l95/eon-city-l95-world-streaming-policy.js';
import {
  auditEonCityContentAddressedDist,
  contentAddressEonCityBinaries
} from '../../scripts/eon-city-content-addressed-binaries.mjs';

const ROOT = new URL('../../', import.meta.url);
const read = (relative) => fs.readFileSync(new URL(relative, ROOT), 'utf8');

const renderer = read('assets/js/city/w768/eon-expanse-w768i-my-frontier-renderer.js');
const hubRuntime = read('assets/js/city/w731/eon-city-w731-command-hub-runtime.js');
const publicInfrastructure = read('assets/js/city/l95/eon-city-l95-my-frontier-public-infrastructure.js');
const ambientCast = read('assets/js/city/l95/eon-city-l95-my-frontier-ambient-cast.js');
const authoredBuildings = read('assets/js/city/w768/eon-expanse-w768n-my-frontier-authored-asset-presenter.js');
const buildingCompositions = read('assets/js/city/w770/eon-expanse-w770c-my-frontier-building-composition-presenter.js');
const residents = read('assets/js/city/w768/eon-expanse-w768y-my-frontier-resident-presenter.js');
const storm = read('assets/js/city/w792/eon-expanse-w792c-storm-sector-presenter.js');
const sw = read('sw.js');

function sha12(body) {
  return crypto.createHash('sha256').update(body).digest('hex').slice(0, 12);
}

test('RT90 world streaming focus is local to the world and keeps boot-critical work outside optional distance streaming', () => {
  const focus = deriveEonCityL95WorldStreamingFocus({
    playerPosition: { x: 170, y: 1, z: -60 },
    worldOffset: { x: 170, y: 0, z: -60 },
    quality: 'balanced'
  });
  assert.equal(focus.valid, true);
  assert.equal(focus.x, 0);
  assert.equal(focus.z, 0);
  assert.deepEqual(getEonCityL95WorldStreamingProfile('balanced'), {
    nearRadius: 20,
    warmRadius: 30,
    distantRadius: 42,
    focusIntervalMs: 250
  });
  assert.equal(focus.bootCriticalOutsidePolicy, true);
  assert.equal(focus.hiddenWorldStartsOptionalLoads, false);
  assert.equal(focus.retainValidatedSameSessionAssets, true);
  assert.equal(distanceToEonCityL95StreamingFocus(focus, { x: 12, z: 16 }), 20);
  assert.equal(distanceToEonCityL95StreamingFocus(null, { x: 0, z: 0 }), Number.POSITIVE_INFINITY);
});

test('RT90 My Frontier establishes proximity focus before releasing optional GLB queues', () => {
  assert.match(hubRuntime, /expanseMyFrontierRenderer\?\.update\?\.\(timeMs,\s*playerAnchor\.position\)/);
  assert.match(renderer, /deriveEonCityL95WorldStreamingFocus/);
  assert.match(renderer, /focusIntervalMs/);
  assert.match(renderer, /publicInfrastructurePresenter\?\.setStreamingFocus\?\.\(projected,\s*\{ radius: projected\.warmRadius \}\)/);
  assert.match(renderer, /ambientCastPresenter\?\.setStreamingFocus\?\.\(projected,\s*\{ radius: projected\.nearRadius \}\)/);
  assert.match(renderer, /authoredAssetPresenter\?\.setStreamingFocus\?\.\(projected,\s*\{ radius: projected\.nearRadius \}\)/);
  assert.match(renderer, /buildingCompositionPresenter\?\.setStreamingFocus\?\.\(projected,\s*\{ radius: projected\.nearRadius \}\)/);
  assert.match(renderer, /residentAssetPresenter\?\.setStreamingFocus\?\.\(projected,\s*\{ radius: projected\.nearRadius \}\)/);
});

test('RT90 scalable My Frontier optional presenters choose nearest eligible queued work inside the streaming radius', () => {
  for (const source of [publicInfrastructure, ambientCast, authoredBuildings, buildingCompositions, residents]) {
    assert.match(source, /distanceToEonCityL95StreamingFocus/);
    assert.match(source, /nextEligibleQueueIndex/);
    assert.match(source, /setStreamingFocus/);
    assert.match(source, /streamingRadius/);
    assert.match(source, /if\s*\(?.*nextIndex\s*<\s*0\)?\s*break/);
  }
});

test('RT90 My Frontier deactivation pauses new optional loads and hidden character animation while retaining same-session decoded assets', () => {
  assert.match(renderer, /'my-frontier-inactive'/);
  assert.match(renderer, /pressure:\s*'critical'/);
  assert.match(renderer, /visibility:\s*active && unlocked \? 'visible' : 'hidden'/);
  assert.match(renderer, /ambientCastPresenter\?\.setActive\?\.\(false\)/);
  assert.match(renderer, /residentAssetPresenter\?\.setActive\?\.\(false\)/);
  assert.match(renderer, /decodedAssetsRetained:\s*true/);
  assert.match(renderer, /streamingFocusReset:\s*true/);
  assert.match(renderer, /'my-frontier-awaiting-streaming-focus'/);
  assert.match(residents, /if \(disposed \|\| !active\) return/);
  assert.match(residents, /for\(const group of state\.animationGroups\|\|\[\]\)group\.stop\?\.\(\)/);
  assert.match(residents, /sameSessionReuse:true/);
  assert.doesNotMatch(residents, /runRenderLoop|new\s+Engine\s*\(|new\s+Scene\s*\(/);
});

test('RT90 Storm suspension starts no new hero loads and an in-flight decode cannot attach into a hidden Storm root', () => {
  assert.match(storm, /if \(disposed \|\| !active\) return/);
  assert.match(storm, /visibility:\s*'hidden'/);
  assert.match(storm, /reason:\s*'storm-sector-suspended'/);
  assert.match(storm, /optionalLoadsPaused:/);
  assert.match(storm, /inflightLoadsAttachWhileSuspended:\s*false/);
  assert.match(storm, /if \(disposed \|\| revisions\.get\(heroId\) !== revision \|\| !active\)/);
  assert.match(storm, /heroQueue\.push\(\{ placement, revision \}\)/);
  assert.match(storm, /container\.dispose\?\.\(\)/);
  assert.doesNotMatch(storm, /runRenderLoop\s*\(/);
});

test('RT90 production content-addressing covers Storm source GLBs and the stable City asset cache recognizes the emitted hash', () => {
  const dist = fs.mkdtempSync(path.join(os.tmpdir(), 'eon-rt90-storm-content-address-'));
  try {
    const sourceRelative = 'assets/city/future-regions/storm-sector/storm-relay.glb';
    const sourcePath = path.join(dist, sourceRelative);
    fs.mkdirSync(path.dirname(sourcePath), { recursive: true });
    const bytes = Buffer.from('rt90-storm-relay-model');
    fs.writeFileSync(sourcePath, bytes);
    fs.mkdirSync(path.join(dist, 'assets/js'), { recursive: true });
    fs.writeFileSync(path.join(dist, 'assets/js/storm-runtime.js'), `export const storm='/assets/city/future-regions/storm-sector/storm-relay.glb';\n`);

    const result = contentAddressEonCityBinaries({ distDir: dist });
    const expected = `/assets/city/immutable/future-regions/storm-sector/storm-relay.${sha12(bytes)}.glb`;
    assert.equal(result.ok, true);
    assert.equal(fs.existsSync(sourcePath), false);
    assert.equal(fs.existsSync(path.join(dist, expected.slice(1))), true);
    assert.match(fs.readFileSync(path.join(dist, 'assets/js/storm-runtime.js'), 'utf8'), new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    assert.equal(auditEonCityContentAddressedDist({ distDir: dist }).ok, true);
    assert.match(sw, /const PERSISTENT_CITY_ASSET_CACHE = 'eonapp-city-assets-v1'/);
    assert.match(sw, /persistentCityAssetCacheFirst/);
    assert.match(sw, /isPersistentContentHashedCityAsset/);
  } finally {
    fs.rmSync(dist, { recursive: true, force: true });
  }
});
