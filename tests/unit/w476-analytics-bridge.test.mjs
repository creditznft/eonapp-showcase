import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  EON_AGGREGATE_ANALYTICS_EVENT_NAME,
  getAggregateAnalyticsPreference,
  getAggregateAnalyticsRouteId,
  isProductionAnalyticsEnvironment,
  setAggregateAnalyticsPreference,
  startAggregateAnalyticsBridge,
  trackAggregateAnalyticsRoute
} from '../../assets/js/utils/analytics-bridge.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

class MemoryStorage {
  #data = new Map();
  getItem(key) { return this.#data.has(String(key)) ? this.#data.get(String(key)) : null; }
  setItem(key, value) { this.#data.set(String(key), String(value)); }
  removeItem(key) { this.#data.delete(String(key)); }
}

function createBrowser({ hostname = 'eonapp.ch', protocol = 'https:', pathname = '/', storage = new MemoryStorage(), pageDisabled = false } = {}) {
  const scripts = [];
  const document = {
    body: { dataset: pageDisabled ? { eonAnalytics: 'off' } : {} },
    head: {
      appendChild(script) {
        scripts.push(script);
        script.remove = () => {
          const index = scripts.indexOf(script);
          if (index >= 0) scripts.splice(index, 1);
        };
      }
    },
    createElement() { return { dataset: {} }; },
    querySelector(selector) {
      if (selector === 'script[data-eon-google-analytics="1"]') {
        return scripts.find((script) => script.dataset?.eonGoogleAnalytics === '1') || null;
      }
      return null;
    }
  };
  const listeners = new Map();
  const window = {
    location: { hostname, protocol, pathname },
    document,
    localStorage: storage,
    dataLayer: [],
    addEventListener(name, listener) { listeners.set(name, listener); }
  };
  return { window, document, storage, scripts, listeners };
}

function commands(browser, commandName) {
  return browser.window.dataLayer
    .map((entry) => Array.from(entry))
    .filter((entry) => entry[0] === commandName);
}

test('W476 aggregate analytics recognizes only the two production HTTPS hosts', () => {
  assert.equal(isProductionAnalyticsEnvironment({ hostname: 'eonapp.ch', protocol: 'https:' }), true);
  assert.equal(isProductionAnalyticsEnvironment({ hostname: 'www.eonapp.ch', protocol: 'https:' }), true);
  assert.equal(isProductionAnalyticsEnvironment({ hostname: 'eonapp-ch.pages.dev', protocol: 'https:' }), false);
  assert.equal(isProductionAnalyticsEnvironment({ hostname: 'localhost', protocol: 'http:' }), false);
  assert.equal(isProductionAnalyticsEnvironment({ hostname: 'eonapp.ch', protocol: 'http:' }), false);
});

test('W476 aggregate analytics is off until a persisted user choice exists', () => {
  const browser = createBrowser({ pathname: '/projects' });
  const result = startAggregateAnalyticsBridge(browser);
  assert.deepEqual(result, { started: false, reason: 'preference-disabled' });
  assert.equal(browser.scripts.length, 0);
  assert.equal(browser.window.dataLayer.length, 0);
  assert.equal(getAggregateAnalyticsPreference(browser).status, 'undecided');
});

test('W476 aggregate analytics sends only a logical route event after explicit enablement', () => {
  const browser = createBrowser({ pathname: '/capsule?token=private#fragment' });
  const preference = setAggregateAnalyticsPreference(true, browser);
  assert.equal(preference.enabled, true);
  assert.equal(preference.write.ok, true);
  assert.equal(browser.scripts.length, 1);

  const configs = commands(browser, 'config');
  assert.equal(configs.length, 1);
  const configOptions = configs[0][2];
  assert.equal(configOptions.send_page_view, false);
  assert.equal(configOptions.allow_google_signals, false);
  assert.equal(configOptions.allow_ad_personalization_signals, false);
  assert.equal('page_location' in configOptions, false);
  assert.equal('page_title' in configOptions, false);

  const events = commands(browser, 'event');
  assert.equal(events.length, 1);
  assert.equal(events[0][1], EON_AGGREGATE_ANALYTICS_EVENT_NAME);
  assert.deepEqual(events[0][2], { route_id: 'workspace_capsule' });
  assert.equal(JSON.stringify(events[0][2]).includes('token'), false);
  assert.equal(JSON.stringify(events[0][2]).includes('fragment'), false);
});

test('W476 aggregate analytics route sanitizer never retains queries, fragments, or arbitrary paths', () => {
  assert.equal(getAggregateAnalyticsRouteId('/?chat=private#x'), 'home');
  assert.equal(getAggregateAnalyticsRouteId('/eoncity?realm=signed#secret'), 'city');
  assert.equal(getAggregateAnalyticsRouteId('/capsule?passphrase=nope'), 'workspace_capsule');
  assert.equal(getAggregateAnalyticsRouteId('/unknown/user-entered-content?chat=hidden'), 'other');
});

test('W476 aggregate analytics respects an explicit page exclusion and an opt-out', () => {
  const excluded = createBrowser({ pathname: '/offline.html', pageDisabled: true });
  setAggregateAnalyticsPreference(true, excluded);
  assert.equal(excluded.scripts.length, 0);

  const browser = createBrowser({ pathname: '/eoncity' });
  setAggregateAnalyticsPreference(true, browser);
  assert.equal(browser.scripts.length, 1);
  const disabled = setAggregateAnalyticsPreference(false, browser);
  assert.equal(disabled.enabled, false);
  assert.equal(disabled.write.ok, true);
  assert.equal(browser.scripts.length, 0);
  assert.equal(Object.entries(browser.window).some(([key, value]) => key.startsWith('ga-disable-') && value === true), true);
  assert.equal(trackAggregateAnalyticsRoute(browser), false);
});

test('W476 analytics source wiring covers shells and fixes static-page CSP/copy truth', () => {
  const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
  assert.match(read('assets/js/eon-app-shell.js'), /analytics-bridge\.js/);
  assert.match(read('assets/js/eon-city-play-station.js'), /analytics-bridge\.js/);
  assert.match(read('assets/js/utils/site-shell.js'), /analytics-bridge\.js/);
  assert.doesNotMatch(read('assets/js/campaign-admin-page.js'), /google-analytics\.js|analytics-bridge\.js/);
  for (const relative of ['about.html', 'billing.html', 'privacy.html']) {
    const page = read(relative);
    assert.match(page, /https:\/\/www\.googletagmanager\.com/);
    assert.match(page, /https:\/\/www\.google-analytics\.com/);
  }
  const supportAlias = read('support.html');
  assert.match(supportAlias, /rel="canonical" href="https:\/\/eonapp\.ch\/help"/);
  assert.doesNotMatch(supportAlias, /googletagmanager|google-analytics/i, 'redirect aliases must not load third-party analytics before canonical navigation');
  assert.match(read('offline.html'), /data-eon-analytics="off"/);
  assert.match(read('privacy.html'), /Google Analytics for aggregate traffic and approved product-route measurement only after you enable it/);
  assert.match(read('profile.html'), /id="eon-profile-aggregate-analytics-toggle"/);
});
