import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { EON_GUIDE_ROUTES, validateEonGuideCatalog } from '../../config/eon-guide-catalog.mjs';
import { getRouteRow } from '../../config/route-contract.mjs';
import { getW477SeoDirectiveForFile } from '../../config/w477-route-seo-legacy-contract.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const read=(f)=>fs.readFileSync(path.join(root,f),'utf8');
const words=(html)=>String(html).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&[a-z0-9#]+;/gi,' ').trim().split(/\s+/).filter(Boolean).length;
const support=EON_GUIDE_ROUTES.filter((r)=>r.lifecycle==='editorial-acquisition-support');
test('RT96 support guide catalogue is substantial, indexable and AdSense-bootstrap ready',()=>{
  assert.deepEqual(validateEonGuideCatalog(),[]);
  assert.ok(support.length>=10);
  for(const row of support){
    const html=read(row.file);
    assert.ok(words(html)>=800,`${row.file}: ${words(html)} words`);
    assert.equal(getRouteRow(row.from)?.file,row.file);
    assert.equal(getW477SeoDirectiveForFile(row.file)?.robots,'index, follow');
    assert.match(html,/pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js\?client=ca-pub-6759380023085970/);
    assert.doesNotMatch(html,/data-ad-slot=/i);
    assert.match(html,/data-eonbot-draft=/);
    assert.doesNotMatch(html,/meta\s+name=["']keywords["']/i);
  }
});
