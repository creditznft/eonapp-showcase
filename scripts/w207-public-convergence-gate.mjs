#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(__filename), '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const checks = [];
const check = (id, ok, detail) => checks.push({ id, ok: Boolean(ok), detail });

const index = read('index.html');
const chat = read('chat.html');
const redirects = read('_redirects');
const publicRedirects = read('public/_redirects');
const vite = read('vite.config.mjs');
const contract = read('assets/js/product/eon-public-surface-contract.js');
const siteAudit = read('scripts/site-audit.mjs');

check('home:chat-first-shell', /data-eon-app-shell="1"/.test(index) && /Ask EONBOT/.test(index), 'Root is a calm Chat-first entry rather than a legacy Cockpit landing.');
check('home:no-retired-identities', !/AI Cockpit|NFT Exchange|Pool Points|RealmWorld|EON Team Store/.test(index), 'Root does not promote retired public product identities.');
check('home:canonical', /<link rel="canonical" href="https:\/\/eonapp\.ch\/"/.test(index), 'Root retains the normal canonical URL.');
check('chat:clean-canonical', /<link rel="canonical" href="https:\/\/eonapp\.ch\/chat"/.test(chat) && /og:url" content="https:\/\/eonapp\.ch\/chat"/.test(chat), 'Chat advertises the clean canonical route.');
check('chat:no-duplicate-legacy-nav', !/NFT Exchange|AI Cockpit/.test(chat), 'Chat source no longer emits duplicate legacy navigation labels.');
check('redirects:single-source', redirects === publicRedirects, 'Root and public redirect files are identical so tools cannot drift.');
for (const [from, to] of [
  ['/eon-browser.html', '/workspace'],
  ['/workbench.html', '/workspace'],
  ['/marketplace.html', '/market'],
  ['/realmworld.html', '/eoncity'],
  ['/signal.html', '/trade'],
  ['/subscription.html', '/rewards']
]) {
  check(`redirect:${from}`, redirects.includes(`${from} ${to} 301`), `${from} must move to ${to}.`);
  check(`redirect:no-200-override:${from}`, !redirects.includes(`${from} ${from} 200`), `${from} must not override its 301 with a later 200 rewrite.`);
}
for (const legacy of ['/eon-browser', '/workbench', '/marketplace', '/team-realm']) {
  check(`vite-clean-route:${legacy}`, vite.includes(`['${legacy}'`), `${legacy} must resolve to a canonical local preview route.`);
}
check('contract:public-truth', /RETIRED_PUBLIC_IDENTITIES/.test(contract) && /PUBLIC_PRIMARY_SURFACES/.test(contract), 'Public surface contract records canonical and retired identities.');
check('audit:canonical-route-awareness', /\['\/chat', 'chat\.html'\]/.test(siteAudit) && /\['\/eoncity', 'eoncity\.html'\]/.test(siteAudit) && /\['\/trade\/sandbox', 'trade-sandbox\.html'\]/.test(siteAudit) && /\['\/leaderboard', 'leaderboard\.html'\]/.test(siteAudit), 'The static site audit understands canonical clean routes.');

const failed = checks.filter((item) => !item.ok);
const report = {
  schema: 'eon.w207-public-convergence-gate.v1',
  ok: failed.length === 0,
  generatedAt: new Date().toISOString(),
  checks,
  failed,
  note: 'W207 proves source convergence only. It does not prove a Cloudflare production deployment, device usability, external provider approval, or user-account security.'
};
console.log(JSON.stringify(report, null, 2));
process.exit(report.ok ? 0 : 1);
