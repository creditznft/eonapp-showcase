import fs from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'test-results', 'gameplay');
const TMP_DIR = path.join(OUT_DIR, '.tmp');
const PORT = Number(process.env.GAMEPLAY_PORT || 8080);
const BASE_URL = `http://127.0.0.1:${PORT}`;

const GAME_URLS = {
  'reaction-sprint': '/games/reaction-sprint.html',
  'void-raider': '/games/void-raider.html',
  'orbit-survivor': '/games/orbit-survivor.html',
  'word-blitz': '/games/word-blitz.html',
};

const DEFAULT_TEMPLATE_FILE = path.join(ROOT, 'scripts', 'video-templates.json');

function parseArgs() {
  const args = {
    game: 'reaction-sprint',
    template: 'gameplay_hq',
    stockDir: path.join(ROOT, 'assets', 'stock'),
    musicMode: 'synth', // off | synth | file
    musicFile: '',
    voiceMode: 'system', // system | off
    subtitleMode: 'soft', // soft | off
    outputPrefix: 'eonapp-social',
    templateFile: DEFAULT_TEMPLATE_FILE,
  };

  const raw = process.argv.slice(2);
  for (let i = 0; i < raw.length; i += 1) {
    const key = raw[i];
    const value = raw[i + 1];
    if (!key.startsWith('--')) continue;
    if (value == null || value.startsWith('--')) continue;
    const name = key.slice(2);
    if (Object.hasOwn(args, name)) {
      args[name] = value;
    }
    i += 1;
  }

  return args;
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function clearTmp() {
  if (fs.existsSync(TMP_DIR)) {
    fs.rmSync(TMP_DIR, { recursive: true, force: true });
  }
  ensureDir(TMP_DIR);
}

function run(command, argv, options = {}) {
  const result = spawnSync(command, argv, {
    cwd: ROOT,
    stdio: 'inherit',
    shell: false,
    ...options,
  });
  if (result.status !== 0) {
    throw new Error(`${command} ${argv.join(' ')} failed with code ${result.status}`);
  }
}

function runCapture(command, argv, options = {}) {
  const result = spawnSync(command, argv, {
    cwd: ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: false,
    ...options,
  });
  if (result.status !== 0) {
    const stderr = (result.stderr || Buffer.from('')).toString('utf8');
    throw new Error(`${command} ${argv.join(' ')} failed: ${stderr}`);
  }
  return (result.stdout || Buffer.from('')).toString('utf8').trim();
}

function ffprobeDuration(filePath) {
  const out = runCapture('ffprobe', [
    '-v', 'error',
    '-show_entries', 'format=duration',
    '-of', 'default=nw=1:nk=1',
    filePath,
  ]);
  return Number(out);
}

function ffprobeHasAudio(filePath) {
  const out = runCapture('ffprobe', [
    '-v', 'error',
    '-select_streams', 'a',
    '-show_entries', 'stream=index',
    '-of', 'csv=p=0',
    filePath,
  ]);
  return out.length > 0;
}

function ffprobeHasSubtitle(filePath) {
  const out = runCapture('ffprobe', [
    '-v', 'error',
    '-select_streams', 's',
    '-show_entries', 'stream=index',
    '-of', 'csv=p=0',
    filePath,
  ]);
  return out.length > 0;
}

async function waitForServer(url, timeoutMs = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // retry
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`Server did not start at ${url}`);
}

function startStaticServer() {
  const commands = process.platform === 'win32'
    ? [
        ['cmd.exe', ['/d', '/s', '/c', `py -3 -m http.server ${PORT} --bind 127.0.0.1`]],
        ['cmd.exe', ['/d', '/s', '/c', `python -m http.server ${PORT} --bind 127.0.0.1`]],
      ]
    : [
        ['python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1']],
        ['python', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1']],
      ];

  for (const [command, argv] of commands) {
    try {
      return spawn(command, argv, {
        cwd: ROOT,
        stdio: ['ignore', 'ignore', 'pipe'],
        shell: false,
      });
    } catch {
      // try next command
    }
  }
  throw new Error('Unable to start local static server');
}

function pickNewestWebm(dir, previousSet) {
  const files = fs.readdirSync(dir)
    .filter((name) => name.endsWith('.webm'))
    .map((name) => ({
      fullPath: path.join(dir, name),
      mtimeMs: fs.statSync(path.join(dir, name)).mtimeMs,
      name,
    }))
    .sort((a, b) => b.mtimeMs - a.mtimeMs);

  for (const file of files) {
    if (!previousSet.has(file.name)) return file.fullPath;
  }
  if (!files.length) throw new Error('No gameplay recording generated');
  return files[0].fullPath;
}

