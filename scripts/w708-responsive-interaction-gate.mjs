#!/usr/bin/env node
import fs from 'node:fs';
import {
  getEonNexusW708ResponsiveInteractionTruth,
  interpretEonNexusW708KeyboardInput,
  resolveEonNexusW708CapturePolicy,
  resolveEonNexusW708ResponsiveLayout
} from '../assets/js/nexus/w708/eon-nexus-w708-responsive-interaction.js';

const live = fs.readFileSync(new URL('../assets/js/nexus/eon-nexus-live.js', import.meta.url), 'utf8');
const sourceCss = fs.readFileSync(new URL('../assets/css/eon-nexus-live.css', import.meta.url), 'utf8');
const publicCss = fs.readFileSync(new URL('../public/assets/css/eon-nexus-live.css', import.meta.url), 'utf8');
const truth = getEonNexusW708ResponsiveInteractionTruth();
const layouts = [
  resolveEonNexusW708ResponsiveLayout({ width: 390, height: 844 }),
  resolveEonNexusW708ResponsiveLayout({ width: 820, height: 900 }),
  resolveEonNexusW708ResponsiveLayout({ width: 1440, height: 900 }),
  resolveEonNexusW708ResponsiveLayout({ width: 1440, height: 900, embeddedInWorld: true })
];
const checks = [
  ['four-responsive-modes', layouts.map((entry) => entry.mode).join(',') === 'compact,full,split,in-world'],
  ['three-primary-actions', layouts.every((entry) => entry.primaryActionLimit === 3 && entry.advancedActionsPlacement === 'contextual-more')],
  ['minimum-targets', layouts.every((entry) => entry.minimumTargetPx >= 48) && /--eon-nexus-min-target: 48px/.test(sourceCss) && /--eon-nexus-min-target: 48px/.test(publicCss)],
  ['input-parity', interpretEonNexusW708KeyboardInput({ key: 'ArrowRight' }).action === 'rotate' && interpretEonNexusW708KeyboardInput({ key: 'z', ctrlKey: true }).action === 'undo' && !interpretEonNexusW708KeyboardInput({ key: 'z', ctrlKey: true }, { editable: true }).ok],
  ['explicit-capture-only', !resolveEonNexusW708CapturePolicy({ kind: 'voice', available: true }).ok && resolveEonNexusW708CapturePolicy({ kind: 'camera', explicitUserAction: true, available: true, localOnly: true }).ok],
  ['live-integration', /resolveEonNexusW708ResponsiveLayout/.test(live) && /interpretEonNexusW708KeyboardInput/.test(live) && /resolveEonNexusW708CapturePolicy/.test(live) && /getResponsiveLayout/.test(live)],
  ['truth-boundaries', truth.deviceAutoFit && truth.mouseKeyboardTouchParity && !truth.captureStartsAutomatically && !truth.automaticNavigation && !truth.startsAiWork && !truth.secondStateStore]
];
for (const [id, pass] of checks) console.log(`[W708] ${pass ? 'PASS' : 'FAIL'} ${id}`);
const ok = checks.every(([, pass]) => pass);
console.log(`[W708] ${ok ? 'PASS' : 'FAIL'} ${checks.filter(([, pass]) => pass).length}/${checks.length}`);
if (!ok) process.exitCode = 1;
