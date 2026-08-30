/*
 * W660I / W661E — one keyboard/touch movement contract for EONCITY.
 *
 * Directional UI controls may use visual names (up/down) while the runtime
 * consumes semantic names (forward/backward). This module normalizes both and
 * owns press/release cleanup so a pointer cannot leave movement latched or
 * bubble into shell navigation.
 *
 * W661E v6 fixes the complete real-browser lifecycle. A valid short tap can
 * finish as button pointerup, window pointerup, synchronous or delayed
 * lostpointercapture, pointerleave, and the browser-generated completion click.
 * A root capture-phase release stops a held direction before target handlers can
 * suppress completion. Tap versus hold classification uses physical pointer
 * timestamps. The completion click is consumed by a dedicated marker that
 * survives delayed capture-loss events, so it cannot reactivate movement.
 */
export const EON_CITY_INPUT_CONTRACT_SCHEMA = 'eon.city.input-contract.w661e.v6';
export const EON_CITY_INPUT_AUTHORITY_SCHEMA = 'eon.city.input-authority.w664.v1';

const freeze = (value) => Object.freeze(value);

export const EON_CITY_DIRECTION_ALIASES = freeze({
  up: 'forward',
  forward: 'forward',
  down: 'backward',
  backward: 'backward',
  left: 'left',
  right: 'right'
});

export function normalizeEonCityMovementDirection(value = '') {
  return EON_CITY_DIRECTION_ALIASES[String(value || '').trim().toLowerCase()] || '';
}

function stopEvent(event) {
  event?.preventDefault?.();
  event?.stopPropagation?.();
  event?.stopImmediatePropagation?.();
}

function matchesDirectionalControl(root, event, selector) {
  const target = event?.target;
  const control = target?.closest?.(selector);
  if (!control) return null;
  if (typeof root?.contains === 'function' && !root.contains(control)) return null;
  return control;
}

