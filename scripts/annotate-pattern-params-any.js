const fs = require('fs');
const path = require('path');
const ts = require('typescript');

function annotateFile(filePath) {
  const text = fs.readFileSync(filePath, 'utf8');
  const sf = ts.createSourceFile(filePath, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  const inserts = [];

  function needsType(param) {
    if (param.type) return false;
    const start = param.getStart(sf);
    const between = text.slice(param.getFullStart(), start);
    return !/@type\s*\{/.test(between);
  }

  function visit(node) {
    if (ts.isFunctionLike(node)) {
      for (const p of node.parameters) {
        if (!needsType(p)) continue;
        const start = p.getStart(sf);
        inserts.push({ pos: start, text: '/** @type {any} */ ' });
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sf);
  if (!inserts.length) return 0;

  inserts.sort((a, b) => b.pos - a.pos);
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
  const count = annotateFile(full);
  total += count;
  console.log(`${rel}: +${count}`);
}
console.log('Total inserted annotations:', total);
