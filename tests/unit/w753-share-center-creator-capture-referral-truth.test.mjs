import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { onRequestGet as getReferralStatusEnvelope } from '../../functions/api/referrals.js';
import {
  EON_REFERRAL_STATUS_SCHEMA,
  fetchReferralStatus,
  normalizeReferralStatus
} from '../../assets/js/referrals/eon-referral-server-client.js';
import {
  EON_SHARE_W753_RECEIPT_ID,
  EON_SHARE_W753_RECEIPT_SCHEMA,
  readEonShareW753ReviewedHandoffReceipt,
  recordEonShareW753ReviewedHandoffReceipt,
  validateEonShareW753ReviewedHandoffReceipt
} from '../../assets/js/share/eon-share-w753-reviewed-handoff-receipt.js';
import {
  EON_SHARE_CENTER_W753_SCHEMA,
  resolveShareCenterType
} from '../../assets/js/utils/eon-share-sheet.js';
import {
  getEonCityW751StationLoop,
  projectEonCityW751ProductiveStations
} from '../../assets/js/city/w751/eon-city-w751-productive-stations.js';

const read = (relative) => fs.readFileSync(new URL(`../../${relative}`, import.meta.url), 'utf8');
const memoryStorage = () => {
  const data = new Map();
  return {
    getItem: (key) => data.has(key) ? data.get(key) : null,
    setItem: (key, value) => data.set(key, String(value)),
    removeItem: (key) => data.delete(key),
    dump: () => data
  };
};
class FakeCustomEvent extends Event { constructor(type, options = {}) { super(type); this.detail = options.detail; } }
const eventEnvironment = () => { const target = new EventTarget(); target.CustomEvent = FakeCustomEvent; return target; };

function fakeResponse(body, status = 200) {
  return { status, ok: status >= 200 && status < 300, async json() { return body; } };
}

test('W753 normalizes every maintained City source to the EON City share target', () => {
  assert.equal(resolveShareCenterType({ source: 'eon-city-command-hub' }), 'city');
  assert.equal(resolveShareCenterType({ source: 'eoncity' }), 'city');
  assert.equal(resolveShareCenterType({ context: { type: 'city' } }), 'city');
  assert.equal(resolveShareCenterType({ destination: '/eoncity' }), 'city');
  assert.equal(resolveShareCenterType({ environment: { location: { pathname: '/eoncity' } } }), 'city');
  assert.equal(resolveShareCenterType({ source: 'workspace' }), 'eonapp');
  assert.equal(EON_SHARE_CENTER_W753_SCHEMA, 'eon.share-command-center.w753.v1');
});

test('W753 referral status preserves active, inactive and unavailable as different truths', async () => {
  const inactive = normalizeReferralStatus({ ok: true, active: false, databaseMode: 'dedicated' }, { httpStatus: 200, checkedAt: '2026-07-29T15:00:00.000Z' });
  assert.equal(inactive.schema, EON_REFERRAL_STATUS_SCHEMA);
  assert.equal(inactive.state, 'inactive');
  assert.equal(inactive.active, false);
  assert.equal(inactive.available, true);
  assert.equal(inactive.referenceCode, 'referral-programme-inactive');

  const active = await fetchReferralStatus({
    force: true,
    fetcher: async () => fakeResponse({ ok: true, active: true, signedIn: false, statusState: 'active', referenceCode: 'referral-sign-in-required', endpoint: '/api/referrals' }),
    now: () => '2026-07-29T15:01:00.000Z'
  });
  assert.equal(active.state, 'active');
  assert.equal(active.active, true);
  assert.equal(active.httpStatus, 200);
  assert.equal(active.referenceCode, 'referral-sign-in-required');

  const unavailable = await fetchReferralStatus({
    force: true,
    fetcher: async () => { const error = new Error('offline'); error.name = 'TypeError'; throw error; },
    now: () => '2026-07-29T15:02:00.000Z'
  });
  assert.equal(unavailable.state, 'unavailable');
  assert.equal(unavailable.active, false);
  assert.equal(unavailable.available, false);
  assert.equal(unavailable.httpStatus, 0);
  assert.equal(unavailable.referenceCode, 'referral_status_unavailable');

  const explicitInactiveDuringMaintenance = normalizeReferralStatus({ ok: false, active: false, statusState: 'inactive', referenceCode: 'referral-programme-inactive' }, { httpStatus: 503 });
  assert.equal(explicitInactiveDuringMaintenance.state, 'inactive');
  assert.equal(explicitInactiveDuringMaintenance.available, true);
});


test('W753 referral endpoint emits a no-store inactive envelope without an active contradiction', async () => {
  const response = await getReferralStatusEnvelope({ request: new Request('https://eonapp.ch/api/referrals'), env: {} });
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.match(response.headers.get('cache-control') || '', /no-store/);
  assert.equal(body.statusSchema, EON_REFERRAL_STATUS_SCHEMA);
  assert.equal(body.statusState, 'inactive');
  assert.equal(body.active, false);
  assert.equal(body.available, true);
  assert.equal(body.referenceCode, 'referral-programme-inactive');
  assert.equal(body.endpoint, '/api/referrals');
});

