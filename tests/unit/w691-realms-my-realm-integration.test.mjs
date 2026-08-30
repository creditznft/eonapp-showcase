import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import {
  EON_CITY_W691_FINAL_REALM_IDENTITIES,
  buildEonCityW691MyRealmPlan,
  getEonCityW691RealmIdentity,
  projectEonCityW691RealmDefinition,
  validateEonCityW691RealmsMyRealmPlan,
  getEonCityW691Truth
} from '../../assets/js/city/w691/eon-city-w691-realms-my-realm-integration.js';
import { buildEonCityLivingNexusRealmPlan, getEonCityLivingNexusRealmCatalog } from '../../assets/js/city/eon-city-living-nexus-realms.js';

test('W691 projects all six approved Realm identities while preserving stable technical ids', () => {
  const catalog = getEonCityLivingNexusRealmCatalog();
  assert.equal(catalog.length, 6);
  assert.deepEqual(catalog.map((entry) => entry.label), [
    'Archive Noir', 'Living Bio-City', 'Golden Sovereign Realm', 'Oceanic Light', 'Path of Time', 'EONBOT Temple'
  ]);
  assert.deepEqual(catalog.map((entry) => entry.id), [
    'archive-noir', 'living-bio-city', 'golden-sovereign', 'forge-depths', 'orbital-white-city', 'nexus-ruins'
  ]);
  assert.equal(new Set(Object.values(EON_CITY_W691_FINAL_REALM_IDENTITIES).map((entry) => entry.productId)).size, 6);
  for (const realm of catalog) {
    assert.equal(realm.stableTechnicalIdPreserved, true);
    assert.ok(realm.productIdentityId);
    assert.ok(realm.productivityRole);
    assert.ok(realm.reflectionZoneId);
  }
});

test('W691 Realm plans retain productive native routes and final identities', () => {
  for (const id of Object.keys(EON_CITY_W691_FINAL_REALM_IDENTITIES)) {
    const plan = buildEonCityLivingNexusRealmPlan(id, { storage: null, quality: 'balanced' });
    const identity = getEonCityW691RealmIdentity(id);
    assert.equal(plan.id, id);
    assert.equal(plan.label, identity.label);
    assert.equal(plan.productIdentityId, identity.productId);
    assert.equal(plan.productivityRole, identity.productivityRole);
    assert.equal(plan.stableTechnicalIdPreserved, true);
    assert.ok(plan.mission.route.startsWith('/'));
    assert.equal(plan.requiresSeparateNativeRouteConfirmation, true);
  }
});

test('W691 My Realm places verified transformations into six productive reflection zones', () => {
  const transformations = [
    { id: 'archive-vault-sealed', destination: 'my-realm', location: 'archive-sanctum', label: 'Archive sealed' },
    { id: 'device-lab-signal-live', destination: 'core', location: 'device-lab', label: 'Device Lab verified' },
    { id: 'core-command-awakened', destination: 'core', location: 'orientation-hall', label: 'Orientation complete' },
    { id: 'project-route-restored', destination: 'core', location: 'project-district', label: 'Project route restored' },
    { id: 'creator-atrium-gallery-ready', destination: 'core', location: 'creator-atrium', label: 'Creator gallery ready' },
    { id: 'automation-rail-planned', destination: 'expanse', location: 'automation-railworks', label: 'Automation rail planned' }
  ];
  const plan = buildEonCityW691MyRealmPlan({ transformations, selectedTransformationId: 'project-route-restored' });
  const validation = validateEonCityW691RealmsMyRealmPlan(plan);
  assert.equal(validation.ok, true, validation.errors.join(' | '));
  assert.equal(plan.zones.length, 6);
  assert.equal(plan.placements.length, 6);
  assert.equal(plan.emptyState, false);
  assert.equal(plan.selectedTransformationId, 'project-route-restored');
  assert.equal(plan.zones.filter((entry) => entry.dormant).length, 0);
  assert.ok(plan.zones.every((entry) => entry.nativeRoute.startsWith('/') && entry.reviewFirst));
  assert.ok(plan.placements.every((entry) => entry.verifiedBoundedReceipt && !entry.privateContentStored));
});

test('W691 empty My Realm stays truthful and never invents completed work', () => {
  const plan = buildEonCityW691MyRealmPlan({ transformations: [] });
  assert.equal(validateEonCityW691RealmsMyRealmPlan(plan).ok, true);
  assert.equal(plan.emptyState, true);
  assert.equal(plan.transformations.length, 0);
  assert.ok(plan.zones.every((entry) => entry.dormant));
  assert.match(plan.emptyStateLabel, /Verified outcomes/);
});

test('W691 one-scene renderer consumes the integrated My Realm layout', () => {
  const source = fs.readFileSync(new URL('../../assets/js/city/eon-city-living-nexus-babylon-runtime.js', import.meta.url), 'utf8');
  assert.match(source, /buildEonCityW691MyRealmPlan/);
  assert.match(source, /w691-my-realm-productivity-zone/);
  assert.match(source, /verifiedBoundedReceipt: true/);
  assert.match(source, /automaticExecution: false/);
});

test('W691 truth remains private, review-first and non-executing', () => {
  const truth = getEonCityW691Truth();
  assert.equal(truth.approvedRealmIdentitiesProjected, true);
  assert.equal(truth.stableTechnicalIdsPreserved, true);
  assert.equal(truth.verifiedOutcomesShapeMyRealm, true);
  assert.equal(truth.privatePayloadsNeverStored, true);
  assert.equal(truth.automaticNavigation, false);
  assert.equal(truth.automaticExecution, false);
  const projected = projectEonCityW691RealmDefinition({ id: 'nexus-ruins', label: 'legacy', privateContentStored: false });
  assert.equal(projected.label, 'EONBOT Temple');
  assert.equal(projected.id, 'nexus-ruins');
});
