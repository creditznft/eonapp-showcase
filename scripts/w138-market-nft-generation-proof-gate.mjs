#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

const marketHtml = read('market.html');
const marketPage = read('assets/js/market/eon-market-page.js');
const privateDrop = read('assets/js/market/market-private-drop.js');
const nftCollectionJs = read('assets/js/utils/nft-collection.js');
const vaultShellJs = read('assets/js/vault/vault-shell.js');
const packageJson = JSON.parse(read('package.json'));

const prehydratedCards = (marketHtml.match(/data-w131-prehydrated-starter=/g) || []).length;
const checks = [
  ['Market has no prehydrated starter inventory', prehydratedCards === 0],
  ['Private generation creates local-only previews', /privateGenerated: true/.test(privateDrop) && /userTriggered: true/.test(privateDrop) && /localOnly: true/.test(privateDrop)],
  ['No live mint or listing path is present', /mintState: 'not-minted'/.test(privateDrop) && /publicListingAvailable: false/.test(privateDrop) && /notFinancialProduct: true/.test(privateDrop)],
  ['Save action writes a named local preview record', /userFacingState: 'Saved Local Preview'/.test(privateDrop) && /source: 'market-private-drop-v3'/.test(privateDrop)],
  ['Save route is canonical Vault route', /vaultRoute: '\/vault#nft-collection'/.test(privateDrop) && /href="\/vault#nft-collection"/.test(marketPage)],
  ['Legacy resume keeps original data intact', /preservedLegacySource: true/.test(privateDrop) && /resume_migration_not_persisted/.test(privateDrop)],
  ['Public Market declares official commerce disabled', /Official commerce is not active/.test(marketPage) && /no user marketplace, purchase path, commission, payout, token, or trading surface/.test(marketPage)],
  ['Vault collection normalizer preserves local record fields', /resolvedId/.test(nftCollectionJs) && /resolvedName/.test(nftCollectionJs)],
  ['Vault shell can count object collections', /Object\.entries\(value\)\.flatMap/.test(vaultShellJs) && /nftId:\s*copy\?\.nftId \|\| id/.test(vaultShellJs)],
  ['Current W220 market QA command is exposed', Boolean(packageJson.scripts?.['qa:w220-market-generation'])]
];

const failed = checks.filter(([, ok]) => !ok);
const stats = {
  schema: 'eonapp.w138.market-local-preview-proof.v2',
  supersededBy: 'W220 explicit local generation vertical slice',
  score: failed.length ? Math.max(0, Math.round(((checks.length - failed.length) / checks.length) * 100)) : 100,
  ok: failed.length === 0,
  prehydratedCards,
  checks: Object.fromEntries(checks)
};

fs.mkdirSync(path.join(root, 'tmp'), { recursive: true });
fs.writeFileSync(path.join(root, 'tmp', 'w138-market-nft-generation-proof-stats.json'), `${JSON.stringify(stats, null, 2)}\n`);

if (failed.length) {
  console.error('[W138] Current Market local-preview proof failed:');
  for (const [name] of failed) console.error(` - ${name}`);
  process.exit(1);
}
console.log(`[W138] Current Market local-preview proof passed (${stats.score}/100).`);
