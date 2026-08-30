import { loadAutomationState } from './utils/automation-os-store.js';
import { readPrivateMarketDrop } from './market/market-private-drop.js';
import { listOperatorActivity, appendOperatorActivity } from './operator/operator-activity.js';
import { describeAgentPresence, getAgentPresenceCollaboration, getAgentPresenceOutcome, getAgentPresenceSummary, readAgentPresencePreferences, saveAgentPresencePreferences } from './operator/agent-presence.js';
import {
  CITY_WORLD_STATE_KEY,
  ensureCityWorldState,
  moveCityAvatar,
  recordCityDistrictVisit
} from './city/city-world-state.js';
import { recordMyRealmReturn } from './realm/realm-state.js';
import {
  EONBOT_ACTION_RECEIPTS_KEY,
  findLatestEonbotActionReceiptForRoute,
  markEonbotActionReceiptDestinationOpened,
  markEonbotActionReceiptUserConfirmed
} from './chat/eonbot-action-receipts.js';
import { prepareCityAction, confirmPreparedCityAction } from './city/city-prepared-action.js';
import { offerCityBeginnerMission, openCityBeginnerMission, dismissCityBeginnerMission } from './city/city-work-mission.js';
import { bindCityModeLinkTracking, enterCityMode } from './city/city-mode-transition.js';
import {
  getCityLiteDistrictArt,
  readCityLiteVisualPreferences,
  resolveCityLiteVisualProfile,
  saveCityLiteVisualPreferences
} from './city/eon-city-lite-art-direction.js';

import {
  CITY_CANVAS_SIZE,
  CITY_COLLIDERS,
  CITY_DISTRICTS,
  buildCityObjective,
  getCityObjectiveProgress,
  cityDirectionFromDelta,
  cityPointFromCanvasEvent,
  getCityDistrictAt,
  getCityDistrictById,
  getNearbyCityDistrict,
  findCityWalkPath,
  resolveCityMovement
} from './city/eon-city-2d-engine.js';

const root = document.getElementById('eon-operator-map-root');
const MOVE_STEP = 0.025;
const TARGET_STEP = 0.007;
const SAVE_INTERVAL_MS = 160;

let activeRuntime = null;
let realmReturnRecordedForDocument = false;
let disposeCityModeTracking = () => {};

function escapeHtml(value = '') {
  return String(value || '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' }[char]));
}

function activityLabel(status = '') {
  const value = String(status || '').toLowerCase();
  if (value === 'active') return 'Working';
  if (value === 'waiting') return 'Needs review';
  if (value === 'complete') return 'Complete';
  if (value === 'failed') return 'Needs attention';
  if (value === 'ready') return 'Ready';
  return 'Updated';
}

function currentCityRoute() {
  try { return `${window.location.pathname}${window.location.search}`; } catch { return '/eoncity'; }
}

function currentCitySearch() {
  try { return new URLSearchParams(window.location.search); } catch { return new URLSearchParams(); }
}

function receiptTargetLabel(receipt) {
  const district = receipt?.targetDistrictId ? getCityDistrictById(receipt.targetDistrictId) : null;
  if (district) return district.name;
  return receipt?.focusObjective ? 'your local First Circuit objective' : 'this City route';
}

function commandReceiptCopy(receipt) {
  if (!receipt) return { heading: '', body: '' };
  const target = receiptTargetLabel(receipt);
  if (receipt.status === 'user-confirmed') {
    return { heading: 'Confirmed locally', body: `You reached ${target} and interacted here. This records no reward, value, server event, or background action.` };
  }
  if (receipt.status === 'destination-opened') {
    return { heading: 'Destination opened', body: `EONBOT prepared ${target}. Move there and interact to confirm only your local City step.` };
  }
  return { heading: 'Ready for your choice', body: `EONBOT prepared ${target}. Nothing has been completed yet.` };
}

function receiptMatchesCityInteraction(receipt, district, objective) {
  if (!receipt || !district) return false;
  if (receipt.targetDistrictId) return receipt.targetDistrictId === district.id;
  return Boolean(receipt.focusObjective && objective?.districtId === district.id);
}

function buildMapState() {
  const automation = loadAutomationState();
  const pendingApprovals = automation.approvals.filter((item) => item.status === 'pending').length;
  const activeWorkflows = automation.workflows.filter((item) => item.status === 'ready').length;
  const market = readPrivateMarketDrop();
  return { automation, pendingApprovals, activeWorkflows, market };
}

function isReducedMotion() {
  try { return Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches); } catch { return false; }
}

function isLowPower() {
  try {
    const nav = navigator;
    return Boolean(nav.connection?.saveData || (Number(nav.deviceMemory) > 0 && Number(nav.deviceMemory) <= 2));
  } catch {
    return false;
  }
}

function drawRoundRect(ctx, x, y, width, height, radius, fill, stroke = '') {
  const safeRadius = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + safeRadius, y);
  ctx.arcTo(x + width, y, x + width, y + height, safeRadius);
  ctx.arcTo(x + width, y + height, x, y + height, safeRadius);
  ctx.arcTo(x, y + height, x, y, safeRadius);
  ctx.arcTo(x, y, x + width, y, safeRadius);
  ctx.closePath();
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.stroke();
  }
}

function hexToRgba(hex = '#5eead4', alpha = 1) {
  const source = String(hex || '#5eead4').replace('#', '').trim();
  const expanded = source.length === 3 ? source.split('').map((value) => `${value}${value}`).join('') : source;
  const parsed = Number.parseInt(expanded, 16);
  if (!Number.isFinite(parsed)) return `rgba(94,234,212,${alpha})`;
  return `rgba(${(parsed >> 16) & 255},${(parsed >> 8) & 255},${parsed & 255},${alpha})`;
}

function stableUnit(value = '') {
  let hash = 2166136261;
  for (const character of String(value || '')) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967295;
}

function polygon(ctx, points, fill = '', stroke = '') {
  if (!points.length) return;
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (const [x, y] of points.slice(1)) ctx.lineTo(x, y);
  ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.stroke(); }
}

function drawRoad(ctx, width, height, points, { reducedMotion, lowPower }) {
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(5,11,25,.84)';
  ctx.lineWidth = 64;
  ctx.beginPath();
  points.forEach(([x, y], index) => index ? ctx.lineTo(x * width, y * height) : ctx.moveTo(x * width, y * height));
  ctx.stroke();
  ctx.strokeStyle = 'rgba(80,101,137,.42)';
  ctx.lineWidth = 51;
  ctx.stroke();
  ctx.strokeStyle = 'rgba(203,213,225,.12)';
  ctx.lineWidth = 2;
  ctx.setLineDash([11, 12]);
  ctx.stroke();
  ctx.setLineDash([]);
  if (reducedMotion || lowPower) return;
  const pulse = 0.35 + Math.sin(Date.now() / 650) * 0.13;
  ctx.strokeStyle = `rgba(94,234,212,${pulse})`;
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 21]);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawTree(ctx, x, y, seed, scale = 1) {
  const crown = 7 + stableUnit(`${seed}:crown`) * 6;
  ctx.fillStyle = 'rgba(2,6,23,.44)';
  ctx.beginPath();
  ctx.ellipse(x + 3, y + 5, crown * 1.15, crown * .58, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = stableUnit(`${seed}:tone`) > .5 ? 'rgba(34,197,94,.74)' : 'rgba(45,212,191,.67)';
  ctx.beginPath();
  ctx.arc(x, y - 3 * scale, crown * scale, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(187,247,208,.17)';
  ctx.beginPath();
  ctx.arc(x - crown * .28, y - 5 * scale, crown * .45, 0, Math.PI * 2);
  ctx.fill();
}

function drawDiamond(ctx, x, y, width, height, fill, stroke = '') {
  polygon(ctx, [[x, y - height / 2], [x + width / 2, y], [x, y + height / 2], [x - width / 2, y]], fill, stroke);
}

function cityPalette(state) {
  const palette = String(state?.realmAppearance?.palette || 'classic-eon');
  const styles = {
    graphite: { groundA: '#1f2937', groundB: '#111827', groundC: '#020617', glow: '#cbd5e1', grass: 'rgba(100,116,139,.28)' },
    aurora: { groundA: '#25204c', groundB: '#151536', groundC: '#080817', glow: '#c4b5fd', grass: 'rgba(59,130,246,.23)' },
    'dark-purple': { groundA: '#281742', groundB: '#17112d', groundC: '#070510', glow: '#e9d5ff', grass: 'rgba(139,92,246,.22)' },
    'neon-city': { groundA: '#083548', groundB: '#062237', groundC: '#03101d', glow: '#67e8f9', grass: 'rgba(20,184,166,.2)' },
    'forest-circuit': { groundA: '#153f34', groundB: '#0a2925', groundC: '#031212', glow: '#86efac', grass: 'rgba(74,222,128,.26)' },
    minimal: { groundA: '#1f2937', groundB: '#111827', groundC: '#030712', glow: '#dbeafe', grass: 'rgba(148,163,184,.18)' },
    'classic-eon': { groundA: '#14294a', groundB: '#0b1a31', groundC: '#060d1a', glow: '#5eead4', grass: 'rgba(45,212,191,.22)' }
  };
  return styles[palette] || styles['classic-eon'];
}

function drawTerrainTiles(ctx, width, height, state, { lowPower }) {
  const columns = lowPower ? 13 : 22;
  const rows = lowPower ? 8 : 14;
  const tileW = width / columns;
  const tileH = Math.max(28, height / rows) * .46;
  ctx.save();
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const unit = stableUnit(`${state.citySeed}:tile:${column}:${row}`);
      if (unit < .37) continue;
      const x = column * tileW + tileW * .5 + (row % 2 ? tileW * .25 : 0);
      const y = row * (height / rows) + 32;
      drawDiamond(ctx, x, y, tileW * (.52 + unit * .25), tileH * (.48 + unit * .2), `rgba(148,163,184,${.012 + unit * .024})`);
    }
  }
  ctx.restore();
}

