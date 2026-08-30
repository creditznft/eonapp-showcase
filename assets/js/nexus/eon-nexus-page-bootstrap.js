/**
 * W736A compatibility guard.
 *
 * Historical documents may still reference this stable module path. The old
 * frontend Nexus/Pulse is retired in favour of Quick Command, so this bridge
 * removes stale frontend overlays and deliberately mounts nothing. EON City's
 * functional 3D Nexus stations are outside this normal-page compatibility path.
 */

const RETIRED_FRONTEND_NEXUS_SELECTOR = [
  '[data-eon-nexus-pulse]',
  '[data-eon-nexus-live]',
  '[data-eon-nexus-living-core]',
  '.eon-nexus-pulse',
  '.eon-nexus-live'
].join(',');

export function retireEonNexusPageSurface({ environment = globalThis, document: documentRef = environment?.document } = {}) {
  if (!documentRef?.body) return Object.freeze({ ok: false, reason: 'document-unavailable', removed: 0 });
  const pathname = String(environment?.location?.pathname || '');
  if (pathname === '/eoncity' || pathname.startsWith('/eoncity/')) {
    return Object.freeze({ ok: false, reason: 'city-surface-preserved', removed: 0 });
  }
  let removed = 0;
  try { environment?.EONNexusPageSurface?.dispose?.(); } catch {}
  for (const node of documentRef.querySelectorAll(RETIRED_FRONTEND_NEXUS_SELECTOR)) {
    node.remove();
    removed += 1;
  }
  documentRef.body.classList.remove('eon-nexus-live-open', 'eon-nexus-expanded', 'eon-nexus-pulse-open');
  const result = Object.freeze({ ok: true, reason: 'retired-by-w724-quick-command', removed, quickCommandAuthority: true });
  environment.EONNexusPageSurface = result;
  return result;
}

function install() {
  retireEonNexusPageSurface({ environment: window, document });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
else install();
