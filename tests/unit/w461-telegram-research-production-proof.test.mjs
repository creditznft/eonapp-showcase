import assert from 'node:assert/strict';
import test from 'node:test';
import { createW461TelegramResearchProductionProofPlan, runW461TelegramResearchProductionProof } from '../../scripts/w461-telegram-research-production-proof.mjs';
import { inspectW461TelegramResearchProductionProof } from '../../scripts/w461-telegram-research-production-proof-gate.mjs';

function response(status, body = '', location = '') {
  return { status, headers: { get(name) { return String(name).toLowerCase() === 'location' ? location : ''; } }, async text() { return body; } };
}

const TELEGRAM = '<main><h1>Telegram helps you return to EONAPP</h1><p>No ads, rewards or provider SDKs.</p></main>';
const INSIGHTS = '<main><h1>Research Lab</h1><span>No live price feed</span><span>No orders</span></main>';

test('W461.1 stays HTTPS-only and dry by default without creating a network request', async () => {
  assert.equal(createW461TelegramResearchProductionProofPlan({ origin: 'http://eonapp.example' }).error, 'https-origin-required');
  const plan = createW461TelegramResearchProductionProofPlan({ origin: 'https://eonapp.example/' });
  assert.equal(plan.ok, true);
  assert.equal(plan.probes.length, 4);
  const dry = await runW461TelegramResearchProductionProof({ origin: 'https://eonapp.example', allowNetwork: false, fetchImpl: () => { throw new Error('must not fetch'); } });
  assert.equal(dry.status, 'dry-run');
  assert.equal(dry.networkRequestCreated, false);
  assert.equal(dry.liveProductionProof, false);
});

test('W461.1 records only public response metadata/hash and validates current documents plus aliases', async () => {
  const routes = new Map([
    ['/telegram', response(200, TELEGRAM)],
    ['/insights', response(308, '', '/insights/')],
    ['/insights/', response(200, INSIGHTS)],
    ['/trade', response(301, '', '/insights')],
    ['/telegram/index.html', response(301, '', '/telegram')]
  ]);
  const report = await runW461TelegramResearchProductionProof({
    origin: 'https://eonapp.example',
    allowNetwork: true,
    fetchImpl: async (url, options) => {
      assert.equal(options.method, 'GET');
      assert.equal(options.redirect, 'manual');
      assert.equal(options.credentials, 'omit');
      assert.deepEqual(options.headers, {});
      return routes.get(new URL(url).pathname);
    }
  });
  assert.equal(report.ok, true);
  assert.equal(report.status, 'captured-public-edge-metadata');
  assert.equal(report.results.length, 4);
  assert.equal(report.results.every((entry) => entry.pass), true);
  const serialised = JSON.stringify(report);
  assert.equal(serialised.includes(TELEGRAM), false);
  assert.equal(serialised.includes(INSIGHTS), false);
  assert.equal(report.responseBodyStored, false);
  assert.equal(report.botActionCreated, false);
  assert.equal(report.telegramSessionValidated, false);
  assert.equal(report.rewardMechanicEnabled, false);
  assert.equal(report.brokerOrOrderPathEnabled, false);
  assert.equal(report.liveProductionProof, false);
});

test('W461.1 fails closed when a redirect or page policy boundary is wrong', async () => {
  const bad = await runW461TelegramResearchProductionProof({
    origin: 'https://eonapp.example',
    allowNetwork: true,
    fetchImpl: async (url) => {
      const path = new URL(url).pathname;
      if (path === '/telegram') return response(200, `${TELEGRAM}<a href="/reward-access">Reward</a>`);
      if (path === '/insights') return response(200, INSIGHTS);
      if (path === '/trade') return response(301, '', '/wrong');
      return response(301, '', '/telegram');
    }
  });
  assert.equal(bad.ok, false);
  assert.equal(bad.liveProductionProof, false);
  assert.equal(bad.results.find((entry) => entry.id === 'telegram').pass, false);
  assert.equal(bad.results.find((entry) => entry.id === 'trade-alias').pass, false);
});

test('W461.1 source gate remains passive and scope-safe', async () => {
  const gate = await inspectW461TelegramResearchProductionProof();
  assert.equal(gate.status, 'pass');
  assert.ok(gate.checkCount >= 9);
});
