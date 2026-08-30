#!/usr/bin/env node
/**
 * W217→R1 cumulative handover gate.
 *
 * This checks that a source snapshot contains every approved implementation
 * wave from the W217 masterplan through the R1 closure. It intentionally
 * verifies only source, tests, documentation and disabled-boundary evidence;
 * it does not claim browser/device evidence that must be captured externally.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const moduleDir = path.dirname(fileURLToPath(import.meta.url));
export const DEFAULT_ROOT = path.resolve(moduleDir, '..');

export const WAVE_REQUIREMENTS = Object.freeze([
  { wave: 'W217', purpose: 'Canonical route contract', files: ['docs/W217_PHASE1_CANONICAL_ROUTE_CONTRACT.md', 'tests/unit/w217-route-contract.test.mjs'], scripts: ['qa:w217-route-contract'] },
  { wave: 'W218', purpose: 'Chat-first shell', files: ['tests/unit/w218-chat-first-shell-v2.test.mjs'], scripts: ['qa:w218-chat-first-shell'] },
  { wave: 'W219', purpose: 'EONBOT and Local AI truth', files: ['tests/unit/w219-eonbot-local-ai-workspace.test.mjs'], scripts: ['qa:w219-eonbot-local-ai'] },
  { wave: 'W220', purpose: 'Local Market generation', files: ['docs/W220_MARKET_LOCAL_GENERATION_VERTICAL_SLICE.md', 'tests/unit/w220-market-generation-vertical-slice.test.mjs'], scripts: ['qa:w220-market-generation'] },
  { wave: 'W221', purpose: 'CityWorldState and 2D RPG', files: ['docs/W221_CITYWORLDSTATE_2D_RPG_VERTICAL_SLICE.md', 'tests/unit/w221-cityworldstate-2d-rpg.test.mjs'], scripts: ['qa:w221-cityworldstate-2d'] },
  { wave: 'W222', purpose: 'Private My Realm MVP', files: ['docs/W222_MY_REALM_MVP.md', 'tests/unit/w222-my-realm-mvp.test.mjs'], scripts: ['qa:w222-my-realm-mvp'] },
  { wave: 'W223', purpose: 'Invite and Share Center', files: ['docs/W223_INVITE_SHARE_CENTER.md', 'tests/unit/w223-invite-share-center.test.mjs'], scripts: ['qa:w223-invite-share-center'] },
  { wave: 'W224', purpose: 'Optional 3D parity', files: ['docs/W224_OPTIONAL_3D_PARITY.md', 'tests/unit/w224-cityworldstate-3d-parity.test.mjs'], scripts: ['qa:w224-cityworldstate-3d'] },
  { wave: 'W225', purpose: 'Account/catalog foundations', files: ['docs/W225_ACCOUNT_CATALOG_FOUNDATIONS.md', 'tests/unit/w225-account-catalog-foundations.test.mjs'], scripts: ['qa:w225-account-catalog-foundations'] },
  { wave: 'W226', purpose: 'Commercial decision gate', files: ['docs/W226_COMMERCIAL_DECISION_GATE.md', 'tests/unit/w226-commercial-decision-gate.test.mjs'], scripts: ['qa:w226-commercial-decision-gate'] },
  { wave: 'W227', purpose: 'Release certification and product truth', files: ['docs/W227_RELEASE_CERTIFICATION.md', 'tests/unit/w227-release-certification.test.mjs'], scripts: ['qa:w227-release-certification'] },
  { wave: 'W228', purpose: 'CEO re-audit and truth gates', files: ['docs/W228_CEO_GRUMPY_AUDIT.md', 'tests/unit/w228-ceo-red-team.test.mjs'], scripts: ['qa:w228-release-certification', 'qa:w228-ceo-red-team'] },
  { wave: 'W229', purpose: 'Persistent truthful Chat composer', files: ['tests/unit/w229-chat-composer-truth.test.mjs', 'HANDOFF/W229_PREPROOF_HOSTILE_AUDIT_2026-06-24/W229_HOSTILE_AUDIT_AND_CEO_DECISIONS.md'] },
  { wave: 'W230', purpose: 'EONBOT Command Hub', files: ['assets/js/chat/eonbot-command-hub.js', 'tests/unit/w230-eonbot-command-hub.test.mjs'], scripts: ['qa:w230-eonbot-command-hub'] },
  { wave: 'W231', purpose: '2D City flagship and active-surface fence', files: ['assets/js/city/eon-city-2d-engine.js', 'tests/unit/w231-eon-city-flagship.test.mjs', 'tests/unit/w231-active-surface-import-fence.test.mjs'], scripts: ['qa:w231-2d-city-flagship', 'qa:w231-active-surface-import-fence'] },
  { wave: 'W232', purpose: 'My Realm return loop and private receipts', files: ['assets/js/chat/eonbot-action-receipts.js', 'tests/unit/w232-my-realm-return-loop.test.mjs'], scripts: ['qa:w232-my-realm-return-loop'] },
  { wave: 'W233', purpose: 'Local AI and 3D device readiness', files: ['assets/js/local-ai/local-ai-page.js', 'assets/js/city/eon-city-3d-proof.js', 'tests/unit/w233-local-ai-3d-device-proof.test.mjs'], scripts: ['qa:w233-local-ai-3d-device-proof'] },
  { wave: 'W234', purpose: 'Read-only invite/D1 architecture audit', files: ['scripts/w234-referral-d1-readonly-audit.mjs', 'tests/unit/w234-referral-d1-readonly-audit.test.mjs'], scripts: ['qa:w234-referral-d1-readonly-audit'] },
  { wave: 'W235', purpose: 'Hard-disabled Access Milestones registry', files: ['assets/js/access/access-milestones-registry.js', 'tests/unit/w235-access-milestones-disabled.test.mjs'], scripts: ['qa:w235-access-milestones-disabled'] },
  { wave: 'W236', purpose: 'Access Milestone pilot no-go', files: ['config/access-milestone-pilot-gate.mjs', 'tests/unit/w236-w237-no-go.test.mjs'], scripts: ['qa:w236-access-milestone-pilot-no-go'] },
  { wave: 'W237', purpose: 'Sponsored Discovery disabled boundary', files: ['config/sponsored-discovery-policy.mjs', 'tests/unit/w236-w237-no-go.test.mjs'], scripts: ['qa:w237-sponsored-discovery-disabled'] },
  { wave: 'W238', purpose: 'Legacy value-system archive', files: ['archive/w238-retired-value-systems/MANIFEST.json', 'tests/unit/w238-legacy-consolidation.test.mjs'], scripts: ['qa:w238-legacy-consolidation'] },
  { wave: 'R1', purpose: 'External proof closure/runbook', files: ['HANDOFF/W234_W238_R1_CLOSURE_2026-06-25/R1_EXTERNAL_PROOF_BLOCKERS_AND_RUNBOOK.md', 'HANDOFF/W234_W238_R1_CLOSURE_2026-06-25/CERTIFICATION_RESULTS.md'] }
]);

export function verifyCumulativeHandoff(root = DEFAULT_ROOT, { strictSourceSnapshot = false } = {}) {
  const errors = [];
  const packageFile = path.join(root, 'package.json');
  let scripts = {};
  try {
    scripts = JSON.parse(fs.readFileSync(packageFile, 'utf8')).scripts || {};
  } catch (error) {
    errors.push(`Unable to read package.json: ${error.message}`);
  }

  const waves = WAVE_REQUIREMENTS.map((requirement) => {
    const missingFiles = requirement.files.filter((relative) => !fs.existsSync(path.join(root, relative)));
    const missingScripts = (requirement.scripts || []).filter((name) => typeof scripts[name] !== 'string');
    if (missingFiles.length || missingScripts.length) {
      errors.push(`${requirement.wave}: missing ${[...missingFiles, ...missingScripts.map((name) => `script:${name}`)].join(', ')}`);
    }
    return {
      wave: requirement.wave,
      purpose: requirement.purpose,
      files: requirement.files.length,
      scripts: (requirement.scripts || []).length,
      ok: !missingFiles.length && !missingScripts.length,
      missingFiles,
      missingScripts
    };
  });

  const forbiddenRoots = ['node_modules', 'dist'];
  const unexpectedBuildRoots = forbiddenRoots.filter((name) => fs.existsSync(path.join(root, name)));
  if (strictSourceSnapshot && unexpectedBuildRoots.length) errors.push(`Source snapshot contains excluded generated roots: ${unexpectedBuildRoots.join(', ')}`);

  return {
    schema: 'eonapp.w217-r1-cumulative-handoff.v1',
    ok: errors.length === 0,
    waveCount: WAVE_REQUIREMENTS.length,
    waves,
    strictSourceSnapshot,
    generatedRootsPresent: unexpectedBuildRoots,
    errors
  };
}

function main() {
  const strictSourceSnapshot = process.argv.includes('--strict-source-snapshot');
  const result = verifyCumulativeHandoff(DEFAULT_ROOT, { strictSourceSnapshot });
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exitCode = 1;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) main();
