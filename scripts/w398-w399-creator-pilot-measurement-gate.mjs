#!/usr/bin/env node
import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { W398_W399_CREATOR_PILOT_MEASUREMENT_CONTRACT, validateW398W399CreatorPilotMeasurementContract } from '../config/w398-w399-creator-pilot-measurement-contract.mjs';
import { getEonCreatorPilotMeasurementTruth, recordEonCreatorPilotEvent } from '../assets/js/measurement/eon-creator-pilot-measurement.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => readFileSync(path.join(root, relative), 'utf8');
const ensure = (value, message) => assert.equal(Boolean(value), true, message);

export function inspectW398W399CreatorPilotMeasurement() {
  const checks = [];
  const check = (id, value, detail) => { checks.push({ id, pass: Boolean(value), detail }); ensure(value, `${id}: ${detail}`); };
  const truth = getEonCreatorPilotMeasurementTruth();
  const source = read('assets/js/measurement/eon-creator-pilot-measurement.js');
  const disabled = recordEonCreatorPilotEvent('share-pack-created', { enabled: false, storage: { getItem: () => null, setItem: () => { throw new Error('should-not-write'); } } });
  check('contract-valid', validateW398W399CreatorPilotMeasurementContract().length === 0, 'Creator pilot measurement contract has no internal violations');
  check('local-opt-in-only', truth.localOnly === true && truth.defaultEnabled === false && truth.remoteTransport === false, 'Measurement defaults to local disabled diagnostics');
  check('no-write-when-disabled', disabled.ok === false && disabled.reason === 'local-measurement-disabled', 'No local count writes occur without explicit opt-in');
  check('no-content-or-link-fields', truth.contentStored === false && truth.urlsStored === false && truth.referralStored === false && truth.accountStored === false, 'Measurement stores no content, URL, referral or account field');
  check('no-network', !/fetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon|navigator\.share/.test(source), 'Measurement module has no network or sharing effect');
  return Object.freeze({ schema: 'eonapp.w398-w399.creator-pilot-measurement-gate.v1', status: 'pass', sourceOnly: true, checkCount: checks.length, checks: Object.freeze(checks), limitations: Object.freeze(['No remote pilot analytics, experiment assignment, creator ranking, referral attribution, reach claim or conversion reporting is enabled.']) });
}
export function runW398W399CreatorPilotMeasurementGate({ writeArtifact = true } = {}) { const result = inspectW398W399CreatorPilotMeasurement(); if (writeArtifact) { const dir = path.join(root, 'artifacts', 'w398-w399-creator-pilot-measurement-gate'); mkdirSync(dir, { recursive: true }); writeFileSync(path.join(dir, 'stats.json'), `${JSON.stringify(result, null, 2)}\n`); } return result; }
if (import.meta.url === `file://${process.argv[1]}`) { const result = runW398W399CreatorPilotMeasurementGate(); process.stdout.write(`W398/W399 Creator Pilot Measurement gate passed (${result.checkCount}/${result.checkCount}).\n`); }
