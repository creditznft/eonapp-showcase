const freeze = (value) => Object.freeze(value);
const unique = (values = []) => freeze([...new Set((values || []).filter(Boolean).map(String))]);

export const EON_EXPANSE_W766E_MISSION_SCHEMA = 'eon.city.expanse.missions.w767a.v4';
export const EON_EXPANSE_W766E_CAMPAIGN = freeze([
  freeze({ id: 'companion-in-the-static', label: 'Companion in the Static', xp: 100, objectives: freeze(['review-expedition', 'enter-expanse', 'detect-companion-signal', 'scan-dormant-eonbot', 'recover-signal-core', 'restore-companion-link']) }),
  freeze({ id: 'beyond-the-gate', label: 'Beyond the Gate', xp: 120, objectives: freeze(['meet-pathfinder', 'activate-map', 'visit-overlook']) }),
  freeze({ id: 'first-light', label: 'First Light', xp: 220, objectives: freeze(['reach-beacon-one', 'scan-beacon-one', 'recover-signal-components', 'repair-beacon-one', 'reveal-beacon-fields']) }),
  freeze({ id: 'echoes-in-the-archive', label: 'Echoes in the Archive', xp: 280, objectives: freeze(['reach-archive-ruins', 'meet-navigator', 'recover-archive-records', 'solve-signal-routing', 'repair-beacon-two']) }),
  freeze({ id: 'the-broken-line', label: 'The Broken Line', xp: 360, objectives: freeze(['reach-transit-scar', 'meet-maintainer', 'activate-relay-nodes', 'stabilize-transit-relay', 'restore-regional-transit']) }),
  freeze({ id: 'horizon-reconnected', label: 'Horizon Reconnected', xp: 440, objectives: freeze(['reach-horizon-vault', 'verify-three-signals', 'synchronize-regional-core', 'unlock-horizon-transit', 'open-vault-route']) }),
  freeze({ id: 'the-first-reveal', label: 'The First Reveal', xp: 520, objectives: freeze(['enter-vault-chamber', 'claim-signal-vanguard', 'activate-cosmetic', 'return-command-hub', 'confirm-campaign-receipt']) })
]);

export const EON_EXPANSE_W766G_SIGNAL_VANGUARD_REWARD = freeze({
  id: 'signal-vanguard-reveal',
  label: 'Signal Vanguard Reveal',
  cosmeticId: 'signal-vanguard-glow',
  title: 'Signal Vanguard',
  tradeable: false,
  financialValue: false
});

