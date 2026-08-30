import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createContext, runInContext } from 'node:vm';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ENTS_SRC = join(__dirname, '../../assets/js/utils/entitlements.js');
const SUB_SRC  = join(__dirname, '../../assets/js/utils/subscription.js');

function makeModule(lsData = {}) {
  const ls = { ...lsData };
  const localStorage = {
    getItem:    (k) => ls[k] ?? null,
    setItem:    (k, v) => { ls[k] = String(v); },
    removeItem: (k) => { delete ls[k]; }
  };

  const ctx = createContext({
    Date, Array, Object, String, Number, Boolean, Math, JSON, Map, Set,
    localStorage,
    window: { DEBUG: false },
    getProfile: () => {
      try {
        return JSON.parse(localStorage.getItem('eon:profile') || localStorage.getItem('eon:profile:v1') || 'null');
      } catch {
        return null;
      }
    },
    isAdminProfile: (profile = null) => Boolean(
      profile?.isAdmin
      || String(profile?.role || '').trim().toLowerCase() === 'operator'
      || (Array.isArray(profile?.roles) && profile.roles.map((value) => String(value || '').trim().toLowerCase()).includes('operator'))
    )
  });

  // Entitlements source — strip export keywords, expose all exports
  const entsSrc = readFileSync(ENTS_SRC, 'utf8')
    .replace(/^import\s+.*?from\s+['"].*?['"];?\s*$/gm, '')
    .replace(/^export (const|let|var|function|async function|class) /gm, '$1 ');
  const entsExports = [...readFileSync(ENTS_SRC, 'utf8')
    .matchAll(/^export (?:const|let|var|function|async function|class) (\w+)/gm)]
    .map((m) => m[1]);
  const entsSuffix = entsExports.map((n) => `exports.${n} = ${n};`).join('\n');

  // Subscription source — strip import + export keywords, expose all exports
  const subSrc = readFileSync(SUB_SRC, 'utf8')
    .replace(/^import\s+\{[^}]+\}\s+from\s+'[^']+';?\s*/gm, '') // strip import line
    .replace(/const rootScope = \/\*\* @type \{any\} \*\/ \(globalThis\);/g, 'const subRootScope = /** @type {any} */ (globalThis);')
    .replace(/\brootScope\./g, 'subRootScope.')
    .replace(/^export (const|let|var|function|async function|class) /gm, '$1 ');
  const subExports = [...readFileSync(SUB_SRC, 'utf8')
    .matchAll(/^export (?:const|let|var|function|async function|class) (\w+)/gm)]
    .map((m) => m[1]);
  const subSuffix = subExports.map((n) => `exports.${n} = ${n};`).join('\n');

  const wrapped =
    `const exports = {};\n${entsSrc}\n${entsSuffix}\n${subSrc}\n${subSuffix}\nif (typeof FEATURE_GATES !== 'undefined') exports.FEATURE_GATES = FEATURE_GATES;\nexports`;
  return runInContext(wrapped, ctx);
}

const mod = makeModule();

describe('subscription — FEATURE_GATES', () => {
  it('is an object with feature keys', () => {
    assert.ok(typeof mod.FEATURE_GATES === 'object');
    assert.ok(Object.keys(mod.FEATURE_GATES).length > 10);
  });

  it('games:play-all is free', () => {
    assert.equal(mod.FEATURE_GATES['games:play-all'], 'free');
  });

  it('games:tournament-entry requires pro', () => {
    assert.equal(mod.FEATURE_GATES['games:tournament-entry'], 'pro');
  });

  it('vault:priority-epoch requires operator', () => {
    assert.equal(mod.FEATURE_GATES['vault:priority-epoch'], 'operator');
  });

  it('tools:batch-mode requires builder', () => {
    assert.equal(mod.FEATURE_GATES['tools:batch-mode'], 'builder');
  });
});

describe('subscription — getRequiredPlanFor', () => {
  it('returns the minimum plan for a known feature', () => {
    assert.equal(mod.getRequiredPlanFor('games:play-all'), 'free');
    assert.equal(mod.getRequiredPlanFor('games:tournament-entry'), 'pro');
  });

  it('returns null for unknown feature', () => {
    assert.equal(mod.getRequiredPlanFor('unknown:feature'), null);
  });

  it('returns null for empty string', () => {
    assert.equal(mod.getRequiredPlanFor(''), null);
  });
});

describe('subscription — getUpgradePrompt', () => {
  it('returns null for free feature', () => {
    assert.equal(mod.getUpgradePrompt('games:play-all'), null);
  });

  it('returns null for unknown feature', () => {
    assert.equal(mod.getUpgradePrompt('unknown:feature'), null);
  });

  it('returns upgrade prompt object for paid feature', () => {
    const prompt = mod.getUpgradePrompt('games:tournament-entry');
    assert.ok(prompt !== null);
    assert.ok(typeof prompt.planLabel === 'string');
    assert.ok(typeof prompt.price === 'string');
    assert.ok(typeof prompt.message === 'string');
    assert.ok(prompt.message.includes('Upgrade to'));
  });

  it('prompt planId matches required plan', () => {
    const prompt = mod.getUpgradePrompt('games:tournament-entry');
    assert.equal(prompt.planId, 'pro');
  });
});

describe('subscription — getAllPlans', () => {
  it('returns an array of plans', () => {
    const plans = mod.getAllPlans();
    assert.ok(Array.isArray(plans));
    assert.ok(plans.length >= 5);
  });

  it('includes free plan', () => {
    const plans = mod.getAllPlans();
    const free = plans.find((p) => p.id === 'free');
    assert.ok(free, 'free plan not found');
  });

  it('includes pro plan', () => {
    const plans = mod.getAllPlans();
    const pro = plans.find((p) => p.id === 'pro');
    assert.ok(pro, 'pro plan not found');
  });
});

describe('subscription — getStoredLicenseCode', () => {
  it('returns null when localStorage is empty', () => {
    assert.equal(mod.getStoredLicenseCode(), null);
  });

  it('returns stored code when present', () => {
    const modWithCode = makeModule({ 'eon-license-code': 'TESTCODE123' });
    assert.equal(modWithCode.getStoredLicenseCode(), 'TESTCODE123');
  });

  it('returns null when stored code is empty string', () => {
    const modWithEmpty = makeModule({ 'eon-license-code': '' });
    assert.equal(modWithEmpty.getStoredLicenseCode(), null);
  });

  it('trims whitespace from stored code', () => {
    const modWithPadded = makeModule({ 'eon-license-code': '  TESTCODE123  ' });
    assert.equal(modWithPadded.getStoredLicenseCode(), 'TESTCODE123');
  });
});

describe('subscription — social video quotas', () => {
  it('returns plan-based monthly limits for video platforms', () => {
    assert.equal(mod.getSocialVideoUploadLimit('free'), 5);
    assert.equal(mod.getSocialVideoUploadLimit('builder'), 30);
    assert.equal(mod.getSocialVideoUploadLimit('pro'), 80);
    assert.equal(mod.isSocialVideoUploadPlatform('youtube'), true);
    assert.equal(mod.isSocialVideoUploadPlatform('discord'), false);
  });

  it('tracks monthly upload usage per platform', () => {
    const quotaMod = makeModule();
    const before = quotaMod.canUseSocialVideoUpload('youtube');
    assert.equal(before.ok, true);
    assert.equal(before.limit, 5);
    assert.equal(before.used, 0);

    const recorded = quotaMod.recordSocialVideoUpload('youtube');
    assert.equal(recorded.ok, true);
    assert.equal(recorded.recorded, true);
    assert.equal(recorded.used, 1);

    const after = quotaMod.canUseSocialVideoUpload('youtube');
    assert.equal(after.used, 1);
    assert.equal(after.remaining, 4);
  });
});
