/**
 * W555A — EONAPP universal workload governor.
 *
 * This is a local, browser-session coordinator. It does not inspect prompts,
 * media, files, Vault contents, model weights, provider credentials, accounts,
 * or task results. It does not start, stop, or control a model by itself.
 *
 * Features cooperate by declaring an intent before they begin costly work and
 * by releasing that lease when work ends. The governor can then make a bounded
 * local admission decision and send an advisory action to registered feature
 * consumers, such as "use City Lite" or "pause City before a user-confirmed
 * local video render". It never silently cancels work or persists a device
 * profile.
 */

export const EON_WORKLOAD_GOVERNOR_SCHEMA = 'eonapp.workload-governor.w555a.v1';

const freeze = (value) => Object.freeze(value);
const WORKLOAD_SET = new Set([
  'city-render',
  'local-text-ai',
  'hosted-ai',
  'image-generation',
  'video-generation',
  'video-edit',
  'media-export',
  'audio-playback',
  'media-upload',
  'agent-action',
  'data-sync'
]);
const MAX_ACTIVE_LEASES = 24;
const MAX_HISTORY = 48;
const MAX_FRAME_SAMPLES = 90;
const MAX_LONG_TASK_SAMPLES = 18;
const MAX_PERFORMANCE_SAMPLES = 24;
const PRESSURE_SET = new Set(['nominal', 'elevated', 'critical']);

export const EON_WORKLOAD_KINDS = freeze({
  CITY_RENDER: 'city-render',
  LOCAL_TEXT_AI: 'local-text-ai',
  HOSTED_AI: 'hosted-ai',
  IMAGE_GENERATION: 'image-generation',
  VIDEO_GENERATION: 'video-generation',
  VIDEO_EDIT: 'video-edit',
  MEDIA_EXPORT: 'media-export',
  AUDIO_PLAYBACK: 'audio-playback',
  MEDIA_UPLOAD: 'media-upload',
  AGENT_ACTION: 'agent-action',
  DATA_SYNC: 'data-sync'
});

const WORKLOAD_PROFILE = freeze({
  'city-render': freeze({ cpu: 2, gpu: 2, memory: 2, foreground: true, background: false, heavyGpu: false, defaultPriority: 70 }),
  'local-text-ai': freeze({ cpu: 2, gpu: 1, memory: 2, foreground: true, background: false, heavyGpu: false, defaultPriority: 80 }),
  'hosted-ai': freeze({ cpu: 1, gpu: 0, memory: 1, foreground: true, background: false, heavyGpu: false, defaultPriority: 80 }),
  'image-generation': freeze({ cpu: 3, gpu: 3, memory: 3, foreground: true, background: false, heavyGpu: true, defaultPriority: 90 }),
  'video-generation': freeze({ cpu: 3, gpu: 4, memory: 4, foreground: true, background: false, heavyGpu: true, defaultPriority: 95 }),
  'video-edit': freeze({ cpu: 3, gpu: 3, memory: 3, foreground: true, background: false, heavyGpu: true, defaultPriority: 90 }),
  'media-export': freeze({ cpu: 3, gpu: 2, memory: 2, foreground: true, background: false, heavyGpu: true, defaultPriority: 88 }),
  'audio-playback': freeze({ cpu: 1, gpu: 0, memory: 1, foreground: true, background: false, heavyGpu: false, defaultPriority: 55 }),
  'media-upload': freeze({ cpu: 1, gpu: 0, memory: 1, foreground: false, background: true, heavyGpu: false, defaultPriority: 35 }),
  'agent-action': freeze({ cpu: 1, gpu: 0, memory: 1, foreground: false, background: true, heavyGpu: false, defaultPriority: 40 }),
  'data-sync': freeze({ cpu: 1, gpu: 0, memory: 1, foreground: false, background: true, heavyGpu: false, defaultPriority: 25 })
});

