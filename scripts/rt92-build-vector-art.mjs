import fs from 'node:fs';
import path from 'node:path';

const outDir = path.resolve('assets/city/art/rt92');
fs.mkdirSync(outDir, { recursive: true });

const esc = (v='') => String(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const write = (name, body) => fs.writeFileSync(path.join(outDir, name), body.trim() + '\n');

const commonDefs = `<defs>
  <linearGradient id="night" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#050914"/><stop offset=".52" stop-color="#0a1723"/><stop offset="1" stop-color="#071016"/></linearGradient>
  <linearGradient id="cyan" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#baf8ff"/><stop offset=".45" stop-color="#57dfff"/><stop offset="1" stop-color="#3378ff"/></linearGradient>
  <linearGradient id="violet" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#d7c5ff"/><stop offset=".5" stop-color="#9a7cff"/><stop offset="1" stop-color="#5e6cff"/></linearGradient>
  <linearGradient id="mint" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#d8fff0"/><stop offset=".5" stop-color="#69e5bd"/><stop offset="1" stop-color="#2e9e8d"/></linearGradient>
  <linearGradient id="amber" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fff2bd"/><stop offset=".5" stop-color="#ffbb62"/><stop offset="1" stop-color="#ff784a"/></linearGradient>
  <radialGradient id="glow"><stop stop-color="#b9f7ff" stop-opacity=".72"/><stop offset=".35" stop-color="#5bdcff" stop-opacity=".24"/><stop offset="1" stop-color="#4bd5ff" stop-opacity="0"/></radialGradient>
  <pattern id="grid" width="58" height="58" patternUnits="userSpaceOnUse"><path d="M58 0H0V58" fill="none" stroke="#7fe8ff" stroke-opacity=".075"/></pattern>
  <filter id="soft"><feGaussianBlur stdDeviation="18"/></filter>
</defs>`;

const worldSvg = ({ title, desc, accent='cyan', content='' }) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 675" role="img" aria-labelledby="title desc">
<title id="title">${esc(title)}</title><desc id="desc">${esc(desc)}</desc>${commonDefs}
<rect width="1200" height="675" fill="url(#night)"/><rect width="1200" height="675" fill="url(#grid)"/>
<ellipse cx="600" cy="300" rx="430" ry="260" fill="url(#glow)" opacity=".28"/>
${content}
<path d="M64 92h128M64 92v74M1136 92h-128m128 0v74M64 583h128M64 583v-74M1136 583h-128m128 0v-74" fill="none" stroke="url(#${accent})" stroke-width="2" stroke-opacity=".24"/>
</svg>`;

write('world-command-hub.svg', worldSvg({
  title: 'EONCITY Command Hub', desc: 'A monumental Living Nexus with orbital systems, motherboard paths and a vertical civic skyline.', accent: 'cyan',
  content: `<g opacity=".94"><path d="M0 538C190 485 306 514 438 471c116-38 210-31 329 12 140 51 256 15 433 39v153H0Z" fill="#07131b"/>
  <g fill="#0c1d2c" stroke="#57dfff" stroke-opacity=".16"><path d="M105 522h68V298h-68zM195 522h92V244h-92zM317 522h55V348h-55zM829 522h68V282h-68zM925 522h105V221H925zM1060 522h48V335h-48z"/><path d="M224 244l17-45 18 45M950 221l28-58 27 58" fill="#0e2434"/></g>
  <g transform="translate(600 342)" fill="none" stroke-linecap="round"><circle r="158" stroke="url(#cyan)" stroke-width="3" stroke-opacity=".22"/><circle r="118" stroke="url(#violet)" stroke-width="4" stroke-dasharray="18 13" stroke-opacity=".48"/><ellipse rx="168" ry="58" stroke="url(#cyan)" stroke-width="9" stroke-opacity=".55"/><ellipse rx="72" ry="160" stroke="url(#violet)" stroke-width="7" stroke-opacity=".52" transform="rotate(24)"/><path d="M0-98 56 0 0 98-56 0Z" fill="#6be4ff" fill-opacity=".13" stroke="#b9f6ff" stroke-width="3"/><circle r="30" fill="#d9fbff" fill-opacity=".25" stroke="#d9fbff" stroke-width="4"/></g>
  <g stroke="#66e4ff" stroke-opacity=".34" fill="none"><path d="M600 440v235M600 440 433 675M600 440 770 675M540 440 490 675M660 440 710 675"/><path d="M382 510h436M335 571h530M285 635h632"/></g>
  <g fill="#bdeeff"><circle cx="433" cy="510" r="5"/><circle cx="770" cy="510" r="5"/><circle cx="490" cy="571" r="4"/><circle cx="710" cy="571" r="4"/></g></g>`
}));

write('world-signal-frontier.svg', worldSvg({
  title: 'Signal Frontier', desc: 'A vast lost signal frontier with gateway ruins, beacon arrays, fractured transit and the Horizon Vault.', accent: 'mint',
  content: `<path d="M0 515c150-46 298-57 424-22 126 34 221 2 352-18 144-22 261 19 424 26v174H0Z" fill="#081611"/>
  <path d="M90 527 388 345h426l296 182" fill="none" stroke="#74eac2" stroke-opacity=".15" stroke-width="4"/>
  <g stroke="url(#mint)" fill="#0c2820"><path d="M414 480 515 302h170l100 178-56 36-80-142h-98l-81 142Z" stroke-width="7"/><path d="M562 302 600 112l38 190" fill="none" stroke-width="10"/><circle cx="600" cy="177" r="18" fill="#dbfff2" stroke-width="3"/><circle cx="600" cy="177" r="64" fill="none" stroke-width="4" stroke-opacity=".42"/><circle cx="600" cy="177" r="116" fill="none" stroke-width="3" stroke-opacity=".22"/></g>
  <g stroke="#71e9c2" stroke-width="3" fill="#0b211c"><path d="M220 520v-134l22-51 22 51v134M292 520v-91l18-41 18 41v91M875 520v-120l22-48 22 48v120M950 520v-82l17-38 17 38v82"/><path d="M188 466h108M844 455h118" stroke-opacity=".28"/></g>
  <g fill="#12251f" stroke="#95efd1" stroke-opacity=".26"><path d="M96 527h184l-38 70H126z"/><path d="M840 527h260l-52 70H882z"/></g>
  <path d="M600 395 475 675M600 395 725 675M600 395v280" stroke="#79e9c4" stroke-opacity=".19" fill="none"/><path d="M440 505h320M397 572h406M352 640h496" stroke="#79e9c4" stroke-opacity=".12" fill="none"/>
  <g opacity=".72"><path d="M1030 401h82v111h-82z" fill="#10221e" stroke="#8ee7c7" stroke-opacity=".32"/><path d="M1040 401 1071 348l31 53" fill="#10221e" stroke="#8ee7c7" stroke-opacity=".32"/></g>`
}));

write('world-storm-sector.svg', worldSvg({
  title: 'Storm Sector', desc: 'An electrified industrial world connected by grounding grids, stabilizers and a charged transit gate beneath a violent supercell.', accent: 'violet',
  content: `<ellipse cx="670" cy="230" rx="390" ry="185" fill="#7867ff" fill-opacity=".08"/><g fill="none" stroke-linecap="round"><path d="M178 281c127-165 390-230 586-120 85 48 163 126 202 219" stroke="#9ccfff" stroke-opacity=".12" stroke-width="35"/><path d="M245 343c108-123 300-176 451-111 105 44 177 120 218 201" stroke="#aa9eff" stroke-opacity=".18" stroke-width="21"/><path d="M336 405c92-81 222-104 334-60 69 27 122 69 163 126" stroke="#cee6ff" stroke-opacity=".24" stroke-width="10"/></g>
  <path d="M700 77 566 304h92L520 555l254-300h-108Z" fill="url(#cyan)"/><path d="M355 174 294 294h47l-64 127 125-148h-50Z" fill="#7cdcff" opacity=".62"/><path d="M948 205 893 307h41l-54 111 107-133h-45Z" fill="#b39aff" opacity=".58"/>
  <path d="M0 521c147-39 241 15 361-8 121-24 197-68 315-37 98 25 192 55 305 32 82-17 142-20 219-2v169H0Z" fill="#071318"/>
  <g fill="#0d2028" stroke="#83dfff" stroke-opacity=".26"><path d="M124 514h98V358h-98zM251 514h54V410h-54zM915 514h88V332h-88zM1033 514h54V398h-54z"/><path d="M149 358 173 316l25 42M937 332l22-48 22 48"/></g>
  <g fill="none" stroke="#9eb5ff" stroke-opacity=".34"><path d="M174 514 462 446 725 480 959 514" stroke-width="5"/><path d="M203 548 476 478 721 512 938 548" stroke-width="2"/><path d="M174 514v-98M959 514v-120M476 478v-74M721 512v-114"/></g>
  <g fill="#ffc47b"><circle cx="174" cy="416" r="5"/><circle cx="476" cy="404" r="5"/><circle cx="721" cy="398" r="5"/><circle cx="959" cy="394" r="5"/></g>`
}));

write('world-my-frontier.svg', worldSvg({
  title: 'My Frontier', desc: 'A living personal city with seven distinct districts, civic roads, luminous towers, gardens and bespoke landmarks.', accent: 'cyan',
  content: `<path d="M0 536C164 492 283 514 420 488c132-25 212-82 335-39 145 50 273 28 445 51v175H0Z" fill="#081417"/>
  <g fill="#0d2028" stroke="#61ddff" stroke-opacity=".25"><path d="M126 520h68V388h-68zM214 520h112V286H214zM352 520h73V360h-73zM782 520h66V342h-66zM871 520h118V262H871zM1014 520h62V375h-62z"/><path d="M237 286 270 224l33 62M898 262l32-72 32 72"/></g>
  <g transform="translate(600 330)" fill="none"><circle r="92" stroke="url(#cyan)" stroke-width="5" stroke-opacity=".44"/><path d="M0-132 114 72H-114Z" stroke="url(#mint)" stroke-width="12" stroke-linejoin="round"/><path d="M0-88 75 48H-75Z" fill="#72f0ce" fill-opacity=".08" stroke="#a9ffe5" stroke-opacity=".5"/><circle r="24" fill="#d8fff5" fill-opacity=".18" stroke="#c8fff0" stroke-width="3"/></g>
  <g stroke="#6ee3ff" stroke-opacity=".22" fill="none"><path d="M600 426v249M600 426 356 675M600 426 844 675M520 426 455 675M680 426 745 675"/><path d="M403 506h394M345 571h510M283 638h634"/></g>
  <g fill="#102d30" stroke="#8cebd7" stroke-opacity=".32"><path d="M118 545h118l-20 58h-81z"/><path d="M965 542h108l-20 62h-70z"/><path d="M735 545h86l-12 44h-64z"/></g>
  <path d="M728 511c25-42 69-54 97-20 20 25 22 67-2 92-29 30-77 15-95-18-9-17-9-38 0-54Z" fill="#4fd7a3" fill-opacity=".18" stroke="#8affcf" stroke-opacity=".48"/>`
}));

const glyphs = [
 ['command-nexus','cyan','M128 36 210 84v88l-82 48-82-48V84Z','M128 74v108M82 128h92'],
 ['command-theatre','violet','M50 62h156v132H50Z','M82 94h92M82 126h64M82 158h80'],
 ['signal-gateway','mint','M128 36 210 190H46Z','M128 76v94'],
 ['signal-beacon','mint','M128 38 102 190h52Z','M76 94a58 58 0 0 1 104 0M58 70a82 82 0 0 1 140 0'],
 ['signal-archive','mint','M48 64h160v132H48Z','M76 92h104M76 126h104M76 160h72'],
 ['signal-transit','cyan','M42 172 98 72h60l56 100','M66 172h124M128 72v100'],
 ['signal-vault','amber','M54 54h148v148H54Z','M128 78a50 50 0 1 1 0 100 50 50 0 0 1 0-100Zm0 24v52'],
 ['storm-spire','violet','M128 32 184 198H72Z','M128 64v104M102 132h52'],
 ['storm-stabilizer','cyan','M128 38a90 90 0 1 1 0 180 90 90 0 0 1 0-180Z','M128 62v132M82 128h92'],
 ['storm-gate','violet','M48 190V72l80-38 80 38v118','M82 190V94l46-22 46 22v96'],
 ['storm-shelter','amber','M42 118 128 48l86 70v80H42Z','M96 198v-54h64v54'],
 ['frontier-central','cyan','M48 198V74h160v124','M82 198v-78h92v78M128 48v72'],
 ['frontier-creator','violet','M128 32 214 128 128 224 42 128Z','M82 128h92M128 82v92'],
 ['frontier-knowledge','mint','M54 56h148v144H54Z','M80 82h96M80 116h96M80 150h66'],
 ['frontier-systems','amber','M128 42a86 86 0 1 1 0 172 86 86 0 0 1 0-172Z','M128 76v104M76 128h104'],
 ['frontier-signal','cyan','M128 40 102 198h52Z','M80 94a54 54 0 0 1 96 0M62 72a80 80 0 0 1 132 0'],
 ['frontier-transit','cyan','M44 82h168v96H44Z','M76 130h104M92 178l-18 32M164 178l18 32'],
 ['frontier-personal','mint','M128 210c-53-33-78-67-78-103 0-29 20-51 49-51 16 0 29 7 29 7s13-7 29-7c29 0 49 22 49 51 0 36-25 70-78 103Z','M128 82v80'],
 ['construction','amber','M44 190 128 48l84 142','M78 136h100M92 190v-54M164 190v-54'],
 ['vault-reveal','violet','M50 50h156v156H50Z','M128 78a50 50 0 1 1 0 100 50 50 0 0 1 0-100Zm0 22v58']
];
for (const [name, gradient, shell, detail] of glyphs) write(`${name}.svg`, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" role="img" aria-label="EONCITY ${esc(name.replaceAll('-',' '))}">${commonDefs}<rect width="256" height="256" rx="42" fill="url(#night)"/><circle cx="128" cy="128" r="90" fill="url(#glow)" opacity=".12"/><path d="${shell}" fill="#0d2230" stroke="url(#${gradient})" stroke-width="7" stroke-linejoin="round"/><path d="${detail}" fill="none" stroke="url(#${gradient})" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/><circle cx="128" cy="128" r="100" fill="none" stroke="#dffaff" stroke-opacity=".08"/></svg>`);

const files = fs.readdirSync(outDir).filter((name) => name.endsWith('.svg')).sort();
const bytes = files.reduce((sum, name) => sum + fs.statSync(path.join(outDir, name)).size, 0);
fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify({ schema: 'eon.city.rt92.vector-art.v1', generated: true, fileCount: files.length, totalBytes: bytes, files }, null, 2) + '\n');
console.log(JSON.stringify({ fileCount: files.length, totalBytes: bytes, outDir }, null, 2));
