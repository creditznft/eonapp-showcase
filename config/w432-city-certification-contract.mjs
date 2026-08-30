/**
 * W432 — EON City certification tooling contract.
 *
 * Source code may prepare a reproducible audit matrix, reject Chrome error
 * pages, and summarize supplied artifacts. It cannot make a device, production,
 * Lighthouse, accessibility, or launch certification claim by itself.
 */
import { getRouteRow, RETIRED_REDIRECTS } from './route-contract.mjs';

export const W432_CITY_CERTIFICATION_SCHEMA = 'eon.city.certification.w432.v1';

const freeze = (value) => Object.freeze(value);

export const W432_LIGHTHOUSE_ROUTE_MATRIX = freeze([
  freeze({ id: 'home-chat-guest', route: '/', routeId: 'chat', requiredProfiles: freeze(['desktop', 'mobile']), purpose: 'Guest-first Home/Chat first render and sign-in card shell.' }),
  freeze({ id: 'create', route: '/create', routeId: 'create', requiredProfiles: freeze(['desktop', 'mobile']), purpose: 'Canonical Create entry and truthful first render.' }),
  freeze({ id: 'workspace', route: '/workspace', routeId: 'workspace', requiredProfiles: freeze(['desktop', 'mobile']), purpose: 'Core work surface shell.' }),
  freeze({ id: 'forge', route: '/forge', routeId: 'forge', requiredProfiles: freeze(['desktop', 'mobile']), purpose: 'Local-first build surface shell.' }),
  freeze({ id: 'vault', route: '/vault', routeId: 'vault', requiredProfiles: freeze(['desktop', 'mobile']), purpose: 'Vault and Collection boundary.' }),
  freeze({ id: 'market', route: '/market', routeId: 'market', requiredProfiles: freeze(['desktop', 'mobile']), purpose: 'Preview-only Market surface.' }),
  freeze({ id: 'eoncity', route: '/eoncity', routeId: 'eoncity', requiredProfiles: freeze(['desktop', 'mobile']), purpose: 'Canonical Babylon City direct entry.' }),
  freeze({ id: 'profile', route: '/profile', routeId: 'profile', requiredProfiles: freeze(['desktop', 'mobile']), purpose: 'Account and settings surface.' }),
  freeze({ id: 'help', route: '/help', routeId: 'help', requiredProfiles: freeze(['desktop', 'mobile']), purpose: 'Canonical Help centre.' })
]);

export const W432_DEVICE_CITY_MATRIX = freeze([
  freeze({ id: 'desktop-balanced', profile: 'desktop', quality: 'balanced', evidence: 'first useful frame, Command Deck, route review, return path, 30-minute stability.' }),
  freeze({ id: 'desktop-cinematic', profile: 'desktop', quality: 'cinematic', evidence: 'opt-in visual profile, governor behaviour, no hidden route change, clean disposal/re-entry.' }),
  freeze({ id: 'android-safe', profile: 'android', quality: 'lite', evidence: 'direct City first frame, touch safe areas, recovery path, route review and exit.' }),
  freeze({ id: 'ios-safe', profile: 'ios', quality: 'lite', evidence: 'direct City first frame, touch safe areas, recovery path, route review and exit.' }),
  freeze({ id: 'weak-webgl', profile: 'weak-webgl', quality: 'lite', evidence: 'safe recovery choice, no silent map fallback, no stuck loading state.' })
]);

export const W432_LIGHTHOUSE_BUDGETS = freeze({
  desktop: freeze({ performance: 0.82, accessibility: 0.88, bestPractices: 0.85, seo: 0.88, lcpMs: 3500, cls: 0.15, tbtMs: 400 }),
  mobile: freeze({ performance: 0.72, accessibility: 0.85, bestPractices: 0.8, seo: 0.85, lcpMs: 4500, cls: 0.15, tbtMs: 600 })
});

export const W432_CITY_CERTIFICATION_CONTRACT = freeze({
  schema: W432_CITY_CERTIFICATION_SCHEMA,
  route: '/eoncity',
  publicRenderer: 'Babylon WebGL',
  lighthouseMatrix: W432_LIGHTHOUSE_ROUTE_MATRIX,
  deviceMatrix: W432_DEVICE_CITY_MATRIX,
  budgets: W432_LIGHTHOUSE_BUDGETS,
  evidenceRules: freeze({
    chromeErrorPageInvalid: true,
    navStartRequired: true,
    rawHtmlAndJsonRequired: true,
    browserVersionRequired: true,
    deployedCommitRequired: true,
    deviceHumanEvidenceRequired: true,
    sourceOnlyCannotCertify: true
  }),
  truth: freeze({
    sourceOnly: true,
    automaticLighthousePass: false,
    automaticDevicePass: false,
    automaticProductionPass: false,
    automaticLaunchApproval: false
  })
});

export function validateW432CityCertificationContract(contract = W432_CITY_CERTIFICATION_CONTRACT) {
  const errors = [];
  const retiredPaths = new Set(RETIRED_REDIRECTS.map((entry) => entry.from));
  if (contract?.route !== '/eoncity' || contract?.publicRenderer !== 'Babylon WebGL') errors.push('W432 must certify only the canonical Babylon /eoncity route.');
  if (!Array.isArray(contract?.lighthouseMatrix) || contract.lighthouseMatrix.length < 8) errors.push('W432 needs a compact but complete canonical Lighthouse matrix.');
  const routeIds = new Set();
  const routes = new Set();
  for (const entry of contract?.lighthouseMatrix || []) {
    if (!entry?.id || routeIds.has(entry.id)) errors.push('W432 Lighthouse case id is missing or duplicated.');
    routeIds.add(entry?.id);
    if (!String(entry?.route || '').startsWith('/') || routes.has(entry.route)) errors.push('W432 Lighthouse route is invalid or duplicated.');
    routes.add(entry?.route);
    const routeRow = getRouteRow(entry.route);
    if (!routeRow || Number(routeRow.status) !== 200) errors.push(`W432 Lighthouse route is not a live canonical route: ${entry?.route || '(empty)'}.`);
    if (retiredPaths.has(entry.route)) errors.push(`W432 Lighthouse matrix cannot contain a retired route: ${entry.route}.`);
    if (!Array.isArray(entry?.requiredProfiles) || !entry.requiredProfiles.includes('desktop') || !entry.requiredProfiles.includes('mobile')) errors.push(`W432 route needs desktop and mobile profiles: ${entry?.route || '(empty)'}.`);
  }
  if (!routes.has('/eoncity')) errors.push('W432 Lighthouse matrix must include canonical /eoncity.');
  if (!Array.isArray(contract?.deviceMatrix) || contract.deviceMatrix.length !== 5) errors.push('W432 needs the five required City device cases.');
  if (contract?.truth?.automaticLighthousePass || contract?.truth?.automaticDevicePass || contract?.truth?.automaticProductionPass || contract?.truth?.automaticLaunchApproval) errors.push('W432 cannot issue a certification from source alone.');
  for (const profile of ['desktop', 'mobile']) {
    const budget = contract?.budgets?.[profile];
    if (!budget || !Number.isFinite(budget.performance) || !Number.isFinite(budget.accessibility) || !Number.isFinite(budget.bestPractices) || !Number.isFinite(budget.seo)) errors.push(`W432 ${profile} budget is incomplete.`);
  }
  return errors;
}