export const EON_EXPANSE_W766E_OBJECTIVE_GUIDANCE = freeze({
  'review-expedition': freeze({ zoneId: 'gateway-overlook', label: 'Review the Expanse expedition at the Command Hub gate.' }),
  'enter-expanse': freeze({ zoneId: 'gateway-overlook', label: 'Confirm entry after reviewing the expedition.' }),
  'detect-companion-signal': freeze({ zoneId: 'gateway-overlook', label: 'Follow the pulsing companion signal beside the damaged relay.' }),
  'scan-dormant-eonbot': freeze({ zoneId: 'gateway-overlook', label: 'Scan the dormant EONBOT unit near the crashed signal relay.' }),
  'recover-signal-core': freeze({ zoneId: 'gateway-overlook', label: 'Recover the loose signal core beside EONBOT.' }),
  'restore-companion-link': freeze({ zoneId: 'gateway-overlook', label: 'Return the signal core to EONBOT and restore the companion link.' }),
  'meet-pathfinder': freeze({ zoneId: 'gateway-overlook', label: 'Meet Pathfinder near the arrival platform with EONBOT.' }),
  'activate-map': freeze({ zoneId: 'gateway-overlook', label: 'Open the Expanse map.' }),
  'visit-overlook': freeze({ zoneId: 'gateway-overlook', label: 'Reach the Gateway Overlook panorama.' }),
  'reach-beacon-one': freeze({ zoneId: 'beacon-fields', label: 'Follow the western circuit route to Beacon Fields.' }),
  'scan-beacon-one': freeze({ zoneId: 'beacon-fields', label: 'Inspect Beacon One to scan its damage.' }),
  'recover-signal-components': freeze({ zoneId: 'beacon-fields', label: 'Interact with Beacon One again to recover components.' }),
  'repair-beacon-one': freeze({ zoneId: 'beacon-fields', label: 'Complete the Beacon One repair.' }),
  'reveal-beacon-fields': freeze({ zoneId: 'beacon-fields', label: 'Finish revealing Beacon Fields on the map.' }),
  'reach-archive-ruins': freeze({ zoneId: 'archive-ruins', label: 'Travel east to Archive Ruins.' }),
  'meet-navigator': freeze({ zoneId: 'archive-ruins', label: 'Meet Navigator inside Archive Ruins.' }),
  'recover-archive-records': freeze({ zoneId: 'archive-ruins', label: 'Recover all three violet archive records.' }),
  'solve-signal-routing': freeze({ zoneId: 'archive-ruins', label: 'Use the routing console after recovering the records.' }),
  'repair-beacon-two': freeze({ zoneId: 'archive-ruins', label: 'Repair Beacon Two after solving the route.' }),
  'reach-transit-scar': freeze({ zoneId: 'transit-scar', label: 'Continue south to Transit Scar.' }),
  'meet-maintainer': freeze({ zoneId: 'transit-scar', label: 'Meet the Maintenance Worker.' }),
  'activate-relay-nodes': freeze({ zoneId: 'transit-scar', label: 'Activate all three damaged relay nodes.' }),
  'stabilize-transit-relay': freeze({ zoneId: 'transit-scar', label: 'Use the elevated stabilizer ring.' }),
  'restore-regional-transit': freeze({ zoneId: 'transit-scar', label: 'Activate the restored Transit core.' }),
  'reach-horizon-vault': freeze({ zoneId: 'horizon-vault', label: 'Follow the restored line to Horizon Vault.' }),
  'verify-three-signals': freeze({ zoneId: 'horizon-vault', label: 'Verify Beacon One, Beacon Two, and the Transit signal.' }),
  'synchronize-regional-core': freeze({ zoneId: 'horizon-vault', label: 'Synchronize the three restored signals at the regional core.' }),
  'unlock-horizon-transit': freeze({ zoneId: 'horizon-vault', label: 'Activate the Horizon Vault Transit anchor.' }),
  'open-vault-route': freeze({ zoneId: 'horizon-vault', label: 'Open the route into the Vault Reveal chamber.' }),
  'enter-vault-chamber': freeze({ zoneId: 'horizon-vault', label: 'Enter the illuminated Vault Reveal chamber.' }),
  'claim-signal-vanguard': freeze({ zoneId: 'horizon-vault', label: 'Claim the Signal Vanguard Reveal.' }),
  'activate-cosmetic': freeze({ zoneId: 'horizon-vault', label: 'Activate the Signal Vanguard cosmetic.' }),
  'return-command-hub': freeze({ zoneId: 'gateway-overlook', label: 'Return safely to the Command Hub.' }),
  'confirm-campaign-receipt': freeze({ zoneId: 'gateway-overlook', label: 'Confirm the completed expedition on the Mission Board.' })
});

const CAMPAIGN_IDS = EON_EXPANSE_W766E_CAMPAIGN.map((mission) => mission.id);
const definitionById = new Map(EON_EXPANSE_W766E_CAMPAIGN.map((mission) => [mission.id, mission]));

function levelForXp(xp) {
  const total = Number(xp || 0);
  return total >= 1940 ? 8
    : total >= 1700 ? 7
      : total >= 1420 ? 6
        : total >= 980 ? 5
          : total >= 620 ? 4
            : total >= 340 ? 3
              : total >= 120 ? 2
                : 1;
}

