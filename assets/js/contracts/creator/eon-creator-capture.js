/** A15 I15 — Core-owned, local-only Creator Capture authority. */
import { dispatchEonWorkSurfaceOpen } from '../work-surface/eon-work-surface-registry.js';

export const EON_CREATOR_CAPTURE_SCHEMA = 'eon.creator-capture.a15.v1';
export const EON_CREATOR_CAPTURE_OPEN_EVENT = 'eon:creator-capture:open';
const freeze = (value) => Object.freeze(value);

export function getEonCreatorCaptureTruth() {
  return freeze({
    owner: 'core',
    localOnly: true,
    explicitPermissionRequired: true,
    automaticRecording: false,
    automaticUpload: false,
    automaticPublishing: false,
    microphoneDefault: 'off',
    creatorLibrarySupported: true,
    cityRole: 'adapter-only'
  });
}

export function getEonCreatorCaptureCapability(environment = globalThis) {
  const nav = environment?.navigator || {};
  const mediaDevices = nav.mediaDevices || {};
  const displayCapture = typeof mediaDevices.getDisplayMedia === 'function';
  const mediaRecorder = typeof environment?.MediaRecorder === 'function';
  const canvasCapture = typeof environment?.HTMLCanvasElement?.prototype?.captureStream === 'function';
  const mediaStream = typeof environment?.MediaStream === 'function';
  const blob = typeof environment?.Blob === 'function';
  const objectUrl = typeof environment?.URL?.createObjectURL === 'function' && typeof environment?.URL?.revokeObjectURL === 'function';
  const documentReady = typeof environment?.document?.createElement === 'function';
  return freeze({
    displayCapture,
    userMedia: typeof mediaDevices.getUserMedia === 'function',
    mediaRecorder,
    canvasCapture,
    mediaStream,
    blob,
    objectUrl,
    documentReady,
    nativeShare: typeof nav.share === 'function',
    ready: displayCapture && mediaRecorder && canvasCapture && mediaStream && blob && objectUrl && documentReady,
    uploadsToEonapp: false,
    startsAutomatically: false
  });
}

function stopStream(stream) {
  try { stream?.getTracks?.().forEach((track) => track.stop()); } catch {}
}

function bestMimeType(environment) {
  const candidates = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'];
  return candidates.find((value) => environment.MediaRecorder?.isTypeSupported?.(value)) || '';
}

function createFile(environment, blob, name) {
  if (typeof environment.File === 'function') return new environment.File([blob], name, { type: blob.type || 'video/webm', lastModified: Date.now() });
  blob.name = name;
  return blob;
}

