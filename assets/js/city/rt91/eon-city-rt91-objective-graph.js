/** RT91 — deterministic objective graph. Owns sequencing only; never awards or persists progression. */
export const EON_CITY_RT91_OBJECTIVE_GRAPH_SCHEMA = 'eon.city.objective-graph.rt91.v1';

const freeze = Object.freeze;
const clean = (value = '') => String(value || '').trim().toLowerCase();
const frozenArray = (values = []) => freeze([...values]);

function normalizeNode(objective = {}, index = 0, previousId = '') {
  const id = clean(objective.id || objective.action || `objective-${index + 1}`);
  const dependencies = Array.isArray(objective.dependsOn)
    ? objective.dependsOn.map(clean).filter(Boolean)
    : previousId ? [previousId] : [];
  return freeze({
    id,
    index,
    verb: clean(objective.verb),
    action: clean(objective.action),
    cellRole: clean(objective.cellRole),
    label: String(objective.label || objective.action || id).trim().slice(0, 160),
    dependsOn: frozenArray([...new Set(dependencies)]),
    optional: objective.optional === true,
    automaticCompletion: false
  });
}

export function createEonCityRt91ObjectiveGraph({ missionId = '', objectives = [] } = {}) {
  let previousId = '';
  const nodes = (Array.isArray(objectives) ? objectives : []).map((objective, index) => {
    const node = normalizeNode(objective, index, previousId);
    previousId = node.id;
    return node;
  });
  return freeze({
    schema: EON_CITY_RT91_OBJECTIVE_GRAPH_SCHEMA,
    missionId: clean(missionId),
    nodes: freeze(nodes),
    nodeCount: nodes.length,
    deterministic: true,
    branchingSupported: nodes.some((node) => node.dependsOn.length !== (node.index === 0 ? 0 : 1)),
    awardsXp: false,
    writesProgression: false,
    networkRequestCreated: false
  });
}

function cycleExists(nodes = []) {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const visiting = new Set();
  const visited = new Set();
  const visit = (id) => {
    if (visiting.has(id)) return true;
    if (visited.has(id)) return false;
    visiting.add(id);
    for (const dependency of byId.get(id)?.dependsOn || []) if (visit(dependency)) return true;
    visiting.delete(id);
    visited.add(id);
    return false;
  };
  return nodes.some((node) => visit(node.id));
}

export function validateEonCityRt91ObjectiveGraph(graph = {}) {
  const errors = [];
  const nodes = Array.isArray(graph?.nodes) ? graph.nodes : [];
  const ids = new Set(nodes.map((node) => node?.id));
  if (graph?.schema !== EON_CITY_RT91_OBJECTIVE_GRAPH_SCHEMA) errors.push('schema');
  if (!/^[a-z0-9-]{3,120}$/.test(clean(graph?.missionId))) errors.push('mission-id');
  if (nodes.length < 2 || nodes.length > 8 || ids.size !== nodes.length) errors.push('node-count-or-duplicate');
  for (const node of nodes) {
    if (!/^[a-z0-9-]{3,120}$/.test(node?.id) || !node?.verb || !node?.action || !node?.cellRole) errors.push(`node:${node?.id || 'unknown'}`);
    for (const dependency of node?.dependsOn || []) {
      if (!ids.has(dependency)) errors.push(`unknown-dependency:${node.id}:${dependency}`);
      if (dependency === node.id) errors.push(`self-dependency:${node.id}`);
    }
    if (node?.automaticCompletion !== false) errors.push(`automatic-completion:${node?.id || 'unknown'}`);
  }
  if (cycleExists(nodes)) errors.push('cycle');
  if (graph?.awardsXp !== false || graph?.writesProgression !== false || graph?.networkRequestCreated !== false) errors.push('authority-boundary');
  return freeze({ ok: errors.length === 0, errors: frozenArray(errors), nodeCount: nodes.length });
}

export function deriveEonCityRt91ObjectiveGraphView(graph = {}, { completedObjectiveIds = [] } = {}) {
  const completed = new Set((completedObjectiveIds || []).map(clean).filter(Boolean));
  const nodes = Array.isArray(graph?.nodes) ? graph.nodes : [];
  const rows = nodes.map((node) => {
    const done = completed.has(node.id);
    const dependenciesSatisfied = node.dependsOn.every((dependency) => completed.has(dependency));
    return freeze({
      id: node.id,
      label: node.label,
      verb: node.verb,
      cellRole: node.cellRole,
      completed: done,
      available: !done && dependenciesSatisfied,
      blocked: !done && !dependenciesSatisfied,
      optional: node.optional
    });
  });
  const required = rows.filter((row) => !row.optional);
  const completedRequired = required.filter((row) => row.completed).length;
  return freeze({
    schema: `${EON_CITY_RT91_OBJECTIVE_GRAPH_SCHEMA}.view.v1`,
    missionId: graph?.missionId || '',
    rows: freeze(rows),
    activeObjectiveIds: freeze(rows.filter((row) => row.available).map((row) => row.id)),
    completedRequired,
    totalRequired: required.length,
    complete: required.length > 0 && completedRequired === required.length,
    grantsProgression: false
  });
}

export default freeze({ EON_CITY_RT91_OBJECTIVE_GRAPH_SCHEMA, createEonCityRt91ObjectiveGraph, validateEonCityRt91ObjectiveGraph, deriveEonCityRt91ObjectiveGraphView });
