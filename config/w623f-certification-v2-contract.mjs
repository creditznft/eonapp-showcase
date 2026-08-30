/** W623F — certification v2 contract. */
export const W623F_CERTIFICATION_SCHEMA = 'eonapp.certification-v2.w623f.v1';
export const W623F_SOURCE_CHECKPOINT = 'W623F';
export const W623F_NEXT_WAVE = 'W623G';

export const W623F_CERTIFICATION_ROUTES = Object.freeze([
  Object.freeze({ id: 'chat', path: '/', sourceFile: 'index.html', distFile: 'index.html', expectedLifecycle: 'live' }),
  Object.freeze({ id: 'create', path: '/create', sourceFile: 'create.html', distFile: 'create/index.html', expectedLifecycle: 'live' }),
  Object.freeze({ id: 'projects', path: '/projects', sourceFile: 'projects.html', distFile: 'projects/index.html', expectedLifecycle: 'live' }),
  Object.freeze({ id: 'library', path: '/library', sourceFile: 'library.html', distFile: 'library/index.html', expectedLifecycle: 'live' }),
  Object.freeze({ id: 'eoncity', path: '/eoncity', sourceFile: 'eoncity.html', distFile: 'eoncity/index.html', expectedLifecycle: 'direct-babylon-city' }),
  Object.freeze({ id: 'profile', path: '/profile', sourceFile: 'profile.html', distFile: 'profile/index.html', expectedLifecycle: 'live' }),
  Object.freeze({ id: 'billing', path: '/billing', sourceFile: 'billing.html', distFile: 'billing/index.html', expectedLifecycle: 'live-sensitive' }),
  Object.freeze({ id: 'eon-keys', path: '/eon-keys', sourceFile: 'eon-keys.html', distFile: 'eon-keys/index.html', expectedLifecycle: 'proof-gated-referral' }),
  Object.freeze({ id: 'help', path: '/help', sourceFile: 'help.html', distFile: 'help/index.html', expectedLifecycle: 'live' })
]);

export const W623F_MAINTAINED_CERTIFICATION = Object.freeze([
  'W623C canonical commercial truth',
  'W623D production reachability and quarantine',
  'W623E information architecture',
  'W623F Guide, language, voice and certification v2',
  'targeted ESLint',
  'one production build'
]);

export const W623F_ARCHIVED_BOUNDARY = Object.freeze([
  'Historical fixtures do not certify current deployment truth.',
  'The unrelated W353 beta-readiness fixture remains archived and is not rewritten to pass.',
  'A source string, static screenshot or route existence alone cannot certify a live capability.'
]);

export const W623F_PROOF_DOMAINS = Object.freeze([
  Object.freeze({ id: 'information-architecture', state: 'source-and-build-proven', launchBlocking: false }),
  Object.freeze({ id: 'browser-multilingual-voice', state: 'source-proven-real-device-pending', launchBlocking: true }),
  Object.freeze({ id: 'local-image', state: 'source-integrated-real-output-pending', launchBlocking: true }),
  Object.freeze({ id: 'local-video', state: 'runbook-ready-real-output-pending', launchBlocking: true }),
  Object.freeze({ id: 'direct-byok-image-video', state: 'planned', launchBlocking: true }),
  Object.freeze({ id: 'dodo-customer-lifecycle', state: 'server-foundation-live-genuine-customer-lifecycle-pending', launchBlocking: true }),
  Object.freeze({ id: 'referral-eonkeys-lifecycle', state: 'proof-gated-server-lifecycle-pending', launchBlocking: true }),
  Object.freeze({ id: 'eoncity-flagship', state: 'technical-preview-w624-pending', launchBlocking: true }),
  Object.freeze({ id: 'deployed-source-parity', state: 'stale-deployment-observed', launchBlocking: true })
]);