export function createEonCreatorCaptureController({ environment = globalThis, onState = () => {}, onVerifiedCapture = () => {}, filenamePrefix = 'eonapp-capture', frameLabel = 'EONAPP · CREATOR CAPTURE' } = {}) {
  const capability = getEonCreatorCaptureCapability(environment);
  let state = freeze({ schema: EON_CREATOR_CAPTURE_SCHEMA, status: 'idle', active: false, paused: false, error: '', file: null, previewUrl: '', startedAt: 0, durationMs: 0 });
  let displayStream = null;
  let cameraStream = null;
  let micStream = null;
  let compositeStream = null;
  let outputCanvas = null;
  let outputContext = null;
  let displayVideo = null;
  let cameraVideo = null;
  let recorder = null;
  let chunks = [];
  let animationFrame = 0;
  let audioContext = null;
  let lastOptions = {};
  let lifecycle = 0;
  let disposed = false;

  const publish = (patch = {}) => {
    state = freeze({ ...state, ...patch, schema: EON_CREATOR_CAPTURE_SCHEMA });
    onState(state);
    return state;
  };
  const cleanupObjectUrl = () => {
    if (state.previewUrl) try { environment.URL?.revokeObjectURL?.(state.previewUrl); } catch {}
  };
  const cleanupLive = () => {
    if (animationFrame) environment.cancelAnimationFrame?.(animationFrame);
    animationFrame = 0;
    stopStream(displayStream); stopStream(cameraStream); stopStream(micStream); stopStream(compositeStream);
    displayStream = cameraStream = micStream = compositeStream = null;
    try { audioContext?.close?.(); } catch {}
    audioContext = null;
    displayVideo?.remove?.(); cameraVideo?.remove?.(); outputCanvas?.remove?.();
    displayVideo = cameraVideo = outputCanvas = outputContext = null;
    recorder = null;
  };
  const drawFrame = () => {
    if (!outputContext || !outputCanvas || !displayVideo) return;
    const width = outputCanvas.width;
    const height = outputCanvas.height;
    outputContext.fillStyle = '#000'; outputContext.fillRect(0, 0, width, height);
    outputContext.drawImage(displayVideo, 0, 0, width, height);
    if (lastOptions.facecam && cameraVideo?.readyState >= 2) {
      const boxWidth = Math.round(width * 0.24);
      const boxHeight = Math.round(boxWidth * 0.75);
      const margin = Math.round(width * 0.025);
      const x = lastOptions.facecamPosition === 'top-left' ? margin : width - boxWidth - margin;
      const y = margin;
      outputContext.save();
      outputContext.strokeStyle = 'rgba(139,233,255,.95)'; outputContext.lineWidth = Math.max(3, Math.round(width / 400));
      outputContext.fillStyle = 'rgba(5,8,14,.86)'; outputContext.fillRect(x - 4, y - 4, boxWidth + 8, boxHeight + 8);
      outputContext.drawImage(cameraVideo, x, y, boxWidth, boxHeight); outputContext.strokeRect(x, y, boxWidth, boxHeight); outputContext.restore();
    }
    if (lastOptions.creatorFrame) {
      outputContext.save(); outputContext.strokeStyle = 'rgba(255,179,92,.88)'; outputContext.lineWidth = Math.max(5, Math.round(width / 250)); outputContext.strokeRect(4, 4, width - 8, height - 8);
      outputContext.fillStyle = 'rgba(5,8,14,.72)'; outputContext.fillRect(18, height - 58, 310, 40); outputContext.fillStyle = '#f4c985'; outputContext.font = `700 ${Math.max(18, Math.round(width / 65))}px system-ui`; outputContext.fillText(String(frameLabel || 'EONAPP · CREATOR CAPTURE').slice(0, 42), 30, height - 30); outputContext.restore();
    }
    animationFrame = environment.requestAnimationFrame?.(drawFrame) || 0;
  };

  return freeze({
    getState: () => state,
    getCapability: () => capability,
    async start(options = {}) {
      if (disposed) return state;
      if (!capability.ready) return publish({ status: 'error', error: 'capture-api-unavailable' });
      if (state.active) return state;
      const run = ++lifecycle;
      cleanupObjectUrl();
      lastOptions = { facecam: options.facecam === true, microphone: options.microphone === true, facecamPosition: options.facecamPosition === 'top-left' ? 'top-left' : 'top-right', creatorFrame: options.creatorFrame === true };
      publish({ status: 'requesting-display', error: '', file: null, previewUrl: '', durationMs: 0 });
      try {
        displayStream = await environment.navigator.mediaDevices.getDisplayMedia({ video: { frameRate: { ideal: 30, max: 30 } }, audio: true });
        if (lastOptions.facecam) cameraStream = await environment.navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' }, audio: false });
        if (lastOptions.microphone) micStream = await environment.navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }, video: false });
        const videoTrack = displayStream.getVideoTracks()[0];
        const settings = videoTrack?.getSettings?.() || {};
        outputCanvas = environment.document.createElement('canvas');
        outputCanvas.width = Math.max(640, Math.min(1920, Number(settings.width || 1280)));
        outputCanvas.height = Math.max(360, Math.min(1080, Number(settings.height || 720)));
        outputContext = outputCanvas.getContext('2d', { alpha: false });
        if (!outputContext) throw new Error('capture-canvas-context-unavailable');
        displayVideo = environment.document.createElement('video'); displayVideo.muted = true; displayVideo.playsInline = true; displayVideo.srcObject = displayStream; await displayVideo.play();
        if (cameraStream) { cameraVideo = environment.document.createElement('video'); cameraVideo.muted = true; cameraVideo.playsInline = true; cameraVideo.srcObject = cameraStream; await cameraVideo.play(); }
        const visualStream = outputCanvas.captureStream(30);
        const mixedTracks = [...visualStream.getVideoTracks()];
        const audioInputs = [displayStream, micStream].filter(Boolean).filter((stream) => stream.getAudioTracks().length);
        if (audioInputs.length && typeof environment.AudioContext === 'function') {
          audioContext = new environment.AudioContext();
          const destination = audioContext.createMediaStreamDestination();
          for (const stream of audioInputs) audioContext.createMediaStreamSource(stream).connect(destination);
          mixedTracks.push(...destination.stream.getAudioTracks());
        } else {
          mixedTracks.push(...displayStream.getAudioTracks(), ...(micStream?.getAudioTracks?.() || []));
        }
        compositeStream = new environment.MediaStream(mixedTracks);
        const mimeType = bestMimeType(environment);
        recorder = new environment.MediaRecorder(compositeStream, mimeType ? { mimeType, videoBitsPerSecond: 5_000_000 } : { videoBitsPerSecond: 5_000_000 });
        chunks = [];
        recorder.ondataavailable = (event) => { if (event.data?.size) chunks.push(event.data); };
        recorder.onerror = () => {
          if (disposed || run !== lifecycle) return;
          publish({ status: 'error', active: false, error: 'media-recorder-error' });
          cleanupLive();
        };
        recorder.onstop = () => {
          if (disposed || run !== lifecycle) { cleanupLive(); chunks = []; return; }
          const endedAt = Date.now();
          const recordedMimeType = recorder?.mimeType || mimeType || 'video/webm';
          const blob = new environment.Blob(chunks, { type: recordedMimeType });
          const safePrefix = String(filenamePrefix || 'eonapp-capture').replace(/[^a-z0-9_-]+/gi, '-').replace(/^-+|-+$/g, '').slice(0, 48) || 'eonapp-capture';
          const file = createFile(environment, blob, `${safePrefix}-${new Date(endedAt).toISOString().replace(/[:.]/g, '-')}.webm`);
          const previewUrl = environment.URL.createObjectURL(blob);
          const durationMs = Math.max(0, endedAt - state.startedAt);
          cleanupLive();
          chunks = [];
          publish({ status: 'ready', active: false, paused: false, file, previewUrl, durationMs });
          try { onVerifiedCapture(freeze({ schema: EON_CREATOR_CAPTURE_SCHEMA, receiptId: `capture:${endedAt}:${blob.size}`, verified: true, verifiedAt: endedAt, source: 'creator-capture-core', bytes: blob.size, contentType: recordedMimeType, durationMs })); } catch {}
        };
        videoTrack?.addEventListener?.('ended', () => { if (recorder?.state && recorder.state !== 'inactive') recorder.stop(); }, { once: true });
        drawFrame();
        recorder.start(1000);
        return publish({ status: 'recording', active: true, paused: false, startedAt: Date.now(), error: '' });
      } catch (error) {
        cleanupLive();
        if (disposed || run !== lifecycle) return state;
        return publish({ status: 'error', active: false, paused: false, error: String(error?.name || error?.message || 'capture-start-failed') });
      }
    },
    pause() { if (disposed || recorder?.state !== 'recording') return state; recorder.pause(); return publish({ status: 'paused', paused: true }); },
    resume() { if (disposed || recorder?.state !== 'paused') return state; recorder.resume(); return publish({ status: 'recording', paused: false }); },
    stop() { if (disposed) return state; if (!recorder || recorder.state === 'inactive') { cleanupLive(); return publish({ active: false, paused: false, status: state.file ? 'ready' : 'idle' }); } recorder.stop(); return publish({ status: 'encoding', active: false, paused: false }); },
    dispose() {
      if (disposed) return state;
      disposed = true;
      lifecycle += 1;
      if (recorder) {
        recorder.ondataavailable = null;
        recorder.onerror = null;
        recorder.onstop = null;
        if (recorder.state !== 'inactive') try { recorder.stop(); } catch {}
      }
      cleanupLive();
      cleanupObjectUrl();
      chunks = [];
      state = freeze({ ...state, status: 'disposed', active: false, paused: false, file: null, previewUrl: '' });
      return state;
    }
  });
}

export function bindEonCreatorCapture(root, { onStatus = () => {} } = {}) {
  if (!root?.ownerDocument) return () => {};
  const environment = root.ownerDocument.defaultView || globalThis;
  const open = () => {
    onStatus?.('Opening full-screen Creator Capture. Recording remains local and permission-based.');
    dispatchEonWorkSurfaceOpen({ id: 'creator-capture', source: 'core', explicitUserAction: true, context: { type: 'core', referralLink: true } }, environment);
  };
  environment.addEventListener?.(EON_CREATOR_CAPTURE_OPEN_EVENT, open);
  root.dataset.eonCreatorCapture = `${EON_CREATOR_CAPTURE_SCHEMA}.shared-surface`;
  return () => {
    environment.removeEventListener?.(EON_CREATOR_CAPTURE_OPEN_EVENT, open);
    delete root.dataset.eonCreatorCapture;
  };
}
