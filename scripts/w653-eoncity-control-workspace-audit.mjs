#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { getEonCityCommandRoomModel, getEonCityCommandRoomScreenReview, renderEonCityCommandRoomMarkup, validateEonCityCommandRoomModel } from '../assets/js/city/eon-city-command-room.js';
import { buildEonCityAgentTheaterStage, renderEonCityAgentTheaterStage } from '../assets/js/city/eon-city-agent-theater.js';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const ROUTE_OUTPUTS = new Map([['/insights','trade.html']]);
const routeFile = (route) => route === '/' ? 'index.html' : (ROUTE_OUTPUTS.get(route) || `${route.replace(/^\//, '')}.html`);

export function inspectW653ControlWorkspace() {
  const model = getEonCityCommandRoomModel({ agentTheaterStage: renderEonCityAgentTheaterStage(buildEonCityAgentTheaterStage()) });
  const validation = validateEonCityCommandRoomModel(model);
  const markup = renderEonCityCommandRoomMarkup(model);
  const station = read('assets/js/eon-city-play-station.js');
  const css = read('assets/css/eon-city-play.css');
  const criteria = [];
  const check = (id, weight, condition, evidence) => criteria.push(Object.freeze({ id, weight, passed: Boolean(condition), evidence }));
  const primary = model.screens.filter((screen) => screen.tier === 'primary');
  const systems = model.screens.filter((screen) => screen.tier === 'systems');
  const native = model.screens.filter((screen) => screen.action === 'open-route');

  check('model-valid', 8, validation.ok, validation.errors);
  check('clear-hierarchy', 10, primary.length === 7 && systems.length === 4, `${primary.length} primary / ${systems.length} systems`);
  check('core-work-coverage', 12, ['eonbot','projects','create','forge','library','research','automations'].every((id) => primary.some((screen) => screen.id === id)), primary.map((screen) => screen.id));
  check('private-system-coverage', 6, ['workspace','local-ai','vault','realm-studio'].every((id) => systems.some((screen) => screen.id === id)), systems.map((screen) => screen.id));
  check('native-routes-exist', 10, native.every((screen) => fs.existsSync(path.join(root, routeFile(screen.route)))), native.map((screen) => `${screen.route}:${routeFile(screen.route)}`));
  check('eonbot-stays-in-city', 8, model.screens.find((screen) => screen.id === 'eonbot')?.action === 'eonbot-panel' && /data-eon-play-open-eonbot/.test(station), 'in-City EONBOT panel');
  check('eonbot-review-first', 6, /data-eon-command-room-local-confirm/.test(station) && getEonCityCommandRoomScreenReview('eonbot')?.review?.confirmationRequired === true, 'EONBOT selection requires an explicit second click');
  check('review-first-routing', 12, model.routeConfirmationRequired === true && /getEonCityCommandRoomScreenReview/.test(station) && /data-eon-command-room-confirm-route/.test(station), 'second visible click');
  check('no-screen-direct-links', 6, !/<a[^>]+data-eon-command-room-screen/.test(markup) && !/<a[^>]+data-eon-command-room-agent-lane-route/.test(markup) && /<button[^>]+data-eon-command-room-screen/.test(markup) && /data-eon-command-room-agent-lane-review/.test(markup), 'screen and Agent Theater destinations are review buttons');
  check('no-imperative-navigation', 5, model.autoNavigation === false && !/window\.location\.assign\(route\)/.test(station), 'no first-click navigation');
  check('work-world-balance', 5, /Enter 3D Explore/.test(markup) && /Start or continue work/.test(markup), 'work default + optional explore');
  check('interactive-discovery', 5, model.interactionHighlightAvailable === true && /Show interactives/.test(markup) && /eon-command-room-highlight-mode/.test(css), 'highlight mode');
  check('truthful-dashboard', 5, model.dashboardSignals.length >= 5 && model.dormantAgents.every((agent) => /dormant|local|server-proof|ready-on-request/.test(agent.state)), 'proof-bound status');
  check('safety-boundaries', 5, [model.readsPrivateWork, model.startsProvider, model.startsAutomation, model.opensCheckout, model.grantsReward, model.fakeAgentActivity, model.remoteTelemetry].every((value) => value === false), 'no hidden work/commercial action');
  check('responsive-control-surface', 4, /eon-command-room-system-grid/.test(css) && /max-width: 640px/.test(css), 'desktop/mobile hierarchy');
  check('restart-safe-shortcuts', 4, /const onKeydown = \(event\) =>/.test(station) && /root\.addEventListener\('keydown', onKeydown\)/.test(station) && /root\.removeEventListener\('keydown', onKeydown\)/.test(station) && /lifecycle\.own\('w653-command-room', unbindCommandRoom\)/.test(station), 'one lifecycle-owned keyboard listener');
  check('review-receipt', 4, /No City content, provider output, entitlement, reward, or hidden action was transferred/.test(station), 'operator receipt text');

  const earned = criteria.reduce((sum, item) => sum + (item.passed ? item.weight : 0), 0);
  const possible = criteria.reduce((sum, item) => sum + item.weight, 0);
  const localScore = Math.round((earned / possible) * 1000) / 10;
  const failures = criteria.filter((item) => !item.passed).map((item) => item.id);
  return Object.freeze({
    schema: 'eonapp.w653.control-workspace-audit.v1', ok: failures.length === 0, generatedAt: new Date().toISOString(),
    localCriteriaScore: localScore, executivePrevisualScore: failures.length ? Math.min(94, localScore) : 96,
    visualScoreReserved: 4,
    decision: 'Command Room is the default operating cockpit; 3D Explore, Share and District Map are hero actions rather than competing work screens.',
    screenCounts: Object.freeze({ total: model.screens.length, primary: primary.length, systems: systems.length, nativeRoutes: native.length }),
    criteria: Object.freeze(criteria), failures: Object.freeze(failures)
  });
}

const report = inspectW653ControlWorkspace();
const output = path.join(root, 'reports', 'w653', 'W653_CONTROL_WORKSPACE_AUDIT_2026-07-14.json');
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
if (!report.ok) { console.error(JSON.stringify(report, null, 2)); process.exit(1); }
console.log(JSON.stringify({ ok: true, report: path.relative(root, output), localCriteriaScore: report.localCriteriaScore, executivePrevisualScore: report.executivePrevisualScore, screenCounts: report.screenCounts }, null, 2));
