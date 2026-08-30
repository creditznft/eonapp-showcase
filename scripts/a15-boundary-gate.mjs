import process from 'node:process';
import { inspectCityCoreBoundary, inspectCoreCityBoundary } from './lib/a15-source-authority.mjs';

const mode = process.argv.includes('--enforce')
  ? 'enforce'
  : process.argv.includes('--core-enforce')
    ? 'core-enforce'
    : 'baseline';
const core = inspectCoreCityBoundary();
const city = inspectCityCoreBoundary();
const coreBlockers = [
  ...(core.coupledRouteCount ? [`${core.coupledRouteCount}/${core.routeCount} Core routes reach City implementation`] : []),
  ...(core.routes.some((route) => route.unresolved.length) ? ['Core route graph contains unresolved local imports'] : [])
];
const cityBlockers = [
  ...(city.nonCityImplementationModuleCount ? [`City runtime reaches ${city.nonCityImplementationModuleCount} non-contract implementation modules`] : []),
  ...(city.unresolved.length ? ['City runtime graph contains unresolved local imports'] : [])
];
const blockers = [...coreBlockers, ...cityBlockers];
const baselineMatches = core.routeCount === 13
  && core.coupledRouteCount === 13
  && core.distinctCityModuleCount === 19
  && city.moduleCount === 249
  && city.cityModuleCount === 192
  && city.nonCityModuleCount === 57;
const ok = mode === 'baseline'
  ? baselineMatches
  : mode === 'core-enforce'
    ? coreBlockers.length === 0
    : blockers.length === 0;
const result = {
  ok,
  mode,
  baselineMatches,
  core: { routeCount: core.routeCount, coupledRouteCount: core.coupledRouteCount, distinctCityModuleCount: core.distinctCityModuleCount },
  city: { moduleCount: city.moduleCount, cityModuleCount: city.cityModuleCount, nonCityModuleCount: city.nonCityModuleCount, allowedContractModuleCount: city.allowedContractModuleCount, nonCityImplementationModuleCount: city.nonCityImplementationModuleCount },
  coreBlockers,
  cityBlockers,
  blockers: mode === 'core-enforce' ? coreBlockers : blockers,
  target: 'Core and City share versioned contracts only; zero two-way implementation imports.'
};
console.log(JSON.stringify(result, null, 2));
if (!ok) process.exitCode = 1;
