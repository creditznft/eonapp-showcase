/**
 * W768Y — validated authored resident presenter in the canonical My Frontier scene.
 */
import { TransformNode } from '@babylonjs/core/Meshes/transformNode.js';
import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader.js';
import { evaluateEonExpanseW767AAssetPresentation } from '../w766/eon-expanse-w767a-asset-truth.js';
import { getEonCityW649AnimationProfile } from '../w649/eon-city-w649-animation-manifest.js';
import { deriveEonExpanseW768ZResidentReaction } from './eon-expanse-w768z-my-frontier-resident-reaction.js';
import { buildEonCityL95ProgressiveAssetAdmission } from '../l95/eon-city-l95-progressive-asset-admission.js';
import { distanceToEonCityL95StreamingFocus } from '../l95/eon-city-l95-world-streaming-policy.js';

export const EON_EXPANSE_W768Y_RESIDENT_PRESENTER_SCHEMA = 'eon.expanse.my-frontier-resident-presenter.w768y.v1';
const freeze = Object.freeze;

function splitAssetPath(path = '') {
  const value = String(path || '');
  const slash = value.lastIndexOf('/');
  return freeze({ rootUrl: slash >= 0 ? value.slice(0, slash + 1) : '/', fileName: slash >= 0 ? value.slice(slash + 1) : value });
}
function validLocalCharacter(path = '') { return /^\/assets\/city\/w649\/(primary|fallback)\/characters\/.+\.[a-f0-9]{12}\.glb$/i.test(String(path || '')); }
function renderable(mesh) { try { return Boolean(mesh && !mesh.isDisposed?.() && (Number(mesh.getTotalVertices?.() || 0) > 0 || mesh.geometry)); } catch { return false; } }
function visible(mesh) { try { return renderable(mesh) && mesh.isEnabled?.() !== false && mesh.isVisible !== false && Number(mesh.visibility ?? 1) > 0.01; } catch { return false; } }
function collectBounds(meshes = []) {
  let minX=Infinity,minY=Infinity,minZ=Infinity,maxX=-Infinity,maxY=-Infinity,maxZ=-Infinity;
  for (const mesh of meshes) try { mesh.computeWorldMatrix?.(true); const box=mesh.getBoundingInfo?.().boundingBox; if (!box) continue; minX=Math.min(minX,box.minimumWorld.x); minY=Math.min(minY,box.minimumWorld.y); minZ=Math.min(minZ,box.minimumWorld.z); maxX=Math.max(maxX,box.maximumWorld.x); maxY=Math.max(maxY,box.maximumWorld.y); maxZ=Math.max(maxZ,box.maximumWorld.z); } catch {}
  if (![minX,minY,minZ,maxX,maxY,maxZ].every(Number.isFinite)) return null;
  return freeze({ minX,minY,minZ,maxX,maxY,maxZ,width:maxX-minX,height:maxY-minY,depth:maxZ-minZ });
}
function materialCount(container, meshes) { const values=new Set(container?.materials || []); for (const mesh of meshes) if (mesh?.material) values.add(mesh.material); return values.size; }
function groupByName(groups = [], name = '') { const target=String(name || '').toLowerCase(); return groups.find((group)=>String(group?.name || '').toLowerCase()===target) || null; }
function restoreRootSnapshots(snapshots = []) { for (const snapshot of snapshots) { try { snapshot.node.position.copyFrom(snapshot.position); } catch {} try { snapshot.node.rotation.copyFrom(snapshot.rotation); } catch {} try { snapshot.node.scaling.copyFrom(snapshot.scaling); } catch {} } }
function disposePresentation(state = {}) { try { for (const group of state.animationGroups || []) group.stop?.(); } catch {} try { state.animation?.stop?.(); } catch {} restoreRootSnapshots(state.rootSnapshots); try { state.container?.dispose?.(); } catch {} try { state.wrapper?.dispose?.(false,true); } catch {} }
function failedTruth(request, assetId, variant, path, detail) {
  return evaluateEonExpanseW767AAssetPresentation({ placement:{ id:`my-frontier-resident-${request.slotId}`, zoneId:'my-frontier', assetId, position:request.worldPosition, targetHeight:request.targetHeight }, assetId, requestedPath:path, variant, loadStatus:'failed', appliedScale:Number.NaN, failureDetail:detail });
}
function variantAttempts(request) {
  const rows=[];
  for (const source of [request.primary, request.alternate]) {
    if (!source?.assetId) continue;
    rows.push(freeze({ assetId:source.assetId, variant:'primary', path:source.primary?.path || '' }));
    rows.push(freeze({ assetId:source.assetId, variant:'fallback', path:source.fallback?.path || '' }));
  }
  return freeze(rows);
}

