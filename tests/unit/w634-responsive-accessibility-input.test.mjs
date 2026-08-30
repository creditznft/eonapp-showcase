import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { getEonResponsiveInputSnapshot, EON_DISPLAY_MODES, EON_INPUT_MODES, EON_LAYOUT_PROFILES } from '../../assets/js/utils/responsive-accessibility-input.js';
import { getW634PublicFiles, validateW634ResponsiveAccessibilityInputContract, W634_ROUTE_LAYOUT_OWNERS } from '../../config/w634-responsive-accessibility-input-contract.mjs';
import { inspectW634ResponsiveAccessibilityInput } from '../../scripts/w634-responsive-accessibility-input-gate.mjs';

const read = (relative) => fs.readFileSync(new URL(`../../${relative}`, import.meta.url), 'utf8');
const environment = ({ width, height, active = [] }) => ({
  innerWidth: width,
  innerHeight: height,
  navigator: { standalone: active.includes('(display-mode: standalone)') },
  matchMedia: (query) => ({ matches: active.includes(query) })
});

test('W634 defines bounded layout, display and input vocabularies', () => {
  assert.deepEqual(EON_LAYOUT_PROFILES, ['compact', 'standard', 'wide']);
  assert.deepEqual(EON_DISPLAY_MODES, ['browser', 'standalone']);
  assert.deepEqual(EON_INPUT_MODES, ['keyboard', 'pointer', 'touch', 'controller', 'voice', 'unknown']);
});

test('W634 derives responsive state without claiming physical certification', () => {
  const phone = getEonResponsiveInputSnapshot(environment({ width: 390, height: 844, active: ['(pointer: coarse)', '(hover: none)'] }));
  assert.equal(phone.layout, 'compact');
  assert.equal(phone.orientation, 'portrait');
  assert.equal(phone.coarsePointer, true);
  assert.equal(phone.physicalDeviceCertified, false);
  const pwa = getEonResponsiveInputSnapshot(environment({ width: 430, height: 932, active: ['(display-mode: standalone)'] }));
  assert.equal(pwa.displayMode, 'standalone');
  const landscape = getEonResponsiveInputSnapshot(environment({ width: 844, height: 390 }));
  assert.equal(landscape.shortLandscape, true);
});

test('W634 assigns every current public document to exactly one responsive owner', () => {
  const publicFiles = getW634PublicFiles();
  const owned = Object.values(W634_ROUTE_LAYOUT_OWNERS).flat();
  assert.equal(publicFiles.length, 49);
  assert.ok(publicFiles.includes('help.html'));
  assert.ok(!publicFiles.includes('support.html'));
  assert.deepEqual([...owned].sort(), [...publicFiles].sort());
  assert.equal(new Set(owned).size, owned.length);
});

test('W634 keeps its capability bridge permissionless and local', () => {
  const source = read('assets/js/utils/responsive-accessibility-input.js');
  assert.doesNotMatch(source, /\bfetch\s*\(|XMLHttpRequest|WebSocket|EventSource|mediaDevices|getUserMedia|getDisplayMedia|requestFullscreen|orientation\.lock|new\s+Audio|AudioContext|getGamepads\s*\(/);
  assert.match(source, /networkRequestCreated:\s*false/);
  assert.match(source, /mediaPermissionRequested:\s*false/);
  assert.match(source, /orientationLocked:\s*false/);
  assert.match(source, /fullscreenRequested:\s*false/);
  assert.match(source, /controllerPolled:\s*false/);
});

test('W634 repairs static landmarks, duplicate ids, focus, targets and reduced motion', () => {
  const report = inspectW634ResponsiveAccessibilityInput({ writeArtifact: false });
  assert.equal(report.ok, true);
  assert.equal(report.documentIssues.length, 0);
  assert.equal(report.publicFileCount, 49);
  const base = read('assets/css/base.css');
  assert.match(base, /min-height:\s*44px/);
  assert.match(base, /forced-colors:\s*active/);
  assert.match(base, /prefers-reduced-motion:\s*reduce/);
  assert.match(read('trade.html'), /id="mi-thesis-heading"/);
  assert.equal((read('trade.html').match(/id="mi-thesis-title"/g) || []).length, 1);
});

test('W634 contract remains explicit about real-device evidence', () => {
  const validation = validateW634ResponsiveAccessibilityInputContract();
  assert.equal(validation.ok, true);
  assert.equal(validation.physicalEvidenceCertified, false);
  assert.ok(validation.total >= 14);
  const gate = inspectW634ResponsiveAccessibilityInput({ writeArtifact: false });
  assert.match(gate.limitations.join(' '), /Physical device/i);
});
