/** RT91 — one-active-contract runtime for deterministic repeatable missions. */
export const EON_CITY_RT91_REPEATABLE_RUNTIME_SCHEMA = 'eon.city.repeatable-contract-runtime.rt91.v1';
const freeze = Object.freeze;
const WORLDS = new Set(['signal-frontier', 'storm-sector', 'my-frontier']);
const SAFE_ID = /^[a-z0-9][a-z0-9:._-]{0,179}$/i;
const cleanId = (value = '') => SAFE_ID.test(String(value || '').trim()) ? String(value || '').trim() : '';
const text = (value = '', max = 180) => String(value || '').slice(0, max);

export function sanitizeEonCityRt91ActiveContract(input = null) {
  if (!input || typeof input !== 'object' || !cleanId(input.id) || !WORLDS.has(String(input.worldId || ''))) return null;
  const objectives = (Array.isArray(input.objectives) ? input.objectives : []).slice(0, 4).map((row) => freeze({
    id: cleanId(row?.id), verb: cleanId(row?.verb), cellRole: cleanId(row?.cellRole), action: cleanId(row?.action), label: text(row?.label, 120), automaticCompletion: false
  })).filter((row) => row.id);
  const objectiveIds = new Set(objectives.map((row) => row.id));
  const placements = (Array.isArray(input.placements) ? input.placements : []).slice(0, 4).map((row) => freeze({
    objectiveId: cleanId(row?.objectiveId), cellId: cleanId(row?.cellId), zoneId: cleanId(row?.zoneId), regionId: cleanId(row?.regionId),
    position: freeze({ x: Number(row?.position?.x || 0), y: Number(row?.position?.y || 0), z: Number(row?.position?.z || 0) })
  })).filter((row) => objectiveIds.has(row.objectiveId) && [row.position.x, row.position.y, row.position.z].every(Number.isFinite));
  if (!objectives.length || placements.length !== objectives.length) return null;
  const completedObjectiveIds = freeze([...(new Set((Array.isArray(input.completedObjectiveIds) ? input.completedObjectiveIds : []).map(cleanId).filter((id) => objectiveIds.has(id))))]);
  return freeze({
    id: cleanId(input.id), worldId: String(input.worldId), familyId: cleanId(input.familyId), cycleKey: text(input.cycleKey, 64), label: text(input.label, 140),
    objectives: freeze(objectives), placements: freeze(placements), completedObjectiveIds,
    startedAt: Math.max(0, Number(input.startedAt || 0)), awardsXp: false, writesProgression: false, privateContentStored: false, acceptsRawUserCoordinates: false
  });
}

function snapshotOffer(offer, at) {
  return sanitizeEonCityRt91ActiveContract({
    id: offer?.template?.id, worldId: offer?.worldId, familyId: offer?.familyId, cycleKey: offer?.cycleKey, label: offer?.template?.label,
    objectives: offer?.template?.objectives, placements: offer?.placement?.placements, completedObjectiveIds: [], startedAt: at
  });
}

