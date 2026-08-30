import { listEonAiMemory } from '../../ai-kernel/eon-ai-memory-ledger.js';

export const EON_RADIO_PREFERENCE_MEMORY_SCHEMA = 'eonapp.creator.radio-preference-memory.v1';

const freeze = (value) => Object.freeze(value);
const FINITE = freeze({
  genre: freeze(['ambient', 'electronic', 'house', 'techno', 'hip-hop', 'pop', 'rock', 'jazz', 'classical', 'cinematic', 'world', 'experimental']),
  vocals: freeze(['instrumental', 'mixed', 'vocal']),
  energy: freeze(['calm', 'balanced', 'high'])
});
const SIGNALS = freeze({ genre: 'radio-genre', vocals: 'radio-vocals', energy: 'radio-energy' });

function finiteValueFromTags(tags = [], signalId = '', allowed = []) {
  const normalized = [...new Set((Array.isArray(tags) ? tags : []).map((tag) => String(tag || '').trim().toLowerCase()).filter(Boolean))];
  if (!normalized.includes(signalId)) return '';
  return normalized.find((tag) => allowed.includes(tag)) || '';
}

/**
 * Reads only finite tags written by the structured-memory bridge. It never
 * parses arbitrary memory content, station prompts, model responses or media.
 */
export function readEonRememberedRadioPreferences(options = {}) {
  const cards = listEonAiMemory({ storage: options.storage, limit: 80, now: options.now });
  const result = { genre: '', vocals: '', energy: '' };
  for (const card of cards) {
    if (card?.kind !== 'preference' || card?.scope !== 'global') continue;
    for (const [field, signalId] of Object.entries(SIGNALS)) {
      if (result[field]) continue;
      const value = finiteValueFromTags(card.tags, signalId, FINITE[field]);
      if (value) result[field] = value;
    }
    if (result.genre && result.vocals && result.energy) break;
  }
  return freeze({
    schema: EON_RADIO_PREFERENCE_MEMORY_SCHEMA,
    genre: result.genre,
    vocals: result.vocals,
    energy: result.energy,
    finiteTagReadOnly: true,
    arbitraryContentParsed: false,
    stationPromptRead: false,
    mediaRead: false,
    externalActionPermission: false
  });
}

export function getEonRadioPreferenceMemoryTruth() {
  return freeze({
    schema: EON_RADIO_PREFERENCE_MEMORY_SCHEMA,
    supportedSignals: freeze(Object.values(SIGNALS)),
    finiteTagReadOnly: true,
    arbitraryContentParsed: false,
    stationPromptRead: false,
    mediaRead: false,
    externalActionPermission: false,
    automaticModelTraining: false
  });
}

export default freeze({ EON_RADIO_PREFERENCE_MEMORY_SCHEMA, readEonRememberedRadioPreferences, getEonRadioPreferenceMemoryTruth });
