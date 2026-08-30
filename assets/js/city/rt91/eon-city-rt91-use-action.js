/** RT91 — one semantic Use intent across keyboard, touch and controller. */
import { resolveEonCityW719KeyboardCode } from '../w719/eon-city-w719-input-authority.js';

export const EON_CITY_RT91_USE_ACTION_SCHEMA = 'eon.city.use-action.rt91.v1';
const freeze = Object.freeze;

function editableTarget(target = null) {
  const tag = String(target?.tagName || '').toLowerCase();
  return Boolean(target?.isContentEditable || ['input', 'textarea', 'select', 'option'].includes(tag));
}

export function resolveEonCityRt91UseIntent({
  source = 'keyboard',
  event = {},
  action = '',
  inputLocked = false,
  modalOpen = false,
  modalOwnsAction = false
} = {}) {
  const sourceId = ['keyboard', 'touch', 'controller'].includes(String(source)) ? String(source) : 'keyboard';
  const keyboardCode = sourceId === 'keyboard' ? resolveEonCityW719KeyboardCode(event) : '';
  const repeated = event?.repeat === true;
  const editable = sourceId === 'keyboard' && editableTarget(event?.target);
  const semanticAction = sourceId === 'keyboard' ? (keyboardCode === 'KeyE' ? 'interact' : '') : String(action || '');
  let reason = 'accepted';
  if (semanticAction !== 'interact') reason = 'not-use-action';
  else if (repeated) reason = 'repeat-suppressed';
  else if (editable) reason = 'editable-target';
  else if (inputLocked) reason = 'input-locked';
  else if (modalOpen && !modalOwnsAction) reason = 'modal-owns-input';
  const accepted = reason === 'accepted';
  return freeze({
    schema: EON_CITY_RT91_USE_ACTION_SCHEMA,
    accepted,
    reason,
    source: sourceId,
    semanticAction: accepted ? 'interact' : '',
    keyboardCode,
    explicitUserAction: accepted,
    repeatSuppressed: repeated,
    editableTargetSuppressed: editable,
    awardsProgression: false,
    autoCompletesObjective: false,
    autoNavigatesPlayer: false
  });
}

export function validateEonCityRt91UseIntent(intent = resolveEonCityRt91UseIntent({ event: { code: 'KeyE' } })) {
  const errors = [];
  if (intent.schema !== EON_CITY_RT91_USE_ACTION_SCHEMA) errors.push('schema');
  if (intent.accepted && (intent.semanticAction !== 'interact' || intent.explicitUserAction !== true)) errors.push('accepted-shape');
  if (intent.awardsProgression || intent.autoCompletesObjective || intent.autoNavigatesPlayer) errors.push('authority');
  return freeze({ ok: errors.length === 0, errors: freeze(errors) });
}

export default freeze({ EON_CITY_RT91_USE_ACTION_SCHEMA, resolveEonCityRt91UseIntent, validateEonCityRt91UseIntent });
