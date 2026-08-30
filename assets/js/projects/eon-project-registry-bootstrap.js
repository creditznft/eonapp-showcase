/** A15 I05 — one non-destructive bootstrap for legacy Project indexing. */

import { migrateLegacyProjects } from './eon-project-registry-migration.js';
import { rebuildLibraryIndexFromLegacy } from '../storage/eon-library-index.js';

let installed = false;
let pending = null;

export function installUniversalProjectRegistry(options = {}) {
  if (installed && pending) return pending;
  installed = true;
  pending = migrateLegacyProjects({ ...options, automaticIndexOnly: true })
    .then((projectResult) => {
      const libraryResult = rebuildLibraryIndexFromLegacy({ ...options, automaticIndexOnly: true, emit: false });
      const result = Object.freeze({
        ...projectResult,
        ok: projectResult.ok === true && libraryResult.ok === true,
        projectRegistry: projectResult,
        libraryIndex: libraryResult,
        reason: projectResult.ok !== true ? projectResult.reason : libraryResult.ok !== true ? libraryResult.reason : ''
      });
      try {
        globalThis.document?.dispatchEvent?.(new CustomEvent('eon:project-registry-ready', {
          detail: {
            ok: result.ok === true,
            receiptId: projectResult.receipt?.receiptId || '',
            projectCount: projectResult.state ? Object.keys(projectResult.state.records || {}).length : 0,
            libraryItemCount: libraryResult.state ? Object.keys(libraryResult.state.records || {}).length : 0,
            reason: result.ok ? '' : result.reason || 'migration-failed'
          }
        }));
        globalThis.document?.dispatchEvent?.(new CustomEvent('eon:library-index-ready', {
          detail: {
            ok: libraryResult.ok === true,
            recordCount: libraryResult.state ? Object.keys(libraryResult.state.records || {}).length : 0,
            reason: libraryResult.ok ? '' : libraryResult.reason || 'migration-failed'
          }
        }));
      } catch {}
      return result;
    })
    .catch((error) => Object.freeze({ ok: false, reason: 'migration-exception', message: String(error?.message || error) }));
  return pending;
}

export function getUniversalProjectRegistryBootstrapState() {
  return Object.freeze({ installed, pending: Boolean(pending) });
}
