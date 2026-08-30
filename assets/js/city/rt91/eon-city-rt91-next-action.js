/** RT91 — persistent next-action resolver. A playable world should never end in a blank state. */
export const EON_CITY_RT91_NEXT_ACTION_SCHEMA = 'eon.city.next-action.rt91.v1';
const freeze = Object.freeze;

const ACTION_PRIORITY = Object.freeze({ active: 0, available: 1 });

export function resolveEonCityRt91NextAction({ board = null, currentWorldId = '', postCampaignActivities = [], discoveriesAvailable = false } = {}) {
  const sections = board?.sections || {};
  const currentWorld = String(currentWorldId || '');
  const allStory = sections.story || [];
  const allContracts = sections.contracts || [];
  const globalActive = [...allStory, ...allContracts].find((row) => row.status === 'active') || null;
  const story = allStory.filter((row) => !currentWorld || row.worldId === currentWorld).sort((a, b) => (ACTION_PRIORITY[a.status] ?? 9) - (ACTION_PRIORITY[b.status] ?? 9));
  const contract = allContracts.find((row) => !currentWorld || row.worldId === currentWorld) || null;
  const productive = (sections.productive || []).find((row) => !currentWorld || row.worldId === currentWorld) || null;
  const build = (sections.build || []).find((row) => !currentWorld || row.worldId === currentWorld) || null;
  let choice = globalActive ? { ...globalActive, reason: globalActive.kind === 'repeatable-contract' ? 'active-repeatable-contract' : 'active-story' }
    : story[0] ? { ...story[0], reason: 'story' }
      : contract ? { ...contract, reason: 'repeatable-contract' }
      : build ? { ...build, reason: 'build' }
        : productive ? { ...productive, reason: 'productive' }
          : discoveriesAvailable ? { id: 'explore-discoveries', label: 'Explore nearby discoveries', worldId: currentWorld, kind: 'discovery', reason: 'discovery' }
            : postCampaignActivities.length ? { id: 'post-campaign-activity', label: String(postCampaignActivities[0]), worldId: currentWorld, kind: 'post-campaign', reason: 'post-campaign' }
              : { id: 'open-mission-board', label: 'Open Mission Board', worldId: currentWorld || 'command-hub', kind: 'navigation', reason: 'safe-fallback' };
  choice = freeze({ ...choice, requiresExplicitUserAction: true, automaticallyExecutesWork: false });
  return freeze({
    schema: EON_CITY_RT91_NEXT_ACTION_SCHEMA,
    action: choice,
    blankState: false,
    grantsProgression: false,
    startsWorkAutomatically: false
  });
}

export default freeze({ EON_CITY_RT91_NEXT_ACTION_SCHEMA, resolveEonCityRt91NextAction });
