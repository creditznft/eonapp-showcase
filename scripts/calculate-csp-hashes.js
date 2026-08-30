const crypto = require('crypto');

const styles = {
  index: `.section-no-padding { padding-top: 0; }
.section-extra-padding { padding-top: 2rem; }
.section-header { display: flex; align-items: baseline; justify-content: space-between; flex-wrap: wrap; gap: .5rem; margin-bottom: .5rem; }
.section-title-no-margin { margin: 0; }
.section-link { font-size: .9rem; color: var(--clr-accent); }
.stats-section { background: linear-gradient(135deg, rgba(99,102,241,.08), rgba(168,85,247,.04)); border-top: 1px solid var(--clr-border); border-bottom: 1px solid var(--clr-border); padding: 1.5rem 0; }
.stats-container { display: flex; gap: 2rem; justify-content: center; flex-wrap: wrap; text-align: center; }
.stat-value { font-size: 1.8rem; font-weight: 800; color: var(--clr-accent); }
.stat-label { font-size: .8rem; color: var(--clr-text-muted); }
.card-link { color: inherit; text-decoration: none; }
.viral-hook-custom { background: linear-gradient(135deg, rgba(99,102,241,.15), rgba(168,85,247,.08)); border-top: 1px solid rgba(99,102,241,.2); border-bottom: 1px solid rgba(99,102,241,.2); }
.viral-hook-emoji { font-size: 3rem; margin-bottom: 1rem; }
.viral-hook-title { font-size: clamp(1.6rem, 4vw, 2.5rem); margin-bottom: 1rem; }
.viral-hook-desc { color: var(--clr-text-muted); font-size: 1.05rem; margin-bottom: 2rem; max-width: 520px; margin-left: auto; margin-right: auto; }
.viral-hook-actions { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; }`,
  games: `.section-no-padding { padding-top: 0; }
.share-actions-start { justify-content: flex-start; margin-top: 1rem; }
.live-challenges-panel { margin-top: 1rem; }
.live-challenges-loading { color: #6b7280; font-size: .9rem; text-align: center; padding: 1.5rem 0; }
.live-challenges-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem; display: none; }
.live-challenges-empty { display: none; color: #4b5563; font-size: .9rem; text-align: center; padding: 1.5rem 0; border: 1px dashed #2d2d44; border-radius: .75rem; }
.challenge-article { background: #0f0f1f; border: 1px solid #2d2d44; border-radius: .9rem; padding: 1.1rem 1.2rem; display: flex; flex-direction: column; gap: .6rem; }
.challenge-header { display: flex; align-items: center; gap: .5rem; }
.challenge-emoji { font-size: 1.3rem; }
.challenge-name { font-weight: 700; font-size: .95rem; color: #e2e8f0; }
.challenge-exp { margin-left: auto; font-size: .72rem; color: #4b5563; }
.challenge-desc { font-size: .88rem; color: #9ca3af; }
.challenge-score { color: #c7d2fe; }
.challenge-score-val { color: #f59e0b; font-size: 1.05rem; }
.challenge-time { font-size: .75rem; color: #4b5563; }
.challenge-accept-btn { background: #312e81; color: #a5b4fc; border: 1px solid #4f46e5; border-radius: .6rem; padding: .55rem .9rem; font-weight: 700; font-size: .88rem; text-decoration: none; text-align: center; margin-top: .25rem; }`
};

for (const [name, style] of Object.entries(styles)) {
  const hash = crypto.createHash('sha256').update(style).digest('base64');
  console.log(`${name}: sha256-${hash}`);
}
