import { ToolEngine } from '../ToolEngine.js';

function clamp(/** @type {any} */ value, /** @type {any} */ min, /** @type {any} */ max) {
  return Math.min(max, Math.max(min, value));
}

function round(/** @type {any} */ value) {
  return Math.round(value);
}

function getGrade(/** @type {any} */ score) {
  if (score >= 90) return { label: 'A+', note: 'Prime CTR candidate', color: '#22c55e' };
  if (score >= 82) return { label: 'A', note: 'Strong publish-ready thumbnail', color: '#4ade80' };
  if (score >= 74) return { label: 'B', note: 'Solid baseline with easy upside', color: '#f59e0b' };
  if (score >= 62) return { label: 'C', note: 'Likely underperforming in feed', color: '#fb7185' };
  return { label: 'D', note: 'Rework before spending traffic', color: '#ef4444' };
}

function getWordScore(/** @type {any} */ words) {
  if (words <= 0) return 48;
  if (words <= 3) return 100;
  if (words <= 5) return 88;
  if (words <= 7) return 70;
  if (words <= 10) return 48;
  return 25;
}

/** @param {string} platform @param {{textEfficiency: number; emotionalPull: number; clutter: number; curiosity: number}} values */
function platformAdjust(/** @type {any} */ platform, /** @type {any} */ values) {
  const /** @type {any} */
profiles = {
    youtube: { textWeight: 1.0, faceBoost: 1.08, clutterPenalty: 1.0, curiosityBoost: 1.0 },
    shorts: { textWeight: 0.88, faceBoost: 1.05, clutterPenalty: 1.1, curiosityBoost: 1.06 },
    tiktok: { textWeight: 0.72, faceBoost: 1.1, clutterPenalty: 1.12, curiosityBoost: 1.12 }
  };
  const profile = (/** @type {any} */ (profiles))[platform] || { textWeight: 1, faceBoost: 1, clutterPenalty: 1, curiosityBoost: 1 };

  return {
    textEfficiency: values.textEfficiency * profile.textWeight,
    emotionalPull: values.emotionalPull * profile.faceBoost,
    clutter: values.clutter * profile.clutterPenalty,
    curiosity: values.curiosity * profile.curiosityBoost
  };
}

function topFixes(/** @type {any} */ components, /** @type {any} */ inputHints) {
  const mapped = [
    {
      key: 'clarity',
      score: components.clarity,
      fix: 'Increase subject scale and isolate one clear focal point. Remove background details competing for attention.'
    },
    {
      key: 'contrast',
      score: components.contrast,
      fix: 'Boost local contrast around face/object edges and improve separation between text and background.'
    },
    {
      key: 'emotionalPull',
      score: components.emotionalPull,
      fix: 'Use a stronger facial expression or consequence frame that matches the promise in your title.'
    },
    {
      key: 'curiosity',
      score: components.curiosity,
      fix: 'Add one unresolved element: hidden result, surprising before/after, or specific contradiction.'
    },
    {
      key: 'textEfficiency',
      score: components.textEfficiency,
      fix: 'Compress headline text to 2-4 words. Keep only one payload phrase and remove filler.'
    },
    {
      key: 'clutter',
      score: components.clutter,
      fix: 'Reduce logos, badges, and decorative elements. Keep one hero subject and one supporting cue.'
    }
  ].sort((/** @type {any} */ a, /** @type {any} */ b) => a.score - b.score);

  const first = mapped[0];
  const second = mapped[1];
  const third = mapped[2];

  const /** @type {any} */
picks = [first.fix, second.fix, third.fix];
  if ((inputHints.platform === 'tiktok' || inputHints.platform === 'shorts') && inputHints.textWords > 5) {
    picks.push('For short-form feeds, cut text aggressively and rely on expression + object contrast for instant readability.');
  }
  if (inputHints.facialCount === 'none') {
    picks.push('Test a human-face variant. In most niches this raises stop-rate and click probability versus object-only compositions.');
  }

  return picks.slice(0, 5);
}

function buildABAngles(/** @type {any} */ input, /** @type {any} */ score, /** @type {any} */ fixes) {
  const niche = input.niche && input.niche.trim() ? input.niche.trim() : 'your topic';
  const lane = score >= 82 ? 'scale what is already working' : 'recover CTR before scaling spend';

  return [
    {
      label: 'Variant A (clarity-heavy)',
      text: `Single-subject frame for ${niche}: zoom hero to 60% of frame, 2-word text, high edge contrast, minimal badges to ${lane}.`
    },
    {
      label: 'Variant B (curiosity-heavy)',
      text: `Open-loop frame for ${niche}: visible consequence + hidden detail + micro-text hook. Preserve contrast while using one unresolved element.`
    },
    {
      label: 'Variant C (emotion-heavy)',
      text: `Face-led frame for ${niche}: high-intensity expression, directional gaze to key object, and reduced scene clutter to improve first-second stop rate.`
    },
    {
      label: 'Priority fix stack',
      text: fixes.slice(0, 2).join(' ')
    }
  ];
}

