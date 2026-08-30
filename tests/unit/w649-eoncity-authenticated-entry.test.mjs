import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import {
  EON_CITY_ACCESS_SCHEMA,
  EON_CITY_DEFAULT_ACCESS_MODE,
  EON_CITY_ACCESS_MODES,
  buildEonCityAccessDecision,
  isEonCityHeavyBootAllowed,
  normalizeEonCityAccessMode
} from '../../config/w554-eon-city-access-project-portals-contract.mjs';
import {
  describeEonCityAccessView,
  inspectEonCityDeviceProfile,
  mountEonCityAccessStation,
  createEonCityStage4Diagnostic,
  normalizeEonCityAccessPayload,
  normalizeEonCityLoginRoute
} from '../../assets/js/city/eon-city-access-station.js';

test('Stage 4 diagnostics are privacy-safe and keep fallback distinct from full runtime success', () => {
  const diagnostic = createEonCityStage4Diagnostic({ phase: 'full runtime import', outcome: 'failed', reason: 'TypeError: https://private.example/token', fallbackSelected: true, coreLoaded: false });
  assert.equal(diagnostic.schema, 'eon.city.stage4.diagnostic.v1');
  assert.equal(diagnostic.phase, 'full-runtime-import');
  assert.equal(diagnostic.outcome, 'failed');
  assert.equal(diagnostic.fallbackSelected, true);
  assert.doesNotMatch(diagnostic.reason, /https|private|token/);
});

test('Stage 4 success diagnostics never retain a failure reason', () => {
  const started = createEonCityStage4Diagnostic({ phase: 'full-runtime-import', outcome: 'started' });
  const mounted = createEonCityStage4Diagnostic({ phase: 'full-runtime-mount', outcome: 'succeeded', reason: 'babylon-core-mounted', coreLoaded: true });
  assert.equal(started.reason, 'in-progress');
  assert.equal(mounted.outcome, 'succeeded');
  assert.equal(mounted.reason, 'babylon-core-mounted');
  assert.equal(mounted.fallbackSelected, false);
  assert.equal(mounted.coreLoaded, true);
});

