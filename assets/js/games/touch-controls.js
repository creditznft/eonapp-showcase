/**
 * Touch Controls — Universal D-Pad Overlay for EONAPP Games
 * ==========================================================
 * Injects a virtual D-pad + action buttons on touch/coarse-pointer devices.
 * Dispatches synthetic KeyboardEvents on window, so all existing game
 * keyboard handlers work without modification.
 *
 * Layout:
 *   Left side:  D-pad (ArrowUp/Down/Left/Right)
 *   Right side: A button (Space), B button (ShiftLeft)
 *
 * Included by each game's index.html as a module script.
 */

(function initTouchControls() {
  // Only activate on touch/coarse devices
  if (!window.matchMedia('(pointer: coarse)').matches && !('ontouchstart' in window)) return;

  const KeyboardEventCtor = window.KeyboardEvent;

  // ─── Config ──────────────────────────────────────────────────────────────────
  /** @type {{ id: string, label: string, code: string, key: string, zone: string, style: string }[]} */
  const BUTTONS = [
    // D-pad
    { id: 'tc-up',    label: '▲', code: 'ArrowUp',    key: 'ArrowUp',    zone: 'dpad', style: 'top:0;left:50%;transform:translateX(-50%)' },
    { id: 'tc-down',  label: '▼', code: 'ArrowDown',  key: 'ArrowDown',  zone: 'dpad', style: 'bottom:0;left:50%;transform:translateX(-50%)' },
    { id: 'tc-left',  label: '◀', code: 'ArrowLeft',  key: 'ArrowLeft',  zone: 'dpad', style: 'top:50%;left:0;transform:translateY(-50%)' },
    { id: 'tc-right', label: '▶', code: 'ArrowRight', key: 'ArrowRight', zone: 'dpad', style: 'top:50%;right:0;transform:translateY(-50%)' },
    // Action buttons
    { id: 'tc-a',     label: 'A', code: 'Space',      key: ' ',          zone: 'acts', style: 'bottom:0;right:0' },
    { id: 'tc-b',     label: 'B', code: 'ShiftLeft',  key: 'Shift',      zone: 'acts', style: 'bottom:0;right:72px' },
  ];

  // ─── Styles ──────────────────────────────────────────────────────────────────
  const /** @type {any} */
style = document.createElement('style');
  style.textContent = `
    #tc-overlay {
      position: fixed; bottom: env(safe-area-inset-bottom, 16px); left: 0; right: 0;
      pointer-events: none; z-index: 9990; display: flex; justify-content: space-between;
      padding: 0 16px 12px;
      touch-action: none;
    }
    .tc-zone {
      position: relative; width: 132px; height: 132px;
      pointer-events: auto;
    }
    .tc-btn {
      position: absolute; width: 52px; height: 52px;
      background: rgba(255,255,255,0.12); border: 2px solid rgba(255,255,255,0.3);
      border-radius: 12px; color: #fff; font-size: 1.3rem; font-weight: 700;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; user-select: none; -webkit-user-select: none;
      touch-action: none; transition: background 0.08s;
    }
    .tc-btn.pressed { background: rgba(99,102,241,0.55); border-color: #818cf8; }
    @media (min-width: 769px) and (pointer: fine) { #tc-overlay { display: none; } }
  `;
  document.head.appendChild(style);

  // ─── DOM ─────────────────────────────────────────────────────────────────────
  const /** @type {any} */
overlay = document.createElement('div');
  overlay.id = 'tc-overlay';
  overlay.setAttribute('aria-hidden', 'true');

  const /** @type {any} */
zones = {};
  for (const /** @type {any} */
btn of BUTTONS) {
    if (!(/** @type {any} */ (zones))[btn.zone]) {
      const /** @type {any} */
z = document.createElement('div');
      z.className = 'tc-zone';
      (/** @type {any} */ (zones))[btn.zone] = z;
    }
  }
  overlay.appendChild((/** @type {any} */ (zones))['dpad']);
  overlay.appendChild((/** @type {any} */ (zones))['acts']);
  document.body.appendChild(overlay);

  // ─── Button elements ─────────────────────────────────────────────────────────
  const /** @type {any} */
els = {};
  for (const /** @type {any} */
btn of BUTTONS) {
    const /** @type {any} */
el = document.createElement('div');
    el.id = btn.id;
    el.className = 'tc-btn';
    el.setAttribute('style', btn.style);
    el.setAttribute('data-code', btn.code);
    el.setAttribute('data-key', btn.key);
    el.textContent = btn.label;
    (/** @type {any} */ (zones))[btn.zone].appendChild(el);
    (/** @type {any} */ (els))[btn.id] = el;
  }

  // ─── Synthetic key dispatch ───────────────────────────────────────────────────
  const /** @type {any} */
held = new Set();

  function pressKey(/** @type {any} */ code, /** @type {any} */ key) {
    if (held.has(code)) return;
    held.add(code);
    try {
      if (KeyboardEventCtor) {
        window.dispatchEvent(new KeyboardEventCtor('keydown', { code, key, bubbles: true, cancelable: true }));
      }
    } catch {}
    const /** @type {any} */
el = document.querySelector(`[data-code="${code}"]`);
    if (el) el.classList.add('pressed');
  }

  function releaseKey(/** @type {any} */ code, /** @type {any} */ key) {
    if (!held.has(code)) return;
    held.delete(code);
    try {
      if (KeyboardEventCtor) {
        window.dispatchEvent(new KeyboardEventCtor('keyup', { code, key, bubbles: true, cancelable: true }));
      }
    } catch {}
    const /** @type {any} */
el = document.querySelector(`[data-code="${code}"]`);
    if (el) el.classList.remove('pressed');
  }

  function getButtonFromTouch(/** @type {any} */ touch) {
    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    if (!el) return null;
    const btn = el.closest('.tc-btn');
    if (!btn) return null;
    const btnAny = /** @type {any} */ (btn);
    return { code: btnAny.dataset.code, key: btnAny.dataset.key };
  }

  // ─── Touch tracking per touchIdentifier ──────────────────────────────────────
  const /** @type {any} */
touchMap = new Map(); // identifier → code

  overlay.addEventListener('touchstart', (/** @type {any} */ e) => {
    e.preventDefault();
    for (const /** @type {any} */
touch of e.changedTouches) {
      const btn = getButtonFromTouch(touch);
      if (btn) {
        touchMap.set(touch.identifier, btn.code);
        pressKey(btn.code, btn.key);
      }
    }
  }, { passive: false });

  overlay.addEventListener('touchmove', (/** @type {any} */ e) => {
    e.preventDefault();
    for (const /** @type {any} */
touch of e.changedTouches) {
      const prevCode = touchMap.get(touch.identifier);
      const btn = getButtonFromTouch(touch);
      const newCode = btn?.code;
      if (prevCode !== newCode) {
        if (prevCode) {
          const prevBtn = BUTTONS.find((b) => b.code === prevCode);
          releaseKey(prevCode, prevBtn?.key || '');
        }
        if (newCode && btn) {
          touchMap.set(touch.identifier, newCode);
          pressKey(newCode, btn.key);
        } else {
          touchMap.delete(touch.identifier);
        }
      }
    }
  }, { passive: false });

  overlay.addEventListener('touchend', (/** @type {any} */ e) => {
    e.preventDefault();
    for (const /** @type {any} */
touch of e.changedTouches) {
      const code = touchMap.get(touch.identifier);
      if (code) {
        const btn = BUTTONS.find((b) => b.code === code);
        releaseKey(code, btn?.key || '');
        touchMap.delete(touch.identifier);
      }
    }
  }, { passive: false });

  overlay.addEventListener('touchcancel', (/** @type {any} */ e) => {
    for (const /** @type {any} */
touch of e.changedTouches) {
      const code = touchMap.get(touch.identifier);
      if (code) {
        const btn = BUTTONS.find((b) => b.code === code);
        releaseKey(code, btn?.key || '');
        touchMap.delete(touch.identifier);
      }
    }
    held.clear();
  }, { passive: true });

  // Release all keys if focus lost
  window.addEventListener('blur', () => {
    for (const /** @type {any} */
code of [...held]) {
      const btn = BUTTONS.find((b) => b.code === code);
      releaseKey(code, btn?.key || '');
    }
    touchMap.clear();
  });
})();
