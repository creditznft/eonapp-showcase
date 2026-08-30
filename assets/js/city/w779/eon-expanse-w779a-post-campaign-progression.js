/** W779A — truthful post-campaign progression projection from existing maintained authorities. */
const freeze = Object.freeze;

export const EON_EXPANSE_W779A_POST_CAMPAIGN_SCHEMA = 'eon.expanse.post-campaign-progression.w779a.v1';

const bounded = (value, max) => Math.max(0, Math.min(max, Number(value) || 0));

export function deriveEonExpanseW779APostCampaignProgression({
  campaignBoard = null,
  zoneRestorationBoard = null,
  myFrontierState = null,
  constructionProjection = null,
  productiveTransformationStatus = null,
  sideTransformationStatus = null,
  livingContentState = null
} = {}) {
  const campaignComplete = campaignBoard?.campaign?.complete === true;
  if (!campaignComplete) {return freeze({
    schema: EON_EXPANSE_W779A_POST_CAMPAIGN_SCHEMA,
    visible: false,
    campaignComplete: false,
    rows: freeze([]),
    completedPillars: 0,
    totalPillars: 5,
    nextLabel: 'Complete Signal Frontier first.',
    futureRegionStatus: 'signal-frontier-certification-required',
    grantsXp: false,
    mutatesProgression: false,
    privateContentStored: false
  });}

  const constructedCount = bounded(constructionProjection?.constructedCount, 7);
  const productiveCount = bounded(productiveTransformationStatus?.activeCount, 5);
  const sideCount = bounded(sideTransformationStatus?.activeCount, 5);
  const discoveryCount = bounded(livingContentState?.discoveries?.length, 5);
  const completedContractCount = Math.max(0, Number(livingContentState?.completedFrontierContracts?.length || 0));
  const activeContract = Boolean(livingContentState?.activeFrontierContract?.id);
  const contractReady = activeContract || completedContractCount > 0;
  const frontierRestored = bounded(zoneRestorationBoard?.restoredZoneCount, 5) === 5;

  const rows = freeze([
    freeze({ id: 'my-frontier', label: 'My Frontier', current: constructedCount, target: 7, complete: constructedCount >= 7, status: myFrontierState?.unlocked === true ? `${constructedCount}/7 authored plots constructed` : 'Starter world access has not been activated in this save yet' }),
    freeze({ id: 'productive-frontier', label: 'Productive frontier', current: productiveCount, target: 5, complete: productiveCount >= 5, status: `${productiveCount}/5 verified work signals online` }),
    freeze({ id: 'side-mission-memory', label: 'Side-mission memory', current: sideCount, target: 5, complete: sideCount >= 5, status: `${sideCount}/5 physical mission memories active` }),
    freeze({ id: 'discoveries', label: 'Discoveries', current: discoveryCount, target: 5, complete: discoveryCount >= 5, status: `${discoveryCount}/5 authored discoveries recorded` }),
    freeze({ id: 'frontier-contracts', label: 'Frontier contracts', current: contractReady ? 1 : 0, target: 1, complete: contractReady, status: activeContract ? 'Reviewed contract in progress' : completedContractCount > 0 ? `${completedContractCount} verified contract${completedContractCount === 1 ? '' : 's'} completed` : 'Review-first frontier contract still available' })
  ]);
  const completedPillars = rows.filter((row) => row.complete).length;
  const nextLabel = myFrontierState?.unlocked !== true ? 'Enter My Frontier to activate starter planning; campaign completion is not an entry gate'
    : constructedCount < 7 ? 'Plan and construct the next authored My Frontier district'
      : productiveCount < 5 ? 'Complete another receipt-backed productive expedition'
        : discoveryCount < 5 ? 'Recover the remaining authored frontier discoveries'
          : sideCount < 5 ? 'Complete another physical side-mission family'
            : !contractReady ? 'Review a frontier contract without automatic completion'
              : 'Continue optional repeatable frontier work and district upgrades';
  const futureRegionReady = frontierRestored && completedPillars === rows.length;

  return freeze({
    schema: EON_EXPANSE_W779A_POST_CAMPAIGN_SCHEMA,
    visible: true,
    campaignComplete: true,
    frontierRestored,
    rows,
    completedPillars,
    totalPillars: rows.length,
    nextLabel,
    futureRegionStatus: futureRegionReady ? 'foundation-ready-for-authored-region-programme' : 'complete-maintained-frontier-pillars-first',
    futureRegionReady,
    automaticUnlock: false,
    createsRegion: false,
    grantsXp: false,
    mutatesProgression: false,
    privateContentStored: false
  });
}

export default freeze({ EON_EXPANSE_W779A_POST_CAMPAIGN_SCHEMA, deriveEonExpanseW779APostCampaignProgression });
