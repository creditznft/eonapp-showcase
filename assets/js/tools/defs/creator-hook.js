import { ToolEngine } from '../ToolEngine.js';

const /** @type {any} */
PLATFORM_LABELS = {
  tiktok: 'TikTok',
  reels: 'Instagram Reels',
  youtube: 'YouTube',
  twitter: 'X/Twitter',
  linkedin: 'LinkedIn',
  newsletter: 'Newsletter'
};

const /** @type {any} */
AUDIENCE_LABELS = {
  general: 'General audience',
  niche: 'Niche audience',
  professional: 'Professional audience',
  youth: 'Youth audience'
};

const /** @type {any} */
GOAL_LABELS = {
  views: 'Views',
  shares: 'Shares',
  clicks: 'Clicks',
  saves: 'Saves'
};

const /** @type {any} */
STYLE_LABELS = {
  howto: 'How-to',
  story: 'Story',
  contrarian: 'Contrarian',
  list: 'List',
  warning: 'Warning'
};

function getScoreLabel(/** @type {any} */ score) {
  if (score <= 50) return 'Needs Work';
  if (score <= 70) return 'Solid Base';
  if (score <= 85) return 'Strong';
  return 'Viral Ready';
}

function getScoreColor(/** @type {any} */ score) {
  if (score >= 80) return '#22c55e';
  if (score >= 60) return '#f59e0b';
  return '#ef4444';
}

function getPlatformAdvice(/** @type {any} */ platform, /** @type {any} */ topStyle) {
  const /** @type {any} */
advice = {
    tiktok: {
      story: 'Lead with the punchline in the first second, then tell the backstory fast.',
      contrarian: 'Use bold opener text on screen so the disagreement is visible before the swipe.',
      warning: 'Frame the pain first, then reveal the fix within 3 seconds.',
      howto: 'Turn the process into quick cuts with one step per visual beat.',
      list: 'Flash the number immediately and keep each item under one sentence.'
    },
    reels: {
      story: 'Open on the turning point, not the setup, so retention stays high.',
      contrarian: 'Pair the hot take with a strong facial reaction or pattern break visual.',
      warning: 'Use a direct “stop doing this” opener with captions large enough for silent viewers.',
      howto: 'Condense your framework into a crisp before/after transformation.',
      list: 'Keep each point visually distinct so viewers stay for the final item.'
    },
    youtube: {
      story: 'Promise the lesson early, then earn the longer watch time with context.',
      contrarian: 'Make the claim specific so curiosity beats skepticism in the thumbnail/title combo.',
      warning: 'Tie the mistake to a concrete outcome viewers want to avoid.',
      howto: 'Specificity wins here—mention the exact process or breakdown viewers will get.',
      list: 'Use the numbered structure to signal complete, bingeable value.'
    },
    twitter: {
      story: 'Keep the first line tight enough to stand alone before the “show more” fold.',
      contrarian: 'Sharp opinions outperform soft ones—state the reversal clearly and briefly.',
      warning: 'Call out the costly mistake first so quote tweets and replies spike.',
      howto: 'Make the payoff obvious in one line, then unpack the method in the thread.',
      list: 'Use the number to promise compressed insight people can instantly share.'
    },
    linkedin: {
      story: 'Ground the hook in a professional lesson or career outcome to raise trust.',
      contrarian: 'Aim for thoughtful disagreement, not shock, so professionals keep reading.',
      warning: 'Tie the warning to wasted time, money, or reputation for stronger relevance.',
      howto: 'Outcome-first hooks perform well when they sound practical and proven.',
      list: 'Executives love skimmable frameworks—make each point feel useful at work.'
    },
    newsletter: {
      story: 'Use the hook as a subject-line style opener that earns the full read.',
      contrarian: 'Make the twist intellectually satisfying so subscribers feel smart sharing it.',
      warning: 'Stress the overlooked risk that readers can fix immediately.',
      howto: 'Promise a step-by-step payoff readers will want to save for later.',
      list: 'List hooks are strong here because they preview structured value instantly.'
    }
  };

  return advice[platform]?.[topStyle] || 'Match the first line to the platform’s fastest attention pattern and make the value obvious instantly.';
}

