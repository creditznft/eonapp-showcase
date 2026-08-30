import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createEonNexusPulseMotionController,
  getEonNexusPulseMotionPolicy,
  getEonNexusPulseMotionTruth
} from '../../assets/js/nexus/eon-nexus-pulse-motion.js';

class ProofCustomEvent extends Event {
  constructor(type, options = {}) {
    super(type);
    this.detail = options.detail;
  }
}

function createEnvironment({
  reducedMotion = false,
  hidden = false,
  saveData = false,
  deviceMemory = 8,
  hardwareConcurrency = 8
} = {}) {
  const document = new EventTarget();
  document.hidden = hidden;
  const media = new EventTarget();
  media.matches = reducedMotion;
  media.addEventListener = EventTarget.prototype.addEventListener.bind(media);
  media.removeEventListener = EventTarget.prototype.removeEventListener.bind(media);
  const environment = {
    document,
    CustomEvent: ProofCustomEvent,
    navigator: {
      deviceMemory,
      hardwareConcurrency,
      connection: { saveData }
    },
    matchMedia: () => media
  };
  return { environment, document, media };
}

function createRoot() {
  const root = new EventTarget();
  root.dataset = {};
  root.styles = new Map();
  root.style = {
    setProperty(name, value) {
      root.styles.set(name, String(value));
    }
  };
  return root;
}

test('W660B2 high-capability automatic policy selects full CSS motion', () => {
  const { environment } = createEnvironment({ deviceMemory: 16, hardwareConcurrency: 16 });
  const policy = getEonNexusPulseMotionPolicy({
    environment,
    state: 'processing'
  });
  assert.equal(policy.profile, 'full');
  assert.equal(policy.stateMotion, 'processing-orbit');
  assert.equal(policy.active, true);
  assert.equal(policy.continuousJsLoop, false);
  assert.equal(policy.requiresCanvas, false);
  assert.equal(policy.requiresBabylon, false);
  assert.equal(policy.requiresGlb, false);
});

test('W660B2 reduced motion always selects the static profile', () => {
  const { environment } = createEnvironment({
    reducedMotion: true,
    deviceMemory: 16,
    hardwareConcurrency: 16
  });
  const policy = getEonNexusPulseMotionPolicy({
    environment,
    userPreference: 'full',
    state: 'listening'
  });
  assert.equal(policy.profile, 'static');
  assert.equal(policy.active, false);
  assert.equal(policy.stateMotion, 'none');
  assert.equal(policy.reducedMotion, true);
});

test('W660B2 constrained devices and Data Saver select low-power motion', () => {
  const constrained = getEonNexusPulseMotionPolicy({
    environment: createEnvironment({ deviceMemory: 4, hardwareConcurrency: 4 }).environment,
    state: 'ready'
  });
  assert.equal(constrained.profile, 'low-power');
  assert.equal(constrained.stateMotion, 'ready-breathe');

  const saveData = getEonNexusPulseMotionPolicy({
    environment: createEnvironment({ saveData: true, deviceMemory: 16, hardwareConcurrency: 16 }).environment,
    state: 'speaking'
  });
  assert.equal(saveData.profile, 'low-power');
  assert.equal(saveData.stateMotion, 'speaking-pulse');
});

test('W660B2 hidden documents pause motion without changing truthful state', () => {
  const policy = getEonNexusPulseMotionPolicy({
    environment: createEnvironment({ hidden: true }).environment,
    state: 'waiting-approval',
    privateRoute: true
  });
  assert.equal(policy.state, 'waiting-approval');
  assert.equal(policy.privateRoute, true);
  assert.equal(policy.active, false);
  assert.equal(policy.stateMotion, 'none');
  assert.equal(policy.hidden, true);
});

test('W660B2 controller applies bounded attributes and responds to state, visibility and preference changes', () => {
  const { environment, document, media } = createEnvironment({
    deviceMemory: 16,
    hardwareConcurrency: 16
  });
  const root = createRoot();
  const receipts = [];
  root.addEventListener('eon:nexus-pulse-motion-policy', (event) => receipts.push(event.detail));

  const controller = createEonNexusPulseMotionController({
    root,
    environment,
    state: 'ready'
  });
  assert.equal(controller.ok, true);
  assert.equal(root.dataset.motionProfile, 'full');
  assert.equal(root.dataset.motionActive, 'true');
  assert.equal(root.dataset.motionState, 'ready-breathe');

  controller.update({ state: 'processing', privateRoute: true });
  assert.equal(root.dataset.motionState, 'processing-orbit');
  assert.equal(controller.getPolicy().privateRoute, true);

  document.hidden = true;
  document.dispatchEvent(new Event('visibilitychange'));
  assert.equal(root.dataset.motionActive, 'false');
  assert.equal(root.dataset.motionPaused, 'true');

  document.hidden = false;
  media.matches = true;
  media.dispatchEvent(new Event('change'));
  assert.equal(root.dataset.motionProfile, 'static');
  assert.equal(root.dataset.motionState, 'none');

  media.matches = false;
  controller.setPreference('low-power');
  assert.equal(root.dataset.motionProfile, 'low-power');
  assert.equal(root.dataset.motionActive, 'true');

  controller.dispose();
  assert.equal(root.dataset.motionActive, 'false');
  assert.equal(root.dataset.motionState, 'none');
  assert.ok(receipts.length >= 4);
});

test('W660B2 truth receipt prohibits hidden work and heavy renderers', () => {
  const truth = getEonNexusPulseMotionTruth();
  assert.equal(truth.startsAiWork, false);
  assert.equal(truth.startsVoiceCapture, false);
  assert.equal(truth.approvesAction, false);
  assert.equal(truth.continuousJsLoop, false);
  assert.equal(truth.cssStateMotionOnly, true);
  assert.equal(truth.hiddenMotionPaused, true);
  assert.equal(truth.reducedMotionStatic, true);
  assert.equal(truth.requiresCanvas, false);
  assert.equal(truth.requiresWebGl, false);
  assert.equal(truth.requiresBabylon, false);
  assert.equal(truth.requiresGlb, false);
});
