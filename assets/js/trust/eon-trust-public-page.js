import { getTrustPolicySet } from './eon-trust-support-authority.js';

function text(node, value) { if (node) node.textContent = String(value || ''); }
function renderOperatorConfig(config) {
  document.querySelectorAll('[data-eon-operator-identity]').forEach((root) => {
    const identity = config?.identity || {};
    root.setAttribute('data-eon-operator-configured', config?.configured ? 'true' : 'false');
    const fields = {
      legalName: identity.legalName,
      tradingName: identity.tradingName,
      address: identity.address,
      country: identity.country,
      supportContact: identity.supportContact,
      privacyContact: identity.privacyContact,
      securityContact: identity.securityContact,
      governingLaw: identity.governingLaw,
      venue: identity.venue
    };
    for (const [key, value] of Object.entries(fields)) text(root.querySelector(`[data-eon-operator-field="${key}"]`), value || 'Pending owner/counsel configuration');
    text(root.querySelector('[data-eon-operator-status]'), config?.configured
      ? 'The operator/controller record is configured for this deployed environment.'
      : 'Paid launch remains blocked until the legal operator/controller identity, contacts, governing law and venue are configured and reviewed.');
  });
}

export async function loadPublicTrustConfig(fetchImpl = globalThis.fetch) {
  try {
    const response = await fetchImpl('/api/trust/config', { credentials: 'same-origin', cache: 'no-store', headers: { accept: 'application/json' } });
    const payload = await response.json();
    renderOperatorConfig(payload);
    return payload;
  } catch {
    const fallback = { configured: false, identity: {}, policySet: getTrustPolicySet() };
    renderOperatorConfig(fallback);
    return fallback;
  }
}

export function installPublicTrustConfig() { return loadPublicTrustConfig(); }
