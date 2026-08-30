#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';

const args = new Map(process.argv.slice(2).map((arg) => {
  const [key, ...rest] = arg.replace(/^--/, '').split('=');
  return [key, rest.join('=') || '1'];
}));

const outDir = path.resolve(args.get('out') || 'reports/gpt55-launch/referral-storage-proof');
const target = String(args.get('target') || process.env.EONAPP_PUBLIC_URL || 'https://eonapp.ch').replace(/\/$/, '');
const writeTest = args.has('write-test');
fs.mkdirSync(outDir, { recursive: true });

dotenv.config({ path: '.env.local', override: false });
dotenv.config({ override: false });

function redact(value = '') {
  const text = String(value || '');
  if (!text) return '';
  if (text.length <= 8) return '***';
  return `${text.slice(0, 3)}…${text.slice(-3)}`;
}

async function fetchJson(url, options = {}) {
  const startedAt = Date.now();
  try {
    const response = await fetch(url, options);
    const text = await response.text();
    let json = null;
    try { json = JSON.parse(text); } catch {}
    return { ok: response.ok, status: response.status, ms: Date.now() - startedAt, json, text: json ? undefined : text.slice(0, 500) };
  } catch (error) {
    return { ok: false, status: 0, ms: Date.now() - startedAt, error: String(error?.message || error) };
  }
}

const envSummary = {
  REFERRALS_DB: 'Cloudflare binding; cannot be read from local env',
  referralLinks: 'W212 self-contained signed fragments; no KV short-link binding is used',
  FILEBASE_ACCESS_KEY_ID: process.env.FILEBASE_ACCESS_KEY_ID ? redact(process.env.FILEBASE_ACCESS_KEY_ID) : '',
  FILEBASE_SECRET_ACCESS_KEY: process.env.FILEBASE_SECRET_ACCESS_KEY ? 'set-redacted' : '',
  FILEBASE_BUCKET: process.env.FILEBASE_BUCKET || '',
  FILEBASE_S3_ENDPOINT: process.env.FILEBASE_S3_ENDPOINT || '',
  FILEBASE_REGION: process.env.FILEBASE_REGION || '',
  FILEBASE_STORAGE_MODE: process.env.FILEBASE_STORAGE_MODE || '',
};

const checks = [];
checks.push({ id: 'filebase_bucket', ok: envSummary.FILEBASE_BUCKET === 'eonapp-referral-proofs', expected: 'eonapp-referral-proofs', actual: envSummary.FILEBASE_BUCKET });
checks.push({ id: 'filebase_endpoint', ok: envSummary.FILEBASE_S3_ENDPOINT === 'https://s3.filebase.com', expected: 'https://s3.filebase.com', actual: envSummary.FILEBASE_S3_ENDPOINT });
checks.push({ id: 'filebase_region', ok: envSummary.FILEBASE_REGION === 'us-east-1', expected: 'us-east-1', actual: envSummary.FILEBASE_REGION });
checks.push({ id: 'filebase_storage_mode', ok: envSummary.FILEBASE_STORAGE_MODE === 'ipfs', expected: 'ipfs', actual: envSummary.FILEBASE_STORAGE_MODE });
checks.push({ id: 'filebase_access_key_present', ok: Boolean(process.env.FILEBASE_ACCESS_KEY_ID), redacted: envSummary.FILEBASE_ACCESS_KEY_ID });
checks.push({ id: 'filebase_secret_key_present', ok: Boolean(process.env.FILEBASE_SECRET_ACCESS_KEY), redacted: envSummary.FILEBASE_SECRET_ACCESS_KEY });

const live = {};
live.statusMissing = await fetchJson(`${target}/api/referrals/status`);
live.latestEpoch = await fetchJson(`${target}/api/referrals/epochs/latest`);
live.invalidProof = await fetchJson(`${target}/api/referrals/proof?epoch=invalid-test-epoch`);

if (writeTest) {
  const stamp = Date.now();
  live.capture = await fetchJson(`${target}/api/referrals/capture`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      userIdHash: `test:gpt55-user-${stamp}`,
      referrerIdHash: `test:gpt55-referrer-${stamp}`,
      shortCode: 'EON-PROOF',
      signedEnvelopeHash: `test:gpt55-envelope-${stamp}`,
      source: 'qualified-mission-run',
      status: 'confirmed',
      createdAt: stamp,
    }),
  });
  live.statusAfterCapture = await fetchJson(`${target}/api/referrals/status?user=test:gpt55-user-${stamp}`);
  live.downlineAfterCapture = await fetchJson(`${target}/api/referrals/downline?referrer=test:gpt55-referrer-${stamp}`);
}

const liveChecks = [
  { id: 'status_endpoint_safe', ok: live.statusMissing.status !== 0 && live.statusMissing.status !== 500, status: live.statusMissing.status },
  { id: 'latest_epoch_endpoint_safe', ok: live.latestEpoch.status !== 0 && live.latestEpoch.status !== 500, status: live.latestEpoch.status },
  { id: 'invalid_proof_endpoint_safe', ok: live.invalidProof.status !== 0 && live.invalidProof.status !== 500, status: live.invalidProof.status },
];
if (writeTest) {
  liveChecks.push({ id: 'capture_write_test', ok: Boolean(live.capture?.ok && live.capture?.json?.ok), status: live.capture?.status || 0 });
  liveChecks.push({ id: 'status_after_capture', ok: Boolean(live.statusAfterCapture?.ok && live.statusAfterCapture?.json?.found), status: live.statusAfterCapture?.status || 0 });
}

const summary = {
  schema: 'eon.gpt55.referral-storage-proof.v1',
  target,
  writeTest,
  generatedAt: new Date().toISOString(),
  envSummary,
  checks,
  liveChecks,
  live,
  pass: checks.every((check) => check.ok) && liveChecks.every((check) => check.ok),
  note: 'Secrets are redacted. This validates only a qualified pseudonymous referral-tree event. Signed referral URLs are self-contained and never written to a short-link registry. Use --write-test only after production D1/Filebase bindings are deployed.',
};

fs.writeFileSync(path.join(outDir, 'referral-storage-proof.json'), JSON.stringify(summary, null, 2));
fs.writeFileSync(path.join(outDir, 'referral-storage-proof.md'), [
  '# GPT-5.5 Referral Storage Proof',
  '',
  `Target: ${target}`,
  `Write test: ${writeTest ? 'enabled' : 'disabled'}`,
  `Pass: ${summary.pass ? 'PASS' : 'HOLD'}`,
  '',
  '## Checks',
  ...checks.map((check) => `- ${check.ok ? 'PASS' : 'FAIL'} ${check.id}`),
  '',
  '## Live endpoint checks',
  ...liveChecks.map((check) => `- ${check.ok ? 'PASS' : 'FAIL'} ${check.id} status=${check.status}`),
  '',
  '## Output',
  '`referral-storage-proof.json`',
].join('\n'));

console.log(JSON.stringify({ pass: summary.pass, outDir, writeTest }, null, 2));
if (!summary.pass && args.has('strict-exit')) process.exit(1);
