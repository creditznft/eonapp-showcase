import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const required = [
  'config/w554-eon-city-access-project-portals-contract.mjs',
  'functions/api/city/access.js',
  'functions/city-private/_middleware.js',
  'public/city-private/w554-access-check.json',
  'assets/js/city/eon-city-access-station.js',
  'assets/js/city/eon-city-project-district-workspace.js'
];
const errors = [];
for (const relative of required) if (!fs.existsSync(path.join(root, relative))) errors.push(`missing ${relative}`);
const html = read('eoncity.html');
const station = read('assets/js/city/eon-city-access-station.js');
const access = read('functions/api/city/access.js');
const privateAssets = read('functions/city-private/_middleware.js');
const privateFixture = read('public/city-private/w554-access-check.json');
const portals = read('assets/js/city/eon-city-project-district-workspace.js');
const manifest = read('assets/js/city/eon-city-project-district-manifest.js');
const authorizedBootBlock = station.indexOf("if (view.kind === 'boot')");
const corePreloader = station.indexOf('const preloadCore = () =>', authorizedBootBlock);
const automaticEntry = station.indexOf('const automaticEntry = enter()', corePreloader);
const coreImportCount = (station.match(/import\('\.\/eon-city-play-core\.js'\)/g) || []).length;
const authenticatedAutomaticBoot = authorizedBootBlock >= 0
  && corePreloader > authorizedBootBlock
  && automaticEntry > corePreloader
  && coreImportCount === 1
  && !station.includes('eon-city-runtime-owner.js');
if (!html.includes('/assets/js/city/eon-city-access-station.js')) errors.push('eoncity must mount the lightweight W554 access station.');
if (html.includes('/assets/js/eon-city-play-station.js')) errors.push('eoncity must not eagerly load the heavy play station.');
if (!authenticatedAutomaticBoot) errors.push('W554 access station must start the single Babylon core automatically only inside the authorized boot branch and must not import the legacy owner.');
if (!station.includes('isEonCityHeavyBootAllowed(access)')) errors.push('W554 access station must require an explicit safe access decision.');
if (!access.includes('readSession') || !access.includes('publicAuthStatus')) errors.push('City access endpoint must validate only the existing safe identity session state.');
if (!privateAssets.includes('readSession') || !privateAssets.includes('context.next()')) errors.push('W554B private City asset middleware must validate the existing session before static fallback.');
if (!privateAssets.includes("'private, no-store, max-age=0'") || !privateAssets.includes("headers.set('vary', vary.join(', '))")) errors.push('W554B private City asset middleware must isolate the experiment from shared cache reuse.');
if (/accountId|email|access_token|refresh_token|client_secret|projectId|prompt/i.test(privateFixture)) errors.push('W554B synthetic private City fixture must contain no identity or work data.');
if (!portals.includes("from '../utils/eon-workspace-store.js'")) errors.push('Project portals must use real local Project records.');
if (!portals.includes('projectReference: project.id')) errors.push('Project portal create must link the selected real Project ID locally.');
if (!manifest.includes('projectReferenceExposed') || !portals.includes('never become 3D')) errors.push('Project portal source must state the private render boundary.');
const report = { wave: 'W554A-W554B', ok: errors.length === 0, checks: 14 - errors.length, errors };
if (!report.ok) {
  console.error(JSON.stringify(report, null, 2));
  process.exitCode = 1;
} else {
  console.log(JSON.stringify(report, null, 2));
}
