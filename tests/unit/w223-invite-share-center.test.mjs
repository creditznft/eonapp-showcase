import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  SHARE_CAMPAIGN_INTENT_SCHEMA,
  SHARE_CENTER_TARGETS,
  SHARE_DRAFTS_SCHEMA,
  createShareCenterDraft,
  listShareDrafts,
  readShareCampaignIntent,
  saveShareCampaignIntent,
  saveShareDraft
} from '../../assets/js/utils/eon-share-sheet.js';
import { createMyRealmState } from '../../assets/js/realm/realm-state.js';
import { buildLocalEncryptedExportPayload, restoreLocalEncryptedExportPayload } from '../../assets/js/local-first/eon-local-encrypted-export.js';
import { verifySignedShareToken } from '../../assets/js/utils/signed-share-link.js';
import { installStoragePolyfill } from './helpers/import-browser-module.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

class MemoryStorage {
  constructor(seed = {}) { this.data = { ...seed }; }
  getItem(key) { return Object.prototype.hasOwnProperty.call(this.data, key) ? this.data[key] : null; }
  setItem(key, value) { this.data[key] = String(value); }
  removeItem(key) { delete this.data[key]; }
  get length() { return Object.keys(this.data).length; }
  key(index) { return Object.keys(this.data)[index] || null; }
}

installStoragePolyfill();

test('W223 Share Center exposes only signed invite and portable Realm identity targets', () => {
  assert.deepEqual(SHARE_CENTER_TARGETS.map((target) => target.id), ['eonapp', 'city', 'realm']);
  assert.equal(SHARE_CENTER_TARGETS.find((target) => target.id === 'realm')?.linkKind, 'realm');
  assert.equal(SHARE_CENTER_TARGETS.find((target) => target.id === 'city')?.destination, '/eoncity');
});

