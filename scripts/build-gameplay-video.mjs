import fs from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'test-results', 'gameplay');
const PORT = Number(process.env.GAMEPLAY_PORT || 8080);
const BASE_URL = `http://127.0.0.1:${PORT}`;

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    cwd: ROOT,
    shell: false,
    ...options,
  });
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed with code ${result.status}`);
  }
}

function runCapture(command, args, options = {}) {
  const result = spawnSync(command, args, {
    stdio: ['ignore', 'pipe', 'pipe'],
    cwd: ROOT,
    shell: false,
    ...options,
  });
  if (result.status !== 0) {
    const stderr = (result.stderr || Buffer.from('')).toString('utf8').trim();
    throw new Error(`${command} ${args.join(' ')} failed with code ${result.status}: ${stderr}`);
  }
  return (result.stdout || Buffer.from('')).toString('utf8').trim();
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
  throw new Error(`Server did not become ready at ${url} within ${timeoutMs}ms`);
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

  for (const [command, args] of commands) {
    try {
      const server = spawn(command, args, {
        cwd: ROOT,
        stdio: ['ignore', 'ignore', 'pipe'],
        shell: false,
      });
      return server;
    } catch {
      // try next option
    }
  }

  throw new Error('Unable to start local static server with Python runtime.');
}

function listNewestWebm(dir) {
  const files = fs.readdirSync(dir)
    .filter((name) => name.endsWith('.webm'))
    .map((name) => ({
      name,
      fullPath: path.join(dir, name),
      mtimeMs: fs.statSync(path.join(dir, name)).mtimeMs,
    }))
    .sort((a, b) => b.mtimeMs - a.mtimeMs);
  if (!files.length) throw new Error('No recorded .webm files found');
  return files[0].fullPath;
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

function writeAutoSrt(filePath, totalDuration) {
  const lines = [
    'Welcome to EONAPP games. Instant browser gameplay, no installs.',
    'Scroll through curated titles and launch in seconds.',
    'Fast load, clear controls, and replayable challenge loops.',
    'Share challenge runs and keep the momentum going.',
    'Play now at EONAPP dot CH.',
  ];

  const intro = 0.4;
  const outro = 0.5;
  const usable = Math.max(4, totalDuration - intro - outro);
  const segment = usable / lines.length;

  const chunks = [];
  const cues = [];
  for (let i = 0; i < lines.length; i += 1) {
    const start = intro + i * segment;
    const end = intro + (i + 1) * segment - 0.05;
    cues.push({ start, end, text: lines[i] });
    chunks.push(`${i + 1}\n${formatSrtTime(start)} --> ${formatSrtTime(end)}\n${lines[i]}\n`);
  }

  fs.writeFileSync(filePath, chunks.join('\n'), 'utf8');
  return cues;
}

function writeNarrationScript(filePath) {
  const text = [
    'Welcome to EONAPP games.',
    'Open the hub, pick a title, and jump in instantly.',
    'Everything runs in your browser for fast play and fast retries.',
    'Share challenge runs, beat scores, and keep the streak alive.',
    'Play now at EONAPP dot C H.',
  ].join(' ');
  fs.writeFileSync(filePath, text, 'utf8');
}

function buildNarration(narrationWav, narrationScript) {
  const powershellScript = [
    'Add-Type -AssemblyName System.Speech',
    '$s = New-Object System.Speech.Synthesis.SpeechSynthesizer',
    '$s.Rate = 0',
    '$s.Volume = 100',
    '$preferred = @("Microsoft Zira Desktop", "Microsoft David Desktop")',
    '$selected = $null',
    'foreach ($name in $preferred) { try { $s.SelectVoice($name); $selected = $name; break } catch {} }',
    '$text = Get-Content -Path "' + narrationScript.replace(/"/g, '`"') + '" -Raw',
    '$s.SetOutputToWaveFile("' + narrationWav.replace(/"/g, '`"') + '")',
    '$s.Speak($text)',
    '$s.Dispose()',
  ].join('; ');

  run('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', powershellScript]);

  // Improve clarity and perceived quality with mild speech mastering.
  const mastered = narrationWav.replace(/\.wav$/i, '-mastered.wav');
  run('ffmpeg', [
    '-y',
    '-i', narrationWav,
    '-af', 'highpass=f=90,lowpass=f=11000,acompressor=threshold=-18dB:ratio=2.5:attack=10:release=200,loudnorm=I=-16:LRA=8:TP=-1.5',
    '-ar', '48000',
    mastered,
  ]);
  fs.copyFileSync(mastered, narrationWav);
}