export function bindEonCityDirectionalControls(root, runtime, {
  selector = '[data-play-move]',
  datasetKey = 'playMove',
  environment = globalThis,
  minimumPointerPulseMs = 240,
  controlSource = 'touch-dpad'
} = {}) {
  if (!root?.querySelectorAll || typeof runtime?.setMove !== 'function') return () => {};
  const cleanups = [];
  const active = new Map();
  // A pulse cannot be bounded by wall-clock time alone: a busy main thread can
  // let its timer expire before the renderer has had a chance to consume it.
  // Keep the pulse live until both its authored minimum and one subsequent
  // animation-frame opportunity have happened.
  const pulseRecords = new Map();
  const activated = new WeakSet();
  const startedAt = new WeakMap();
  const pointerClickSuppressedUntil = new WeakMap();
  const pointerClickSuppressionMs = Math.max(900, Number(minimumPointerPulseMs || 0) + 600);
  const readNow = () => Number(environment?.performance?.now?.() ?? Date.now());
  const readEventTime = (event) => {
    const value = Number(event?.timeStamp);
    return Number.isFinite(value) && value >= 0 ? value : null;
  };
  const elapsedPointerTime = (started, event) => {
    const handlerElapsed = Math.max(0, readNow() - Number(started?.handlerTime || 0));
    const endedEventTime = readEventTime(event);
    const eventElapsed = Number.isFinite(started?.eventTime)
      && Number.isFinite(endedEventTime)
      && endedEventTime >= started.eventTime
      ? endedEventTime - started.eventTime
      : null;
    return eventElapsed != null && eventElapsed > 0 ? eventElapsed : handlerElapsed;
  };
  const buttons = [...root.querySelectorAll(selector)];

  const clearPointerClickSuppression = (button) => pointerClickSuppressedUntil.delete(button);
  const markPointerClickSuppression = (button) => {
    pointerClickSuppressedUntil.set(button, readNow() + pointerClickSuppressionMs);
  };
  const pointerClickSuppressionActive = (button) => {
    const until = Number(pointerClickSuppressedUntil.get(button) || 0);
    if (!(until > readNow())) {
      pointerClickSuppressedUntil.delete(button);
      return false;
    }
    return true;
  };
  const isPointerCompletionClick = (event) => {
    const detail = Number(event?.detail || 0);
    const pointerType = String(event?.pointerType || '');
    const touchSource = event?.sourceCapabilities?.firesTouchEvents === true;
    return event?.isTrusted === true
      || detail > 0
      || Boolean(pointerType)
      || touchSource
      || (event?.isTrusted == null && event?.detail == null);
  };

  // W736B+: touch controls own movement only. The current City runtime owns
  // its one menu and Nexus. Never mount the retired mixed Living Nexus bridge.

  const onRouteBoundaryCapture = (event) => {
    if (!matchesDirectionalControl(root, event, selector)) return;
    event?.preventDefault?.();
  };
  for (const eventName of ['pointerdown', 'mousedown', 'touchstart', 'click', 'dragstart']) {
    root.addEventListener?.(eventName, onRouteBoundaryCapture, { capture: true, passive: false });
    cleanups.push(() => root.removeEventListener?.(eventName, onRouteBoundaryCapture, { capture: true }));
  }

  const sourceId = String(controlSource || 'touch-dpad').trim().slice(0, 64) || 'touch-dpad';
  const setDirection = (button, direction, enabled) => {
    if (!direction) return;
    runtime.setMove(direction, Boolean(enabled), {
      source: sourceId,
      inputKind: 'directional-control'
    });
    if (enabled) {
      active.set(button, direction);
      button?.setAttribute?.('data-eon-city-move-active', 'true');
      button?.setAttribute?.('aria-pressed', 'true');
    } else {
      active.delete(button);
      button?.removeAttribute?.('data-eon-city-move-active');
      button?.setAttribute?.('aria-pressed', 'false');
    }
  };

  const onPointerReleaseCapture = (event) => {
    const button = matchesDirectionalControl(root, event, selector);
    if (!button) return;
    event?.preventDefault?.();
    const direction = active.get(button) || normalizeEonCityMovementDirection(button?.dataset?.[datasetKey]);
    if (direction) setDirection(button, direction, false);
  };
  root.addEventListener?.('pointerup', onPointerReleaseCapture, { capture: true, passive: false });
  cleanups.push(() => root.removeEventListener?.('pointerup', onPointerReleaseCapture, { capture: true }));

  const requestFrame = (callback) => {
    if (typeof environment?.requestAnimationFrame === 'function') return { kind: 'raf', id: environment.requestAnimationFrame(callback) };
    return { kind: 'timer', id: environment?.setTimeout?.(() => callback(readNow()), 16) };
  };
  const cancelFrame = (handle) => {
    if (!handle) return;
    if (handle.kind === 'raf') environment?.cancelAnimationFrame?.(handle.id);
    else environment?.clearTimeout?.(handle.id);
  };
  const clearPulseRecord = (button) => {
    const pulse = pulseRecords.get(button);
    if (!pulse) return null;
    if (pulse.minimumTimer != null) environment?.clearTimeout?.(pulse.minimumTimer);
    if (pulse.releaseTimer != null) environment?.clearTimeout?.(pulse.releaseTimer);
    if (pulse.safetyTimer != null) environment?.clearTimeout?.(pulse.safetyTimer);
    cancelFrame(pulse.frameHandle);
    pulseRecords.delete(button);
    return pulse;
  };

  const releaseButton = (button, { preservePulse = false } = {}) => {
    if (!preservePulse) clearPulseRecord(button);
    const direction = active.get(button) || normalizeEonCityMovementDirection(button?.dataset?.[datasetKey]);
    if (direction && !(preservePulse && pulseRecords.has(button))) setDirection(button, direction, false);
    try {
      if (button?.hasPointerCapture?.(button.__eonCityPointerId)) button.releasePointerCapture?.(button.__eonCityPointerId);
    } catch {}
    delete button.__eonCityPointerId;
  };

  const pulseButton = (button, direction, durationMs = minimumPointerPulseMs) => {
    releaseButton(button);
    setDirection(button, direction, true);
    const minimumMs = Math.max(80, durationMs || minimumPointerPulseMs);
    const pulse = {
      direction,
      activatedAt: readNow(),
      minimumReleaseAt: readNow() + minimumMs,
      minimumTimeElapsed: false,
      frameOpportunityObserved: false,
      frameOpportunityCount: 0,
      releaseQueued: false,
      safetyRelease: false,
      released: false,
      releaseReason: '',
      minimumTimer: null,
      releaseTimer: null,
      safetyTimer: null,
      frameHandle: null
    };
    const release = (reason) => {
      if (pulse.released || pulseRecords.get(button) !== pulse) return;
      pulse.released = true;
      pulse.releaseReason = reason;
      activated.delete(button);
      startedAt.delete(button);
      clearPointerClickSuppression(button);
      clearPulseRecord(button);
      releaseButton(button);
    };
    const queueRelease = () => {
      if (pulse.releaseQueued || pulse.released || !pulse.minimumTimeElapsed || !pulse.frameOpportunityObserved) return;
      pulse.releaseQueued = true;
      // A task after the rAF callback lets all rAF movement consumers observe
      // the active direction in that frame before cleanup occurs.
      pulse.releaseTimer = environment?.setTimeout?.(() => release('minimum-and-frame'), 0);
    };
    pulseRecords.set(button, pulse);
    pulse.minimumTimer = environment?.setTimeout?.(() => {
      if (pulseRecords.get(button) !== pulse) return;
      pulse.minimumTimeElapsed = true;
      queueRelease();
    }, minimumMs);
    pulse.frameHandle = requestFrame(() => {
      if (pulseRecords.get(button) !== pulse) return;
      pulse.frameOpportunityObserved = true;
      pulse.frameOpportunityCount += 1;
      queueRelease();
    });
    // Emergency cleanup only: normal operation always releases via the two
    // predicates above. This prevents an indefinite latch if frames vanish.
    pulse.safetyTimer = environment?.setTimeout?.(() => {
      if (pulseRecords.get(button) !== pulse) return;
      pulse.safetyRelease = true;
      release('safety-timeout');
    }, minimumMs + 1_800);
  };

  const releaseHeldPresses = ({ preservePulses = false } = {}) => {
    for (const button of [...active.keys()]) {
      if (preservePulses && pulseRecords.has(button)) continue;
      releaseButton(button);
    }
  };

  const releaseAll = () => {
    releaseHeldPresses();
    for (const button of [...pulseRecords.keys()]) releaseButton(button);
    for (const button of buttons) {
      activated.delete(button);
      startedAt.delete(button);
      clearPointerClickSuppression(button);
      delete button.__eonCityCompletingPointerUp;
      delete button.__eonCityPointerId;
    }
    for (const direction of ['forward', 'backward', 'left', 'right']) {
      runtime.setMove(direction, false, { source: sourceId, inputKind: 'directional-control-clear' });
    }
    runtime.setAnalogMove?.({ x: 0, z: 0 }, { source: sourceId, inputKind: 'directional-control-clear' });
  };

  const readInputState = () => ({
    schema: `${EON_CITY_INPUT_CONTRACT_SCHEMA}.state.v1`,
    activeDirections: [...active.values()],
    pulseDirections: [...pulseRecords.values()].map((pulse) => pulse.direction).filter(Boolean),
    pulseLifecycle: [...pulseRecords.values()].map((pulse) => ({
      direction: pulse.direction,
      minimumTimeElapsed: pulse.minimumTimeElapsed,
      frameOpportunityObserved: pulse.frameOpportunityObserved,
      frameOpportunityCount: pulse.frameOpportunityCount,
      releaseQueued: pulse.releaseQueued,
      safetyRelease: pulse.safetyRelease,
      ageMs: Math.max(0, readNow() - pulse.activatedAt)
    })),
    pointerClickSuppressedDirections: buttons
      .filter((button) => pointerClickSuppressionActive(button))
      .map((button) => normalizeEonCityMovementDirection(button?.dataset?.[datasetKey]))
      .filter(Boolean)
  });
  try {
    root.__eonCityReadInputState = readInputState;
    root.__eonCityClearInputState = releaseAll;
  } catch {}

  for (const button of buttons) {
    button.setAttribute?.('type', 'button');
    button.setAttribute?.('aria-pressed', 'false');
    button.setAttribute?.('data-eon-city-input-source', sourceId);
    const directionForButton = () => normalizeEonCityMovementDirection(button?.dataset?.[datasetKey]);

    const onPointerDown = (event) => {
      stopEvent(event);
      if (event?.button != null && event.button !== 0) return;
      const direction = directionForButton();
      if (!direction) return;
      clearPointerClickSuppression(button);
      activated.add(button);
      startedAt.set(button, { handlerTime: readNow(), eventTime: readEventTime(event) });
      releaseButton(button);
      button.__eonCityPointerId = event?.pointerId;
      try { button.setPointerCapture?.(event.pointerId); } catch {}
      setDirection(button, direction, true);
    };

    const onPointerUp = (event) => {
      stopEvent(event);
      const direction = directionForButton();
      const started = startedAt.get(button);
      const wasActivated = activated.has(button);
      const elapsed = started ? elapsedPointerTime(started, event) : minimumPointerPulseMs;
      startedAt.delete(button);
      if (wasActivated) {
        markPointerClickSuppression(button);
        activated.delete(button);
      }
      button.__eonCityCompletingPointerUp = true;
      releaseButton(button);
      delete button.__eonCityCompletingPointerUp;
      if (wasActivated && direction && elapsed < minimumPointerPulseMs) {
        pulseButton(button, direction, minimumPointerPulseMs - elapsed);
      }
    };

    const onPointerCancel = (event) => {
      stopEvent(event);
      activated.delete(button);
      startedAt.delete(button);
      clearPointerClickSuppression(button);
      delete button.__eonCityCompletingPointerUp;
      releaseButton(button);
    };

    const onCompletionRelease = (event) => {
      stopEvent(event);
      startedAt.delete(button);
      if (button.__eonCityCompletingPointerUp || pulseRecords.has(button)) {
        delete button.__eonCityPointerId;
        return;
      }
      activated.delete(button);
      releaseButton(button);
    };

    const onClick = (event) => {
      stopEvent(event);
      const direction = directionForButton();
      if (!direction) return;
      if (activated.has(button)) {
        activated.delete(button);
        return;
      }
      if (pointerClickSuppressionActive(button) && isPointerCompletionClick(event)) {
        clearPointerClickSuppression(button);
        return;
      }
      pulseButton(button, direction);
    };

    const onKeyDown = (event) => {
      if (!['Enter', ' ', 'Spacebar'].includes(event?.key) || event?.repeat) return;
      stopEvent(event);
      const direction = directionForButton();
      if (!direction) return;
      activated.add(button);
      releaseButton(button);
      setDirection(button, direction, true);
    };

    const onKeyUp = (event) => {
      if (!['Enter', ' ', 'Spacebar'].includes(event?.key)) return;
      stopEvent(event);
      const direction = directionForButton();
      releaseButton(button);
      if (direction) pulseButton(button, direction);
    };

    const onContextMenu = (event) => stopEvent(event);
    const onDragStart = (event) => stopEvent(event);
    button.addEventListener('pointerdown', onPointerDown);
    button.addEventListener('pointerup', onPointerUp);
    button.addEventListener('pointercancel', onPointerCancel);
    button.addEventListener('pointerleave', onCompletionRelease);
    button.addEventListener('lostpointercapture', onCompletionRelease);
    button.addEventListener('click', onClick);
    button.addEventListener('keydown', onKeyDown);
    button.addEventListener('keyup', onKeyUp);
    button.addEventListener('contextmenu', onContextMenu);
    button.addEventListener('dragstart', onDragStart);
    cleanups.push(() => {
      button.removeEventListener('pointerdown', onPointerDown);
      button.removeEventListener('pointerup', onPointerUp);
      button.removeEventListener('pointercancel', onPointerCancel);
      button.removeEventListener('pointerleave', onCompletionRelease);
      button.removeEventListener('lostpointercapture', onCompletionRelease);
      button.removeEventListener('click', onClick);
      button.removeEventListener('keydown', onKeyDown);
      button.removeEventListener('keyup', onKeyUp);
      button.removeEventListener('contextmenu', onContextMenu);
      button.removeEventListener('dragstart', onDragStart);
      delete button.__eonCityCompletingPointerUp;
      releaseButton(button);
    });
  }

  const onGlobalPointerUp = () => releaseHeldPresses({ preservePulses: true });
  const onGlobalCancel = () => releaseAll();
  const onVisibility = () => {
    if (environment?.document?.visibilityState === 'hidden') releaseAll();
  };
  environment?.addEventListener?.('pointerup', onGlobalPointerUp);
  environment?.addEventListener?.('pointercancel', onGlobalCancel);
  environment?.addEventListener?.('blur', onGlobalCancel);
  environment?.addEventListener?.('pagehide', onGlobalCancel);
  environment?.addEventListener?.('orientationchange', onGlobalCancel);
  environment?.document?.addEventListener?.('visibilitychange', onVisibility);
  cleanups.push(() => environment?.removeEventListener?.('pointerup', onGlobalPointerUp));
  cleanups.push(() => environment?.removeEventListener?.('pointercancel', onGlobalCancel));
  cleanups.push(() => environment?.removeEventListener?.('blur', onGlobalCancel));
  cleanups.push(() => environment?.removeEventListener?.('pagehide', onGlobalCancel));
  cleanups.push(() => environment?.removeEventListener?.('orientationchange', onGlobalCancel));
  cleanups.push(() => environment?.document?.removeEventListener?.('visibilitychange', onVisibility));

  return () => {
    releaseAll();
    try {
      if (root.__eonCityReadInputState === readInputState) delete root.__eonCityReadInputState;
      if (root.__eonCityClearInputState === releaseAll) delete root.__eonCityClearInputState;
    } catch {}
    for (const cleanup of cleanups.reverse()) {
      try { cleanup(); } catch {}
    }
  };
}

