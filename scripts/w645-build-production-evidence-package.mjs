#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { buildW645ProductionEvidencePackage } from './lib/w645-production-evidence.mjs';

const args = new Map();
for (let i=2;i<process.argv.length;i+=1) if (process.argv[i].startsWith('--')) args.set(process.argv[i].slice(2), process.argv[i+1] && !process.argv[i+1].startsWith('--') ? process.argv[++i] : 'true');
const candidateRoot = path.resolve(args.get('candidate') || 'artifacts/w641-release-candidate');
const previewPath = path.resolve(args.get('preview') || 'artifacts/w641-preview/preview-receipt.json');
const evidenceRoot = path.resolve(args.get('evidence-root') || '.');
const output = path.resolve(args.get('output') || 'artifacts/w645-production-evidence');
const read = (relative) => JSON.parse(fs.readFileSync(path.join(evidenceRoot, relative), 'utf8'));
const candidate = JSON.parse(fs.readFileSync(path.join(candidateRoot,'candidate-provenance.json'),'utf8'));
const preview = JSON.parse(fs.readFileSync(previewPath,'utf8'));
const index = read('evidence/w645/w638-evidence-index.json');
const laneDecisions = read('evidence/w645/lane-decisions.json');
const creatorBoard = read('evidence/w645/w643-creator-device-board.json');
const cityReceipt = read('evidence/w645/w644-city-owner-receipt.json');
const domainBoard = read('evidence/w645/domain-evidence-board.json');
const killSwitch = read('evidence/w645/kill-switch-receipt.json');
const result = buildW645ProductionEvidencePackage({ root:evidenceRoot, candidate, preview, index, laneDecisions, creatorBoard, cityReceipt, domainBoard, killSwitch });
if (!result.ok) throw new Error(`W645 evidence package failed: ${result.issues.join(', ')}`);
fs.rmSync(output,{recursive:true,force:true}); fs.mkdirSync(output,{recursive:true});
for (const [name,value] of [
  ['w638-evidence-index.json',index],['w639-rehearsal-board.json',result.rehearsal],['lane-decisions.json',laneDecisions],
  ['w643-creator-device-result.json',result.creator],['w644-city-owner-receipt.json',cityReceipt],['w645-production-evidence-summary.json',result.summary],['kill-switch-receipt.json',killSwitch]
]) fs.writeFileSync(path.join(output,name),`${JSON.stringify(value,null,2)}\n`);
console.log(JSON.stringify({ok:true,output,candidateDigest:candidate.candidateDigest,evidenceIndexDigest:index.indexDigest,freezeDigest:candidate.w639FreezeDigest,domains:11},null,2));
