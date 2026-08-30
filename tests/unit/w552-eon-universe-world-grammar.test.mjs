import assert from 'node:assert/strict';
import test from 'node:test';
import {
  EON_UNIVERSE_CITY_INTERACTIONS,
  EON_UNIVERSE_RENDER_PROFILES,
  EON_UNIVERSE_WORLD_GRAMMAR_SCHEMA,
  getEonUniverseCityInteraction,
  getEonUniverseRenderProfile,
  validateEonUniverseWorldGrammar
} from '../../assets/js/city/eon-universe-world-grammar.js';

test('W552 keeps the Command Horizon visual profile restrained and legible', () => {
  assert.equal(EON_UNIVERSE_WORLD_GRAMMAR_SCHEMA, 'eon.city.universe-world-grammar.w552.v1');
  assert.equal(validateEonUniverseWorldGrammar().ok, true);
  for (const quality of ['lite', 'balanced', 'cinematic']) {
    const profile = getEonUniverseRenderProfile({ quality });
    assert.equal(profile.quality, quality);
    assert.ok(profile.glowIntensity <= .34);
    assert.ok(profile.fogMultiplier <= 1);
    assert.equal(profile.remoteAssets, false);
  }
  assert.ok(EON_UNIVERSE_RENDER_PROFILES.cinematic.glowIntensity < .35);
});

test('W552 exposes finite review-first landmark interactions without private work or automatic routes', () => {
  assert.deepEqual(EON_UNIVERSE_CITY_INTERACTIONS.map((entry) => entry.id), ['command-centre', 'workshop', 'relay', 'archive', 'observatory']);
  const command = getEonUniverseCityInteraction('command-centre');
  assert.equal(command?.zone, 'Horizon Commons');
  assert.equal(command?.action.route, '/');
  assert.equal(command?.autoNavigation, false);
  assert.equal(getEonUniverseCityInteraction('vault-safehouse'), null);
  assert.doesNotMatch(JSON.stringify(EON_UNIVERSE_CITY_INTERACTIONS), /wallet|payment|token|reward|loot|referral|apiKey|https?:/i);
});
