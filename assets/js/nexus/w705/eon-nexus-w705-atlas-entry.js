import { buildEonDestinationHref } from '../../contracts/navigation/eon-destination-registry.js';

export const EON_NEXUS_W705_ATLAS_ENTRY_SCHEMA = 'eon.nexus.atlas-entry.w705.v1';

const freeze = (value) => Object.freeze(value);
const clean = (value = '', max = 240) => String(value || '').replace(/\p{Cc}/gu, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
function safeRoute(value = '', fallback = '/') {
  try {
    const url = new URL(String(value || fallback), 'https://eonapp.invalid');
    if (url.origin !== 'https://eonapp.invalid' || !url.pathname.startsWith('/')) return fallback;
    return `${url.pathname}${url.search}${url.hash}`.slice(0, 500);
  } catch { return fallback; }
}

export function buildEonNexusW705AtlasEntryModel(snapshot = {}) {
  const route = snapshot?.route || {};
  const conversation = snapshot?.conversation || {};
  const currentRoute = safeRoute(route.href || route.path || conversation.route || '/', '/');
  return freeze({
    schema: EON_NEXUS_W705_ATLAS_ENTRY_SCHEMA,
    title: 'Choose how to begin',
    detail: 'Atlas can help before a project exists. Pick one explicit next step; nothing starts automatically.',
    actions: freeze([
      freeze({ id: 'create-project', label: 'Create Project', detail: 'Start one local outcome and open its workspace.', href: buildEonDestinationHref('projects', { new: '1' }), kind: 'project' }),
      freeze({ id: 'choose-project', label: 'Choose Recent Project', detail: 'Review the local projects already stored in this browser.', href: buildEonDestinationHref('projects'), kind: 'project' }),
      freeze({ id: 'explore-city', label: 'Explore EONCITY', detail: 'Open the Command Hub and review Open World — Signal Frontier.', href: buildEonDestinationHref('eoncity', { from: 'nexus-atlas' }), kind: 'city' }),
      freeze({ id: 'continue-work', label: 'Continue Current Work', detail: clean(conversation.label || 'Return to the current EONAPP surface.', 180), href: currentRoute, kind: 'continue' })
    ]),
    fakeProjectGenerated: false,
    automaticNavigation: false,
    automaticProjectCreation: false,
    automaticCityEntry: false,
    startsAiWork: false
  });
}

export function getEonNexusW705AtlasEntryTruth() {
  return freeze({
    schema: EON_NEXUS_W705_ATLAS_ENTRY_SCHEMA,
    atlasOpensWithoutProject: true,
    projectDataRemainsEmpty: true,
    fourExplicitEntryActions: true,
    fakeProjectGenerated: false,
    automaticNavigation: false,
    automaticProjectCreation: false,
    automaticCityEntry: false,
    startsAiWork: false
  });
}
