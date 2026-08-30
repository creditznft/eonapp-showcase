#!/usr/bin/env node
/** W362 source gate: App Deck, action taxonomy, safe City and Automation handoffs. */
import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getRouteRow, renderCloudflareRedirects } from '../config/route-contract.mjs';
import {
  EON_APP_DECK_CATEGORY_IDS,
  EON_APP_DECK_W362_BASE_CATEGORY_IDS,
  getEonAppDeckTruth,
  listEonAppDeckCards,
  validateEonAppDeckCatalog
} from '../assets/js/apps/eon-app-deck-catalog.js';
import {
  EON_ACTION_CLASS_IDS,
  getEonActionTaxonomyTruth,
  validateEonActionTaxonomy
} from '../assets/js/automation/eon-action-taxonomy.js';
import { CITY_MODE_IDS, CITY_MODE_ROUTES } from '../assets/js/contracts/city/city-mode-transition.js';
import {
  W362_APP_DECK_ACTION_TAXONOMY_CONTRACT,
  validateW362AppDeckActionTaxonomyContract
} from '../config/w362-app-deck-action-taxonomy-contract.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => readFileSync(path.join(root, relative), 'utf8');
const ensure = (condition, message) => assert.equal(Boolean(condition), true, message);

export function inspectW362AppDeckActionTaxonomy() {
  const checks = [];
  const check = (id, condition, detail) => {
    checks.push({ id, pass: Boolean(condition), detail });
    ensure(condition, `${id}: ${detail}`);
  };
  const appPage = read('assets/js/apps/eon-app-deck-page.js');
  const automationPage = read('assets/js/eon-automations-page.js');
  const shell = read('assets/js/eon-app-shell.js');
  const shellNavigation = read('assets/js/shell/eon-shell-navigation.js');
  const portal = read('assets/js/eon-city-portal.js');
  const redirects = read('_redirects');
  const publicRedirects = read('public/_redirects');

  check('contract-valid', validateW362AppDeckActionTaxonomyContract().length === 0, 'W362 contract has no internal violations');
  check('catalog-valid', validateEonAppDeckCatalog().length === 0, 'App Deck catalog has no invalid card, action reference, or commercial drift');
  check('taxonomy-valid', validateEonActionTaxonomy().length === 0, 'canonical action taxonomy has no safety drift');
  check('w362-base-categories-retained', JSON.stringify(EON_APP_DECK_W362_BASE_CATEGORY_IDS) === JSON.stringify(['workrooms', 'crew', 'connections', 'blueprints']) && EON_APP_DECK_W362_BASE_CATEGORY_IDS.every((id) => EON_APP_DECK_CATEGORY_IDS.includes(id)), 'W362 historical base categories remain present in the expanded App Deck');
  check('seven-actions', JSON.stringify(EON_ACTION_CLASS_IDS) === JSON.stringify(['read', 'draft', 'write', 'publish', 'spend', 'delete', 'admin']), 'action taxonomy retains the locked order');
  for (const category of EON_APP_DECK_CATEGORY_IDS) {
    check(`cards-${category}`, listEonAppDeckCards(category).length >= 4, `${category} has at least four curated cards`);
  }
  check('apps-route', getRouteRow('/apps')?.file === 'apps.html', 'App Deck is a canonical clean route');
  check('apps-city-mode', CITY_MODE_IDS.includes('apps') && CITY_MODE_ROUTES.apps === '/apps', 'App Deck participates in the shared City mode map');
  check(
    'shell-app-surface',
    /PATH_TO_PAGE = Object\.freeze\(\{[\s\S]*'\/apps': 'forge'[\s\S]*'\/apps\.html': 'forge'/.test(shellNavigation)
      && !/label: 'Apps'/.test(shellNavigation)
      && /data-eon-shell-open-apps/.test(shell)
      && /headings = \{ profile: 'Profile', settings: 'Settings', apps: 'Forge' \}/.test(shell),
    'application shell keeps /apps reachable as a Forge utility surface without restoring Apps as a competing primary identity'
  );
  check('portal-app-link', /href="\/apps"/.test(portal), 'City Portal exposes the App Deck handoff');
  check('app-page-local-handoff', /createEonAppDeckLaunchIntent/.test(appPage) && /window\.location\.assign\('\/chat\?new=1'\)/.test(appPage), 'Workrooms and Crew use a visible foreground Chat handoff');
  check('blueprint-user-confirmation', /requiresConfirmationBeforeDraftSave/.test(read('assets/js/apps/eon-app-deck-catalog.js')) && /Create safe plan/.test(automationPage), 'Blueprint selection cannot save a workflow without a later user click');
  check('no-app-deck-network', !/\b(fetch|XMLHttpRequest|WebSocket|sendBeacon|navigator\.sendBeacon)\b/.test(appPage), 'App Deck page does not call a network or background execution API');
  check('no-oauth-or-credential-implementation', !/client_secret|access_token|refresh_token|authorization:\s*bearer|oauth[_-]?callback/i.test(read('assets/js/apps/eon-app-deck-catalog.js')), 'App Deck catalog does not implement OAuth tokens or credential collection');
  check('automation-taxonomy-visible', /renderActionTaxonomy/.test(automationPage) && /all workflow execution remains local planning and simulation only/.test(automationPage), 'Automations exposes taxonomy and current execution truth');
  check('redirects-sync', redirects === renderCloudflareRedirects() && publicRedirects === renderCloudflareRedirects(), 'generated Cloudflare redirect files remain in sync with route contract');

  const truth = getEonAppDeckTruth();
  const actionTruth = getEonActionTaxonomyTruth();
  check('truth-boundaries', truth.neverDoes.includes('connects an external account') && actionTruth.externalExecutionActive === false, 'runtime truth keeps connections and execution disabled');

  return Object.freeze({
    wave: W362_APP_DECK_ACTION_TAXONOMY_CONTRACT.wave,
    status: 'pass',
    checkCount: checks.length,
    checks,
    categories: [...EON_APP_DECK_CATEGORY_IDS],
    actionClasses: [...EON_ACTION_CLASS_IDS],
    limitations: Object.freeze([
      'Static source and unit verification only.',
      'No OAuth, Google Login, provider request, external account, Cloudflare deployment, live route probe, browser screenshot, scheduler, background runner, payment, or merchant operation was performed.'
    ])
  });
}

export function runW362AppDeckActionTaxonomyGate({ writeArtifact = true } = {}) {
  const result = inspectW362AppDeckActionTaxonomy();
  if (writeArtifact) {
    const directory = path.join(root, 'artifacts', 'w362-app-deck-action-taxonomy-gate');
    mkdirSync(directory, { recursive: true });
    writeFileSync(path.join(directory, 'stats.json'), `${JSON.stringify(result, null, 2)}\n`);
  }
  return result;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = runW362AppDeckActionTaxonomyGate();
  process.stdout.write(`W362 App Deck + action taxonomy gate passed (${result.checkCount}/${result.checkCount}).\n`);
}
