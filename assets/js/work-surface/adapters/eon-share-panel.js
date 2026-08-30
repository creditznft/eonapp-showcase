import {
  EON_SHARE_CENTER_W753_SCHEMA,
  mountEonShareCenter,
  resolveShareCenterType
} from '../../utils/eon-share-sheet.js';

export async function mountEonWorkSurface({ root, invocation, open, environment }) {
  const type = resolveShareCenterType({
    type: invocation.context?.type,
    source: invocation.source,
    destination: invocation.context?.destination,
    environment
  });
  const controller = await mountEonShareCenter(root, {
    type,
    source: invocation.source || 'eon-city-command-hub',
    environment,
    storage: environment?.localStorage,
    creatorCaptureAvailable: type === 'city' || environment?.location?.pathname === '/eoncity',
    presentationMode: invocation.presentationMode || 'dock',
    openWorkSurface: (nextInvocation, trigger) => open({
      ...nextInvocation,
      source: nextInvocation.source || invocation.source || 'share-command-center',
      explicitUserAction: true,
      context: { ...(nextInvocation.context || {}), type: nextInvocation.context?.type || type }
    }, trigger)
  });
  return {
    schema: EON_SHARE_CENTER_W753_SCHEMA,
    dispose() { controller?.dispose?.(); }
  };
}

export default mountEonWorkSurface;
