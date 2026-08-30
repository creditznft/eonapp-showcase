#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = path.join(root, 'assets/js/city/eon-city-play-core.js');
const write = process.argv.includes('--write');

const oldImport = "import { resolveEonCityThirdPersonPosition } from './eon-city-third-person-controller.js';\n";
const newImport = `${oldImport}import { resolveEonCityCameraRelativeMovement, resolveEonCityWorldTargetMovement } from './eon-city-camera-relative-movement.js';\n`;

const oldInputBlock = `  const held = new Map([['KeyW', 'forward'], ['ArrowUp', 'forward'], ['KeyS', 'backward'], ['ArrowDown', 'backward'], ['KeyA', 'left'], ['ArrowLeft', 'left'], ['KeyD', 'right'], ['ArrowRight', 'right']]);
  const setMove = (direction, active) => { if (active) { movement.add(direction); guidedDestination = null; } else movement.delete(direction); };
  const onKeyDown = (event) => { const direction = held.get(event.code); if (direction) { event.preventDefault(); setMove(direction, true); } };
  const onKeyUp = (event) => { const direction = held.get(event.code); if (direction) { event.preventDefault(); setMove(direction, false); } };
  globalThis.addEventListener?.('keydown', onKeyDown);
  globalThis.addEventListener?.('keyup', onKeyUp);
`;

const newInputBlock = `  const held = new Map([['KeyW', 'forward'], ['ArrowUp', 'forward'], ['KeyS', 'backward'], ['ArrowDown', 'backward'], ['KeyA', 'left'], ['ArrowLeft', 'left'], ['KeyD', 'right'], ['ArrowRight', 'right']]);
  const setMove = (direction, active) => { if (active) { movement.add(direction); guidedDestination = null; } else movement.delete(direction); };
  const isVisibleBlockingOverlay = () => {
    const overlays = productRoot?.querySelectorAll?.('[role="dialog"], [aria-modal="true"], dialog, [data-eon-overlay], [data-eon-modal]') || [];
    return Array.from(overlays).some((node) => {
      if (!node || node.hidden || node.getAttribute?.('aria-hidden') === 'true') return false;
      if ('open' in node && node.open === false) return false;
      return typeof node.getClientRects === 'function' ? node.getClientRects().length > 0 : true;
    });
  };
  const shouldCaptureMovementKey = (event) => {
    if (event?.defaultPrevented || isVisibleBlockingOverlay()) return false;
    const target = event?.target;
    if (!target || target === globalThis || target === document || target === document.body || target === canvas) return true;
    if (target.isContentEditable) return false;
    return !target.closest?.('input, textarea, select, button, a[href], [role="button"], [contenteditable="true"]');
  };
  const releaseKeyboardMovement = () => { for (const direction of held.values()) movement.delete(direction); };
  const onKeyDown = (event) => {
    const direction = held.get(event.code);
    if (!direction || !shouldCaptureMovementKey(event)) return;
    event.preventDefault();
    setMove(direction, true);
  };
  const onKeyUp = (event) => {
    const direction = held.get(event.code);
    if (!direction) return;
    const wasActive = movement.has(direction);
    setMove(direction, false);
    if (wasActive) event.preventDefault();
  };
  const onVisibilityChange = () => { if (document.hidden) releaseKeyboardMovement(); };
  globalThis.addEventListener?.('keydown', onKeyDown);
  globalThis.addEventListener?.('keyup', onKeyUp);
  globalThis.addEventListener?.('blur', releaseKeyboardMovement);
  document.addEventListener?.('visibilitychange', onVisibilityChange);
`;

const oldMovementBlock = `    let x = (movement.has('right') ? 1 : 0) - (movement.has('left') ? 1 : 0) + analog.x;
    let z = (movement.has('forward') ? 1 : 0) - (movement.has('backward') ? 1 : 0) - analog.z;
    if (!x && !z && guidedDestination) {
      const dx = Number(guidedDestination.x || 0) - playerAnchor.position.x;
      const dz = Number(guidedDestination.z || 0) - playerAnchor.position.z;
      const distance = Math.hypot(dx, dz);
      if (distance <= 0.32) guidedDestination = null;
      else { x = dx / distance; z = -dz / distance; }
    } else if (x || z) guidedDestination = null;
    if (x || z) {
      const length = Math.hypot(x, z) || 1;
      const direction = { x: x / length, z: -z / length };
      const step = 5 * delta;
      const livingSummary = livingNexusRuntime?.getSummary?.();
      const livingDestination = String(livingSummary?.destination || 'core');
      const livingOutsideCore = livingDestination !== 'core';
      const resolved = livingOutsideCore
        ? resolveEonCityThirdPersonPosition({
            position: { x: playerAnchor.position.x, y: playerAnchor.position.y, z: playerAnchor.position.z },
            desiredMove: direction,
            step,
            bounds: Number(livingSummary?.worldBound || 128),
            radius: 0.4,
            colliders: livingNexusRuntime?.getCollisionVolumes?.() || []
          })
        : productLayer?.resolveMovement?.({
            position: { x: playerAnchor.position.x, y: playerAnchor.position.y, z: playerAnchor.position.z },
            desiredMove: direction,
            step
          });
      if (resolved?.position) playerAnchor.position.copyFromFloats(resolved.position.x, resolved.position.y || 0, resolved.position.z);
      else {
        const bound = livingOutsideCore ? Number(livingSummary?.worldBound || 128) : 26;
        playerAnchor.position.x = Math.max(-bound, Math.min(bound, playerAnchor.position.x + direction.x * step));
        playerAnchor.position.z = Math.max(-bound, Math.min(bound, playerAnchor.position.z + direction.z * step));
      }
      playerAnchor.rotation.y = Math.atan2(x, -z);
    }
    const moving = Math.hypot(x, z) > 0.04;
`;