function initialMission(definition, index) {
  return freeze({
    id: definition.id,
    label: definition.label,
    status: index === 0 ? 'available' : 'locked',
    currentObjective: definition.objectives[0],
    completedObjectives: freeze([]),
    completedAt: 0,
    xpAwarded: false
  });
}

export function createEonExpanseW766EInitialLedger() {
  return freeze({
    schema: EON_EXPANSE_W766E_MISSION_SCHEMA,
    totalXp: 0,
    currentLevel: 1,
    activeMissionId: '',
    completedMissions: freeze([]),
    missions: freeze(Object.fromEntries(EON_EXPANSE_W766E_CAMPAIGN.map((mission, index) => [mission.id, initialMission(mission, index)]))),
    processedReceipts: freeze([]),
    worldMilestones: freeze([]),
    vaultReveals: freeze([]),
    ownedCosmetics: freeze([]),
    selectedCosmetic: '',
    campaignReceipt: null
  });
}

export function migrateEonExpanseW767ACompanionMissionLedger(input = null) {
  if (!input || typeof input !== 'object' || input?.missions?.['companion-in-the-static']) return input || {};
  const oldBeyond = input?.missions?.['beyond-the-gate'] || {};
  const oldObjectives = new Set(oldBeyond.completedObjectives || []);
  const legacyCompleted = input?.completedMissions?.includes?.('beyond-the-gate') === true || oldBeyond.status === 'completed';
  const entered = legacyCompleted || oldObjectives.has('enter-expanse') || oldObjectives.has('meet-pathfinder') || oldObjectives.has('activate-map') || oldObjectives.has('visit-overlook');
  const reviewed = entered || oldObjectives.has('review-expedition');
  if (!reviewed) return input;
  const companionDefinition = definitionById.get('companion-in-the-static');
  const completedObjectives = entered ? [...companionDefinition.objectives] : ['review-expedition'];
  const completedMissions = entered
    ? ['companion-in-the-static', ...(input.completedMissions || [])]
    : [...(input.completedMissions || [])];
  const activeMissionId = !entered && input.activeMissionId === 'beyond-the-gate'
    ? 'companion-in-the-static'
    : input.activeMissionId;
  return {
    ...input,
    activeMissionId,
    completedMissions,
    missions: {
      ...(input.missions || {}),
      'companion-in-the-static': {
        id: 'companion-in-the-static',
        label: 'Companion in the Static',
        status: entered ? 'completed' : 'active',
        currentObjective: entered ? '' : 'enter-expanse',
        completedObjectives,
        completedAt: entered ? Number(oldBeyond.completedAt || 0) : 0,
        xpAwarded: entered
      }
    },
    worldMilestones: entered
      ? [...(input.worldMilestones || []), 'migration:w767a:companion-restored']
      : [...(input.worldMilestones || [])]
  };
}

