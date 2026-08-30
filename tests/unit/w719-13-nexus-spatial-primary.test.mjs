import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { getEonNexusMorphicContract } from '../../assets/js/nexus/eon-nexus-morphic-contract.js';

const read = (relative) => fs.readFileSync(new URL(`../../${relative}`, import.meta.url), 'utf8');
const webglEnvironment = Object.freeze({
  HTMLCanvasElement: function HTMLCanvasElement() {},
  WebGL2RenderingContext: function WebGL2RenderingContext() {},
  navigator: Object.freeze({ deviceMemory: 16, hardwareConcurrency: 12, connection: Object.freeze({ saveData: false }) }),
  document: Object.freeze({ hidden: false, createElement() {} }),
  matchMedia() { return Object.freeze({ matches: false }); }
});

test('W719.13 Projects Nexus remains Babylon-primary before any project is selected', () => {
  const contract = getEonNexusMorphicContract({
    page: 'projects',
    context: { id: 'projects', allowLiveNexus: true, presentation: 'standard' },
    snapshot: { project: { selected: false } },
    environment: webglEnvironment
  });
  assert.equal(contract.productive, true);
  assert.equal(contract.renderer, 'babylon-living-core');
  assert.equal(contract.liveMode, 'full');
});

test('W719.13 production bundling uses relative Nexus chunks and exposes an honest failure state', () => {
  const source = read('assets/js/nexus/eon-nexus-app-shell.js');
  assert.match(source, /import\('\.\/eon-nexus-live\.js'\)/);
  assert.match(source, /import\('\.\/eon-nexus-living-core\.js'\)/);
  assert.doesNotMatch(source, /import\('\/assets\/js\/nexus\/eon-nexus-living-core\.js'\)/);
  assert.match(source, /spatialRenderer = 'loading'/);
  assert.match(source, /spatialRenderer = 'failed'/);
  assert.match(source, /living-core-load-failed/);
  const chatSource = read('assets/js/nexus/eon-nexus-chat-pulse.js');
  assert.match(chatSource, /import\('\.\/eon-nexus-live\.js'\)/);
  assert.match(chatSource, /import\('\.\/eon-nexus-living-core\.js'\)/);
  assert.match(chatSource, /spatialRenderer = 'failed'/);
  assert.doesNotMatch(chatSource, /import\('\/assets\/js\/nexus\/eon-nexus-living-core\.js'\)/);
});

test('W719.13 Babylon readiness controls which visual layer is visible', () => {
  const core = read('assets/js/nexus/eon-nexus-living-core.js');
  const css = read('assets/css/eon-nexus-living-core.css');
  const publicCss = read('public/assets/css/eon-nexus-living-core.css');
  assert.match(core, /dataset\.spatialRenderer = rendererReady === true \? 'ready' : 'fallback'/);
  assert.match(core, /new PointLight/);
  assert.match(core, /eon-nexus-living-core-platform/);
  assert.match(css, /data-spatial-renderer='ready'/);
  assert.match(css, /eon-nexus-live__visual-grid \{ z-index:0; opacity:0/);
  assert.equal(publicCss, css);
});


test('W719.13 Atlas tab replaces the Nexus object field inside the same Babylon scene', () => {
  const core = read('assets/js/nexus/eon-nexus-living-core.js');
  const live = read('assets/js/nexus/eon-nexus-live.js');
  const atlas = read('assets/js/nexus/eon-nexus-project-atlas.js');
  assert.match(core, /getEonNexusLivingCoreSpatialSurface/);
  assert.match(core, /activeTab: liveNexus\?\.getActiveTab/);
  assert.match(core, /atlasSpatialModel: liveNexus\?\.projectAtlas\?\.getSpatialModel/);
  assert.match(core, /surface\.objects\.forEach/);
  assert.match(core, /surface\.relations\.entries/);
  assert.match(core, /const authority = surface\.camera/);
  assert.match(core, /subscribeSpatialSurface/);
  assert.match(core, /subscribeSpatialModel/);
  assert.match(live, /notifySpatialSurface\('active-tab-change'\)/);
  assert.match(atlas, /selectSpatialNode/);
  assert.match(atlas, /notifySpatial\('atlas-empty-render'\)/);
});