test('W753 reviewed handoff receipt is explicit, finite, private and duplicate-protected', () => {
  const storage = memoryStorage();
  const environment = eventEnvironment();
  const events = [];
  environment.addEventListener('eon:share-w753-reviewed-handoff-receipt', (event) => events.push(event.detail));
  assert.equal(recordEonShareW753ReviewedHandoffReceipt({ kind: 'reviewed-signed-handoff', signedLinkReviewed: true }, { storage, environment }).reason, 'explicit-user-action-required');
  const missingStorage = recordEonShareW753ReviewedHandoffReceipt({ kind: 'reviewed-signed-handoff', explicitUserAction: true, signedLinkReviewed: true }, { storage: {}, environment });
  assert.equal(missingStorage.ok, false);
  assert.equal(missingStorage.reason, 'share-receipt-storage-unavailable');
  assert.equal(recordEonShareW753ReviewedHandoffReceipt({ kind: 'reviewed-signed-handoff', explicitUserAction: true }, { storage, environment }).reason, 'reviewed-handoff-proof-required');
  const first = recordEonShareW753ReviewedHandoffReceipt({ kind: 'reviewed-signed-handoff', source: 'share-center-local', explicitUserAction: true, signedLinkReviewed: true }, { storage, environment, now: 753000 });
  assert.equal(first.ok, true);
  assert.equal(first.duplicate, false);
  assert.equal(first.receipt.schema, EON_SHARE_W753_RECEIPT_SCHEMA);
  assert.equal(first.receipt.receiptId, EON_SHARE_W753_RECEIPT_ID);
  assert.equal(first.receipt.privateContentStored, false);
  assert.equal(first.receipt.mediaStored, false);
  assert.equal(first.receipt.signedLinkStored, false);
  assert.equal(first.receipt.destinationStored, false);
  assert.equal(first.receipt.source, 'share-center-local');
  assert.equal(first.receipt.publicPostingRequired, false);
  assert.equal(first.receipt.referralRewardIssued, false);
  const duplicate = recordEonShareW753ReviewedHandoffReceipt({ kind: 'creator-capture-saved', explicitUserAction: true, localWebmSaved: true }, { storage, environment, now: 754000 });
  assert.equal(duplicate.ok, true);
  assert.equal(duplicate.duplicate, true);
  assert.equal(duplicate.receipt.verifiedAt, 753000);
  assert.equal(events.length, 1);
  assert.equal(validateEonShareW753ReviewedHandoffReceipt(readEonShareW753ReviewedHandoffReceipt({ storage })).ok, true);
});

test('W753 projects the bounded reviewed handoff into the existing W751/W752 mission authority', () => {
  const storage = memoryStorage();
  recordEonShareW753ReviewedHandoffReceipt({ kind: 'creator-capture-saved', source: 'creator-capture-local', explicitUserAction: true, localWebmSaved: true }, { storage, environment: eventEnvironment(), now: 753100 });
  const view = projectEonCityW751ProductiveStations({
    productivePlan: { missions: [] },
    missionView: [],
    activity: { stations: {} },
    shareReceipt: readEonShareW753ReviewedHandoffReceipt({ storage })
  });
  const station = getEonCityW751StationLoop(view, 'share-capture');
  assert.equal(station.state, 'verified');
  assert.equal(station.completionClaimed, true);
  assert.equal(station.verifiedOutcome.receiptId, EON_SHARE_W753_RECEIPT_ID);
  assert.equal(station.verifiedOutcome.kind, 'creator-capture-saved');
  assert.equal(view.ownsReceiptAuthority, false);
});

test('W753 source hierarchy keeps quick share and capture above compact referral and advanced tools', () => {
  const share = read('assets/js/utils/eon-share-sheet.js');
  const adapter = read('assets/js/work-surface/adapters/eon-share-panel.js');
  const capture = read('assets/js/work-surface/adapters/eon-creator-capture-panel.js');
  const client = read('assets/js/referrals/eon-referral-server-client.js');
  const api = read('functions/api/referrals.js');
  const runtime = read('assets/js/city/w731/eon-city-w731-command-hub-runtime.js');
  const css = `${read('assets/css/eon-app-shell.css')}\n${read('assets/css/eon-work-surface.css')}`;

  assert.match(share, /Share Command Center 2\.0/);
  const markup = share.slice(share.indexOf('function renderShareCenterMarkup'), share.indexOf('export async function mountEonShareCenter'));
  assert.ok(markup.indexOf('eon-share-quick') < markup.indexOf('eon-share-city-capture'));
  assert.ok(markup.indexOf('eon-share-city-capture') < markup.indexOf('${renderViralShareStudio()}'));
  assert.ok(markup.indexOf('${renderViralShareStudio()}') < markup.indexOf('${renderShareRewardSummary()}'));
  assert.match(share, /Copy link/);
  assert.match(share, /data-eon-share-platform="whatsapp"/);
  assert.match(share, /Save QR/);
  assert.match(share, /Confirm reviewed handoff/);
  assert.match(share, /state === 'unavailable'/);
  assert.doesNotMatch(share, /Rollout pending/);
  assert.match(share, /reference:/);
  assert.match(adapter, /mountEonShareCenter/);
  assert.doesNotMatch(adapter, /close\(/);
  assert.doesNotMatch(adapter, /openEonShareSheet/);
  assert.match(runtime, /type: fromExpanseWorkspace \? 'expanse' : 'city'/);
  assert.match(runtime, /citySource: fromExpanseWorkspace \? 'eon-expanse-signal-frontier' : 'eon-city-command-hub'/);
  assert.match(capture, /name="microphone"> Include microphone \(off by default\)/);
  assert.doesNotMatch(capture, /name="microphone" checked/);
  assert.match(capture, /Download WebM/);
  assert.match(capture, /Save to Creator Library/);
  assert.match(capture, /data-capture-confirm-review/);
  assert.match(capture, /recordEonShareW753ReviewedHandoffReceipt/);
  assert.match(client, /EON_REFERRAL_STATUS_STATES/);
  assert.match(client, /referral_status_timeout/);
  assert.match(api, /statusState/);
  assert.match(api, /referenceCode/);
  assert.match(api, /cacheControl: 'no-store'/);
  assert.match(css, /\.eon-share-center-v2/);
  assert.match(css, /data-state="unavailable"/);
});