function normalizeState(input) {
  input = migrateEonExpanseW767ACompanionMissionLedger(input);
  const base = createEonExpanseW766EInitialLedger();
  const completedSet = new Set(unique(input?.completedMissions));
  for (const id of CAMPAIGN_IDS) if (input?.missions?.[id]?.status === 'completed') completedSet.add(id);
  const completedMissions = CAMPAIGN_IDS.filter((id) => completedSet.has(id));
  let activeMissionId = String(input?.activeMissionId || '');
  if (!CAMPAIGN_IDS.includes(activeMissionId) || completedSet.has(activeMissionId)) activeMissionId = '';
  const firstIncompleteIndex = CAMPAIGN_IDS.findIndex((id) => !completedSet.has(id));
  const missions = {};
  for (let index = 0; index < EON_EXPANSE_W766E_CAMPAIGN.length; index += 1) {
    const definition = EON_EXPANSE_W766E_CAMPAIGN[index];
    const previous = input?.missions?.[definition.id] || {};
    const completedObjectives = unique((previous.completedObjectives || []).filter((objective) => definition.objectives.includes(objective)));
    const isCompleted = completedSet.has(definition.id);
    const isActive = activeMissionId === definition.id;
    const status = isCompleted ? 'completed' : isActive ? 'active' : index === firstIncompleteIndex ? 'available' : 'locked';
    const nextObjective = definition.objectives.find((objective) => !completedObjectives.includes(objective)) || '';
    missions[definition.id] = freeze({
      ...base.missions[definition.id],
      ...previous,
      id: definition.id,
      label: definition.label,
      status,
      currentObjective: isCompleted ? '' : nextObjective || definition.objectives[0],
      completedObjectives,
      xpAwarded: isCompleted || previous.xpAwarded === true,
      completedAt: isCompleted ? Number(previous.completedAt || 0) : 0
    });
  }
  const totalXp = Math.max(0, Number(input?.totalXp || 0));
  return freeze({
    ...base,
    ...(input || {}),
    schema: EON_EXPANSE_W766E_MISSION_SCHEMA,
    totalXp,
    currentLevel: levelForXp(totalXp),
    activeMissionId,
    completedMissions: freeze(completedMissions),
    missions: freeze(missions),
    processedReceipts: unique(input?.processedReceipts),
    worldMilestones: unique(input?.worldMilestones),
    ownedCosmetics: unique(input?.ownedCosmetics),
    selectedCosmetic: String(input?.selectedCosmetic || ''),
    vaultReveals: unique(input?.vaultReveals),
    campaignReceipt: input?.campaignReceipt || null
  });
}

export function buildEonExpanseW766EMissionBoard(input = createEonExpanseW766EInitialLedger()) {
  const state = normalizeState(input);
  const active = state.activeMissionId ? state.missions?.[state.activeMissionId] : null;
  const objective = active?.currentObjective || '';
  return freeze({
    schema: 'eon.city.expanse.mission-board.w766g.v3',
    totalXp: Number(state.totalXp || 0),
    currentLevel: Number(state.currentLevel || 1),
    activeMission: active ? freeze({ ...active, guidance: EON_EXPANSE_W766E_OBJECTIVE_GUIDANCE[objective] || null }) : null,
    availableMissions: freeze(EON_EXPANSE_W766E_CAMPAIGN.filter((definition) => state.missions?.[definition.id]?.status === 'available').map((definition) => freeze({ id: definition.id, label: definition.label, xp: definition.xp }))),
    lockedMissions: freeze(EON_EXPANSE_W766E_CAMPAIGN.filter((definition) => state.missions?.[definition.id]?.status === 'locked').map((definition) => freeze({ id: definition.id, label: definition.label }))),
    completedMissions: freeze([...(state.completedMissions || [])]),
    completion: freeze({ completed: state.completedMissions.length, total: EON_EXPANSE_W766E_CAMPAIGN.length, campaignComplete: state.completedMissions.length === EON_EXPANSE_W766E_CAMPAIGN.length }),
    reward: freeze({ reveal: EON_EXPANSE_W766G_SIGNAL_VANGUARD_REWARD, owned: state.ownedCosmetics.includes(EON_EXPANSE_W766G_SIGNAL_VANGUARD_REWARD.cosmeticId), selected: state.selectedCosmetic === EON_EXPANSE_W766G_SIGNAL_VANGUARD_REWARD.cosmeticId }),
    campaignReceipt: state.campaignReceipt
  });
}

