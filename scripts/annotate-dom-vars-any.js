const fs = require('fs');
const path = require('path');
const ts = require('typescript');

function isDomCall(init) {
  if (!ts.isCallExpression(init)) return false;
  const expr = init.expression;
  if (ts.isPropertyAccessExpression(expr)) {
    const n = expr.name.text;
    return ['getElementById','querySelector','querySelectorAll','getContext','createElement'].includes(n);
  }
  return false;
}

function annotateFile(filePath) {
  const text = fs.readFileSync(filePath, 'utf8');
  const sf = ts.createSourceFile(filePath, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  const inserts = [];

  function visit(node) {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer && isDomCall(node.initializer)) {
      const start = node.getStart(sf);
      const nameStart = node.name.getStart(sf);
      const between = text.slice(node.getFullStart(), nameStart);
      if (!/@type\s*\{/.test(between)) {
        inserts.push({ pos: start, text: '/** @type {any} */\n' });
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sf);
  if (!inserts.length) return 0;
  inserts.sort((a,b)=>b.pos-a.pos);
  let out = text;
  for (const ins of inserts) out = out.slice(0, ins.pos) + ins.text + out.slice(ins.pos);
  fs.writeFileSync(filePath, out, 'utf8');
  return inserts.length;
}

const files = process.argv.slice(2);
let total = 0;
for (const rel of files) {
  const full = path.resolve(rel);
  if (!fs.existsSync(full)) continue;
  const c = annotateFile(full);
  total += c;
  console.log(`${rel}: +${c}`);
}
console.log('Total inserted annotations:', total);
