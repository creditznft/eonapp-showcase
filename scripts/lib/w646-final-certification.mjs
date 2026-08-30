import {
  W646_CRITICAL_ROUTES,
  W646_FINAL_CERTIFICATION_SCHEMA,
  W646_LIVE_SMOKE_RECEIPT_SCHEMA,
  W646_PRODUCTION_DEPLOYMENT_RECEIPT_SCHEMA
} from '../../config/w646-final-freeze-deployment-contract.mjs';
import { validateCandidateProvenance } from './w641-release-governance.mjs';
import { validateW644CityOwnerReceipt } from './w644-city-owner-certification.mjs';

const freeze=(value)=>Object.freeze(value); const HEX64=/^[a-f0-9]{64}$/; const SAFE=/^[a-z0-9][a-z0-9._:-]{0,179}$/i; const iso=(v)=>Number.isFinite(Date.parse(String(v||''))); const unique=(v)=>[...new Set(v)];
export function validateW646DeploymentReceipt(value={}, candidate={}){
  const issues=[];
  if(value?.schema!==W646_PRODUCTION_DEPLOYMENT_RECEIPT_SCHEMA||value?.wave!=='W646')issues.push('deployment-identity-invalid');
  if(!SAFE.test(String(value?.deploymentId||''))||!SAFE.test(String(value?.rollbackDeploymentId||'')))issues.push('deployment-id-invalid');
  if(value?.candidateDigest!==candidate?.candidateDigest||!HEX64.test(String(value?.candidateDigest||'')))issues.push('deployment-candidate-mismatch');
  if(!iso(value?.deployedAt)||value?.liveIdentityVerified!==true||value?.criticalRoutesVerified!==true)issues.push('deployment-machine-verification-invalid');
  return freeze({ok:issues.length===0,issues:freeze(unique(issues))});
}
export function validateW646LiveSmokeReceipt(value={}, {candidate={},deployment={}}={}){
  const issues=[];
  if(value?.schema!==W646_LIVE_SMOKE_RECEIPT_SCHEMA||value?.wave!=='W646'||value?.status!=='pass')issues.push('live-smoke-identity-invalid');
  if(value?.candidateDigest!==candidate?.candidateDigest||value?.deploymentId!==deployment?.deploymentId)issues.push('live-smoke-link-invalid');
  if(!iso(value?.occurredAt)||value?.origin!=='https://eonapp.ch')issues.push('live-smoke-time-origin-invalid');
  const routes=Array.isArray(value?.routes)?value.routes:[];
  for(const route of W646_CRITICAL_ROUTES){const row=routes.find((x)=>x?.route===route); if(!row||row.status<200||row.status>=400||row.candidateIdentityMatched!==true)issues.push(`live-route-invalid:${route}`);}
  if(value?.releaseIdentityMatched!==true||value?.securityHeadersReviewed!==true||value?.serviceWorkerReviewed!==true||value?.billingStatusReviewed!==true||value?.referralGateReviewed!==true||value?.guestCityGateReviewed!==true)issues.push('live-surface-review-incomplete');
  if(Number(value?.pageErrors)!==0||Number(value?.consoleErrors)!==0||Number(value?.firstPartyHttpErrors)!==0||value?.unexplainedRequestFailures!==0)issues.push('live-diagnostics-not-clean');
  if(value?.ownerReviewed!==true||value?.redactionReviewed!==true||value?.secretsIncluded!==false||value?.directIdentifiersIncluded!==false)issues.push('live-smoke-review-boundary-invalid');
  return freeze({ok:issues.length===0,issues:freeze(unique(issues))});
}
export function validateW646FinalCertification({candidate={},deployment={},liveSmoke={},liveCity={}}={}){
  const candidateCheck=validateCandidateProvenance(candidate); const deploymentCheck=validateW646DeploymentReceipt(deployment,candidate); const smokeCheck=validateW646LiveSmokeReceipt(liveSmoke,{candidate,deployment}); const cityCheck=validateW644CityOwnerReceipt(liveCity);
  const issues=unique([candidateCheck,deploymentCheck,smokeCheck,cityCheck].flatMap((r)=>r.issues||[]));
  if(liveCity?.candidateDigest!==candidate?.candidateDigest||liveCity?.deploymentId!==deployment?.deploymentId)issues.push('live-city-deployment-link-invalid');
  const pass=issues.length===0;
  return freeze({schema:W646_FINAL_CERTIFICATION_SCHEMA,wave:'W646',pass,publicDecision:pass?'go':'no-go',rollbackRequired:!pass&&deploymentCheck.ok,issues:freeze(unique(issues)),candidateDigest:candidate?.candidateDigest||'',deploymentId:deployment?.deploymentId||'',cityOverallScore:cityCheck.overallScore,cityMinimumCategoryScore:cityCheck.minimumCategoryScore});
}