test('Stage 4 permits one first Babylon render before hidden-tab throttling and keeps it distinct from readiness', () => {
  const runtime = fs.readFileSync(new URL('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js', import.meta.url), 'utf8');
  const station = fs.readFileSync(new URL('../../assets/js/city/eon-city-access-station.js', import.meta.url), 'utf8');
  assert.match(runtime, /const bootFramePending = !firstFrame;/);
  assert.match(runtime, /hidden: documentHidden && !bootFramePending/);
  assert.match(station, /EON_CITY_FIRST_FRAME_TIMEOUT_MS = 8_000/);
  assert.match(station, /root\.dataset\.eonCityEntryState = 'FULL_CITY_FAILED'/);
  assert.match(station, /if \(!firstFrameReady\) startFirstFrameWatchdog\(\);/);
  assert.match(station, /onFirstFrame: \(\) => \{\s*firstFrameReady = true;/);
});

function createRoot() {
  const listeners = new Map();
  const controls = new Map();
  const control = (selector) => {
    if (!controls.has(selector)) {
      controls.set(selector, {
        dataset: {},
        disabled: false,
        textContent: '',
        hidden: false,
        style: {},
        querySelectorAll() { return []; },
    getBoundingClientRect() { return { left: 68, right: 1280, top: 0, bottom: 720, width: 1212, height: 720 }; },
        getBoundingClientRect() { return { left: 68, right: 68, top: 0, bottom: 720, width: 0, height: 720 }; },
        addEventListener(type, callback) { listeners.set(`${selector}:${type}`, callback); }
      });
    }
    return controls.get(selector);
  };
  return {
    dataset: {},
    innerHTML: '',
    querySelector(selector) {
      if (selector === '.eon-city-full-session') return control(selector);
      if (selector === '[data-eon-city-touch-controls]') return control(selector);
      if (selector === '[data-eon-city-reduced-world]') return control(selector);
      if (selector === '[data-eon-city-loading-overlay]') return control(selector);
      if (selector === '[data-eon-city-reduced-status]') return control(selector);
      if (selector === '[data-eon-city-reduced-position]') return control(selector);
      if (selector === '[data-eon-city-access-retry]') return control(selector);
      if (selector === '[data-eon-city-enter]') return control(selector);
      if (selector === '[data-eon-city-retry-3d]') return control(selector);
      return null;
    },
    querySelectorAll() { return []; },
    getBoundingClientRect() { return { left: 68, right: 1280, top: 0, bottom: 720, width: 1212, height: 720 }; },
    getListener(selector, type) { return listeners.get(`${selector}:${type}`); }
  };
}

function createRuntimeMachine() {
  let state = 'idle';
  return {
    getSnapshot() { return { state }; },
    transition(next) { state = next; return { state }; },
    fail() { state = 'recoverable-error'; return { state }; }
  };
}

test('W649B exposes exactly one authenticated City mode and rejects preview aliases', () => {
  assert.deepEqual(EON_CITY_ACCESS_MODES, ['authenticated-play']);
  assert.equal(EON_CITY_DEFAULT_ACCESS_MODE, 'authenticated-play');
  for (const value of [undefined, '', 'public-preview', 'guest', 'AUTHENTICATED-PLAY']) {
    assert.equal(normalizeEonCityAccessMode(value), 'authenticated-play');
  }
});

test('W649B authorizes heavy boot only for an available signed-in identity', () => {
  const signedOut = buildEonCityAccessDecision({ identityAvailable: true, signedIn: false });
  const unavailable = buildEonCityAccessDecision({ identityAvailable: false, signedIn: true });
  const signedIn = buildEonCityAccessDecision({ identityAvailable: true, signedIn: true });
  assert.equal(isEonCityHeavyBootAllowed(signedOut), false);
  assert.equal(isEonCityHeavyBootAllowed(unavailable), false);
  assert.equal(isEonCityHeavyBootAllowed(signedIn), true);
  assert.equal(signedOut.staticPortalOnly, true);
  assert.equal(signedOut.publicPreviewAvailable, false);
  assert.equal(signedIn.staticPortalOnly, false);
  assert.equal(signedIn.browserGateOnly, true);
  assert.equal(signedIn.pagesFunctionAssetRelayAllowed, false);
});

test('W649B access payload normalization cannot re-enable public preview', () => {
  const normalized = normalizeEonCityAccessPayload({
    schema: EON_CITY_ACCESS_SCHEMA,
    mode: 'public-preview',
    accessState: 'signed-out',
    identityAvailable: true,
    signedIn: false,
    canBootFullCity: false,
    heavyRuntimeImportAllowed: false,
    publicPreviewAvailable: true
  });
  assert.equal(normalized.mode, 'authenticated-play');
  assert.equal(normalized.publicPreviewAvailable, false);
  assert.equal(normalized.staticPortalOnly, true);
  assert.equal(describeEonCityAccessView(normalized).kind, 'login');
});

test('W652 signed-out Google CTA cannot be replaced by an unsafe payload URL', () => {
  const expected = '/api/auth/google/start?returnTo=%2Feoncity';
  assert.equal(normalizeEonCityLoginRoute(expected), expected);
  for (const candidate of ['javascript:alert(1)', 'https://example.com/login', '//example.com/login', '/api/auth/google/start?returnTo=https%3A%2F%2Fevil.example']) {
    assert.equal(normalizeEonCityLoginRoute(candidate), expected);
  }
  assert.equal(normalizeEonCityAccessPayload({ loginRoute: 'javascript:alert(1)' }).loginRoute, expected);
});

test('W659L device preflight chooses a truthful automatic quality profile', () => {
  const high = inspectEonCityDeviceProfile({
    navigatorRef: { deviceMemory: 8, hardwareConcurrency: 16, connection: { effectiveType: '4g', saveData: false } },
    documentRef: { createElement: () => ({ getContext: (kind) => kind === 'webgl2' ? {} : null }) },
    matchMediaImpl: () => ({ matches: false }),
    devicePixelRatio: 1.5
  });
  assert.equal(high.quality, 'cinematic');
  assert.match(high.summary, /High detail/);
  assert.match(high.summary, /WEBGL2/);

  const highReducedMotion = inspectEonCityDeviceProfile({
    navigatorRef: { deviceMemory: 8, hardwareConcurrency: 16, connection: { effectiveType: '4g', saveData: false } },
    documentRef: { createElement: () => ({ getContext: (kind) => kind === 'webgl2' ? {} : null }) },
    matchMediaImpl: () => ({ matches: true }),
    devicePixelRatio: 1.5
  });
  assert.equal(highReducedMotion.quality, 'cinematic');
  assert.equal(highReducedMotion.reducedMotion, true);

  const rtx3050 = inspectEonCityDeviceProfile({
    navigatorRef: { deviceMemory: 8, hardwareConcurrency: 16, connection: { effectiveType: '4g', saveData: false } },
    documentRef: {
      createElement: () => ({
        getContext: (kind) => kind === 'webgl2' ? {
          RENDERER: 'RENDERER',
          getExtension: (name) => name === 'WEBGL_debug_renderer_info' ? { UNMASKED_RENDERER_WEBGL: 'UNMASKED_RENDERER_WEBGL' } : null,
          getParameter: (token) => token === 'UNMASKED_RENDERER_WEBGL'
            ? 'ANGLE (NVIDIA, NVIDIA GeForce RTX 3050 Laptop GPU Direct3D11 vs_5_0 ps_5_0)'
            : 'WebGL renderer'
        } : null
      })
    },
    matchMediaImpl: () => ({ matches: false }),
    devicePixelRatio: 1.25
  });
  assert.equal(rtx3050.quality, 'cinematic');
  assert.equal(rtx3050.selection, 'capability-auto');
  assert.equal(rtx3050.discreteGpu, true);
  assert.equal(rtx3050.softwareRenderer, false);
  assert.match(rtx3050.gpuRenderer, /RTX 3050/);

  const constrained = inspectEonCityDeviceProfile({
    navigatorRef: { deviceMemory: 4, hardwareConcurrency: 4, connection: { effectiveType: '3g', saveData: true } },
    documentRef: { createElement: () => ({ getContext: (kind) => kind === 'webgl' ? {} : null }) },
    matchMediaImpl: () => ({ matches: true }),
    devicePixelRatio: 3
  });
  assert.equal(constrained.quality, 'lite');
  assert.equal(constrained.saveData, true);
});

test('W649B signed-out station renders the static portal and never imports the heavy runtime', async () => {
  const root = createRoot();
  let importCalls = 0;
  const result = await mountEonCityAccessStation(root, {
    runtimeStateMachine: createRuntimeMachine(),
    fetchImpl: async () => new Response(JSON.stringify(buildEonCityAccessDecision({ identityAvailable: true, signedIn: false })), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    }),
    importImpl: async () => { importCalls += 1; throw new Error('must-not-import'); }
  });
  assert.equal(result.ok, false);
  assert.equal(result.state, 'login');
  assert.equal(importCalls, 0);
  assert.equal(root.dataset.eonCityAccessMode, 'authenticated-play');
  assert.match(root.innerHTML, /Your work becomes a place/);
  assert.match(root.innerHTML, /Continue with Google/);
  assert.doesNotMatch(root.innerHTML, /light preview/i);
});

