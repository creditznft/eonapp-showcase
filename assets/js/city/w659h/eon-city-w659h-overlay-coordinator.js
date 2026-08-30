/** W659H — coordinates top-level City overlays and deterministic Escape close. */
import { createEonCityW659fOverlayManager } from '../w659f/eon-city-w659f-overlay-manager.js';

export const EON_CITY_W659H_OVERLAY_COORDINATOR_SCHEMA = 'eon.city.w659h.overlay-coordinator.v1';

const MANAGED_PANEL_SELECTORS = Object.freeze([
  '[data-eon-play-preview-panel]',
  '[data-eon-play-first-run-panel]',
  '[data-eon-play-controls-panel]',
  '[data-eon-play-settings-panel]',
  '[data-eon-command-room-panel]',
  '[data-eon-play-command-deck-panel]',
  '[data-eon-play-authored-slice-panel]',
  '[data-eon-play-mission-board-panel]',
  '[data-eon-play-creator-atrium-panel]',
  '[data-eon-play-metropolis-panel]',
  '[data-eon-play-signal-expedition-panel]',
  '[data-eon-play-guide-panel]',
  '[data-eon-play-companion-panel]',
  '[data-eon-play-voice-consent-panel]',
  '[data-eon-play-work-paths-panel]',
  '[data-eon-play-eonbot-panel]',
  '[data-eon-play-art-review-panel]',
  '[data-eon-play-work-panel]',
  '[data-eon-play-landmark-panel]',
  '[data-eon-play-pause-panel]',
  '[data-eon-play-fairness-panel]',
  '[data-eon-play-membership-panel]',
  '[data-eon-play-project-district-panel]',
  '[data-eon-play-resume-panel]',
  '[data-eon-play-travel-panel]',
  '[data-eon-play-universe-panel]',
  '[data-eon-play-cosmetics-panel]',
  '[data-w659g-panel]',
  '[data-capture-panel]',
  '[data-membership-panel]',
  '[data-eon-w659n-panel]'
]);

function getPanels(root) {
  const seen = new Set();
  const panels = [];
  for (const selector of MANAGED_PANEL_SELECTORS) {
    for (const panel of root.querySelectorAll?.(selector) || []) {
      if (seen.has(panel)) continue;
      seen.add(panel);
      panels.push(panel);
    }
  }
  return panels;
}

function getPanelId(panel, index = 0) {
  if (panel.dataset.eonCityOverlayId) return panel.dataset.eonCityOverlayId;
  const identity = [...panel.attributes]
    .map((attribute) => attribute.name)
    .find((name) => name.startsWith('data-') && name.includes('panel'));
  const id = String(panel.id || identity || `city-overlay-${index + 1}`).replace(/^data-/, '');
  panel.dataset.eonCityOverlayId = id;
  return id;
}

function findCloseControl(panel) {
  return [...(panel.querySelectorAll?.('button') || [])].find((button) => {
    const label = String(button.getAttribute?.('aria-label') || '').toLowerCase();
    if (label === 'close' || label.startsWith('close ')) return true;
    return [...button.attributes].some((attribute) => attribute.name.startsWith('data-') && attribute.name.includes('close'));
  }) || null;
}

function closePanel(panel) {
  if (!panel || panel.hidden) return false;
  const close = findCloseControl(panel);
  if (close && !close.disabled) {
    close.click();
    return true;
  }
  panel.hidden = true;
  return true;
}

export function bindEonCityW659hOverlayCoordinator(root, { onStatus = null } = {}) {
  if (!root?.querySelectorAll) return () => {};
  // W662H is the maintained whole-City authority. Keep this historical binder
  // available for isolated legacy surfaces, but never let two coordinators own
  // the same active City root.
  if (!root.dataset) root.dataset = {};
  if (root.dataset?.eonCityOverlayAuthority && root.dataset.eonCityOverlayAuthority !== EON_CITY_W659H_OVERLAY_COORDINATOR_SCHEMA) return () => {};
  root.dataset.eonCityOverlayAuthority = EON_CITY_W659H_OVERLAY_COORDINATOR_SCHEMA;
  let activePanel = null;
  let pendingOpenedPanel = null;
  let reconciling = false;
  let scheduled = false;
  const manager = createEonCityW659fOverlayManager({
    onChange(snapshot) {
      root.dataset.eonCityOverlayTop = snapshot.top || '';
      root.classList.toggle('eon-city-overlay-open', Boolean(snapshot.top));
    }
  });

  const reconcile = () => {
    scheduled = false;
    if (reconciling) return;
    reconciling = true;
    try {
      const visible = getPanels(root).filter((panel) => !panel.hidden && panel.isConnected !== false);
      const newest = pendingOpenedPanel && !pendingOpenedPanel.hidden ? pendingOpenedPanel : (visible.at(-1) || null);
      pendingOpenedPanel = null;
      let closedPrevious = false;
      for (const panel of visible) {
        if (!newest || panel === newest) continue;
        closedPrevious = closePanel(panel) || closedPrevious;
      }
      if (closedPrevious) {
        try { onStatus?.('The previous City panel was closed so the current workspace stays clear.'); } catch {}
      }
      activePanel = newest;
      manager.clear();
      if (activePanel) manager.open(getPanelId(activePanel, getPanels(root).indexOf(activePanel)));
    } finally {
      reconciling = false;
    }
  };
  const scheduleReconcile = () => {
    if (scheduled) return;
    scheduled = true;
    if (typeof globalThis.queueMicrotask === 'function') globalThis.queueMicrotask(reconcile);
    else globalThis.setTimeout?.(reconcile, 0);
  };
  const observer = typeof globalThis.MutationObserver === 'function'
    ? new globalThis.MutationObserver((records) => {
        const managed = new Set(getPanels(root));
        for (const record of records) {
          if (record.type === 'attributes' && managed.has(record.target) && !record.target.hidden) pendingOpenedPanel = record.target;
          if (record.type !== 'childList') continue;
          for (const node of record.addedNodes || []) {
            if (node?.nodeType !== 1) continue;
            if (managed.has(node) && !node.hidden) pendingOpenedPanel = node;
            for (const panel of getPanels(node)) if (!panel.hidden) pendingOpenedPanel = panel;
          }
        }
        scheduleReconcile();
      })
    : null;
  observer?.observe(root, { subtree: true, childList: true, attributes: true, attributeFilter: ['hidden'] });

  const onKeydown = (event) => {
    if (event.key !== 'Escape' || !activePanel || activePanel.hidden) return;
    event.preventDefault();
    event.stopPropagation();
    closePanel(activePanel);
    activePanel = null;
    manager.escape();
    scheduleReconcile();
  };
  root.addEventListener('keydown', onKeydown, true);
  reconcile();

  return () => {
    observer?.disconnect();
    root.removeEventListener('keydown', onKeydown, true);
    manager.clear();
    delete root.dataset.eonCityOverlayTop;
    root.classList.remove('eon-city-overlay-open');
    if (root.dataset.eonCityOverlayAuthority === EON_CITY_W659H_OVERLAY_COORDINATOR_SCHEMA) delete root.dataset.eonCityOverlayAuthority;
  };
}
