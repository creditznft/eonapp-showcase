const freeze = (value) => Object.freeze(value);
const unique = (values = []) => new Set((values || []).filter(Boolean).map(String));

export const EON_EXPANSE_W767R_RESTORATION_SCHEMA = 'eon.city.expanse.restoration-status.w767r.v1';

const STAGES = freeze([
  freeze({ id: 'arrival', percent: 8, label: 'Frontier signal detected', complete: () => true }),
  freeze({ id: 'companion', percent: 18, label: 'EONBOT companion link restored', complete: ({ missions, milestones }) => missions.has('companion-in-the-static') || milestones.has('migration:w767a:companion-restored') }),
  freeze({ id: 'overlook', percent: 25, label: 'Gateway Overlook surveyed', complete: ({ missions }) => missions.has('beyond-the-gate') }),
  freeze({ id: 'beacon-one', percent: 42, label: 'Beacon One restored', complete: ({ missions, milestones }) => missions.has('first-light') || milestones.has('beacon-one-repaired') }),
  freeze({ id: 'beacon-two', percent: 58, label: 'Archive signal restored', complete: ({ missions, milestones }) => missions.has('echoes-in-the-archive') || milestones.has('beacon-two-repaired') }),
  freeze({ id: 'transit', percent: 74, label: 'Regional Transit restored', complete: ({ missions, milestones }) => missions.has('the-broken-line') || milestones.has('regional-transit-restored') }),
  freeze({ id: 'regional-core', percent: 90, label: 'Horizon regional core synchronized', complete: ({ missions, milestones }) => missions.has('horizon-reconnected') || milestones.has('regional-core-synchronized') }),
  freeze({ id: 'campaign', percent: 100, label: 'Signal Frontier fully reconnected', complete: ({ missions, milestones, campaignReceipt }) => missions.has('the-first-reveal') || milestones.has('campaign:signal-restoration:complete') || Boolean(campaignReceipt) })
]);

export function deriveEonExpanseW767RRestorationStatus(missionLedger = {}) {
  const context = {
    missions: unique(missionLedger.completedMissions),
    milestones: unique(missionLedger.worldMilestones),
    campaignReceipt: missionLedger.campaignReceipt || null
  };
  let current = STAGES[0];
  const completedStageIds = [];
  for (const stage of STAGES) {
    if (!stage.complete(context)) break;
    current = stage;
    completedStageIds.push(stage.id);
  }
  const next = STAGES[completedStageIds.length] || null;
  return freeze({
    schema: EON_EXPANSE_W767R_RESTORATION_SCHEMA,
    onlinePercent: current.percent,
    currentStageId: current.id,
    currentLabel: current.label,
    nextStageId: next?.id || '',
    nextLabel: next?.label || '',
    completedStageIds: freeze(completedStageIds),
    complete: current.percent === 100,
    derivedFromVerifiedProgress: true,
    ignoresXpOnly: true,
    awardsXp: false,
    mutatesProgression: false,
    storesPrivateContent: false
  });
}
