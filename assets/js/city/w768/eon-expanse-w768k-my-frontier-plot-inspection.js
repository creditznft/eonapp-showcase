/** W768K — privacy-safe, stale-resistant My Frontier plot inspection. */
import { createEonExpanseW768AMyFrontierLayoutContract } from './eon-expanse-w768a-my-frontier-layout-contract.js';
import { deriveEonExpanseW768JMyFrontierPresentation } from './eon-expanse-w768j-my-frontier-presentation.js';

export const EON_EXPANSE_W768K_PLOT_INSPECTION_SCHEMA = 'eon.expanse.my-frontier-plot-inspection.w768k.v1';
const freeze = Object.freeze;
const contract = createEonExpanseW768AMyFrontierLayoutContract();

export function deriveEonExpanseW768KPlotInspection({ plotId = '', myFrontierState = {}, constructionProjection = {} } = {}) {
  const plot = contract.plots.find((entry) => entry.id === String(plotId || '')) || null;
  if (!plot) return freeze({ ok: false, reason: 'my-frontier-plot-not-found' });
  const presentation = deriveEonExpanseW768JMyFrontierPresentation({ myFrontierState, constructionProjection });
  const visual = presentation.plots.find((entry) => entry.plotId === plot.id) || null;
  const building = visual?.selectedBuildingId ? contract.buildingCatalog[visual.selectedBuildingId] : null;
  const detailByStatus = {
    empty: 'This authored plot is empty. Choose one approved district building from the Mission Board.',
    'planned-hologram': `${building?.label || 'The selected building'} is a non-physical holographic plan. No construction record exists yet.`,
    'constructed-foundation': `${building?.label || 'The selected building'} has a verified construction record and is shown only as foundation and scaffolding until its authored asset is validated.`
  };
  return freeze({
    ok: true,
    schema: EON_EXPANSE_W768K_PLOT_INSPECTION_SCHEMA,
    plotId: plot.id,
    district: plot.district,
    plotLabel: plot.label,
    status: visual?.status || 'empty',
    buildingId: visual?.selectedBuildingId || '',
    buildingLabel: building?.label || '',
    detail: detailByStatus[visual?.status || 'empty'],
    nativeRoute: building?.nativeRoute || '',
    expectedToken: `${plot.id}:${visual?.selectedBuildingId || 'empty'}:${visual?.status || 'empty'}`,
    grantsXp: false,
    mutatesProgression: false,
    opensWorkspaceAutomatically: false,
    privateContentStored: false,
    rawCoordinatesExposed: false
  });
}

export function validateEonExpanseW768KPlotInspection(view = null, { explicitUserAction = false, expectedPlotId = '', expectedToken = '' } = {}) {
  if (!explicitUserAction) return freeze({ ok: false, reason: 'explicit-user-action-required' });
  if (!view?.ok || view.schema !== EON_EXPANSE_W768K_PLOT_INSPECTION_SCHEMA) return freeze({ ok: false, reason: view?.reason || 'my-frontier-plot-inspection-unavailable' });
  if (expectedPlotId && view.plotId !== String(expectedPlotId)) return freeze({ ok: false, reason: 'my-frontier-plot-selection-changed' });
  if (expectedToken && view.expectedToken !== String(expectedToken)) return freeze({ ok: false, reason: 'my-frontier-plot-state-changed' });
  return freeze({ ok: true, inspection: view, explicitUserAction: true, grantsXp: false, mutatesProgression: false, opensWorkspaceAutomatically: false });
}

export default freeze({ EON_EXPANSE_W768K_PLOT_INSPECTION_SCHEMA, deriveEonExpanseW768KPlotInspection, validateEonExpanseW768KPlotInspection });
