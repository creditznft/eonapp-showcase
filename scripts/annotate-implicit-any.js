const fs = require('fs');
const path = require('path');
const ts = require('typescript');

function annotateFile(filePath) {
  const text = fs.readFileSync(filePath, 'utf8');
  const sf = ts.createSourceFile(filePath, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  const inserts = [];

  function maybeAnnotateParam(param) {
    if (!ts.isIdentifier(param.name)) return;
    if (param.type) return;
    const nameStart = param.name.getStart(sf);
    const between = text.slice(param.getFullStart(), nameStart);
    if (/@type\s*\{/.test(between)) return;
    inserts.push({ pos: nameStart, text: '/** @type {any} */ ' });
  }

  function visit(node) {
    if (ts.isFunctionDeclaration(node) || ts.isFunctionExpression(node) || ts.isArrowFunction(node) || ts.isMethodDeclaration(node) || ts.isConstructorDeclaration(node)) {
      for (const param of node.parameters) {
        maybeAnnotateParam(param);
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sf);

  if (!inserts.length) return 0;
  inserts.sort((a, b) => b.pos - a.pos);
  let out = text;
  for (const ins of inserts) {
    out = out.slice(0, ins.pos) + ins.text + out.slice(ins.pos);
  }
  fs.writeFileSync(filePath, out, 'utf8');
  return inserts.length;
}

const files = process.argv.slice(2);
if (!files.length) {
  console.error('Usage: node scripts/annotate-implicit-any.js <files...>');
  process.exit(1);
}

let total = 0;
for (const rel of files) {
  const full = path.resolve(rel);
  if (!fs.existsSync(full)) {
    console.error('Missing:', rel);
    continue;
  }
  const count = annotateFile(full);
  total += count;
  console.log(`${rel}: +${count}`);
}
console.log('Total inserted annotations:', total);