function formatSrtTime(seconds) {
  const totalMs = Math.max(0, Math.round(seconds * 1000));
  const ms = totalMs % 1000;
  const totalSec = Math.floor(totalMs / 1000);
  const s = totalSec % 60;
  const totalMin = Math.floor(totalSec / 60);
  const m = totalMin % 60;
  const h = Math.floor(totalMin / 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
}

function writeSrt(filePath, lines, totalDuration) {
  const intro = 0.35;
  const outro = 0.5;
  const usable = Math.max(4, totalDuration - intro - outro);
  const segment = usable / lines.length;
  const chunks = [];

  for (let i = 0; i < lines.length; i += 1) {
    const start = intro + i * segment;
    const end = intro + (i + 1) * segment - 0.05;
    chunks.push(`${i + 1}\n${formatSrtTime(start)} --> ${formatSrtTime(end)}\n${lines[i]}\n`);
  }

  fs.writeFileSync(filePath, chunks.join('\n'), 'utf8');
}

function generateNarrationText(game) {
  const map = {
    'reaction-sprint': [
      'This is Reaction Sprint on EONAPP.',
      'Tap green targets, avoid red traps, and chain fast reactions to stack score.',
      'The pace ramps quickly, so precision matters more than random tapping.',
      'Share your runs and challenge friends on the same game loop.',
      'Play now at EONAPP dot CH.',
    ],
    'void-raider': [
      'This is Void Raider on EONAPP.',
      'Navigate incoming patterns, time your movement, and survive longer each run.',
      'The core loop rewards focus, quick adaptation, and clean pathing.',
      'Challenge links make every run easy to share and compare.',
      'Play now at EONAPP dot CH.',
    ],
  };
  return (map[game] || map['reaction-sprint']).join(' ');
}

function generateSubtitleLines(game) {
  const map = {
    'reaction-sprint': [
      'Reaction Sprint on EONAPP',
      'Tap green targets and avoid red traps',
      'Chain accurate hits to raise your score',
      'Compete in shareable challenge runs',
      'Play now at EONAPP dot CH',
    ],
    'void-raider': [
      'Void Raider on EONAPP',
      'Read enemy patterns and move cleanly',
      'Survive longer to improve your run score',
      'Share challenge links with your friends',
      'Play now at EONAPP dot CH',
    ],
  };
  return map[game] || map['reaction-sprint'];
}

function buildSystemVoice(narrationWav, narrationText) {
  const txtPath = path.join(TMP_DIR, 'narration.txt');
  fs.writeFileSync(txtPath, narrationText, 'utf8');

  const ps = [
    'Add-Type -AssemblyName System.Speech',
    '$s = New-Object System.Speech.Synthesis.SpeechSynthesizer',
    '$s.Rate = 0',
    '$s.Volume = 100',
    '$voices = @("Microsoft Zira Desktop", "Microsoft David Desktop")',
    'foreach ($v in $voices) { try { $s.SelectVoice($v); break } catch {} }',
    '$text = Get-Content -Path "' + txtPath.replace(/"/g, '`"') + '" -Raw',
    '$s.SetOutputToWaveFile("' + narrationWav.replace(/"/g, '`"') + '")',
    '$s.Speak($text)',
    '$s.Dispose()',
  ].join('; ');

  run('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', ps]);

  const mastered = narrationWav.replace(/\.wav$/i, '-mastered.wav');
  run('ffmpeg', [
    '-y',
    '-i', narrationWav,
    '-af', 'highpass=f=85,lowpass=f=11000,acompressor=threshold=-20dB:ratio=2.8:attack=10:release=180,loudnorm=I=-16:LRA=7:TP=-1.5',
    '-ar', '48000',
    mastered,
  ]);
  fs.copyFileSync(mastered, narrationWav);
}

function generateMusicBed(musicPath, durationSec, musicMode, musicFile) {
  if (musicMode === 'off') {
    return '';
  }

  if (musicMode === 'file') {
    if (!musicFile || !fs.existsSync(musicFile)) {
      throw new Error('musicMode=file requires an existing --musicFile path');
    }
    run('ffmpeg', [
      '-y',
      '-stream_loop', '-1',
      '-i', musicFile,
      '-t', String(Math.ceil(durationSec)),
      '-af', 'loudnorm=I=-19:LRA=9:TP=-2',
      '-ar', '48000',
      musicPath,
    ]);
    return musicPath;
  }

  // AI-safe synthetic bed generated from algorithmic signals (no third-party melody source).
  run('ffmpeg', [
    '-y',
    '-f', 'lavfi',
    '-i', `sine=frequency=110:sample_rate=48000:duration=${Math.ceil(durationSec)}`,
    '-f', 'lavfi',
    '-i', `sine=frequency=220:sample_rate=48000:duration=${Math.ceil(durationSec)}`,
    '-f', 'lavfi',
    '-i', `anoisesrc=color=pink:amplitude=0.005:duration=${Math.ceil(durationSec)}`,
    '-filter_complex', '[0:a]volume=0.11[a0];[1:a]volume=0.06[a1];[2:a]lowpass=f=3000,highpass=f=120,volume=0.07[a2];[a0][a1][a2]amix=inputs=3:normalize=0,alimiter=limit=0.85',
    '-ar', '48000',
    musicPath,
  ]);
  return musicPath;
}

function listStockClips(stockDir) {
  if (!fs.existsSync(stockDir)) return [];
  return fs.readdirSync(stockDir)
    .filter((f) => /\.(mp4|mov|mkv|webm)$/i.test(f))
    .map((f) => path.join(stockDir, f));
}

function normalizeClip(input, output, maxDurationSec = 3) {
  run('ffmpeg', [
    '-y',
    '-i', input,
    '-t', String(maxDurationSec),
    '-vf', 'scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,fps=30',
    '-an',
    '-c:v', 'libx264',
    '-preset', 'veryfast',
    '-crf', '20',
    '-pix_fmt', 'yuv420p',
    output,
  ]);
}

function concatVideoParts(parts, output) {
  const listFile = path.join(TMP_DIR, 'concat.txt');
  const lines = parts.map((p) => `file '${p.replace(/'/g, "'\\''")}'`).join('\n');
  fs.writeFileSync(listFile, lines, 'utf8');

  run('ffmpeg', [
    '-y',
    '-f', 'concat',
    '-safe', '0',
    '-i', listFile,
    '-c:v', 'libx264',
    '-preset', 'medium',
    '-crf', '19',
    '-pix_fmt', 'yuv420p',
    output,
  ]);
}

function loadTemplates(templateFile) {
  if (!fs.existsSync(templateFile)) {
    throw new Error(`Template file not found: ${templateFile}`);
  }
  return JSON.parse(fs.readFileSync(templateFile, 'utf8'));
}

async function recordGameplay(game, rawCapturePath, proofImagePath, durationSec) {
  if (!Object.hasOwn(GAME_URLS, game)) {
    throw new Error(`Unsupported game '${game}'. Add it in GAME_URLS.`);
  }

  ensureDir(OUT_DIR);
  const before = new Set(
    fs.existsSync(OUT_DIR)
      ? fs.readdirSync(OUT_DIR).filter((f) => f.endsWith('.webm'))
      : [],
  );

  const server = startStaticServer();
  let serverErr = '';
  server.stderr?.on('data', (c) => { serverErr += c.toString('utf8'); });

  const url = `${BASE_URL}${GAME_URLS[game]}`;
  await waitForServer(url);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    recordVideo: {
      dir: OUT_DIR,
      size: { width: 1920, height: 1080 },
    },
  });

  const page = await context.newPage();
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(1500);

  const hasCanvas = await page.evaluate(() => !!document.querySelector('#gameCanvas'));
  if (!hasCanvas) {
    await context.close();
    await browser.close();
    server.kill('SIGTERM');
    throw new Error(`No #gameCanvas found at ${url}`);
  }

  const startBtn = page.locator('#startButton');
  if (await startBtn.count()) {
    await startBtn.first().click({ timeout: 8000 });
  }
  await page.waitForTimeout(1700);

  const box = await page.locator('#gameCanvas').boundingBox();
  if (!box) {
    await context.close();
    await browser.close();
    server.kill('SIGTERM');
    throw new Error('Game canvas bounding box unavailable');
  }

  const endAt = Date.now() + durationSec * 1000;
  while (Date.now() < endAt) {
    const x = box.x + 40 + Math.random() * Math.max(80, box.width - 80);
    const y = box.y + 40 + Math.random() * Math.max(80, box.height - 80);
    await page.mouse.move(x, y, { steps: 5 });
    await page.mouse.click(x, y, { delay: 15 });
    await page.waitForTimeout(90 + Math.random() * 120);
  }

  await page.screenshot({ path: proofImagePath, fullPage: false });
  await context.close();
  await browser.close();
  server.kill('SIGTERM');

  if (serverErr.trim()) {
    fs.writeFileSync(path.join(OUT_DIR, 'capture-server.log'), serverErr, 'utf8');
  }

  const newest = pickNewestWebm(OUT_DIR, before);
  fs.copyFileSync(newest, rawCapturePath);
}

