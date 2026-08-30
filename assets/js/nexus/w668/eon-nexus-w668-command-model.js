/**
 * W668B — simplified player-facing command model for Expanded Nexus.
 *
 * It selects one clear next action from the already bounded Live Nexus model.
 * It never starts work or navigation and keeps Atlas/City as explicit choices.
 */
export const EON_NEXUS_W668_COMMAND_SCHEMA = 'eon.nexus.command-model.w668b.v1';

const freeze = (value) => Object.freeze(value);

function safeRoute(value = '', fallback = '/') {
  try {
    const url = new URL(String(value || fallback), 'https://eonapp.invalid');
    if (url.origin !== 'https://eonapp.invalid' || !url.pathname.startsWith('/')) return fallback;
    if (/(?:\r|\n|javascript:|data:)/i.test(String(value || ''))) return fallback;
    return `${url.pathname}${url.search}${url.hash}`.slice(0, 500);
  } catch { return fallback; }
}

function action(id, label, kind, route = '', purpose = '') {
  return freeze({
    id,
    label,
    kind,
    route: route ? safeRoute(route, '/') : '',
    purpose: String(purpose || '').replace(/\s+/g, ' ').trim().slice(0, 220),
    explicitUserAction: true,
    startsWork: false,
    autoNavigate: false,
    autoApprove: false
  });
}

export function getEonNexusW668CommandModel(model = {}, {
  atlasAvailable = model?.atlasAvailable === true,
  spatialAvailable = true
} = {}) {
  let primary;
  if (model?.reviewVisible === true) {
    primary = action('review', model.reviewLabel || 'Review approval', 'review', model.reviewRoute || '/workspace', 'Review the waiting decision before anything changes.');
  } else if (model?.resultVisible === true) {
    primary = action('result', model.resultLabel || 'Open result', 'result', model.resultRoute || '/workspace', 'Open the newest verified result in its native surface.');
  } else if (model?.projectSelected === true) {
    primary = action('project', 'Continue project', 'project', model.projectRoute || '/projects', 'Continue the selected project from its native Projects surface.');
  } else {
    primary = action('conversation', 'Continue conversation', 'chat', model.conversationRoute || '/', 'Return to the same private EONBOT conversation.');
  }

  const paths = [primary];
  paths.push(atlasAvailable
    ? action('atlas', 'Open Atlas', 'atlas', '', 'See the selected project as a spatial map.')
    : action('projects', 'Choose a project', 'project', model.projectRoute || '/projects', 'Select a project so Nexus and Atlas have a clear centre.'));
  if (spatialAvailable) paths.push(action('spatial', 'Enter EON City', 'spatial', '', 'Carry the same Nexus state into the spatial world.'));

  return freeze({
    schema: EON_NEXUS_W668_COMMAND_SCHEMA,
    primary,
    paths: freeze(paths.slice(0, 3)),
    modeLabels: freeze({ conversation: 'Now', agents: 'Nodes', results: 'Activity', atlas: 'Atlas' }),
    maximumVisiblePaths: 3,
    technicalControlsCollapsed: true,
    onePrimaryAction: true,
    startsWork: false,
    autoNavigate: false,
    autoApprove: false
  });
}

export default freeze({ EON_NEXUS_W668_COMMAND_SCHEMA, getEonNexusW668CommandModel });
