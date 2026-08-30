/**
 * W360 — EON City Portal.
 *
 * A device-safe, source-authored arrival scene. It renders local public City
 * state only and never starts AI work, connects a provider, opens full screen,
 * or sends data. The user chooses every City mode with an explicit link tap.
 */
import { getCityPlayCapability } from './city/eon-city-play-capability.js';
import { ensureCityWorldState, getCityWorldPublicSummary } from './city/city-world-state.js';
import { CITY_LANDMARKS } from './city/city-landmark-registry.js';
import { bindCityModeLinkTracking, enterCityMode } from './city/city-mode-transition.js';

const root = document.querySelector('[data-eon-city-portal]');
let disposeCityModeTracking = () => {};

function escapeHtml(value = '') {
  return String(value || '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[character]));
}

function prefersReducedMotion() {
  try { return Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches); } catch { return false; }
}

function buildPortalState() {
  const city = getCityWorldPublicSummary(ensureCityWorldState().state);
  const capability = getCityPlayCapability();
  const currentLandmark = CITY_LANDMARKS.find((item) => item.districtId === city.progress.lastDistrictId)
    || CITY_LANDMARKS.find((item) => item.districtId === city.progress.activeObjective?.districtId)
    || CITY_LANDMARKS[0];
  const visited = Object.values(city.progress.visitCounts || {}).reduce((total, value) => total + Math.max(0, Number(value) || 0), 0);
  return Object.freeze({ city, capability, currentLandmark, visited });
}

function drawRoundedRect(ctx, x, y, width, height, radius, fill) {
  const safeRadius = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + safeRadius, y);
  ctx.arcTo(x + width, y, x + width, y + height, safeRadius);
  ctx.arcTo(x + width, y + height, x, y + height, safeRadius);
  ctx.arcTo(x, y, x + width, y, safeRadius);
  ctx.arcTo(x, y, x + width, y + height, safeRadius);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

