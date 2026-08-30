/**
 * W476-A6 — one explicit, fail-closed inventory of every deployed Pages Function.
 *
 * This contract intentionally describes public behavior and negative cases only.
 * It never contains credential values, account IDs, provider keys, request bodies,
 * database records, or a claim that a conditional integration is live.
 */
export const W476_API_SURFACE_CONTRACT_SCHEMA = 'eonapp.w476.api-surface-contract.v1';

const negative = (id, request, expect) => Object.freeze({ id, request, expect });
const surface = (value) => Object.freeze({ ...value, negativeCases: Object.freeze(value.negativeCases || []) });

export const W476_API_SURFACE_CONTRACT = Object.freeze({
  schema: W476_API_SURFACE_CONTRACT_SCHEMA,
  wave: 'W476-A6',
  sourceOnly: true,
  productionApproved: false,
  notes: Object.freeze([
    'This inventory is a source contract. It does not prove an endpoint is deployed, configured, reachable, or approved for live use.',
    'Conditional endpoints must fail closed without their exact configuration and must not silently activate a cloud payload, OAuth, payment, or media workflow.',
    'No route in this contract accepts or returns Vault material, provider API keys, OAuth tokens, wallet data, payment data, raw local work, or local model binaries.'
  ]),
  surfaces: Object.freeze([
    surface({
      id: 'account-delete-request', route: '/api/account/delete-request', source: 'functions/api/account/delete-request.js', methods: Object.freeze(['POST']),
      state: 'conditional', identity: 'signed-in minimal identity account only', mutationGuard: 'same-origin plus explicit DELETE_EON_ACCOUNT confirmation',
      requestData: 'confirmation literal only', responseData: 'safe deletion status only', sensitiveData: 'never returns account identifier, email, OAuth token, local work, Vault, provider key, payment or wallet data',
      negativeCases: [negative('unconfigured', 'POST without exact identity configuration', '503 identity_unavailable'), negative('cross-origin', 'POST with a non-app Origin', '403 origin_check_failed'), negative('missing-confirmation', 'POST without exact confirmation literal', '400 explicit_confirmation_required')]
    }),
    surface({
      id: 'actions-execute', route: '/api/actions/execute', source: 'functions/api/actions/execute.js', methods: Object.freeze(['POST']),
      state: 'hard-disabled', identity: 'none', mutationGuard: 'hard-disabled', requestData: 'ignored', responseData: 'disabled status only', sensitiveData: 'no action payload, receipt, credential, connector token, external effect or durable write',
      negativeCases: [negative('disabled', 'POST in every configuration', '503 action-gateway-not-configured; externalEffect false')]
    }),
    surface({
      id: 'actions-prepare', route: '/api/actions/prepare', source: 'functions/api/actions/prepare.js', methods: Object.freeze(['POST']),
      state: 'hard-disabled', identity: 'none', mutationGuard: 'hard-disabled', requestData: 'ignored', responseData: 'disabled status only', sensitiveData: 'no action proposal, credential, connector token or external effect',
      negativeCases: [negative('disabled', 'POST in every configuration', '503 action-gateway-not-configured; externalEffect false')]
    }),
    surface({
      id: 'actions-status', route: '/api/actions/status', source: 'functions/api/actions/status.js', methods: Object.freeze(['GET']),
      state: 'hard-disabled', identity: 'none', mutationGuard: 'read only', requestData: 'none', responseData: 'public disabled status only', sensitiveData: 'no action, account, connection, token or external-system state',
      negativeCases: [negative('disabled-status', 'GET in every configuration', '200 enabled false; rollout disabled')]
    }),
    surface({
      id: 'google-oauth-callback', route: '/api/auth/google/callback', source: 'functions/api/auth/google/callback.js', methods: Object.freeze(['GET']),
      state: 'conditional', identity: 'OAuth callback with sealed short-lived flow cookie', mutationGuard: 'signed state, nonce, PKCE and exact configured origin', requestData: 'provider code/state and HttpOnly flow cookie', responseData: 'allowlisted same-origin redirect only', sensitiveData: 'never exposes OAuth code, token, Google identity, subject, email, account id or secret in response',
      negativeCases: [negative('unconfigured', 'GET without exact identity configuration', '302 unavailable return; flow cookie cleared'), negative('tampered-or-missing-flow', 'GET with invalid/missing sealed flow', 'safe same-origin error redirect; flow cookie cleared')]
    }),
    surface({
      id: 'google-oauth-start', route: '/api/auth/google/start', source: 'functions/api/auth/google/start.js', methods: Object.freeze(['GET']),
      state: 'conditional', identity: 'optional Google identity sign-in only', mutationGuard: 'exact configured origin; allowlisted return path; PKCE/state/nonce', requestData: 'optional local return path only', responseData: 'Google authorization redirect plus HttpOnly flow cookie', sensitiveData: 'server secret and local work never enter redirect or client response',
      negativeCases: [negative('unconfigured', 'GET without exact identity configuration', '302 unavailable return; no provider redirect'), negative('unsafe-return', 'GET with external return target', 'redirect returns only to allowlisted app route')]
    }),
    surface({
      id: 'auth-logout', route: '/api/auth/logout', source: 'functions/api/auth/logout.js', methods: Object.freeze(['POST']),
      state: 'conditional', identity: 'optional opaque session', mutationGuard: 'same-origin when identity is configured', requestData: 'no body required', responseData: 'safe signed-out status and cleared HttpOnly cookie', sensitiveData: 'no account id, session id, token or local work',
      negativeCases: [negative('cross-origin', 'POST with a non-app Origin while configured', '403 origin_check_failed'), negative('unconfigured', 'POST without identity configuration', '200 signedIn false; guest use remains available')]
    }),
    surface({
      id: 'auth-session', route: '/api/auth/session', source: 'functions/api/auth/session.js', methods: Object.freeze(['GET']),
      state: 'conditional', identity: 'optional opaque session', mutationGuard: 'read only', requestData: 'HttpOnly cookie only', responseData: 'safe availability/signed-in flags only', sensitiveData: 'no email, subject, account id, token, local work, Vault or provider key',
      negativeCases: [negative('unconfigured', 'GET without identity configuration', '200 guest-safe public status; available false')]
    }),
    surface({
      id: 'connectors-status', route: '/api/connectors/status', source: 'functions/api/connectors/status.js', methods: Object.freeze(['GET']),
      state: 'hard-disabled', identity: 'none', mutationGuard: 'read only', requestData: 'none', responseData: 'public disabled status only', sensitiveData: 'no OAuth, connector token, platform response or direct post state',
      negativeCases: [negative('disabled-status', 'GET in every configuration', '200 enabled false; tokenStored false; directPostCreated false')]
    }),
    surface({
      id: 'deployments-status', route: '/api/deployments/status', source: 'functions/api/deployments/status.js', methods: Object.freeze(['GET']),
      state: 'hard-disabled', identity: 'none', mutationGuard: 'read only', requestData: 'none', responseData: 'public disabled status only', sensitiveData: 'no GitHub/Cloudflare token, repository, project, deployment, log or credential state',
      negativeCases: [negative('disabled-status', 'GET in every configuration', '200 enabled false; githubConnected false; cloudflareConnected false')]
    }),
    surface({
      id: 'offline-capability', route: '/api/offline/capability', source: 'functions/api/offline/capability.js', methods: Object.freeze(['POST']),
      state: 'conditional', identity: 'signed-in opaque identity session only', mutationGuard: 'same-origin plus exact deployed offline-manifest digest and explicit browser installation id',
      requestData: 'installation id, manifest digest and bounded pack identifiers only', responseData: 'privacy-safe pseudonymous offline capability receipt only', sensitiveData: 'never returns account id, email, cookie, OAuth token, provider key, prompt, project, file, City progress, payment or wallet data',
      negativeCases: [negative('unconfigured', 'POST without exact identity configuration', '503 identity_unavailable'), negative('cross-origin', 'POST with a non-app Origin', '403 same_origin_required'), negative('signed-out', 'POST without a valid identity session', '401 signed_in_required'), negative('manifest-mismatch', 'POST for a digest other than the deployed manifest', '409 offline_manifest_mismatch')]
    }),
    surface({
      id: 'csp-report', route: '/csp-report', source: 'functions/csp-report.js', methods: Object.freeze(['POST', 'OPTIONS']),
      state: 'active-privacy-bounded-telemetry', identity: 'none; anonymous browser reporting only', mutationGuard: 'same-origin reported document check; accepted JSON report formats only; strict size bound', requestData: 'CSP violation metadata only', responseData: '204 no-content or safe validation error', sensitiveData: 'raw request body, cookies, credentials, query strings, fragments, raw referrer and signed token data are never retained or forwarded',
      negativeCases: [negative('unsupported-media', 'POST with non-report Content-Type', '415 unsupported_media_type'), negative('invalid-json', 'POST with malformed JSON', '400 invalid_json'), negative('oversize', 'POST over 12 KiB', '413 report_too_large'), negative('foreign-document', 'POST with document URL outside request origin', '400 invalid_csp_document_origin')]
    })
  ])
});