test('W659L authorized station automatically mounts one Babylon core and shows no manual entry gate', async () => {
  const root = createRoot();
  let importCalls = 0;
  let mountCalls = 0;
  const result = await mountEonCityAccessStation(root, {
    runtimeStateMachine: createRuntimeMachine(),
    cacheInspector: async () => ({ cacheName: 'eonapp-city-assets-v1', cachedEntries: 3, persisted: true, persistenceRequested: true, cacheStorageSupported: true, releaseStableCacheName: true, appUpdatePreservesUnchangedAssets: true }),
    fetchImpl: async () => new Response(JSON.stringify(buildEonCityAccessDecision({ identityAvailable: true, signedIn: true })), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    }),
    importImpl: async () => {
      importCalls += 1;
      return {
        mountBabylonCityProof(callbacks) {
          mountCalls += 1;
          callbacks.onBootStage?.({ stage: 'ENGINE_CREATED' });
          callbacks.onFirstFrame?.();
          callbacks.onInitialAssetsReady?.({ ok: true, degraded: false });
          return {
            setMove() {},
            getRuntimeSummary() { return { player: { x: 0, z: 2 } }; },
            destroy() {}
          };
        }
      };
    }
  });
  assert.equal(result.ok, true);
  assert.equal(result.state, 'automatic-entry');
  assert.equal(root.dataset.eonCityAutomaticEntry, 'true');
  const mounted = await result.entryPromise;
  assert.equal(mounted.ok, true);
  assert.equal(importCalls, 1);
  assert.equal(mountCalls, 1);
  assert.doesNotMatch(root.innerHTML, /Enter EON City/);
  assert.equal(root.dataset.eonCityReveal, 'ready');
});

