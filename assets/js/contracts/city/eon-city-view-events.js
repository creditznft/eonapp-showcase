/**
 * A15 I03 — bounded City projection event names shared with Core work surfaces.
 * Event names are contracts only. City rendering, state and controllers remain
 * under assets/js/city and are never imported by normal Core routes.
 */
export const EON_CITY_W749_VIEW_EVENT = 'eon:city-w749-nexus-view-changed';
export const EON_CITY_W750_VIEW_EVENT = 'eon:city-w750-command-centre-view-changed';
export const EON_CITY_W751_VIEW_EVENT = 'eon:city-w751-productive-stations-view-changed';
export const EON_CITY_W752_VIEW_EVENT = 'eon:city-w752-missions-progression-view-changed';

export const EON_CITY_PROJECTION_EVENTS = Object.freeze({
  livingNexus: EON_CITY_W749_VIEW_EVENT,
  commandCentre: EON_CITY_W750_VIEW_EVENT,
  productiveStations: EON_CITY_W751_VIEW_EVENT,
  missionsProgression: EON_CITY_W752_VIEW_EVENT
});
