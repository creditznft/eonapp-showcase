/**
 * W331 — tiny local command intake for EONBOT.
 *
 * This replaces the legacy agent-orchestrator parser. It recognizes only a
 * local plan request and never starts an executor, network job, schedule, or
 * external action.
 */
function clean(value = '', max = 1200) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, max);
}

export function parseEonKernelPlanCommand(text = '') {
  const input = clean(text);
  if (!input) return null;
  const directPrefix = input.match(/^\/(agent|orchestrate|pipeline)\s+(.+)$/i);
  if (directPrefix) {
    return Object.freeze({
      command: 'local-plan',
      payload: clean(directPrefix[2]),
      foregroundOnly: true,
      externalExecution: false
    });
  }
  if (/\b(run|start|execute)\b.*\b(pipeline|workflow)\b/i.test(input)) {
    return Object.freeze({
      command: 'local-plan',
      payload: input,
      foregroundOnly: true,
      externalExecution: false
    });
  }
  return null;
}

export function getEonKernelCommandIntakeTruth() {
  return Object.freeze({
    localOnly: true,
    foregroundOnly: true,
    executorImport: false,
    network: false,
    externalExecution: false,
    rawInputStored: false
  });
}
