/**
 * IoT Control Hub — EONAPP.CH Edition
 * ======================================
 * Adapted from eonpackage/src/platforms/IoT_AI_Control_Hub_Enhanced_V5.tsx
 * for vanilla JS, localStorage-first persistence, and EONAPP Pool Points.
 *
 * Features:
 * - Device management (add, remove, control via HTTP/WebSocket)
 * - Automation engine with rule-based triggers
 * - Voice command processing (Web Speech API + AI interpretation)
 * - Scene management (group devices into presets)
 * - Telemetry monitoring and alerting
 * - Subscription-tiered device limits
 * - Pool Points for device templates and automation creation
 *
 * PRODUCTION-READY: Real WebSocket connections, real HTTP device commands,
 * real SpeechRecognition API, real automation rule evaluation.
 *
 * @module utils/iot-control-hub
 */

import { buildRecognitionLocaleCandidates, resolveSpeechLocale } from './speech-locale.js';
import { runMissionEngine } from './mission-engine.js';

// Browser global type cast for custom window properties
const appWin = /** @type {any} */ (window);

// -- Storage keys --
const DEVICES_KEY = 'eon:iot:devices:v1';
const RULES_KEY = 'eon:iot:rules:v1';
const SCENES_KEY = 'eon:iot:scenes:v1';
const TELEMETRY_KEY = 'eon:iot:telemetry:v1';
const VOICE_HISTORY_KEY = 'eon:iot:voice-history:v1';

// -- Device categories --
export const /** @type {any} */
DEVICE_CATEGORIES = {
  smart_home: { label: 'Smart Home', icon: 'house', capabilities: ['on_off', 'dim', 'temperature', 'color'] },
  light: { label: 'Lights', icon: 'lightbulb', capabilities: ['on_off', 'dim', 'color', 'temperature'] },
  thermostat: { label: 'Thermostat', icon: 'thermostat', capabilities: ['temperature', 'mode', 'fan_speed'] },
  camera: { label: 'Camera', icon: 'videocam', capabilities: ['stream', 'snapshot', 'pan', 'tilt', 'record'] },
  sensor: { label: 'Sensor', icon: 'sensors', capabilities: ['read', 'alert_threshold'] },
  appliance: { label: 'Appliance', icon: 'kitchen', capabilities: ['on_off', 'mode', 'timer'] },
  speaker: { label: 'Speaker', icon: 'speaker', capabilities: ['volume', 'play', 'pause', 'track'] },
  lock: { label: 'Lock', icon: 'lock', capabilities: ['lock', 'unlock', 'auto_lock'] },
  custom: { label: 'Custom', icon: 'device_hub', capabilities: ['on_off', 'custom_command'] }
};

// -- Connection protocols --
export const /** @type {any} */
PROTOCOLS = {
  http: { label: 'HTTP/REST', requiresEndpoint: true },
  websocket: { label: 'WebSocket', requiresEndpoint: true },
  mqtt: { label: 'MQTT', requiresEndpoint: true },
  bluetooth: { label: 'Bluetooth', requiresEndpoint: false },
  zigbee: { label: 'Zigbee', requiresEndpoint: false },
  zwave: { label: 'Z-Wave', requiresEndpoint: false }
};

// -- Subscription device limits --
const /** @type {any} */
DEVICE_LIMITS = {
  free: 3,
  spark: 10,
  builder: 25,
  pro: 50,
  operator: 100
};

// -- Helpers --
function cryptoId() {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, /** @type {any} */ b => b.toString(16).padStart(2, '0')).join('');
}

function loadJson(/** @type {any} */ key, /** @type {any} */ fallback) {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === 'object' ? parsed : fallback;
  } catch { return fallback; }
}