const newMovementBlock = `    const inputRight = (movement.has('right') ? 1 : 0) - (movement.has('left') ? 1 : 0) + analog.x;
    const inputForward = (movement.has('forward') ? 1 : 0) - (movement.has('backward') ? 1 : 0) - analog.z;
    let direction = null;
    if (!inputRight && !inputForward && guidedDestination) {
      const guided = resolveEonCityWorldTargetMovement({ position: playerAnchor.position, target: guidedDestination, arrivalRadius: 0.32 });
      if (guided.arrived) guidedDestination = null;
      else if (guided.active) direction = guided;
    } else if (inputRight || inputForward) {
      guidedDestination = null;
      const cameraRelative = resolveEonCityCameraRelativeMovement({
        inputRight,
        inputForward,
        cameraPosition: camera.position,
        cameraTarget: camera.target,
        cameraAlpha: camera.alpha
      });
      if (cameraRelative.active) direction = cameraRelative;
    }
    if (direction) {
      const step = 5 * delta;
      const livingSummary = livingNexusRuntime?.getSummary?.();
      const livingDestination = String(livingSummary?.destination || 'core');
      const livingOutsideCore = livingDestination !== 'core';
      const resolved = livingOutsideCore
        ? resolveEonCityThirdPersonPosition({
            position: { x: playerAnchor.position.x, y: playerAnchor.position.y, z: playerAnchor.position.z },
            desiredMove: direction,
            step,
            bounds: Number(livingSummary?.worldBound || 128),
            radius: 0.4,
            colliders: livingNexusRuntime?.getCollisionVolumes?.() || []
          })
        : productLayer?.resolveMovement?.({
            position: { x: playerAnchor.position.x, y: playerAnchor.position.y, z: playerAnchor.position.z },
            desiredMove: direction,
            step
          });
      if (resolved?.position) playerAnchor.position.copyFromFloats(resolved.position.x, resolved.position.y || 0, resolved.position.z);
      else {
        const bound = livingOutsideCore ? Number(livingSummary?.worldBound || 128) : 26;
        playerAnchor.position.x = Math.max(-bound, Math.min(bound, playerAnchor.position.x + direction.x * step));
        playerAnchor.position.z = Math.max(-bound, Math.min(bound, playerAnchor.position.z + direction.z * step));
      }
      playerAnchor.rotation.y = Math.atan2(direction.x, direction.z);
    }
    const moving = Boolean(direction);
`;

const oldDestroy = "globalThis.removeEventListener?.('keydown', onKeyDown); globalThis.removeEventListener?.('keyup', onKeyUp); globalThis.removeEventListener?.('resize', onResize);";
const newDestroy = "globalThis.removeEventListener?.('keydown', onKeyDown); globalThis.removeEventListener?.('keyup', onKeyUp); globalThis.removeEventListener?.('blur', releaseKeyboardMovement); document.removeEventListener?.('visibilitychange', onVisibilityChange); globalThis.removeEventListener?.('resize', onResize);";

function count(source, needle) {
  return source.split(needle).length - 1;
}

function replaceExactlyOnce(source, oldValue, newValue, label) {
  const occurrences = count(source, oldValue);
  if (occurrences !== 1) throw new Error(`[w662-core-patch] ${label}: expected one governed source match, received ${occurrences}.`);
  return source.replace(oldValue, newValue);
}

let source = fs.readFileSync(sourcePath, 'utf8');
const alreadyPatched = source.includes("from './eon-city-camera-relative-movement.js'")
  && source.includes('resolveEonCityCameraRelativeMovement({')
  && source.includes('shouldCaptureMovementKey')
  && !source.includes('const direction = { x: x / length, z: -z / length };');

if (alreadyPatched) {
  console.log('[w662-core-patch] PASS: canonical core is already patched.');
  process.exit(0);
}

source = replaceExactlyOnce(source, oldImport, newImport, 'camera-relative import');
source = replaceExactlyOnce(source, oldInputBlock, newInputBlock, 'keyboard and focus block');
source = replaceExactlyOnce(source, oldMovementBlock, newMovementBlock, 'movement resolver block');
source = replaceExactlyOnce(source, oldDestroy, newDestroy, 'listener cleanup');

const requiredMarkers = [
  "from './eon-city-camera-relative-movement.js'",
  'resolveEonCityCameraRelativeMovement({',
  'resolveEonCityWorldTargetMovement({',
  'shouldCaptureMovementKey',
  'releaseKeyboardMovement',
  "document.addEventListener?.('visibilitychange', onVisibilityChange)",
  'Math.atan2(direction.x, direction.z)'
];
for (const marker of requiredMarkers) {
  if (!source.includes(marker)) throw new Error(`[w662-core-patch] missing result marker: ${marker}`);
}
if (source.includes('const direction = { x: x / length, z: -z / length };')) throw new Error('[w662-core-patch] fixed-axis movement survived patch.');
if (source.includes('playerAnchor.rotation.y = Math.atan2(x, -z);')) throw new Error('[w662-core-patch] fixed-axis heading survived patch.');

if (!write) {
  console.log('[w662-core-patch] PASS: governed patch is applicable. Use --write to update the source.');
  process.exit(0);
}

fs.writeFileSync(sourcePath, source);
console.log('[w662-core-patch] PASS: canonical core updated with camera-relative movement and focus-safe keyboard handling.');
