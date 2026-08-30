/** W699 — simplified NEXUS control hierarchy and truthful capability states. */
import { projectEonNexusW686WorkObject } from '../w686/eon-nexus-w686-work-object-continuity.js';
export const EON_NEXUS_W699_COMMAND_CLARITY_SCHEMA='eon.nexus.command-clarity.w699.v1';
const freeze=v=>Object.freeze(v);
const clean=(v='',max=180)=>String(v||'').replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim().slice(0,max);
export const EON_NEXUS_W699_VOICE_EXAMPLES=freeze(['Open Atlas','Select result','Move left','Compare selected','Enter City']);
export function resolveEonNexusW699GestureStatus({interactionState={},detectorAvailable=false,cameraAvailable=true}={}){
 const mode=String(interactionState?.gestureMode||'off');
 if(mode==='active')return freeze({status:'active',label:'Gestures active',canStart:false,canStop:true,reason:clean(interactionState.gestureReason||'Camera frames stay local.')});
 if(mode==='unavailable'||!cameraAvailable)return freeze({status:'unavailable',label:'Gestures unavailable',canStart:false,canStop:false,reason:clean(interactionState.gestureReason||'Camera capture is unavailable.')});
 if(detectorAvailable)return freeze({status:'available',label:'Gestures available',canStart:true,canStop:false,reason:'Optional local camera mode. Mouse, touch, keyboard and typed or voice-transcript commands remain primary.'});
 return freeze({status:'off',label:'Gestures off',canStart:false,canStop:false,reason:'No local hand detector is installed. All normal controls remain available.'});
}
export function projectEonNexusW699CommandClarity(model={},interactionState={},options={}){
 const selected=model?.commandField?.selectedObject||null; const projected=projectEonNexusW686WorkObject(selected,model?.project||{});
 const compareCount=Array.isArray(interactionState?.compareIds)?interactionState.compareIds.length:0;
 const selectedCount=Array.isArray(interactionState?.selectedObjectIds)?interactionState.selectedObjectIds.length:0;
 const gesture=resolveEonNexusW699GestureStatus({interactionState,detectorAvailable:options.detectorAvailable===true,cameraAvailable:options.cameraAvailable!==false});
 const primaryLabel=model?.commandField?.selectedPrimaryVerb?.action==='inspect'?'Review / Continue':clean(model?.commandField?.selectedPrimaryVerb?.label||'Review / Continue',80);
 const city=projected?freeze({available:options.spatialAvailable===true,label:`Enter City · ${projected.districtId.replaceAll('-',' ')}`,districtId:projected.districtId,stationId:projected.stationId,reason:projected.placementReason,selectedObjectId:projected.id,reviewRequired:true}):freeze({available:false,label:'Enter City',districtId:'',stationId:'',reason:'Select a real work object first.',selectedObjectId:'',reviewRequired:true});
 return freeze({schema:EON_NEXUS_W699_COMMAND_CLARITY_SCHEMA,persistentActions:freeze([
  freeze({id:'primary',label:primaryLabel,kind:'review-continue',enabled:Boolean(selected||model?.conversationRoute)}),
  freeze({id:'atlas',label:model?.atlasAvailable?'Open Atlas':'Choose project',kind:'atlas',enabled:true}),
  freeze({id:'more',label:'More',kind:'more',enabled:true})
 ]),persistentActionCount:3,advancedToolsContextual:selected!==null,compare:freeze({selectedCount,compareCount,ready:compareCount===2,instruction:compareCount===2?'Two objects selected for comparison.':compareCount===1?'Select one more object to compare.':'Select exactly two objects to compare.'}),group:freeze({ready:selectedCount>=2,instruction:selectedCount>=2?`Group ${selectedCount} selected objects.`:'Select at least two objects to group.'}),city,gesture,voice:freeze({examples:EON_NEXUS_W699_VOICE_EXAMPLES,unlimitedClaim:false,transcriptOnly:true}),cameraStartsAutomatically:false,stopCameraAlwaysVisibleWhenActive:true,mouseTouchKeyboardPrimary:true,automaticNavigation:false,automaticApproval:false,startsWork:false});
}
export function validateEonNexusW699CommandClarity(plan={}){const errors=[];if(plan.schema!==EON_NEXUS_W699_COMMAND_CLARITY_SCHEMA)errors.push('schema-invalid');if(plan.persistentActionCount!==3||plan.persistentActions?.length!==3)errors.push('three-actions-required');if(plan.persistentActions?.map(x=>x.id).join(',')!=='primary,atlas,more')errors.push('action-order-invalid');if(!plan.compare?.instruction||!plan.group?.instruction)errors.push('advanced-guidance-invalid');if(!plan.city?.reason||plan.city.reviewRequired!==true)errors.push('city-context-invalid');if(!['off','available','active','unavailable'].includes(plan.gesture?.status))errors.push('gesture-state-invalid');if(plan.cameraStartsAutomatically||plan.automaticNavigation||plan.automaticApproval||plan.startsWork)errors.push('truth-boundary-invalid');return freeze({ok:errors.length===0,errors:freeze(errors),persistentActionCount:plan.persistentActionCount||0});}
export function getEonNexusW699CommandClarityTruth(){return freeze({schema:EON_NEXUS_W699_COMMAND_CLARITY_SCHEMA,threePersistentActions:true,advancedToolsContextual:true,cityDestinationAndReasonVisible:true,compareRequiresExactlyTwo:true,gestureStatesExplicit:true,stopCameraVisible:true,voiceExamplesBounded:true,cameraStartsAutomatically:false,automaticNavigation:false,automaticApproval:false,startsWork:false});}
export default freeze({EON_NEXUS_W699_COMMAND_CLARITY_SCHEMA,EON_NEXUS_W699_VOICE_EXAMPLES,resolveEonNexusW699GestureStatus,projectEonNexusW699CommandClarity,validateEonNexusW699CommandClarity,getEonNexusW699CommandClarityTruth});