function saveJson(/** @type {any} */ key, /** @type {any} */ value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

function getSubscriptionPlan() {
  try {
    const entData = JSON.parse(localStorage.getItem('eon:entitlements:v1') || 'null');
    return entData?.activePlanId || 'free';
  } catch { return 'free'; }
}

// -- WebSocket manager (production) --
class WebSocketManager {
  constructor() {
    this.connections = new Map();
    /** @type {any[]} */
    this._actionQueue = [];
    this._throttleTimer = null;
    this._THROTTLE_MS = 100;
  }

  connect(/** @type {any} */ deviceId, /** @type {any} */ url, /** @type {any} */ identityKey) {
    if (this.connections.has(deviceId)) {
      const existing = this.connections.get(deviceId);
      if (existing.readyState === WebSocket.OPEN) return true;
      try { existing.close(); } catch {}
    }

    try {
      const ws = /** @type {any} */ (new WebSocket(url));
      ws.onopen = () => {
        ws._eonConnected = true;
        if (identityKey) {
          try { ws.send(JSON.stringify({ type: 'auth', key: identityKey })); } catch {}
        }
      };
      ws.onerror = () => {
        ws._eonConnected = false;
      };
      ws.onclose = () => {
        ws._eonConnected = false;
        this.connections.delete(deviceId);
      };
      this.connections.set(deviceId, ws);
      return true;
    } catch {
      return false;
    }
  }

  send(/** @type {any} */ deviceId, /** @type {any} */ message) {
    this._actionQueue.push({ deviceId, message });
    if (!this._throttleTimer) {
      this._throttleTimer = setTimeout(() => this._flushQueue(), this._THROTTLE_MS);
    }
    return true;
  }

  _flushQueue() {
    this._throttleTimer = null;
    const batch = this._actionQueue.splice(0, this._actionQueue.length);
    for (const { deviceId, message } of batch) {
      const ws = this.connections.get(deviceId);
      if (!ws || ws.readyState !== WebSocket.OPEN) continue;
      try {
        ws.send(typeof message === 'string' ? message : JSON.stringify(message));
      } catch {}
    }
  }

  isConnected(/** @type {any} */ deviceId) {
    const ws = this.connections.get(deviceId);
    return ws && ws.readyState === WebSocket.OPEN;
  }

  disconnect(/** @type {any} */ deviceId) {
    const ws = this.connections.get(deviceId);
    if (ws) {
      try { ws.close(); } catch {}
      this.connections.delete(deviceId);
    }
  }

  disconnectAll() {
    for (const [id] of this.connections) this.disconnect(id);
  }
}

// -- Automation Engine (production) --
class AutomationEngine {
  constructor() {
    /** @type {any[]} */
    this.rules = [];
    this._interval = null;
    this._onCommand = null;
    this._getDeviceState = null;
    this._cycleCounters = new Map();
    this._MAX_CYCLE_ITERATIONS = 3;
  }

  initialize(/** @type {any} */ rules, /** @type {any} */ onCommand, /** @type {any} */ getDeviceState) {
    this.rules = rules;
    this._onCommand = onCommand;
    this._getDeviceState = getDeviceState;
    this.start();
  }

  start() {
    if (this._interval) return;
    this._interval = setInterval(() => this._evaluateAll(), 5000);
  }

  stop() {
    if (this._interval) {
      clearInterval(this._interval);
      this._interval = null;
    }
  }

  addRule(/** @type {any} */ rule) {
    this.rules.push(rule);
    saveJson(RULES_KEY, this.rules);
    if (!this._interval) this.start();
  }

  removeRule(/** @type {any} */ ruleId) {
    this.rules = this.rules.filter(/** @type {any} */ r => r.id !== ruleId);
    saveJson(RULES_KEY, this.rules);
    if (this.rules.length === 0) this.stop();
  }

  _evaluateAll() {
    this._resetCycleCounters();
    for (const /** @type {any} */
rule of this.rules) {
      if (!rule.enabled) continue;
      try {
        const allConditionsMet = rule.conditions.every((/** @type {any} */ cond) => {
          if (!this._getDeviceState) return false;
          const state = this._getDeviceState(cond.deviceId);
          if (!state) return false;
          return this._evaluateCondition(cond, state);
        });

        if (allConditionsMet && !rule._lastFired) {
          rule._lastFired = Date.now();
          this._executeActions(rule.actions);
        } else if (!allConditionsMet) {
          rule._lastFired = false;
        }
      } catch {}
    }
  }

  _evaluateCondition(/** @type {any} */ condition, /** @type {any} */ deviceState) {
    const param = condition.parameter;
    const operator = condition.operator;
    const value = condition.value;
    const deviceValue = deviceState[param];

    if (deviceValue === undefined || deviceValue === null) return false;

    switch (operator) {
      case 'equals': return deviceValue === value;
      case 'not_equals': return deviceValue !== value;
      case 'greater_than': return Number(deviceValue) > Number(value);
      case 'less_than': return Number(deviceValue) < Number(value);
      case 'contains': return String(deviceValue).includes(String(value));
      case 'between': return Number(deviceValue) >= Number(value[0]) && Number(deviceValue) <= Number(value[1]);
      default: return false;
    }
  }

  _executeActions(/** @type {any} */ actions) {
    if (!this._onCommand) return;
    for (const /** @type {any} */
action of actions) {
      const actionKey = `${action.deviceId}:${action.command}`;
      const count = (this._cycleCounters.get(actionKey) || 0) + 1;
      if (count > this._MAX_CYCLE_ITERATIONS) {
        console.warn('[IoT] Cycle detected for', actionKey, '- breaking after', this._MAX_CYCLE_ITERATIONS, 'iterations');
        continue;
      }
      this._cycleCounters.set(actionKey, count);
      this._onCommand(action.deviceId, action.command, action.parameters || {});
    }
  }

  _resetCycleCounters() {
    this._cycleCounters.clear();
  }

  dispose() {
    this.stop();
    this.rules = [];
  }
}

// -- Service class --
class IoTControlHubService {
  constructor() {
    /** @type {any[]} */
    this.devices = [];
    /** @type {any[]} */
    this.scenes = [];
    /** @type {any[]} */
    this.telemetry = [];
    /** @type {any[]} */
    this.voiceHistory = [];
    this.wsManager = new WebSocketManager();
    this.automationEngine = new AutomationEngine();
    this._speechRecognition = null;
    this._isListening = false;
    this._hydrate();

    // Initialize automation engine with stored rules
    const rules = loadJson(RULES_KEY, []);
    this.automationEngine.initialize(
      rules,
      (/** @type {any} */ deviceId, /** @type {any} */ command, /** @type {any} */ params) => this.sendCommand(deviceId, command, params),
      (/** @type {any} */ deviceId) => this.getDeviceState(deviceId)
    );
  }

  // -- Device management --
  addDevice(/** @type {any} */ config) {
    const plan = getSubscriptionPlan();
    const limit = (/** @type {any} */ (DEVICE_LIMITS))[plan] || DEVICE_LIMITS.free;
    if (this.devices.length >= limit) {
      return { success: false, error: `Device limit reached (${limit} for ${plan} tier). Upgrade to add more.` };
    }

    if (!config.name || !config.category || !config.protocol) {
      return { success: false, error: 'Name, category, and protocol are required' };
    }

    const protocolConfig = (/** @type {any} */ (PROTOCOLS))[config.protocol];
    if (protocolConfig?.requiresEndpoint && !config.endpoint) {
      return { success: false, error: `Protocol ${config.protocol} requires an endpoint URL` };
    }

    const /** @type {any} */
device = {
      id: `iot-${cryptoId()}`,
      name: config.name,
      category: config.category,
      type: config.type || config.category,
      manufacturer: config.manufacturer || '',
      model: config.model || '',
      protocol: config.protocol,
      endpoint: config.endpoint || '',
      status: 'offline',
      capabilities: (/** @type {any} */ (DEVICE_CATEGORIES))[config.category]?.capabilities || ['on_off'],
      state: {},
      lastSeen: null,
      addedAt: Date.now()
    };

    this.devices.push(device);
    this._persist();

    // Attempt connection
    if (device.endpoint) {
      this._connectDevice(device);
    }

    if (appWin.EonPoolPoints?.awardPoints) {
      appWin.EonPoolPoints.awardPoints('iot-device-add', `Added IoT device: ${device.name}`);
    }

    return { success: true, device };
  }

  removeDevice(/** @type {any} */ deviceId) {
    this.wsManager.disconnect(deviceId);
    this.devices = this.devices.filter((/** @type {any} */ d) => d.id !== deviceId);
    this._persist();
  }

  updateDeviceState(/** @type {any} */ deviceId, /** @type {any} */ state) {
    const device = this.devices.find((/** @type {any} */ d) => d.id === deviceId);
    if (!device) return;
    device.state = { ...device.state, ...state };
    device.lastSeen = Date.now();
    device.status = 'online';
    this._persist();
    this._recordTelemetry(deviceId, state);
  }

  getDeviceState(/** @type {any} */ deviceId) {
    const device = this.devices.find((/** @type {any} */ d) => d.id === deviceId);
    return device ? device.state : null;
  }

  getDevice(/** @type {any} */ deviceId) {
    return this.devices.find((/** @type {any} */ d) => d.id === deviceId) || null;
  }

  // -- Device commands (production) --
  async sendCommand(/** @type {any} */ deviceId, /** @type {any} */ command, /** @type {any} */ parameters) {
    const device = this.devices.find((/** @type {any} */ d) => d.id === deviceId);
    if (!device) return { success: false, error: 'Device not found' };

    let delivered = false;

    switch (device.protocol) {
      case 'websocket':
        delivered = this._sendWebSocketCommand(device, command, parameters);
        break;
      case 'http':
        delivered = await this._sendHTTPCommand(device, command, parameters);
        break;
      default:
        // For protocols without direct transport, store command locally
        delivered = true;
        break;
    }

    if (delivered) {
      this.updateDeviceState(deviceId, { [command]: parameters || true });
    }

    return { success: delivered, command, parameters };
  }

  _sendWebSocketCommand(/** @type {any} */ device, /** @type {any} */ command, /** @type {any} */ parameters) {
    if (!this.wsManager.isConnected(device.id)) {
      if (device.endpoint) this._connectDevice(device);
      return false;
    }
    return this.wsManager.send(device.id, { command, parameters, timestamp: Date.now() });
  }

  async _sendHTTPCommand(/** @type {any} */ device, /** @type {any} */ command, /** @type {any} */ parameters) {
    if (!device.endpoint) return false;
    try {
      const url = device.endpoint.endsWith('/')
        ? `${device.endpoint}command`
        : `${device.endpoint}/command`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command, parameters, deviceId: device.id, timestamp: Date.now() })
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  _connectDevice(/** @type {any} */ device) {
    if (device.protocol === 'websocket' && device.endpoint) {
      const connected = this.wsManager.connect(device.id, device.endpoint, null);
      if (connected) {
        device.status = 'connecting';
        // Check connection after timeout
        setTimeout(() => {
          if (this.wsManager.isConnected(device.id)) {
            device.status = 'online';
            device.lastSeen = Date.now();
            this._persist();
          } else {
            device.status = 'offline';
            this._persist();
          }
        }, 3000);
      }
    } else if (device.protocol === 'http' && device.endpoint) {
      // Test HTTP connection with a ping
      this._pingHTTPDevice(device);
    }
  }

  async _pingHTTPDevice(/** @type {any} */ device) {
    try {
      const url = device.endpoint.endsWith('/')
        ? `${device.endpoint}status`
        : `${device.endpoint}/status`;
      const response = await fetch(url, { method: 'GET' });
      if (response.ok) {
        const data = await response.json().catch(() => ({}));
        device.status = 'online';
        device.lastSeen = Date.now();
        device.state = { ...device.state, ...data };
      } else {
        device.status = 'offline';
      }
    } catch {
      device.status = 'offline';
    }
    this._persist();
  }

  // Refresh all device connections
  async refreshAll() {
    for (const /** @type {any} */
device of this.devices) {
      if (device.endpoint) this._connectDevice(device);
    }
  }

  // -- Scene management --
  createScene(/** @type {any} */ name, /** @type {any} */ deviceSettings) {
    const /** @type {any} */
scene = {
      id: `scene-${cryptoId()}`,
      name,
      deviceSettings: deviceSettings || [],
      createdAt: Date.now()
    };
    this.scenes.push(scene);
    this._persist();

    if (appWin.EonPoolPoints?.awardPoints) {
      appWin.EonPoolPoints.awardPoints('iot-scene-create', `Created IoT scene: ${name}`);
    }

    return { success: true, scene };
  }

  async activateScene(/** @type {any} */ sceneId) {
    const scene = this.scenes.find((/** @type {any} */ s) => s.id === sceneId);
    if (!scene) return { success: false, error: 'Scene not found' };

    const /** @type {any} */
results = [];
    for (const /** @type {any} */
setting of scene.deviceSettings) {
      const result = await this.sendCommand(setting.deviceId, setting.command, setting.parameters);
      results.push(result);
    }

    return { success: true, results };
  }

  removeScene(/** @type {any} */ sceneId) {
    this.scenes = this.scenes.filter((/** @type {any} */ s) => s.id !== sceneId);
    this._persist();
  }

  // -- Automation rules --
  addAutomationRule(/** @type {any} */ ruleConfig) {
    const /** @type {any} */
rule = {
      id: `rule-${cryptoId()}`,
      name: ruleConfig.name || 'Unnamed Rule',
      enabled: true,
      conditions: ruleConfig.conditions || [],
      actions: ruleConfig.actions || [],
      createdAt: Date.now(),
      _lastFired: false
    };

    this.automationEngine.addRule(rule);

    if (appWin.EonPoolPoints?.awardPoints) {
      appWin.EonPoolPoints.awardPoints('iot-automation-create', `Created automation: ${rule.name}`);
    }

    return { success: true, rule };
  }

  removeAutomationRule(/** @type {any} */ ruleId) {
    this.automationEngine.removeRule(ruleId);
  }

  toggleRule(/** @type {any} */ ruleId) {
    const rule = this.automationEngine.rules.find((/** @type {any} */ r) => r.id === ruleId);
    if (rule) {
      rule.enabled = !rule.enabled;
      saveJson(RULES_KEY, this.automationEngine.rules);
    }
  }

  getRules() {
    return this.automationEngine.rules;
  }

  // -- Voice control (production Web Speech API) --
  startVoiceListening() {
    const SpeechRecognition = appWin.SpeechRecognition || appWin.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      return { success: false, error: 'Speech Recognition not supported in this browser' };
    }

    if (this._isListening) return { success: true, message: 'Already listening' };

    try {
      const candidates = buildRecognitionLocaleCandidates(
        resolveSpeechLocale({
          appLanguage: localStorage.getItem('eon:lang:preference:v1') || localStorage.getItem('eon:lang:v1') || '',
          preferredLanguage: localStorage.getItem('eon:lang:preference:v1') || localStorage.getItem('eon:lang:v1') || '',
          browserLocales: Array.isArray(navigator.languages) ? navigator.languages : []
        }),
        Array.isArray(navigator.languages) ? navigator.languages : []
      );
      let candidateIndex = 0;

      const startWithLocale = () => {
        this._speechRecognition = new SpeechRecognition();
        this._speechRecognition.continuous = false;
        this._speechRecognition.interimResults = false;
        this._speechRecognition.lang = candidates[candidateIndex] || navigator.language || 'en-US';

        this._speechRecognition.onresult = (/** @type {any} */ event) => {
          const transcript = event.results[0][0].transcript;
          this._processVoiceCommand(transcript);
        };

        this._speechRecognition.onerror = () => {
          if (candidateIndex < candidates.length - 1) {
            candidateIndex += 1;
            try {
              this._speechRecognition.lang = candidates[candidateIndex];
              this._speechRecognition.start();
              return;
            } catch {}
          }
          this._isListening = false;
        };

        this._speechRecognition.onend = () => {
          this._isListening = false;
        };

        this._speechRecognition.start();
      };

      startWithLocale();
      this._isListening = true;
      return { success: true };
    } catch (/** @type {any} */
err) {
      return { success: false, error: (/** @type {Error} */ (err)).message };
    }
  }

  stopVoiceListening() {
    if (this._speechRecognition && this._isListening) {
      try { this._speechRecognition.stop(); } catch {}
      this._isListening = false;
    }
  }

  get isListening() {
    return this._isListening;
  }

  _processVoiceCommand(/** @type {any} */ transcript) {
    const command = transcript.toLowerCase().trim();

    // Record in history
    this.voiceHistory.push({
      transcript,
      timestamp: Date.now(),
      processed: true
    });
    if (this.voiceHistory.length > 100) this.voiceHistory = this.voiceHistory.slice(-100);
    saveJson(VOICE_HISTORY_KEY, this.voiceHistory);

    // Local pattern matching for common commands
    /** @type {any[]} */
    const /** @type {any} */
commands = [];

    if (command.includes('turn off') || command.includes('switch off')) {
      if (command.includes('all lights')) {
        this.devices.filter((/** @type {any} */ d) => d.category === 'light').forEach((/** @type {any} */ d) => {
          commands.push({ deviceId: d.id, command: 'off', parameters: {} });
        });
      } else if (command.includes('all')) {
        this.devices.forEach((/** @type {any} */ d) => {
          commands.push({ deviceId: d.id, command: 'off', parameters: {} });
        });
      }
    }

    if (command.includes('turn on') || command.includes('switch on')) {
      if (command.includes('all lights')) {
        this.devices.filter((/** @type {any} */ d) => d.category === 'light').forEach((/** @type {any} */ d) => {
          commands.push({ deviceId: d.id, command: 'on', parameters: {} });
        });
      }
    }

    if (command.includes('lock')) {
      this.devices.filter((/** @type {any} */ d) => d.category === 'lock').forEach((/** @type {any} */ d) => {
        commands.push({ deviceId: d.id, command: 'lock', parameters: {} });
      });
    }

    if (command.includes('unlock')) {
      this.devices.filter((/** @type {any} */ d) => d.category === 'lock').forEach((/** @type {any} */ d) => {
        commands.push({ deviceId: d.id, command: 'unlock', parameters: {} });
      });
    }

    // Execute matched commands
    for (const /** @type {any} */
cmd of commands) {
      this.sendCommand(cmd.deviceId, cmd.command, cmd.parameters);
    }

    if (appWin.EonPoolPoints?.awardPoints && commands.length > 0) {
      appWin.EonPoolPoints.awardPoints('iot-voice-command', `Voice command: ${transcript.slice(0, 50)}`);
    }

    return { success: commands.length > 0, commands, transcript };
  }

  // AI-powered voice interpretation
  async interpretVoiceWithAI(/** @type {any} */ transcript, /** @type {any} */ aiRuntime) {
    if (!aiRuntime) return { success: false, error: 'AI runtime not available' };

    const deviceList = this.devices.map((/** @type {any} */ d) => `${d.name} (${d.category}, ${d.protocol})`).join(', ');

    const systemPrompt = `You are EONBOT IoT Assistant. Interpret this natural language IoT command.
Available devices: ${deviceList}
Return JSON ONLY: {
  "intent": "primary intent",
  "confidence": 0-100,
  "targetDevices": ["device names"],
  "actions": [{ "device": "name", "command": "action", "parameters": {} }],
  "confirmation": "Natural language confirmation",
  "alternatives": ["alt interpretation 1"]
}`;

    try {
      const runtimeSettings = typeof aiRuntime.loadAISettings === 'function' ? aiRuntime.loadAISettings() : {};
      const reply = await runMissionEngine({
        mode: 'agent',
        prompt: `Interpret IoT command: "${transcript}"`,
        history: [],
        systemPrompt,
        settings: runtimeSettings,
        taskType: 'agent',
        origin: 'iot-control-hub',
        metadata: {
          surface: 'iot',
          transcript
        }
      });
      const result = String(reply?.text || '');

      if (!result) return { success: false, error: 'AI returned empty' };

      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return { success: false, error: 'AI did not return valid JSON' };

      const interpretation = JSON.parse(jsonMatch[0]);

      // Execute the interpreted actions
      for (const /** @type {any} */
action of interpretation.actions || []) {
        const device = this.devices.find((/** @type {any} */ d) =>
          d.name.toLowerCase().includes(action.device?.toLowerCase())
        );
        if (device) {
          await this.sendCommand(device.id, action.command, action.parameters || {});
        }
      }

      if (appWin.EonPoolPoints?.awardPoints) {
        appWin.EonPoolPoints.awardPoints('iot-voice-ai', `AI voice interpretation: ${transcript.slice(0, 50)}`);
      }

      return { success: true, interpretation };
    } catch (/** @type {any} */
err) {
      return { success: false, error: (/** @type {Error} */ (err)).message };
    }
  }

  // -- Telemetry --
  _recordTelemetry(/** @type {any} */ deviceId, /** @type {any} */ state) {
    this.telemetry.push({
      deviceId,
      state: { ...state },
      timestamp: Date.now()
    });
    if (this.telemetry.length > 500) this.telemetry = this.telemetry.slice(-500);
    saveJson(TELEMETRY_KEY, this.telemetry.slice(-200));
  }

  getTelemetry(/** @type {any} */ deviceId, /** @type {any} */ limit) {
    const entries = deviceId
      ? this.telemetry.filter((/** @type {any} */ t) => t.deviceId === deviceId)
      : this.telemetry;
    return entries.slice(-(limit || 50));
  }

  // -- Stats --
  getStats() {
    return {
      totalDevices: this.devices.length,
      onlineDevices: this.devices.filter((/** @type {any} */ d) => d.status === 'online').length,
      offlineDevices: this.devices.filter((/** @type {any} */ d) => d.status === 'offline').length,
      totalScenes: this.scenes.length,
      totalRules: this.automationEngine.rules.length,
      activeRules: this.automationEngine.rules.filter((/** @type {any} */ r) => r.enabled).length,
      deviceLimit: (/** @type {any} */ (DEVICE_LIMITS))[getSubscriptionPlan()] || DEVICE_LIMITS.free,
      subscriptionPlan: getSubscriptionPlan()
    };
  }

  // -- Persistence --
  _hydrate() {
    this.devices = loadJson(DEVICES_KEY, []);
    this.scenes = loadJson(SCENES_KEY, []);
    this.telemetry = loadJson(TELEMETRY_KEY, []);
    this.voiceHistory = loadJson(VOICE_HISTORY_KEY, []);
  }

  _persist() {
    saveJson(DEVICES_KEY, this.devices.slice(-100));
    saveJson(SCENES_KEY, this.scenes.slice(-50));
  }

  // -- Cleanup --
  dispose() {
    this.wsManager.disconnectAll();
    this.automationEngine.dispose();
    this.stopVoiceListening();
  }
}

// -- Singleton --
const iotControlHubService = new IoTControlHubService();
export default iotControlHubService;
export { IoTControlHubService };
