#!/usr/bin/env node
/**
 * RT86 Web Push secret generator.
 *
 * Generates one environment-scoped VAPID key pair plus a subscription-custody
 * encryption secret. It writes nothing to disk. Use a separate invocation for
 * Preview and Production, but install each generated keyset into BOTH the Pages
 * Functions environment and the retention Worker environment it belongs to.
 */
import { generateKeyPairSync, randomBytes } from 'node:crypto';

function b64url(value) {
  return Buffer.from(value).toString('base64url');
}

const arg = (name) => {
  const index = process.argv.indexOf(name);
  return index >= 0 ? String(process.argv[index + 1] || '').trim() : '';
};

const subject = arg('--subject') || 'https://eonapp.ch';
let parsedSubject = null;
try { parsedSubject = new URL(subject); } catch {}
if (!/^mailto:[^\s@]+@[^\s@]+\.[^\s@]+$/i.test(subject) && parsedSubject?.protocol !== 'https:') {
  console.error('RT86: --subject must be an https:// URL or mailto:user@example.com');
  process.exit(2);
}

const { publicKey, privateKey } = generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
const publicJwk = publicKey.export({ format: 'jwk' });
const privateJwk = privateKey.export({ format: 'jwk' });
if (!publicJwk.x || !publicJwk.y || !privateJwk.d) throw new Error('vapid_jwk_generation_failed');

const x = Buffer.from(publicJwk.x, 'base64url');
const y = Buffer.from(publicJwk.y, 'base64url');
const d = Buffer.from(privateJwk.d, 'base64url');
const uncompressedPublic = Buffer.concat([Buffer.from([0x04]), x, y]);
if (uncompressedPublic.byteLength !== 65 || d.byteLength !== 32) throw new Error('vapid_key_shape_invalid');

const output = Object.freeze({
  EON_PUSH_VAPID_PUBLIC_KEY: b64url(uncompressedPublic),
  EON_PUSH_VAPID_PRIVATE_KEY: b64url(d),
  EON_PUSH_VAPID_SUBJECT: subject,
  EON_PUSH_SUBSCRIPTION_ENCRYPTION_KEY: randomBytes(32).toString('base64url')
});

if (process.argv.includes('--json')) {
  process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
} else {
  console.error('RT86: generated an environment-scoped Web Push keyset. Do not commit these values.');
  console.error('RT86: install the SAME four values into Pages Functions and the retention Worker for this environment.');
  for (const [key, value] of Object.entries(output)) process.stdout.write(`${key}=${value}\n`);
}