export function createEonExpanseW766EMissionRuntime({ initialState = createEonExpanseW766EInitialLedger(), now = Date.now, onChange = null } = {}) {
  let state = normalizeState(initialState);
  const commit = (next) => {
    state = normalizeState(next);
    onChange?.(state);
    return state;
  };
  const definition = (id) => definitionById.get(id) || null;

  function completeObjectiveInternal(missionId, objectiveId, receiptId) {
    const def = definition(missionId);
    const mission = state.missions[missionId];
    if (!def || !mission) return freeze({ ok: false, reason: 'mission-not-found' });
    if (!def.objectives.includes(objectiveId)) return freeze({ ok: false, reason: 'objective-not-found' });
    const receipt = String(receiptId || `${missionId}:${objectiveId}`);
    if (state.processedReceipts.includes(receipt)) return freeze({ ok: false, reason: 'duplicate-receipt', state });
    if (mission.status === 'locked') return freeze({ ok: false, reason: 'mission-locked' });
    if (mission.status !== 'active' || state.activeMissionId !== missionId) return freeze({ ok: false, reason: 'mission-not-active' });
    if (mission.currentObjective !== objectiveId) return freeze({ ok: false, reason: 'objective-out-of-order', expected: mission.currentObjective });
    const completedObjectives = unique([...mission.completedObjectives, objectiveId]);
    const nextObjective = def.objectives.find((candidate) => !completedObjectives.includes(candidate)) || '';
    const completed = !nextObjective;
    const awardReceipt = `xp:${missionId}`;
    const shouldAward = completed && !state.processedReceipts.includes(awardReceipt);
    const totalXp = state.totalXp + (shouldAward ? def.xp : 0);
    const nextMission = freeze({
      ...mission,
      status: completed ? 'completed' : 'active',
      currentObjective: nextObjective,
      completedObjectives,
      completedAt: completed ? now() : 0,
      xpAwarded: completed || mission.xpAwarded
    });
    commit({
      ...state,
      totalXp,
      activeMissionId: completed ? '' : missionId,
      completedMissions: completed ? [...state.completedMissions, missionId] : state.completedMissions,
      missions: { ...state.missions, [missionId]: nextMission },
      processedReceipts: [...state.processedReceipts, receipt, ...(shouldAward ? [awardReceipt] : [])],
      worldMilestones: completed ? [...state.worldMilestones, `mission:${missionId}`] : state.worldMilestones
    });
    return freeze({ ok: true, mission: state.missions[missionId], awardedXp: shouldAward ? def.xp : 0, totalXp: state.totalXp, level: state.currentLevel });
  }

  const api = {
    getState() { return state; },
    start(missionId, { explicitUserAction = false } = {}) {
      if (!explicitUserAction) return freeze({ ok: false, reason: 'explicit-user-action-required' });
      const def = definition(missionId);
      if (!def) return freeze({ ok: false, reason: 'mission-not-found' });
      const current = state.missions[missionId];
      if (current.status === 'locked') return freeze({ ok: false, reason: 'mission-locked' });
      if (current.status === 'completed') return freeze({ ok: false, reason: 'mission-already-completed' });
      if (state.activeMissionId && state.activeMissionId !== missionId) return freeze({ ok: false, reason: 'another-mission-active', activeMissionId: state.activeMissionId });
      if (current.status === 'active') return freeze({ ok: true, mission: current, resumed: true });
      const mission = freeze({ ...current, status: 'active', currentObjective: current.currentObjective || def.objectives[0] });
      commit({ ...state, activeMissionId: missionId, missions: { ...state.missions, [missionId]: mission } });
      return freeze({ ok: true, mission: state.missions[missionId] });
    },
    completeObjective(missionId, objectiveId, { receiptId = '' } = {}) {
      return completeObjectiveInternal(missionId, objectiveId, receiptId);
    },
    awardXp({ sourceId = '', amount = 0, receiptId = '' } = {}) {
      const safeSource = String(sourceId || '').trim();
      const safeReceipt = String(receiptId || '').trim();
      const safeAmount = Math.round(Number(amount || 0));
      if (!safeSource || !safeReceipt) return freeze({ ok: false, reason: 'source-and-receipt-required' });
      if (!Number.isFinite(safeAmount) || safeAmount <= 0 || safeAmount > 5000) return freeze({ ok: false, reason: 'xp-amount-invalid' });
      if (state.processedReceipts.includes(safeReceipt)) return freeze({ ok: false, reason: 'duplicate-receipt' });
      commit({
        ...state,
        totalXp: state.totalXp + safeAmount,
        processedReceipts: [...state.processedReceipts, safeReceipt],
        worldMilestones: [...state.worldMilestones, `xp-source:${safeSource}`]
      });
      return freeze({ ok: true, awardedXp: safeAmount, totalXp: state.totalXp, level: state.currentLevel, sourceId: safeSource });
    },
    addMilestone(milestone, { receiptId = '' } = {}) {
      const value = String(milestone || '').trim();
      const receipt = String(receiptId || `milestone:${value}`);
      if (!value) return freeze({ ok: false, reason: 'milestone-required' });
      if (state.processedReceipts.includes(receipt) || state.worldMilestones.includes(value)) return freeze({ ok: false, reason: 'duplicate-receipt' });
      commit({ ...state, processedReceipts: [...state.processedReceipts, receipt], worldMilestones: [...state.worldMilestones, value] });
      return freeze({ ok: true, milestone: value });
    },
    claimSignalVanguard({ explicitUserAction = false, receiptId = 'reward:signal-vanguard' } = {}) {
      if (!explicitUserAction) return freeze({ ok: false, reason: 'explicit-user-action-required' });
      if (!state.completedMissions.includes('horizon-reconnected')) return freeze({ ok: false, reason: 'horizon-mission-required' });
      const finalMission = state.missions['the-first-reveal'];
      if (!(finalMission?.status === 'active' && finalMission.currentObjective === 'claim-signal-vanguard' && finalMission.completedObjectives.includes('enter-vault-chamber'))) return freeze({ ok: false, reason: 'vault-chamber-entry-required' });
      if (state.processedReceipts.includes(receiptId) || state.ownedCosmetics.includes(EON_EXPANSE_W766G_SIGNAL_VANGUARD_REWARD.cosmeticId)) return freeze({ ok: false, reason: 'reward-already-claimed' });
      commit({
        ...state,
        processedReceipts: [...state.processedReceipts, receiptId],
        vaultReveals: [...state.vaultReveals, EON_EXPANSE_W766G_SIGNAL_VANGUARD_REWARD.id],
        ownedCosmetics: [...state.ownedCosmetics, EON_EXPANSE_W766G_SIGNAL_VANGUARD_REWARD.cosmeticId],
        worldMilestones: [...state.worldMilestones, 'vault:signal-vanguard-revealed']
      });
      return freeze({ ok: true, reward: EON_EXPANSE_W766G_SIGNAL_VANGUARD_REWARD });
    },
    selectCosmetic(cosmeticId, { explicitUserAction = false } = {}) {
      if (!explicitUserAction) return freeze({ ok: false, reason: 'explicit-user-action-required' });
      if (!state.ownedCosmetics.includes(cosmeticId)) return freeze({ ok: false, reason: 'cosmetic-not-owned' });
      const milestone = `cosmetic:${cosmeticId}:selected`;
      commit({ ...state, selectedCosmetic: cosmeticId, worldMilestones: [...state.worldMilestones, milestone] });
      return freeze({ ok: true, cosmeticId });
    },
    confirmCampaignReceipt({ explicitUserAction = false, receiptId = 'campaign:signal-restoration:complete' } = {}) {
      if (!explicitUserAction) return freeze({ ok: false, reason: 'explicit-user-action-required' });
      if (state.campaignReceipt) return freeze({ ok: false, reason: 'campaign-receipt-already-confirmed', receipt: state.campaignReceipt });
      const finalMission = state.missions['the-first-reveal'];
      if (!(finalMission?.status === 'active' && finalMission.currentObjective === 'confirm-campaign-receipt')) return freeze({ ok: false, reason: 'campaign-not-ready-for-confirmation' });
      const completion = completeObjectiveInternal('the-first-reveal', 'confirm-campaign-receipt', `${receiptId}:objective`);
      if (!completion.ok) return completion;
      const campaignReceipt = freeze({
        id: receiptId,
        campaignId: 'signal-restoration',
        completedAt: now(),
        totalXp: state.totalXp,
        cosmeticId: state.selectedCosmetic || EON_EXPANSE_W766G_SIGNAL_VANGUARD_REWARD.cosmeticId
      });
      commit({
        ...state,
        campaignReceipt,
        processedReceipts: [...state.processedReceipts, receiptId],
        worldMilestones: [...state.worldMilestones, 'campaign:signal-restoration:complete']
      });
      return freeze({ ok: true, receipt: campaignReceipt, mission: state.missions['the-first-reveal'] });
    },
    recordSignal(signal, payload = {}) {
      const map = {
        'expanse-reviewed': ['companion-in-the-static', 'review-expedition'],
        'expanse-entered': ['companion-in-the-static', 'enter-expanse'],
        'companion-signal-detected': ['companion-in-the-static', 'detect-companion-signal'],
        'dormant-eonbot-scanned': ['companion-in-the-static', 'scan-dormant-eonbot'],
        'companion-signal-core-recovered': ['companion-in-the-static', 'recover-signal-core'],
        'companion-link-restored': ['companion-in-the-static', 'restore-companion-link'],
        'pathfinder-met': ['beyond-the-gate', 'meet-pathfinder'],
        'map-opened': ['beyond-the-gate', 'activate-map'],
        'zone:gateway-overlook': ['beyond-the-gate', 'visit-overlook'],
        'zone:beacon-fields': ['first-light', 'reach-beacon-one'],
        'beacon-one-scanned': ['first-light', 'scan-beacon-one'],
        'signal-components-recovered': ['first-light', 'recover-signal-components'],
        'beacon-one-repaired': ['first-light', 'repair-beacon-one'],
        'beacon-fields-revealed': ['first-light', 'reveal-beacon-fields'],
        'zone:archive-ruins': ['echoes-in-the-archive', 'reach-archive-ruins'],
        'navigator-met': ['echoes-in-the-archive', 'meet-navigator'],
        'archive-records-recovered': ['echoes-in-the-archive', 'recover-archive-records'],
        'archive-routing-solved': ['echoes-in-the-archive', 'solve-signal-routing'],
        'beacon-two-repaired': ['echoes-in-the-archive', 'repair-beacon-two'],
        'zone:transit-scar': ['the-broken-line', 'reach-transit-scar'],
        'maintainer-met': ['the-broken-line', 'meet-maintainer'],
        'relay-nodes-activated': ['the-broken-line', 'activate-relay-nodes'],
        'transit-relay-stabilized': ['the-broken-line', 'stabilize-transit-relay'],
        'regional-transit-restored': ['the-broken-line', 'restore-regional-transit'],
        'zone:horizon-vault': ['horizon-reconnected', 'reach-horizon-vault'],
        'three-signals-verified': ['horizon-reconnected', 'verify-three-signals'],
        'regional-core-synchronized': ['horizon-reconnected', 'synchronize-regional-core'],
        'horizon-transit-unlocked': ['horizon-reconnected', 'unlock-horizon-transit'],
        'vault-route-opened': ['horizon-reconnected', 'open-vault-route'],
        'vault-chamber-entered': ['the-first-reveal', 'enter-vault-chamber'],
        'signal-vanguard-claimed': ['the-first-reveal', 'claim-signal-vanguard'],
        'signal-vanguard-activated': ['the-first-reveal', 'activate-cosmetic'],
        'command-hub-returned': ['the-first-reveal', 'return-command-hub']
      };
      const target = map[signal];
      if (!target) return freeze({ ok: false, reason: 'signal-unmapped' });
      const [missionId, objectiveId] = target;
      const receiptId = String(payload.receiptId || `signal:${signal}`);
      if (state.processedReceipts.includes(receiptId)) return freeze({ ok: false, reason: 'duplicate-receipt', state });
      const mission = state.missions[missionId];
      if (mission?.status === 'locked') return freeze({ ok: false, reason: 'mission-locked', missionId });
      if (mission?.status === 'available') {
        const started = api.start(missionId, { explicitUserAction: true });
        if (!started.ok) return started;
      }
      return completeObjectiveInternal(missionId, objectiveId, receiptId);
    }
  };
  return freeze(api);
}
