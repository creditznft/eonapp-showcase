const fs = require('fs');
const files = ['chat.html','projects.html','workspace.html','eoncity.html'];
for (const f of files) {
  let c = fs.readFileSync(f, 'utf8');
  const before = c;
  if (c.includes('<div class="container"')) {
    c = c.replace('<div class="container"', '<main id="main" class="container"');
    c = c.replace('</body>', '</main>\n</body>');
  } else if (c.includes('<div id="app"')) {
    c = c.replace('<div id="app"', '<main id="main"');
    c = c.replace('</body>', '</main>\n</body>');
  } else {
    c = c.replace('<body>', '<body>\n<main id="main">').replace('</body>', '</main>\n</body>');
  }
  if (c !== before) { fs.writeFileSync(f, c); console.log('FIXED: ' + f); }
  else { console.log('NO CHANGE: ' + f); }
}
