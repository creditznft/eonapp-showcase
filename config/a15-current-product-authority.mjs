import {
  COMPATIBILITY_ROUTES,
  INFORMATIONAL_ROUTES,
  PRIMARY_APP_ROUTES,
  RETIRED_REDIRECTS,
  ROUTE_CONTRACT_VERSION,
  validateRouteContract
} from './route-contract.mjs';

export const A15_CURRENT_PRODUCT_AUTHORITY_SCHEMA = 'eonapp.a15.current-product-authority.v1';
export const A15_SYSTEM_HTML_DOCUMENTS = Object.freeze(['404.html', 'offline.html']);

const freezeRows = (rows) => Object.freeze(rows.map((row) => Object.freeze({ ...row })));
const uniqueFiles = (rows) => Object.freeze([...new Set(rows.map((row) => row.file).filter(Boolean))].sort());

/**
 * Current product routes are the surfaces EONAPP presents as the product.
 * Compatibility documents can still be emitted for safe old links, but they
 * are not allowed to become current product/navigation authority.
 */
export const A15_CURRENT_PRODUCT_ROUTES = freezeRows([
  ...PRIMARY_APP_ROUTES,
  ...INFORMATIONAL_ROUTES
]);

export const A15_EMITTED_COMPATIBILITY_ROUTES = freezeRows(
  COMPATIBILITY_ROUTES.filter((row) => Number(row.status) === 200)
);

export const A15_REDIRECT_ONLY_COMPATIBILITY_ROUTES = freezeRows(
  COMPATIBILITY_ROUTES.filter((row) => Number(row.status) >= 300)
);

export const A15_BUILD_ROUTE_ROWS = freezeRows([
  ...A15_CURRENT_PRODUCT_ROUTES,
  ...A15_EMITTED_COMPATIBILITY_ROUTES
]);

export const A15_CURRENT_PRODUCT_ROUTE_FILES = uniqueFiles(A15_CURRENT_PRODUCT_ROUTES);
export const A15_EMITTED_COMPATIBILITY_FILES = uniqueFiles(A15_EMITTED_COMPATIBILITY_ROUTES);
export const A15_REDIRECT_ONLY_COMPATIBILITY_FILES = uniqueFiles(A15_REDIRECT_ONLY_COMPATIBILITY_ROUTES);
export const A15_BUILD_HTML_ENTRY_FILES = Object.freeze([
  ...new Set([...uniqueFiles(A15_BUILD_ROUTE_ROWS), ...A15_SYSTEM_HTML_DOCUMENTS])
].sort());

export const A15_CAPABILITY_AUTHORITY = Object.freeze({
  governanceAuthority: 'config/a15-current-product-authority.mjs',
  runtimeProjection: 'assets/js/capabilities/capability-truth-registry.js',
  serverEntitlementProjection: 'assets/js/billing/eon-server-entitlement-ledger.js',
  status: 'provisional-no-launch',
  successorWave: 'I09',
  invariant: 'No other capability catalogue may claim current launch authority before I09 replaces this provisional projection.'
});

export const A15_TEST_AUTHORITY = Object.freeze({
  currentUnitManifest: 'config/w624d-current-unit-test-manifest.json',
  sourceCertification: 'scripts/w766ir2-source-certification-gate.mjs',
  a15BaselineGate: 'scripts/a15-i00-c01-baseline-authority.mjs',
  externalCertification: 'docs/handover/w802b-storm-sector-source-complete-external-gates/evidence/W802B_EXTERNAL_CERTIFICATION_EVIDENCE.json',
  status: 'source-gates-current-external-gates-blocked'
});

export function validateA15CurrentProductAuthority() {
  const errors = [...validateRouteContract()];
  const currentIds = A15_CURRENT_PRODUCT_ROUTES.map((row) => row.id);
  const buildFiles = A15_BUILD_HTML_ENTRY_FILES;
  const redirectFiles = new Set(A15_REDIRECT_ONLY_COMPATIBILITY_FILES);

  if (new Set(currentIds).size !== currentIds.length) errors.push('Current product route IDs must be unique.');
  if (new Set(buildFiles).size !== buildFiles.length) errors.push('Build HTML entries must be unique.');
  if (buildFiles.some((file) => redirectFiles.has(file))) errors.push('Redirect-only compatibility HTML must not be a Vite build entry.');
  if (A15_CURRENT_PRODUCT_ROUTES.some((row) => Number(row.status) !== 200)) errors.push('Current product routes must be status 200 documents.');
  if (A15_EMITTED_COMPATIBILITY_ROUTES.some((row) => Number(row.status) !== 200)) errors.push('Emitted compatibility routes must be status 200 documents.');
  if (A15_REDIRECT_ONLY_COMPATIBILITY_ROUTES.some((row) => Number(row.status) < 300)) errors.push('Redirect-only compatibility routes must use redirect status.');
  if (!A15_REDIRECT_ONLY_COMPATIBILITY_FILES.includes('chat.html')) errors.push('Legacy chat document must remain redirect-only.');
  if (!A15_REDIRECT_ONLY_COMPATIBILITY_FILES.includes('support.html')) errors.push('Legacy support document must remain redirect-only.');
  if (A15_CAPABILITY_AUTHORITY.status !== 'provisional-no-launch') errors.push('Capability authority must remain explicitly provisional until I09.');
  if (!String(ROUTE_CONTRACT_VERSION).startsWith('eonapp.')) errors.push('Route contract version is invalid.');
  if (!Array.isArray(RETIRED_REDIRECTS) || RETIRED_REDIRECTS.length === 0) errors.push('Retired redirect authority must remain present.');
  return Object.freeze(errors);
}