function getCurrentCityLiteVisualProfile(preferences = readCityLiteVisualPreferences()) {
  let saveData = false;
  let deviceMemory = null;
  try {
    saveData = Boolean(navigator?.connection?.saveData);
    deviceMemory = Number(navigator?.deviceMemory || 0) || null;
  } catch {}
  return resolveCityLiteVisualProfile({
    quality: preferences.quality,
    reducedMotion: isReducedMotion(),
    saveData,
    deviceMemory
  });
}

function drawSkylineHorizon(ctx, width, height, state, palette, profile) {
  const layers = Math.max(1, Number(profile?.skylineLayers || 1));
  const horizon = height * .31;
  ctx.save();
  for (let layer = 0; layer < layers; layer += 1) {
    const density = layer === 0 ? 18 : layer === 1 ? 12 : 8;
    const baseY = horizon + layer * 22;
    const alpha = .13 + layer * .09;
    for (let index = 0; index < density; index += 1) {
      const seed = stableUnit(`${state.citySeed}:skyline:${layer}:${index}`);
      const x = ((index + seed * .72) / density) * width;
      const buildingW = 34 + seed * 62;
      const buildingH = (42 + stableUnit(`${state.citySeed}:skyline-height:${layer}:${index}`) * 145) * (1 - layer * .16);
      const y = baseY - buildingH;
      const gradient = ctx.createLinearGradient(x, y, x + buildingW, baseY);
      gradient.addColorStop(0, hexToRgba(palette.glow, alpha * .76));
      gradient.addColorStop(1, `rgba(3,8,19,${.44 + layer * .08})`);
      drawRoundRect(ctx, x, y, buildingW, buildingH, 3, gradient, hexToRgba(palette.glow, .08 + alpha * .35));
      if (layer < 2 && profile?.labelDensity !== 'essential') {
        ctx.fillStyle = hexToRgba(palette.glow, .13 + alpha * .2);
        const windows = Math.max(1, Math.floor(buildingH / 27));
        for (let row = 0; row < windows; row += 1) ctx.fillRect(x + 7, y + 11 + row * 22, Math.max(3, buildingW - 14), 2);
      }
    }
  }
  const haze = ctx.createLinearGradient(0, horizon - 40, 0, horizon + 84);
  haze.addColorStop(0, 'rgba(2,6,23,0)');
  haze.addColorStop(1, 'rgba(2,6,23,.42)');
  ctx.fillStyle = haze;
  ctx.fillRect(0, horizon - 40, width, 125);
  ctx.restore();
}

