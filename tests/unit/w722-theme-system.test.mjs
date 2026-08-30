import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { EON_THEME_OPTIONS, normalizeEonTheme } from '../../assets/js/utils/storage.js';

test('W722 ships three genuinely different non-blue/non-purple dark themes', () => {
  assert.deepEqual([...EON_THEME_OPTIONS], ['graphite', 'obsidian', 'ember']);
  assert.equal(normalizeEonTheme('neon-night'), 'graphite');
  const css = fs.readFileSync(new URL('../../assets/css/eon-app-shell.css', import.meta.url), 'utf8');
  assert.match(css, /html\[data-theme="ember"\]/);
  assert.doesNotMatch(css.slice(css.indexOf('html[data-theme="graphite"]'), css.indexOf('body[data-eon-app-shell="1"]')), /#(?:6366f1|a78bfa|9f92ff|38d9ff|101027|161337)/i);
});

test('W722 bootstrap migrates Neon Night safely before paint', () => {
  const bootstrap = fs.readFileSync(new URL('../../assets/js/eon-theme-bootstrap.js', import.meta.url), 'utf8');
  assert.match(bootstrap, /'neon-night': 'graphite'/);
  assert.match(bootstrap, /\['graphite', 'obsidian', 'ember'\]/);
});


test('W722 applies one pre-paint theme authority across current launch documents', () => {
  const root = new URL('../../', import.meta.url);
  const htmlFiles = fs.readdirSync(root).filter((file) => file.endsWith('.html'));
  const themed = htmlFiles.filter((file) => fs.readFileSync(new URL(`../../${file}`, import.meta.url), 'utf8').includes('eon-theme-bootstrap.js'));
  assert.ok(themed.length >= 26);
  for (const file of themed) {
    const html = fs.readFileSync(new URL(`../../${file}`, import.meta.url), 'utf8');
    assert.match(html, /eon-theme-bootstrap\.js\?release=w722-2026-07-27/);
    const themeColor = html.match(/<meta name="theme-color" content="([^"]+)"/i)?.[1] || '';
    if (themeColor) assert.doesNotMatch(themeColor, /(?:1d4ed8|6366f1|a78bfa|9f92ff|38d9ff)/i, file);
  }
});
