import fs from 'node:fs';
const read = (p) => fs.readFileSync(p, 'utf8');
const must = [
  ['README.md', /not[\s\S]*full[\s\S]*source/i],
  ['README.md', /secrets.*not.*included/i],
  ['docs/public-vs-private-boundary.md', /Private/i],
  ['docs/reward-safety-model.md', /MultiTag is off by default/i],
  ['docs/in-app-code-preview-plan.md', /selected snippets/i],
  ['src/snippets/sponsor-boost-policy.js', /local-soft-boost-only/i],
  ['src/snippets/eonbot-command-router.js', /confirm-first/i]
];
const failures = must.filter(([file, re]) => !re.test(read(file))).map(([file]) => file);
if (failures.length) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({ ok: true, checks: must.length }, null, 2));
