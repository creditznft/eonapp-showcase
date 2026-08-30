export const W280_B1_LOCAL_SUPPORT_EVIDENCE_PACK_CONTRACT = Object.freeze({
  wave: 'W280-B1',
  scope: 'source-only-local-manual-export',
  schema: 'eonapp.support.evidence-pack.v1',
  requiredHtmlMarkers: Object.freeze([
    'data-w280-b1-support-evidence-pack="true"',
    'data-support-evidence-form',
    'data-support-evidence-preview',
    'data-support-evidence-reviewed',
    'data-support-evidence-copy',
    'data-support-evidence-download'
  ]),
  forbiddenTransport: Object.freeze(['fetch(', 'XMLHttpRequest', 'sendBeacon(', 'WebSocket(', 'EventSource(']),
  forbiddenPersistence: Object.freeze(['localStorage', 'sessionStorage', 'indexedDB']),
  claimFence: 'The local support evidence pack is a review-first manual export, not a ticket, telemetry channel, human-support promise, or security disclosure channel.'
});

export function validateW280B1LocalSupportEvidencePackContract() {
  const errors = [];
  const contract = W280_B1_LOCAL_SUPPORT_EVIDENCE_PACK_CONTRACT;
  if (contract.scope !== 'source-only-local-manual-export') errors.push('W280-B1 scope must remain local manual export only.');
  if (!contract.schema.startsWith('eonapp.support.evidence-pack.')) errors.push('W280-B1 schema must stay namespaced.');
  if (contract.forbiddenTransport.length < 5) errors.push('W280-B1 must deny common remote transport paths.');
  if (contract.forbiddenPersistence.length < 3) errors.push('W280-B1 must deny persistent browser storage.');
  return Object.freeze({ ok: errors.length === 0, errors });
}
