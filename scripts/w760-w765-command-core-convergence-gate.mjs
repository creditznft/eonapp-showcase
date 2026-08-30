import { readFile } from 'node:fs/promises';
import {
  EON_CITY_W760_W765_SCHEMA,
  EON_CITY_W760_SCENE_PROFILE,
  EON_CITY_W761_CHARACTER_PROFILE,
  EON_CITY_W763_MENU_ORDER,
  EON_CITY_W765_ACCEPTANCE_MATRIX,
  validateEonCityW760W765Convergence
} from '../assets/js/city/w760/eon-city-w760-w765-command-core-convergence.js';

const runtime = await readFile(new URL('../assets/js/city/w731/eon-city-w731-command-hub-runtime.js', import.meta.url), 'utf8');
const css = await readFile(new URL('../assets/css/eon-city-play.css', import.meta.url), 'utf8');
const validation = validateEonCityW760W765Convergence();
const checks = {
  schema: EON_CITY_W760_W765_SCHEMA === 'eon.city.command-core-convergence.w765.v1',
  validation: validation.ok,
  skyline: EON_CITY_W760_SCENE_PROFILE.skyline.nearWindowRows >= 5 && /w760-skyline-facade-band/.test(runtime),
  characters: EON_CITY_W761_CHARACTER_PROFILE.proceduralCitizenStyles.length === 4 && /w761-finished-procedural-citizen/.test(runtime),
  nexusAuthority: /EON_CITY_W749_VIEW_EVENT/.test(runtime) && /actual-w749-view-delta/.test(await readFile(new URL('../assets/js/city/w760/eon-city-w760-w765-command-core-convergence.js', import.meta.url), 'utf8')),
  rewardAuthority: /noteMissionClaim/.test(runtime) && /verified-w752-result/.test(await readFile(new URL('../assets/js/city/w760/eon-city-w760-w765-command-core-convergence.js', import.meta.url), 'utf8')),
  interactionAudit: /w763-interaction-completeness-invalid/.test(runtime),
  menu: EON_CITY_W763_MENU_ORDER.length === 7 && /data-eon-city-menu-order/.test(runtime),
  responsiveUi: /eon-city-command-menu-quick/.test(css) && /eon-city-command-feedback/.test(css),
  acceptance: EON_CITY_W765_ACCEPTANCE_MATRIX.overallOwnerScore === 9.5,
  architecture: validation.decisions.oneBabylonRuntime && validation.decisions.oneNexusAuthority === 'w749' && validation.decisions.oneMissionAuthority === 'w752' && validation.decisions.expanseSealed === false && validation.decisions.expanseGateReviewRequired && validation.decisions.expanseRuntimeReachable,
  noAutomaticCertification: !/automaticallyCertified:\s*true/.test(runtime)
};
const failures = Object.entries(checks).filter(([, ok]) => !ok).map(([id]) => id);
const report = Object.freeze({ schema: EON_CITY_W760_W765_SCHEMA, ok: failures.length === 0, checks, failures, renderedCertificationPerformed: false, deploymentPerformed: false });
console.log(JSON.stringify(report, null, 2));
if (failures.length) process.exitCode = 1;
