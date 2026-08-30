const fs = require('fs');
const path = require('path');
const ts = require('typescript');

function shouldAnnotateInitializer(init) {
  return ts.isObjectLiteralExpression(init)
    || ts.isArrayLiteralExpression(init)
    || (ts.isNewExpression(init) && init.expression && ts.isIdentifier(init.expression) && (init.expression.text === 'Map' || init.expression.text === 'Set'));
}

function annotateFile(filePath) {
  const text = fs.readFileSync(filePath, 'utf8');
  const sf = ts.createSourceFile(filePath, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  const inserts = [];

  function visit(node) {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer && shouldAnnotateInitializer(node.initializer)) {
      const nameStart = node.name.getStart(sf);
      const between = text.slice(node.getFullStart(), nameStart);
      if (!/@type\s*\{/.test(between)) {
        inserts.push({ pos: node.getStart(sf), text: '/** @type {any} */\n' });
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
  console.error('Usage: node scripts/annotate-object-vars-any.js <files...>');
  process.exit(1);
}

let total = 0;
for (const rel of files) {
  const full = path.resolve(rel);
  if (!fs.existsSync(full)) continue;
  const count = annotateFile(full);
  total += count;
  console.log(`${rel}: +${count}`);
}
console.log('Total inserted annotations:', total);
