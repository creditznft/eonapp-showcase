/**
 * W659G — explicit audio-native Live Voice adapter.
 *
 * Live Voice is intentionally separate from Dictate and Voice Conversation.
 * The browser creates a WebRTC call only after an explicit user tap. The
 * standard provider credential is sent to the paired loopback-only EON Local
 * Bridge for a single fixed OpenAI Realtime handshake; it is never sent to an
 * EONAPP/Cloudflare endpoint, persisted by this module, or logged.
 */
import { getApiKey, loadAISettings } from './ai-runtime.js';
import {
  readEonLocalBridgeSession,
  clearEonLocalBridgeSession
} from '../local-ai/eon-local-bridge-client.js';
import { EON_LOCAL_BRIDGE_ENDPOINT } from '../../../config/eon-local-bridge-contract.mjs';

export const EON_LIVE_VOICE_SCHEMA = 'eon.voice.live-realtime.w659g.v1';
export const EON_LIVE_VOICE_MODEL = 'gpt-realtime';

const freeze = (value) => Object.freeze(value);
const clean = (value = '', max = 6000) => Array.from(String(value || ''), (character) => {
  const code = character.charCodeAt(0);
  return code <= 31 || code === 127 ? ' ' : character;
}).join('').trim().slice(0, max);

export function getEonLiveVoiceCapability({
  settings = loadAISettings(),
  bridgeSession = readEonLocalBridgeSession(),
  environment = globalThis,
  providerApiKey = null
} = {}) {
  const provider = clean(settings?.provider || '', 40).toLowerCase();
  const apiKey = provider === 'openai' ? (providerApiKey === null ? getApiKey('openai') : clean(providerApiKey, 6000)) : '';
  const hasWebRtc = typeof environment?.RTCPeerConnection === 'function'
    && Boolean(environment?.navigator?.mediaDevices?.getUserMedia);
  const paired = Boolean(bridgeSession?.token);
  const ready = hasWebRtc && paired && provider === 'openai' && Boolean(apiKey);
  let reason = 'Live Voice needs WebRTC microphone support.';
  if (hasWebRtc && !paired) reason = 'Open and connect EON Local Companion to keep the Realtime handshake off EONAPP servers.';
  else if (hasWebRtc && paired && provider !== 'openai') reason = 'Select a verified OpenAI provider for audio-native Live Voice. Other text and local models remain available through Voice Conversation.';
  else if (hasWebRtc && paired && provider === 'openai' && !apiKey) reason = 'Add and verify your OpenAI key in Vault before starting Live Voice.';
  else if (ready) reason = 'Audio-native Live Voice is ready through the paired local bridge.';
  return freeze({
    schema: EON_LIVE_VOICE_SCHEMA,
    ready,
    provider,
    paired,
    hasWebRtc,
    model: EON_LIVE_VOICE_MODEL,
    reason,
    noAutomaticMicrophone: true,
    noCloudCredentialCustody: true,
    transcriptMemoryOnly: true
  });
}

function waitForIceGathering(peer, timeoutMs = 4500) {
  if (peer.iceGatheringState === 'complete') return Promise.resolve();
  return new Promise((resolve) => {
    const timer = setTimeout(done, timeoutMs);
    function done() {
      clearTimeout(timer);
      peer.removeEventListener('icegatheringstatechange', onChange);
      resolve();
    }
    function onChange() {
      if (peer.iceGatheringState === 'complete') done();
    }
    peer.addEventListener('icegatheringstatechange', onChange);
  });
}

function safeEventPayload(raw = '') {
  try { return JSON.parse(String(raw || '')); } catch { return null; }
}

function transcriptFromEvent(event = {}) {
  const type = String(event?.type || '');
  if (type === 'response.audio_transcript.delta') return { kind: 'assistant-delta', text: clean(event.delta || '', 1200) };
  if (type === 'response.audio_transcript.done') return { kind: 'assistant', text: clean(event.transcript || '', 6000) };
  if (type === 'conversation.item.input_audio_transcription.completed') return { kind: 'user', text: clean(event.transcript || '', 6000) };
  if (type === 'error') return { kind: 'error', text: clean(event?.error?.message || 'Live Voice provider error.', 600) };
  return null;
}