function buildPacedGameplay(rawCapture, pacedCapture, speedFactor) {
  const speed = Number(speedFactor);
  run('ffmpeg', [
    '-y',
    '-i', rawCapture,
    '-filter_complex',
    `[0:v]trim=start=1:end=28,setpts=${speed.toFixed(3)}*(PTS-STARTPTS),scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080[v]`,
    '-map', '[v]',
    '-c:v', 'h264_nvenc',  // GPU-accelerated encoding for RTX 3050
    '-preset', 'p4',  // NVENC preset (p1-p7, p4 is good balance)
    '-crf', '18',
    '-pix_fmt', 'yuv420p',
    pacedCapture,
  ]);
}

function buildVisualMaster(pacedCapture, template, stockDir, visualMasterPath) {
  const stockMode = template.stockMode || 'none';
  if (stockMode === 'none') {
    fs.copyFileSync(pacedCapture, visualMasterPath);
    return [];
  }

  const stocks = listStockClips(stockDir);
  if (stocks.length === 0) {
    fs.copyFileSync(pacedCapture, visualMasterPath);
    return ['No stock clips found; falling back to gameplay-only visual timeline.'];
  }

  const intro = path.join(TMP_DIR, 'stock-intro.mp4');
  const outro = path.join(TMP_DIR, 'stock-outro.mp4');
  normalizeClip(stocks[0], intro, Number(template.stockIntroSec || 2.5));
  normalizeClip(stocks[Math.min(1, stocks.length - 1)], outro, Number(template.stockOutroSec || 2.5));

  concatVideoParts([intro, pacedCapture, outro], visualMasterPath);
  return [];
}

