import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const runtime = read('assets/js/city/w731/eon-city-w731-command-hub-runtime.js');
const css = read('assets/css/eon-city-play.css');

test('RT88 World selector uses the supplied static vector art without delaying City boot', () => {
  const worlds = [
    ['signal-frontier', 'world-signal-frontier.svg'],
    ['storm-sector', 'world-storm-sector.svg'],
    ['my-frontier', 'world-my-frontier.svg']
  ];
  for (const [id, file] of worlds) {
    const asset = path.join(root, 'assets/city/art', file);
    assert.equal(fs.existsSync(asset), true, `${file} must be shipped`);
    assert.match(read(path.join('assets/city/art', file)), /<svg[\s>]/);
    assert.match(runtime, new RegExp(`data-eon-city-featured="${id}"[\\s\\S]{0,280}/assets/city/art/${file}`));
  }
  assert.match(runtime, /loading="lazy" decoding="async"/);
  assert.match(css, /object-fit:cover/);
  assert.match(css, /aspect-ratio:16\/7/);
});
