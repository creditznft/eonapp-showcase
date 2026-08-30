import { readPublicServiceStatus } from '../../../assets/js/trust/eon-trust-support-ledger.js';
import { trustJson } from '../../_shared/eon-trust-operations.js';

export async function onRequestGet(context) {
  try {
    const status = await readPublicServiceStatus(context.env.EON_TRUST_DB);
    return trustJson(status, status.configured ? 200 : 503, { 'cache-control': 'public, max-age=60, stale-if-error=300' });
  } catch (error) {
    // Keep the public response fail-closed while retaining a sanitized runtime
    // diagnostic in the Cloudflare deployment tail. Never serialize error data.
    console.error('[EON_TRUST_STATUS_UNAVAILABLE]', error?.name || 'Error', error?.message || 'unknown');
    return trustJson({ ok: false, configured: false, overall: 'unknown', error: 'status_unavailable' }, 503);
  }
}
