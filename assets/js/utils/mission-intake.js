/**
 * Mission intake helpers
 * ----------------------
 * Shared mission clarifier and preview copy used by Chat Mission Commander
 * and focused launch smokes.
 */

/**
 * @param {any} value
 * @returns {string}
 */
function sanitizeMissionInput(value = '') {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 2000);
}

/**
 * @param {any} goal
 * @param {any} autonomy
 * @param {any} approval
 * @param {any} language
 * @returns {string[]}
 */
export function buildMissionClarifiers(goal, autonomy, approval, language) {
  const questions = [];
  const cleanGoal = sanitizeMissionInput(goal || '');
  if (!cleanGoal || cleanGoal.length < 14) {
    questions.push('What outcome do you want me to produce?');
  }
  if (!cleanGoal || cleanGoal.split(/\s+/).length < 4) {
    questions.push('Which surface should the plan use: Chat, Create / Forge, Projects, or Research Lab?');
  }
  if (!autonomy || autonomy === 'auto') {
    questions.push('Should the plan stay hands-on, balanced, or maximize delegation?');
  }
  if (!approval || approval === 'normal') {
    questions.push('Should the plan flag every risky step for review, or use the normal review level?');
  }
  if (!language || language === 'auto') {
    questions.push('Which language should I use for the mission and updates?');
  }
  return questions.slice(0, 3);
}

/**
 * @param {any} goal
 * @param {any} autonomy
 * @param {any} approval
 * @param {any} budgetMode
 * @param {any} language
 * @returns {string}
 */
export function buildMissionPreview(goal, autonomy, approval, budgetMode, language) {
  const cleanGoal = sanitizeMissionInput(goal || '');
  const goalSummary = cleanGoal || 'a business mission';
  const delegationLabel = ({ guided: 'hands-on', balanced: 'balanced', autonomous: 'maximum delegation' })[String(autonomy || '').toLowerCase()] || 'balanced';
  const reviewLabel = ({ strict: 'review every risky step', normal: 'normal review', fast: 'fewer review pauses' })[String(approval || '').toLowerCase()] || 'normal review';
  return `Plan preview: ${goalSummary}. Language: ${language || 'auto'}. Delegation plan: ${delegationLabel}. Review level: ${reviewLabel}. Budget mode: ${budgetMode || 'auto'}. No background work starts from this preview.`;
}

/**
 * @param {any} goal
 * @param {any} autonomy
 * @param {any} approval
 * @param {any} budgetMode
 * @param {any} language
 * @returns {{ goal: string, clarifiers: string[], preview: string }}
 */
export function summarizeMissionIntake(goal, autonomy, approval, budgetMode, language) {
  return {
    goal: sanitizeMissionInput(goal || ''),
    clarifiers: buildMissionClarifiers(goal, autonomy, approval, language),
    preview: buildMissionPreview(goal, autonomy, approval, budgetMode, language)
  };
}
