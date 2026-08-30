#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  EONAPP_COMPACT_PRIMARY_NAVIGATION,
  renderEonShellNavigationMarkup
} from '../assets/js/shell/eon-shell-navigation.js';
import {
  EON_CREATE_EXECUTION_RAILS,
  EON_CREATE_MODES,
  validateEonCreateCatalog
} from '../assets/js/create/eon-create-catalog.js';
import {
  PRIMARY_APP_ROUTES,
  COMPATIBILITY_ROUTES,
  RETIRED_REDIRECTS,
  validateRouteContract
} from '../config/route-contract.mjs';
import {
  W623E_ACCOUNT_DESTINATIONS,
  W623E_CREATE_MODE_IDS,
  W623E_LEGACY_CREATE_ALIASES,
  W623E_PRIMARY_NAV_IDS,
  W623E_SCHEMA
} from '../config/w623e-information-architecture-contract.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(ROOT, relative), 'utf8');

export function inspectW623eInformationArchitecture() {
  const errors = [];
  const navIds = EONAPP_COMPACT_PRIMARY_NAVIGATION.map((item) => item.id);
  if (JSON.stringify(navIds) !== JSON.stringify(W623E_PRIMARY_NAV_IDS)) errors.push(`Primary navigation must be ${W623E_PRIMARY_NAV_IDS.join(', ')}.`);
  if (EONAPP_COMPACT_PRIMARY_NAVIGATION.some((item) => item.action)) errors.push('Every primary navigation item must resolve to a canonical route.');
  const navMarkup = renderEonShellNavigationMarkup('create');
  for (const forbidden of ['>Tools<', '>Studio<', '>Market<', '>Collection<', '>Realm<', '>Apps<']) {
    if (navMarkup.includes(forbidden)) errors.push(`Primary navigation still renders legacy concept ${forbidden}.`);
  }
  if (!navMarkup.includes('href="/create"') || !navMarkup.includes('aria-current="page"')) errors.push('Create is not rendered as the canonical active navigation destination.');

  const catalog = validateEonCreateCatalog();
  errors.push(...catalog.errors);
  const createIds = EON_CREATE_MODES.map((mode) => mode.id);
  if (JSON.stringify(createIds) !== JSON.stringify(W623E_CREATE_MODE_IDS)) errors.push(`Create modes must be ${W623E_CREATE_MODE_IDS.join(', ')}.`);
  if (JSON.stringify(EON_CREATE_EXECUTION_RAILS) !== JSON.stringify(['local-runtime', 'direct-user-owned-byok', 'guide'])) errors.push('Creator rails must remain Local, Direct BYOK and Guide only.');

  const routeErrors = validateRouteContract();
  errors.push(...routeErrors);
  const createRoute = PRIMARY_APP_ROUTES.find((row) => row.from === '/create');
  if (!createRoute || createRoute.file !== 'create.html' || createRoute.status !== 200) errors.push('/create is not the canonical live Create document.');
  const market = COMPATIBILITY_ROUTES.find((row) => row.from === '/market');
  if (!market || market.lifecycle !== 'compatibility-hidden') errors.push('/market must remain hidden compatibility only.');
  for (const alias of W623E_LEGACY_CREATE_ALIASES) {
    const redirect = RETIRED_REDIRECTS.find((row) => row.from === alias);
    if (!redirect || redirect.to !== '/create' || redirect.status !== 301) errors.push(`${alias} must redirect to /create.`);
  }

  const createHtml = read('create.html');
  if (!/data-eon-app-page="create"/.test(createHtml)) errors.push('Create document is not attached to the canonical shell page id.');
  if (!/<a href="#main"[^>]*>Skip to Create choices<\/a>/.test(createHtml)) errors.push('Create document is missing its keyboard skip link.');
  if (!/id="eon-create-root"[^>]*aria-live="polite"/.test(createHtml)) errors.push('Create document is missing its polite live root.');
  if (!/create\/eon-create-hub\.js/.test(createHtml)) errors.push('Create document does not load the unified Create hub.');

  const shell = read('assets/js/eon-app-shell.js');
  if (!/href="\/create" aria-label="Open Create"/.test(shell)) errors.push('Global shell action does not lead directly to Create.');
  for (const href of W623E_ACCOUNT_DESTINATIONS) if (!shell.includes(`href="${href}"`)) errors.push(`Profile menu is missing ${href}.`);
  for (const legacy of ['Studio / Collection', 'Open Apps', "openShellUtilityModal('apps'", 'renderAppsPanel']) if (shell.includes(legacy)) errors.push(`Shell still exposes legacy launcher concept: ${legacy}.`);

  const marketPage = read('assets/js/market/eon-market-page.js');
  if (!marketPage.includes('Compatibility preview') || !marketPage.includes('href="/create"')) errors.push('Market compatibility page does not clearly hand new work to Create.');

  return Object.freeze({
    schema: W623E_SCHEMA,
    ok: errors.length === 0,
    errors: Object.freeze(errors),
    counts: Object.freeze({
      primaryNavigationItems: navIds.length,
      createModes: createIds.length,
      legacyAliasesRedirected: W623E_LEGACY_CREATE_ALIASES.length,
      accountDestinations: W623E_ACCOUNT_DESTINATIONS.length
    })
  });
}

const report = inspectW623eInformationArchitecture();
const reportDir = path.join(ROOT, 'reports', 'w623e-information-architecture');
fs.mkdirSync(reportDir, { recursive: true });
fs.writeFileSync(path.join(reportDir, 'receipt.json'), `${JSON.stringify(report, null, 2)}\n`);
if (!report.ok) {
  console.error(`[W623E] information architecture gate failed:\n- ${report.errors.join('\n- ')}`);
  process.exit(1);
}
console.log(`[W623E] information architecture gate passed (${report.counts.primaryNavigationItems} primary items, ${report.counts.createModes} Create modes, ${report.counts.legacyAliasesRedirected} redirected aliases).`);
