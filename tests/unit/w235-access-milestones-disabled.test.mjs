import assert from 'node:assert/strict';
import test from 'node:test';
import {
  EON_ACCESS_MILESTONES_ACTIVE,
  EON_ACCESS_MILESTONES_MODE,
  EON_ACCESS_MILESTONES_PREFERENCES_KEY,
  getAccessMilestoneKillSwitch,
  getAccessMilestonePublicStatus,
  readAccessMilestonePreferences,
  requestAccessMilestoneGrant,
  saveAccessMilestonePreferences,
  validateAccessMilestoneCandidate
} from '../../assets/js/access/access-milestones-registry.js';

class MemoryStorage {
  constructor() { this.rows = new Map(); }
  getItem(key) { return this.rows.has(String(key)) ? this.rows.get(String(key)) : null; }
  setItem(key, value) { this.rows.set(String(key), String(value)); }
}

test('W235 defines only non-financial, non-transferable candidate capabilities and keeps the kill switch engaged', () => {
  assert.equal(EON_ACCESS_MILESTONES_ACTIVE, false);
  assert.equal(EON_ACCESS_MILESTONES_MODE, 'disabled');
  assert.equal(getAccessMilestoneKillSwitch().engaged, true);
  assert.equal(getAccessMilestonePublicStatus().active, false);
  assert.equal(validateAccessMilestoneCandidate({ id: 'realm_cosmetic', durationDays: 31 }).ok, true);
  assert.equal(validateAccessMilestoneCandidate({ id: 'project_capacity_trial', durationDays: 15 }).ok, false);
  assert.equal(validateAccessMilestoneCandidate({ id: 'city_cosmetic', transferable: true }).ok, false);
  assert.equal(validateAccessMilestoneCandidate({ id: 'city_cosmetic', kind: 'crypto' }).ok, false);
});

test('W235 can preserve a non-sensitive disabled preference but cannot create a milestone grant', () => {
  const storage = new MemoryStorage();
  assert.equal(readAccessMilestonePreferences({ storage }).acknowledged, false);
  const saved = saveAccessMilestonePreferences({ acknowledged: true }, { storage, now: Date.UTC(2026, 5, 25) });
  assert.equal(saved.ok, true);
  assert.match(storage.getItem(EON_ACCESS_MILESTONES_PREFERENCES_KEY), /"mode":"disabled"/);
  const before = storage.getItem(EON_ACCESS_MILESTONES_PREFERENCES_KEY);
  const denied = requestAccessMilestoneGrant({ capabilityId: 'city_cosmetic' }, { storage });
  assert.equal(denied.ok, false);
  assert.equal(denied.reason, 'access-milestones-disabled');
  assert.equal(denied.storageUnchanged, true);
  assert.equal(storage.getItem(EON_ACCESS_MILESTONES_PREFERENCES_KEY), before);
});
