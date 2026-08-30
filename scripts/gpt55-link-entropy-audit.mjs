#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { createSignedShareLink, verifySignedShareToken } from '../assets/js/utils/signed-share-link.js';
import { bytesToBase64Url, sha256Base64Url, sha256Bytes, crockfordBase32 } from '../assets/js/utils/share-link-codec.js';

const outDir = process.env.GPT55_LINK_AUDIT_OUT || 'reports/gpt55-link-audit';
fs.mkdirSync(outDir, { recursive: true });

function collisionProbability(bits, n) {
  const nn = Number(n);
  return (nn * Math.max(0, nn - 1)) / (2 * Math.pow(2, Number(bits)));
}

function fmtProb(p) {
  if (p === 0) return '0';
  if (p < 1e-12) return p.toExponential(2);
  if (p < 0.001) return p.toExponential(2);
  return `${(p * 100).toFixed(6)}%`;
}

async function makeIdentity() {
  const generated = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
  const publicJwk = await crypto.subtle.exportKey('jwk', generated.publicKey);
  return {
    privateKey: generated.privateKey,
    publicJwk,
    fingerprint: await sha256Base64Url(JSON.stringify(publicJwk))
  };
}

const identity = await makeIdentity();
const share = await createSignedShareLink({
  identity,
  issuerId: 'audit-user-1234567890',
  rootReferralId: 'audit-user-1234567890',
  destination: '/realm.html',
  origin: 'https://eonapp.ch',
  source: 'audit',
  missionType: 'referral_invite'
});
const verified = await verifySignedShareToken(share.token);
const tokenHash = await sha256Bytes(share.token);
const currentHash22 = bytesToBase64Url(tokenHash).slice(0, 22);
const currentHash27 = bytesToBase64Url(tokenHash).slice(0, 27);
const currentAddressLike = '0x' + Buffer.from(tokenHash.slice(0, 20)).toString('hex');
const currentCrockford26 = crockfordBase32(tokenHash).slice(0, 26);

const options = [
  {
    id: 'current-self-contained-signed-token',
    sample: share.link,
    chars: share.link.length,
    entropyBits: 192,
    verification: 'self-contained P-256 signed payload; no resolver needed',
    launchUse: 'keep as canonical fallback/export proof'
  },
  {
    id: 'short-kv-resolver-128',
    sample: `https://eonapp.ch/r/${currentHash22}`,
    chars: `https://eonapp.ch/r/${currentHash22}`.length,
    entropyBits: 128,
    verification: 'implemented resolver maps short id -> signed token/envelope in Cloudflare KV with optional IPFS/Arweave mirror',
    launchUse: 'implemented public UX for short referral links'
  },
  {
    id: 'address-length-random-160',
    sample: `https://eonapp.ch/r/${currentAddressLike}`,
    chars: `https://eonapp.ch/r/${currentAddressLike}`.length,
    entropyBits: 160,
    verification: '20 random bytes displayed as 0x + 40 hex chars; same visual length as an EVM address but not a private key',
    launchUse: 'good compromise if user wants address-like 42-char IDs'
  },
  {
    id: 'base64url-160',
    sample: `https://eonapp.ch/r/${currentHash27}`,
    chars: `https://eonapp.ch/r/${currentHash27}`.length,
    entropyBits: 160,
    verification: 'compact 160-bit code; shorter than 0xhex address-like format',
    launchUse: 'preferred technical short ID if not requiring 0x appearance'
  },
  {
    id: 'crockford-base32-130',
    sample: `https://eonapp.ch/r/${currentCrockford26}`,
    chars: `https://eonapp.ch/r/${currentCrockford26}`.length,
    entropyBits: 130,
    verification: 'human safer alphabet, avoids I/L/O/U ambiguity',
    launchUse: 'best for support calls, print, screenshots, manual copy'
  }
];

const populations = [1e6, 1e9, 1e12];
const collisionTable = [80, 96, 128, 130, 160, 192, 256].map((bits) => ({
  bits,
  ...Object.fromEntries(populations.map((n) => [`n_${n.toExponential(0)}`, fmtProb(collisionProbability(bits, n))]))
}));

const result = {
  schema: 'eonapp.gpt55.link-entropy-audit.v1',
  checkedAt: new Date().toISOString(),
  currentImplementation: {
    protocol: 'eon.share-link.v1',
    tokenChars: share.token.length,
    linkChars: share.link.length,
    payloadEncodedChars: share.token.split('.')[1].length,
    signatureChars: share.token.split('.')[2].length,
    missionCode: share.missionCode,
    verifies: verified.ok,
    reason: verified.reason,
    note: 'Current links are long because the public P-256 key and signed payload travel inside the URL, making the link self-contained.'
  },
  options,
  collisionTable,
  recommendation: {
    launch: 'Use short resolver aliases for public sharing while keeping the self-contained signed token as canonical fallback/export proof.',
    bestShortFormat: '/r/<22-char base64url> for referrals and /m/<22-char base64url> for realms using 128-bit random aliases backed by signed-token verification.',
    ifUserWants42Chars: 'Use address-like 0x + 40 hex = 160-bit random ID. It is wallet-address length, not private-key length.',
    warning: 'A short code alone cannot prove a decentralized referral. The resolver must return a signed envelope that verifies locally; for stronger decentralization, mirror envelopes to IPFS/Arweave and anchor Merkle roots later.'
  }
};

fs.writeFileSync(path.join(outDir, 'link-entropy-audit.json'), `${JSON.stringify(result, null, 2)}\n`);
fs.writeFileSync(path.join(outDir, 'link-entropy-audit.md'), [
  '# GPT-5.5 Realm / Referral Link Entropy Audit',
  '',
  `Checked: ${result.checkedAt}`,
  '',
  '## Current implementation',
  '',
  `- Protocol: ${result.currentImplementation.protocol}`,
  `- Token length: ${result.currentImplementation.tokenChars} chars`,
  `- Full link length: ${result.currentImplementation.linkChars} chars`,
  `- Payload segment: ${result.currentImplementation.payloadEncodedChars} chars`,
  `- Signature segment: ${result.currentImplementation.signatureChars} chars`,
  `- Verification: ${result.currentImplementation.verifies ? 'PASS' : 'FAIL'} (${result.currentImplementation.reason})`,
  '',
  result.currentImplementation.note,
  '',
  '## Short-link options',
  '',
  '| Option | Chars | Bits | Sample | Launch use |',
  '| --- | ---: | ---: | --- | --- |',
  ...options.map((o) => `| ${o.id} | ${o.chars} | ${o.entropyBits} | \`${o.sample}\` | ${o.launchUse} |`),
  '',
  '## Collision estimates',
  '',
  '| Bits | 1e6 links | 1e9 links | 1e12 links |',
  '| ---: | ---: | ---: | ---: |',
  ...collisionTable.map((r) => `| ${r.bits} | ${r.n_1e+6} | ${r.n_1e+9} | ${r.n_1e+12} |`),
  '',
  '## Recommendation',
  '',
  `- Launch: ${result.recommendation.launch}`,
  `- Best short format: ${result.recommendation.bestShortFormat}`,
  `- 42-char request: ${result.recommendation.ifUserWants42Chars}`,
  `- Warning: ${result.recommendation.warning}`
].join('\n'));

console.log(JSON.stringify(result, null, 2));
