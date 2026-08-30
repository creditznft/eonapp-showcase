import { transcodeWebmBlobToMp4Blob } from './mp4-export.js';
import { runMissionEngine } from './mission-engine.js';
import { EON_WORKLOAD_KINDS, getEonWorkloadGovernor } from '../runtime/eon-workload-governor.js';

/**
 * Video Editing Lab — EONAPP.CH Creator Studio
 * ===============================================
 * AI-powered video editing suite for EONAPP Creator Studio.
 * Adapted from eonpackage video platform concepts for vanilla JS.
 *
 * Features:
 * - Timeline-based video editor (multi-track)
 * - AI video generation (text-to-video via AI runtime)
 * - Clip trimming and splitting
 * - Text overlay and subtitle generation
 * - Transition effects (fade, dissolve, wipe)
 * - Audio track mixing
 * - Export to WebM (browser-native MediaRecorder)
 * - Optional MP4 transcode via local FFmpeg WASM
 * - AI subtitle generation
 * - Pool Points for creation and publishing
 *
 * @module utils/video-lab
 */

// -- Storage keys --
const PROJECTS_KEY = 'eon:video:projects:v1';
const CLIPS_KEY = 'eon:video:clips:v1';
const appWin = /** @type {any} */ (typeof window !== 'undefined' ? window : globalThis);

// -- Transition types --
export const /** @type {any} */
TRANSITIONS = {
  none: { label: 'None', duration: 0 },
  fade: { label: 'Fade', duration: 0.5 },
  dissolve: { label: 'Dissolve', duration: 0.7 },
  wipe_left: { label: 'Wipe Left', duration: 0.4 },
  wipe_right: { label: 'Wipe Right', duration: 0.4 },
  zoom_in: { label: 'Zoom In', duration: 0.3 },
  zoom_out: { label: 'Zoom Out', duration: 0.3 }
};

// -- Text overlay positions --
export const /** @type {any} */
TEXT_POSITIONS = {
  top_center: { label: 'Top Center', x: 50, y: 10 },
  center: { label: 'Center', x: 50, y: 50 },
  bottom_center: { label: 'Bottom Center', x: 50, y: 90 },
  lower_third: { label: 'Lower Third', x: 50, y: 85 },
  top_left: { label: 'Top Left', x: 10, y: 10 },
  top_right: { label: 'Top Right', x: 90, y: 10 }
};