export function createEonLiveVoiceController({
  onState = () => {},
  onTranscript = () => {},
  onRemoteAudio = () => {},
  environment = globalThis,
  instructions = 'You are EONBOT. Speak naturally, be concise, and never claim a tool or action completed unless a visible verified receipt exists.'
} = {}) {
  let peer = null;
  let microphone = null;
  let dataChannel = null;
  let audioElement = null;
  let state = freeze({ status: 'idle', active: false, error: '', capability: getEonLiveVoiceCapability({ environment }) });

  const emit = (patch = {}) => {
    state = freeze({ ...state, ...patch });
    try { onState(state); } catch {}
    return state;
  };

  const stop = ({ reason = 'user-stop' } = {}) => {
    try { dataChannel?.close?.(); } catch {}
    try { peer?.close?.(); } catch {}
    try { microphone?.getTracks?.().forEach((track) => track.stop()); } catch {}
    try { if (audioElement) { audioElement.pause?.(); audioElement.srcObject = null; audioElement.remove?.(); } } catch {}
    peer = null;
    microphone = null;
    dataChannel = null;
    audioElement = null;
    return emit({ status: 'idle', active: false, error: '', stopReason: reason, capability: getEonLiveVoiceCapability({ environment }) });
  };

  const start = async ({ explicitUserAction = false, locale = 'en-US' } = {}) => {
    if (!explicitUserAction) return emit({ status: 'blocked', active: false, error: 'explicit-user-action-required' });
    if (state.active || state.status === 'connecting') return state;
    const settings = loadAISettings();
    const bridgeSession = readEonLocalBridgeSession();
    const capability = getEonLiveVoiceCapability({ settings, bridgeSession, environment });
    if (!capability.ready) return emit({ status: 'unavailable', active: false, error: capability.reason, capability });
    const apiKey = getApiKey('openai');
    emit({ status: 'requesting-microphone', active: false, error: '', capability });
    try {
      microphone = await environment.navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }, video: false });
      peer = new environment.RTCPeerConnection();
      microphone.getAudioTracks().forEach((track) => peer.addTrack(track, microphone));
      audioElement = environment.document?.createElement?.('audio') || null;
      if (audioElement) {
        audioElement.autoplay = true;
        audioElement.playsInline = true;
        audioElement.hidden = true;
        environment.document?.body?.appendChild?.(audioElement);
      }
      peer.ontrack = (event) => {
        const Stream = environment.MediaStream || globalThis.MediaStream;
        const stream = event.streams?.[0] || (typeof Stream === 'function' ? new Stream([event.track]) : null);
        if (!stream) return;
        if (audioElement) audioElement.srcObject = stream;
        try { onRemoteAudio(stream); } catch {}
      };
      peer.onconnectionstatechange = () => {
        const connection = String(peer?.connectionState || '');
        if (['failed', 'closed', 'disconnected'].includes(connection) && state.active) stop({ reason: `webrtc-${connection}` });
      };
      dataChannel = peer.createDataChannel('oai-events');
      dataChannel.onopen = () => emit({ status: 'live', active: true, error: '' });
      dataChannel.onmessage = (message) => {
        const event = safeEventPayload(message.data);
        const transcript = transcriptFromEvent(event);
        if (transcript) {
          try { onTranscript(transcript, event); } catch {}
          if (transcript.kind === 'error') emit({ error: transcript.text });
        }
      };
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      await waitForIceGathering(peer);
      emit({ status: 'connecting', active: false, error: '' });
      const response = await environment.fetch(`${EON_LOCAL_BRIDGE_ENDPOINT}/v1/realtime/openai/call`, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${bridgeSession.token}`,
          'content-type': 'application/json',
          accept: 'application/json'
        },
        body: JSON.stringify({
          apiKey,
          sdp: peer.localDescription?.sdp || offer.sdp || '',
          session: {
            type: 'realtime',
            model: EON_LIVE_VOICE_MODEL,
            instructions: clean(instructions, 6000),
            output_modalities: ['audio'],
            audio: { input: { transcription: { model: 'gpt-4o-mini-transcribe', language: clean(locale, 20) } }, output: { voice: 'marin' } }
          }
        }),
        cache: 'no-store'
      });
      const payload = await response.json().catch(() => ({}));
      if (response.status === 401) clearEonLocalBridgeSession();
      if (!response.ok || payload?.ok !== true || !payload?.sdp) throw new Error(clean(payload?.message || payload?.error || `live-voice-http-${response.status}`, 500));
      await peer.setRemoteDescription({ type: 'answer', sdp: String(payload.sdp) });
      return emit({ status: dataChannel.readyState === 'open' ? 'live' : 'connecting', active: dataChannel.readyState === 'open', error: '', callId: clean(payload.callId || '', 160) });
    } catch (error) {
      const message = clean(error?.message || 'Live Voice could not start.', 600);
      stop({ reason: 'start-failed' });
      return emit({ status: 'error', active: false, error: message, capability: getEonLiveVoiceCapability({ environment }) });
    }
  };

  return freeze({
    getState: () => state,
    refreshCapability: () => emit({ capability: getEonLiveVoiceCapability({ environment }) }),
    start,
    stop,
    dispose: () => stop({ reason: 'dispose' })
  });
}

export default freeze({ EON_LIVE_VOICE_SCHEMA, EON_LIVE_VOICE_MODEL, getEonLiveVoiceCapability, createEonLiveVoiceController });
