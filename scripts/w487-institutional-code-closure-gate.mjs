#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { W487_INSTITUTIONAL_CODE_CLOSURE, W487_PRIMARY_HIERARCHY, validateW487InstitutionalCodeClosureContract } from '../config/w487-institutional-code-closure-contract.mjs';
import { EON_COMMAND_DECK_CARDS } from '../assets/js/city/eon-city-command-deck.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const exists = (relativePath) => fs.existsSync(path.join(root, relativePath));
const assert = (condition, message, failures) => { if (!condition) failures.push(message); };

export function inspectW487InstitutionalCodeClosure({ writeArtifact = false } = {}) {
  const failures = [...validateW487InstitutionalCodeClosureContract()];
  const shell = read('assets/js/eon-app-shell.js');
  const navigation = read('assets/js/shell/eon-shell-navigation.js');
  const home = read('index.html');
  const station = read('assets/js/eon-city-play-station.js');
  const cityCss = read('assets/css/eon-city-play.css');
  const rewards = read('assets/js/access/rewards-status-page.js');
  const legacyGate = read('scripts/w238-legacy-consolidation-gate.mjs');
  const accessGate = read('scripts/w235-access-milestones-disabled-gate.mjs');

  for (const entry of W487_PRIMARY_HIERARCHY) {
    const currentSignature = `id: '${entry.id}', href: '${entry.href}', label: '${entry.label}'`;
    const legacyMarker = `id: '${entry.id}'`;
    const routeStillOwned = navigation.includes(`'${entry.href}'`) || navigation.includes(`href: '${entry.href}'`);
    assert(
      navigation.includes(currentSignature) || (navigation.includes(legacyMarker) && routeStillOwned),
      `Primary hierarchy route is no longer represented by the current or compatibility navigation authority: ${entry.label}.`,
      failures
    );
  }
  assert(navigation.includes("id: 'create', href: '/create', label: 'Create'"), 'Current compact shell must retain Create as the beginner-first creation authority.', failures);
  assert(navigation.includes("forge: Object.freeze({ label: 'EON Forge', navigationId: 'create' })"), 'Forge must remain reachable through the Create authority.', failures);
  assert(navigation.includes("vault: Object.freeze({ label: 'Vault', navigationId: '' })"), 'Vault must remain a private settings surface rather than disappearing.', failures);
  assert(shell.includes('eon-shell-navigation'), 'Shell must bind the focused navigation contract.', failures);
  assert(navigation.includes("label: 'Workspace'"), 'Shell must group primary destinations as Workspace.', failures);
  assert(navigation.includes("label: 'Utilities'"), 'Shell must keep non-primary tools in Utilities.', failures);
  assert(navigation.includes("id: 'search', action: 'search', label: 'Search'"), 'Current shell must retain the local chat search action.', failures);
  assert(shell.includes('placeholder="Search local chat titles"'), 'Search must be honestly scoped to local chat titles.', failures);
  assert(!navigation.includes("label: 'Chats'"), 'Legacy competing Chats label remains in primary navigation.', failures);
  assert(!navigation.includes("label: 'Apps'"), 'Legacy competing Apps label remains in primary navigation.', failures);
  assert(home.includes('opening Create, Projects, Library, EON City or your private settings only when you choose'), 'Root narrative does not state the current unified workspace hierarchy.', failures);
  assert(home.includes('data-eonbot-product-hierarchy'), 'Root hierarchy marker is missing.', failures);

  assert(station.includes("root.dataset.eonCityFirstFrame = 'pending'"), 'City must record a pending first-frame state.', failures);
  assert(station.includes('data-eon-city-first-frame-shield'), 'City first-frame shield markup is missing.', failures);
  assert(station.includes("root.dataset.eonCityFirstFrame = 'ready'"), 'City must record a ready first-frame state.', failures);
  assert(station.includes("root.classList.add('eon-city-first-frame-ready')"), 'City must dismiss the first-frame shield after rendering.', failures);
  assert(cityCss.includes('.eon-city-first-frame-pending .eon-play-canvas-host { opacity: 0; }'), 'City must suppress partial canvas presentation while the first frame is pending.', failures);
  assert(cityCss.includes('grid-template-columns: repeat(auto-fit, minmax(min(100%, 15rem), 1fr));'), 'Command Deck needs auto-fit containment for compact desktop widths.', failures);
  assert(cityCss.includes('overflow-wrap: anywhere;'), 'Command Deck copy must wrap rather than collide.', failures);
  assert(EON_COMMAND_DECK_CARDS.every((card) => String(card.detail || '').length <= 58), 'Command Deck card copy exceeds the W487 concise readability budget.', failures);

  assert(legacyGate.includes("status === 'archived-not-production-input'"), 'Legacy archive fence must remain explicit.', failures);
  assert(accessGate.includes("EON_ACCESS_MILESTONES_ACTIVE === false"), 'Access Milestones must remain source-disabled.', failures);
  assert(/Access Milestones are not active/.test(rewards), 'Rewards surface must retain transparent disabled-state copy.', failures);

  const report = {
    schema: W487_INSTITUTIONAL_CODE_CLOSURE.schema,
    status: failures.length ? 'fail' : 'pass',
    sourceImplementationScore: W487_INSTITUTIONAL_CODE_CLOSURE.sourceImplementationScore,
    sourceImplementationScoreMeaning: W487_INSTITUTIONAL_CODE_CLOSURE.sourceImplementationScoreMeaning,
    primaryHierarchy: W487_PRIMARY_HIERARCHY,
    cityCommandDeck: {
      cardCount: EON_COMMAND_DECK_CARDS.length,
      maxDetailLength: Math.max(...EON_COMMAND_DECK_CARDS.map((card) => String(card.detail || '').length)),
      firstFrameShield: station.includes('data-eon-city-first-frame-shield'),
      overflowContainment: cityCss.includes('overflow-wrap: anywhere;')
    },
    capabilityTruth: W487_INSTITUTIONAL_CODE_CLOSURE.requiredSourceControls,
    releaseEvidenceStillRequired: W487_INSTITUTIONAL_CODE_CLOSURE.releaseEvidenceStillRequired,
    failures
  };
  if (writeArtifact) {
    const out = path.join(root, 'release-evidence', 'W487_INSTITUTIONAL_CODE_CLOSURE_2026-07-02');
    fs.mkdirSync(out, { recursive: true });
    fs.writeFileSync(path.join(out, 'W487_SOURCE_GATE_REPORT.json'), `${JSON.stringify(report, null, 2)}\n`);
  }
  return report;
}

const direct = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (direct) {
  const report = inspectW487InstitutionalCodeClosure({ writeArtifact: true });
  if (report.status !== 'pass') {
    console.error('[W487] Institutional code-closure gate failed:');
    for (const failure of report.failures) console.error(`- ${failure}`);
    process.exitCode = 1;
  } else {
    console.log(`[W487] PASS: source hierarchy, first-frame shield, concise Command Deck, archive fence and disabled capability truth are intact. Source-only score: ${report.sourceImplementationScore}/100.`);
  }
}