export function createEonCityRt91RepeatableContractRuntime({ initialActiveContract = null, now = () => Date.now(), getOffers = () => [], verifyObjectiveReceipt = null, onChange = null } = {}) {
  let active = sanitizeEonCityRt91ActiveContract(initialActiveContract);
  const commit = (next, reason) => { active = sanitizeEonCityRt91ActiveContract(next); onChange?.(freeze({ activeContract: active, reason })); return active; };
  const getActiveObjective = () => active?.objectives?.find((row) => !active.completedObjectiveIds.includes(row.id)) || null;
  const getActiveTarget = () => {
    const objective = getActiveObjective();
    if (!active || !objective) return null;
    const placement = active.placements.find((row) => row.objectiveId === objective.id);
    return placement ? freeze({
      worldId: active.worldId, missionId: active.id, objectiveId: objective.id, missionLabel: active.label, objectiveLabel: objective.label,
      targetId: `rt91-contract:${active.id}:${objective.id}`, position: placement.position, cellId: placement.cellId, zoneId: placement.zoneId, regionId: placement.regionId,
      interactionRange: 3.4, repeatableContract: true, requiresExplicitUserAction: true, grantsXp: false, writesProgression: false
    }) : null;
  };
  const getView = () => {
    const offers = getOffers?.() || [];
    return freeze({
      schema: `${EON_CITY_RT91_REPEATABLE_RUNTIME_SCHEMA}.view.v1`, activeContract: active ? freeze({ ...active, activeObjective: getActiveObjective() }) : null,
      offers: freeze(offers.map((offer) => freeze({ ...offer, status: active?.id === offer?.template?.id ? 'active' : 'available', activeObjective: active?.id === offer?.template?.id ? getActiveObjective() : null }))),
      awardsXp: false, writesProgression: false, runtimeAiRequired: false
    });
  };
  const startContract = (contractId = '', { explicitUserAction = false } = {}) => {
    if (!explicitUserAction) return freeze({ ok: false, reason: 'explicit-user-action-required' });
    if (active) return freeze({ ok: false, reason: active.id === String(contractId || '') ? 'contract-already-active' : 'another-repeatable-contract-active', activeContractId: active.id });
    const offer = (getOffers?.() || []).find((row) => row?.ok === true && row?.template?.id === String(contractId || ''));
    if (!offer) return freeze({ ok: false, reason: 'repeatable-contract-offer-not-found' });
    const next = snapshotOffer(offer, now());
    if (!next) return freeze({ ok: false, reason: 'repeatable-contract-snapshot-invalid' });
    commit(next, 'contract-started');
    return freeze({ ok: true, contractId: next.id, worldId: next.worldId, activeObjective: getActiveObjective(), awardsXp: false, writesProgression: false });
  };
  const completeObjective = (objectiveId = '', { explicitUserAction = false, receipt = null } = {}) => {
    if (!explicitUserAction) return freeze({ ok: false, reason: 'explicit-user-action-required' });
    if (!active) return freeze({ ok: false, reason: 'repeatable-contract-not-active' });
    const objective = getActiveObjective();
    if (!objective || objective.id !== String(objectiveId || '')) return freeze({ ok: false, reason: 'repeatable-objective-not-active' });
    if (typeof verifyObjectiveReceipt !== 'function') return freeze({ ok: false, reason: 'objective-receipt-authority-unavailable' });
    const verified = verifyObjectiveReceipt({ mission: freeze({ id: active.id, worldId: active.worldId }), objective, receipt });
    if (!verified?.ok || !verified?.receipt?.id) return freeze({ ok: false, reason: verified?.reason || 'valid-objective-receipt-required' });
    const completedObjectiveIds = freeze([...active.completedObjectiveIds, objective.id]);
    const contractComplete = completedObjectiveIds.length === active.objectives.length;
    const completedContract = contractComplete ? freeze({ ...active, completedObjectiveIds }) : null;
    commit(contractComplete ? null : { ...active, completedObjectiveIds }, contractComplete ? 'contract-completed' : 'objective-completed');
    return freeze({ ok: true, contractId: completedContract?.id || active?.id || '', objectiveId: objective.id, receiptId: verified.receipt.id, contractComplete, completedContract, nextObjective: contractComplete ? null : getActiveObjective(), awardsXp: false, writesProgression: false });
  };
  return freeze({
    schema: EON_CITY_RT91_REPEATABLE_RUNTIME_SCHEMA, getView, getActiveContract: () => active, getActiveTarget, startContract, completeObjective,
    clearActive: ({ explicitUserAction = false } = {}) => explicitUserAction ? freeze({ ok: true, cleared: Boolean(commit(null, 'explicit-clear')) === false }) : freeze({ ok: false, reason: 'explicit-user-action-required' }),
    awardsXp: false, writesProgression: false, ownsWorldGeometry: false, ownsNavigation: false, runtimeAiRequired: false
  });
}

export default freeze({ EON_CITY_RT91_REPEATABLE_RUNTIME_SCHEMA, sanitizeEonCityRt91ActiveContract, createEonCityRt91RepeatableContractRuntime });