test('Stage 4 never reports playable 3D before a rendered Babylon frame and exposes a restart after the watchdog', async () => {
  const root = createRoot();
  const originalSetTimeout = globalThis.setTimeout;
  const originalClearTimeout = globalThis.clearTimeout;
  const timers = [];
  let destroyed = 0;
  globalThis.setTimeout = (callback) => {
    const token = { callback, cancelled: false };
    timers.push(token);
    return token;
  };
  globalThis.clearTimeout = (token) => { if (token) token.cancelled = true; };
  try {
    const result = await mountEonCityAccessStation(root, {
      runtimeStateMachine: createRuntimeMachine(),
      fetchImpl: async () => new Response(JSON.stringify(buildEonCityAccessDecision({ identityAvailable: true, signedIn: true })), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      }),
      importImpl: async () => ({
        mountBabylonCityProof() {
          return { setMove() {}, getRuntimeSummary() { return { player: { x: 0, z: 2 } }; }, destroy() { destroyed += 1; } };
        }
      })
    });
    const mounted = await result.entryPromise;
    assert.equal(mounted.ok, true);
    assert.notEqual(root.dataset.eonCityEntryState, 'PLAYABLE_3D_CORE');
    const watchdog = timers.find((timer) => timer.cancelled === false);
    assert.ok(watchdog, 'first-frame watchdog scheduled');
    watchdog.callback();
    assert.equal(root.dataset.eonCityEntryState, 'FULL_CITY_FAILED');
    assert.equal(root.dataset.eonCityFirstFrame, 'missing');
    assert.equal(root.querySelector('[data-eon-city-retry-3d]').hidden, false);
    assert.equal(destroyed, 1);
  } finally {
    globalThis.setTimeout = originalSetTimeout;
    globalThis.clearTimeout = originalClearTimeout;
  }
});

test('Stage 4 rejects an out-of-order asset-ready callback until Babylon has rendered a frame', async () => {
  const root = createRoot();
  let destroyed = 0;
  const result = await mountEonCityAccessStation(root, {
    runtimeStateMachine: createRuntimeMachine(),
    fetchImpl: async () => new Response(JSON.stringify(buildEonCityAccessDecision({ identityAvailable: true, signedIn: true })), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    }),
    importImpl: async () => ({
      mountBabylonCityProof(callbacks) {
        callbacks.onInitialAssetsReady?.({ ok: true });
        return { setMove() {}, getRuntimeSummary() { return { player: { x: 0, z: 2 } }; }, destroy() { destroyed += 1; } };
      }
    })
  });
  const mounted = await result.entryPromise;
  assert.equal(mounted.ok, false);
  assert.equal(mounted.state, 'city-first-frame-failed');
  assert.equal(root.dataset.eonCityEntryState, 'FULL_CITY_FAILED');
  assert.equal(root.dataset.eonCityReveal, undefined);
  assert.equal(destroyed, 1);
});

test('W759 treats a missing authenticated City core as a release-integrity failure, never a lightweight fallback', async () => {
  const root = createRoot();
  const result = await mountEonCityAccessStation(root, {
    runtimeStateMachine: createRuntimeMachine(),
    fetchImpl: async () => new Response(JSON.stringify(buildEonCityAccessDecision({ identityAvailable: true, signedIn: true })), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    }),
    importImpl: async () => { throw new TypeError('failed to fetch dynamically imported module'); }
  });
  const entry = await result.entryPromise;
  assert.equal(entry.ok, false);
  assert.equal(entry.state, 'city-core-import-failed');
  assert.equal(root.dataset.eonCityRenderer, 'city-core-import-failed');
  assert.equal(root.dataset.eonCityEntryState, 'CITY_CORE_IMPORT_FAILED');
  assert.doesNotMatch(root.dataset.eonCityRenderer, /canvas-2d-fallback/);
});