// -- Helpers --
function cryptoId() {
  const bytes = new Uint8Array(8);
  if (!window.crypto?.getRandomValues) throw new Error('crypto.getRandomValues required');
  window.crypto.getRandomValues(bytes);
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

// -- Service class --
class VideoLabService {
  constructor() {
    /** @type {any[]} */
    this.projects = [];
    /** @type {any[]} */
    this.clips = [];
    this.activeProjectId = null;
    this.canvas = null;
    this.ctx = null;
    this.isPlaying = false;
    this.currentTime = 0;
    this.duration = 0;
    this._playbackWorkloadLease = null;
    this._exportWorkloadLease = null;
    this._hydrate();
  }

  // -- Canvas initialization --
  initCanvas(/** @type {any} */ canvasElement) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d');
  }

  // -- Project management --
  createProject(/** @type {any} */ name, /** @type {any} */ width, /** @type {any} */ height) {
    const /** @type {any} */
project = {
      id: `vproj-${cryptoId()}`,
      name: name || 'Untitled Video',
      width: width || 1920,
      height: height || 1080,
      fps: 30,
      tracks: [
        { id: 'video-1', type: 'video', clips: [], volume: 1.0 },
        { id: 'audio-1', type: 'audio', clips: [], volume: 1.0 },
        { id: 'text-1', type: 'text', clips: [], volume: 1.0 }
      ],
      duration: 0,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    this.projects.push(project);
    this.activeProjectId = project.id;
    this._persist();
    return project;
  }

  getActiveProject() {
    return this.projects.find(/** @type {any} */ p => p.id === this.activeProjectId) || null;
  }

  loadProject(/** @type {any} */ projectId) {
    const project = this.projects.find(/** @type {any} */ p => p.id === projectId);
    if (project) {
      this.activeProjectId = projectId;
      this.duration = project.duration;
    }
    return project;
  }

  // -- Clip management --
  addClip(/** @type {any} */ trackId, /** @type {any} */ clipData) {
    const project = this.getActiveProject();
    if (!project) return { success: false, error: 'No active project' };

    const track = project.tracks.find((/** @type {any} */ t) => t.id === trackId);
    if (!track) return { success: false, error: 'Track not found' };

    const /** @type {any} */
clip = {
      id: `clip-${cryptoId()}`,
      trackId,
      type: clipData.type || track.type,
      start: clipData.start || 0,
      duration: clipData.duration || 5,
      source: clipData.source || '',
      text: clipData.text || '',
      position: clipData.position || 'center',
      fontSize: clipData.fontSize || 48,
      color: clipData.color || '#ffffff',
      bgColor: clipData.bgColor || 'rgba(0,0,0,0.7)',
      transition: clipData.transition || 'none',
      trimStart: clipData.trimStart || 0,
      trimEnd: clipData.trimEnd || 0
    };

    track.clips.push(clip);
    this.clips.push(clip);

    // Update project duration
    const maxEnd = Math.max(...project.tracks.flatMap((/** @type {any} */ t) => t.clips.map((/** @type {any} */ c) => c.start + c.duration)));
    project.duration = maxEnd;
    this.duration = maxEnd;
    project.updatedAt = Date.now();

    this._persist();

    if (appWin.EonPoolPoints?.awardPoints) {
      appWin.EonPoolPoints.awardPoints('creator-hook', `Added ${clip.type} clip to video project`);
    }

    return { success: true, clip };
  }

  removeClip(/** @type {any} */ clipId) {
    const project = this.getActiveProject();
    if (!project) return;

    for (const /** @type {any} */
track of project.tracks) {
      const idx = track.clips.findIndex((/** @type {any} */ c) => c.id === clipId);
      if (idx !== -1) {
        track.clips.splice(idx, 1);
        break;
      }
    }
    this.clips = this.clips.filter(/** @type {any} */ c => c.id !== clipId);
    project.updatedAt = Date.now();
    this._persist();
  }

  splitClip(/** @type {any} */ clipId, /** @type {any} */ splitTime) {
    const project = this.getActiveProject();
    if (!project) return { success: false, error: 'No active project' };

    for (const /** @type {any} */
track of project.tracks) {
      const clip = track.clips.find((/** @type {any} */ c) => c.id === clipId);
      if (!clip) continue;

      if (splitTime <= clip.start || splitTime >= clip.start + clip.duration) {
        return { success: false, error: 'Split time must be within clip range' };
      }

      const firstDuration = splitTime - clip.start;
      const secondDuration = clip.duration - firstDuration;

      // Shorten original clip
      clip.duration = firstDuration;

      // Create new clip for second half
      const /** @type {any} */
newClip = {
        id: `clip-${cryptoId()}`,
        trackId: track.id,
        type: clip.type,
        start: splitTime,
        duration: secondDuration,
        source: clip.source,
        text: clip.text,
        position: clip.position,
        fontSize: clip.fontSize,
        color: clip.color,
        bgColor: clip.bgColor,
        transition: 'none',
        trimStart: clip.trimStart + firstDuration,
        trimEnd: clip.trimEnd
      };

      track.clips.push(newClip);
      this.clips.push(newClip);
      project.updatedAt = Date.now();
      this._persist();
      return { success: true, newClip };
    }

    return { success: false, error: 'Clip not found' };
  }

  // -- Rendering --
  renderFrame(/** @type {any} */ time) {
    if (!this.ctx || !this.canvas) return;

    const project = this.getActiveProject();
    if (!project) return;

    const w = this.canvas.width;
    const h = this.canvas.height;

    // Clear canvas
    this.ctx.fillStyle = '#000000';
    this.ctx.fillRect(0, 0, w, h);

    // Render each track
    for (const /** @type {any} */
track of project.tracks) {
      for (const /** @type {any} */
clip of track.clips) {
        if (time < clip.start || time >= clip.start + clip.duration) continue;

        if (track.type === 'video' && clip.source) {
          // Video clip: draw frame from source (if available)
          this._renderVideoClip(clip, time - clip.start, w, h);
        } else if (track.type === 'text') {
          this._renderTextClip(clip, time - clip.start, clip.duration, w, h);
        }
      }
    }

    // Render timecode overlay
    this.ctx.fillStyle = 'rgba(255,255,255,0.5)';
    this.ctx.font = '12px monospace';
    this.ctx.fillText(this._formatTime(time), 10, h - 10);
  }

  _renderVideoClip(/** @type {any} */ clip, /** @type {any} */ localTime, /** @type {any} */ w, /** @type {any} */ h) {
    // If we have a video element source, draw its current frame
    const videoEl = /** @type {HTMLVideoElement | null} */ (document.getElementById(`video-src-${clip.id}`));
    if (videoEl && videoEl.readyState >= 2) {
      // Apply transition
      const trans = (/** @type {any} */ (TRANSITIONS))[clip.transition] || TRANSITIONS.none;
      let alpha = 1;
      if (trans.duration > 0) {
        if (localTime < trans.duration) {
          alpha = localTime / trans.duration;
        } else if (localTime > clip.duration - trans.duration) {
          alpha = (clip.duration - localTime) / trans.duration;
        }
      }
      this.ctx.globalAlpha = alpha;
      this.ctx.drawImage(videoEl, 0, 0, w, h);
      this.ctx.globalAlpha = 1;
    } else {
      // Placeholder: colored rectangle with clip info
      this.ctx.fillStyle = '#1a1a2e';
      this.ctx.fillRect(0, 0, w, h);
      this.ctx.fillStyle = '#e94560';
      this.ctx.font = '24px sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('Video Clip', w / 2, h / 2 - 15);
      this.ctx.fillStyle = '#ffffff';
      this.ctx.font = '14px sans-serif';
      this.ctx.fillText(clip.source || 'No source', w / 2, h / 2 + 15);
      this.ctx.textAlign = 'start';
    }
  }

  _renderTextClip(/** @type {any} */ clip, /** @type {any} */ localTime, /** @type {any} */ totalDuration, /** @type {any} */ w, /** @type {any} */ h) {
    const pos = (/** @type {any} */ (TEXT_POSITIONS))[clip.position] || TEXT_POSITIONS.center;
    const x = (pos.x / 100) * w;
    const y = (pos.y / 100) * h;

    // Fade in/out
    const trans = (/** @type {any} */ (TRANSITIONS))[clip.transition] || TRANSITIONS.none;
    let alpha = 1;
    if (trans.duration > 0) {
      if (localTime < trans.duration) alpha = localTime / trans.duration;
      else if (localTime > totalDuration - trans.duration) alpha = (totalDuration - localTime) / trans.duration;
    }

    this.ctx.globalAlpha = alpha;
    this.ctx.textAlign = 'center';

    // Background
    const fontSize = clip.fontSize * (w / 1920);
    this.ctx.font = `bold ${fontSize}px sans-serif`;
    const metrics = this.ctx.measureText(clip.text);
    const padding = fontSize * 0.3;

    this.ctx.fillStyle = clip.bgColor;
    this.ctx.fillRect(
      x - metrics.width / 2 - padding,
      y - fontSize / 2 - padding,
      metrics.width + padding * 2,
      fontSize + padding * 2
    );

    // Text
    this.ctx.fillStyle = clip.color;
    this.ctx.fillText(clip.text, x, y + fontSize * 0.1);

    this.ctx.globalAlpha = 1;
    this.ctx.textAlign = 'start';
  }

  _formatTime(/** @type {any} */ seconds) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    const f = Math.floor((seconds % 1) * 30);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}:${String(f).padStart(2, '0')}`;
  }

  // -- Playback --
  _releaseWorkloadLease(property, reason = 'completed') {
    try { this[property]?.release?.(reason); } catch {}
    this[property] = null;
  }

  play(options = {}) {
    if (this.isPlaying) return { success: true, state: 'already-playing' };
    const project = this.getActiveProject();
    const admission = getEonWorkloadGovernor().acquire(EON_WORKLOAD_KINDS.VIDEO_EDIT, {
      id: `video-edit:${project?.id || 'session'}`,
      source: 'video-lab',
      label: 'Canvas video edit playback',
      userInitiated: true,
      confirmPreemptCity: Boolean(options.confirmPreemptCity)
    });
    if (!admission.ok) {
      return {
        success: false,
        state: 'workload-deferred',
        error: admission.decision?.userChoiceRequired
          ? 'Video playback needs a visible choice before it competes with active EON City graphics.'
          : 'Video playback is waiting for this device to have more room.',
        workload: admission.decision
      };
    }
    this._playbackWorkloadLease = admission.lease;
    this.isPlaying = true;
    this._playbackLoop();
    return { success: true, state: 'playing', workload: admission.decision };
  }

  pause() {
    this.isPlaying = false;
    this._releaseWorkloadLease('_playbackWorkloadLease', 'video-playback-paused');
  }

  stop() {
    this.isPlaying = false;
    this._releaseWorkloadLease('_playbackWorkloadLease', 'video-playback-stopped');
    this.currentTime = 0;
    this.renderFrame(0);
  }

  seek(/** @type {any} */ time) {
    this.currentTime = Math.max(0, Math.min(this.duration, time));
    this.renderFrame(this.currentTime);
  }

  _playbackLoop() {
    if (!this.isPlaying) return;

    this.currentTime += 1 / 30; // 30fps
    if (this.currentTime >= this.duration) {
      this.currentTime = 0; // Loop
    }

    this.renderFrame(this.currentTime);
    requestAnimationFrame(() => this._playbackLoop());
  }

  // -- Export --
  async exportVideo(/** @type {any} */ options = {}) {
    const project = this.getActiveProject();
    if (!project) return { success: false, error: 'No active project' };
    const format = String(options?.format || 'webm').toLowerCase();
    const exportAsMp4 = format === 'mp4';

    // Use canvas stream + MediaRecorder for WebM export
    if (!this.canvas) return { success: false, error: 'Canvas not initialized' };

    const stream = this.canvas.captureStream(30);
    const Recorder = window.MediaRecorder;
    if (!Recorder) return { success: false, error: 'MediaRecorder not supported in this browser' };
    const workloadAdmission = getEonWorkloadGovernor().acquire(EON_WORKLOAD_KINDS.MEDIA_EXPORT, {
      id: `video-export:${project.id}:${Date.now()}`,
      source: 'video-lab',
      label: 'Canvas video export',
      userInitiated: true,
      confirmPreemptCity: Boolean(options.confirmPreemptCity)
    });
    if (!workloadAdmission.ok) {
      return {
        success: false,
        error: workloadAdmission.decision?.userChoiceRequired
          ? 'Export needs a visible choice before it competes with active EON City graphics.'
          : 'Export is waiting for this device to have more room.',
        workload: workloadAdmission.decision
      };
    }
    this._releaseWorkloadLease('_exportWorkloadLease', 'superseded-video-export');
    this._exportWorkloadLease = workloadAdmission.lease;
    let recorder;
    try {
      recorder = new Recorder(stream, {
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: 5000000
      });
    } catch (error) {
      this._releaseWorkloadLease('_exportWorkloadLease', 'video-export-recorder-unavailable');
      return {
        success: false,
        error: (/** @type {Error} */ (error)).message || 'Video export recorder could not start.'
      };
    }

    /** @type {BlobPart[]} */
    const /** @type {any} */
chunks = [];
    recorder.ondataavailable = (/** @type {any} */ e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    return new Promise((/** @type {any} */ resolve) => {
      recorder.onstop = async () => {
        try {
          const webmBlob = new Blob(chunks, { type: 'video/webm' });
          const result = exportAsMp4
            ? await transcodeWebmBlobToMp4Blob(webmBlob, project.name)
            : { blob: webmBlob, filename: `${project.name}.webm` };

          if (appWin.EonPoolPoints?.awardPoints) {
            appWin.EonPoolPoints.awardPoints('creator-post', `Exported video: ${project.name}`);
          }

          resolve({ success: true, blob: result.blob, filename: result.filename });
        } catch (error) {
          resolve({
            success: false,
            error: (/** @type {Error} */ (error)).message || 'Video export failed'
          });
        } finally {
          this._releaseWorkloadLease('_exportWorkloadLease', 'video-export-finished');
        }
      };

      // Play from start and record
      this.currentTime = 0;
      this.isPlaying = true;
      recorder.start();

      this._recordLoop(() => {
        this.isPlaying = false;
        recorder.stop();
      });
    });
  }

  _recordLoop(/** @type {any} */ onComplete) {
    if (!this.isPlaying) { onComplete(); return; }

    this.currentTime += 1 / 30;
    this.renderFrame(this.currentTime);

    if (this.currentTime >= this.duration) {
      onComplete();
      return;
    }

    requestAnimationFrame(() => this._recordLoop(onComplete));
  }

  // -- AI video generation --
  async generateWithAI(/** @type {any} */ description, /** @type {any} */ aiRuntime) {
    if (!aiRuntime) return { success: false, error: 'AI runtime not available' };

    function buildFallbackProjectData(/** @type {any} */ promptText, /** @type {any} */ rawText = '') {
      const titleMatch = String(promptText || '').match(/^Title:\s*(.+)$/m);
      const formatMatch = String(promptText || '').match(/^Format:\s*(.+)$/m);
      const styleMatch = String(promptText || '').match(/^Style:\s*(.+)$/m);
      const title = String(titleMatch?.[1] || 'AI Video Package').trim().slice(0, 120) || 'AI Video Package';
      const sourceText = String(rawText || promptText || '').replace(/\s+/g, ' ').trim().slice(0, 500);
      const style = String(styleMatch?.[1] || 'Cinematic documentary').trim().slice(0, 120);
      const format = String(formatMatch?.[1] || 'YouTube Short 9:16 (60s)').trim().slice(0, 120);
      return {
        name: title,
        width: 1920,
        height: 1080,
        fps: 30,
        tracks: [
          {
            type: 'video',
            clips: [
              {
                start: 0,
                duration: 6,
                source: `${style} ${format} ${sourceText || 'AI-generated visual direction'}`.trim(),
                transition: 'fade'
              }
            ]
          },
          {
            type: 'text',
            clips: [
              {
                start: 0,
                duration: 4,
                text: title,
                position: 'lower_third',
                transition: 'fade'
              },
              {
                start: 4,
                duration: 4,
                text: 'Generated in Business Cockpit',
                position: 'bottom_center',
                transition: 'fade'
              }
            ]
          }
        ]
      };
    }

    const systemPrompt = `You are EONBOT Video AI. Generate a video project structure.
Return JSON ONLY: {
  "name": "string",
  "width": 1920,
  "height": 1080,
  "fps": 30,
  "tracks": [
    { "type": "video", "clips": [{ "start": 0, "duration": 5, "source": "description of visual", "transition": "fade" }] },
    { "type": "text", "clips": [{ "start": 0, "duration": 5, "text": "overlay text", "position": "lower_third" }] }
  ]
}
Style: ${description}`;

    try {
      const runtimeSettings = typeof aiRuntime.loadAISettings === 'function' ? aiRuntime.loadAISettings() : {};
      const resultRaw = await runMissionEngine({
        mode: 'video',
        prompt: `Generate a ${description} video project`,
        history: [],
        systemPrompt,
        settings: runtimeSettings,
        taskType: 'video',
        origin: 'video-lab',
        metadata: {
          surface: 'video-lab',
          description
        }
      });
      const result = typeof resultRaw === 'string' ? resultRaw : String(resultRaw?.text || '');

      if (!result) return { success: false, error: 'AI returned empty result' };

      const jsonMatch = result.match(/\{[\s\S]*\}/);
      let projectData = null;
      if (jsonMatch) {
        try {
          projectData = JSON.parse(jsonMatch[0]);
        } catch {
          projectData = null;
        }
      }

      if (!projectData || typeof projectData !== 'object') {
        projectData = buildFallbackProjectData(description, result);
      }

      // Create project from AI output
      const project = this.createProject(
        projectData.name || `AI: ${description}`,
        projectData.width || 1920,
        projectData.height || 1080
      );

      // Add clips from AI output
      for (const /** @type {any} */
track of projectData.tracks || []) {
      const projectTrack = project.tracks.find((/** @type {any} */ t) => t.type === track.type);
        if (!projectTrack) continue;

        for (const /** @type {any} */
clipData of track.clips || []) {
          this.addClip(projectTrack.id, {
            type: track.type,
            ...clipData
          });
        }
      }

      if (appWin.EonPoolPoints?.awardPoints) {
        appWin.EonPoolPoints.awardPoints('creator-agent-publish', `AI generated video project: ${description}`);
      }

      return { success: true, project };
    } catch (/** @type {any} */
err) {
      return { success: false, error: (/** @type {Error} */ (err)).message || 'AI generation failed' };
    }
  }

  // -- AI subtitle generation --
  async generateSubtitles(/** @type {any} */ aiRuntime, /** @type {any} */ language) {
    if (!aiRuntime) return { success: false, error: 'AI runtime not available' };

    const project = this.getActiveProject();
    if (!project) return { success: false, error: 'No active project' };

    // Collect all text clips as source
    const textClips = project.tracks
      .filter((/** @type {any} */ t) => t.type === 'text')
      .flatMap((/** @type {any} */ t) => t.clips)
      .map((/** @type {any} */ c) => c.text);

    if (textClips.length === 0) {
      return { success: false, error: 'No text clips to generate subtitles from' };
    }

    const systemPrompt = `You are EONBOT Subtitle Generator. Generate SRT-format subtitles from the given text content.
Return SRT format ONLY. Language: ${language || 'en'}`;

    try {
      const runtimeSettings = typeof aiRuntime.loadAISettings === 'function' ? aiRuntime.loadAISettings() : {};
      const resultRaw = await runMissionEngine({
        mode: 'video',
        prompt: `Generate subtitles for: ${textClips.join(' | ')}`,
        history: [],
        systemPrompt,
        settings: runtimeSettings,
        taskType: 'video',
        origin: 'video-lab',
        metadata: {
          surface: 'video-lab',
          action: 'subtitles',
          language: language || 'en'
        }
      });
      const result = typeof resultRaw === 'string' ? resultRaw : String(resultRaw?.text || '');

      if (appWin.EonPoolPoints?.awardPoints) {
        appWin.EonPoolPoints.awardPoints('creator-hook', `Generated ${language || 'en'} subtitles`);
      }

      return { success: true, srt: result };
    } catch (/** @type {any} */
err) {
      return { success: false, error: (/** @type {Error} */ (err)).message || 'Subtitle generation failed' };
    }
  }

  // -- Private --
  _hydrate() {
    this.projects = loadJson(PROJECTS_KEY, []);
    this.clips = loadJson(CLIPS_KEY, []);
  }

  _persist() {
    saveJson(PROJECTS_KEY, this.projects.slice(-20));
    saveJson(CLIPS_KEY, this.clips.slice(-200));
  }
}

// -- Singleton --
const videoLabService = new VideoLabService();
export default videoLabService;
export { VideoLabService };
