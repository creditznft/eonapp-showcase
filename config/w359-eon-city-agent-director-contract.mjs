/** W359 — EON City Agent Director source contract. */
export const W359_EON_CITY_AGENT_DIRECTOR_CONTRACT = Object.freeze({
  wave: 'W359',
  status: 'source-implementation-started',
  productLanguage: Object.freeze({ primary: 'Enter EON City', publicMode: 'Immersive Work Mode', notPrimary: 'Play' }),
  providerVisuals: Object.freeze({
    defaultVisibility: 'hidden',
    requiresLocalOptIn: true,
    selectedProviderOnly: true,
    maximumVisibleActors: 4,
    officialProviderCharacter: false,
    rawPrompt: false,
    rawOutput: false,
    modelName: false,
    credentials: false,
    accountDetails: false
  }),
  runtime: Object.freeze({
    foregroundOnly: true,
    backgroundAfterClose: false,
    providerCallStartedByCity: false,
    cityCanExecute: false,
    cityCanApprove: false,
    externalEffect: false
  }),
  snapshot: Object.freeze({ maxZipBytes: 20 * 1024 * 1024, codeOnly: true, excludes: ['.env*', 'node_modules', 'dist', 'logs', 'screenshots', 'generated art binaries'] })
});

export function validateW359EonCityAgentDirectorContract() {
  const errors = [];
  const visual = W359_EON_CITY_AGENT_DIRECTOR_CONTRACT.providerVisuals;
  const runtime = W359_EON_CITY_AGENT_DIRECTOR_CONTRACT.runtime;
  const snapshot = W359_EON_CITY_AGENT_DIRECTOR_CONTRACT.snapshot;
  if (visual.defaultVisibility !== 'hidden' || visual.requiresLocalOptIn !== true) errors.push('Provider identity must stay locally opt-in and hidden by default.');
  if (visual.rawPrompt || visual.rawOutput || visual.modelName || visual.credentials || visual.accountDetails) errors.push('Agent Director may not surface private provider data.');
  if (visual.officialProviderCharacter) errors.push('City provider visuals must remain original EON City art direction.');
  if (runtime.backgroundAfterClose || runtime.providerCallStartedByCity || runtime.cityCanExecute || runtime.cityCanApprove || runtime.externalEffect) errors.push('City visuals must not become an autonomous agent runtime.');
  if (snapshot.maxZipBytes > 20 * 1024 * 1024 || !snapshot.codeOnly) errors.push('W359 code snapshots must stay under the 20 MB code-only policy.');
  return Object.freeze({ ok: errors.length === 0, errors: Object.freeze(errors) });
}
