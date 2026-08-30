/** @type {any} */
let ffmpegInstance = null;
/** @type {Promise<any> | null} */
let ffmpegLoadPromise = null;
/** @type {Promise<any> | null} */
let ffmpegDepsPromise = null;

const FFMPEG_CORE_VERSION = '0.12.10';
const FFMPEG_CORE_BASE = `https://unpkg.com/@ffmpeg/core@${FFMPEG_CORE_VERSION}/dist/esm`;

function getBlobName(baseName = 'eon-video', ext = 'mp4') {
  const safeBase = String(baseName || 'eon-video').trim().replace(/[^\w.-]+/g, '-').replace(/^-+|-+$/g, '') || 'eon-video';
  return `${safeBase}.${ext}`;
}

async function loadFfmpegDeps() {
  if (!ffmpegDepsPromise) {
    ffmpegDepsPromise = (async () => {
      const [ffmpegMod, utilMod] = await Promise.all([
        import('@ffmpeg/ffmpeg'),
        import('@ffmpeg/util')
      ]);
      const { toBlobURL } = utilMod;
      const [ffmpegCoreURL, ffmpegWasmURL, ffmpegWorkerURL] = await Promise.all([
        toBlobURL(`${FFMPEG_CORE_BASE}/ffmpeg-core.js`, 'text/javascript'),
        toBlobURL(`${FFMPEG_CORE_BASE}/ffmpeg-core.wasm`, 'application/wasm'),
        toBlobURL(`${FFMPEG_CORE_BASE}/ffmpeg-core.worker.js`, 'text/javascript')
      ]);
      return {
        FFmpeg: ffmpegMod.FFmpeg,
        fetchFile: utilMod.fetchFile,
        ffmpegCoreURL,
        ffmpegWasmURL,
        ffmpegWorkerURL
      };
    })();
  }
  return ffmpegDepsPromise;
}

async function getFFmpeg() {
  if (ffmpegInstance?.loaded) return ffmpegInstance;
  const { FFmpeg, ffmpegCoreURL, ffmpegWasmURL, ffmpegWorkerURL } = await loadFfmpegDeps();
  if (!ffmpegInstance) ffmpegInstance = new FFmpeg();
  if (!ffmpegLoadPromise) {
    ffmpegLoadPromise = (async () => {
      await ffmpegInstance.load({
        coreURL: ffmpegCoreURL,
        wasmURL: ffmpegWasmURL,
        workerURL: ffmpegWorkerURL
      });
      return ffmpegInstance;
    })().catch((err) => {
      ffmpegLoadPromise = null;
      throw err;
    });
  }
  return ffmpegLoadPromise;
}

/**
 * @param {Blob} webmBlob
 * @param {string} [baseName='eon-video']
 * @returns {Promise<{ blob: Blob, filename: string }>}
 */
export async function transcodeWebmBlobToMp4Blob(webmBlob, baseName = 'eon-video') {
  if (!(webmBlob instanceof Blob)) {
    throw new Error('MP4 export requires a WebM blob to transcode.');
  }

  const ffmpeg = await getFFmpeg();
  const { fetchFile } = await loadFfmpegDeps();
  const stamp = Date.now();
  const inputName = `input-${stamp}.webm`;
  const outputName = `output-${stamp}.mp4`;

  await ffmpeg.writeFile(inputName, await fetchFile(webmBlob));
  await ffmpeg.exec([
    '-i', inputName,
    '-c:v', 'libx264',
    '-preset', 'veryfast',
    '-crf', '23',
    '-pix_fmt', 'yuv420p',
    '-c:a', 'aac',
    '-b:a', '128k',
    '-movflags', '+faststart',
    outputName
  ]);

  const data = await ffmpeg.readFile(outputName);
  const blob = new Blob([data], { type: 'video/mp4' });

  try { await ffmpeg.deleteFile(inputName); } catch {}
  try { await ffmpeg.deleteFile(outputName); } catch {}

  return {
    blob,
    filename: getBlobName(baseName, 'mp4')
  };
}

export function isMp4ExportAvailable() {
  return typeof window !== 'undefined' && typeof window.MediaRecorder === 'function';
}
