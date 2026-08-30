import assert from 'node:assert/strict';
import test from 'node:test';
import { clearEonCreatorPilotMeasurement, readEonCreatorPilotMeasurement, recordEonCreatorPilotEvent } from '../../assets/js/measurement/eon-creator-pilot-measurement.js';
import { inspectW398W399CreatorPilotMeasurement } from '../../scripts/w398-w399-creator-pilot-measurement-gate.mjs';

function memoryStorage() { const map = new Map(); return { getItem: (key) => map.get(key) || null, setItem: (key, value) => map.set(key, String(value)), removeItem: (key) => map.delete(key) }; }

test('W398/W399 local creator pilot diagnostics require opt-in and store counts only', () => {
  const storage = memoryStorage();
  const disabled = recordEonCreatorPilotEvent('share-pack-created', { enabled: false, storage });
  const enabled = recordEonCreatorPilotEvent('share-pack-created', { enabled: true, storage, now: 1 });
  assert.equal(disabled.ok, false);
  assert.equal(enabled.ok, true);
  assert.equal(readEonCreatorPilotMeasurement({ storage }).counts['share-pack-created'], 1);
  assert.equal(clearEonCreatorPilotMeasurement({ storage }), true);
});

test('W398/W399 static gate passes without remote analytics', () => {
  const report = inspectW398W399CreatorPilotMeasurement({ writeArtifact: false });
  assert.equal(report.status, 'pass');
  assert.match(report.limitations.join(' '), /No remote pilot analytics/i);
});
