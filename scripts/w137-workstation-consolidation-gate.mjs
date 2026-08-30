import fs from 'node:fs';
import path from 'node:path';
import {
  W137_BUTTON_MATRIX_GROUPS,
  W137_CANONICAL_WORKSTATION_ROUTE,
  W137_REQUIRED_WORKSTATION_APPS,
  W137_ROUTE_ALIASES,
  W137_WORKSTATION_SCHEMA
} from '../assets/js/utils/w137-workstation-consolidation-contract.js';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const exists = (file) => fs.existsSync(path.join(root, file));
const files = {
  browserHtml: read('eon-browser.html'),
  workstation: read('assets/js/eon-workstation-page.js'),
  workbenchHtml: read('workbench.html'),
  workbenchJs: read('assets/js/workbench-page.js'),
  codeShowcaseHtml: read('realm-code-preview.html'),
  codeShowcaseJs: read('assets/js/realm3d/realm-code-preview.js'),
  pkg: read('package.json')
};

function count(pattern, text) {
  return [...text.matchAll(new RegExp(pattern, 'g'))].length;
}

const routeFiles = W137_REQUIRED_WORKSTATION_APPS.map((app) => {
  const file = app.route.split('#')[0].replace(/^\//, '').replace(/$/, '').endsWith('.html')
    ? app.route.split('#')[0].replace(/^\//, '')
    : `${app.route.split('#')[0].replace(/^\//, '')}.html`;
  return { ...app, file, exists: exists(file) };
});

const launcherButtons = count('data-ew-open=', files.browserHtml);
const requiredLaunchersPresent = W137_REQUIRED_WORKSTATION_APPS.every((app) => files.browserHtml.includes(`data-ew-open="${app.route}"`) || files.workstation.includes(`url: '${app.route}'`));
const noOldEjectionRoutes = !/data-app-url="\/build"|data-app-url="\/create"|data-app-url="\/trade"/.test(files.browserHtml);
const workstationNormalizesAliases = /WORKSTATION_ROUTE_ALIASES/.test(files.workstation) && /WORKSTATION_QUERY_APP_ALIASES/.test(files.workstation) && /applyInitialWorkstationRoute/.test(files.workstation);
const globalRoutingInstalled = /installGlobalWorkstationRouting/.test(files.workstation) && /event\.preventDefault\(\)/.test(files.workstation) && /openInternalApp\(raw\)/.test(files.workstation);
const codeShowcaseStandalone = /data-w137-code-showcase="standalone-visible"/.test(files.codeShowcaseJs) && /Code Showcase is visible without a parent iframe/.test(files.codeShowcaseJs) && /unsafe-inline/.test(files.codeShowcaseHtml);
const deviceLabAccessible = /id="device-lab"/.test(files.workbenchHtml) && /data-w137-device-lab-section="true"/.test(files.workbenchHtml) && /initW137WorkbenchAliasRouting/.test(files.workbenchJs);
const workbenchDemoted = /data-w137-workbench-alias="true"/.test(files.workbenchHtml) && /Workbench is now a module inside EON Workstation/.test(files.workbenchHtml);
const publicWaveCopyReduced = !/W128 Build OS|W129_WORKSTATION_PROFESSIONAL_OS/.test(files.browserHtml + files.workbenchHtml);
const packageScriptPresent = /qa:w137-workstation-consolidation/.test(files.pkg) && /qa:w121-w137-visual-overhaul/.test(files.pkg);
const buttonGroupsOk = W137_BUTTON_MATRIX_GROUPS.every((group) => {
  const text = read(group.file);
  return (text.match(new RegExp(group.selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length >= group.minimum;
});

const checks = {
  schema: W137_WORKSTATION_SCHEMA,
  canonicalWorkstationRoute: W137_CANONICAL_WORKSTATION_ROUTE,
  routeFilesExist: routeFiles.every((row) => row.exists),
  launcherButtonsAtLeastTen: launcherButtons >= 10,
  requiredLaunchersPresent,
  noOldEjectionRoutes,
  workstationNormalizesAliases,
  globalRoutingInstalled,
  codeShowcaseStandalone,
  deviceLabAccessible,
  workbenchDemoted,
  publicWaveCopyReduced,
  packageScriptPresent,
  buttonGroupsOk
};
const ok = Object.entries(checks).filter(([key]) => key !== 'schema' && key !== 'canonicalWorkstationRoute').every(([, value]) => Boolean(value));
const stats = {
  schema: W137_WORKSTATION_SCHEMA,
  ok,
  checks,
  routeFiles,
  launcherButtons,
  routeAliases: W137_ROUTE_ALIASES,
  appRoutes: W137_REQUIRED_WORKSTATION_APPS
};
fs.mkdirSync(path.join(root, 'tmp'), { recursive: true });
fs.writeFileSync(path.join(root, 'tmp', 'w137-workstation-consolidation-stats.json'), `${JSON.stringify(stats, null, 2)}\n`);
if (!ok) {
  console.error(JSON.stringify(stats, null, 2));
  process.exit(1);
}
console.log(`W137 workstation consolidation gate passed: ${W137_REQUIRED_WORKSTATION_APPS.length} app routes, ${launcherButtons} launchers`);
