/** Institutional AI V2 — explicit, open-page EON Radio playback controller. */
import { eonRadioSession } from './eon-radio-session.js';

export const EON_RADIO_PLAYER_SCHEMA = 'eonapp.creator.radio-player.v1';
const freeze = Object.freeze;

function defaultAudioFactory(src) {
  if (typeof Audio !== 'function') return null;
  const audio = new Audio(src);
  audio.preload = 'auto';
  audio.crossOrigin = 'anonymous';
  return audio;
}

export function createEonRadioPlayer(session = eonRadioSession, options = {}) {
  const audioFactory = typeof options.audioFactory === 'function' ? options.audioFactory : defaultAudioFactory;
  let activeAudio = null;
  let playing = false;
  let generation = 0;

  const snapshot = () => freeze({
    schema: EON_RADIO_PLAYER_SCHEMA,
    playing,
    current: session.getCurrentMedia?.() ? freeze({
      id: session.getCurrentMedia().id,
      name: session.getCurrentMedia().name,
      source: session.getCurrentMedia().source
    }) : null,
    openPagePlaybackOnly: true,
    backgroundStreaming: false,
    serviceWorkerAudioPlayback: false,
    commercialCatalogueAccess: false,
    uploaded: false,
    persistedAudio: false
  });

  const detach = () => {
    generation += 1;
    if (!activeAudio) return;
    try { activeAudio.onended = null; activeAudio.onerror = null; activeAudio.pause?.(); } catch {}
    activeAudio = null;
  };

  const playCurrent = async ({ continuation = false } = {}) => {
    const current = session.getCurrentMedia?.();
    if (!current?.objectUrl) { playing = false; return freeze({ ok: false, reason: 'radio-session-empty', snapshot: snapshot() }); }
    detach();
    const token = generation;
    const audio = audioFactory(current.objectUrl, current);
    if (!audio) { playing = false; return freeze({ ok: false, reason: 'browser-audio-unavailable', snapshot: snapshot() }); }
    activeAudio = audio;
    audio.onended = () => {
      if (!playing || token !== generation || activeAudio !== audio) return;
      const next = session.next?.();
      if (!next?.ok) { playing = false; detach(); return; }
      void playCurrent({ continuation: true });
    };
    audio.onerror = () => { if (activeAudio === audio) { playing = false; detach(); } };
    try {
      await audio.play();
      playing = true;
      return freeze({ ok: true, reason: continuation ? 'radio-continuation-playing' : 'radio-station-playing', snapshot: snapshot() });
    } catch {
      if (activeAudio === audio) detach();
      playing = false;
      return freeze({ ok: false, reason: 'audio-playback-blocked-or-failed', snapshot: snapshot() });
    }
  };

  const play = async ({ explicitUserAction = false } = {}) => {
    if (explicitUserAction !== true) return freeze({ ok: false, reason: 'explicit-user-action-required', snapshot: snapshot() });
    return playCurrent();
  };

  const stop = ({ explicitUserAction = false } = {}) => {
    if (explicitUserAction !== true) return freeze({ ok: false, reason: 'explicit-user-action-required', snapshot: snapshot() });
    playing = false;
    detach();
    return freeze({ ok: true, reason: 'radio-station-stopped', snapshot: snapshot() });
  };

  const stepAndMaybePlay = async (direction, { explicitUserAction = false } = {}) => {
    if (explicitUserAction !== true) return freeze({ ok: false, reason: 'explicit-user-action-required', snapshot: snapshot() });
    const wasPlaying = playing;
    const stepped = direction >= 0 ? session.next?.() : session.previous?.();
    if (!stepped?.ok) return freeze({ ok: false, reason: stepped?.reason || 'radio-session-empty', snapshot: snapshot() });
    if (!wasPlaying) return freeze({ ok: true, reason: direction >= 0 ? 'radio-next-track' : 'radio-previous-track', snapshot: snapshot() });
    return playCurrent({ continuation: true });
  };

  return freeze({
    schema: EON_RADIO_PLAYER_SCHEMA,
    play,
    stop,
    next: (options = {}) => stepAndMaybePlay(1, options),
    previous: (options = {}) => stepAndMaybePlay(-1, options),
    snapshot
  });
}

export const eonRadioPlayer = createEonRadioPlayer();

export function getEonRadioPlayerTruth() {
  return freeze({
    schema: EON_RADIO_PLAYER_SCHEMA,
    explicitStartRequired: true,
    continuousQueueWhilePageOpen: true,
    browserAutoplayMayStillBlockStart: true,
    backgroundStreaming: false,
    serviceWorkerAudioPlayback: false,
    commercialCatalogueAccess: false,
    upload: false,
    persistentAudioStorage: false
  });
}