export function getEonCityInputContractTruth() {
  return freeze({
    schema: EON_CITY_INPUT_CONTRACT_SCHEMA,
    explicitButtonType: true,
    preventsDefaultNavigation: true,
    stopsShellPropagation: true,
    pressAndHold: true,
    accessibleKeyboardPress: true,
    accessibleClickPulse: true,
    shortTapGuaranteesMovementPulse: true,
    capturePhaseHeldRelease: true,
    physicalPointerTimestampDuration: true,
    handlerDelayCannotCreateTapPulse: true,
    pointerCompletionClickSuppression: true,
    delayedCaptureLossCannotReactivateMovement: true,
    inputStateDiagnostics: true,
    globalPointerUpPreservesTapPulse: true,
    lostPointerCapturePreservesTapPulse: true,
    pointerLeavePreservesTapPulse: true,
    synchronousLostPointerCaptureSafe: true,
    pulseExpiryClearsStaleActivation: true,
    pointerCancelClearsPulse: true,
    minimumPointerPulseMs: 240,
    pointerCancelRelease: true,
    blurRelease: true,
    pageHideRelease: true,
    orientationChangeRelease: true,
    hiddenDocumentRelease: true,
    capturePhaseDefaultGuard: true,
    immediatePropagationGuard: true,
    fixedHudSeparationRequired: true,
    progressiveNexusBridgeRequired: false,
    retiredLivingNexusBridgeMounted: false,
    commandHubOwnsLaunchMenu: true
  });
}

export default freeze({
  EON_CITY_INPUT_CONTRACT_SCHEMA,
  EON_CITY_DIRECTION_ALIASES,
  normalizeEonCityMovementDirection,
  bindEonCityDirectionalControls,
  getEonCityInputContractTruth
});
