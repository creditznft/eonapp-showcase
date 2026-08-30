export const EON_RADIO_SCHEMA = 'eonapp.creator.radio.v1';
export const EON_RADIO_STORAGE_KEY = 'eon:creator:radio-stations:v1';

function storage(target) { if (target?.getItem && target?.setItem) return target; try { return localStorage; } catch { return null; } }
function clean(value = '', max = 160) { return String(value || '').replace(/\s+/g, ' ').trim().slice(0, max); }
function read(target) { try { const parsed = JSON.parse(storage(target)?.getItem(EON_RADIO_STORAGE_KEY) || '[]'); return Array.isArray(parsed) ? parsed : []; } catch { return []; } }
function write(rows, target) { try { storage(target)?.setItem(EON_RADIO_STORAGE_KEY, JSON.stringify(rows.slice(0, 24))); return true; } catch { return false; } }

export function createEonRadioStation(input = {}, options = {}) {
  const name = clean(input.name || 'My EON Radio', 80);
  const prompt = clean(input.prompt || input.description || '', 360);
  if (!prompt) return Object.freeze({ ok: false, reason: 'station-description-required', station: null });
  const now = Number(options.now ?? Date.now());
  const station = Object.freeze({
    schema: EON_RADIO_SCHEMA,
    id: clean(input.id || `radio-${now}`),
    name,
    prompt,
    genres: Object.freeze((Array.isArray(input.genres) ? input.genres : []).map((value) => clean(value, 40)).filter(Boolean).slice(0, 8)),
    vocalPreference: clean(input.vocalPreference || 'mixed', 40),
    energy: Math.max(0, Math.min(1, Number(input.energy ?? 0.55))),
    sources: Object.freeze(['eon-generated', 'user-authorized']),
    commercialCatalogueAccess: false,
    memoryConsent: options.memoryConsent === true,
    createdAt: now,
    updatedAt: now
  });
  const rows = [station, ...read(options.storage).filter((row) => row?.id !== station.id)];
  const ok = write(rows, options.storage);
  return Object.freeze({ ok, reason: ok ? null : 'storage-unavailable', station });
}

export function listEonRadioStations(options = {}) {
  return Object.freeze(read(options.storage).filter((row) => row?.schema === EON_RADIO_SCHEMA).slice(0, Math.max(0, Math.min(Number(options.limit ?? 12), 24))).map(Object.freeze));
}

export function deleteEonRadioStation(id = '', options = {}) {
  const rows = read(options.storage); const next = rows.filter((row) => row?.id !== String(id));
  return next.length !== rows.length && write(next, options.storage);
}
