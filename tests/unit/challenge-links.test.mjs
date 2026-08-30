import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createContext, runInContext } from 'node:vm';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = join(__dirname, '../../assets/js/games/challenge-links.js');

function makeModule(options = {}) {
  const now = options.now || Date.now();
  const src = readFileSync(SRC, 'utf8').replace(/^export (const|let|var|function|async function|class) /gm, '$1 ');
  const exportedNames = [...readFileSync(SRC, 'utf8').matchAll(/^export (?:const|let|var|function|async function|class) (\w+)/gm)]
    .map((m) => m[1]);
  const suffix = exportedNames.map((n) => `exports.${n} = ${n};`).join('\n');

  const ctx = createContext({
    Date: class extends Date {
      static now() { return now; }
    },
    JSON,
    Math,
    Number,
    String,
    Boolean,
    Object,
    Array,
    URL,
    URLSearchParams,
    TextEncoder,
    TextDecoder,
    Uint8Array,
    btoa: (input) => Buffer.from(input, 'binary').toString('base64'),
    atob: (input) => Buffer.from(input, 'base64').toString('binary'),
  });

  const wrapped = `const exports = {};\n${src}\n${suffix}\nexports`;
  return runInContext(wrapped, ctx);
}

describe('challenge-links', () => {
  it('round-trips challenge payload and validates signature', () => {
    const mod = makeModule({ now: 1000 });
    const encoded = mod.encodeChallengePayload({ v: 1, g: 'neon-siege', mapId: 'ALPHA', score: 1200, wave: 9, ts: 1000 });
    const decoded = mod.decodeChallengePayload(encoded, { expectedGame: 'neon-siege', expectedVersion: 1, maxAgeMs: 5000 });

    assert.ok(decoded);
    assert.equal(decoded.g, 'neon-siege');
    assert.equal(decoded.score, 1200);
    assert.equal(decoded.wave, 9);
  });

  it('rejects tampered payloads', () => {
    const mod = makeModule({ now: 5000 });
    const encoded = mod.encodeChallengePayload({ v: 1, g: 'neon-siege', mapId: 'ALPHA', score: 3000, wave: 12, ts: 5000 });
    const tampered = encoded.slice(0, -2) + 'ab';
    const decoded = mod.decodeChallengePayload(tampered, { expectedGame: 'neon-siege', expectedVersion: 1, maxAgeMs: 5000 });

    assert.equal(decoded, null);
  });

  it('rejects payloads outside max age', () => {
    const mod = makeModule({ now: 10_000 });
    const encoded = mod.encodeChallengePayload({ v: 1, g: 'neon-conquest', score: 100, ts: 0 });
    const decoded = mod.decodeChallengePayload(encoded, { expectedGame: 'neon-conquest', expectedVersion: 1, maxAgeMs: 1000 });

    assert.equal(decoded, null);
  });

  it('builds and parses URL challenge parameters', () => {
    const mod = makeModule({ now: 42_000 });
    const url = mod.buildChallengeUrl('https://eonapp.ch/games/neon-siege/', {
      v: 1,
      g: 'neon-siege',
      mapId: 'BETA',
      score: 7654,
      wave: 19,
      ts: 42_000,
    });

    const parsed = mod.parseChallengeFromUrl(url, {
      expectedGame: 'neon-siege',
      expectedVersion: 1,
      maxAgeMs: 60_000,
      param: 'challenge',
    });

    assert.ok(parsed);
    assert.equal(parsed.mapId, 'BETA');
    assert.equal(parsed.score, 7654);
  });
});
