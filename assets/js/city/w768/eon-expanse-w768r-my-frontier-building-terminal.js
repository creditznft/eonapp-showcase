/** W768R — reviewed maintained-workspace terminals for verified My Frontier construction. */
import { EON_EXPANSE_W768A_BUILDING_CATALOG } from './eon-expanse-w768a-my-frontier-layout-contract.js';

export const EON_EXPANSE_W768R_BUILDING_TERMINAL_SCHEMA = 'eon.expanse.my-frontier-building-terminal.w768r.v1';
const freeze = Object.freeze;

export const EON_EXPANSE_W768R_ROUTE_BINDINGS = freeze({
  '/eoncity': freeze({ stationId: 'command-console', surface: 'command-centre' }),
  '/create': freeze({ stationId: 'create-forge', surface: 'create' }),
  '/projects': freeze({ stationId: 'project-atlas', surface: 'projects' }),
  '/library': freeze({ stationId: 'library-vault', surface: 'library' }),
  '/research': freeze({ stationId: 'project-atlas', surface: 'projects' }),
  '/local-ai': freeze({ stationId: 'local-ai-lab', surface: 'local-ai' }),
  '/automations': freeze({ stationId: 'automation-theatre', surface: 'automations' }),
  '/agents': freeze({ stationId: 'automation-theatre', surface: 'agent-theatre' }),
  '/share': freeze({ stationId: 'share-capture', surface: 'share' }),
  '/creator-capture': freeze({ stationId: 'share-capture', surface: 'creator-capture' }),
  '/chat': freeze({ stationId: 'eonbot-nexus', surface: 'nexus' }),
  '/realm-studio': freeze({ stationId: 'my-realm-portal', surface: 'my-realm' }),
  '/vault': freeze({ stationId: 'library-vault', surface: 'library' })
});

export function deriveEonExpanseW768RBuildingTerminal({ plotId = '', buildingId = '', presentationStatus = '' } = {}) {
  const safePlotId = String(plotId || '');
  const safeBuildingId = String(buildingId || '');
  const building = EON_EXPANSE_W768A_BUILDING_CATALOG[safeBuildingId] || null;
  const binding = building ? EON_EXPANSE_W768R_ROUTE_BINDINGS[building.nativeRoute] || null : null;
  const constructed = presentationStatus === 'constructed-foundation';
  const available = Boolean(safePlotId && building && binding && constructed);
  const terminalToken = available ? `${safePlotId}:${safeBuildingId}:${binding.stationId}:${binding.surface}:${building.nativeRoute}` : '';
  return freeze({
    schema: EON_EXPANSE_W768R_BUILDING_TERMINAL_SCHEMA,
    available,
    status: !constructed ? 'verified-construction-required' : !building ? 'approved-building-required' : !binding ? 'maintained-terminal-bridge-pending' : 'maintained-terminal-ready',
    detail: available ? `${building.label} can open its maintained EONAPP workspace after explicit interaction.` : 'This plot does not yet expose a maintained building terminal.',
    action: available ? freeze({
      type: 'open-my-frontier-building-terminal',
      plotId: safePlotId,
      buildingId: safeBuildingId,
      buildingLabel: building.label,
      nativeRoute: building.nativeRoute,
      stationId: binding.stationId,
      surface: binding.surface,
      terminalToken,
      label: `Open ${building.label}`,
      reviewFirst: true
    }) : null,
    automaticOpen: false,
    automaticExecution: false,
    grantsXp: false,
    mutatesMissionState: false,
    privateContentStored: false
  });
}

export function validateEonExpanseW768RBuildingTerminal(view = null, { explicitUserAction = false, expectedTerminalToken = '', expectedPlotId = '', expectedBuildingId = '', expectedStationId = '', expectedSurface = '' } = {}) {
  if (!explicitUserAction) return freeze({ ok: false, reason: 'explicit-user-action-required' });
  const action = view?.action || null;
  if (!view?.available || !action) return freeze({ ok: false, reason: view?.status || 'building-terminal-unavailable' });
  if (expectedTerminalToken && action.terminalToken !== String(expectedTerminalToken)) return freeze({ ok: false, reason: 'building-terminal-changed' });
  if (expectedPlotId && action.plotId !== String(expectedPlotId)) return freeze({ ok: false, reason: 'building-terminal-plot-changed' });
  if (expectedBuildingId && action.buildingId !== String(expectedBuildingId)) return freeze({ ok: false, reason: 'building-terminal-building-changed' });
  if (expectedStationId && action.stationId !== String(expectedStationId)) return freeze({ ok: false, reason: 'building-terminal-station-changed' });
  if (expectedSurface && action.surface !== String(expectedSurface)) return freeze({ ok: false, reason: 'building-terminal-surface-changed' });
  return freeze({ ok: true, action, automaticOpen: false, grantsXp: false, privateContentStored: false });
}

export default freeze({ EON_EXPANSE_W768R_BUILDING_TERMINAL_SCHEMA, EON_EXPANSE_W768R_ROUTE_BINDINGS, deriveEonExpanseW768RBuildingTerminal, validateEonExpanseW768RBuildingTerminal });
