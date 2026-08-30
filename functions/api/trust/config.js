import { getPublicOperatorConfig } from '../../../assets/js/trust/eon-trust-support-authority.js';
import { trustJson } from '../../_shared/eon-trust-operations.js';

export async function onRequestGet(context) {
  const config = getPublicOperatorConfig(context.env);
  return trustJson(config, config.configured ? 200 : 503);
}
