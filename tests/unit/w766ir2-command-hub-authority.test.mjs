import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import {
  EON_CITY_W737_DISCOVERIES,
  EON_CITY_W731_FUTURE_GATEWAYS,
  validateEonCityW731CommandHubContract
} from '../../assets/js/city/w731/eon-city-w731-command-hub-contract.js';
import {
  EON_CITY_W731_LAUNCH_ASSET_MANIFEST,
  validateEonCityW731LaunchAssetManifest
} from '../../assets/js/city/w731/eon-city-w731-launch-asset-manifest.js';
import { EON_CITY_W737_MISSIONS } from '../../assets/js/city/w737/eon-city-w737-missions.js';
import {
  EON_CITY_W748_DEFAULT_INTERACTIONS,
  validateEonCityW748InteractionRegistry
} from '../../assets/js/city/w748/eon-city-w748-interaction-registry.js';
import {
  createEonCityW766AReturnSnapshot,
  createEonCityW766AWorldModeController
} from '../../assets/js/city/w766/eon-city-w766a-world-mode-controller.js';

const runtimeSource = await readFile(new URL('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js', import.meta.url), 'utf8');
const cssSource = await readFile(new URL('../../assets/css/eon-city-play.css', import.meta.url), 'utf8');

test('W766IR2-A has one canonical Hub Expanse Gate and no Garden or duplicate Overlook authority', () => {
  assert.deepEqual(EON_CITY_W737_DISCOVERIES.map((entry) => entry.id), [
    'transit-overlook',
    'expanse-gate',
    'maintenance-relay'
  ]);
  const gate = EON_CITY_W737_DISCOVERIES.find((entry) => entry.id === 'expanse-gate');
  assert.equal(gate.label, 'Expanse Gate');
  assert.equal(gate.npc.action, 'Review Expanse entry');
  assert.equal(gate.position.x, 22);
  assert.equal(EON_CITY_W731_FUTURE_GATEWAYS.some((entry) => entry.id === 'north-gateway'), false);
  assert.equal(validateEonCityW731CommandHubContract().ok, true);

  assert.equal(EON_CITY_W731_LAUNCH_ASSET_MANIFEST.discoveryWorld.filter((entry) => entry.role === 'expanse-gate').length, 1);
  assert.equal(EON_CITY_W731_LAUNCH_ASSET_MANIFEST.discoveryWorld.some((entry) => ['archive-garden', 'expanse-overlook'].includes(entry.role)), false);
  assert.equal(validateEonCityW731LaunchAssetManifest().ok, true);
  assert.equal(EON_CITY_W737_MISSIONS.some((entry) => ['archive-garden', 'expanse-overlook'].includes(entry.discoveryId)), false);
});

test('W766IR2-A interaction registry is built from the canonical Gate and removes the stale sealed gateway', () => {
  const validation = validateEonCityW748InteractionRegistry();
  assert.equal(validation.ok, true, validation.errors.join(','));
  assert.equal(EON_CITY_W748_DEFAULT_INTERACTIONS.some((entry) => entry.id === 'support:sealed-expanse-gateway'), false);
  const gate = EON_CITY_W748_DEFAULT_INTERACTIONS.find((entry) => entry.id === 'discovery:expanse-gate');
  assert.equal(gate.primaryAction.label, 'Review Expanse entry');
  assert.match(gate.truthBoundary, /Enter Expanse and Cancel are separate explicit actions/);
  const relay = EON_CITY_W748_DEFAULT_INTERACTIONS.find((entry) => entry.id === 'discovery:maintenance-relay');
  assert.equal(relay.primaryAction.label, 'Open City Readiness');
  assert.match(relay.truthBoundary, /measured local readiness only/);
});

test('W766IR2-A world mode still requires separate explicit review, entry and cancel actions', () => {
  const controller = createEonCityW766AWorldModeController({ now: () => 100 });
  assert.equal(controller.review().ok, false);
  assert.equal(controller.review({ explicitUserAction: true }).state.mode, 'EXPANSE_ENTRY_REVIEW');
  assert.equal(controller.beginEntry({ explicitUserAction: true }).ok, false);
  assert.equal(controller.cancelReview({ explicitUserAction: true }).state.mode, 'COMMAND_HUB');

  controller.review({ explicitUserAction: true });
  const snapshot = createEonCityW766AReturnSnapshot({
    player: { x: 1, y: 0, z: 2, heading: 0 },
    camera: { alpha: 0, beta: 1, radius: 12, target: { x: 0, y: 1, z: 0 } }
  });
  assert.equal(controller.beginEntry({ snapshot, explicitUserAction: true }).state.mode, 'EXPANSE_LOADING');
});

test('W766IR2-A routes menu, physical interaction and mission guidance to one visible review dialog', () => {
  assert.match(runtimeSource, /data-eon-city-menu-open-world>Open Signal Frontier/);
  assert.match(runtimeSource, /else handoffFromMenu\('open-world-review', \(trigger\) => openExpanseReview\(trigger\)/);
  assert.match(runtimeSource, /handoffFromMenu\(`quick-\$\{action \|\| 'unknown'\}`/);
  assert.match(runtimeSource, /if \(discovery\.id === 'expanse-gate'\) return ui\?\.openExpanseReview/);
  assert.match(runtimeSource, /guideToDiscovery\('expanse-gate'\)/);
  assert.match(runtimeSource, /data-eon-city-expanse-enter>Enter Signal Frontier/);
  assert.match(runtimeSource, /data-eon-city-expanse-cancel>Cancel/);
  assert.match(runtimeSource, /onReviewExpanseGate/);
  assert.match(runtimeSource, /onEnterExpanse/);
  assert.match(runtimeSource, /onCancelExpanse/);
  assert.doesNotMatch(runtimeSource, /expanse-overlook/);
  assert.match(cssSource, /\.eon-city-expanse-review-dialog/);
});

test('W766IR2-A Relay opens measured City Readiness rather than an inspect-only fake repair', () => {
  assert.match(runtimeSource, /const openCityReadiness =/);
  assert.match(runtimeSource, /globalThis\.EON_CITY_RUNTIME_READINESS/);
  assert.match(runtimeSource, /No repair task is running automatically/);
  assert.match(runtimeSource, /discovery\.id === 'maintenance-relay'/);
});