function buildAudioMaster(visualMasterPath, narrationWavPath, musicBedPath, musicMode, musicFile, outputPath) {
  const duration = ffprobeDuration(visualMasterPath);
  if (musicMode !== 'off') {
    generateMusicBed(musicBedPath, duration, musicMode, musicFile);
  }

  if (musicMode === 'off') {
    fs.copyFileSync(narrationWavPath, outputPath);
    return;
  }

  run('ffmpeg', [
    '-y',
    '-i', narrationWavPath,
    '-i', musicBedPath,
    '-filter_complex', '[1:a]volume=0.16[bed];[0:a][bed]amix=inputs=2:duration=first:normalize=0,alimiter=limit=0.9[a]',
    '-map', '[a]',
    '-ar', '48000',
    outputPath,
  ]);
}

function renderOutputs(visualMasterPath, audioMasterPath, subtitlesPath, subtitleMode, landscapePath, verticalPath) {
  const args = [
    '-y',
    '-i', visualMasterPath,
    '-i', audioMasterPath,
  ];

  if (subtitleMode === 'soft') {
    args.push('-i', subtitlesPath);
  }

  args.push(
    '-map', '0:v:0',
    '-map', '1:a:0',
    '-c:v', 'h264_nvenc',  // GPU-accelerated encoding for RTX 3050
    '-preset', 'p4',  // NVENC preset
    '-crf', '18',
    '-pix_fmt', 'yuv420p',
    '-c:a', 'aac',
    '-b:a', '192k',
    '-shortest',
  );

  if (subtitleMode === 'soft') {
    args.push('-map', '2:0', '-c:s', 'mov_text', '-metadata:s:s:0', 'language=eng');
  }

  args.push(landscapePath);
  run('ffmpeg', args);

  run('ffmpeg', [
    '-y',
    '-i', landscapePath,
    '-vf', 'scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920',
    '-map', '0:v:0',
    '-map', '0:a:0',
    '-map', '0:s?',
    '-c:v', 'h264_nvenc',  // GPU-accelerated encoding for RTX 3050
    '-preset', 'p4',  // NVENC preset
    '-crf', '20',
    '-pix_fmt', 'yuv420p',
    '-c:a', 'aac',
    '-b:a', '192k',
    '-c:s', 'mov_text',
    verticalPath,
  ]);
}