function drawTransitCircuit(ctx, width, height, palette, profile, { reducedMotion } = {}) {
  const lightCount = Math.max(0, Number(profile?.transitLights || 0));
  if (!lightCount) return;
  const top = height * .38;
  const bottom = height * .83;
  ctx.save();
  ctx.strokeStyle = 'rgba(125,211,252,.12)';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(width * .12, top);
  ctx.bezierCurveTo(width * .31, top - 45, width * .69, top - 45, width * .88, top);
  ctx.lineTo(width * .88, bottom);
  ctx.bezierCurveTo(width * .66, bottom + 33, width * .34, bottom + 33, width * .12, bottom);
  ctx.closePath();
  ctx.stroke();
  ctx.strokeStyle = hexToRgba(palette.glow, .34);
  ctx.lineWidth = 1.5;
  ctx.setLineDash([5, 14]);
  ctx.stroke();
  ctx.setLineDash([]);
  for (let index = 0; index < lightCount; index += 1) {
    const fraction = (index + .5) / lightCount;
    const orbit = reducedMotion ? fraction : (fraction + (Date.now() / 15000)) % 1;
    const x = width * (.12 + orbit * .76);
    const y = top - Math.sin(orbit * Math.PI) * 42;
    ctx.shadowColor = palette.glow;
    ctx.shadowBlur = profile?.quality === 'high' ? 12 : 6;
    ctx.fillStyle = hexToRgba(palette.glow, .9);
    ctx.beginPath(); ctx.arc(x, y, profile?.quality === 'high' ? 3 : 2.2, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

function drawAtmosphericDetails(ctx, width, height, state, palette, profile, { reducedMotion } = {}) {
  if (profile?.quality === 'conserve') return;
  const particleCount = Math.max(0, Number(profile?.particles || 0));
  ctx.save();
  for (let index = 0; index < particleCount; index += 1) {
    const x = stableUnit(`${state.citySeed}:particle-x:${index}`) * width;
    const baseY = stableUnit(`${state.citySeed}:particle-y:${index}`) * height;
    const drift = reducedMotion ? 0 : Math.sin(Date.now() / (900 + index * 17) + index) * 9;
    const y = baseY + drift;
    ctx.fillStyle = hexToRgba(index % 3 ? palette.glow : '#c4b5fd', .06 + (index % 5) * .018);
    ctx.fillRect(x, y, index % 4 === 0 ? 1.6 : 1, index % 4 === 0 ? 1.6 : 1);
  }
  if (profile?.rain) {
    ctx.strokeStyle = 'rgba(186,230,253,.08)';
    ctx.lineWidth = 1;
    const rows = profile?.quality === 'high' ? 32 : 12;
    for (let index = 0; index < rows; index += 1) {
      const x = stableUnit(`${state.citySeed}:rain-x:${index}`) * width;
      const shifted = reducedMotion ? 0 : (Date.now() / 16) % (height + 30);
      const y = (stableUnit(`${state.citySeed}:rain-y:${index}`) * height + shifted * (.14 + (index % 3) * .03)) % height;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 4, y + 12 + (index % 4) * 3); ctx.stroke();
    }
  }
  ctx.restore();
}

function drawDistrictCallouts(ctx, width, height, objective, hoveredDistrictId, profile) {
  const visible = profile?.labelDensity === 'full'
    ? CITY_DISTRICTS
    : CITY_DISTRICTS.filter((district) => district.id === objective?.districtId || district.id === hoveredDistrictId || district.id === 'command' || district.id === 'orientation');
  ctx.save();
  visible.forEach((district) => {
    const art = getCityLiteDistrictArt(district.id);
    const x = (district.x + district.width / 2) * width;
    const y = Math.max(32, district.y * height - 13);
    const label = profile?.labelDensity === 'full' ? `${district.shortName} · ${art.transitStop}` : district.name;
    ctx.font = profile?.labelDensity === 'full' ? '700 9px system-ui' : '700 10px system-ui';
    const labelW = Math.min(190, Math.max(76, ctx.measureText(label).width + 18));
    drawRoundRect(ctx, x - labelW / 2, y - 10, labelW, 19, 6, 'rgba(2,6,23,.82)', hexToRgba(art.accent, district.id === hoveredDistrictId ? .9 : .38));
    ctx.fillStyle = 'rgba(241,245,249,.96)';
    ctx.textAlign = 'center';
    ctx.fillText(label, x, y + 3);
  });
  ctx.textAlign = 'left';
  ctx.restore();
}

function drawCityBoundary(ctx, width, height, palette) {
  ctx.save();
  ctx.strokeStyle = hexToRgba(palette.glow, .23);
  ctx.lineWidth = 3;
  ctx.setLineDash([2, 15]);
  drawRoundRect(ctx, 20, 18, width - 40, height - 36, 42, '', hexToRgba(palette.glow, .2));
  ctx.setLineDash([]);
  // Four static gate pylons imply a city boundary without pretending there are live guards or traffic.
  for (const [x, y] of [[width * .5, 28], [width * .5, height - 28], [28, height * .5], [width - 28, height * .5]]) {
    ctx.fillStyle = 'rgba(15,23,42,.82)';
    drawRoundRect(ctx, x - 8, y - 14, 16, 28, 4, 'rgba(15,23,42,.82)', hexToRgba(palette.glow, .46));
    ctx.fillStyle = hexToRgba(palette.glow, .62);
    ctx.fillRect(x - 2, y - 8, 4, 16);
  }
  ctx.restore();
}

function drawLamp(ctx, x, y, color, { reducedMotion, lowPower }) {
  ctx.save();
  ctx.strokeStyle = 'rgba(100,116,139,.86)';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(x, y + 12); ctx.lineTo(x, y - 12); ctx.stroke();
  const glow = reducedMotion || lowPower ? .46 : .48 + Math.sin(Date.now() / 840 + x) * .12;
  ctx.shadowColor = hexToRgba(color, glow);
  ctx.shadowBlur = lowPower ? 7 : 14;
  ctx.fillStyle = hexToRgba(color, .88);
  ctx.beginPath(); ctx.arc(x, y - 14, 3.4, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawDistrictProps(ctx, district, rect, flags) {
  const { x, y, w, h } = rect;
  const color = district.color;
  const inset = Math.max(8, Math.min(w, h) * .1);
  // Static authored props make each district legible. They are never simulated actors.
  if (district.id === 'command') {
    drawRoundRect(ctx, x + w * .06, y + h * .7, w * .12, h * .12, 4, 'rgba(15,23,42,.9)', hexToRgba(color, .48));
    drawRoundRect(ctx, x + w * .82, y + h * .68, w * .1, h * .14, 4, 'rgba(15,23,42,.9)', hexToRgba(color, .48));
  } else if (district.id === 'workspace') {
    for (let index = 0; index < 3; index += 1) drawRoundRect(ctx, x + w * (.16 + index * .22), y + h * .74, w * .13, h * .09, 3, 'rgba(15,23,42,.86)', hexToRgba(color, .34));
  } else if (district.id === 'market') {
    for (let index = 0; index < 3; index += 1) drawDiamond(ctx, x + w * (.22 + index * .26), y + h * .78, w * .1, h * .12, hexToRgba(color, .16 + index * .08), hexToRgba(color, .45));
  } else if (district.id === 'realm') {
    const landmark = String(flags.realmLandmarkStyle || 'observatory');
    ctx.save();
    if (landmark === 'garden') {
      drawRoundRect(ctx, x + w * .15, y + h * .72, w * .7, h * .11, 10, 'rgba(15,69,58,.44)', hexToRgba(color, .36));
      for (let index = 0; index < 5; index += 1) drawTree(ctx, x + w * (.22 + index * .14), y + h * (.72 + (index % 2) * .04), `realm-garden:${index}`, .62);
    } else if (landmark === 'gallery') {
      drawRoundRect(ctx, x + w * .18, y + h * .68, w * .64, h * .17, 8, 'rgba(15,23,42,.88)', hexToRgba(color, .54));
      for (let index = 0; index < 3; index += 1) drawRoundRect(ctx, x + w * (.25 + index * .19), y + h * .715, w * .105, h * .07, 3, hexToRgba(color, .16 + index * .08), hexToRgba(color, .6));
    } else if (landmark === 'workshop') {
      drawRoundRect(ctx, x + w * .22, y + h * .69, w * .56, h * .16, 7, 'rgba(15,23,42,.92)', hexToRgba(color, .48));
      for (let index = 0; index < 3; index += 1) drawDiamond(ctx, x + w * (.32 + index * .18), y + h * .745, w * .09, h * .1, hexToRgba(color, .16), hexToRgba(color, .5));
    } else if (landmark === 'sanctum') {
      drawDiamond(ctx, x + w * .5, y + h * .74, w * .28, h * .22, 'rgba(15,23,42,.9)', hexToRgba(color, .72));
      drawDiamond(ctx, x + w * .5, y + h * .715, w * .1, h * .1, hexToRgba(color, .58), 'rgba(248,250,252,.68)');
    } else {
      // Observatory is the default: an easy-to-read private landmark, not a public building or a value claim.
      ctx.strokeStyle = hexToRgba(color, .55); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(x + w * .5, y + h * .75, w * .16, Math.PI, 0); ctx.stroke();
      drawRoundRect(ctx, x + w * .37, y + h * .75, w * .26, h * .08, 4, 'rgba(15,23,42,.9)', hexToRgba(color, .42));
    }
    ctx.restore();
  } else if (district.id === 'library') {
    for (let index = 0; index < 4; index += 1) drawRoundRect(ctx, x + w * (.14 + index * .17), y + h * .75, w * .1, h * .08, 2, 'rgba(15,23,42,.9)', hexToRgba(color, .3));
  } else if (district.id === 'trade') {
    ctx.strokeStyle = hexToRgba(color, .52); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x + w * .14, y + h * .82); ctx.lineTo(x + w * .38, y + h * .72); ctx.lineTo(x + w * .56, y + h * .79); ctx.lineTo(x + w * .84, y + h * .62); ctx.stroke();
  } else if (district.id === 'vault') {
    drawRoundRect(ctx, x + w * .43, y + h * .73, w * .14, h * .1, 4, 'rgba(15,23,42,.96)', hexToRgba(color, .54));
  }
  drawLamp(ctx, x + inset, y + h * .83, color, flags);
  drawLamp(ctx, x + w - inset, y + h * .83, color, flags);
}

function drawQuestMarker(ctx, district, rect, flags) {
  if (flags.objective?.districtId !== district.id || flags.objective?.complete) return;
  const { x, y, w } = rect;
  const pulse = flags.reducedMotion || flags.lowPower ? 0 : Math.sin(Date.now() / 420) * 3;
  const markerX = x + w * .5;
  const markerY = y - 8 + pulse;
  ctx.save();
  ctx.shadowColor = hexToRgba(district.color, .9); ctx.shadowBlur = 22;
  drawDiamond(ctx, markerX, markerY, 20, 26, hexToRgba(district.color, .95), 'rgba(248,250,252,.86)');
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#08111f'; ctx.font = '800 11px system-ui'; ctx.textAlign = 'center'; ctx.fillText('!', markerX, markerY + 4); ctx.textAlign = 'left';
  ctx.restore();
}

function drawDistrictBuilding(ctx, district, rect, state, flags) {
  const { x, y, w, h } = rect;
  const nearby = flags.nearby?.id === district.id;
  const objective = flags.objective?.districtId === district.id && !flags.objective.complete;
  const target = flags.target?.districtId === district.id;
  const hovered = flags.hoveredDistrictId === district.id;
  const art = getCityLiteDistrictArt(district.id);
  const pulse = flags.reducedMotion || flags.lowPower ? 0 : (0.5 + Math.sin(Date.now() / 600 + stableUnit(district.id) * 6) * 0.5);
  const inset = Math.max(8, Math.min(w, h) * .08);
  const facadeX = x + inset;
  const facadeY = y + h * .28;
  const facadeW = w - inset * 2;
  const facadeH = h * .58;
  const roofLift = Math.max(11, h * .16);
  const accent = district.color;

  ctx.save();
  ctx.shadowColor = nearby || objective || target || hovered ? hexToRgba(accent, .75) : 'rgba(2,6,23,.72)';
  ctx.shadowBlur = nearby || objective || target || hovered ? 28 + pulse * 10 : 16;
  drawRoundRect(ctx, x + 3, y + h * .42, w - 6, h * .52, Math.min(22, h * .16), 'rgba(2,6,23,.72)', hexToRgba(accent, .28));
  ctx.shadowBlur = 0;

  // Canvas roofs use a solid emissive accent and a separate structural outline.
  polygon(ctx, [
    [facadeX, facadeY], [facadeX + facadeW, facadeY],
    [facadeX + facadeW - roofLift, facadeY - roofLift], [facadeX + roofLift, facadeY - roofLift]
  ], hexToRgba(accent, .38), hexToRgba(accent, .74));
  polygon(ctx, [
    [facadeX + facadeW, facadeY], [facadeX + facadeW, facadeY + facadeH],
    [facadeX + facadeW - roofLift, facadeY + facadeH - roofLift], [facadeX + facadeW - roofLift, facadeY - roofLift]
  ], 'rgba(9,15,30,.88)', 'rgba(148,163,184,.22)');
  const facadeGradient = ctx.createLinearGradient(facadeX, facadeY, facadeX, facadeY + facadeH);
  facadeGradient.addColorStop(0, 'rgba(42,58,86,.98)');
  facadeGradient.addColorStop(1, 'rgba(10,18,34,.99)');
  polygon(ctx, [
    [facadeX, facadeY], [facadeX + facadeW, facadeY], [facadeX + facadeW, facadeY + facadeH], [facadeX, facadeY + facadeH]
  ], facadeGradient, hexToRgba(accent, .42));

  const motif = String(district.landmark || 'district');
  if (motif === 'command-spire') {
    ctx.fillStyle = hexToRgba(accent, .72);
    polygon(ctx, [[x + w * .48, y + h * .08], [x + w * .59, y + h * .38], [x + w * .37, y + h * .38]], hexToRgba(accent, .5));
    ctx.fillRect(x + w * .46, y + h * .18, w * .08, h * .22);
  } else if (motif === 'twin-workshop') {
    drawRoundRect(ctx, x + w * .2, y + h * .16, w * .18, h * .4, 8, hexToRgba(accent, .24), hexToRgba(accent, .52));
    drawRoundRect(ctx, x + w * .62, y + h * .12, w * .16, h * .44, 8, hexToRgba(accent, .32), hexToRgba(accent, .6));
  } else if (motif === 'realm-gate') {
    ctx.strokeStyle = hexToRgba(accent, .85);
    ctx.lineWidth = Math.max(3, Math.min(8, w * .04));
    ctx.beginPath();
    ctx.arc(x + w * .5, y + h * .42, Math.min(w, h) * .2, Math.PI, 0);
    ctx.stroke();
  } else if (motif === 'archive-stacks') {
    for (let index = 0; index < 4; index += 1) drawRoundRect(ctx, x + w * (.16 + index * .15), y + h * (.18 + (index % 2) * .07), w * .1, h * .34, 4, hexToRgba(accent, .16 + index * .05), hexToRgba(accent, .35));
  } else if (motif === 'research-observatory') {
    ctx.strokeStyle = hexToRgba(accent, .7); ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(x + w * .5, y + h * .34, Math.min(w, h) * .18, Math.PI, 0); ctx.stroke();
  } else if (motif === 'vault-bastion') {
    drawRoundRect(ctx, x + w * .38, y + h * .2, w * .24, h * .32, 8, hexToRgba(accent, .2), hexToRgba(accent, .7));
    ctx.strokeStyle = hexToRgba(accent, .7); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x + w * .5, y + h * .36, Math.min(w, h) * .055, 0, Math.PI * 2); ctx.stroke();
  } else if (motif === 'gallery-arcade') {
    for (let index = 0; index < 3; index += 1) {
      ctx.strokeStyle = hexToRgba(accent, .58); ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(x + w * (.28 + index * .22), y + h * .5, Math.min(w, h) * .11, Math.PI, 0); ctx.stroke();
    }
  } else if (motif === 'orientation-atrium') {
    ctx.strokeStyle = hexToRgba(accent, .8); ctx.lineWidth = Math.max(3, Math.min(7, w * .035));
    ctx.beginPath(); ctx.arc(x + w * .5, y + h * .4, Math.min(w, h) * .18, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = hexToRgba(accent, .48); ctx.fillRect(x + w * .47, y + h * .21, w * .06, h * .33);
    ctx.fillRect(x + w * .31, y + h * .37, w * .38, h * .06);
  }

  const columns = Math.max(2, Math.floor(facadeW / 34));
  const rows = Math.max(1, Math.floor(facadeH / 34));
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const windowSeed = stableUnit(`${district.id}:${row}:${column}`);
      const lit = nearby || objective || windowSeed > .46;
      drawRoundRect(ctx, facadeX + 14 + column * ((facadeW - 26) / columns), facadeY + 17 + row * ((facadeH - 26) / rows), Math.max(7, facadeW / columns - 11), 8, 2, lit ? hexToRgba(accent, .66) : 'rgba(148,163,184,.16)');
    }
  }
  drawRoundRect(ctx, x + w * .18, y + h * .74, w * .64, Math.max(18, h * .16), 7, 'rgba(2,6,23,.84)', hexToRgba(accent, .45));
  ctx.fillStyle = 'rgba(248,250,252,.95)';
  ctx.font = `700 ${Math.max(12, Math.min(18, w / 13))}px system-ui`;
  ctx.textAlign = 'center';
  ctx.fillText(`${district.icon} ${district.shortName}`, x + w / 2, y + h * .86);
  if (flags.profile?.labelDensity === 'full') {
    ctx.fillStyle = hexToRgba(art.accent, .72);
    ctx.font = '600 8px system-ui';
    ctx.fillText(art.roof.replace(/-/g, ' '), x + w / 2, y + h * .68);
  }
  ctx.textAlign = 'left';
  if (nearby || objective || target || hovered) {
    ctx.strokeStyle = hexToRgba(accent, .92); ctx.lineWidth = 2;
    ctx.setLineDash(flags.reducedMotion ? [] : [7, 7]);
    ctx.strokeRect(x - 8, y - 8, w + 16, h + 16);
    ctx.setLineDash([]);
  }
  ctx.restore();
}

function drawAvatar(ctx, state, width, height, { reducedMotion, lowPower }) {
  const x = state.avatar.x * width;
  const y = state.avatar.y * height;
  const bob = reducedMotion || lowPower ? 0 : Math.sin(Date.now() / 240) * 1.6;
  const color = state.avatar.appearance === 'graphite' ? '#cbd5e1' : '#5eead4';
  const direction = state.avatar.direction || 'down';
  ctx.save();
  ctx.translate(x, y + bob);
  ctx.fillStyle = 'rgba(2,6,23,.56)';
  ctx.beginPath(); ctx.ellipse(0, 16, 13, 6, 0, 0, Math.PI * 2); ctx.fill();
  ctx.shadowColor = hexToRgba(color, .78); ctx.shadowBlur = 18;
  // A compact explorer sprite: cloak, belt core, face and directional visor.
  polygon(ctx, [[-11, 2], [11, 2], [15, 23], [0, 29], [-15, 23]], '#10213a', hexToRgba(color, .48));
  ctx.fillStyle = hexToRgba(color, .9);
  drawRoundRect(ctx, -8, 1, 16, 15, 5, hexToRgba(color, .92), 'rgba(248,250,252,.24)');
  ctx.shadowBlur = 0;
  drawRoundRect(ctx, -8, 12, 16, 4, 1, 'rgba(2,6,23,.72)');
  ctx.fillStyle = '#f8fafc'; ctx.beginPath(); ctx.arc(0, -11, 10, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#111827'; ctx.beginPath(); ctx.arc(0, -16, 10, Math.PI, Math.PI * 2); ctx.fill();
  const eyeOffset = direction === 'left' ? -2.4 : direction === 'right' ? 2.4 : 0;
  drawRoundRect(ctx, -6 + eyeOffset, -14, 12, 4, 2, 'rgba(15,23,42,.88)', hexToRgba(color, .52));
  ctx.fillStyle = hexToRgba(color, .92); ctx.fillRect(-1, 7, 2, 2);
  ctx.strokeStyle = hexToRgba(color, .78); ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(-6, 22); ctx.lineTo(-8, 29); ctx.moveTo(6, 22); ctx.lineTo(8, 29); ctx.stroke();
  ctx.restore();
  ctx.fillStyle = 'rgba(248,250,252,.94)'; ctx.font = '700 12px system-ui'; ctx.textAlign = 'center'; ctx.fillText(state.avatar.name || 'Operator', x, y + 45); ctx.textAlign = 'left';
}

function drawAgentPresence(ctx, entries, preferences, width, height, { reducedMotion, lowPower }) {
  if (!preferences?.enabled || !Array.isArray(entries) || !entries.length) return;
  const anchors = {
    coordinator: [0.5, 0.27],
    researcher: [0.72, 0.61],
    builder: [0.62, 0.28],
    reviewer: [0.5, 0.47],
    'local-runner': [0.71, 0.69],
    guide: [0.5, 0.34]
  };
  const visible = entries.slice(0, 4);
  const collaboration = getAgentPresenceCollaboration(visible);
  const points = visible.map((entry, index) => {
    const base = anchors[entry.role] || anchors.coordinator;
    const wobble = reducedMotion || lowPower ? 0 : Math.sin((Date.now() / 330) + index * 1.4) * 4;
    return { entry, index, x: base[0] * width + ((index % 2) - .5) * 24, y: base[1] * height + wobble };
  });

  // A huddle visual is derived from recorded status only. It never suggests a
  // transcript, a tool call, or autonomous conversation between agents.
  if (points.length >= 2) {
    const centreX = points.reduce((sum, point) => sum + point.x, 0) / points.length;
    const centreY = points.reduce((sum, point) => sum + point.y, 0) / points.length;
    ctx.save();
    ctx.strokeStyle = collaboration.accent;
    ctx.globalAlpha = reducedMotion || lowPower ? .34 : .48;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 7]);
    points.forEach((point) => { ctx.beginPath(); ctx.moveTo(centreX, centreY); ctx.lineTo(point.x, point.y); ctx.stroke(); });
    ctx.setLineDash([]);
    ctx.globalAlpha = .92;
    ctx.shadowColor = collaboration.accent; ctx.shadowBlur = lowPower ? 7 : 15;
    ctx.fillStyle = 'rgba(2,6,23,.9)';
    drawRoundRect(ctx, centreX - 64, centreY - 63, 128, 20, 6, 'rgba(2,6,23,.9)', collaboration.accent);
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(248,250,252,.96)'; ctx.font = '700 9px system-ui'; ctx.textAlign = 'center';
    ctx.fillText(collaboration.title, centreX, centreY - 50);
    ctx.restore();
  }

  points.forEach(({ entry, x, y }) => {
    const cue = describeAgentPresence(entry, preferences);
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = 'rgba(2,6,23,.55)';
    ctx.beginPath(); ctx.ellipse(0, 12, 10, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.shadowColor = cue.accent; ctx.shadowBlur = 14;
    drawRoundRect(ctx, -7, -2, 14, 19, 5, 'rgba(15,23,42,.96)', cue.accent);
    ctx.fillStyle = cue.accent; ctx.beginPath(); ctx.arc(0, -10, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(2,6,23,.84)'; drawRoundRect(ctx, -5, -12, 10, 3, 1, 'rgba(2,6,23,.84)');
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(2,6,23,.88)';
    const bubbleW = Math.min(154, Math.max(92, cue.title.length * 5.7));
    drawRoundRect(ctx, -bubbleW / 2, -42, bubbleW, 21, 6, 'rgba(2,6,23,.9)', cue.accent);
    ctx.fillStyle = 'rgba(248,250,252,.96)'; ctx.font = '700 9px system-ui'; ctx.textAlign = 'center';
    ctx.fillText(cue.title, 0, -29);
    ctx.restore();
  });
}

function drawAgentOutcomeBeacon(ctx, outcome, width, height, { reducedMotion, lowPower }) {
  if (!outcome?.visible) return;
  const x = width * .5;
  const y = height * .16;
  const pulse = reducedMotion || lowPower ? 0 : Math.sin(Date.now() / 520) * 1.8;
  ctx.save();
  ctx.translate(x, y + pulse);
  ctx.shadowColor = outcome.accent;
  ctx.shadowBlur = lowPower ? 8 : 18;
  drawRoundRect(ctx, -78, -15, 156, 29, 8, 'rgba(2,6,23,.93)', outcome.accent);
  ctx.shadowBlur = 0;
  ctx.fillStyle = outcome.accent;
  ctx.beginPath(); ctx.arc(-60, 0, 5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(248,250,252,.98)';
  ctx.font = '700 11px system-ui';
  ctx.textAlign = 'center';
  ctx.fillText(outcome.title, 8, 4);
  ctx.font = '600 8px system-ui';
  ctx.fillStyle = 'rgba(203,213,225,.95)';
  ctx.fillText('Review in Chat', 8, 20);
  ctx.restore();
}

function drawCityCanvas(canvas, state, { nearby, objective, target, reducedMotion, lowPower, profile = null, hoveredDistrictId = null, agentPresence = [], agentPresencePreferences = {}, agentOutcome = null }) {
  const width = CITY_CANVAS_SIZE.width;
  const height = CITY_CANVAS_SIZE.height;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  if (canvas.width !== Math.floor(width * dpr) || canvas.height !== Math.floor(height * dpr)) {
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
  }
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);

  const palette = cityPalette(state);
  const visualProfile = profile || getCurrentCityLiteVisualProfile();
  const effectiveLowPower = lowPower || visualProfile.quality === 'conserve';
  const ground = ctx.createLinearGradient(0, 0, width, height);
  ground.addColorStop(0, palette.groundA); ground.addColorStop(.48, palette.groundB); ground.addColorStop(1, palette.groundC);
  ctx.fillStyle = ground; ctx.fillRect(0, 0, width, height);
  const aurora = ctx.createRadialGradient(width * .48, height * .24, 18, width * .5, height * .33, width * .66);
  aurora.addColorStop(0, hexToRgba(palette.glow, .20)); aurora.addColorStop(.46, 'rgba(99,102,241,.10)'); aurora.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = aurora; ctx.fillRect(0, 0, width, height);
  drawSkylineHorizon(ctx, width, height, state, palette, visualProfile);
  drawAtmosphericDetails(ctx, width, height, state, palette, visualProfile, { reducedMotion });
  drawTerrainTiles(ctx, width, height, state, { lowPower: effectiveLowPower });
  drawCityBoundary(ctx, width, height, palette);
  // Quiet terrain texture: deterministic, visual only, no fake entities.
  for (let row = 0; row < 15; row += 1) {
    for (let column = 0; column < 24; column += 1) {
      const unit = stableUnit(`${state.citySeed}:${column}:${row}`);
      if (unit < .53) continue;
      ctx.fillStyle = `rgba(148,163,184,${.018 + unit * .025})`;
      ctx.fillRect(column * 52 + unit * 9, row * 52 + (1 - unit) * 8, 1 + unit * 2, 1 + unit * 2);
    }
  }

  drawRoad(ctx, width, height, [[.5,.95],[.5,.63],[.5,.54],[.5,.39],[.5,.07]], { reducedMotion, lowPower: effectiveLowPower });
  drawRoad(ctx, width, height, [[.05,.5],[.31,.5],[.37,.5]], { reducedMotion, lowPower: effectiveLowPower });
  drawRoad(ctx, width, height, [[.63,.5],[.93,.5]], { reducedMotion, lowPower: effectiveLowPower });
  drawRoad(ctx, width, height, [[.5,.63],[.5,.88]], { reducedMotion, lowPower: effectiveLowPower });
  drawTransitCircuit(ctx, width, height, palette, visualProfile, { reducedMotion });

  for (const collider of CITY_COLLIDERS) {
    const x = collider.x * width, y = collider.y * height, w = collider.width * width, h = collider.height * height;
    if (collider.label === 'canal') {
      const water = ctx.createLinearGradient(x, y, x + w, y + h);
      water.addColorStop(0, 'rgba(14,116,144,.72)'); water.addColorStop(.5, 'rgba(37,99,235,.55)'); water.addColorStop(1, 'rgba(15,23,42,.9)');
      drawRoundRect(ctx, x, y, w, h, 24, water, 'rgba(125,211,252,.38)');
      ctx.strokeStyle = 'rgba(186,230,253,.42)'; ctx.lineWidth = 1.4;
      for (let index = 0; index < 5; index += 1) { const yy = y + 22 + index * 25; ctx.beginPath(); ctx.moveTo(x + 12, yy); ctx.bezierCurveTo(x + w * .35, yy - 8, x + w * .67, yy + 8, x + w - 12, yy); ctx.stroke(); }
      // Two bridge decks make the canal legible rather than a dead rectangle.
      for (const factor of [.31, .69]) drawRoundRect(ctx, x - 18, y + h * factor - 10, w + 36, 20, 6, 'rgba(71,85,105,.94)', 'rgba(203,213,225,.28)');
    } else {
      drawRoundRect(ctx, x, y, w, h, 30, 'rgba(14,69,48,.4)', 'rgba(74,222,128,.24)');
      for (let index = 0; index < 18; index += 1) drawTree(ctx, x + 18 + stableUnit(`${collider.label}:${index}:x`) * Math.max(16, w - 38), y + 18 + stableUnit(`${collider.label}:${index}:y`) * Math.max(16, h - 38), `${collider.label}:${index}`, .7 + stableUnit(`${collider.label}:${index}:s`) * .35);
    }
  }

  // Street trees and lights are authored decor, not simulated residents.
  for (let index = 0; index < 16; index += 1) {
    const x = (index % 2 ? .18 + (index % 4) * .18 : .1 + (index % 4) * .2) * width;
    const y = (.36 + Math.floor(index / 4) * .16) * height;
    drawTree(ctx, x, y, `street:${index}`, .58);
  }
  for (const district of CITY_DISTRICTS) {
    const rect = { x: district.x * width, y: district.y * height, w: district.width * width, h: district.height * height };
    drawDistrictBuilding(ctx, district, rect, state, { nearby, objective, target, reducedMotion, lowPower: effectiveLowPower, hoveredDistrictId, profile: visualProfile });
    drawDistrictProps(ctx, district, rect, { reducedMotion, lowPower: effectiveLowPower, realmLandmarkStyle: state?.realmAppearance?.landmarkStyle });
    drawQuestMarker(ctx, district, rect, { objective, reducedMotion, lowPower: effectiveLowPower });
  }

  drawDistrictCallouts(ctx, width, height, objective, hoveredDistrictId, visualProfile);

  // A few authored lampposts make the road network feel hand-built, not populated.
  for (const [x, y] of [[.5, .58], [.5, .46], [.31, .5], [.69, .5], [.5, .84]]) drawLamp(ctx, x * width, y * height, palette.glow, { reducedMotion, lowPower: effectiveLowPower });

  if (target && !reducedMotion) {
    ctx.strokeStyle = 'rgba(94,234,212,.82)'; ctx.lineWidth = 2; ctx.setLineDash([5, 8]);
    ctx.beginPath(); ctx.moveTo(state.avatar.x * width, state.avatar.y * height); ctx.lineTo(target.x * width, target.y * height); ctx.stroke(); ctx.setLineDash([]);
  }
  drawAgentPresence(ctx, agentPresence, agentPresencePreferences, width, height, { reducedMotion, lowPower: effectiveLowPower });
  drawAgentOutcomeBeacon(ctx, agentOutcome, width, height, { reducedMotion, lowPower: effectiveLowPower });
  drawAvatar(ctx, state, width, height, { reducedMotion, lowPower: effectiveLowPower });
}
function renderActivity(items) {
  if (!items.length) return '<p class="eon-operator-empty">No live activity has been recorded on this device yet. This map never invents agent work. Visit a district, generate a local Market preview, or finish local AI setup to see real updates here.</p>';
  return `<ol class="eon-operator-activity-list">${items.map((item) => `<li><span class="eon-operator-activity-dot is-${escapeHtml(item.status)}" aria-hidden="true"></span><div><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(activityLabel(item.status))} · ${escapeHtml(item.detail || item.source)}</span></div>${item.route ? `<a href="${escapeHtml(item.route)}" aria-label="Open ${escapeHtml(item.title)}">Open</a>` : ''}</li>`).join('')}</ol>`;
}

function renderAgentPresence(summary, preferences) {
  if (!preferences.enabled) return '<p class="eon-operator-empty">City agent signals are hidden on this device. They never start, stop or control work.</p>';
  const outcome = getAgentPresenceOutcome(summary);
  const outcomeLink = outcome.visible
    ? ` <a href="${escapeHtml(outcome.route || '/chat')}">Review in ${escapeHtml(outcome.nativeSurface || 'Chat')}</a>`
    : '';
  if (!summary.active.length) {
    return outcome.visible
      ? `<p class="eon-operator-empty"><strong>${escapeHtml(outcome.title)}.</strong> ${escapeHtml(outcome.bubble)}${outcomeLink}</p>`
      : '<p class="eon-operator-empty">No active local work is recorded. City never invents agents, provider runs, conversations or progress.</p>';
  }
  return `<ol class="eon-operator-activity-list eon-operator-agent-list">${summary.active.map((entry) => {
    const cue = describeAgentPresence(entry, preferences);
    return `<li><span class="eon-operator-activity-dot is-${escapeHtml(cue.status)}" aria-hidden="true" style="--agent-accent:${escapeHtml(cue.accent)}"></span><div><strong>${escapeHtml(cue.title)}</strong><span>${escapeHtml(cue.bubble)} · local activity only</span></div></li>`;
  }).join('')}</ol>${outcome.visible ? `<p class="eon-operator-empty"><strong>${escapeHtml(outcome.title)}.</strong> ${escapeHtml(outcome.bubble)}${outcomeLink}</p>` : ''}`;
}

function cityDirectory(state, objective = null) {
  return CITY_DISTRICTS.map((district) => {
    const discovered = state.unlockedDistricts.includes(district.id);
    const isObjective = objective?.districtId === district.id && !objective?.complete;
    const label = isObjective ? `Current step · ${objective.step || 1}/${objective.total || 4}` : (discovered ? 'Discovered locally' : 'Walk here to discover');
    return `<li class="${discovered ? 'is-discovered' : ''} ${isObjective ? 'is-objective' : ''}"><span aria-hidden="true">${district.icon}</span><div><strong>${escapeHtml(district.name)}</strong><small>${escapeHtml(label)}</small></div><button type="button" data-city-target="${escapeHtml(district.id)}">${isObjective ? 'Route' : 'Guide'}</button></li>`;
  }).join('');
}

function render() {
  if (!root) return;
  activeRuntime?.destroy?.();
  const search = currentCitySearch();
  const returningToRealm = search.get('return') === 'realm';
  // This is per-document, not a hidden recurring counter. A City re-render must
  // not inflate a user's local Realm return history.
  if (returningToRealm && !realmReturnRecordedForDocument) {
    realmReturnRecordedForDocument = true;
    const returned = recordMyRealmReturn({ intent: 'city-return' });
    if (returned.ok) {
      appendOperatorActivity({
        source: 'realm',
        status: 'complete',
        title: 'My Realm return recorded locally',
        detail: 'The user entered their private Realm route. No public visit, attribution, reward, or server event was created.',
        route: '/eoncity?target=realm&return=realm'
      });
    }
  }
  const cityLoad = ensureCityWorldState();
  const city = cityLoad.state;
  const model = buildMapState();
  const objective = buildCityObjective(city);
  const circuitProgress = getCityObjectiveProgress(city);
  const requestedTargetId = (() => {
    const value = search.get('target');
    return CITY_DISTRICTS.some((district) => district.id === value) ? value : null;
  })();
  const focusObjective = search.get('focus') === 'objective';
  let commandReceipt = findLatestEonbotActionReceiptForRoute(currentCityRoute(), { actionType: 'city-guidance' });
  if (commandReceipt) {
    const opened = markEonbotActionReceiptDestinationOpened(commandReceipt.id);
    if (opened.ok && opened.receipt) commandReceipt = opened.receipt;
  }
  const commandReceiptCopyState = commandReceiptCopy(commandReceipt);
  const items = listOperatorActivity({ limit: 6 });
  const agentPresencePreferences = readAgentPresencePreferences();
  const agentPresence = getAgentPresenceSummary();
  const agentOutcome = getAgentPresenceOutcome(agentPresence);
  const visualPreferences = readCityLiteVisualPreferences();
  const visualProfile = getCurrentCityLiteVisualProfile(visualPreferences);
  root.innerHTML = `<section class="eon-operator-shell eon-city-rpg-shell" aria-labelledby="eon-operator-title">
    <header class="eon-hub-top eon-operator-top">
      <div><p class="eon-hub-kicker">City Overview · illustrated 2.5D work map · First Circuit · local-first</p><h1 class="eon-hub-title" id="eon-operator-title">EON City Overview</h1><p class="eon-hub-subtitle">A detailed illustrated 2.5D City overview for returning to real work. Use the transit loop, route the First Circuit, inspect original landmarks, and enter an immersive mode when you choose. This is the fast City Overview—not the Babylon experience. Nothing runs, earns, or purchases in the background. No fake crowd, value loop, purchase, or background activity is simulated. When real local AI work is recorded, an optional bounded signal can make that work legible without exposing prompts, responses, secrets or hidden tool use.</p></div>
      <div class="eon-operator-top-actions"><button type="button" class="eon-operator-secondary" data-city-save-status>Saved locally</button><a class="eon-hub-primary" href="/eoncity/play" data-open-play>Enter Immersive Work Mode</a><a class="eon-operator-secondary" href="/eoncity/tour?world=${encodeURIComponent(city.worldId)}" data-open-3d>Open Spatial Command Space</a></div>
    </header>

    <section class="eon-city-rpg-card" aria-label="EON City playable map">
      <div class="eon-city-rpg-stage">
        <div class="eon-city-canvas-wrap">
          <div class="eon-city-world-strip" aria-label="Local City status"><span>LOCAL WORLD · FIRST CIRCUIT</span><strong>${escapeHtml(city.avatar.name || 'Operator')}</strong><small><b data-city-discovered-count>${city.unlockedDistricts.length}</b> / ${CITY_DISTRICTS.length} districts</small></div>
          <div class="eon-city-quest-tracker" aria-live="polite"><span>FIRST CIRCUIT</span><strong data-city-objective-progress>${circuitProgress.completedSteps} / ${circuitProgress.total}</strong><small data-city-badge-label>${escapeHtml(circuitProgress.badgeLabel)}</small></div>
          <canvas class="eon-city-canvas" data-city-canvas width="1200" height="760" tabindex="0" role="application" aria-label="Playable EON City map. Use arrow keys or WASD to move. Press E near a building to interact."></canvas>
          <p class="eon-city-canvas-help" id="eon-city-canvas-help">Move: arrow keys or WASD · Interact: E · Tap a place to walk · City progress saves on this device.</p>
          <div class="eon-city-toast" data-city-toast role="status" aria-live="polite"></div>
        </div>
        <aside class="eon-city-sidepanel" aria-label="City objective and interactions">
          <section class="eon-city-objective"><p class="eon-city-eyebrow">Current objective · <span data-city-objective-step>${objective.step || circuitProgress.total} / ${objective.total || circuitProgress.total}</span></p><h2 data-city-objective-title>${escapeHtml(objective.title)}</h2><p data-city-objective-body>${escapeHtml(objective.body)}</p><button type="button" class="eon-operator-secondary" data-city-focus-objective ${objective.complete ? 'disabled' : ''}>Route current objective</button></section>
          ${commandReceipt ? `<section class="eon-city-command-receipt" data-city-command-receipt aria-live="polite"><p class="eon-city-eyebrow">EONBOT action receipt</p><h2 data-city-command-receipt-heading>${escapeHtml(commandReceiptCopyState.heading)}</h2><p data-city-command-receipt-body>${escapeHtml(commandReceiptCopyState.body)}</p></section>` : ''}
          ${agentPresencePreferences.enabled && agentOutcome.visible ? `<section class="eon-city-command-receipt eon-city-result-relay" data-city-result-relay aria-live="polite"><p class="eon-city-eyebrow">Local result relay</p><h2>${escapeHtml(agentOutcome.title)}</h2><p>${escapeHtml(agentOutcome.bubble)} The City carries status only; it never displays the result itself.</p><a class="eon-operator-secondary" href="/chat?new=1" data-city-review-result>Review in Chat</a></section>` : ''}
          ${returningToRealm ? '<section class="eon-city-realm-return" aria-live="polite"><p class="eon-city-eyebrow">My Realm</p><h2>Private return route</h2><p>Your return is stored only in local City state. It does not create a public visitor count, reward, record, or profile.</p></section>' : ''}
          <section class="eon-city-interaction" data-city-interaction><p class="eon-city-eyebrow">Nearby place</p><h2>Walk to a district</h2><p>Approach a building, then press E or use Interact.</p><button type="button" class="eon-operator-secondary" data-city-interact disabled>Interact</button></section>
          <section class="eon-city-controls" aria-label="Movement controls"><p class="eon-city-eyebrow">Touch controls</p><div class="eon-city-dpad"><span></span><button type="button" data-city-move="up" aria-label="Move up">▲</button><span></span><button type="button" data-city-move="left" aria-label="Move left">◀</button><button type="button" data-city-move="down" aria-label="Move down">▼</button><button type="button" data-city-move="right" aria-label="Move right">▶</button></div><button type="button" class="eon-operator-secondary" data-city-interact-touch disabled>Interact</button></section>
          <section class="eon-city-visual-detail" aria-label="City Overview visual detail"><p class="eon-city-eyebrow">Visual detail · local display only</p><div class="eon-city-visual-choice" role="group" aria-label="Choose City Overview visual detail"><button type="button" class="eon-operator-secondary ${visualPreferences.quality === 'auto' ? 'is-selected' : ''}" data-city-visual-quality="auto" aria-pressed="${visualPreferences.quality === 'auto'}">Auto</button><button type="button" class="eon-operator-secondary ${visualPreferences.quality === 'high' ? 'is-selected' : ''}" data-city-visual-quality="high" aria-pressed="${visualPreferences.quality === 'high'}">High</button><button type="button" class="eon-operator-secondary ${visualPreferences.quality === 'conserve' ? 'is-selected' : ''}" data-city-visual-quality="conserve" aria-pressed="${visualPreferences.quality === 'conserve'}">Conserve</button></div><p data-city-visual-profile>${escapeHtml(visualProfile.quality === 'conserve' ? 'Conserve detail is active to respect reduced motion, data saver, or a constrained device.' : `${visualProfile.quality === 'high' ? 'High' : 'Balanced'} illustrated detail is active on this device.`)}</p></section>
          <section class="eon-city-minimap"><p class="eon-city-eyebrow">District guide</p><ol>${cityDirectory(city, objective)}</ol></section>
        </aside>
      </div>
      <p class="eon-operator-map-caption">A richly illustrated, lightweight 2.5D City Overview: move, collide with scenery, follow the transit loop, approach a district, interact, save and return. It is a fast orientation map—not a replacement for Immersive Work Mode. The city is deliberately calm: no fake crowd, player count, loot loop, purchase, or background activity.</p>
    </section>

    <section class="eon-operator-grid">
      <article class="eon-operator-panel"><div class="eon-operator-panel-head"><div><h2>Real activity</h2><p>Only actions recorded by EONAPP on this device appear here.</p></div><a href="/automations">Automations</a></div>${renderActivity(items)}</article>
      <article class="eon-operator-panel"><div class="eon-operator-panel-head"><div><h2>Live agent layer</h2><p>Optional visual cues for recorded local work. City does not run, infer or expose an agent conversation.</p></div><button type="button" class="eon-operator-secondary" data-city-agent-visibility>${agentPresencePreferences.enabled ? 'Hide signals' : 'Show signals'}</button></div>${renderAgentPresence(agentPresence, agentPresencePreferences)}<div class="eon-operator-quick"><button type="button" class="eon-operator-secondary" data-city-agent-detail ${agentPresencePreferences.enabled ? '' : 'disabled'}>${agentPresencePreferences.detailLevel === 'provider-identity' ? 'Hide provider detail' : agentPresencePreferences.detailLevel === 'provider-category' ? 'Show selected provider' : 'Show provider category'}</button></div></article>
      <article class="eon-operator-panel"><div class="eon-operator-panel-head"><div><h2>City status</h2><p>Local state only. Vault secrets and private chats never enter the City renderer.</p></div></div><dl class="eon-operator-stats"><div><dt>City world</dt><dd>Saved on this device</dd></div><div><dt>Local AI</dt><dd>Set up from EONBOT when you choose</dd></div><div><dt>Market</dt><dd>${model.market?.items?.length ? `${model.market.items.length} saved local previews` : 'No local preview saved'}</dd></div><div><dt>Visual Tour</dt><dd>Optional shared-state view</dd></div></dl><div class="eon-operator-quick"><a href="/chat?new=1">Ask EONBOT</a><a href="/market">Create local preview</a><a href="/vault">Vault & backup</a></div></article>
    </section>
  </section>`;
  activeRuntime = createCityRuntime({ cityLoad, objective, requestedTargetId, focusObjective, commandReceipt });
}

function createCityRuntime({ cityLoad, objective, requestedTargetId = null, focusObjective = false, commandReceipt = null }) {
  const canvas = root?.querySelector('[data-city-canvas]');
  const toast = root?.querySelector('[data-city-toast]');
  const interaction = root?.querySelector('[data-city-interaction]');
  const objectiveTitle = root?.querySelector('[data-city-objective-title]');
  const objectiveBody = root?.querySelector('[data-city-objective-body]');
  const saveStatus = root?.querySelector('[data-city-save-status]');
  const minimapList = root?.querySelector('.eon-city-minimap ol');
  const discoveredCount = root?.querySelector('[data-city-discovered-count]');
  const objectiveProgress = root?.querySelector('[data-city-objective-progress]');
  const objectiveStep = root?.querySelector('[data-city-objective-step]');
  const badgeLabel = root?.querySelector('[data-city-badge-label]');
  const commandReceiptHeading = root?.querySelector('[data-city-command-receipt-heading]');
  const commandReceiptBody = root?.querySelector('[data-city-command-receipt-body]');
  const visualProfileStatus = root?.querySelector('[data-city-visual-profile]');
  if (!canvas || !interaction || !toast || !objectiveTitle || !objectiveBody) return { destroy() {} };

  let state = cityLoad.state;
  let activeCommandReceipt = commandReceipt;
  let currentObjective = objective;
  let preparedAction = null;
  let preparedMission = null;
  let nearby = getNearbyCityDistrict(state.avatar);
  let target = null;
  let raf = 0;
  let lastSaveAt = 0;
  let lastGamepadAt = 0;
  let toastTimer = 0;
  const reducedMotion = isReducedMotion();
  const lowPower = isLowPower();
  let visualPreferences = readCityLiteVisualPreferences();
  let visualProfile = getCurrentCityLiteVisualProfile(visualPreferences);
  let hoveredDistrictId = null;
  const cleanup = [];

  const announce = (message) => {
    toast.textContent = message;
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => { toast.textContent = ''; }, 3400);
  };

  const updateCommandReceipt = () => {
    if (!activeCommandReceipt || !commandReceiptHeading || !commandReceiptBody) return;
    const copy = commandReceiptCopy(activeCommandReceipt);
    commandReceiptHeading.textContent = copy.heading;
    commandReceiptBody.textContent = copy.body;
  };

  const updateSidepanel = () => {
    nearby = getNearbyCityDistrict(state.avatar);
    currentObjective = buildCityObjective(state);
    const progress = getCityObjectiveProgress(state);
    objectiveTitle.textContent = currentObjective.title;
    objectiveBody.textContent = currentObjective.body;
    if (objectiveProgress) objectiveProgress.textContent = `${progress.completedSteps} / ${progress.total}`;
    if (objectiveStep) objectiveStep.textContent = `${currentObjective.step || progress.total} / ${currentObjective.total || progress.total}`;
    if (badgeLabel) badgeLabel.textContent = currentObjective.badgeLabel || progress.badgeLabel;
    const preparedDistrict = preparedAction ? CITY_DISTRICTS.find((district) => district.landmarkId === preparedAction.landmarkId) : null;
    const mission = preparedMission?.ok ? preparedMission.receipt : null;
    const action = preparedAction && preparedDistrict
      ? `<p class="eon-city-eyebrow">Destination review</p><h2>Open ${escapeHtml(preparedAction.destinationLabel)}?</h2><p>${escapeHtml(preparedAction.purpose)} City Lite prepared only this finite internal route${mission ? ' and an opaque local beginner-mission receipt' : ''}. Review it, then confirm yourself. No hidden task, reward, provider call, Vault action, or background process will run.</p>${mission ? `<p class="eon-city-route-note">Mission offered: <strong>${escapeHtml(mission.missionLabel)}</strong>. The destination asks you to choose the real outcome.</p>` : ''}<div class="eon-city-action-review"><a class="eon-hub-primary" href="${escapeHtml(preparedMission?.href || preparedAction.route)}" data-city-confirm-open="${escapeHtml(preparedAction.id)}"${mission ? ` data-city-mission-id="${escapeHtml(mission.id)}"` : ''}>Confirm and open ${escapeHtml(preparedAction.destinationLabel)}</a><button type="button" class="eon-operator-secondary" data-city-cancel-open${mission ? ` data-city-mission-id="${escapeHtml(mission.id)}"` : ''}>Stay in City Lite</button></div>`
      : nearby && nearby.actionable
        ? `<p class="eon-city-eyebrow">Nearby place</p><h2>${escapeHtml(nearby.name)}</h2><p>${escapeHtml(nearby.description)}</p><button type="button" class="eon-hub-primary" data-city-prepare-open="${escapeHtml(nearby.id)}">Review ${escapeHtml(nearby.shortName)} route</button>`
        : nearby
          ? `<p class="eon-city-eyebrow">Nearby place</p><h2>${escapeHtml(nearby.name)}</h2><p>${escapeHtml(nearby.description)} This marker intentionally has no City route in the current product.</p>`
          : '<p class="eon-city-eyebrow">Nearby place</p><h2>Walk to a district</h2><p>Approach a building, then press E or use Interact.</p>';
    interaction.innerHTML = `${action}<button type="button" class="eon-operator-secondary" data-city-interact ${nearby && !preparedAction ? '' : 'disabled'}>Interact</button>`;
    for (const button of root.querySelectorAll('[data-city-interact-touch]')) button.disabled = !nearby;
    if (minimapList) minimapList.innerHTML = cityDirectory(state, currentObjective);
    if (discoveredCount) discoveredCount.textContent = String(state.unlockedDistricts.length);
    updateCommandReceipt();
  };

  const redraw = () => {
    const agentPresencePreferences = readAgentPresencePreferences();
    const latestPresence = getAgentPresenceSummary();
    drawCityCanvas(canvas, state, { nearby, objective: currentObjective, target, reducedMotion, lowPower, profile: visualProfile, hoveredDistrictId, agentPresence: agentPresencePreferences.enabled ? latestPresence.active : [], agentPresencePreferences, agentOutcome: agentPresencePreferences.enabled ? getAgentPresenceOutcome(latestPresence) : null });
  };

  const updateVisualDetailUi = () => {
    const effective = visualProfile.quality === 'high' ? 'High' : visualProfile.quality === 'conserve' ? 'Conserve' : 'Balanced';
    if (visualProfileStatus) {
      visualProfileStatus.textContent = visualProfile.quality === 'conserve'
        ? 'Conserve detail is active to respect reduced motion, data saver, or a constrained device.'
        : `${effective} illustrated detail is active on this device.`;
    }
    root.querySelectorAll('[data-city-visual-quality]').forEach((button) => {
      const selected = button.dataset.cityVisualQuality === visualPreferences.quality;
      button.classList.toggle('is-selected', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
  };

  const setVisualDetail = (quality) => {
    visualPreferences = saveCityLiteVisualPreferences({ quality });
    visualProfile = getCurrentCityLiteVisualProfile(visualPreferences);
    updateVisualDetailUi();
    redraw();
    announce(`City Overview visual detail set to ${visualPreferences.quality}. This changes only this device's display.`);
  };

  const persistPosition = (force = false) => {
    const now = Date.now();
    if (!force && now - lastSaveAt < SAVE_INTERVAL_MS) return;
    const saved = moveCityAvatar(state.avatar, { now });
    state = saved.state;
    lastSaveAt = now;
    saveStatus.textContent = saved.ok ? 'Saved locally' : 'Local save unavailable';
  };

  const applyMovement = (delta, { source = 'input', persist = true } = {}) => {
    const nextPosition = resolveCityMovement(state.avatar, delta);
    const moved = nextPosition.x !== state.avatar.x || nextPosition.y !== state.avatar.y;
    if (!moved) {
      if (source !== 'target') announce('A City feature blocks this path. Try the road around it.');
      return false;
    }
    state = {
      ...state,
      avatar: {
        ...state.avatar,
        ...nextPosition,
        direction: cityDirectionFromDelta(delta)
      }
    };
    if (persist) persistPosition();
    updateSidepanel();
    redraw();
    return true;
  };

  const setTarget = (nextTarget) => {
    const point = {
      x: Math.min(0.965, Math.max(0.035, Number(nextTarget.x) || state.avatar.x)),
      y: Math.min(0.94, Math.max(0.06, Number(nextTarget.y) || state.avatar.y))
    };
    target = {
      ...point,
      districtId: nextTarget.districtId || getCityDistrictAt(point)?.id || null,
      waypoints: findCityWalkPath(state.avatar, point),
      waypointIndex: 0
    };
    redraw();
  };

  function interact() {
    nearby = getNearbyCityDistrict(state.avatar);
    if (!nearby) {
      announce('Move closer to a district before interacting.');
      return;
    }
    const beforeObjective = buildCityObjective(state);
    const saved = recordCityDistrictVisit(nearby.id);
    state = saved.state;
    target = null;
    const afterObjective = buildCityObjective(state);
    const advanced = beforeObjective.id !== afterObjective.id || afterObjective.complete;
    const confirmsPreparedRoute = receiptMatchesCityInteraction(activeCommandReceipt, nearby, beforeObjective);
    if (confirmsPreparedRoute && activeCommandReceipt?.status !== 'user-confirmed') {
      const confirmed = markEonbotActionReceiptUserConfirmed(activeCommandReceipt.id);
      if (confirmed.ok && confirmed.receipt) {
        activeCommandReceipt = confirmed.receipt;
        appendOperatorActivity({
          source: 'eonbot',
          status: 'complete',
          title: `EONBOT route confirmed · ${nearby.name}`,
          detail: 'The person reached and interacted with the prepared City destination. This is local UI confirmation only; no external task, reward, or account action occurred.',
          route: currentCityRoute()
        });
      }
    }
    appendOperatorActivity({
      source: 'city',
      status: 'complete',
      title: advanced ? `First Circuit · ${nearby.name}` : `${nearby.name} discovered`,
      detail: advanced
        ? (afterObjective.complete ? 'The local First Circuit orientation loop was completed. No value or reward was created.' : `Local City progress advanced. Next: ${afterObjective.title}.`)
        : 'A City district was visited locally. No background activity or value was created.',
      route: nearby.route
    });
    if (confirmsPreparedRoute && activeCommandReceipt?.status === 'user-confirmed') announce(`EONBOT route confirmed locally at ${nearby.name}. No reward, server event, or background action was created.`);
    else if (afterObjective.complete && advanced) announce('First Circuit complete. Your local City now remembers the route; no reward or value was created.');
    else if (advanced) announce(`${nearby.name} marked. Next: ${afterObjective.title}.`);
    else announce(`${nearby.name} discovered. Its full EONAPP page is ready when you are.`);
    updateSidepanel();
    redraw();
  }

  const moveFromInput = (direction) => {
    const deltas = {
      up: { x: 0, y: -MOVE_STEP },
      down: { x: 0, y: MOVE_STEP },
      left: { x: -MOVE_STEP, y: 0 },
      right: { x: MOVE_STEP, y: 0 }
    };
    target = null;
    applyMovement(deltas[direction] || {}, { source: 'input' });
  };

  const onKeyDown = (event) => {
    const tagName = String(event.target?.tagName || '').toLowerCase();
    if (['input', 'textarea', 'select'].includes(tagName)) return;
    const key = String(event.key || '').toLowerCase();
    const directions = { arrowup: 'up', w: 'up', arrowdown: 'down', s: 'down', arrowleft: 'left', a: 'left', arrowright: 'right', d: 'right' };
    if (directions[key]) {
      event.preventDefault();
      moveFromInput(directions[key]);
      return;
    }
    if (key === 'e' || key === 'enter' || key === ' ') {
      if (document.activeElement === canvas || canvas.contains(document.activeElement)) {
        event.preventDefault();
        interact();
      }
    }
  };

  const onPointerMove = (event) => {
    const point = cityPointFromCanvasEvent(event, canvas);
    const nextHovered = getCityDistrictAt(point)?.id || null;
    if (nextHovered === hoveredDistrictId) return;
    hoveredDistrictId = nextHovered;
    canvas.style.cursor = hoveredDistrictId ? 'pointer' : 'crosshair';
    redraw();
  };

  const onPointerLeave = () => {
    if (!hoveredDistrictId) return;
    hoveredDistrictId = null;
    canvas.style.cursor = 'crosshair';
    redraw();
  };

  const onPointer = (event) => {
    const point = cityPointFromCanvasEvent(event, canvas);
    const district = getCityDistrictAt(point);
    setTarget({ ...point, districtId: district?.id || null });
    canvas.focus({ preventScroll: true });
    announce(district ? `Walking toward ${district.name}.` : 'Walking to the selected point.');
  };

  const tick = (now) => {
    if (target) {
      const waypoint = target.waypoints?.[target.waypointIndex] || target;
      const dx = waypoint.x - state.avatar.x;
      const dy = waypoint.y - state.avatar.y;
      const distance = Math.hypot(dx, dy);
      if (distance < TARGET_STEP * 1.3) {
        target.waypointIndex = (target.waypointIndex || 0) + 1;
        if (!target.waypoints?.[target.waypointIndex]) {
          target = null;
          persistPosition(true);
          updateSidepanel();
        }
      } else {
        applyMovement({ x: (dx / distance) * TARGET_STEP, y: (dy / distance) * TARGET_STEP }, { source: 'target', persist: true });
      }
    }
    if (now - lastGamepadAt > 110) {
      lastGamepadAt = now;
      try {
        const pad = [...(navigator.getGamepads?.() || [])].find(Boolean);
        if (pad) {
          const x = Math.abs(pad.axes?.[0] || 0) > 0.32 ? pad.axes[0] : 0;
          const y = Math.abs(pad.axes?.[1] || 0) > 0.32 ? pad.axes[1] : 0;
          if (x || y) {
            target = null;
            applyMovement({ x: x * MOVE_STEP, y: y * MOVE_STEP }, { source: 'gamepad', persist: true });
          }
          if (pad.buttons?.[0]?.pressed) interact();
        }
      } catch {}
    }
    if (!reducedMotion || target) redraw();
    raf = window.requestAnimationFrame(tick);
  };

  const onRootClick = (event) => {
    const targetElement = event.target && typeof event.target.closest === 'function' ? event.target : null;
    const element = targetElement ? targetElement.closest('[data-city-move], [data-city-interact], [data-city-interact-touch], [data-city-target], [data-city-focus-objective], [data-city-save-status], [data-open-play], [data-open-3d], [data-city-prepare-open], [data-city-cancel-open], [data-city-confirm-open], [data-city-agent-visibility], [data-city-agent-detail], [data-city-review-result], [data-city-visual-quality]') : null;
    if (!element) return;
    if (element.matches('[data-city-move]')) {
      moveFromInput(element.dataset.cityMove);
      return;
    }
    if (element.matches('[data-city-interact], [data-city-interact-touch]')) {
      interact();
      return;
    }
    if (element.matches('[data-city-target]')) {
      const district = getCityDistrictById(element.dataset.cityTarget);
      if (!district) return;
      setTarget({ x: district.x + district.width / 2, y: district.y + district.height / 2, districtId: district.id });
      canvas.focus({ preventScroll: true });
      announce(`Guiding you to ${district.name}.`);
      return;
    }
    if (element.matches('[data-city-focus-objective]')) {
      const district = currentObjective.districtId ? getCityDistrictById(currentObjective.districtId) : null;
      if (!district) return;
      setTarget({ x: district.x + district.width / 2, y: district.y + district.height / 2, districtId: district.id });
      canvas.focus({ preventScroll: true });
      announce(`Routing the First Circuit to ${district.name}.`);
      return;
    }
    if (element.matches('[data-city-visual-quality]')) {
      setVisualDetail(element.dataset.cityVisualQuality);
      return;
    }
    if (element.matches('[data-city-agent-visibility]')) {
      const preferences = readAgentPresencePreferences();
      saveAgentPresencePreferences({ ...preferences, enabled: !preferences.enabled });
      render();
      return;
    }
    if (element.matches('[data-city-agent-detail]')) {
      const preferences = readAgentPresencePreferences();
      if (!preferences.enabled) return;
      saveAgentPresencePreferences({ ...preferences, detailLevel: preferences.detailLevel === 'summary' ? 'provider-category' : preferences.detailLevel === 'provider-category' ? 'provider-identity' : 'summary' });
      render();
      return;
    }
    if (element.matches('[data-city-review-result]')) {
      appendOperatorActivity({ source: 'city', status: 'info', title: 'City result review chosen', detail: 'The user chose the native Chat route to review a status-only local result relay. City did not expose or move any result content.', route: '/chat?new=1' });
      return;
    }
    if (element.matches('[data-city-save-status]')) {
      persistPosition(true);
      announce('CityWorldState is saved locally. It contains no Vault secret or private chat content.');
      return;
    }
    if (element.matches('[data-open-play]')) {
      appendOperatorActivity({ source: 'city', status: 'info', title: 'City Play chosen', detail: 'The user chose the isolated Babylon proof route. It starts only after a second explicit Play tap and does not run in the background.', route: '/eoncity/play' });
      return;
    }
    if (element.matches('[data-open-3d]')) {
      appendOperatorActivity({ source: 'city', status: 'info', title: 'Spatial Command Space opened', detail: 'The user chose the optional Spatial Command Space from City Overview. No background simulation was started.', route: '/eoncity/tour' });
      return;
    }
    if (element.matches('[data-city-prepare-open]')) {
      const district = getCityDistrictById(element.dataset.cityPrepareOpen);
      if (!district) return;
      event.preventDefault();
      const prepared = prepareCityAction(district.landmarkId, { source: 'city-lite' });
      if (!prepared.ok || !prepared.action) {
        announce(`${district.name} does not expose a City route in the current product.`);
        return;
      }
      preparedAction = prepared.action;
      preparedMission = offerCityBeginnerMission(prepared.action);
      updateSidepanel();
      announce(`${prepared.action.destinationLabel} is ready for your review. Nothing has opened yet.`);
      return;
    }
    if (element.matches('[data-city-cancel-open]')) {
      event.preventDefault();
      if (preparedMission?.ok && preparedMission.receipt?.id) dismissCityBeginnerMission(preparedMission.receipt.id);
      preparedAction = null;
      preparedMission = null;
      updateSidepanel();
      announce('Stayed in EON City Overview.');
      return;
    }
    if (element.matches('[data-city-confirm-open]')) {
      const confirmed = confirmPreparedCityAction(element.dataset.cityConfirmOpen);
      const district = confirmed.action ? CITY_DISTRICTS.find((item) => item.landmarkId === confirmed.action.landmarkId) : null;
      if (!confirmed.ok || !district || !preparedAction || preparedAction.id !== confirmed.action.id) {
        event.preventDefault();
        preparedAction = null;
        preparedMission = null;
        updateSidepanel();
        announce('Please prepare and review a fresh City destination before opening it.');
        return;
      }
      if (preparedMission?.ok && preparedMission.receipt?.id) {
        const opened = openCityBeginnerMission(preparedMission.receipt.id);
        if (!opened.ok) {
          event.preventDefault();
          preparedAction = null;
          preparedMission = null;
          updateSidepanel();
          announce('That local mission receipt is no longer available. Prepare a fresh City destination.');
          return;
        }
      }
      appendOperatorActivity({ source: 'city', status: 'complete', title: `${district.name} confirmed`, detail: 'The user reviewed and confirmed the shared City route contract from City Lite.', route: preparedMission?.ok ? preparedMission.href : confirmed.href });
    }
  };
  const onStorage = (event) => {
    if (event.key === CITY_WORLD_STATE_KEY || event.key === EONBOT_ACTION_RECEIPTS_KEY) render();
  };
  canvas.addEventListener('pointerdown', onPointer);
  canvas.addEventListener('pointermove', onPointerMove, { passive: true });
  canvas.addEventListener('pointerleave', onPointerLeave, { passive: true });
  cleanup.push(() => canvas.removeEventListener('pointerdown', onPointer));
  cleanup.push(() => canvas.removeEventListener('pointermove', onPointerMove));
  cleanup.push(() => canvas.removeEventListener('pointerleave', onPointerLeave));
  root.addEventListener('click', onRootClick);
  cleanup.push(() => root.removeEventListener('click', onRootClick));
  window.addEventListener('keydown', onKeyDown);
  cleanup.push(() => window.removeEventListener('keydown', onKeyDown));
  window.addEventListener('storage', onStorage);
  cleanup.push(() => window.removeEventListener('storage', onStorage));

  updateSidepanel();
  updateVisualDetailUi();
  if (requestedTargetId) {
    const district = getCityDistrictById(requestedTargetId);
    if (district) {
      setTarget({ x: district.x + district.width / 2, y: district.y + district.height / 2, districtId: district.id });
      announce(`EONBOT prepared a route to ${district.name}. Tap or use movement controls to adjust it.`);
    }
  } else if (focusObjective && currentObjective.districtId) {
    const district = getCityDistrictById(currentObjective.districtId);
    if (district) {
      setTarget({ x: district.x + district.width / 2, y: district.y + district.height / 2, districtId: district.id });
      announce(`EONBOT prepared the First Circuit route to ${district.name}.`);
    }
  }
  redraw();
  raf = window.requestAnimationFrame(tick);
  if (cityLoad.migrated) announce('Your previous City preference was copied into the new local CityWorldState. The original record was retained.');
  if (cityLoad.backupKey) announce('A malformed City record was backed up locally before a fresh state was created.');

  return {
    destroy() {
      window.cancelAnimationFrame(raf);
      cleanup.forEach((fn) => { try { fn(); } catch {} });
    }
  };
}

function init() {
  enterCityMode('overview', { entry: 'overview' });
  disposeCityModeTracking();
  disposeCityModeTracking = bindCityModeLinkTracking(root, 'overview', { entry: 'overview' });
  render();
  try { window.addEventListener('eon:operator-activity', render); } catch {}
  try { window.addEventListener('eon:agent-presence', render); } catch {}
  try { window.addEventListener('eon:agent-presence-preferences', render); } catch {}
  window.addEventListener('storage', (event) => {
    if (event.key === 'eon:operator:activity:v1' || event.key === 'eon:agent:presence:v1' || event.key === 'eon:agent:presence-preferences:v1' || event.key === 'eon:automation-os:v3' || event.key === 'eon:market:private-drop:v3' || event.key === 'eon:market:private-drop:v2' || event.key === EONBOT_ACTION_RECEIPTS_KEY) render();
  });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
else init();
globalThis.addEventListener?.('pagehide', () => disposeCityModeTracking(), { once: true });
