export const /** @type {any} */
TOOLS = [
  {
    id: 'archetype-scan',
    title: 'Archetype Deep Scan',
    desc: '12 Jungian archetypes · 15 deep questions · Shadow self, hidden gifts, and compatibility revealed.',
    category: 'Personality',
    icon: '🧬',
    url: '/tools/archetype-scan.html',
    viral: 10,
    profit: 9,
    status: 'live',
    featured: false
  },
  {
    id: 'dream-interpreter',
    title: 'Dream Interpreter AI',
    desc: 'Describe your dream. We detect symbols, ask follow-up questions, and reveal the Jungian meaning. 400+ symbols.',
    category: 'Mystical',
    icon: '🌙',
    url: '/tools/dream-interpreter.html',
    viral: 10,
    profit: 8,
    status: 'live',
    featured: false
  },
  {
    id: 'creator-workspace',
    title: 'Creator Workspace',
    desc: 'Plan content, track sponsors and campaigns, save viral hooks, and earn creator participation value — all local-first.',
    category: 'Creator',
    icon: '🎬',
    url: '/tools/creator-workspace.html',
    viral: 8,
    profit: 9,
    status: 'flagship',
    featured: true
  }
];

export const GAMES = /** @type {any[]} */ ([
  {
    id: 'realmworld',
    title: 'EON RealmWorld',
    desc: 'The single flagship EONAPP game: a local-first metaverse realm where Vault identity, NFTs, lootbox events, Market products, and EONBOT become an interactive world.',
    category: 'Metaverse',
    icon: '🌌',
    url: '/realmworld.html',
    viral: 9,
    profit: 8,
    status: 'flagship',
    featured: true,
    preview: 'realmworld-preview'
  }
]);

export const /** @type {any} */
BLOG_CLUSTERS = [
  {
    id: 'tool-explainers',
    title: 'Tool explainers + result decoders',
    desc: 'Explain what the score means, why the output matters, and what users should try next.',
    label: 'Pillar + explainer',
    priority: 'High',
    intent: 'Tool-support SEO',
    cta: 'See live tools',
    url: '/build'
  },
  {
    id: 'comparison-pages',
    title: 'Comparisons + alternatives',
    desc: 'Best for search traffic with clear intent: versus pages, ranking pages, and "best free" comparisons.',
    label: 'Comparison',
    priority: 'High',
    intent: 'Search intent',
    cta: 'Open workbench',
    url: '/build'
  },
  {
    id: 'finance-guides',
    title: 'Finance + calculator guides',
    desc: 'Higher-trust explainers for ROI, DCA, scenario planning, and decision support.',
    label: 'Utility + finance',
    priority: 'High',
    intent: 'Trust-heavy traffic',
    cta: 'Open Research Lab',
    url: '/insights'
  },
  {
    id: 'growth-systems',
    title: 'Growth ops + monetization systems',
    desc: 'Operator-facing pages about invite loops, vault exports, CPA guardrails, and content recirculation.',
    label: 'Growth ops',
    priority: 'Medium',
    intent: 'Operator docs',
    cta: 'Review monetization',
    url: '/about.html#monetization'
  }
];

export const FLAGSHIP_TOOLS = TOOLS.filter((/** @type {any} */ tool) => tool.status === 'flagship');
export const FLAGSHIP_GAMES = GAMES.filter((/** @type {any} */ game) => game.status === 'flagship');
export const ACTIVE_TOOLS = TOOLS.filter((/** @type {any} */ tool) => tool.status !== 'archived');
export const ACTIVE_GAMES = GAMES.filter((/** @type {any} */ game) => game.status !== 'archived');
export const ARCHIVED_TOOLS = TOOLS.filter((/** @type {any} */ tool) => tool.status === 'archived');
export const ARCHIVED_GAMES = GAMES.filter((/** @type {any} */ game) => game.status === 'archived');
export const FEATURED_TOOLS = FLAGSHIP_TOOLS.slice(0, 3);
export const FEATURED_GAMES = FLAGSHIP_GAMES.slice(0, 3);

export function countLiveItems(/** @type {any} */ type) {
  const source = type === 'game' ? ACTIVE_GAMES : ACTIVE_TOOLS;
  return source.length;
}

export function countFlagshipItems(/** @type {any} */ type) {
  const source = type === 'game' ? FLAGSHIP_GAMES : FLAGSHIP_TOOLS;
  return source.length;
}

export function getItems(/** @type {any} */ type, /** @type {any} */ status) {
  const source = type === 'game' ? GAMES : TOOLS;
  if (!status) return source;
  return source.filter((/** @type {any} */ item) => item.status === status);
}
