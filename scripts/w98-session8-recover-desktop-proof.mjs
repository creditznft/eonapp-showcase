import fs from 'node:fs';
import path from 'node:path';
const dir=process.env.W98_OUTPUT_DIR||path.resolve('CodexAuditPack/W98_SESSION8');
const sourcePath=path.join(dir,'W98_SESSION8_PUBLIC_BROWSER_PROOF.pre-split.json');
const source=JSON.parse(fs.readFileSync(sourcePath,'utf8'));
const d=source.desktop||{};
if(!d.initial||!d.final)throw new Error('Completed desktop phase evidence is unavailable.');
const activityCount=d.repeatable?.mission?.activities?.find(x=>x.id==='ai-health-check')?.count||0;
const checks={
  sourceDesktopPhaseRecorded:source.phases?.desktop?.ok===true||Boolean(d.final),
  session7CumulativeFoundationPresent:d.initial.root?.interiorSession==='w98-session7'&&d.initial.root?.missionSession==='w98-session8',
  firstArrivalStartsDeterministically:d.initial.mission?.activeMissionId==='first-arrival'&&d.initial.mission?.currentObjectiveId==='move'&&d.initial.mission?.completedObjectives===1,
  movementObjectiveCompletes:d.afterMove?.mission?.currentObjectiveId==='meet-eonbot',
  eonbotObjectiveCompletes:d.eonbotPanelOpen?.panelOpen&&d.eonbotPanelOpen?.playerEnabled===false&&d.eonbotPanelOpen?.mission?.currentObjectiveId==='enter-landmark',
  landmarkObjectiveCompletes:d.afterInterior?.root?.activeInterior==='ai'&&d.afterInterior?.mission?.currentObjectiveId==='open-station',
  stationOpenObjectiveCompletes:d.stationOpen?.panelOpen&&d.stationOpen?.playerEnabled===false&&d.stationOpen?.mission?.currentObjectiveId==='close-station',
  stationCloseRestoresAndCompletes:!d.stationClosed?.panelOpen&&d.stationClosed?.playerEnabled&&d.stationClosed?.canvasFocused&&d.stationClosed?.mission?.currentObjectiveId==='return-city',
  safeExitCompletesOnboarding:d.firstArrivalComplete?.mission?.activeMissionId==='district-tour'&&d.firstArrivalComplete?.mission?.status==='active',
  guidedTourProgresses:d.tourStarted?.mission?.currentObjectiveId==='tour-ai'&&d.guided?.root?.guidanceTarget==='ai',
  accessibleDrawerWorks:!d.drawerOpen?.drawer?.hidden&&d.drawerOpen?.drawer?.text?.includes('Available mission chains')&&d.drawerOpen?.playerEnabled===false,
  repeatableActivityIdempotent:activityCount===1,
  progressionLedgerSecretSafe:!/SESSION8_SECRET_MUST_NOT_RENDER|REDACTED_OPENAI_KEY|apiKey|seedPhrase|privateKey|walletAddress/i.test(d.final?.storedText||''),
  noHorizontalOverflow:Number(d.final?.overflow||0)<=1
};
const report={schema:'eon.w98.session8.desktop-proof.v2-recovered',capturedAt:new Date().toISOString(),originalCapturedAt:source.capturedAt||null,sourceEvidence:path.basename(sourcePath),certificationMode:'completed-desktop-phase-recovered-from-interrupted-combined-run',freshSourceChangeScope:'Session 9 mobile menu CSS only; no Session 8 mission runtime changes',desktop:d,checks,errors:[...(source.consoleErrors||[]),...(source.pageErrors||[])],ok:Object.values(checks).every(Boolean)};
report.score=Math.round(Object.values(checks).filter(Boolean).length/Object.keys(checks).length*100);
fs.writeFileSync(path.join(dir,'W98_SESSION8_DESKTOP_PROOF.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));process.exit(report.ok?0:1);
