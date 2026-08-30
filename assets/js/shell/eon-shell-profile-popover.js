/** W525B profile utility input contract: hover is desktop-fine-pointer-delayed-only. */
export const EON_SHELL_PROFILE_HOVER_OPEN_DELAY_MS = 380;
export const EON_SHELL_PROFILE_HOVER_CLOSE_DELAY_MS = 280;

export function supportsEonShellProfileHover({ matchMedia = globalThis.matchMedia } = {}) {
  return Boolean(matchMedia?.('(hover: hover) and (pointer: fine)').matches);
}

export function bindEonShellProfileHover({ trigger = null, menu = null, closeOthers = () => {}, place = () => {}, notifyOpen = () => {}, matchMedia = globalThis.matchMedia } = {}) {
  let openTimer = 0;
  let closeTimer = 0;
  const supportsHover = () => supportsEonShellProfileHover({ matchMedia });
  const clear = () => { globalThis.clearTimeout(openTimer); globalThis.clearTimeout(closeTimer); openTimer = 0; closeTimer = 0; };
  const close = () => { globalThis.clearTimeout(openTimer); openTimer = 0; if (menu) menu.hidden = true; trigger?.setAttribute('aria-expanded', 'false'); };
  const open = () => {
    if (!menu || !trigger) return;
    globalThis.clearTimeout(closeTimer); closeTimer = 0;
    closeOthers(); menu.hidden = false; place(); trigger.setAttribute('aria-expanded', 'true'); notifyOpen();
  };
  const scheduleOpen = () => {
    if (!supportsHover() || !menu?.hidden) return;
    globalThis.clearTimeout(closeTimer); closeTimer = 0;
    globalThis.clearTimeout(openTimer); openTimer = globalThis.setTimeout(() => { openTimer = 0; open(); }, EON_SHELL_PROFILE_HOVER_OPEN_DELAY_MS);
  };
  const scheduleClose = () => {
    if (!supportsHover()) return;
    globalThis.clearTimeout(openTimer); openTimer = 0;
    globalThis.clearTimeout(closeTimer); closeTimer = globalThis.setTimeout(() => { closeTimer = 0; close(); }, EON_SHELL_PROFILE_HOVER_CLOSE_DELAY_MS);
  };
  const cancelClose = () => { globalThis.clearTimeout(closeTimer); closeTimer = 0; };
  trigger?.addEventListener('click', () => { const next = Boolean(menu?.hidden); clear(); if (next) open(); else close(); });
  trigger?.addEventListener('pointerenter', scheduleOpen);
  trigger?.addEventListener('pointerleave', scheduleClose);
  trigger?.addEventListener('focusin', cancelClose);
  menu?.addEventListener('pointerenter', () => { if (!supportsHover()) return; globalThis.clearTimeout(openTimer); openTimer = 0; cancelClose(); });
  menu?.addEventListener('pointerleave', scheduleClose);
  return Object.freeze({ clear, open, close, scheduleOpen, scheduleClose, supportsHover });
}
