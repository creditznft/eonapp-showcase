import fs from 'node:fs';
import path from 'node:path';
const dir=process.env.W98_OUTPUT_DIR||path.resolve('CodexAuditPack/W98_SESSION1');
const scenarios=['city','workstation','mobile'].map(name=>JSON.parse(fs.readFileSync(path.join(dir,`W98_${name.toUpperCase()}_PROOF.json`),'utf8')));
const checks=Object.fromEntries(scenarios.flatMap(item=>Object.entries(item.checks||{}).map(([key,value])=>[`${item.scenario}.${key}`,value])));
const report={schema:'eon.w98.browser-proof.aggregate.v1',ok:scenarios.every(x=>x.ok),score:Math.round(Object.values(checks).filter(Boolean).length/Object.keys(checks).length*100),checks,scenarios:scenarios.map(({scenario,score,ok,metrics,consoleErrors,pageErrors,error})=>({scenario,score,ok,metrics,consoleErrors,pageErrors,error}))};
fs.writeFileSync(path.join(dir,'W98_BROWSER_PROOF.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
if(!report.ok)process.exit(1);
