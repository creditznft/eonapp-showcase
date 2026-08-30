export const /** @type {any} */
PERSONA_PLAYBOOKS = {
  creator: {
    id: 'creator',
    title: 'Creator Operator',
    goals: ['Publish 5 high-quality assets/week', 'Increase engagement 20% month-over-month'],
    dailyBriefing: ['Pick one content pillar', 'Ship one short + one repurpose', 'Review performance and iterate']
  },
  trader: {
    id: 'trader',
    title: 'Signal Trader',
    goals: ['Log every thesis', 'Respect max daily loss', 'Only activate strategies with explicit approvals'],
    dailyBriefing: ['Review macro + watchlist', 'Check thesis invalidation alerts', 'Journal outcomes']
  },
  operator: {
    id: 'operator',
    title: 'Business Operator',
    goals: ['Maintain weekly KPI board', 'Close top 3 bottlenecks', 'Protect runway and conversion rate'],
    dailyBriefing: ['Run inbox approvals', 'Update task board', 'Send growth summary']
  },
  founder: {
    id: 'founder',
    title: 'Founder Command',
    goals: ['Decide priorities with evidence', 'Enforce risk policies', 'Maintain execution cadence'],
    dailyBriefing: ['Read AI boardroom summary', 'Approve high-risk actions', 'Commit next 24h plan']
  }
};

export function getPersonaPlaybook(/** @type {any} */ personaId = 'operator') {
  return PERSONA_PLAYBOOKS[personaId] || PERSONA_PLAYBOOKS.operator;
}
