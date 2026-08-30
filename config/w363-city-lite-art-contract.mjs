/** W363 — City Lite premium 2.5D art contract. */
export const W363_CITY_LITE_ART_CONTRACT = Object.freeze({
  wave: 'W363',
  program: 'C-04 City Lite art rebuild',
  route: '/eoncity/lite',
  objective: 'A richly illustrated, deterministic, local-first 2.5D City Overview that remains fast and accessible on constrained devices.',
  required: Object.freeze([
    'One canonical City Lite route and ordinary mode handoffs.',
    'Deterministic visual art direction for every canonical district.',
    'A visual detail preference with Auto, High and Conserve modes.',
    'Reduced motion, data saver and low-memory protection that overrides High detail.',
    'No downloaded art, provider request, external telemetry, City execution, account connection, payment flow, or hidden work simulation.',
    'Route and interaction truth remains shared with CityWorldState.'
  ]),
  boundaries: Object.freeze({
    localOnly: true,
    networkRequests: false,
    externalExecution: false,
    privateDataInRenderer: false,
    publicAccountOrPaymentActivation: false
  })
});

export function validateW363CityLiteArtContract() {
  const errors = [];
  if (W363_CITY_LITE_ART_CONTRACT.route !== '/eoncity/lite') errors.push('route-mismatch');
  if (!W363_CITY_LITE_ART_CONTRACT.boundaries.localOnly) errors.push('must-remain-local');
  if (W363_CITY_LITE_ART_CONTRACT.boundaries.networkRequests) errors.push('network-not-allowed');
  if (W363_CITY_LITE_ART_CONTRACT.boundaries.externalExecution) errors.push('execution-not-allowed');
  if (W363_CITY_LITE_ART_CONTRACT.boundaries.privateDataInRenderer) errors.push('private-renderer-data-not-allowed');
  return Object.freeze(errors);
}
