import { readCloudflareReleaseAuthority } from '../../_shared/eon-cloudflare-release-authority.js';
import { requireOperator, trustJson } from '../../_shared/eon-trust-operations.js';

export async function onRequestGet(context) {
  if (!requireOperator(context.request, context.env)) {
    return trustJson({ ok: false, error: 'operator_authorization_required' }, 401);
  }
  const authority = await readCloudflareReleaseAuthority(context.env);
  return trustJson({ ok: authority.ready, authority }, authority.ready ? 200 : 503);
}
