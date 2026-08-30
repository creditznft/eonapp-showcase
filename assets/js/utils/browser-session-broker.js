import { listBrowserAttachments } from './profile.js';

const PASSWORD_STORE_KEY = 'eon:vault:pwds:v1';

export function getSavedCredentialCount() {
  try {
    const raw = JSON.parse(localStorage.getItem(PASSWORD_STORE_KEY) || '[]');
    return Array.isArray(raw) ? raw.length : 0;
  } catch {
    return 0;
  }
}

export function buildBrowserSessionBrokerSummary() {
  const attachments = listBrowserAttachments().slice(0, 20);
  const providers = [...new Set(attachments.map((row) => String(row.provider || '').trim()).filter(Boolean))];
  const hosts = [...new Set(attachments.map((row) => String(row.host || '').trim()).filter(Boolean))].slice(0, 8);
  const credentialCount = getSavedCredentialCount();
  return {
    attachments,
    attachmentCount: attachments.length,
    providerCount: providers.length,
    providers,
    hosts,
    credentialCount,
    reloginTruth: credentialCount
      ? 'Saved credentials exist locally in the Password Vault. EONAPP can guide relogin through that vault, but the user still completes sign-in and any challenge steps.'
      : 'No saved credentials detected in the Password Vault yet.'
  };
}
