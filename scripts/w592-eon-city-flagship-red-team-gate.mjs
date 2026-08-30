#!/usr/bin/env node
/** W592 source gate — Flagship red-team UX, evidence, and local-AI truth boundary. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(ROOT, relative), 'utf8');
const checks = [];
const check = (id, condition, message, dimension, points) => checks.push(Object.freeze({ id, ok: Boolean(condition), message, dimension, points }));

const station = read('assets/js/eon-city-play-station.js');
const firstRun = read('assets/js/city/eon-city-first-run.js');
const deck = read('assets/js/city/eon-city-command-deck.js');
const css = read('assets/css/eon-city-play.css');
const proof = read('scripts/gpt55-ai-agent-deep-proof.mjs');
const benchmark = read('scripts/w592-local-ai-benchmark.mjs');
const rehearsal = read('e2e/w592-eon-city-flagship-rehearsal.spec.js');
const evidenceAudit = read('scripts/w592-evidence-secret-audit.mjs');
const ignore = read('.gitignore');
const canonical = read('eoncity.html');

check('canonical-city-stays-access-controlled', canonical.includes('/assets/js/city/eon-city-access-station.js') && !canonical.includes('/assets/js/eon-city-play-station.js'), 'Canonical City must retain the deferred access station rather than booting the renderer publicly.', 'access-and-trust', 20);
check('first-run-has-local-review-contract', firstRun.includes("EON_CITY_FIRST_RUN_REVIEW_SCHEMA = 'eon.city.first-run.review.w592.v1'") && firstRun.includes('confirmationRequired: true') && firstRun.includes('autoNavigation: false'), 'First-run choices must produce a local review with a visible second confirmation.', 'route-safety', 20);
check('first-run-cannot-direct-link', station.includes('data-eon-play-first-run-choices') && station.includes('data-eon-play-confirm-first-run-path') && !station.includes('EON_CITY_FIRST_RUN_PATHS.map((path) => `<a href="${escapeHtml(path.route)}" data-eon-play-first-run-path'), 'First-run cards must not be direct native-route anchors.', 'route-safety', 20);
check('direct-hud-remains-four-actions', station.includes("const directHudActions = '<button type=\"button\" data-eon-play-open-command-room>Command Room</button><button type=\"button\" data-eon-play-open-eonbot>EONBOT</button><button type=\"button\" data-eon-play-open-travel-map>Districts</button><button type=\"button\" data-eon-play-open-controls>Menu</button>';"), 'Direct City HUD must remain exactly four named actions.', 'entry-clarity', 20);
check('menu-is-grouped-by-job-to-be-done', ['explore', 'movement', 'work', 'appearance', 'trust'].every((id) => station.includes(`data-eon-play-menu-section="${id}"`)), 'Menu must have five clear progressive-disclosure groups.', 'entry-clarity', 20);
check('primary-command-deck-is-five-stations', deck.includes("EON_COMMAND_DECK_PRIMARY_CARD_IDS = freeze(['eonbot', 'forge', 'projects', 'library', 'vault'])") && station.includes('getCommandDeckPrimaryCards()') && station.includes('getCommandDeckPrimarySummary()'), 'Command Deck must present five priority work stations while keeping legacy deck compatibility source intact.', 'decision-hierarchy', 15);
check('menu-and-review-css-is-responsive', css.includes('.eon-play-menu-group') && css.includes('.eon-play-first-run-review') && css.includes('.eon-play-command-deck-primary-grid') && css.includes('@media(max-width:760px)'), 'W592 City controls need responsive grouped-menu, review, and primary-deck presentation.', 'decision-hierarchy', 15);
check('operator-ai-proof-never-persists-key-samples', proof.includes('keySamplesPersisted: false') && proof.includes('rawSecretValuesPersisted: false') && !proof.includes('Redacted sample') && !proof.includes('sample: present'), 'AI proof must record key presence only, never key fragments or samples.', 'evidence-security', 15);
check('operator-evidence-is-ignored', ignore.includes('reports/') && ignore.includes('.eon-city-auth-state*.json') && ignore.includes('*.storage-state.json'), 'Generated AI/gameplay evidence and browser state must be ignored by default.', 'evidence-security', 15);
check('evidence-secret-audit-is-explicit', evidenceAudit.includes("EON_EVIDENCE_SECRET_AUDIT === '1' && args.includes('--confirm-local')") && evidenceAudit.includes('secretValuesPersisted: false') && evidenceAudit.includes('matchedKeys'), 'Evidence handoff needs an explicit exact-value secret scan that reports variable names, not values.', 'evidence-security', 15);
check('local-benchmark-is-opt-in-loopback-only', benchmark.includes("EON_LOCAL_AI_BENCHMARK === '1' && has('--confirm-local')") && benchmark.includes('loopbackOnly: true') && benchmark.includes('downloadsPerformed: false') && benchmark.includes('mediaAdaptersClaimedActive: false'), 'Local benchmark must be explicit, loopback-only, download-free, and must not claim EONAPP media adapter integration.', 'local-ai-truth', 15);
check('high-load-media-is-doubly-opt-in', benchmark.includes("EON_LOCAL_IMAGE_BENCHMARK === '1' && process.env.EON_LOCAL_MEDIA_ALLOW_HIGH_LOAD === '1'") && benchmark.includes("EON_LOCAL_VIDEO_BENCHMARK === '1' && process.env.EON_LOCAL_MEDIA_ALLOW_HIGH_LOAD === '1'") && benchmark.includes('requiredFreeMemoryMb'), 'Image/video local workflows need explicit high-load opt-in and VRAM eligibility checks.', 'local-ai-truth', 15);
check('preview-rehearsal-never-confirms-actions', rehearsal.includes("EON_CITY_FINAL_REHEARSAL === '1'") && rehearsal.includes('EON_CITY_AUTH_STORAGE_STATE') && rehearsal.includes('automaticConfirmationUsed: false') && !rehearsal.includes("locator('[data-eon-play-confirm-first-run-path]').click"), 'Final preview rehearsal must use human-created auth state and may review but never confirm native routes.', 'test-integrity', 15);
check('guest-lane-asserts-renderer-boundary', rehearsal.includes("heavyRendererVisible") && rehearsal.includes("expect(record.heavyRendererVisible).toBe(false)"), 'Guest rehearsal must prove heavy renderer remains absent before access.', 'test-integrity', 15);

const dimensions = Object.freeze([
  Object.freeze({ id: 'entry-clarity', max: 20 }),
  Object.freeze({ id: 'route-safety', max: 20 }),
  Object.freeze({ id: 'decision-hierarchy', max: 15 }),
  Object.freeze({ id: 'access-and-trust', max: 15 }),
  Object.freeze({ id: 'evidence-security', max: 10 }),
  Object.freeze({ id: 'local-ai-truth', max: 10 }),
  Object.freeze({ id: 'test-integrity', max: 10 })
]);
const dimensionScores = dimensions.map((dimension) => {
  const relevant = checks.filter((entry) => entry.dimension === dimension.id);
  return Object.freeze({ id: dimension.id, score: relevant.every((entry) => entry.ok) ? dimension.max : 0, max: dimension.max, checks: relevant.map((entry) => entry.id) });
});
const total = dimensionScores.reduce((sum, entry) => sum + entry.score, 0);
const max = dimensionScores.reduce((sum, entry) => sum + entry.max, 0);
const failed = checks.filter((entry) => !entry.ok);
const receipt = Object.freeze({
  schema: 'eon.city.flagship-red-team.gate.w592.v1',
  ok: failed.length === 0,
  sourceDesignScore: { score: total, max, label: 'Static source-design contract only — not visual, browser, device, auth, AI, security, or launch certification.' },
  dimensions: dimensionScores,
  checks,
  sourceOnly: true,
  noProductionClaim: true
});
console.log(JSON.stringify(receipt, null, 2));
if (failed.length) process.exitCode = 1;