test('W735A authenticated entry delegates to the one-owner W731 Command Hub runtime', () => {
  const source = fs.readFileSync(new URL('../../assets/js/city/eon-city-access-station.js', import.meta.url), 'utf8');
  const coreSource = fs.readFileSync(new URL('../../assets/js/city/eon-city-play-core.js', import.meta.url), 'utf8');
  assert.match(source, /mountBabylonCityProof as mountCanvasRecovery/);
  assert.match(source, /const core = await importCore\(\)/);
  assert.match(source, /core\.mountBabylonCityProof\(callbacks\)/);
  assert.doesNotMatch(source, /from '\.\/eon-city-play-core\.js'/);
  assert.match(source, /runtime = mountCanvasRecovery\(callbacks\)/);
  assert.match(source, /eonCityRenderer = 'canvas-2d-fallback'/);
  assert.match(source, /mountProgressiveCityNow\(root/);
  assert.match(source, /const automaticEntry = enter\(\)/);
  assert.match(source, /CITY_AUTOMATIC_ENTRY_STARTED/);
  assert.match(source, /data-eon-city-loading-overlay/);
  assert.doesNotMatch(source, /eon-city-runtime-owner\.js/);
  assert.doesNotMatch(source, /const runtimeOwnerModule = await importImpl/);
  assert.doesNotMatch(source, /public-preview/);
  assert.match(source, /if \(entryPromise\) return entryPromise/);
  assert.match(source, /await mountProgressiveCityNow\(root/);
  assert.match(coreSource, /w731\/eon-city-w731-command-hub-runtime\.js/);
  assert.match(coreSource, /mountBabylonCityProof/);
  assert.doesNotMatch(coreSource, /w649\/eon-city-w649-babylon-core-runtime\.js/);
  assert.doesNotMatch(coreSource, /w649\/eon-city-w649-district-runtime\.js/);
  // W736A installs the bounded first-frame guard before re-exporting the sole
  // W731 owner; the entrypoint is now deliberately part of the launch graph.
  assert.match(coreSource, /installEonCityW736AFirstFrameGuard/);
  assert.match(coreSource, /installEonCityW736AFirstFrameGuard\(\);[\s\S]*w731\/eon-city-w731-command-hub-runtime\.js/);
});

test('W659K coalesces repeated Enter actions into one Babylon core mount', async () => {
  const root = createRoot();
  let releaseImport;
  let importCalls = 0;
  let mountCalls = 0;
  const imported = new Promise((resolve) => { releaseImport = resolve; });
  const result = await mountEonCityAccessStation(root, {
    runtimeStateMachine: createRuntimeMachine(),
    fetchImpl: async () => new Response(JSON.stringify(buildEonCityAccessDecision({ identityAvailable: true, signedIn: true })), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    }),
    importImpl: () => {
      importCalls += 1;
      return imported;
    }
  });

  const first = result.enter();
  const second = result.enter();
  assert.equal(first, second);
  assert.equal(root.dataset.eonCityEntryStarting, 'true');

  releaseImport({
    mountBabylonCityProof(callbacks) {
      mountCalls += 1;
      callbacks.onFirstFrame?.();
      callbacks.onInitialAssetsReady?.({ ok: true, degraded: false });
      return {
        setMove() {},
        getRuntimeSummary() { return { player: { x: 0, z: 2 } }; },
        destroy() {}
      };
    }
  });

  const mounted = await first;
  assert.equal(mounted.ok, true);
  assert.equal(importCalls, 1);
  assert.equal(mountCalls, 1);
  assert.equal(root.dataset.eonCityEntryStarting, undefined);
});

test('W765R1 ignores a stale City dynamic import instead of replacing the newest runtime', async () => {
  const root = createRoot();
  let resolveOlderImport;
  let olderMounts = 0;
  let newerMounts = 0;
  const olderImport = new Promise((resolve) => { resolveOlderImport = resolve; });
  const access = () => new Response(JSON.stringify(buildEonCityAccessDecision({ identityAvailable: true, signedIn: true })), { status: 200, headers: { 'content-type': 'application/json' } });
  const older = await mountEonCityAccessStation(root, {
    runtimeStateMachine: createRuntimeMachine(), fetchImpl: async () => access(), cacheInspector: async () => null, importImpl: () => olderImport
  });
  const newer = await mountEonCityAccessStation(root, {
    runtimeStateMachine: createRuntimeMachine(), fetchImpl: async () => access(), cacheInspector: async () => null,
    importImpl: async () => ({ mountBabylonCityProof(callbacks) { newerMounts += 1; callbacks.onFirstFrame?.(); callbacks.onInitialAssetsReady?.({ ok: true }); return { setMove() {}, getRuntimeSummary() { return { player: { x: 0, z: 2 } }; }, destroy() {} }; } })
  });
  const newest = await newer.entryPromise;
  resolveOlderImport({ mountBabylonCityProof() { olderMounts += 1; throw new Error('stale mount must never run'); } });
  const stale = await older.entryPromise;
  assert.equal(newest.ok, true);
  assert.equal(stale.state, 'city-mount-superseded');
  assert.equal(newerMounts, 1);
  assert.equal(olderMounts, 0);
  assert.equal(root.dataset.eonCityRuntimeLifecycle, 'running');
});