async function recordGameplay(rawCapturePath, proofImagePath) {
  const server = startStaticServer();
  let serverError = '';
  server.stderr?.on('data', (chunk) => {
    serverError += chunk.toString('utf8');
  });

  await waitForServer(`${BASE_URL}/games/reaction-sprint.html`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    recordVideo: {
      dir: OUT_DIR,
      size: { width: 1920, height: 1080 },
    },
  });

  const page = await context.newPage();
  const targetUrl = process.env.GAMEPLAY_URL || `${BASE_URL}/games/reaction-sprint.html`;

  await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(2000);

  // Guard against blank captures by validating non-trivial DOM content.
  const hasContent = await page.evaluate(() => {
    const text = (document.body?.innerText || '').trim();
    const links = document.querySelectorAll('a[href]').length;
    const hasCanvas = !!document.querySelector('#gameCanvas');
    return text.length > 120 && links > 2 && hasCanvas;
  });
  if (!hasContent) {
    await context.close();
    await browser.close();
    server.kill('SIGTERM');
    throw new Error(`Gameplay page appears blank or underloaded at ${targetUrl}; aborting capture.`);
  }

  const startButton = page.locator('#startButton');
  if (await startButton.count()) {
    await startButton.first().click({ timeout: 8000 });
  }
  await page.waitForTimeout(1800);

  const endAt = Date.now() + 26000;
  const canvasBox = await page.locator('#gameCanvas').boundingBox();
  if (!canvasBox) {
    await context.close();
    await browser.close();
    server.kill('SIGTERM');
    throw new Error('Game canvas not found for gameplay recording.');
  }

  // Simulate real gameplay taps across the active canvas region.
  while (Date.now() < endAt) {
    const x = canvasBox.x + 40 + Math.random() * Math.max(80, canvasBox.width - 80);
    const y = canvasBox.y + 40 + Math.random() * Math.max(80, canvasBox.height - 80);
    await page.mouse.move(x, y, { steps: 6 });
    await page.mouse.click(x, y, { delay: 20 });
    await page.waitForTimeout(120 + Math.random() * 180);
  }

  await page.screenshot({ path: proofImagePath, fullPage: false });
  await context.close();
  await browser.close();
  server.kill('SIGTERM');

  if (serverError.trim()) {
    fs.writeFileSync(path.join(OUT_DIR, 'capture-server.log'), serverError, 'utf8');
  }

  const newest = listNewestWebm(OUT_DIR);
  fs.copyFileSync(newest, rawCapturePath);
}

function renderVideo(rawCapturePath, pacedVideoPath, narrationWavPath, subtitlesPath, finalLandscapePath, finalVerticalPath) {
  // Create a paced cut with tighter rhythm.
  run('ffmpeg', [
    '-y',
    '-i', rawCapturePath,
    '-filter_complex',
    '[0:v]split=3[v0][v1][v2];' +
      '[v0]trim=start=0:end=8,setpts=PTS-STARTPTS[v0t];' +
      '[v1]trim=start=8:end=18,setpts=0.82*(PTS-STARTPTS)[v1t];' +
      '[v2]trim=start=18:end=26,setpts=PTS-STARTPTS[v2t];' +
      '[v0t][v1t][v2t]concat=n=3:v=1:a=0[vout]',
    '-map', '[vout]',
    '-c:v', 'libx264',
    '-preset', 'medium',
    '-pix_fmt', 'yuv420p',
    pacedVideoPath,
  ]);

  const pacedDuration = ffprobeDuration(pacedVideoPath);
  writeAutoSrt(subtitlesPath, pacedDuration);

  // Create subtle generated bed and mix with narration.
  const bedPath = path.join(path.dirname(narrationWavPath), 'music-bed.wav');
  run('ffmpeg', [
    '-y',
    '-f', 'lavfi',
    '-i', `anoisesrc=color=pink:amplitude=0.012:duration=${Math.max(12, Math.ceil(pacedDuration))}`,
    '-af', 'lowpass=f=3500,highpass=f=120',
    '-ar', '48000',
    bedPath,
  ]);

  const mixedAudioPath = path.join(path.dirname(narrationWavPath), 'narration-mix.wav');
  run('ffmpeg', [
    '-y',
    '-i', narrationWavPath,
    '-i', bedPath,
    '-filter_complex', '[1:a]volume=0.18[bed];[0:a][bed]amix=inputs=2:duration=first:normalize=0[a]',
    '-map', '[a]',
    '-ar', '48000',
    mixedAudioPath,
  ]);

  run('ffmpeg', [
    '-y',
    '-i', pacedVideoPath,
    '-i', mixedAudioPath,
    '-c:v', 'libx264',
    '-preset', 'slow',
    '-crf', '18',
    '-pix_fmt', 'yuv420p',
    '-c:a', 'aac',
    '-b:a', '192k',
    '-shortest',
    finalLandscapePath,
  ]);

  run('ffmpeg', [
    '-y',
    '-i', finalLandscapePath,
    '-vf', 'scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920',
    '-c:v', 'libx264',
    '-preset', 'slow',
    '-crf', '20',
    '-pix_fmt', 'yuv420p',
    '-c:a', 'aac',
    '-b:a', '192k',
    finalVerticalPath,
  ]);
}

async function main() {
  ensureDir(OUT_DIR);

  const rawCapturePath = path.join(OUT_DIR, 'capture-raw.webm');
  const proofImagePath = path.join(OUT_DIR, 'gameplay-proof-hq.png');
  const narrationScriptPath = path.join(OUT_DIR, 'narration-script.txt');
  const narrationWavPath = path.join(OUT_DIR, 'narration-hq.wav');
  const pacedVideoPath = path.join(OUT_DIR, 'capture-paced.mp4');
  const subtitlesPath = path.join(OUT_DIR, 'captions-hq.srt');
  const finalLandscapePath = path.join(OUT_DIR, 'eonapp-gameplay-hq-landscape.mp4');
  const finalVerticalPath = path.join(OUT_DIR, 'eonapp-gameplay-hq-vertical.mp4');

  writeNarrationScript(narrationScriptPath);
  await recordGameplay(rawCapturePath, proofImagePath);
  buildNarration(narrationWavPath, narrationScriptPath);
  renderVideo(
    rawCapturePath,
    pacedVideoPath,
    narrationWavPath,
    subtitlesPath,
    finalLandscapePath,
    finalVerticalPath,
  );

  console.log('Gameplay build completed.');
  console.log(`Raw capture: ${rawCapturePath}`);
  console.log(`Proof image: ${proofImagePath}`);
  console.log(`Narration: ${narrationWavPath}`);
  console.log(`Subtitles: ${subtitlesPath}`);
  console.log(`Landscape: ${finalLandscapePath}`);
  console.log(`Vertical: ${finalVerticalPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
