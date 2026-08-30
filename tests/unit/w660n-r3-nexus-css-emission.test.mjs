import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const stylesheets = [
  {
    relative: 'assets/css/eon-nexus-pulse.css',
    selector: '.eon-nexus-pulse',
    runtime: 'assets/js/nexus/eon-nexus-app-shell.js'
  },
  {
    relative: 'assets/css/eon-nexus-live.css',
    selector: '.eon-nexus-live',
    runtime: 'assets/js/nexus/eon-nexus-live.js'
  }
];

test('W660N-R3 emits the runtime Nexus stylesheets as CSS assets', () => {
  for (const stylesheet of stylesheets) {
    const source = path.join(root, stylesheet.relative);
    const emitted = path.join(root, 'dist', stylesheet.relative);
    const runtime = fs.readFileSync(path.join(root, stylesheet.runtime), 'utf8');

    assert.equal(fs.existsSync(source), true, `source missing: ${stylesheet.relative}`);
    assert.equal(fs.existsSync(emitted), true, `dist missing: ${stylesheet.relative}`);
    assert.match(fs.readFileSync(source, 'utf8'), new RegExp(stylesheet.selector.replace('.', '\\.'), 'i'));

    const contents = fs.readFileSync(emitted, 'utf8');
    assert.match(contents, new RegExp(stylesheet.selector.replace('.', '\\.'), 'i'));
    assert.doesNotMatch(contents, /^\s*<!doctype html/i);
    assert.doesNotMatch(contents, /<title>[^<]*404/i);
    assert.match(runtime, new RegExp(`['\"]/${stylesheet.relative.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['\"]`));
  }
});
