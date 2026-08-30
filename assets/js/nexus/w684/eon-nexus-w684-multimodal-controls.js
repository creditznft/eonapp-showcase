/**
 * W684 — real work-object manipulation and multimodal controls.
 *
 * Mouse, touch, keyboard and typed/voice transcripts are primary. Optional
 * camera gestures are local-only, explicitly enabled and require an injected
 * local detector. This module never downloads a detector, starts work, follows
 * a route, approves an action or persists private layout data.
 */

export const EON_NEXUS_W684_INTERACTION_SCHEMA = 'eon.nexus.multimodal-controls.w684.v1';
export const EON_NEXUS_W684_LAYOUT_HISTORY_LIMIT = 24;
export const EON_NEXUS_W684_GESTURE_CONFIDENCE = 0.82;
export const EON_NEXUS_W684_GESTURE_COOLDOWN_MS = 650;

const freeze = (value) => Object.freeze(value);
const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, Number(value) || 0));
const cleanId = (value = '') => String(value || '').replace(/[^a-zA-Z0-9:_-]/g, '').slice(0, 140);
const cleanText = (value = '', max = 180) => String(value || '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);

function clone(value) {
  return JSON.parse(JSON.stringify(value || {}));
}

function normalizeOverride(value = {}) {
  return {
    x: Number.isFinite(Number(value.x)) ? clamp(value.x, 7, 93) : undefined,
    y: Number.isFinite(Number(value.y)) ? clamp(value.y, 7, 93) : undefined,
    z: Number.isFinite(Number(value.z)) ? clamp(value.z, -4, 6) : undefined,
    parked: value.parked === true,
    groupId: cleanId(value.groupId),
    compared: value.compared === true
  };
}

function normalizeState(value = {}) {
  const layoutOverrides = {};
  for (const [id, override] of Object.entries(value.layoutOverrides || {})) {
    const safeId = cleanId(id);
    if (safeId) layoutOverrides[safeId] = normalizeOverride(override);
  }
  return {
    schema: EON_NEXUS_W684_INTERACTION_SCHEMA,
    selectedObjectId: cleanId(value.selectedObjectId),
    selectedObjectIds: [...new Set((Array.isArray(value.selectedObjectIds) ? value.selectedObjectIds : []).map(cleanId).filter(Boolean))].slice(0, 10),
    layoutOverrides,
    compareIds: [...new Set((Array.isArray(value.compareIds) ? value.compareIds : []).map(cleanId).filter(Boolean))].slice(0, 2),
    activeGroupId: cleanId(value.activeGroupId),
    view: {
      rotation: clamp(value.view?.rotation, -180, 180),
      zoom: clamp(value.view?.zoom || 1, 0.78, 1.18),
      expanded: value.view?.expanded === true
    },
    gestureMode: value.gestureMode === 'active' ? 'active' : value.gestureMode === 'unavailable' ? 'unavailable' : 'off',
    gestureReason: cleanText(value.gestureReason, 140),
    lastCommand: cleanText(value.lastCommand, 180),
    revision: Math.max(0, Number(value.revision) || 0)
  };
}

function stateReceipt(state, extra = {}) {
  const normalized = normalizeState(state);
  const compared = new Set(normalized.compareIds);
  for (const [id, override] of Object.entries(normalized.layoutOverrides)) override.compared = compared.has(id);
  return freeze({ ...normalized, ...extra, layoutOverrides: freeze(normalized.layoutOverrides), selectedObjectIds: freeze(normalized.selectedObjectIds), compareIds: freeze(normalized.compareIds), view: freeze(normalized.view) });
}

function commandReceipt(ok, reason, action = '', payload = {}) {
  return freeze({ ok, reason, action, payload: freeze({ ...payload }), explicitUserActionRequired: true, autoExecute: false, autoNavigate: false, autoApprove: false });
}

export function interpretEonNexusW684VoiceCommand(text = '', objects = []) {
  const input = cleanText(text, 220).toLowerCase();
  if (!input) return commandReceipt(false, 'empty-command');
  const rows = Array.isArray(objects) ? objects : [];
  const findObject = (query = '') => {
    const target = cleanText(query, 100).toLowerCase();
    return rows.find((object) => String(object.id || '').toLowerCase() === target)
      || rows.find((object) => String(object.kind || '').toLowerCase() === target)
      || rows.find((object) => String(object.label || '').toLowerCase().includes(target));
  };

  if (/^(undo|go back)$/.test(input)) return commandReceipt(true, null, 'undo');
  if (/^(redo|go forward)$/.test(input)) return commandReceipt(true, null, 'redo');
  if (/^(reset|reset layout|overview)$/.test(input)) return commandReceipt(true, null, 'reset-layout');
  if (/^(expand|full screen|open field)$/.test(input)) return commandReceipt(true, null, 'expand-view');
  if (/^(collapse|split view|close field)$/.test(input)) return commandReceipt(true, null, 'collapse-view');
  if (/^(compare|compare selected)$/.test(input)) return commandReceipt(true, null, 'toggle-compare');
  if (/^(group|group selected)$/.test(input)) return commandReceipt(true, null, 'group-selected');
  if (/^(park|park selected)$/.test(input)) return commandReceipt(true, null, 'park-selected');
  if (/^(restore|restore selected)$/.test(input)) return commandReceipt(true, null, 'restore-selected');
  if (/^open atlas$/.test(input)) return commandReceipt(true, null, 'request-atlas');
  if (/^(enter city|open city|spatial nexus)$/.test(input)) return commandReceipt(true, null, 'request-city');
  if (/^(activate|open|continue)$/.test(input)) return commandReceipt(true, null, 'request-primary');

  const selectMatch = input.match(/^(?:select|focus|inspect)\s+(.+)$/);
  if (selectMatch) {
    const object = findObject(selectMatch[1]);
    return object ? commandReceipt(true, null, 'select', { objectId: object.id }) : commandReceipt(false, 'object-not-found');
  }
  const moveMatch = input.match(/^(?:move|nudge)(?:\s+(.+?))?\s+(left|right|up|down)(?:\s+(\d+))?$/);
  if (moveMatch) {
    const object = moveMatch[1] ? findObject(moveMatch[1]) : null;
    if (moveMatch[1] && !object) return commandReceipt(false, 'object-not-found');
    const distance = clamp(Number(moveMatch[3] || 4), 1, 20);
    const delta = { left: [-distance, 0], right: [distance, 0], up: [0, -distance], down: [0, distance] }[moveMatch[2]];
    return commandReceipt(true, null, 'move', { objectId: object?.id || '', deltaX: delta[0], deltaY: delta[1] });
  }
  return commandReceipt(false, 'command-not-recognized');
}

export function interpretEonNexusW684GestureFrame(frame = {}, {
  now = Date.now(),
  lastAcceptedAt = 0,
  confidenceMinimum = EON_NEXUS_W684_GESTURE_CONFIDENCE,
  cooldownMs = EON_NEXUS_W684_GESTURE_COOLDOWN_MS
} = {}) {
  const gesture = cleanText(frame.gesture, 60).toLowerCase().replace(/[ _]+/g, '-');
  const confidence = clamp(frame.confidence, 0, 1);
  const heldMs = Math.max(0, Number(frame.heldMs) || 0);
  if (frame.localOnly !== true) return commandReceipt(false, 'gesture-must-be-local');
  if (confidence < confidenceMinimum) return commandReceipt(false, 'gesture-confidence-too-low', '', { confidence });
  if (Number(now) - Number(lastAcceptedAt || 0) < cooldownMs) return commandReceipt(false, 'gesture-cooldown-active');

  if (gesture === 'open-palm' && heldMs >= 280) return commandReceipt(true, null, 'reset-layout', { gesture, confidence });
  if (['point', 'point-pinch', 'pinch'].includes(gesture)) {
    const objectId = cleanId(frame.objectId);
    return objectId ? commandReceipt(true, null, 'select', { gesture, confidence, objectId }) : commandReceipt(false, 'gesture-target-required');
  }
  if (gesture === 'pinch-drag' && (Math.abs(Number(frame.deltaX) || 0) + Math.abs(Number(frame.deltaY) || 0)) > 0) {
    const objectId = cleanId(frame.objectId);
    if (!objectId) return commandReceipt(false, 'gesture-target-required');
    return commandReceipt(true, null, 'move', { gesture, confidence, objectId, deltaX: clamp(frame.deltaX, -12, 12), deltaY: clamp(frame.deltaY, -12, 12) });
  }
  if (gesture === 'two-hand-spread' && heldMs >= 220) return commandReceipt(true, null, 'expand-view', { gesture, confidence });
  if (gesture === 'wrist-rotation') return commandReceipt(true, null, 'rotate-view', { gesture, confidence, delta: clamp(frame.rotationDelta, -24, 24) });
  if (gesture === 'closed-hand' && heldMs >= 650) return commandReceipt(true, null, 'park-selected', { gesture, confidence });
  return commandReceipt(false, 'gesture-not-stable');
}

export function createEonNexusW684InteractionController({ initialState = {}, onChange = null } = {}) {
  let state = normalizeState(initialState);
  const undoStack = [];
  let redoStack = [];
  let moveTransaction = null;
  let groupSequence = 0;
  let objectIds = new Set();
  let basePositions = new Map();
  const listeners = new Set();

  const emit = (reason = 'interaction-change') => {
    state.revision += 1;
    state.lastCommand = reason;
    const receipt = stateReceipt(state, { reason });
    try { onChange?.(receipt); } catch {}
    for (const listener of listeners) {
      try { listener(receipt); } catch {}
    }
    return receipt;
  };
  const snapshotForHistory = () => clone({
    selectedObjectId: state.selectedObjectId,
    selectedObjectIds: state.selectedObjectIds,
    layoutOverrides: state.layoutOverrides,
    compareIds: state.compareIds,
    activeGroupId: state.activeGroupId,
    view: state.view
  });
  const pushHistory = () => {
    undoStack.push(snapshotForHistory());
    if (undoStack.length > EON_NEXUS_W684_LAYOUT_HISTORY_LIMIT) undoStack.shift();
    redoStack = [];
  };
  const restoreHistory = (value, reason) => {
    const gestureState = { gestureMode: state.gestureMode, gestureReason: state.gestureReason, revision: state.revision };
    state = normalizeState({ ...value, ...gestureState });
    return emit(reason);
  };
  const ensureOverride = (id) => {
    const safeId = cleanId(id || state.selectedObjectId);
    if (!safeId || (objectIds.size && !objectIds.has(safeId))) return null;
    if (!state.layoutOverrides[safeId]) {
      const base = basePositions.get(safeId) || {};
      state.layoutOverrides[safeId] = normalizeOverride({ x: base.x, y: base.y, z: base.z });
    }
    return state.layoutOverrides[safeId];
  };

  const api = {
    getState: () => stateReceipt(state, { canUndo: undoStack.length > 0, canRedo: redoStack.length > 0 }),
    subscribe(listener) {
      if (typeof listener !== 'function') return () => {};
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    reconcile(objects = []) {
      const rows = Array.isArray(objects) ? objects : [];
      objectIds = new Set(rows.map((object) => cleanId(object.id)).filter(Boolean));
      basePositions = new Map(rows.map((object) => [cleanId(object.id), { x: Number(object.x), y: Number(object.y), z: Number(object.z) }]));
      for (const id of Object.keys(state.layoutOverrides)) if (!objectIds.has(id)) delete state.layoutOverrides[id];
      state.selectedObjectIds = state.selectedObjectIds.filter((id) => objectIds.has(id));
      state.compareIds = state.compareIds.filter((id) => objectIds.has(id));
      if (state.selectedObjectId && !objectIds.has(state.selectedObjectId)) state.selectedObjectId = '';
      return api.getState();
    },
    select(id, { additive = false } = {}) {
      const safeId = cleanId(id);
      if (!safeId || (objectIds.size && !objectIds.has(safeId))) return commandReceipt(false, 'object-not-found');
      if (!additive) state.selectedObjectIds = [safeId];
      else state.selectedObjectIds = state.selectedObjectIds.includes(safeId) ? state.selectedObjectIds.filter((entry) => entry !== safeId) : [...state.selectedObjectIds, safeId].slice(-10);
      state.selectedObjectId = safeId;
      return emit('select-object');
    },
    beginMove(id) {
      const safeId = cleanId(id || state.selectedObjectId);
      const override = ensureOverride(safeId);
      if (!override) return commandReceipt(false, 'object-not-found');
      moveTransaction = { id: safeId, before: snapshotForHistory() };
      state.selectedObjectId = safeId;
      return stateReceipt(state, { reason: 'move-started' });
    },
    moveTo(id, x, y, z = undefined, { commit = true } = {}) {
      const safeId = cleanId(id || state.selectedObjectId);
      const override = ensureOverride(safeId);
      if (!override) return commandReceipt(false, 'object-not-found');
      if (!moveTransaction && commit) pushHistory();
      override.x = clamp(x, 7, 93);
      override.y = clamp(y, 7, 93);
      if (Number.isFinite(Number(z))) override.z = clamp(z, -4, 6);
      state.selectedObjectId = safeId;
      if (!commit) return stateReceipt(state, { reason: 'move-preview' });
      return emit('move-object');
    },
    moveBy(id, deltaX = 0, deltaY = 0, deltaZ = 0) {
      const safeId = cleanId(id || state.selectedObjectId);
      const override = ensureOverride(safeId);
      if (!override) return commandReceipt(false, 'object-not-found');
      pushHistory();
      const base = basePositions.get(safeId) || {};
      override.x = clamp((Number.isFinite(override.x) ? override.x : Number.isFinite(base.x) ? base.x : 50) + Number(deltaX || 0), 7, 93);
      override.y = clamp((Number.isFinite(override.y) ? override.y : Number.isFinite(base.y) ? base.y : 50) + Number(deltaY || 0), 7, 93);
      override.z = clamp((Number.isFinite(override.z) ? override.z : 0) + Number(deltaZ || 0), -4, 6);
      state.selectedObjectId = safeId;
      return emit('move-object');
    },
    endMove() {
      if (!moveTransaction) return commandReceipt(false, 'move-not-active');
      undoStack.push(moveTransaction.before);
      if (undoStack.length > EON_NEXUS_W684_LAYOUT_HISTORY_LIMIT) undoStack.shift();
      redoStack = [];
      moveTransaction = null;
      return emit('move-committed');
    },
    toggleCompare(id = state.selectedObjectId) {
      const safeId = cleanId(id);
      if (!safeId) return commandReceipt(false, 'object-not-selected');
      pushHistory();
      state.compareIds = state.compareIds.includes(safeId) ? state.compareIds.filter((entry) => entry !== safeId) : [...state.compareIds, safeId].slice(-2);
      return emit('toggle-compare');
    },
    groupSelected() {
      const ids = state.selectedObjectIds.length > 1 ? state.selectedObjectIds : state.selectedObjectId ? [state.selectedObjectId] : [];
      if (ids.length < 2) return commandReceipt(false, 'two-objects-required');
      pushHistory();
      groupSequence += 1;
      const groupId = cleanId(`group:${groupSequence}:${ids.join(':')}`, `group:${groupSequence}`);
      for (const id of ids) {
        const override = ensureOverride(id);
        if (override) override.groupId = groupId;
      }
      state.activeGroupId = groupId;
      return emit('group-selected');
    },
    park(id = state.selectedObjectId) {
      const override = ensureOverride(id);
      if (!override) return commandReceipt(false, 'object-not-selected');
      pushHistory();
      override.parked = true;
      return emit('park-object');
    },
    restore(id = state.selectedObjectId) {
      const override = ensureOverride(id);
      if (!override) return commandReceipt(false, 'object-not-selected');
      pushHistory();
      override.parked = false;
      return emit('restore-object');
    },
    setView(patch = {}, { record = true } = {}) {
      const next = {
        rotation: Number.isFinite(Number(patch.rotation)) ? clamp(patch.rotation, -180, 180) : state.view.rotation,
        zoom: Number.isFinite(Number(patch.zoom)) ? clamp(patch.zoom, 0.78, 1.18) : state.view.zoom,
        expanded: typeof patch.expanded === 'boolean' ? patch.expanded : state.view.expanded
      };
      if (next.rotation === state.view.rotation && next.zoom === state.view.zoom && next.expanded === state.view.expanded) {
        return stateReceipt(state, { reason: 'view-unchanged' });
      }
      if (record) pushHistory();
      state.view = next;
      return emit('view-change');
    },
    resetLayout() {
      pushHistory();
      state.layoutOverrides = {};
      state.compareIds = [];
      state.selectedObjectIds = state.selectedObjectId ? [state.selectedObjectId] : [];
      state.activeGroupId = '';
      state.view = { rotation: 0, zoom: 1, expanded: false };
      return emit('reset-layout');
    },
    undo() {
      if (!undoStack.length) return commandReceipt(false, 'nothing-to-undo');
      redoStack.push(snapshotForHistory());
      return restoreHistory(undoStack.pop(), 'undo');
    },
    redo() {
      if (!redoStack.length) return commandReceipt(false, 'nothing-to-redo');
      undoStack.push(snapshotForHistory());
      return restoreHistory(redoStack.pop(), 'redo');
    },
    applyCommand(command = {}, objects = []) {
      const receipt = typeof command === 'string' ? interpretEonNexusW684VoiceCommand(command, objects) : command;
      if (!receipt?.ok) return receipt || commandReceipt(false, 'invalid-command');
      const action = receipt.action;
      const payload = receipt.payload || {};
      if (action === 'select') return api.select(payload.objectId);
      if (action === 'move') return api.moveBy(payload.objectId || state.selectedObjectId, payload.deltaX, payload.deltaY, payload.deltaZ);
      if (action === 'toggle-compare') return api.toggleCompare();
      if (action === 'group-selected') return api.groupSelected();
      if (action === 'park-selected') return api.park();
      if (action === 'restore-selected') return api.restore();
      if (action === 'reset-layout') return api.resetLayout();
      if (action === 'undo') return api.undo();
      if (action === 'redo') return api.redo();
      if (action === 'expand-view') return api.setView({ expanded: true });
      if (action === 'collapse-view') return api.setView({ expanded: false });
      if (action === 'rotate-view') return api.setView({ rotation: state.view.rotation + Number(payload.delta || 0) });
      return receipt;
    },
    setGestureMode(mode = 'off', reason = '') {
      state.gestureMode = mode === 'active' ? 'active' : mode === 'unavailable' ? 'unavailable' : 'off';
      state.gestureReason = cleanText(reason, 140);
      return emit('gesture-mode-change');
    }
  };
  return freeze(api);
}

export function createEonNexusW684LocalGestureMode({
  controller,
  detectorFactory = null,
  environment = globalThis,
  onFrame = null
} = {}) {
  let stream = null;
  let video = null;
  let detector = null;
  let animationFrame = 0;
  let active = false;
  let lastAcceptedAt = 0;

  const stop = () => {
    active = false;
    if (animationFrame) environment.cancelAnimationFrame?.(animationFrame);
    animationFrame = 0;
    try { detector?.dispose?.(); } catch {}
    detector = null;
    try { stream?.getTracks?.().forEach((track) => track.stop()); } catch {}
    stream = null;
    try { video?.remove?.(); } catch {}
    video = null;
    controller?.setGestureMode?.('off', 'Local gesture mode stopped.');
    return commandReceipt(true, null, 'gesture-stop');
  };

  const start = async ({ explicitUserAction = false } = {}) => {
    if (!explicitUserAction) return commandReceipt(false, 'explicit-user-action-required');
    if (active) return commandReceipt(true, 'already-active', 'gesture-start');
    if (typeof detectorFactory !== 'function') {
      controller?.setGestureMode?.('unavailable', 'No local hand detector is installed.');
      return commandReceipt(false, 'local-detector-unavailable');
    }
    const getUserMedia = environment?.navigator?.mediaDevices?.getUserMedia?.bind(environment.navigator.mediaDevices);
    if (!getUserMedia) {
      controller?.setGestureMode?.('unavailable', 'Camera capture is unavailable in this browser.');
      return commandReceipt(false, 'camera-unavailable');
    }
    try {
      stream = await getUserMedia({ video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }, audio: false });
      video = environment.document?.createElement?.('video') || null;
      if (!video) throw new Error('video-element-unavailable');
      video.muted = true;
      video.playsInline = true;
      video.srcObject = stream;
      await video.play();
      detector = await detectorFactory({ video, environment, localOnly: true });
      if (!detector?.detect) throw new Error('local-detector-invalid');
      active = true;
      controller?.setGestureMode?.('active', 'Camera frames stay local and no image is uploaded.');
      const tick = async (timestamp = 0) => {
        if (!active) return;
        try {
          const frame = await detector.detect(video, timestamp);
          if (!active) return;
          const receipt = interpretEonNexusW684GestureFrame(frame || {}, { now: Date.now(), lastAcceptedAt });
          if (receipt.ok) {
            lastAcceptedAt = Date.now();
            controller?.applyCommand?.(receipt);
          }
          try { onFrame?.(receipt, frame); } catch {}
        } catch {}
        animationFrame = environment.requestAnimationFrame?.(tick) || 0;
      };
      animationFrame = environment.requestAnimationFrame?.(tick) || 0;
      return commandReceipt(true, null, 'gesture-start');
    } catch (error) {
      stop();
      controller?.setGestureMode?.('unavailable', cleanText(error?.message || 'Local gesture mode failed.', 140));
      return commandReceipt(false, 'gesture-start-failed', '', { message: cleanText(error?.message, 140) });
    }
  };

  return freeze({ start, stop, isActive: () => active, getVideo: () => video });
}

export function getEonNexusW684MultimodalTruth() {
  return freeze({
    schema: EON_NEXUS_W684_INTERACTION_SCHEMA,
    mousePrimary: true,
    touchPrimary: true,
    keyboardPrimary: true,
    typedVoiceTranscriptPrimary: true,
    realObjectMove: true,
    compareTwoObjects: true,
    localGrouping: true,
    localParking: true,
    undoRedo: true,
    optionalCameraGestures: true,
    cameraStartsAutomatically: false,
    explicitGestureConsentRequired: true,
    injectedLocalDetectorRequired: true,
    detectorDownloadedByModule: false,
    cameraFramesUploaded: false,
    gestureConfidenceMinimum: EON_NEXUS_W684_GESTURE_CONFIDENCE,
    gestureCooldownMs: EON_NEXUS_W684_GESTURE_COOLDOWN_MS,
    everyGestureHasButtonKeyboardEquivalent: true,
    layoutPersistence: false,
    startsAiWork: false,
    autoNavigate: false,
    autoApprove: false
  });
}

export default freeze({
  EON_NEXUS_W684_INTERACTION_SCHEMA,
  EON_NEXUS_W684_LAYOUT_HISTORY_LIMIT,
  EON_NEXUS_W684_GESTURE_CONFIDENCE,
  EON_NEXUS_W684_GESTURE_COOLDOWN_MS,
  interpretEonNexusW684VoiceCommand,
  interpretEonNexusW684GestureFrame,
  createEonNexusW684InteractionController,
  createEonNexusW684LocalGestureMode,
  getEonNexusW684MultimodalTruth
});