function writeQaReport(reportPath, outputs, warnings) {
  const report = {
    generatedAt: new Date().toISOString(),
    outputs,
    warnings,
    checks: {
      landscapeDurationSec: ffprobeDuration(outputs.landscape),
      verticalDurationSec: ffprobeDuration(outputs.vertical),
      landscapeHasAudio: ffprobeHasAudio(outputs.landscape),
      verticalHasAudio: ffprobeHasAudio(outputs.vertical),
      landscapeHasSubtitleTrack: ffprobeHasSubtitle(outputs.landscape),
      verticalHasSubtitleTrack: ffprobeHasSubtitle(outputs.vertical),
      subtitlesSidecarExists: fs.existsSync(outputs.subtitles),
      narrationExists: fs.existsSync(outputs.narration),
    },
  };

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');

  const failed = [];
  if (report.checks.landscapeDurationSec < 10) failed.push('landscape video too short');
  if (!report.checks.landscapeHasAudio) failed.push('landscape missing audio');
  if (!report.checks.verticalHasAudio) failed.push('vertical missing audio');
  if (!report.checks.subtitlesSidecarExists) failed.push('subtitle sidecar missing');

  if (failed.length) {
    throw new Error(`QA failed: ${failed.join(', ')}`);
  }
}

async function main() {
  const args = parseArgs();
  const templates = loadTemplates(args.templateFile);
  const template = templates[args.template];
  if (!template) {
    throw new Error(`Unknown template '${args.template}'. Available: ${Object.keys(templates).join(', ')}`);
  }

  ensureDir(OUT_DIR);
  clearTmp();

  const prefix = `${args.outputPrefix}-${args.game}-${args.template}`;
  const rawCapture = path.join(OUT_DIR, `${prefix}-raw.webm`);
  const proofImage = path.join(OUT_DIR, `${prefix}-proof.png`);
  const pacedCapture = path.join(TMP_DIR, `${prefix}-paced.mp4`);
  const visualMaster = path.join(TMP_DIR, `${prefix}-visual-master.mp4`);
  const narrationWav = path.join(OUT_DIR, `${prefix}-narration.wav`);
  const musicBed = path.join(TMP_DIR, `${prefix}-music-bed.wav`);
  const audioMaster = path.join(TMP_DIR, `${prefix}-audio-master.wav`);
  const subtitles = path.join(OUT_DIR, `${prefix}.srt`);
  const landscape = path.join(OUT_DIR, `${prefix}-landscape.mp4`);
  const vertical = path.join(OUT_DIR, `${prefix}-vertical.mp4`);
  const qaReport = path.join(OUT_DIR, `${prefix}-qa.json`);

  await recordGameplay(args.game, rawCapture, proofImage, Number(template.captureDurationSec || 26));

  const narrationText = generateNarrationText(args.game);
  if (args.voiceMode !== 'off') {
    buildSystemVoice(narrationWav, narrationText);
  } else {
    run('ffmpeg', ['-y', '-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=mono', '-t', '10', narrationWav]);
  }

  buildPacedGameplay(rawCapture, pacedCapture, Number(template.speedFactor || 0.85));
  const duration = ffprobeDuration(pacedCapture);
  writeSrt(subtitles, generateSubtitleLines(args.game), duration);

  const warnings = buildVisualMaster(pacedCapture, template, args.stockDir, visualMaster);
  buildAudioMaster(visualMaster, narrationWav, musicBed, args.musicMode, args.musicFile, audioMaster);
  renderOutputs(visualMaster, audioMaster, subtitles, args.subtitleMode, landscape, vertical);

  run('ffmpeg', ['-y', '-ss', '00:00:08', '-i', landscape, '-frames:v', '1', '-update', '1', proofImage]);

  writeQaReport(qaReport, {
    rawCapture,
    narration: narrationWav,
    subtitles,
    landscape,
    vertical,
    proofImage,
  }, warnings);

  console.log('Social video build completed.');
  console.log(`Landscape: ${landscape}`);
  console.log(`Vertical: ${vertical}`);
  console.log(`Proof: ${proofImage}`);
  console.log(`QA: ${qaReport}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