const /** @type {any} */
def = {
  id: 'creator-hook',
  title: 'Creator Hook Optimizer',
  metaTitle: 'Creator Hook Optimizer — Score Your Content Hooks | EONAPP.ch',
  metaDesc: 'Enter your content idea and platform. Get 5 viral hook angles scored by proven formula. Free, instant, no account needed.',
  category: '📣 Creator Tools',
  description: 'Drop in your topic, audience, and platform. Get 5 deterministic viral hook angles scored for your exact content setup.',
  rewardProfile: 'productivity',
  disableOfferwall: true,
  runLabel: '⚡ Score My Hooks',
  fields: [
    {
      id: 'topic',
      type: 'text',
      required: true,
      placeholder: 'e.g. morning routine, crypto investing, weight loss',
      label: 'What is your content about?'
    },
    {
      id: 'platform',
      type: 'choice',
      label: 'Primary platform',
      options: [
        { value: 'tiktok', label: '🎵 TikTok' },
        { value: 'reels', label: '🎬 Reels' },
        { value: 'youtube', label: '▶️ YouTube' },
        { value: 'twitter', label: '🐦 X/Twitter' },
        { value: 'linkedin', label: '💼 LinkedIn' },
        { value: 'newsletter', label: '✉️ Newsletter' }
      ]
    },
    {
      id: 'audience',
      type: 'choice',
      label: 'Who is your audience?',
      options: [
        { value: 'general', label: '🌍 General' },
        { value: 'niche', label: '🎯 Niche' },
        { value: 'professional', label: '🧠 Professional' },
        { value: 'youth', label: '⚡ Youth' }
      ]
    },
    {
      id: 'contentType',
      type: 'choice',
      label: 'Content style you prefer',
      options: [
        { value: 'howto', label: '🎯 How-to' },
        { value: 'story', label: '📖 Story' },
        { value: 'contrarian', label: '🔄 Contrarian' },
        { value: 'list', label: '📋 List' },
        { value: 'warning', label: '⚠️ Warning' }
      ]
    },
    {
      id: 'goal',
      type: 'choice',
      label: 'Primary goal for this piece',
      options: [
        { value: 'views', label: '👀 Views' },
        { value: 'shares', label: '🔁 Shares' },
        { value: 'clicks', label: '🖱️ Clicks' },
        { value: 'saves', label: '💾 Saves' }
      ]
    },
    {
      id: 'currentFollowers',
      type: 'choice',
      label: 'Your current following',
      options: [
        { value: '0-1k', label: '🌱 0–1k' },
        { value: '1k-10k', label: '📈 1k–10k' },
        { value: '10k-100k', label: '🚀 10k–100k' },
        { value: '100k+', label: '🏆 100k+' }
      ]
    }
  ],
  compute(/** @type {any} */ inputs) {
    const /** @type {any} */
platformBonus = {
      tiktok: { story: 1.3, contrarian: 1.2, warning: 1.1, howto: 0.9, list: 0.9 },
      reels: { story: 1.3, contrarian: 1.1, warning: 1.2, howto: 1.0, list: 0.9 },
      youtube: { howto: 1.3, list: 1.2, story: 1.1, warning: 1.0, contrarian: 0.9 },
      twitter: { contrarian: 1.4, warning: 1.2, story: 1.0, howto: 0.9, list: 0.8 },
      linkedin: { howto: 1.2, list: 1.1, story: 1.2, contrarian: 0.9, warning: 0.8 },
      newsletter: { list: 1.3, howto: 1.2, story: 1.1, warning: 1.0, contrarian: 0.9 }
    };

    const /** @type {any} */
audienceBonus = {
      general: { story: 1.2, warning: 1.1, contrarian: 0.9, howto: 1.0, list: 1.1 },
      niche: { contrarian: 1.3, howto: 1.2, list: 1.1, story: 0.9, warning: 1.0 },
      professional: { howto: 1.3, list: 1.2, contrarian: 1.1, story: 0.9, warning: 0.8 },
      youth: { story: 1.3, warning: 1.2, contrarian: 1.1, list: 1.0, howto: 0.9 }
    };

    const /** @type {any} */
goalBonus = {
      views: { warning: 1.3, contrarian: 1.2, story: 1.1, howto: 1.0, list: 0.9 },
      shares: { contrarian: 1.3, warning: 1.2, list: 1.1, story: 1.0, howto: 0.9 },
      clicks: { howto: 1.3, warning: 1.2, list: 1.1, contrarian: 1.0, story: 0.9 },
      saves: { list: 1.4, howto: 1.3, warning: 1.0, story: 0.9, contrarian: 0.8 }
    };

    const topic = (inputs.topic || 'your topic').trim() || 'your topic';
    const topicCap = topic.charAt(0).toUpperCase() + topic.slice(1);
    const pb = platformBonus[inputs.platform] || platformBonus.tiktok;
    const ab = audienceBonus[inputs.audience] || audienceBonus.general;
    const gb = goalBonus[inputs.goal] || goalBonus.views;

    function score(/** @type {any} */ style) {
      return Math.min(99, Math.round(65 * (pb[style] || 1) * (ab[style] || 1) * (gb[style] || 1)));
    }

    const /** @type {any} */
hooks = [
      {
        style: 'warning',
        formula: 'Warning Hook',
        emoji: '⚠️',
        hook: `Stop doing ${topic} this way — here's what actually works`,
        why: 'Creates fear of missing out and positions you as the authority who knows the secret.',
        score: score('warning')
      },
      {
        style: 'contrarian',
        formula: 'Contrarian Hook',
        emoji: '🔄',
        hook: `Why everything you know about ${topic} is backwards`,
        why: 'Challenges existing belief. Forces the viewer to either agree (share) or disagree (comment) — both are engagement.',
        score: score('contrarian')
      },
      {
        style: 'story',
        formula: 'Story Hook',
        emoji: '📖',
        hook: `I spent 6 months on ${topic}. Here's the one thing I wish someone told me`,
        why: 'Personal credibility + emotional connection + curiosity loop. Strong across all platforms.',
        score: score('story')
      },
      {
        style: 'howto',
        formula: 'How-To Hook',
        emoji: '🎯',
        hook: `The exact process I use for ${topic} (complete breakdown)`,
        why: 'High save rate. People bookmark actionable content. Strong on YouTube and LinkedIn.',
        score: score('howto')
      },
      {
        style: 'list',
        formula: 'List Hook',
        emoji: '📋',
        hook: `7 things about ${topic} that no one teaches you`,
        why: 'Numbered lists signal clear value delivery. Viewers know what they\'re getting. High click-through.',
        score: score('list')
      }
    ];

    hooks.sort((/** @type {any} */ a, /** @type {any} */ b) => b.score - a.score);

    const topHook = hooks[0];
    const overallScore = Math.round(hooks.slice(0, 3).reduce((/** @type {any} */ s, /** @type {any} */ h) => s + h.score, 0) / 3);
    const platformLabel = PLATFORM_LABELS[inputs.platform] || 'your platform';

    return {
      hooks,
      topHook,
      overallScore,
      topic,
      topicCap,
      platformLabel,
      platform: inputs.platform,
      audience: inputs.audience,
      goal: inputs.goal,
      contentType: inputs.contentType,
      currentFollowers: inputs.currentFollowers,
      audienceLabel: AUDIENCE_LABELS[inputs.audience] || 'General audience',
      goalLabel: GOAL_LABELS[inputs.goal] || 'Views',
      contentTypeLabel: STYLE_LABELS[inputs.contentType] || 'How-to',
      scoreLabel: getScoreLabel(overallScore),
      platformAdvice: getPlatformAdvice(inputs.platform, topHook.style),
      copyHint: `Copy this hook to clipboard and test it on ${platformLabel} today.`
    };
  },
  resultTemplate(/** @type {any} */ r) {
    const bars = r.hooks.map((/** @type {any} */ hook) => {
      const color = getScoreColor(hook.score);
      return `
        <div style="padding:14px 14px 16px 14px;border-radius:18px;background:rgba(15,23,42,.72);border:1px solid rgba(148,163,184,.16)">
          <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap">
            <div style="max-width:78%">
              <div style="font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:#94a3b8;font-weight:800">${hook.emoji} ${hook.formula}</div>
              <div style="font-size:17px;line-height:1.45;color:#f8fafc;font-weight:800;margin-top:8px">${hook.hook}</div>
            </div>
            <div style="padding:10px 12px;border-radius:16px;background:${color}20;border:1px solid ${color}66;color:${color};font-size:18px;font-weight:900;min-width:78px;text-align:center">${hook.score}</div>
          </div>
          <div style="height:12px;border-radius:999px;background:#172033;overflow:hidden;margin-top:12px;border:1px solid rgba(255,255,255,.05)">
            <div style="width:${hook.score}%;height:100%;border-radius:999px;background:linear-gradient(90deg,${color},#f8fafc)"></div>
          </div>
          <div style="font-size:13px;line-height:1.55;color:#cbd5e1;margin-top:10px">${hook.why}</div>
        </div>`;
    }).join('');

    return `
      <div id="eon-share-card" style="max-width:720px;margin:0 auto;border-radius:30px;padding:22px;background:radial-gradient(circle at top right,#312e81 0%,#111827 34%,#020617 100%);border:1px solid rgba(255,255,255,.08);box-shadow:0 28px 90px rgba(2,6,23,.55);color:#f8fafc;font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;overflow:hidden">
        <div style="display:flex;justify-content:space-between;gap:14px;align-items:flex-start;flex-wrap:wrap;margin-bottom:18px">
          <div>
            <div style="font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:#93c5fd;font-weight:900">Creator Hook Optimizer</div>
            <div style="font-size:28px;font-weight:900;line-height:1.1;margin-top:8px">${r.topicCap}</div>
            <div style="font-size:14px;color:#cbd5e1;margin-top:8px">Built for ${r.platformLabel} · Goal: ${r.goalLabel} · Audience: ${r.audienceLabel}</div>
          </div>
          <div style="padding:12px 16px;border-radius:18px;background:rgba(56,189,248,.12);border:1px solid rgba(125,211,252,.4);min-width:152px;text-align:center">
            <div style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#bae6fd;font-weight:800">Overall score</div>
            <div style="font-size:52px;line-height:1;font-weight:900;margin-top:6px;color:#f8fafc">${r.overallScore}</div>
            <div style="font-size:14px;font-weight:800;color:#7dd3fc;margin-top:4px">${r.scoreLabel}</div>
          </div>
        </div>

        <div style="padding:18px;border-radius:24px;background:linear-gradient(180deg,rgba(14,165,233,.14),rgba(15,23,42,.84));border:1px solid rgba(125,211,252,.22)">
          <div style="display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap">
            <div style="font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#93c5fd;font-weight:900">Top recommended hook</div>
            <div style="padding:8px 12px;border-radius:999px;background:rgba(34,197,94,.16);border:1px solid rgba(34,197,94,.38);color:#86efac;font-size:13px;font-weight:900">${r.topHook.formula} · ${r.topHook.score}/99</div>
          </div>
          <div style="font-size:28px;line-height:1.25;font-weight:900;margin-top:12px">${r.topHook.emoji} ${r.topHook.hook}</div>
          <div style="font-size:15px;line-height:1.65;color:#dbeafe;margin-top:12px"><strong style="color:#f8fafc">Why it works:</strong> ${r.topHook.why}</div>
          <div style="margin-top:14px;padding:12px 14px;border-radius:16px;background:rgba(15,23,42,.62);border:1px solid rgba(148,163,184,.16);font-size:13px;color:#cbd5e1">
            <strong style="color:#f8fafc">Copy hint:</strong> ${r.copyHint}
          </div>
        </div>

        <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:16px">
          <div style="padding:16px;border-radius:20px;background:rgba(15,23,42,.8);border:1px solid rgba(148,163,184,.14)">
            <div style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#94a3b8;font-weight:800">Platform optimization note</div>
            <div style="font-size:15px;line-height:1.65;color:#e2e8f0;margin-top:10px">${r.platformAdvice}</div>
          </div>
          <div style="padding:16px;border-radius:20px;background:rgba(15,23,42,.8);border:1px solid rgba(148,163,184,.14)">
            <div style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#94a3b8;font-weight:800">Posting angle</div>
            <div style="font-size:15px;line-height:1.65;color:#e2e8f0;margin-top:10px">Your preferred style is <strong style="color:#f8fafc">${r.contentTypeLabel}</strong>, but the algorithm says <strong style="color:#7dd3fc">${STYLE_LABELS[r.topHook.style] || r.topHook.style}</strong> has the highest odds for this setup. Use that mismatch as your edge.</div>
          </div>
        </div>

        <div style="margin-top:18px">
          <div style="font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#94a3b8;font-weight:900;margin-bottom:12px">All 5 hook angles</div>
          <div style="display:grid;gap:12px">${bars}</div>
        </div>

        <div style="margin-top:18px;padding:16px 18px;border-radius:20px;background:linear-gradient(90deg,rgba(251,191,36,.12),rgba(14,165,233,.08));border:1px solid rgba(251,191,36,.24);text-align:center">
          <div style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#fcd34d;font-weight:900">Share angle</div>
          <div style="font-size:16px;font-weight:800;color:#f8fafc;margin-top:8px">Post your score with “I scored ${r.topHook.score}/99 on viral hooks. Beat my score.”</div>
        </div>
      </div>`;
  },
  shareText: (/** @type {any} */ r) => `My best hook for "${r.topic}" scored ${r.topHook.score}/99 on the Creator Hook Optimizer. Can you beat it? → eonapp.ch/tools/creator-hook.html`,
  challenge: (/** @type {any} */ r) => ({
    tool: 'creator-hook',
    headline: `Beat my hook score for ${r.topic}`,
    value: r.topHook.score,
    unit: '/99',
    summary: r.topHook.formula,
    label: r.scoreLabel
  }),
  compareChallenge: (/** @type {any} */ result, /** @type {any} */ challenge) => Number(result.topHook?.score || 0) > Number(challenge.value || 0),
  related: [
    { url: '/tools/persona-mirror.html', icon: '🪞', title: 'Persona Mirror', cat: 'Psychology' },
    { url: '/tools/rarerank.html', icon: '🧠', title: 'RareRank', cat: 'Personality' },
    { url: '/tools/future-worth.html', icon: '💰', title: 'FutureWorth', cat: 'Finance' }
  ]
};

const /** @type {any} */
root = document.getElementById('tool-root');
if (root) new ToolEngine(def).mount(root);