const /** @type {any} */
def = {
  id: 'thumbnail-score-lab',
  title: 'Thumbnail Score Lab',
  metaTitle: 'Thumbnail Score Lab - Predict Click Potential Before Publishing | EONAPP.ch',
  metaDesc: 'Score your thumbnail on clarity, contrast, emotion, and curiosity. Get instant fixes and A/B test directions before you launch ads.',
  category: '📈 Creator',
  description: 'Score your thumbnail before paid traffic. Get a breakdown, grade, and practical A/B variants to improve CTR.',
  rewardProfile: 'social',
  runLabel: '🎯 Score Thumbnail',
  fields: [
    {
      id: 'platform',
      type: 'choice',
      label: 'Primary platform',
      options: [
        { value: 'youtube', label: 'YouTube' },
        { value: 'shorts', label: 'YouTube Shorts / Reels' },
        { value: 'tiktok', label: 'TikTok' }
      ]
    },
    {
      id: 'niche',
      type: 'text',
      label: 'Content niche',
      placeholder: 'e.g. fitness, crypto, coding, productivity'
    },
    {
      id: 'subjectScale',
      type: 'range',
      label: 'Main subject size in frame',
      min: 1,
      max: 10,
      default: 6
    },
    {
      id: 'focalClarity',
      type: 'choice',
      label: 'Focal point clarity',
      options: [
        { value: 'unclear', label: 'Unclear' },
        { value: 'okay', label: 'Okay' },
        { value: 'crisp', label: 'Crisp' }
      ]
    },
    {
      id: 'facialCount',
      type: 'choice',
      label: 'Visible faces',
      options: [
        { value: 'none', label: 'No face' },
        { value: 'one', label: 'One face' },
        { value: 'many', label: 'Multiple faces' }
      ]
    },
    {
      id: 'emotion',
      type: 'range',
      label: 'Expression / emotional intensity',
      min: 1,
      max: 10,
      default: 6
    },
    {
      id: 'textWords',
      type: 'number',
      label: 'Words on thumbnail',
      placeholder: 'e.g. 3'
    },
    {
      id: 'textContrast',
      type: 'choice',
      label: 'Text readability contrast',
      options: [
        { value: 'low', label: 'Low' },
        { value: 'mid', label: 'Medium' },
        { value: 'high', label: 'High' }
      ]
    },
    {
      id: 'colorContrast',
      type: 'choice',
      label: 'Overall color contrast',
      options: [
        { value: 'muted', label: 'Muted' },
        { value: 'balanced', label: 'Balanced' },
        { value: 'punchy', label: 'Punchy' }
      ]
    },
    {
      id: 'curiosity',
      type: 'range',
      label: 'Curiosity gap strength',
      min: 1,
      max: 10,
      default: 7
    },
    {
      id: 'branding',
      type: 'choice',
      label: 'Branding clutter level',
      options: [
        { value: 'none', label: 'Minimal' },
        { value: 'light', label: 'Light' },
        { value: 'heavy', label: 'Heavy' }
      ]
    },
    {
      id: 'mobileLegibility',
      type: 'choice',
      label: 'Legibility on small screens',
      options: [
        { value: 'poor', label: 'Poor' },
        { value: 'okay', label: 'Okay' },
        { value: 'good', label: 'Good' }
      ]
    }
  ],
  /** @param {{platform: string; niche: string; subjectScale: string; emotion: string; curiosity: string; textWords: string; focalClarity: string; facialCount: string; textContrast: string; colorContrast: string; branding: string; mobileLegibility: string}} inputs */
  compute(/** @type {any} */ inputs) {
    const platform = inputs.platform || 'youtube';
    const niche = (inputs.niche || '').trim().slice(0, 40);
    const subjectScale = clamp(parseInt(inputs.subjectScale, 10) || 6, 1, 10);
    const emotion = clamp(parseInt(inputs.emotion, 10) || 6, 1, 10);
    const curiosity = clamp(parseInt(inputs.curiosity, 10) || 7, 1, 10);
    const textWords = clamp(parseInt(inputs.textWords, 10) || 0, 0, 16);

    const /** @type {any} */
focalMap = { unclear: 35, okay: 68, crisp: 95 };
    const /** @type {any} */
faceMap = { none: 58, one: 92, many: 70 };
    const /** @type {any} */
textContrastMap = { low: 38, mid: 70, high: 96 };
    const /** @type {any} */
colorContrastMap = { muted: 44, balanced: 76, punchy: 94 };
    const /** @type {any} */
brandingMap = { none: 100, light: 76, heavy: 38 };
    const /** @type {any} */
mobileMap = { poor: 32, okay: 70, good: 96 };

    const focalScore = (/** @type {any} */ (focalMap))[inputs.focalClarity] || 68;
    const faceScore = (/** @type {any} */ (faceMap))[inputs.facialCount] || 58;
    const textContrastScore = (/** @type {any} */ (textContrastMap))[inputs.textContrast] || 70;
    const colorContrastScore = (/** @type {any} */ (colorContrastMap))[inputs.colorContrast] || 76;
    const brandingPenalty = (/** @type {any} */ (brandingMap))[inputs.branding] || 76;
    const mobileScore = (/** @type {any} */ (mobileMap))[inputs.mobileLegibility] || 70;

    const /** @type {any} */
raw = {
      clarity: round(((subjectScale * 10) * 0.36) + (focalScore * 0.36) + (mobileScore * 0.28)),
      contrast: round((textContrastScore * 0.52) + (colorContrastScore * 0.48)),
      emotionalPull: round((emotion * 10 * 0.54) + (faceScore * 0.46)),
      curiosity: round((curiosity * 10 * 0.7) + (subjectScale * 10 * 0.3)),
      textEfficiency: getWordScore(textWords),
      clutter: brandingPenalty
    };

    const adjusted = platformAdjust(platform, raw);
    const /** @type {any} */
weighted = {
      clarity: clamp(raw.clarity, 0, 100) * 0.25,
      contrast: clamp(raw.contrast, 0, 100) * 0.2,
      emotionalPull: clamp(adjusted.emotionalPull, 0, 100) * 0.15,
      curiosity: clamp(adjusted.curiosity, 0, 100) * 0.15,
      textEfficiency: clamp(adjusted.textEfficiency, 0, 100) * 0.15,
      clutter: clamp(adjusted.clutter, 0, 100) * 0.1
    };

    const score = clamp(round(
      weighted.clarity +
      weighted.contrast +
      weighted.emotionalPull +
      weighted.curiosity +
      weighted.textEfficiency +
      weighted.clutter
    ), 0, 100);

    const grade = getGrade(score);
    const /** @type {any} */
components = {
      clarity: clamp(round(raw.clarity), 0, 100),
      contrast: clamp(round(raw.contrast), 0, 100),
      emotionalPull: clamp(round(adjusted.emotionalPull), 0, 100),
      curiosity: clamp(round(adjusted.curiosity), 0, 100),
      textEfficiency: clamp(round(adjusted.textEfficiency), 0, 100),
      clutter: clamp(round(adjusted.clutter), 0, 100)
    };

    const fixes = topFixes(components, {
      platform,
      textWords,
      facialCount: inputs.facialCount || 'none'
    });
    const abAngles = buildABAngles({ platform, niche }, score, fixes);

    return {
      platform,
      niche: niche || 'general content',
      score,
      gradeLabel: grade.label,
      gradeNote: grade.note,
      gradeColor: grade.color,
      textWords,
      components,
      fixes,
      abAngles,
      publishDecision: score >= 82 ? 'Publish-ready for paid test' : score >= 70 ? 'Revise once before spend' : 'Rework before publishing'
    };
  },
  resultTemplate(/** @type {any} */ r) {
    const bar = (/** @type {any} */ label, /** @type {any} */ value, /** @type {any} */ color) => `
      <div style="margin:.6rem 0">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.3rem">
          <span style="font-size:.78rem;color:#94a3b8">${label}</span>
          <span style="font-size:.8rem;font-weight:700;color:${color}">${value}/100</span>
        </div>
        <div style="height:8px;background:#1e293b;border-radius:999px;overflow:hidden">
          <div class="trait-fill" style="height:100%;width:${value}%;background:${color};border-radius:999px"></div>
        </div>
      </div>`;

    const fixItems = r.fixes.map((/** @type {any} */ item) => `<li style="margin:0 0 .5rem 0;line-height:1.45">${item}</li>`).join('');
    const testItems = r.abAngles.map((/** @type {any} */ item) => `
      <div style="padding:.7rem;border-radius:.6rem;border:1px solid rgba(148,163,184,.2);background:#0f172a;margin-top:.5rem">
        <div style="font-size:.75rem;color:#93c5fd;letter-spacing:.07em;text-transform:uppercase">${item.label}</div>
        <div style="font-size:.86rem;color:#e2e8f0;line-height:1.45;margin-top:.25rem">${item.text}</div>
      </div>
    `).join('');

    return `
      <div id="eon-share-card" style="max-width:720px;margin:0 auto;border-radius:26px;padding:20px;background:linear-gradient(180deg,#0b1220 0%,#111827 48%,#0f172a 100%);border:1px solid rgba(148,163,184,.2);box-shadow:0 24px 80px rgba(2,6,23,.45);color:#f8fafc;font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:1rem;flex-wrap:wrap">
          <div>
            <div style="font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#93c5fd;font-weight:800">Thumbnail Score Lab</div>
            <div style="font-size:30px;line-height:1.05;font-weight:900;margin-top:.4rem">${r.score}</div>
            <div style="font-size:.88rem;color:#cbd5e1;margin-top:.2rem">${r.gradeLabel} · ${r.gradeNote}</div>
          </div>
          <div style="padding:.8rem 1rem;border-radius:1rem;background:${r.gradeColor}22;border:1px solid ${r.gradeColor}66;min-width:160px;text-align:center">
            <div style="font-size:.72rem;letter-spacing:.08em;text-transform:uppercase;color:#d1fae5">Decision</div>
            <div style="font-size:1rem;font-weight:800;color:${r.gradeColor};margin-top:.3rem">${r.publishDecision}</div>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:.9rem;margin-top:1rem">
          <div style="background:#02061788;border:1px solid rgba(148,163,184,.2);border-radius:.9rem;padding:.8rem">
            ${bar('Clarity', r.components.clarity, '#38bdf8')}
            ${bar('Contrast', r.components.contrast, '#22c55e')}
            ${bar('Emotion', r.components.emotionalPull, '#f59e0b')}
          </div>
          <div style="background:#02061788;border:1px solid rgba(148,163,184,.2);border-radius:.9rem;padding:.8rem">
            ${bar('Curiosity', r.components.curiosity, '#a78bfa')}
            ${bar('Text efficiency', r.components.textEfficiency, '#60a5fa')}
            ${bar('Clutter control', r.components.clutter, '#fb7185')}
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:.9rem;margin-top:1rem">
          <div style="background:#0f172a;border:1px solid rgba(148,163,184,.2);border-radius:.9rem;padding:.85rem">
            <div style="font-size:.75rem;letter-spacing:.08em;text-transform:uppercase;color:#94a3b8">Fix priority</div>
            <ul style="margin:.6rem 0 0 1rem;padding:0;font-size:.86rem;color:#e2e8f0">${fixItems}</ul>
          </div>
          <div style="background:#0f172a;border:1px solid rgba(148,163,184,.2);border-radius:.9rem;padding:.85rem">
            <div style="font-size:.75rem;letter-spacing:.08em;text-transform:uppercase;color:#94a3b8">A/B test lanes</div>
            ${testItems}
          </div>
        </div>

        <div style="margin-top:1rem;padding:.75rem;border-radius:.8rem;background:#312e811f;border:1px solid #6366f166;font-size:.84rem;color:#c7d2fe">
          Platform tuned for <strong>${r.platform}</strong> · niche context: <strong>${r.niche}</strong> · words on frame: <strong>${r.textWords}</strong>
        </div>
      </div>`;
  },
  shareText(/** @type {any} */ r) {
    return `My thumbnail scored ${r.score}/100 (${r.gradeLabel}) on Thumbnail Score Lab. CTR decision: ${r.publishDecision}. Can you beat it? -> eonapp.ch/tools/thumbnail-score-lab.html`;
  },
  challenge(/** @type {any} */ r) {
    return {
      tool: 'thumbnail-score-lab',
      headline: 'Beat my thumbnail score',
      value: r.score,
      unit: '/100',
      summary: r.publishDecision,
      label: `${r.gradeLabel} grade`
    };
  },
  compareChallenge(/** @type {any} */ result, /** @type {any} */ challenge) {
    return Number(result.score || 0) > Number(challenge.value || 0);
  },
  related: [
    { url: '/tools/creator-hook.html', icon: '🎣', title: 'Creator Hook Optimizer', cat: 'Social' },
    { url: '/tools/persona-mirror.html', icon: '🪞', title: 'Persona Mirror', cat: 'Personality' },
    { url: '/tools/subscription-leak.html', icon: '💸', title: 'Subscription Leak', cat: 'Finance' }
  ]
};

const /** @type {any} */
root = document.getElementById('tool-root');
if (root) new ToolEngine(def).mount(root);
