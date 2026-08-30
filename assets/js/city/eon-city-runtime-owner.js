/**
 * W624B — the only production entry that may mount or dispose the heavy City station.
 */
import { EON_CITY_ART_BIBLE } from './eon-city-art-bible.js';
import { getEonCityRuntimeAssetManifest, validateEonCityRuntimeAssetManifest } from './eon-city-runtime-asset-manifest.js';
import { createEonCityRuntimeStateMachine } from './eon-city-runtime-state-machine.js';
import { disposeEonCityPlayStation, mountEonCityPlayStation } from '../eon-city-play-station.js';

export const EON_CITY_RUNTIME_OWNER_SCHEMA = 'eon.city.runtime-owner.w624b.v1';

const owners = new WeakMap();

function setRootState(root, snapshot) {
  if (!root?.dataset) return;
  root.dataset.eonCityRuntimeOwner = EON_CITY_RUNTIME_OWNER_SCHEMA;
  root.dataset.eonCityRuntimeState = snapshot.state;
  root.dataset.eonCityRuntimeProgress = String(snapshot.progress);
  root.dataset.eonCityRuntimeProgressBasis = snapshot.progressBasis;
  try {
    document.body.dataset.eonCityRuntimeState = snapshot.state;
    document.body.dataset.eonCityRuntimeOwner = EON_CITY_RUNTIME_OWNER_SCHEMA;
  } catch {}
}

export function mountEonCityRuntimeOwner(root = document.querySelector('[data-eon-city-play-root]'), { stateMachine = null } = {}) {
  if (!root) return null;
  owners.get(root)?.dispose?.('superseded-owner');
  const machine = stateMachine || createEonCityRuntimeStateMachine();
  const manifest = getEonCityRuntimeAssetManifest();
  const manifestValidation = validateEonCityRuntimeAssetManifest(manifest);
  if (!manifestValidation.ok) {
    machine.fail('asset-manifest-invalid');
    throw new Error(`EON City asset manifest invalid: ${manifestValidation.errors.join(',')}`);
  }
  if (machine.getSnapshot().state === 'idle') machine.transition('checking-access', 'owner-direct-entry');
  if (machine.getSnapshot().state === 'checking-access') machine.transition('loading-shell', 'access-confirmed');
  const unsubscribe = machine.subscribe((snapshot) => setRootState(root, snapshot));
  root.dataset.eonCityArtBible = EON_CITY_ART_BIBLE.schema;
  root.dataset.eonCityAssetManifest = manifest.schema;
  root.dataset.eonCityCacheVersion = manifest.cacheVersion;

  let station = null;
  let disposed = false;
  const onPageHide = () => controller.dispose('pagehide');
  const onSessionExpired = () => {
    if (disposed) return;
    try { machine.fail('session-expired'); } catch {}
    controller.dispose('session-expired');
    root.innerHTML = '<section class="eon-play-gate"><p class="eon-play-kicker">EON City · session ended</p><h1>Sign in again to re-enter City</h1><p>The renderer stopped and released local resources. No project, provider, billing or Vault data changed.</p><div class="eon-play-gate-actions"><a class="eon-play-primary" href="/api/auth/google/start?returnTo=%2Feoncity">Continue with Google</a><a class="eon-play-secondary" href="/">Exit to EONBOT</a></div></section>';
  };

  const controller = Object.freeze({
    schema: EON_CITY_RUNTIME_OWNER_SCHEMA,
    artBibleSchema: EON_CITY_ART_BIBLE.schema,
    assetManifestSchema: manifest.schema,
    cacheVersion: manifest.cacheVersion,
    machine,
    getSnapshot() {
      return Object.freeze({
        schema: EON_CITY_RUNTIME_OWNER_SCHEMA,
        state: machine.getSnapshot(),
        manifest: Object.freeze({ schema: manifest.schema, version: manifest.version, cacheVersion: manifest.cacheVersion }),
        disposed
      });
    },
    retry() {
      if (disposed) return null;
      const current = machine.getSnapshot().state;
      if (current === 'recoverable-error') machine.transition('loading-shell', 'user-retry');
      station = mountEonCityPlayStation(root, { runtimeStateMachine: machine, assetManifest: manifest });
      return station;
    },
    dispose(reason = 'owner-dispose') {
      if (disposed) return machine.getSnapshot();
      disposed = true;
      globalThis.removeEventListener?.('pagehide', onPageHide);
      globalThis.removeEventListener?.('eon:session-expired', onSessionExpired);
      globalThis.removeEventListener?.('eon:identity-signed-out', onSessionExpired);
      try { station?.destroy?.(); } catch {}
      try { disposeEonCityPlayStation(root, reason); } catch {}
      unsubscribe?.();
      owners.delete(root);
      try { return machine.dispose(reason); } catch { return machine.getSnapshot(); }
    }
  });

  owners.set(root, controller);
  globalThis.addEventListener?.('pagehide', onPageHide, { once: true });
  globalThis.addEventListener?.('eon:session-expired', onSessionExpired);
  globalThis.addEventListener?.('eon:identity-signed-out', onSessionExpired);
  station = mountEonCityPlayStation(root, { runtimeStateMachine: machine, assetManifest: manifest });
  globalThis.EON_CITY_RUNTIME_OWNER = controller;
  return controller;
}

export function disposeEonCityRuntimeOwner(root = document.querySelector('[data-eon-city-play-root]'), reason = 'owner-dispose') {
  return owners.get(root)?.dispose?.(reason) || null;
}
