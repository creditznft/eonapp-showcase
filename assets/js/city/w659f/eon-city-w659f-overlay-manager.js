/** W659F — one active top-level City overlay and deterministic Escape close. */
export const EON_CITY_W659F_OVERLAY_MANAGER_SCHEMA = 'eon.city.w659f.overlay-manager.v1';
const freeze = (value) => Object.freeze(value);

export function createEonCityW659fOverlayManager({ onChange = null } = {}) {
  const stack = [];
  const emit = (reason) => { const snapshot = freeze({ schema: EON_CITY_W659F_OVERLAY_MANAGER_SCHEMA, stack: freeze([...stack]), top: stack.at(-1) || null, reason }); try { onChange?.(snapshot); } catch {} return snapshot; };
  return freeze({
    open(id = '') { const value = String(id || '').trim(); if (!value) return emit('invalid-open'); const previous = stack.indexOf(value); if (previous >= 0) stack.splice(previous, 1); stack.push(value); return emit('open'); },
    close(id = '') { const value = String(id || '').trim(); const index = value ? stack.lastIndexOf(value) : stack.length - 1; if (index >= 0) stack.splice(index, 1); return emit('close'); },
    escape() { if (stack.length) stack.pop(); return emit('escape'); },
    clear() { stack.length = 0; return emit('clear'); },
    getSnapshot() { return emit('snapshot'); }
  });
}
