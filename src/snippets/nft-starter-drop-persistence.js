// Public-safe example: starter NFT display persistence rule, not production generator code.
export function shouldHydrateStarterDrop({ firstVisit, inventoryCount, storageHealthy }) {
  if (!storageHealthy) return { hydrate: true, mode: 'server-safe-fallback' };
  if (firstVisit || inventoryCount === 0) return { hydrate: true, mode: 'progressive-starter-drop' };
  return { hydrate: false, mode: 'use-persisted-inventory' };
}