export const W476_API_NEGATIVE_TEST_MATRIX = Object.freeze(
  W476_API_SURFACE_CONTRACT.surfaces.flatMap((entry) => entry.negativeCases.map((testCase) => Object.freeze({
    route: entry.route,
    method: entry.methods[0],
    state: entry.state,
    ...testCase
  })))
);

export function getW476ApiSurface(route = '') {
  return W476_API_SURFACE_CONTRACT.surfaces.find((surface) => surface.route === String(route || '')) || null;
}

export function isW476ApiMethodAllowed(route = '', method = '') {
  const entry = getW476ApiSurface(route);
  return Boolean(entry && entry.methods.includes(String(method || '').toUpperCase()));
}

export function serializeW476ApiSurfaceContract() {
  return JSON.stringify({
    schema: W476_API_SURFACE_CONTRACT.schema,
    wave: W476_API_SURFACE_CONTRACT.wave,
    sourceOnly: W476_API_SURFACE_CONTRACT.sourceOnly,
    productionApproved: W476_API_SURFACE_CONTRACT.productionApproved,
    notes: W476_API_SURFACE_CONTRACT.notes,
    surfaces: W476_API_SURFACE_CONTRACT.surfaces,
    negativeTestMatrix: W476_API_NEGATIVE_TEST_MATRIX
  }, null, 2);
}

