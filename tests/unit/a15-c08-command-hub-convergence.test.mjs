import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildEonCityC08CommandHubAudit,
  validateEonCityC08CommandHubConvergence,
  getEonCityC08CommandHubTruth
} from '../../assets/js/city/c08/eon-city-c08-command-hub-convergence.js';
import { listEonWorkSurfaceDefinitions } from '../../assets/js/contracts/work-surface/eon-work-surface-registry.js';

const audit = buildEonCityC08CommandHubAudit();

test('C08 covers all ten stations and three outside discoveries', () => {
  assert.equal(audit.stationCount, 10);
  assert.equal(audit.discoveryCount, 3);
  assert.equal(audit.stations.every((station) => station.interactionParts.length === 3), true);
  assert.equal(audit.stations.every((station) => station.interactionParts.every((part) => part.present)), true);
});

test('C08 every station opens one maintained work surface', () => {
  const surfaces = new Set(listEonWorkSurfaceDefinitions().map((entry) => entry.id));
  assert.equal(audit.stations.every((station) => surfaces.has(station.surface)), true);
  assert.equal(audit.stations.every((station) => station.interactionParts.every((part) => part.actionKind !== 'open' || surfaces.has(part.surface))), true);
});

test('C08 every visible support object is interactive or explicitly unavailable', () => {
  assert.equal(audit.supportObjects.length > 0, true);
  assert.equal(audit.supportObjects.every((entry) => entry.declaredInteractive || entry.declaredUnavailable), true);
  assert.equal(audit.supportObjects.every((entry) => entry.label && entry.purpose && entry.accessibilityLabel && entry.truthBoundary), true);
});

test('C08 discoveries remain explicit and never auto-navigate', () => {
  assert.equal(audit.discoveries.every((entry) => entry.present), true);
  assert.equal(audit.discoveries.every((entry) => entry.explicitUserActionRequired), true);
  assert.equal(audit.discoveries.every((entry) => !entry.automaticNavigation), true);
  assert.equal(audit.discoveries.some((entry) => entry.id === 'expanse-gate'), true);
});

test('C08 Living Nexus remains privacy projected and non-executing', () => {
  assert.equal(audit.nexus.privacyProjected, true);
  assert.equal(audit.nexus.rawConversationTextRead, false);
  assert.equal(audit.nexus.rawProjectContentRead, false);
  assert.equal(audit.nexus.startsAiWork, false);
  assert.equal(audit.nexus.startsVoiceCapture, false);
  assert.equal(audit.nexus.autoNavigation, false);
  assert.equal(audit.nexus.autoApproval, false);
  assert.equal(audit.nexus.ownsRenderLoop, false);
});

test('C08 source authority has no dead label or route findings', () => {
  const result = validateEonCityC08CommandHubConvergence(audit);
  assert.equal(result.ok, true, result.errors.join(','));
  const truth = getEonCityC08CommandHubTruth();
  assert.equal(truth.everyStationMaintained, true);
  assert.equal(truth.everyObjectClassified, true);
  assert.equal(truth.deadLabelsOrRoutes, 0);
  assert.equal(truth.browserEvidenceRequired, true);
});
