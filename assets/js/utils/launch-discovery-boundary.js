/**
 * W617B identity-surface compatibility stub.
 *
 * Historical peer discovery was quarantined with legacy transport code. The
 * active launch keeps discovery disabled so public identity, social contact and
 * seller-style surfaces cannot appear accidentally. This module exists only so
 * launch identity gates have a safe active boundary to inspect.
 */

export const P2P_DISCOVERY_STATUS = Object.freeze({
  schema: 'eonapp.p2p-discovery.disabled.v1',
  enabled: false,
  launchMode: 'disabled-archived-compatibility',
  reason: 'Peer discovery is not part of the Dodo-first launch candidate.',
  networkConnectionsAllowed: false,
  publicIdentitySurfaceAllowed: false,
  userContactSurfaceAllowed: false,
  localStorageEntitlementTrusted: false
});

export function getP2PDiscoveryStatus() {
  return P2P_DISCOVERY_STATUS;
}

export function isP2PDiscoveryEnabled() {
  return false;
}

export function createP2PDiscoveryController() {
  return Object.freeze({
    status: P2P_DISCOVERY_STATUS,
    start: () => P2P_DISCOVERY_STATUS,
    stop: () => P2P_DISCOVERY_STATUS,
    listPeers: () => Object.freeze([])
  });
}

export default Object.freeze({
  P2P_DISCOVERY_STATUS,
  getP2PDiscoveryStatus,
  isP2PDiscoveryEnabled,
  createP2PDiscoveryController
});