export function validateW476ApiSurfaceContract(contract = W476_API_SURFACE_CONTRACT) {
  const issues = [];
  const surfaces = Array.isArray(contract?.surfaces) ? contract.surfaces : [];
  if (contract?.schema !== W476_API_SURFACE_CONTRACT_SCHEMA) issues.push('schema-invalid');
  if (contract?.wave !== 'W476-A6') issues.push('wave-invalid');
  if (contract?.sourceOnly !== true || contract?.productionApproved !== false) issues.push('source-boundary-invalid');
  if (surfaces.length !== 12) issues.push(`surface-count-invalid:${surfaces.length}`);
  const routes = new Set();
  const ids = new Set();
  for (const entry of surfaces) {
    if (!entry?.id || ids.has(entry.id)) issues.push(`id-invalid:${entry?.id || 'missing'}`);
    ids.add(entry?.id);
    if (!/^\/(?:api\/|csp-report$)/.test(String(entry?.route || '')) || routes.has(entry.route)) issues.push(`route-invalid:${entry?.route || 'missing'}`);
    routes.add(entry?.route);
    if (!String(entry?.source || '').startsWith('functions/') || !String(entry?.source || '').endsWith('.js')) issues.push(`source-invalid:${entry?.id || 'unknown'}`);
    if (!Array.isArray(entry?.methods) || !entry.methods.length || entry.methods.some((method) => !['GET', 'POST', 'OPTIONS'].includes(method))) issues.push(`methods-invalid:${entry?.id || 'unknown'}`);
    if (!['hard-disabled', 'conditional', 'conditional-manual-proof', 'public-status-only', 'active-privacy-bounded-telemetry'].includes(entry?.state)) issues.push(`state-invalid:${entry?.id || 'unknown'}`);
    if (!String(entry?.identity || '') || !String(entry?.mutationGuard || '') || !String(entry?.requestData || '') || !String(entry?.responseData || '') || !String(entry?.sensitiveData || '')) issues.push(`classification-incomplete:${entry?.id || 'unknown'}`);
    if (!Array.isArray(entry?.negativeCases) || !entry.negativeCases.length) issues.push(`negative-cases-missing:${entry?.id || 'unknown'}`);
  }
  if (!routes.has('/csp-report')) issues.push('csp-report-missing');
  return Object.freeze(issues);
}
