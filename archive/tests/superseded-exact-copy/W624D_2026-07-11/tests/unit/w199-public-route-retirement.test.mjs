import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createDevRouteRewrites, RETIRED_REDIRECTS } from '../../config/route-contract.mjs';

const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');

test('W199 now delegates legacy retirement to the W217 route contract', () => {
  const redirects = read('_redirects');
  const rewrites = createDevRouteRewrites();
  for (const [legacy, canonical] of [
    ['/eon-browser.html', '/workspace'], ['/workbench.html', '/workspace'],
    ['/marketplace.html', '/market'], ['/realmworld.html', '/eoncity'],
    ['/signal.html', '/insights'], ['/subscription.html', '/archive']
  ]) {
    assert.equal(RETIRED_REDIRECTS.some((row) => row.from === legacy && row.to === canonical && row.status === 301), true, `${legacy} retires to ${canonical}`);
    assert.match(redirects, new RegExp(`^${legacy.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} ${canonical.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} 301$`, 'm'));
  }
  assert.equal(rewrites.get('/browser'), '/workspace.html');
  assert.equal(rewrites.get('/realm'), '/eoncity.html');
  assert.equal(rewrites.get('/subscription'), '/archive.html');
});

test('W199 primary pages have one active shell and route users away from legacy Cockpit/store wording', () => {
  const chat = read('chat.html');
  const market = read('market.html');
  const vault = read('vault.html');
  const trade = read('trade.html');
  for (const html of [chat, market, vault, trade]) {
    assert.match(html, /data-eon-app-shell="1"/);
    assert.match(html, /assets\/js\/eon-app-shell\.js/);
  }
  assert.match(chat, /eon-chat-first\.css/);
  assert.doesNotMatch(chat, /href="\/eon-browser\.html"/);
  assert.match(market, /eon-market-v2/);
  assert.match(vault, /eon-vault-v2/);
  assert.match(trade, /Research Lab/);
});
