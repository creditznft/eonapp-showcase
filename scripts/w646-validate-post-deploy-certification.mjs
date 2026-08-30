#!/usr/bin/env node
import fs from 'node:fs'; import path from 'node:path';
import { validateW646FinalCertification } from './lib/w646-final-certification.mjs';
const [candidateRootArg,deploymentArg,liveSmokeArg,liveCityArg,outputArg]=process.argv.slice(2);
if(!candidateRootArg||!deploymentArg||!liveSmokeArg||!liveCityArg)throw new Error('Usage: candidateRoot deploymentReceipt liveSmokeReceipt liveCityReceipt [output]');
const read=(f)=>JSON.parse(fs.readFileSync(path.resolve(f),'utf8'));
const candidate=read(path.join(path.resolve(candidateRootArg),'candidate-provenance.json')); const deployment=read(deploymentArg); const liveSmoke=read(liveSmokeArg); const liveCity=read(liveCityArg);
const result=validateW646FinalCertification({candidate,deployment,liveSmoke,liveCity}); const output=path.resolve(outputArg||'artifacts/w646-final-production-certification.json'); fs.mkdirSync(path.dirname(output),{recursive:true}); fs.writeFileSync(output,`${JSON.stringify(result,null,2)}\n`); console.log(JSON.stringify(result,null,2)); if(!result.pass)process.exitCode=1;
