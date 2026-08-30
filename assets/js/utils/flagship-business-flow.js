/**
 * Flagship business flow helpers
 * Turns EONAPP into one clear user journey for non-technical users.
 */

export const FLAGSHIP_BUSINESS_STEPS = [
  {
    id: 'clarify',
    title: 'Clarify the offer',
    summary: 'Define the niche, offer, audience, and promise in plain language.',
    mode: 'guide'
  },
  {
    id: 'build',
    title: 'Build the business assets',
    summary: 'Create the landing page, brand copy, FAQ, lead capture, and a publish-ready website/app handoff bundle.',
    mode: 'build'
  },
  {
    id: 'create',
    title: 'Create content',
    summary: 'Generate scripts, posts, visuals, subtitles, and launch assets in the creator stack.',
    mode: 'creator'
  },
  {
    id: 'promote',
    title: 'Promote safely',
    summary: 'Prepare browser-assisted posting, outreach, Cloudflare/GitHub handoff, and follow-up with approvals.',
    mode: 'agent'
  }
];

export function sanitizeBusinessField(value = '', fallback = '') {
  const clean = String(value || '').replace(/\s+/g, ' ').trim();
  return clean || fallback;
}

export function normalizeBusinessProfile(input = {}) {
  return {
    businessName: sanitizeBusinessField(input.businessName, 'my business'),
    niche: sanitizeBusinessField(input.niche, 'my niche'),
    offer: sanitizeBusinessField(input.offer, 'my offer'),
    audience: sanitizeBusinessField(input.audience, 'my target audience'),
    primaryGoal: sanitizeBusinessField(input.primaryGoal, 'launch and grow my business'),
    channels: sanitizeBusinessField(input.channels, 'website, content, and browser-assisted promotion'),
    urgency: sanitizeBusinessField(input.urgency, 'this week')
  };
}

export function buildFlagshipBusinessPrompt(input = {}, kind = 'launch') {
  const profile = normalizeBusinessProfile(input);
  const common = `Business: ${profile.businessName}. Niche: ${profile.niche}. Offer: ${profile.offer}. Audience: ${profile.audience}. Goal: ${profile.primaryGoal}. Channels: ${profile.channels}. Timeframe: ${profile.urgency}.`;

  if (kind === 'growth') {
    return `${common} Run the flagship business growth flow. First clarify the strongest growth priorities with the minimum questions needed. Then audit my current positioning, improve the website and offer copy, design a content plan, prepare browser-assisted promotion steps, draft outreach and posting tasks, define approval checkpoints, and end with a 7-day growth operating plan with clear daily actions and receipts.`;
  }

  if (kind === 'content') {
    return `${common} Run the flagship business content flow. First clarify the business message with the minimum questions needed. Then produce a business content package: landing-page hero copy, about section, FAQ starter, first social post, first short-form video script, visual prompt ideas, subtitle plan, and a publish checklist that clearly marks which external actions need approval.`;
  }

  return `${common} Run the flagship business launch flow. First ask only the minimum questions needed to clarify my niche and offer. Then create: positioning, website structure, landing page copy, FAQ and contact copy, creator asset plan, first promotion plan, a publish-ready deploy bundle with Cloudflare Pages as the default fast-launch target, browser-assisted launch steps, approval checkpoints, and a clean follow-up task list. Keep the flow understandable for a non-technical founder.`;
}

export function buildFlagshipBusinessChecklist(input = {}, kind = 'launch') {
  const profile = normalizeBusinessProfile(input);
  const shared = [
    `Business: ${profile.businessName}`,
    `Niche: ${profile.niche}`,
    `Offer: ${profile.offer}`,
    `Audience: ${profile.audience}`,
    `Goal: ${profile.primaryGoal}`
  ];
  if (kind === 'growth') {
    return [
      ...shared,
      'Audit current positioning',
      'Improve site and offer copy',
      'Prepare creator content pipeline',
      'Prepare browser-assisted promotion steps',
      'Set approval checkpoints',
      'Generate 7-day growth plan'
    ];
  }
  if (kind === 'content') {
    return [
      ...shared,
      'Clarify brand message',
      'Generate launch copy',
      'Generate first post + first video script',
      'Create visual prompts and subtitle plan',
      'Prepare publish checklist'
    ];
  }
  return [
    ...shared,
    'Clarify niche and offer',
    'Build landing-page structure',
    'Generate launch copy + FAQ',
    'Prepare creator asset plan',
    'Prepare browser-assisted launch steps',
      'Prepare Cloudflare Pages handoff bundle',
    'Schedule follow-up tasks'
  ];
}

export function getFlagshipBusinessCards() {
  return [
    {
      id: 'launch',
      title: 'Launch my business',
      mode: 'build',
      summary: 'Best for first launch: website, positioning, copy, FAQ, first promotion, and follow-up tasks.'
    },
    {
      id: 'growth',
      title: 'Grow my business',
      mode: 'agent',
      summary: 'Best for operators with an existing business: growth audit, campaign plan, outreach, and 7-day execution.'
    },
    {
      id: 'content',
      title: 'Create business content',
      mode: 'creator',
      summary: 'Best for founders who need posts, scripts, visuals, subtitles, and a publish checklist.'
    }
  ];
}
