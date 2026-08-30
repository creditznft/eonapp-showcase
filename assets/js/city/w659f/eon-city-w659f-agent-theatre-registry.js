/** W659F — truthful Agent Theatre state normalization. */
export const EON_CITY_W659F_AGENT_THEATRE_SCHEMA = 'eon.city.w659f.agent-theatre.v1';
export const EON_CITY_W659F_AGENT_STATES = Object.freeze(['idle', 'queued', 'running', 'waiting', 'completed', 'failed']);
const freeze = (value) => Object.freeze(value);

export function normalizeEonCityW659fAgentSignal(value = {}) {
  const raw = String(value.status || value.state || 'idle').trim().toLowerCase();
  const status = EON_CITY_W659F_AGENT_STATES.includes(raw) ? raw : 'idle';
  const id = String(value.id || value.agentId || value.jobId || 'unidentified').slice(0, 96);
  return freeze({ id, status, label: String(value.label || value.name || id).slice(0, 120), observedAt: Number(value.observedAt || value.updatedAt || Date.now()), source: String(value.source || 'local-observed-signal').slice(0, 80), detailAvailable: Boolean(value.detailAvailable || value.route || value.receiptId), route: value.route ? String(value.route).slice(0, 180) : null, receiptId: value.receiptId ? String(value.receiptId).slice(0, 120) : null, progress: status === 'running' && Number.isFinite(Number(value.progress)) ? Math.min(1, Math.max(0, Number(value.progress))) : null, fabricatedProgress: false, localOnly: true });
}

export function createEonCityW659fAgentTheatreRegistry() {
  let signals = freeze([]);
  return freeze({
    replace(values = []) { signals = freeze((Array.isArray(values) ? values : []).map(normalizeEonCityW659fAgentSignal)); return this.getSnapshot(); },
    getSnapshot() {
      const counts = Object.fromEntries(EON_CITY_W659F_AGENT_STATES.map((state) => [state, signals.filter((entry) => entry.status === state).length]));
      return freeze({ schema: EON_CITY_W659F_AGENT_THEATRE_SCHEMA, signals, counts: freeze(counts), activeCount: counts.queued + counts.running + counts.waiting, fabricatedProgress: false, autoExecution: false, privateContentVisible: false, localOnly: true });
    }
  });
}