function makeSeed(value = '') {
  let hash = 2166136261;
  for (const character of String(value || 'eon-city')) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seeded(seed) {
  let value = seed >>> 0;
  return () => {
    value += 0x6D2B79F5;
    let state = value;
    state = Math.imul(state ^ (state >>> 15), state | 1);
    state ^= state + Math.imul(state ^ (state >>> 7), state | 61);
    return ((state ^ (state >>> 14)) >>> 0) / 4294967296;
  };
}

function mountArrivalCanvas(canvas, citySeed) {
  if (!canvas) return () => {};
  const reduced = prefersReducedMotion();
  const random = seeded(makeSeed(citySeed));
  const towers = Array.from({ length: 46 }, (_, index) => ({
    x: random(), w: .025 + random() * .08, h: .11 + random() * .42, depth: random(), hue: 188 + Math.floor(random() * 58), windows: 2 + Math.floor(random() * 8), seed: index
  }));
  const rain = Array.from({ length: 110 }, () => ({ x: random(), y: random(), speed: .35 + random() * .8, length: 9 + random() * 24, alpha: .05 + random() * .15 }));
  let raf = 0;
  let disposed = false;
  let width = 1;
  let height = 1;
  let dpr = 1;
  let pointer = { x: .5, y: .42 };
  const resize = () => {
    const bounds = canvas.getBoundingClientRect();
    dpr = Math.min(2, Math.max(1, window.devicePixelRatio || 1));
    width = Math.max(1, Math.floor(bounds.width));
    height = Math.max(1, Math.floor(bounds.height));
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
  };
  const draw = (time = 0) => {
    if (disposed) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    const horizon = height * .57;
    const sky = ctx.createLinearGradient(0, 0, 0, height);
    sky.addColorStop(0, '#06192c');
    sky.addColorStop(.48, '#09182a');
    sky.addColorStop(1, '#02050c');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, height);

    const glowX = width * (.45 + (pointer.x - .5) * .18);
    const glowY = height * (.28 + (pointer.y - .5) * .07);
    const moon = ctx.createRadialGradient(glowX, glowY, 0, glowX, glowY, Math.max(width, height) * .42);
    moon.addColorStop(0, 'rgba(120,221,255,.28)');
    moon.addColorStop(.32, 'rgba(81,127,255,.13)');
    moon.addColorStop(1, 'rgba(4,8,17,0)');
    ctx.fillStyle = moon;
    ctx.fillRect(0, 0, width, height);

    const drift = reduced ? 0 : Math.sin(time / 5000) * 4;
    towers.forEach((tower) => {
      const baseline = horizon + tower.depth * height * .23;
      const w = Math.max(17, tower.w * width);
      const h = tower.h * height * (1.25 - tower.depth * .32);
      const x = tower.x * width - w / 2 + drift * (.28 - tower.depth);
      const y = baseline - h;
      const alpha = .26 + (1 - tower.depth) * .52;
      const face = ctx.createLinearGradient(x, y, x + w, y + h);
      face.addColorStop(0, `hsla(${tower.hue}, 44%, 22%, ${alpha})`);
      face.addColorStop(.78, `hsla(${tower.hue + 22}, 55%, 10%, ${alpha + .1})`);
      ctx.fillStyle = face;
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = `hsla(${tower.hue}, 90%, 71%, ${.08 + (1 - tower.depth) * .18})`;
      ctx.lineWidth = 1;
      ctx.strokeRect(x + .5, y + .5, w - 1, h - 1);
      const rows = tower.windows;
      const cols = Math.max(1, Math.floor(w / 18));
      for (let row = 0; row < rows; row += 1) {
        for (let column = 0; column < cols; column += 1) {
          if (((row * 7 + column * 13 + tower.seed) % 5) === 0) continue;
          const wx = x + 6 + column * ((w - 12) / cols);
          const wy = y + 10 + row * Math.max(9, (h - 20) / rows);
          const brightness = .12 + ((row + column + tower.seed) % 3) * .09;
          drawRoundedRect(ctx, wx, wy, Math.max(2, w / (cols * 4)), 2.2, 1, `hsla(${tower.hue + 24}, 95%, 75%, ${brightness})`);
        }
      }
    });

    const roadY = horizon + height * .15;
    ctx.save();
    ctx.translate(width * .5, roadY);
    ctx.scale(1, .38);
    const road = ctx.createLinearGradient(-width * .4, 0, width * .4, 0);
    road.addColorStop(0, 'rgba(5,15,30,.1)');
    road.addColorStop(.48, 'rgba(77,249,224,.21)');
    road.addColorStop(.52, 'rgba(133,163,255,.24)');
    road.addColorStop(1, 'rgba(5,15,30,.1)');
    ctx.strokeStyle = road;
    ctx.lineWidth = Math.max(13, width * .026);
    ctx.beginPath();
    ctx.moveTo(-width * .4, 0);
    ctx.quadraticCurveTo(0, -height * .08, width * .4, 0);
    ctx.stroke();
    ctx.restore();

    ctx.strokeStyle = 'rgba(143,255,234,.16)';
    ctx.lineWidth = 1;
    for (let lane = 0; lane < 3; lane += 1) {
      const y = roadY + lane * 11;
      ctx.beginPath();
      ctx.moveTo(width * .14, y);
      ctx.quadraticCurveTo(width * .5, y - 24, width * .86, y);
      ctx.stroke();
    }

    if (!reduced) {
      rain.forEach((drop) => {
        const y = ((drop.y * height + time * drop.speed * .085) % (height + 34)) - 17;
        const x = drop.x * width + (y - horizon) * .08;
        ctx.strokeStyle = `rgba(171,224,255,${drop.alpha})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - 3, y + drop.length);
        ctx.stroke();
      });
    }

    const foreground = ctx.createLinearGradient(0, height * .66, 0, height);
    foreground.addColorStop(0, 'rgba(2,5,12,0)');
    foreground.addColorStop(1, 'rgba(1,3,8,.92)');
    ctx.fillStyle = foreground;
    ctx.fillRect(0, height * .64, width, height * .36);
    if (!reduced) raf = requestAnimationFrame(draw);
  };
  const onPointer = (event) => {
    const rect = canvas.getBoundingClientRect();
    pointer = { x: Math.min(1, Math.max(0, (event.clientX - rect.left) / Math.max(1, rect.width))), y: Math.min(1, Math.max(0, (event.clientY - rect.top) / Math.max(1, rect.height))) };
  };
  const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(() => { resize(); draw(performance.now()); }) : null;
  observer?.observe(canvas);
  canvas.addEventListener('pointermove', onPointer, { passive: true });
  window.addEventListener('resize', resize, { passive: true });
  resize();
  draw(performance.now());
  return () => {
    disposed = true;
    if (raf) cancelAnimationFrame(raf);
    observer?.disconnect();
    window.removeEventListener('resize', resize);
    canvas.removeEventListener('pointermove', onPointer);
  };
}

function renderPortal() {
  if (!root) return;
  enterCityMode('portal', { entry: 'portal' });
  disposeCityModeTracking();
  disposeCityModeTracking = bindCityModeLinkTracking(root, 'portal', { entry: 'portal' });
  const { city, capability, currentLandmark, visited } = buildPortalState();
  const immersiveAvailable = capability.eligible;
  const entryHref = immersiveAvailable ? '/eoncity/play?entry=portal' : '/eoncity/lite?entry=portal';
  const entrySecondary = immersiveAvailable
    ? `${capability.recommendedQuality} profile · device review inside`
    : 'City Overview · WebGL is unavailable on this device';
  const activeObjective = currentLandmark?.objective || 'Choose a district that helps your work.';
  root.innerHTML = `
    <canvas class="eon-city-portal-canvas" data-eon-city-portal-canvas aria-hidden="true"></canvas>
    <header class="eon-city-portal-header">
      <a class="eon-city-portal-brand" href="/chat" aria-label="Open EONAPP Chat"><span class="eon-city-portal-brand-mark" aria-hidden="true">◌</span><span>EONAPP · City</span></a>
      <nav class="eon-city-portal-utility" aria-label="EON City utility navigation"><a href="/chat">Chat</a><a href="/workspace">Workspace</a><a href="/realm-studio">My Realm</a><a href="/profile?returnTo=%2Feoncity#eon-profile-account-foundation">Account &amp; backup</a></nav>
    </header>
    <div class="eon-city-portal-content">
      <section class="eon-city-portal-hero" aria-labelledby="eon-city-portal-title">
        <p class="eon-city-portal-kicker">Spatial work environment · local-first</p>
        <h1 id="eon-city-portal-title">Enter EON City.</h1>
        <p class="eon-city-portal-lede">A living command environment for your AI, projects and tools. Move through an original City space, meet EONBOT, and open real work surfaces only when you choose.</p>
        <a class="eon-city-portal-entry" href="${entryHref}" data-eon-city-portal-entry="${immersiveAvailable ? 'immersive-work-mode' : 'city-overview'}"><strong>ENTER EON CITY</strong><small>${escapeHtml(entrySecondary)}</small><span class="eon-city-portal-entry-arrow" aria-hidden="true">→</span></a>
        <p class="eon-city-portal-truth">The City shows only safe local status. Entering does not start an AI request, expose a prompt or provider key, create a reward, publish anything, or run work in the background.</p>
      </section>
      <aside class="eon-city-portal-side" aria-label="EON City mode choices">
        <section class="eon-city-portal-state" aria-live="polite"><p class="eon-city-portal-state-label">Your local City state</p><h2>${escapeHtml(currentLandmark?.name || 'Orientation Hall')}</h2><p>${escapeHtml(activeObjective)} ${visited ? `${visited} local visit${visited === 1 ? '' : 's'} recorded in this browser.` : 'No visit history has been recorded yet.'}</p></section>
        <nav class="eon-city-portal-choices" aria-label="Choose a City mode">
          <a class="eon-city-portal-choice" href="/eoncity/tour?entry=portal"><span class="eon-city-portal-choice-icon" aria-hidden="true">◇</span><span><strong>Spatial Command Space</strong><small>Explore a detailed Three.js command environment on a capable device.</small></span><span class="eon-city-portal-choice-arrow" aria-hidden="true">→</span></a>
          <a class="eon-city-portal-choice" href="/eoncity/lite?entry=portal"><span class="eon-city-portal-choice-icon" aria-hidden="true">▦</span><span><strong>City Overview</strong><small>Open the fast illustrated district map and route useful work.</small></span><span class="eon-city-portal-choice-arrow" aria-hidden="true">→</span></a>
          <a class="eon-city-portal-choice" href="/apps"><span class="eon-city-portal-choice-icon" aria-hidden="true">◫</span><span><strong>App Deck</strong><small>Choose a Workroom, AI Crew role, future connection boundary or Blueprint.</small></span><span class="eon-city-portal-choice-arrow" aria-hidden="true">→</span></a>
          <a class="eon-city-portal-choice" href="/realm-studio"><span class="eon-city-portal-choice-icon" aria-hidden="true">◎</span><span><strong>My Realm Studio</strong><small>Shape your portable local Realm identity and City appearance.</small></span><span class="eon-city-portal-choice-arrow" aria-hidden="true">→</span></a>
        </nav>
      </aside>
    </div>
    <footer class="eon-city-portal-footer"><span>Original EON City visual direction. City modes share one local-only City state and never contain Vault secrets, private chat content or provider credentials.</span><span>Guest entry stays open. Optional Google Login is not a City or local-work backup.</span><span>Immersive mode loads only after your tap.</span></footer>`;
  const dispose = mountArrivalCanvas(root.querySelector('[data-eon-city-portal-canvas]'), city.citySeed);
  window.addEventListener('pagehide', dispose, { once: true });
}

renderPortal();
globalThis.addEventListener?.('pagehide', () => disposeCityModeTracking(), { once: true });