test('W223 creates durable signed EON City invite links without reward or tracking claims', async () => {
  const draft = await createShareCenterDraft({
    type: 'city',
    persist: false,
    origin: 'https://eonapp.ch',
    profile: { alias: 'Maya Studio' }
  });
  assert.equal(draft.type, 'city');
  assert.match(draft.url, /^https:\/\/eonapp\.ch\/r\/#eon2\./);
  assert.equal(draft.activeRewards, false);
  assert.equal(draft.activePayouts, false);
  assert.equal(draft.automatedPosting, false);
  assert.equal(draft.clickTracking, false);
  const verified = await verifySignedShareToken(draft.url);
  assert.equal(verified.ok, true);
  assert.equal(verified.payload.destination, '/eoncity');
  assert.equal(verified.payload.linkKind, 'referral');
});

test('W223 creates safe portable Realm identity links without local City or showcase data', async () => {
  const storage = new MemoryStorage({
    'eon:profile:v1': JSON.stringify({ alias: 'Maya Studio', username: 'maya-studio' })
  });
  const realmState = createMyRealmState({
    storage,
    input: {
      label: 'Maya Studio',
      handle: 'maya-studio',
      theme: 'aurora',
      showcaseRefs: ['private-v3-first-preview']
    }
  });
  const draft = await createShareCenterDraft({
    type: 'realm',
    persist: false,
    origin: 'https://eonapp.ch',
    profile: { alias: 'Maya Studio' },
    realmState
  });
  assert.equal(draft.type, 'realm');
  assert.match(draft.url, /^https:\/\/eonapp\.ch\/r\/#eon3\./);
  const verified = await verifySignedShareToken(draft.url);
  assert.equal(verified.ok, true);
  assert.equal(verified.payload.realm.handle, 'maya-studio');
  assert.equal(Object.hasOwn(verified.payload.realm, 'showcaseRefs'), false);
  assert.equal(Object.hasOwn(verified.payload.realm, 'wallet'), false);
  assert.equal(Object.hasOwn(verified.payload.realm, 'payout'), false);
});

test('W223 migrates legacy local drafts and carries campaign briefs only in browser-local storage', () => {
  const storage = new MemoryStorage({
    'eon:share:drafts:v1': JSON.stringify({
      schema: 'eon.share.drafts.v1',
      drafts: [{ id: 'old', label: 'Old invite', message: 'Try EONAPP', url: 'https://eonapp.ch/r/#eon2.example' }]
    })
  });
  assert.equal(listShareDrafts({ storage }).length, 1);
  const saved = saveShareDraft({
    id: 'city',
    label: 'City invite',
    message: 'Explore EON City',
    url: 'https://eonapp.ch/r/#eon2.example2',
    type: 'city'
  }, { storage });
  assert.equal(saved.type, 'city');
  assert.match(storage.getItem('eon:share:drafts:v1'), new RegExp(SHARE_DRAFTS_SCHEMA));
  const intent = saveShareCampaignIntent({ draft: saved }, { storage });
  assert.equal(intent.activeRewards, false);
  assert.equal(intent.activePayouts, false);
  assert.equal(intent.automatedPosting, false);
  assert.match(storage.getItem('eon:share:campaign-intent:v1'), new RegExp(SHARE_CAMPAIGN_INTENT_SCHEMA));
  assert.equal(readShareCampaignIntent({ storage })?.draft?.url, saved.url);
});


test('W223 encrypted backup includes only the safe local Share Center records and restores them without Vault-like data', () => {
  const storage = new MemoryStorage({
    'eon:share:drafts:v1': JSON.stringify({
      schema: SHARE_DRAFTS_SCHEMA,
      drafts: [{ id: 'safe', type: 'city', label: 'City invite', message: 'Explore EON City', url: 'https://eonapp.ch/r/#eon2.safe' }]
    }),
    'eon:share:campaign-intent:v1': JSON.stringify({
      schema: SHARE_CAMPAIGN_INTENT_SCHEMA,
      draft: { id: 'safe', type: 'city', url: 'https://eonapp.ch/r/#eon2.safe' },
      activeRewards: false,
      activePayouts: false,
      automatedPosting: false,
      clickTracking: false
    }),
    'eon:vault:api-key': 'must-never-back-up',
    'eon:profile:v1': JSON.stringify({ alias: 'Maya Studio' })
  });
  const payload = buildLocalEncryptedExportPayload({ storage, now: Date.UTC(2026, 5, 24) });
  assert.deepEqual(payload.records.map((record) => record.key), [
    'eon:share:campaign-intent:v1',
    'eon:share:drafts:v1'
  ]);
  assert.doesNotMatch(JSON.stringify(payload), /must-never-back-up/);
  const destination = new MemoryStorage();
  const restored = restoreLocalEncryptedExportPayload(payload, { storage: destination });
  assert.equal(restored.ok, true);
  assert.equal(restored.restored, 2);
  assert.match(destination.getItem('eon:share:drafts:v1'), /City invite/);
  assert.match(destination.getItem('eon:share:campaign-intent:v1'), /activePayouts/);
});

// W624D archived contract snapshot: superseded by current canonical alignment coverage.

test.skip('W223 user-facing EON Share copy keeps private chat, public stores, rewards and payouts out of scope', () => {
  const share = read('assets/js/utils/eon-share-sheet.js');
  const shell = read('assets/js/eon-app-shell.js');
  const workspace = read('assets/js/eon-workspace-pages.js');
  const profile = read('profile.html');
  assert.match(share, /Share EONAPP/);
  assert.match(share, /does not publish this chat, your Vault, keys, recovery material, saved work, or a public profile database/i);
  assert.match(share, /clickTracking: false/);
  assert.match(share, /activeRewards: false/);
  assert.match(share, /activePayouts: false/);
  assert.match(shell, /openEonShareSheet/);
  assert.match(workspace, /Local campaign brief/);
  assert.match(profile, /id="eon-profile-open-share-center"/);
  assert.doesNotMatch(`${share}\n${workspace}\n${profile}`, /passive income|earn \d+%|withdraw/i);
});