export function mountEonExpanseW768YResidentPresenter({ scene, residentNodes, assetAdmission = null } = {}) {
  if (!scene || !(residentNodes instanceof Map)) return freeze({ ok:false, reason:'canonical-scene-and-resident-map-required' });
  let disposed=false;
  const states=new Map();
  const revisions=new Map();
  const pending=new Set();
  const reactionRevisions=new Map();
  const queue=[];
  const maxConcurrentLoads=1;
  let admission=buildEonCityL95ProgressiveAssetAdmission({pressure:assetAdmission?.pressure||'nominal',visibility:assetAdmission?.visibility||'visible',reason:assetAdmission?.reason||'my-frontier-residents',maxConcurrentLoads});
  let activeLoads=0;
  let active=false;
  let streamingFocus=null;
  let streamingRadius=Number.POSITIVE_INFINITY;

  const clearSlot=(slotId,{restoreSignal=true}={})=>{
    revisions.set(slotId,Number(revisions.get(slotId)||0)+1);
    reactionRevisions.set(slotId,Number(reactionRevisions.get(slotId)||0)+1);
    const current=states.get(slotId); if (current) disposePresentation(current);
    for (let index=queue.length-1;index>=0;index-=1) if (queue[index]?.request?.slotId===slotId) queue.splice(index,1);
    states.delete(slotId);
    if (restoreSignal) residentNodes.get(slotId)?.invitedSignal?.setEnabled?.(true);
  };

  const load=async(request,revision)=>{
    const target=residentNodes.get(request.slotId);
    if (!target?.station) return freeze({ok:false,reason:'resident-station-missing'});
    const attempts=[];
    for (const candidate of variantAttempts(request)) {
      if (!validLocalCharacter(candidate.path)) { attempts.push(failedTruth(request,candidate.assetId,candidate.variant,candidate.path,'asset-path-invalid')); continue; }
      let container=null; let wrapper=null; let animation=null;
      try {
        const {rootUrl,fileName}=splitAssetPath(candidate.path);
        container=await SceneLoader.LoadAssetContainerAsync(rootUrl,fileName,scene);
        if (disposed || revisions.get(request.slotId)!==revision) { try { container.dispose?.(); } catch {} return freeze({ok:false,reason:'stale-or-disposed-load',attempts:freeze(attempts)}); }
        container.addAllToScene?.();
        wrapper=new TransformNode(`w768y-${request.slotId}-${candidate.assetId}`,scene);
        wrapper.parent=target.station;
        wrapper.position.set(0,0.12,0);
        wrapper.rotation.y=Number(request.heading||0);
        for (const node of container.rootNodes || []) node.parent=wrapper;
        for (const mesh of container.meshes || []) { mesh.isPickable=false; mesh.checkCollisions=false; mesh.metadata=freeze({...(mesh.metadata||{}),kind:'my-frontier-authored-resident',slotId:request.slotId,residentId:request.residentId,assetId:candidate.assetId,proceduralFallback:false,grantsXp:false}); }
        const meshes=container.meshes || [];
        const sourceBounds=collectBounds(meshes);
        let appliedScale=1;
        if (sourceBounds?.height>0.001) { appliedScale=Number(request.targetHeight)/sourceBounds.height; wrapper.scaling.setAll(appliedScale); wrapper.computeWorldMatrix?.(true); }
        const scaledBounds=collectBounds(meshes);
        const stationPosition=target.station.getAbsolutePosition?.() || target.station.position;
        const requestedY=Number(stationPosition?.y||0)+0.11;
        let groundOffset=0;
        if (scaledBounds) { groundOffset=requestedY-scaledBounds.minY; wrapper.position.y+=groundOffset; wrapper.computeWorldMatrix?.(true); }
        const finalBounds=collectBounds(meshes);
        const renderableMeshes=meshes.filter(renderable);
        const visibleMeshes=renderableMeshes.filter(visible);
        const truth=evaluateEonExpanseW767AAssetPresentation({ placement:{id:`my-frontier-resident-${request.slotId}`,zoneId:'my-frontier',assetId:candidate.assetId,position:{x:Number(request.worldPosition?.x||0),y:requestedY,z:Number(request.worldPosition?.z||0)},targetHeight:request.targetHeight}, assetId:candidate.assetId, requestedPath:candidate.path, variant:candidate.variant, loadStatus:'loaded', meshCount:meshes.length, renderableMeshCount:renderableMeshes.length, visibleMeshCount:visibleMeshes.length, materialCount:materialCount(container,renderableMeshes), animationGroupCount:container.animationGroups?.length||0, sourceBounds, worldBounds:finalBounds, appliedScale, finalPosition:wrapper.getAbsolutePosition?.()||wrapper.position, groundOffset, lodState:'full', drawCallContribution:visibleMeshes.length });
        attempts.push(truth);
        if (!truth.ok || Number(container.animationGroups?.length||0)<=0) { disposePresentation({container,wrapper,animation}); continue; }
        const profile=getEonCityW649AnimationProfile(candidate.assetId);
        const idleName=profile?.aliases?.[request.idleKind] || profile?.aliases?.idle || profile?.clips?.[0] || '';
        const interactionName=profile?.aliases?.[request.interactionKind] || profile?.aliases?.talk || profile?.aliases?.interact || profile?.aliases?.wave || '';
        const rootSnapshots=(container.rootNodes || []).map((node)=>freeze({node,position:node.position?.clone?.()||null,rotation:node.rotation?.clone?.()||null,scaling:node.scaling?.clone?.()||null}));
        animation=groupByName(container.animationGroups || [],idleName);
        if (active) try { animation?.start?.(true,1,animation.from,animation.to,false); } catch {}
        if (disposed || revisions.get(request.slotId)!==revision) { disposePresentation({container,wrapper,animation}); return freeze({ok:false,reason:'stale-or-disposed-load',attempts:freeze(attempts)}); }
        // The placement wrapper itself is static; animation groups may still
        // drive character roots/bones beneath it. Freeze only the wrapper.
        try { wrapper.freezeWorldMatrix?.(); } catch {}
        const state=freeze({ok:true,requestKey:request.requestKey,slotId:request.slotId,residentId:request.residentId,receiptId:request.receiptId,assetId:candidate.assetId,variant:candidate.variant,status:'presented-authored-resident',wrapper,container,animation,animationGroups:freeze([...(container.animationGroups||[])]),rootSnapshots:freeze(rootSnapshots),idleName,interactionKind:request.interactionKind||'talk',interactionName,truth,attempts:freeze(attempts),stationSignalSuppressed:true,proceduralResidentBody:false});
        states.set(request.slotId,state);
        target.invitedSignal?.setEnabled?.(false);
        return state;
      } catch(error) { attempts.push(failedTruth(request,candidate.assetId,candidate.variant,candidate.path,String(error?.message||error||'asset-load-failed').slice(0,160))); disposePresentation({container,wrapper,animation}); }
    }
    if (!disposed && revisions.get(request.slotId)===revision) { states.set(request.slotId,freeze({ok:false,requestKey:request.requestKey,slotId:request.slotId,residentId:request.residentId,receiptId:request.receiptId,status:'rejected-authored-resident',reason:attempts.at(-1)?.failureReason||'asset-load-failed',attempts:freeze(attempts),stationSignalSuppressed:false,proceduralResidentBody:false})); target.invitedSignal?.setEnabled?.(true); }
    return states.get(request.slotId);
  };

  const nextEligibleQueueIndex=()=>{
    if(!queue.length)return -1;
    if(streamingFocus?.valid!==true || !Number.isFinite(streamingRadius))return 0;
    let bestIndex=-1; let bestDistance=Number.POSITIVE_INFINITY;
    for(let index=0;index<queue.length;index+=1){
      const next=queue[index];
      const position=residentNodes.get(next?.request?.slotId)?.station?.position;
      const distance=distanceToEonCityL95StreamingFocus(streamingFocus,position);
      if(distance>streamingRadius || distance>=bestDistance)continue;
      bestDistance=distance; bestIndex=index;
    }
    return bestIndex;
  };

  const pump=()=>{
    if (disposed || !active) return;
    const limit=Math.max(0,Number(admission.optionalConcurrencyLimit||0));
    while (activeLoads<limit && queue.length>0) {
      const nextIndex=nextEligibleQueueIndex();
      if(nextIndex<0)break;
      const [next]=queue.splice(nextIndex,1);
      if (!next || revisions.get(next.request.slotId)!==next.revision) continue;
      states.set(next.request.slotId,freeze({ok:true,requestKey:next.request.requestKey,slotId:next.request.slotId,residentId:next.request.residentId,receiptId:next.request.receiptId,status:'loading-authored-resident',stationSignalSuppressed:false,proceduralResidentBody:false}));
      activeLoads+=1;
      let task=null;
      task=load(next.request,next.revision).finally(()=>{activeLoads=Math.max(0,activeLoads-1);pending.delete(task);pump();});
      pending.add(task);
    }
  };

  const apply=({plan}={})=>{
    if (disposed) return freeze({ok:false,reason:'resident-presenter-disposed'});
    const requests=Array.isArray(plan?.requests)?plan.requests:[];
    const active=new Set(requests.map((entry)=>entry.slotId));
    for (const slotId of [...states.keys()]) if (!active.has(slotId)) clearSlot(slotId,{restoreSignal:false});
    for (const request of requests) {
      const requestKey=`${request.receiptId}:${request.primary?.assetId||''}:${request.primary?.primary?.path||''}`;
      const current=states.get(request.slotId);
      if (current?.requestKey===requestKey && ['loading-authored-resident','presented-authored-resident'].includes(current.status)) continue;
      clearSlot(request.slotId,{restoreSignal:true});
      const revision=Number(revisions.get(request.slotId)||0)+1; revisions.set(request.slotId,revision);
      const queuedRequest={...request,requestKey};
      states.set(request.slotId,freeze({ok:true,requestKey,slotId:request.slotId,residentId:request.residentId,receiptId:request.receiptId,status:'queued-authored-resident',stationSignalSuppressed:false,proceduralResidentBody:false}));
      queue.push({request:queuedRequest,revision});
    }
    pump();
    return freeze({ok:true,requested:active.size,queued:queue.length,pending:pending.size,activeLoads});
  };


  const react=({slotId='',residentId='',explicitUserAction=false}={})=>{
    if (disposed) return freeze({ok:false,reason:'resident-presenter-disposed',grantsXp:false,mutatesMissionState:false});
    if (!active) return freeze({ok:false,reason:'resident-presenter-inactive',grantsXp:false,mutatesMissionState:false});
    const current=states.get(String(slotId||'')) || null;
    const authority=deriveEonExpanseW768ZResidentReaction({slotId,residentId,explicitUserAction,presentedResident:current});
    if (!authority.ok) return authority;
    const interaction=groupByName(current.animationGroups || [],authority.action.interactionName);
    const idle=groupByName(current.animationGroups || [],authority.action.idleName);
    if (!interaction) return freeze({ok:false,reason:'resident-interaction-clip-unavailable',grantsXp:false,mutatesMissionState:false});
    const revision=Number(reactionRevisions.get(authority.action.slotId)||0)+1;
    reactionRevisions.set(authority.action.slotId,revision);
    for (const group of current.animationGroups || []) { try { group.stop?.(); } catch {} }
    restoreRootSnapshots(current.rootSnapshots);
    try { interaction.start?.(false,1,interaction.from,interaction.to,false); } catch { return freeze({ok:false,reason:'resident-interaction-start-failed',grantsXp:false,mutatesMissionState:false}); }
    interaction.onAnimationGroupEndObservable?.addOnce?.(()=>{
      const latest=states.get(authority.action.slotId);
      if (disposed || reactionRevisions.get(authority.action.slotId)!==revision || latest?.requestKey!==authority.action.requestKey) return;
      restoreRootSnapshots(latest.rootSnapshots);
      for (const group of latest.animationGroups || []) { try { if (group!==idle) group.stop?.(); } catch {} }
      try { idle?.start?.(true,1,idle.from,idle.to,false); } catch {}
    });
    return freeze({...authority,status:'resident-interaction-playing',returnsToIdle:true,oneCanonicalScene:true});
  };

  return freeze({
    ok:true,
    schema:EON_EXPANSE_W768Y_RESIDENT_PRESENTER_SCHEMA,
    apply,
    react,
    setActive(nextActive=true){
      if(disposed)return freeze({ok:false,reason:'resident-presenter-disposed'});
      active=nextActive===true;
      for(const state of states.values()){
        if(state?.status!=='presented-authored-resident')continue;
        try{
          if(active){
            const idle=groupByName(state.animationGroups||[],state.idleName);
            idle?.start?.(true,1,idle.from,idle.to,false);
          }else{
            for(const group of state.animationGroups||[])group.stop?.();
          }
        }catch{}
      }
      if(active)pump();
      return freeze({ok:true,active,retainedPresentedResidents:[...states.values()].filter((row)=>row?.status==='presented-authored-resident').length,sameSessionReuse:true});
    },

    setOptionalAssetAdmission(options={}){if(disposed)return freeze({ok:false,reason:'resident-presenter-disposed'});admission=buildEonCityL95ProgressiveAssetAdmission({...options,maxConcurrentLoads});pump();return freeze({ok:true,admission,queued:queue.length,activeLoads,pending:pending.size});},
    setStreamingFocus(focus=null,{radius=Number.POSITIVE_INFINITY}={}){if(disposed)return freeze({ok:false,reason:'resident-presenter-disposed'});streamingFocus=focus?.valid===true?freeze({...focus}):null;streamingRadius=Number.isFinite(Number(radius))?Math.max(0,Number(radius)):Number.POSITIVE_INFINITY;pump();return freeze({ok:true,focusValid:streamingFocus?.valid===true,radius:streamingRadius,queued:queue.length,activeLoads});},
    ready(){return Promise.allSettled([...pending]);},
    getSummary(){const rows=[...states.values()]; return freeze({schema:EON_EXPANSE_W768Y_RESIDENT_PRESENTER_SCHEMA,active,requested:rows.length,queued:rows.filter((row)=>row.status==='queued-authored-resident').length,loading:rows.filter((row)=>row.status==='loading-authored-resident').length,presented:rows.filter((row)=>row.status==='presented-authored-resident').length,rejected:rows.filter((row)=>row.status==='rejected-authored-resident').length,pendingTasks:pending.size,queuedTasks:queue.length,activeLoads,admission,streamingFocusValid:streamingFocus?.valid===true,streamingRadius:Number.isFinite(streamingRadius)?streamingRadius:null,staticPlacementWrapper:true,residentBodyCount:rows.filter((row)=>row.status==='presented-authored-resident').length,stationSignalsSuppressed:rows.filter((row)=>row.stationSignalSuppressed).length,assets:freeze(rows.map((row)=>freeze({slotId:row.slotId,residentId:row.residentId,receiptId:row.receiptId,status:row.status,assetId:row.assetId||'',variant:row.variant||'',reason:row.reason||'',truth:row.truth||null,attempts:row.attempts||freeze([]),stationSignalSuppressed:row.stationSignalSuppressed===true,proceduralResidentBody:false}))),canonicalScene:true,secondEngineCreated:false,secondSceneCreated:false,secondRenderLoopCreated:false,automaticRetry:false,remoteAssets:false,privateContentStored:false});},
    dispose(){if (disposed) return freeze({ok:true,alreadyDisposed:true}); disposed=true; for (const slotId of [...new Set([...states.keys(),...revisions.keys()])]) clearSlot(slotId,{restoreSignal:false}); queue.length=0; pending.clear(); activeLoads=0; return freeze({ok:true});}
  });
}

export default freeze({EON_EXPANSE_W768Y_RESIDENT_PRESENTER_SCHEMA,mountEonExpanseW768YResidentPresenter});