const DEVICE_BUDGETS = freeze({
  constrained: freeze({ cpu: 4, gpu: 2, memory: 4, backgroundSlots: 1, label: 'Constrained device' }),
  balanced: freeze({ cpu: 7, gpu: 4, memory: 7, backgroundSlots: 2, label: 'Balanced device' }),
  performance: freeze({ cpu: 10, gpu: 6, memory: 10, backgroundSlots: 3, label: 'Performance device' })
});

function number(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function nowDefault() {
  const candidate = number(globalThis.performance?.now?.(), NaN);
  return Number.isFinite(candidate) ? candidate : Date.now();
}

function wallNowDefault() {
  return Date.now();
}

function normalizeWorkloadKind(value = '') {
  const candidate = String(value || '').trim().toLowerCase();
  return WORKLOAD_SET.has(candidate) ? candidate : 'agent-action';
}

function normalizePressure(value = 'nominal') {
  const candidate = String(value || '').trim().toLowerCase();
  return PRESSURE_SET.has(candidate) ? candidate : 'nominal';
}

function safeId(value, fallback = 'workload') {
  const candidate = String(value || '').trim().replace(/[^a-zA-Z0-9:_-]/g, '-').slice(0, 96);
  return candidate || fallback;
}

function makeId(kind, sequence) {
  return `${safeId(kind)}:${sequence}`;
}

function boundedPush(rows, entry, max = MAX_HISTORY) {
  rows.push(freeze({ ...entry }));
  if (rows.length > max) rows.splice(0, rows.length - max);
}

function average(values = []) {
  return values.length ? values.reduce((total, value) => total + value, 0) / values.length : 0;
}

function detectDeviceClass(environment = globalThis) {
  const nav = environment?.navigator || {};
  const memory = number(nav.deviceMemory, 4);
  const cores = number(nav.hardwareConcurrency, 4);
  const saveData = Boolean(nav.connection?.saveData);
  if (saveData || memory <= 4 || cores <= 4) return 'constrained';
  if (memory >= 8 && cores >= 8) return 'performance';
  return 'balanced';
}

function readHints(environment = globalThis) {
  const nav = environment?.navigator || {};
  const connection = nav.connection || {};
  return freeze({
    deviceClass: detectDeviceClass(environment),
    deviceMemoryGB: Math.max(0, number(nav.deviceMemory, 0)),
    cpuCores: Math.max(0, number(nav.hardwareConcurrency, 0)),
    saveData: Boolean(connection.saveData),
    effectiveType: String(connection.effectiveType || ''),
    visibility: String(environment?.document?.visibilityState || 'visible') === 'hidden' ? 'hidden' : 'visible',
    battery: 'unavailable',
    thermal: 'unavailable'
  });
}

function resourceTotals(leases) {
  const totals = { cpu: 0, gpu: 0, memory: 0, background: 0, heavyGpu: 0 };
  for (const lease of leases) {
    const profile = WORKLOAD_PROFILE[lease.kind] || WORKLOAD_PROFILE['agent-action'];
    totals.cpu += profile.cpu;
    totals.gpu += profile.gpu;
    totals.memory += profile.memory;
    if (profile.background) totals.background += 1;
    if (profile.heavyGpu) totals.heavyGpu += 1;
  }
  return totals;
}

function hasCity(leases = []) {
  return leases.some((lease) => lease.kind === 'city-render');
}

function hasHeavyGpu(leases = []) {
  return leases.some((lease) => (WORKLOAD_PROFILE[lease.kind] || WORKLOAD_PROFILE['agent-action']).heavyGpu);
}

function activeKinds(leases = []) {
  return leases.map((lease) => lease.kind);
}

function describeDecision(decision) {
  const map = {
    allowed: 'Allowed locally.',
    degraded: 'Allowed with a local protection action.',
    deferred: 'Deferred until the device has more room.',
    'needs-user-choice': 'Needs a visible choice before competing work is paused.'
  };
  return map[decision] || 'No workload decision is available.';
}

function summarizeAction(action) {
  if (action === 'city:reduce-quality') return 'Use the reversible City protection pass.';
  if (action === 'city:pause') return 'Pause City and preserve the current local pose before the heavy task begins.';
  if (action === 'city:resume') return 'Resume City only after the workload-owned heavy task releases its pause.';
  if (action === 'background:defer') return 'Keep background work queued until pressure returns to normal.';
  if (action === 'chat:trim-budget') return 'Use the smaller local chat budget for the current request.';
  return 'No extra action is required.';
}

/**
 * Maps an already-resolved provider to a declared governor workload. It does
 * not probe or inspect the provider; callers already know the identifier.
 */
export function getEonAiWorkloadKind(provider = {}, endpoint = '') {
  const id = String(provider?.id || provider || '').trim().toLowerCase();
  const path = String(endpoint || provider?.endpoint || '').trim().toLowerCase();
  const local = ['browserlocal', 'ollama', 'lmstudio', 'jan'].includes(id) || /^http:\/\/(?:localhost|127\.0\.0\.1|\[::1\])(?::\d+)?\//.test(path);
  return local ? EON_WORKLOAD_KINDS.LOCAL_TEXT_AI : EON_WORKLOAD_KINDS.HOSTED_AI;
}

export function getEonWorkloadGovernorTruth() {
  return freeze({
    schema: EON_WORKLOAD_GOVERNOR_SCHEMA,
    browserSessionOnly: true,
    localOnly: true,
    remoteTelemetry: false,
    readsPrompts: false,
    readsModelWeights: false,
    readsVault: false,
    readsProviderCredentials: false,
    readsMediaBodies: false,
    startsModels: false,
    controlsExternalProviders: false,
    automaticUserDataDeletion: false,
    deviceThermalMeasurement: false,
    deviceCertification: false,
    recommendationOnlyUntilAFeatureHonoursItsAction: true
  });
}

export function createEonWorkloadGovernor({ environment = globalThis, now = nowDefault, wallNow = wallNowDefault, autoStart = false } = {}) {
  const leases = new Map();
  const consumers = new Map();
  const history = [];
  const frameSamples = [];
  const longTaskSamples = [];
  const performanceSamples = [];
  let pressure = 'nominal';
  let pressureReason = 'startup';
  let sequence = 0;
  let started = false;
  let monitorTimer = null;
  let observer = null;
  let lastLagCheck = number(now(), 0);
  let lastPressureActionAt = 0;

  const appendHistory = (event, detail = '') => {
    boundedPush(history, {
      event: String(event || 'event').slice(0, 60),
      detail: String(detail || '').slice(0, 180),
      at: number(wallNow(), Date.now())
    });
  };

  const getBudget = () => DEVICE_BUDGETS[readHints(environment).deviceClass] || DEVICE_BUDGETS.balanced;

  const sendAction = (action, details = {}) => {
    const emitted = freeze({
      schema: EON_WORKLOAD_GOVERNOR_SCHEMA,
      action,
      detail: summarizeAction(action),
      at: number(wallNow(), Date.now()),
      ...details
    });
    for (const consumer of consumers.values()) {
      const acceptsAll = consumer.workloads.has('all');
      const acceptsCity = String(action).startsWith('city:') && consumer.workloads.has('city-render');
      const acceptsBackground = String(action).startsWith('background:') && (consumer.workloads.has('agent-action') || consumer.workloads.has('data-sync'));
      const acceptsChat = String(action).startsWith('chat:') && (consumer.workloads.has('local-text-ai') || consumer.workloads.has('hosted-ai'));
      if (!acceptsAll && !acceptsCity && !acceptsBackground && !acceptsChat) continue;
      try { consumer.onAction?.(emitted); } catch {}
    }
    appendHistory('action', action);
    return emitted;
  };

  const derivePressure = () => {
    const hints = readHints(environment);
    const totals = resourceTotals([...leases.values()]);
    const budget = getBudget();
    const frameAverage = average(frameSamples);
    const longestTask = Math.max(0, ...longTaskSamples);
    const recentPerformance = performanceSamples.slice(-6);
    const validFps = recentPerformance.map((sample) => number(sample.fps, 0)).filter((fps) => fps > 0);
    const recentFpsAverage = average(validFps);
    const latestPerformance = recentPerformance.at(-1) || null;
    const perfMemory = environment?.performance?.memory || null;
    const heapUsed = number(perfMemory?.usedJSHeapSize, 0);
    const heapLimit = number(perfMemory?.jsHeapSizeLimit, 0);
    const heapRatio = heapUsed > 0 && heapLimit > 0 ? heapUsed / heapLimit : null;
    let next = 'nominal';
    let reason = 'within-local-budget';
    if (hints.visibility === 'hidden') {
      next = 'elevated';
      reason = 'background-tab';
    }
    if (totals.cpu > budget.cpu || totals.gpu > budget.gpu || totals.memory > budget.memory || totals.background > budget.backgroundSlots) {
      next = 'critical';
      reason = 'declared-resource-budget-exceeded';
    }
    if (frameSamples.length >= 24 && frameAverage >= 55) {
      next = next === 'critical' || frameAverage >= 82 ? 'critical' : 'elevated';
      reason = frameAverage >= 82 ? 'sustained-main-thread-stall' : 'sustained-frame-pressure';
    }
    if (longestTask >= 180) {
      next = 'critical';
      reason = 'long-task-over-180ms';
    } else if (longestTask >= 90 && next === 'nominal') {
      next = 'elevated';
      reason = 'long-task-over-90ms';
    }
    if (heapRatio !== null && heapRatio >= 0.86) {
      next = 'critical';
      reason = 'browser-heap-critical';
    } else if (heapRatio !== null && heapRatio >= 0.72 && next === 'nominal') {
      next = 'elevated';
      reason = 'browser-heap-elevated';
    }
    if (hasCity([...leases.values()]) && validFps.length >= 2) {
      if (recentFpsAverage > 0 && recentFpsAverage < 28) {
        next = 'critical';
        reason = 'city-fps-critical';
      } else if (recentFpsAverage > 0 && recentFpsAverage < 45 && next === 'nominal') {
        next = 'elevated';
        reason = 'city-fps-elevated';
      } else if (number(latestPerformance?.hardwareScalingLevel, 1) >= 1.4 && recentFpsAverage < 52 && next === 'nominal') {
        next = 'elevated';
        reason = 'city-render-scaling-elevated';
      }
    }
    if (hints.saveData && next === 'nominal') {
      next = 'elevated';
      reason = 'save-data-preference';
    }
    return freeze({
      pressure: normalizePressure(next),
      reason,
      frameAverage: Math.round(frameAverage * 100) / 100,
      longestTask,
      recentFpsAverage: validFps.length ? Math.round(recentFpsAverage * 100) / 100 : null,
      heapRatio: heapRatio === null ? null : Math.round(heapRatio * 1000) / 1000,
      hardwareScalingLevel: latestPerformance ? number(latestPerformance.hardwareScalingLevel, 1) : null
    });
  };

  const updatePressure = ({ emit = true, emitCityProtection = emit, emitBackgroundProtection = emit } = {}) => {
    const derived = derivePressure();
    const changed = derived.pressure !== pressure || derived.reason !== pressureReason;
    pressure = derived.pressure;
    pressureReason = derived.reason;
    if (changed) appendHistory('pressure', `${pressure}:${pressureReason}`);
    const active = [...leases.values()];
    const cityActive = hasCity(active);
    const elapsed = number(wallNow(), Date.now()) - lastPressureActionAt;
    if (emitCityProtection && cityActive && pressure !== 'nominal' && elapsed >= 4000) {
      lastPressureActionAt = number(wallNow(), Date.now());
      sendAction('city:reduce-quality', { pressure, reason: pressureReason });
    }
    if (emitBackgroundProtection && pressure === 'critical' && elapsed >= 4000) {
      lastPressureActionAt = number(wallNow(), Date.now());
      sendAction('background:defer', { pressure, reason: pressureReason });
    }
    return derived;
  };

  const snapshot = () => {
    const hints = readHints(environment);
    const budget = getBudget();
    const active = [...leases.values()].map((lease) => freeze({
      id: lease.id,
      kind: lease.kind,
      label: lease.label,
      source: lease.source,
      priority: lease.priority,
      userInitiated: lease.userInitiated,
      startedAt: lease.startedAt
    }));
    const totals = resourceTotals([...leases.values()]);
    return freeze({
      schema: EON_WORKLOAD_GOVERNOR_SCHEMA,
      started,
      pressure,
      pressureReason,
      device: hints,
      budget: freeze({ ...budget }),
      activeLeases: freeze(active),
      activeKinds: freeze(activeKinds([...leases.values()])),
      usage: freeze({ ...totals }),
      observations: freeze({
        frameSamples: frameSamples.length,
        averageFrameMs: frameSamples.length ? Math.round(average(frameSamples) * 100) / 100 : null,
        longTaskSamples: longTaskSamples.length,
        longestLongTaskMs: longTaskSamples.length ? Math.max(...longTaskSamples) : null,
        performanceSamples: performanceSamples.length,
        recentFpsAverage: performanceSamples.length
          ? Math.round(average(performanceSamples.slice(-6).map((sample) => number(sample.fps, 0)).filter((fps) => fps > 0)) * 100) / 100 || null
          : null,
        latestHardwareScalingLevel: performanceSamples.length ? number(performanceSamples.at(-1)?.hardwareScalingLevel, 1) : null
      }),
      history: freeze(history.map((entry) => freeze({ ...entry }))),
      truth: getEonWorkloadGovernorTruth()
    });
  };

  const getAdaptiveBudgetOverrides = (kindInput) => {
    const kind = normalizeWorkloadKind(kindInput);
    if (kind !== EON_WORKLOAD_KINDS.LOCAL_TEXT_AI && kind !== EON_WORKLOAD_KINDS.HOSTED_AI) return null;
    const derived = updatePressure({ emit: false });
    const hints = readHints(environment);
    const cityActive = hasCity([...leases.values()]);
    if (derived.pressure === 'critical') {
      return freeze({
        maxHistoryMessages: 6,
        maxInputChars: 1400,
        maxOutputTokens: 320,
        timeoutMs: 20000,
        reason: derived.reason,
        pressure: derived.pressure,
        source: 'universal-workload-governor'
      });
    }
    if (kind === EON_WORKLOAD_KINDS.LOCAL_TEXT_AI && cityActive && (derived.pressure === 'elevated' || hints.deviceClass === 'constrained')) {
      return freeze({
        maxHistoryMessages: 8,
        maxInputChars: 1800,
        maxOutputTokens: 420,
        timeoutMs: 25000,
        reason: derived.reason === 'within-local-budget' ? 'city-local-ai-coexistence' : derived.reason,
        pressure: derived.pressure,
        source: 'universal-workload-governor'
      });
    }
    if (kind === EON_WORKLOAD_KINDS.HOSTED_AI && derived.pressure === 'elevated') {
      return freeze({
        maxHistoryMessages: 10,
        maxInputChars: 2200,
        maxOutputTokens: 520,
        timeoutMs: 25000,
        reason: derived.reason,
        pressure: derived.pressure,
        source: 'universal-workload-governor'
      });
    }
    return null;
  };

  const evaluate = (kindInput, options = {}) => {
    const kind = normalizeWorkloadKind(kindInput);
    const profile = WORKLOAD_PROFILE[kind] || WORKLOAD_PROFILE['agent-action'];
    const active = [...leases.values()];
    const totals = resourceTotals(active);
    const budget = getBudget();
    const derived = updatePressure({ emit: false });
    const cityActive = hasCity(active);
    const heavyAlreadyRunning = hasHeavyGpu(active);
    const next = {
      cpu: totals.cpu + profile.cpu,
      gpu: totals.gpu + profile.gpu,
      memory: totals.memory + profile.memory,
      background: totals.background + (profile.background ? 1 : 0)
    };
    const currentKinds = activeKinds(active);
    let decision = 'allowed';
    let reason = 'within-local-budget';
    let requiredAction = null;
    const confirmPreemptCity = Boolean(options.confirmPreemptCity);
    const preemptCityConfirmed = profile.heavyGpu && cityActive && confirmPreemptCity;

    if (active.length >= MAX_ACTIVE_LEASES) {
      decision = 'deferred';
      reason = 'local-lease-limit-reached';
    } else if (profile.background && derived.pressure === 'critical') {
      decision = 'deferred';
      reason = 'background-work-deferred-under-critical-pressure';
      requiredAction = 'background:defer';
    } else if (profile.heavyGpu && heavyAlreadyRunning) {
      decision = 'deferred';
      reason = 'heavy-local-media-already-running';
      requiredAction = 'background:defer';
    } else if (profile.heavyGpu && cityActive && !confirmPreemptCity) {
      decision = 'needs-user-choice';
      reason = 'heavy-local-media-competes-with-active-city';
      requiredAction = 'city:pause';
    } else if (kind === 'city-render' && heavyAlreadyRunning) {
      decision = 'needs-user-choice';
      reason = 'city-competes-with-active-heavy-local-media';
      requiredAction = 'city:pause';
    } else if (next.cpu > budget.cpu || next.gpu > budget.gpu || next.memory > budget.memory || next.background > budget.backgroundSlots) {
      decision = profile.foreground && options.userInitiated !== false ? 'degraded' : 'deferred';
      reason = profile.foreground ? 'foreground-work-allowed-with-protection' : 'declared-resource-budget-exceeded';
      requiredAction = profile.foreground && cityActive
        ? ((kind === 'local-text-ai' || kind === 'hosted-ai') ? 'chat:trim-budget' : 'city:reduce-quality')
        : 'background:defer';
    } else if ((kind === 'local-text-ai' || kind === 'hosted-ai') && cityActive && (derived.pressure !== 'nominal' || hintsConstrained(hintsFromEnvironment(environment)))) {
      decision = 'degraded';
      reason = 'city-and-ai-share-a-constrained-browser-session';
      requiredAction = 'chat:trim-budget';
    } else if (derived.pressure === 'critical' && profile.foreground) {
      decision = 'degraded';
      reason = 'critical-pressure-foreground-work-kept-user-visible';
      requiredAction = (kind === 'local-text-ai' || kind === 'hosted-ai')
        ? 'chat:trim-budget'
        : (cityActive ? 'city:reduce-quality' : 'background:defer');
    }

    return freeze({
      schema: EON_WORKLOAD_GOVERNOR_SCHEMA,
      kind,
      decision,
      allowed: decision === 'allowed' || decision === 'degraded',
      reason,
      description: describeDecision(decision),
      requiredAction,
      requiredActionDetail: requiredAction ? summarizeAction(requiredAction) : '',
      pressure: derived.pressure,
      activeKinds: freeze(currentKinds),
      nextUsage: freeze(next),
      budget: freeze({ ...budget }),
      userChoiceRequired: decision === 'needs-user-choice',
      preemptCityConfirmed,
      noWorkStarted: true
    });
  };

  const acquire = (kindInput, options = {}) => {
    const decision = evaluate(kindInput, options);
    if (!decision.allowed) {
      appendHistory('denied', `${decision.kind}:${decision.reason}`);
      return freeze({ ok: false, decision, lease: null });
    }
    sequence += 1;
    const id = safeId(options.id, makeId(decision.kind, sequence));
    if (leases.has(id)) {
      const existing = leases.get(id);
      return freeze({ ok: true, decision: freeze({ ...decision, reused: true }), lease: existing.publicLease });
    }
    const record = {
      id,
      kind: decision.kind,
      label: String(options.label || decision.kind).slice(0, 96),
      source: String(options.source || 'eonapp').slice(0, 80),
      priority: Math.max(0, Math.min(100, number(options.priority, WORKLOAD_PROFILE[decision.kind].defaultPriority))),
      userInitiated: options.userInitiated !== false,
      startedAt: number(wallNow(), Date.now()),
      preemptedCity: decision.preemptCityConfirmed === true,
      released: false,
      publicLease: null
    };
    const release = (reason = 'completed') => {
      const current = leases.get(id);
      if (!current) return false;
      const shouldResumeCity = current.preemptedCity === true;
      leases.delete(id);
      current.released = true;
      appendHistory('released', `${current.kind}:${String(reason || 'completed').slice(0, 80)}`);
      updatePressure({ emit: false });
      if (shouldResumeCity && ![...leases.values()].some((entry) => entry.preemptedCity === true)) {
        sendAction('city:resume', { source: current.source, workload: current.kind, userConfirmed: true, workloadReleased: true });
      }
      return true;
    };
    const publicLease = freeze({
      id,
      kind: record.kind,
      release,
      getSnapshot: snapshot,
      getDecision: () => evaluate(record.kind, { userInitiated: record.userInitiated })
    });
    record.publicLease = publicLease;
    leases.set(id, record);
    appendHistory('acquired', `${record.kind}:${record.source}`);
    if (decision.preemptCityConfirmed) sendAction('city:pause', { source: record.source, workload: record.kind, userConfirmed: true });
    if (decision.requiredAction === 'city:reduce-quality') sendAction('city:reduce-quality', { pressure: decision.pressure, source: record.source, workload: record.kind });
    if (decision.requiredAction === 'chat:trim-budget') sendAction('chat:trim-budget', { pressure: decision.pressure, source: record.source, workload: record.kind });
    updatePressure({ emit: false });
    return freeze({ ok: true, decision, lease: publicLease });
  };

  const recordFrame = (deltaMs) => {
    const sample = number(deltaMs, NaN);
    if (!Number.isFinite(sample) || sample < 0 || sample > 2000) return snapshot();
    frameSamples.push(Math.min(1000, sample));
    if (frameSamples.length > MAX_FRAME_SAMPLES) frameSamples.splice(0, frameSamples.length - MAX_FRAME_SAMPLES);
    updatePressure({ emit: true });
    return snapshot();
  };

  const recordLongTask = (durationMs) => {
    const sample = number(durationMs, NaN);
    if (!Number.isFinite(sample) || sample < 0 || sample > 10000) return snapshot();
    longTaskSamples.push(Math.min(10000, sample));
    if (longTaskSamples.length > MAX_LONG_TASK_SAMPLES) longTaskSamples.splice(0, longTaskSamples.length - MAX_LONG_TASK_SAMPLES);
    updatePressure({ emit: true });
    return snapshot();
  };

  const recordPerformanceSample = (sample = {}, { emit = true, rendererOwnsProtection = false } = {}) => {
    const fps = number(sample?.fps, NaN);
    const averageFrameMs = number(sample?.averageFrameMs, NaN);
    const hardwareScalingLevel = number(sample?.hardwareScalingLevel, 1);
    if (!Number.isFinite(fps) && !Number.isFinite(averageFrameMs)) return snapshot();
    performanceSamples.push(freeze({
      at: number(wallNow(), Date.now()),
      fps: Number.isFinite(fps) ? Math.max(0, Math.min(240, fps)) : 0,
      averageFrameMs: Number.isFinite(averageFrameMs) ? Math.max(0, Math.min(1000, averageFrameMs)) : null,
      hardwareScalingLevel: Math.max(0.5, Math.min(4, hardwareScalingLevel)),
      source: String(sample?.source || 'runtime').slice(0, 80)
    }));
    if (performanceSamples.length > MAX_PERFORMANCE_SAMPLES) performanceSamples.splice(0, performanceSamples.length - MAX_PERFORMANCE_SAMPLES);
    // A renderer with its own FPS controller can keep cross-feature pressure
    // emission enabled while suppressing only the duplicate City-quality action.
    // Local AI budget reads and background admission still see this pressure.
    updatePressure({
      emit: emit !== false,
      emitCityProtection: emit !== false && rendererOwnsProtection !== true,
      emitBackgroundProtection: emit !== false
    });
    return snapshot();
  };

  const setVisibility = (state = 'visible') => {
    const visibility = String(state || '').toLowerCase() === 'hidden' ? 'hidden' : 'visible';
    try {
      if (environment?.document && Object.prototype.hasOwnProperty.call(environment.document, 'visibilityState')) {
        // Browser visibilityState is read-only. This branch only supports a
        // test-double that intentionally exposes a writable property.
        environment.document.visibilityState = visibility;
      }
    } catch {}
    appendHistory('visibility', visibility);
    updatePressure({ emit: true });
    return snapshot();
  };

  const registerConsumer = ({ id, workloads = ['all'], onAction } = {}) => {
    const consumerId = safeId(id, `consumer:${consumers.size + 1}`);
    const declared = new Set((Array.isArray(workloads) ? workloads : [workloads]).map((item) => String(item || '').trim()).filter(Boolean));
    consumers.set(consumerId, { workloads: declared.size ? declared : new Set(['all']), onAction: typeof onAction === 'function' ? onAction : null });
    appendHistory('consumer-registered', consumerId);
    return () => {
      const removed = consumers.delete(consumerId);
      if (removed) appendHistory('consumer-released', consumerId);
      return removed;
    };
  };

  const start = () => {
    if (started) return api;
    started = true;
    appendHistory('started', readHints(environment).deviceClass);
    const performanceApi = environment?.performance;
    const Observer = environment?.PerformanceObserver;
    if (typeof Observer === 'function') {
      try {
        observer = new Observer((list) => {
          for (const entry of list?.getEntries?.() || []) recordLongTask(entry?.duration);
        });
        observer.observe({ entryTypes: ['longtask'] });
      } catch {
        observer = null;
      }
    }
    if (typeof environment?.setInterval === 'function' && performanceApi?.now) {
      monitorTimer = environment.setInterval(() => {
        const current = number(performanceApi.now(), lastLagCheck);
        const drift = Math.max(0, current - lastLagCheck - 1000);
        lastLagCheck = current;
        if (drift >= 90) recordLongTask(drift);
        else updatePressure({ emit: true });
      }, 1000);
      if (typeof monitorTimer?.unref === 'function') monitorTimer.unref();
    }
    try {
      environment?.document?.addEventListener?.('visibilitychange', () => updatePressure({ emit: true }));
    } catch {}
    updatePressure({ emit: false });
    return api;
  };

  const stop = () => {
    if (monitorTimer && typeof environment?.clearInterval === 'function') environment.clearInterval(monitorTimer);
    try { observer?.disconnect?.(); } catch {}
    monitorTimer = null;
    observer = null;
    started = false;
    appendHistory('stopped', 'manual');
    return snapshot();
  };

  const clearSession = () => {
    for (const lease of leases.values()) lease.released = true;
    leases.clear();
    frameSamples.splice(0, frameSamples.length);
    longTaskSamples.splice(0, longTaskSamples.length);
    performanceSamples.splice(0, performanceSamples.length);
    pressure = 'nominal';
    pressureReason = 'session-cleared';
    appendHistory('session-cleared', 'local');
    return snapshot();
  };

  const api = freeze({
    start,
    stop,
    evaluate,
    acquire,
    registerConsumer,
    recordFrame,
    recordLongTask,
    recordPerformanceSample,
    getAdaptiveBudgetOverrides,
    setVisibility,
    getSnapshot: snapshot,
    clearSession,
    getTruth: getEonWorkloadGovernorTruth
  });

  if (autoStart) start();
  return api;
}

function hintsFromEnvironment(environment) {
  return readHints(environment);
}

function hintsConstrained(hints = {}) {
  return String(hints?.deviceClass || '') === 'constrained';
}

let sharedGovernor = null;

/**
 * Browser singleton for surfaces that have not been given a dependency-injected
 * governor. It is memory-only and is deliberately not placed in persistent browser storage.
 */
export function getEonWorkloadGovernor() {
  if (!sharedGovernor) sharedGovernor = createEonWorkloadGovernor({ autoStart: true });
  return sharedGovernor;
}

export function resetEonWorkloadGovernorForTests() {
  try { sharedGovernor?.stop?.(); } catch {}
  sharedGovernor = null;
}
