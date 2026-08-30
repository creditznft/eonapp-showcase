import { getEonSocialConnector } from './eon-social-connector-registry.js';

/**
 * W442 — connector and collaboration consent registry.
 *
 * A consent record is not a connection. It captures a user-reviewed local
 * intention with an expiry and revoke path, while all OAuth, token custody,
 * data transfer and publishing remain unavailable.
 */
export const EON_CONNECTOR_CONSENT_SCHEMA = 'eon.connectors.consent.w442.v1';
export const EON_CONNECTOR_CONSENT_STORAGE_KEY = 'eon:connector-consent:v1';
export const EON_CONNECTOR_CONSENT_PURPOSES = Object.freeze(['review-future-connection', 'review-future-share', 'review-future-publish']);
const MAX_RECORDS = 24;
const freeze = (value) => Object.freeze(value);
const safeText = (value, fallback = '') => String(value || '').split('').filter((character) => character.charCodeAt(0) >= 32 && character !== '<' && character !== '>').join('').replace(/\s+/g, ' ').trim().slice(0, 120) || fallback;
const safeId = (value) => String(value || '').replace(/[^a-zA-Z0-9._:-]/g, '').slice(0, 96);
const safeDayCount = (value) => Math.max(1, Math.min(30, Number.parseInt(value, 10) || 7));
const isStorage = (storage) => storage && typeof storage.getItem === 'function' && typeof storage.setItem === 'function';
const storeFor = (storage = null) => storage || (() => { try { return globalThis.localStorage || null; } catch { return null; } })();
const epoch = (now) => Number(typeof now === 'function' ? now() : Date.now());
const iso = (value) => new Date(Number(value) || Date.now()).toISOString();
function emptyState(now) { return { schema: EON_CONNECTOR_CONSENT_SCHEMA, updatedAt: iso(now), records: [] }; }
function readState(storage, now) { try { const parsed = JSON.parse(storage?.getItem(EON_CONNECTOR_CONSENT_STORAGE_KEY) || 'null'); if (parsed?.schema === EON_CONNECTOR_CONSENT_SCHEMA && Array.isArray(parsed.records)) return { ...parsed, records: parsed.records.slice(0, MAX_RECORDS) }; } catch {} return emptyState(now); }
function writeState(storage, state) { try { storage?.setItem(EON_CONNECTOR_CONSENT_STORAGE_KEY, JSON.stringify(state)); return true; } catch { return false; } }
function publicRecord(record) { return freeze({ consentId: record.consentId, connectorId: record.connectorId, connectorLabel: record.connectorLabel, purpose: record.purpose, safeResourceLabel: record.safeResourceLabel, state: record.state, createdAt: record.createdAt, expiresAt: record.expiresAt, revokedAt: record.revokedAt || null, oauthStarted: false, tokenStored: false, remoteAccessGranted: false, remoteActionCreated: false, externalPublishCreated: false }); }
function snapshot(state) { return freeze({ schema: EON_CONNECTOR_CONSENT_SCHEMA, records: freeze(state.records.map(publicRecord)), localOnly: true, connectionEstablished: false, tokenCustody: false, externalPublish: false }); }

export function createEonConnectorConsentRegistry({ storage = null, now = () => Date.now() } = {}) {
  const targetStorage = storeFor(storage); const clock = () => epoch(now); const current = () => readState(targetStorage, clock());
  const persist = (state) => { const stored = isStorage(targetStorage) && writeState(targetStorage, state); return freeze({ stored, browserStorageChanged: stored, oauthStarted: false, tokenStored: false, networkRequestCreated: false, remoteActionCreated: false, snapshot: snapshot(state) }); };
  return freeze({
    getSnapshot() { return snapshot(current()); },
    prepareConsent({ connectorId = '', purpose = '', safeResourceLabel = '', expiryDays = 7 } = {}, { explicitUserAction = false, explicitPurposeApproval = false } = {}) {
      if (explicitUserAction !== true || explicitPurposeApproval !== true) return freeze({ ok: false, error: 'explicit-user-action-and-purpose-approval-required', browserStorageChanged: false, oauthStarted: false, networkRequestCreated: false });
      const connector = getEonSocialConnector(connectorId);
      if (!connector) return freeze({ ok: false, error: 'connector-not-recognized', browserStorageChanged: false, oauthStarted: false, networkRequestCreated: false });
      if (!EON_CONNECTOR_CONSENT_PURPOSES.includes(String(purpose || ''))) return freeze({ ok: false, error: 'connector-purpose-not-allowed', browserStorageChanged: false, oauthStarted: false, networkRequestCreated: false });
      const timestamp = clock();
      const record = { consentId: `connector-consent-${timestamp}-${Math.random().toString(36).slice(2, 8)}`, connectorId: connector.id, connectorLabel: connector.label, purpose, safeResourceLabel: safeText(safeResourceLabel, 'A user-reviewed resource'), state: 'prepared', createdAt: iso(timestamp), expiresAt: iso(timestamp + safeDayCount(expiryDays) * 86400000), revokedAt: null };
      const state = current(); const saved = persist({ schema: EON_CONNECTOR_CONSENT_SCHEMA, updatedAt: iso(timestamp), records: [record, ...state.records].slice(0, MAX_RECORDS) });
      return freeze({ ok: saved.stored, record: publicRecord(record), ...saved });
    },
    revokeConsent(consentId = '', { explicitUserAction = false, explicitRevocationConfirmation = false } = {}) {
      if (explicitUserAction !== true || explicitRevocationConfirmation !== true) return freeze({ ok: false, error: 'explicit-revocation-confirmation-required', browserStorageChanged: false, oauthStarted: false, networkRequestCreated: false });
      const state = current(); const record = state.records.find((item) => item.consentId === safeId(consentId));
      if (!record) return freeze({ ok: false, error: 'connector-consent-not-found', browserStorageChanged: false, oauthStarted: false, networkRequestCreated: false });
      const updated = { ...record, state: 'revoked', revokedAt: iso(clock()) };
      const saved = persist({ ...state, updatedAt: iso(clock()), records: state.records.map((item) => item.consentId === record.consentId ? updated : item) });
      return freeze({ ok: saved.stored, record: publicRecord(updated), ...saved });
    },
    startOAuthOrConnection(consentId = '', { explicitUserAction = false } = {}) {
      return freeze({ ok: false, error: explicitUserAction === true ? 'oauth-and-connector-custody-not-released' : 'explicit-user-action-required', consentId: safeId(consentId), browserStorageChanged: false, oauthStarted: false, tokenStored: false, networkRequestCreated: false, remoteActionCreated: false });
    }
  });
}

export function getEonConnectorConsentTruth() {
  return freeze({ schema: EON_CONNECTOR_CONSENT_SCHEMA, localConsentDraft: true, expiryAndRevocation: true, explicitPurposeApprovalRequired: true, oauthStarted: false, tokenStored: false, remoteAccessGranted: false, externalPublishCreated: false, collaborationRoleGrant: false, productionConnectorProof: false });
}
