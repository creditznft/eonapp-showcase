import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('W135/W150 keeps Telegram Mini App routing loop-safe and stable', () => {
  const redirects = read('_redirects');
  assert.doesNotMatch(redirects, /^\/telegram\s+\/telegram\.html\s+200/m);
  assert.doesNotMatch(redirects, /^\/telegram\/\s+\/telegram\.html\s+200/m);
  assert.doesNotMatch(redirects, /^\/telegram\.html\s+\/telegram\.html\s+200/m);
  assert.doesNotMatch(redirects, /^\/reward-access\s+\/reward-access\.html\s+200/m);
  assert.doesNotMatch(redirects, /^\/reward-access\/\s+\/reward-access\.html\s+200/m);
  assert.doesNotMatch(redirects, /^\/reward-access\.html\s+\/reward-access\.html\s+200/m);
  assert.doesNotMatch(redirects, /^\/telegram\S*\s+\/telegram\S*\s+30[1278]/m);
  assert.match(redirects, /Cloudflare Pages clean URLs already canonicalize \.html routes/i);
  assert.match(read('telegram/index.html'), /Fast Telegram gateway for EONAPP/);
});

test('W135 removes visible internal wave/debug wording and generic support misroute', () => {
  const publicCopy = [read('support.html'), read('tools.html'), read('assets/js/tool-page.js')].join('\n');
  assert.doesNotMatch(publicCopy, /W127 compatibility|Support \/ Tools \/ Footer cleanup|AI Tools Hub/);
  assert.match(read('support.html'), /data-support-generic="1">Ask EONBOT now/);
  assert.doesNotMatch(read('support.html'), /data-support-topic="bug-security">Ask EONBOT now/);
});

test('W135 repairs Hustle runtime null listener risk', () => {
  const html = read('hustle.html');
  for (const id of ['hh-grid', 'hh-empty', 'hh-cat-tabs', 'hh-search', 'hh-clear-search']) assert.match(html, new RegExp(`id="${id}"`));
  assert.match(html, /getElementById\('hh-cat-tabs'\)\?\.addEventListener/);
});

test('W135 makes EON City mobile first impression and Three.js material console safer', () => {
  assert.match(read('assets/css/realm3d.css'), /W135 live mobile first-impression rescue/);
  assert.match(read('assets/js/realm3d/engine/EonCitySession12PresentationRuntime.js'), /compactMobile && requested === 'guided'/);
  assert.match(read('assets/js/realm3d/engine/EonCityMaterialAtlas.js'), /if \(usePhysical\)/);
});

test('W135 protects API-key persistence across app updates', () => {
  const apiVault = read('assets/js/utils/api-key-vault.js');
  assert.match(apiVault, /stable random device secret/);
  assert.match(apiVault, /Legacy identity-derived passphrases/);
  assert.match(apiVault, /stableDeviceSecretPrimary/);
});

test('W135 gate stats report 100 score', () => {
  const statsPath = path.join(root, 'tmp', 'w135-live-hotfix-stats.json');
  fs.mkdirSync(path.join(root, 'tmp'), { recursive: true });
  execFileSync(process.execPath, [path.join(root, 'scripts', 'w135-live-hotfix-gate.mjs')], { cwd: root, stdio: 'ignore' });
  const stats = JSON.parse(fs.readFileSync(statsPath, 'utf8'));
  assert.equal(stats.schema, 'eonapp.w135.live-hotfix.v1');
  assert.equal(stats.ok, true);
  assert.equal(stats.score, 100);
});
