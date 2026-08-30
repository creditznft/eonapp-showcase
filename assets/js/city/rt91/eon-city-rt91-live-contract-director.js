/**
 * RT91 live repeatable-contract offers.
 * One deterministic offer per flagship world for the current cycle. No timer,
 * no network, no streak/FOMO and no reward/progression authority.
 */
import { generateEonCityRt91DeterministicContract } from './eon-city-rt91-deterministic-contract-generator.js';
import { normalizeEonCityRt91ActivityHistory } from './eon-city-rt91-anti-repetition.js';
import { buildEonCityRt91SignalContractCells } from './signal/eon-city-rt91-signal-contract-cells.js';
import { buildEonCityRt91StormContractCells } from './storm/eon-city-rt91-storm-contract-cells.js';
import { buildEonCityRt91MyFrontierContractCells } from './my-frontier/eon-city-rt91-my-frontier-contract-cells.js';

export const EON_CITY_RT91_LIVE_CONTRACT_DIRECTOR_SCHEMA = 'eon.city.live-contract-director.rt91.v1';
const freeze = Object.freeze;
const WORLDS = freeze(['signal-frontier', 'storm-sector', 'my-frontier']);
const CELL_PLANS = freeze({
  'signal-frontier': buildEonCityRt91SignalContractCells(),
  'storm-sector': buildEonCityRt91StormContractCells(),
  'my-frontier': buildEonCityRt91MyFrontierContractCells()
});

function cycleFor(at = Date.now()) {
  const date = new Date(Number(at) || Date.now());
  return Number.isFinite(date.getTime()) ? date.toISOString().slice(0, 10) : 'default';
}
function historySignature(history = []) {
  return normalizeEonCityRt91ActivityHistory(history).map((row) => `${row.familyId}:${row.regionId}:${row.zoneId}:${row.objectiveSignature}`).join('|');
}

export function createEonCityRt91LiveContractDirector({ worldSeed = 'eoncity-living-frontier', now = () => Date.now(), getHistory = () => [] } = {}) {
  let cacheKey = '';
  let cache = freeze([]);
  const build = (at = now()) => {
    const cycleKey = cycleFor(at);
    const history = normalizeEonCityRt91ActivityHistory(getHistory?.() || []);
    const key = `${String(worldSeed).slice(0, 80)}:${cycleKey}:${historySignature(history)}`;
    if (key === cacheKey) return cache;
    const offers = [];
    for (const [index, worldId] of WORLDS.entries()) {
      const cells = CELL_PLANS[worldId]?.cells || [];
      const generated = generateEonCityRt91DeterministicContract({
        worldId,
        worldSeed,
        cycleKey,
        contractIndex: index,
        history,
        candidateCells: cells
      });
      if (generated?.ok) offers.push(freeze({ ...generated, cycleKey, offerIndex: index, status: 'available', missingCycleLosesProgress: false, streakRequired: false, penaltyForSkipping: false }));
    }
    cacheKey = key;
    cache = freeze(offers);
    return cache;
  };
  return freeze({
    schema: EON_CITY_RT91_LIVE_CONTRACT_DIRECTOR_SCHEMA,
    getOffers: ({ at = now() } = {}) => build(at),
    getCycleKey: (at = now()) => cycleFor(at),
    invalidate: () => { cacheKey = ''; cache = freeze([]); return freeze({ ok: true }); },
    offerCount: 3,
    ownsTimer: false,
    ownsNetwork: false,
    awardsXp: false,
    writesProgression: false,
    runtimeAiRequired: false,
    missingCycleLosesProgress: false,
    streakRequired: false,
    penaltyForSkipping: false
  });
}

export default freeze({ EON_CITY_RT91_LIVE_CONTRACT_DIRECTOR_SCHEMA, createEonCityRt91LiveContractDirector });
