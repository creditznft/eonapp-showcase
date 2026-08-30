import { deriveEonExpanseW767ITouchInteraction } from './eon-expanse-w767i-touch-interaction.js';
import { deriveEonExpanseW767QAccessibilityProfile } from './eon-expanse-w767q-accessibility-profile.js';
import { deriveEonExpanseW767VGuidanceControl } from './eon-expanse-w767v-guidance-lifecycle.js';

const freeze = (value) => Object.freeze(value);
const el = (documentRef, tag, attrs = {}) => { const node = documentRef.createElement(tag); for (const [key,value] of Object.entries(attrs)) { if (key === 'text') node.textContent = value; else if (key === 'className') node.className = value; else node.setAttribute(key, value); } return node; };
const setText = (node, value) => { if (node && node.textContent !== String(value ?? '')) node.textContent = String(value ?? ''); };
export const EON_EXPANSE_W766H_UI_SCHEMA = 'eon.city.expanse.ui-overlay.w767v.v12';

export function projectEonExpanseW766HLabelSafePosition({ x = 0, y = 0, viewportWidth = 1280, viewportHeight = 720, index = 0 } = {}) {
  const width = Math.max(240, Number(viewportWidth) || 1280);
  const height = Math.max(180, Number(viewportHeight) || 720);
  const marginX = Math.min(112, Math.max(52, width * 0.08));
  const marginTop = Math.min(92, Math.max(48, height * 0.08));
  const marginBottom = Math.min(100, Math.max(58, height * 0.1));
  let safeX = Math.min(width - marginX, Math.max(marginX, Number(x) || width / 2));
  let safeY = Math.min(height - marginBottom, Math.max(marginTop, Number(y) || height / 2));
  let reason = (safeX !== Number(x) || safeY !== Number(y)) ? 'viewport-clamp' : '';

  // Keep world labels off the third-person operator and the immediate action
  // corridor around them. The corridor is deliberately local presentation
  // only: it never changes target selection, interaction range or world state.
  const centreX = width / 2;
  const avatarHalfWidth = Math.min(148, Math.max(88, width * 0.115));
  const avatarTop = height * 0.34;
  const avatarBottom = height * 0.79;
  const insideAvatarCorridor = safeX > centreX - avatarHalfWidth
    && safeX < centreX + avatarHalfWidth
    && safeY > avatarTop
    && safeY < avatarBottom;
  if (insideAvatarCorridor) {
    const laneGap = Math.min(30, Math.max(16, width * 0.018));
    const leftLane = centreX - avatarHalfWidth - laneGap;
    const rightLane = centreX + avatarHalfWidth + laneGap;
    const preferLeft = safeX < centreX || (safeX === centreX && Number(index) % 2 === 0);
    const candidate = preferLeft ? leftLane : rightLane;
    if (candidate >= marginX && candidate <= width - marginX) {
      safeX = candidate;
    } else {
      safeY = Math.max(marginTop, avatarTop - 18);
    }
    reason = 'avatar-safe-zone';
  }
  return freeze({ x: Math.round(safeX), y: Math.round(safeY), adjusted: Boolean(reason), reason: reason || 'unchanged' });
}

export function mountEonExpanseW766HUiOverlay({
  host,
  documentRef = globalThis.document,
  onConfirmCampaignReceipt = null,
  onStartMission = null,
  onGuideToExpanseGate = null,
  onGuideObjective = null,
  onCancelGuide = null,
  onDismissAssistance = null,
  onReturnToCommandHub = null,
  onOpenMissionMap = null,
  onSelectMapZone = null,
  onDismissOnboarding = null,
  onInteractNearest = null,
  onRetryAssets = null,
  onOpenCaptureMoment = null,
  onReviewFutureRegionProgramme = null,
  onSelectLivingActivity = null,
  onUnlockMyFrontier = null,
  onPlanMyFrontierBuilding = null,
  onOpenMyFrontierWork = null,
  onGuideMyFrontier = null,
  onConfirmMyFrontierConstruction = null,
  onConfirmMyFrontierDistrictUpgrade = null,
  onInviteMyFrontierResident = null,
  onReleaseMyFrontierResident = null,
  onSelectMyFrontierTheme = null,
  coarsePointer = false,
  reducedMotion = false,
  forcedColors = false
} = {}) {
  if (!host || !documentRef?.createElement) return freeze({ ok: false, reason: 'dom-host-required' });
  const style = el(documentRef, 'style'); style.dataset.eonExpanseUi = 'w766h'; style.textContent = `
[data-eon-expanse-ui="root"]{position:absolute;inset:0;pointer-events:none;z-index:44;font-family:Inter,system-ui,sans-serif;color:#eef8ff}
[data-eon-expanse-ui="root"][data-reduced-motion="true"] *{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important;scroll-behavior:auto!important}
@media (prefers-reduced-motion: reduce){[data-eon-expanse-ui="root"] *{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important;scroll-behavior:auto!important}}
@media (forced-colors: active){[data-eon-expanse-ui="root"]{forced-color-adjust:auto}[data-eon-expanse-ui="root"] button,[data-eon-expanse-ui="root"] [role="status"]{border:1px solid currentColor!important;box-shadow:none!important;backdrop-filter:none!important}}
[data-eon-expanse-ui="arrival"]{position:absolute;left:50%;top:max(54px,8vh);transform:translate(-50%,-10px);min-width:min(520px,86vw);padding:16px 22px;border:1px solid rgba(92,220,255,.5);border-radius:18px;background:linear-gradient(145deg,rgba(4,13,27,.92),rgba(17,15,53,.9));box-shadow:0 18px 60px rgba(0,0,0,.45),0 0 42px rgba(46,186,255,.16);text-align:center;opacity:0;transition:opacity .24s ease,transform .24s ease;backdrop-filter:blur(14px)}
[data-eon-expanse-ui="arrival"][data-active="true"]{opacity:1;transform:translate(-50%,0)}
[data-eon-expanse-ui="arrival-title"]{font-weight:900;font-size:clamp(20px,2.8vw,36px);letter-spacing:.2em}[data-eon-expanse-ui="arrival-network"]{margin-top:5px;color:#9de6ff;font-size:12px;letter-spacing:.12em;text-transform:uppercase}[data-eon-expanse-ui="arrival-detail"]{margin-top:7px;color:#fff4c7;font-weight:750}
[data-eon-expanse-ui="hud"]{position:absolute;left:50%;top:max(16px,env(safe-area-inset-top));transform:translateX(-50%);display:flex;align-items:center;gap:12px;max-width:min(620px,62vw);padding:8px 13px;border:1px solid rgba(92,220,255,.34);border-radius:14px;background:rgba(4,15,29,.78);backdrop-filter:blur(12px);opacity:0;transition:opacity .18s ease}
[data-eon-expanse-ui="hud"][data-active="true"]{opacity:1}[data-eon-expanse-ui="hud-zone"]{font-size:11px;letter-spacing:.11em;text-transform:uppercase;color:#9de6ff;white-space:nowrap}[data-eon-expanse-ui="hud-objective"]{font-size:12px;font-weight:800;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}[data-eon-expanse-ui="hud-distance"]{font-size:12px;color:#fff4c7;white-space:nowrap}
[data-eon-expanse-ui="hud-network"]{font-size:11px;color:#b8ffd8;white-space:nowrap;font-weight:850}
[data-eon-expanse-ui="event-banner"]{position:absolute;left:50%;top:max(58px,calc(env(safe-area-inset-top) + 42px));transform:translateX(-50%);max-width:min(620px,76vw);padding:7px 12px;border:1px solid rgba(188,150,255,.42);border-radius:999px;background:rgba(31,18,54,.82);backdrop-filter:blur(10px);color:#eee4ff;font-size:11px;font-weight:800;letter-spacing:.02em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;opacity:0;transition:opacity .18s ease}[data-eon-expanse-ui="event-banner"][data-active="true"]{opacity:1}
[data-eon-expanse-ui="labels"]{position:absolute;inset:0;overflow:hidden}[data-eon-expanse-ui="world-label"]{position:absolute;left:0;top:0;max-width:min(280px,54vw);padding:7px 10px;border:1px solid rgba(117,214,255,.4);border-radius:999px;background:rgba(4,14,27,.82);box-shadow:0 8px 24px rgba(0,0,0,.28);backdrop-filter:blur(8px);font-size:11px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;opacity:0;transform:translate(-50%,-115%);transition:opacity .12s ease}[data-eon-expanse-ui="world-label"][data-active="true"]{opacity:1}[data-eon-expanse-ui="world-label"][data-role="primary-objective"]{border-color:rgba(255,224,137,.72);color:#fff4c7;background:rgba(31,25,10,.86)}
[data-eon-expanse-ui="onboarding"]{pointer-events:none;position:absolute;left:max(18px,env(safe-area-inset-left));bottom:26px;width:min(330px,42vw);padding:12px 14px;border:1px solid rgba(255,224,137,.48);border-radius:16px;background:rgba(21,17,8,.86);box-shadow:0 12px 34px rgba(0,0,0,.36);backdrop-filter:blur(12px);opacity:0;transform:translateY(8px);transition:opacity .18s ease,transform .18s ease}[data-eon-expanse-ui="onboarding"][data-active="true"]{pointer-events:auto;opacity:1;transform:translateY(0)}[data-eon-expanse-ui="onboarding-step"]{color:#fff4c7;font-size:12px;font-weight:900;letter-spacing:.04em}[data-eon-expanse-ui="onboarding-detail"]{margin-top:4px;color:#d7e9f4;font-size:11px;line-height:1.4}[data-eon-expanse-ui="onboarding-shortcut"]{margin-top:7px;color:#9de6ff;font-size:11px;font-weight:850}
[data-eon-expanse-ui="onboarding-actions"]{display:flex;flex-wrap:wrap;gap:7px;margin-top:9px}[data-eon-expanse-ui="onboarding-action"]{appearance:none;-webkit-appearance:none;min-height:44px;padding:6px 10px;border:1px solid rgba(255,224,137,.5);border-radius:999px;background:rgba(86,67,19,.44);color:#fff8dd;font:inherit;font-size:11px;font-weight:850;cursor:pointer}[data-eon-expanse-ui="onboarding-action"]:focus-visible{outline:3px solid #fff;outline-offset:2px}
[data-eon-expanse-ui="companion"]{position:absolute;left:max(18px,env(safe-area-inset-left));top:max(18px,env(safe-area-inset-top));max-width:min(330px,58vw);padding:9px 13px;border:1px solid rgba(105,229,255,.4);border-radius:999px;background:rgba(4,16,30,.82);box-shadow:0 0 28px rgba(40,195,255,.12);backdrop-filter:blur(12px);font-size:12px;font-weight:800;letter-spacing:.04em;opacity:0;transform:translateY(-6px);transition:opacity .18s ease,transform .18s ease}
[data-eon-expanse-ui="companion"][data-active="true"]{opacity:1;transform:translateY(0)}
[data-eon-expanse-ui="guidance"]{position:absolute;left:50%;bottom:26px;transform:translateX(-50%);display:flex;align-items:center;justify-content:center;gap:10px;max-width:min(760px,90vw);padding:9px 10px 9px 16px;border:1px solid rgba(70,192,255,.48);border-radius:16px;background:rgba(4,10,20,.84);box-shadow:0 0 32px rgba(42,172,255,.14);backdrop-filter:blur(12px);font-size:13px;letter-spacing:.02em;text-align:center;opacity:0;transition:opacity .18s ease}
[data-eon-expanse-ui="guidance"][data-active="true"]{opacity:1}[data-eon-expanse-ui="guidance-text"]{min-width:0}
[data-eon-expanse-ui="guide-objective"]{pointer-events:auto;appearance:none;-webkit-appearance:none;min-height:44px;padding:7px 11px;border:1px solid rgba(109,224,255,.62);border-radius:999px;background:rgba(30,92,132,.58);color:#f4fdff;font:inherit;font-size:12px;font-weight:850;cursor:pointer;white-space:nowrap}[data-eon-expanse-ui="guide-objective"]:disabled{opacity:.62;cursor:default}[data-eon-expanse-ui="guide-objective"]:focus-visible{outline:3px solid #fff;outline-offset:3px}
[data-eon-expanse-ui="return-hub"]{pointer-events:auto;position:absolute;right:max(18px,env(safe-area-inset-right));top:max(18px,env(safe-area-inset-top));appearance:none;-webkit-appearance:none;min-height:48px;padding:10px 15px;border:1px solid rgba(109,224,255,.62);border-radius:999px;background:linear-gradient(145deg,rgba(4,25,46,.96),rgba(20,17,65,.94));color:#f4fdff;font:inherit;font-weight:800;cursor:pointer;box-shadow:0 .55rem 1.7rem rgba(0,0,0,.4);backdrop-filter:blur(12px)}
[data-eon-expanse-ui="return-hub"]:hover{border-color:#b7fff8;filter:brightness(1.1)}[data-eon-expanse-ui="return-hub"]:focus-visible{outline:3px solid #fff;outline-offset:3px}[data-eon-expanse-ui="return-hub"][hidden]{display:none}
[data-eon-expanse-ui="capture-moment"]{pointer-events:auto;position:absolute;right:max(18px,env(safe-area-inset-right));top:max(82px,calc(env(safe-area-inset-top) + 66px));appearance:none;-webkit-appearance:none;min-height:44px;padding:9px 14px;border:1px solid rgba(255,224,137,.62);border-radius:999px;background:rgba(70,49,12,.9);color:#fff8dd;font:inherit;font-size:12px;font-weight:850;cursor:pointer;backdrop-filter:blur(12px)}[data-eon-expanse-ui="capture-moment"]:focus-visible{outline:3px solid #fff;outline-offset:3px}[data-eon-expanse-ui="capture-moment"][hidden]{display:none}
[data-eon-expanse-ui="touch-interact"]{pointer-events:auto;position:absolute;right:max(18px,env(safe-area-inset-right));bottom:max(26px,env(safe-area-inset-bottom));appearance:none;-webkit-appearance:none;max-width:min(320px,52vw);min-height:52px;padding:10px 16px;border:1px solid rgba(255,224,137,.68);border-radius:999px;background:linear-gradient(145deg,rgba(74,55,12,.94),rgba(24,44,69,.96));color:#fff8dd;font:inherit;font-size:12px;font-weight:900;cursor:pointer;box-shadow:0 .55rem 1.7rem rgba(0,0,0,.42);backdrop-filter:blur(12px);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}[data-eon-expanse-ui="touch-interact"]:focus-visible{outline:3px solid #fff;outline-offset:3px}[data-eon-expanse-ui="touch-interact"][hidden]{display:none}
[data-eon-expanse-ui="board"]{pointer-events:auto;position:absolute;inset:max(14px,5vh) max(18px,3vw);display:none;grid-template-columns:minmax(280px,1.2fr) minmax(260px,.8fr);align-content:start;gap:18px;padding:0 22px 22px;border:1px solid rgba(82,199,255,.42);border-radius:22px;background:linear-gradient(145deg,rgba(4,9,19,.97),rgba(10,17,32,.95));box-shadow:0 24px 90px rgba(0,0,0,.55),inset 0 0 60px rgba(52,136,255,.06);overflow:auto;overscroll-behavior:contain;scrollbar-gutter:stable}
[data-eon-expanse-ui="board"][data-open="true"]{display:grid}
[data-eon-expanse-ui="board-header"]{position:sticky;top:0;z-index:4;grid-column:1/-1;display:flex;align-items:center;justify-content:space-between;gap:14px;margin:0 -22px;padding:17px 22px 13px;border-bottom:1px solid rgba(82,199,255,.18);background:linear-gradient(180deg,rgba(4,9,19,.995),rgba(7,13,25,.965));backdrop-filter:blur(14px)}
[data-eon-expanse-ui="title"]{font-weight:800;letter-spacing:.15em;font-size:clamp(18px,2.2vw,32px);margin:0}
[data-eon-expanse-ui="sub"]{color:#91cce9;font-size:12px;letter-spacing:.08em;text-transform:uppercase}
[data-eon-expanse-ui="card"]{border:1px solid rgba(111,177,230,.22);border-radius:16px;padding:16px;background:rgba(13,25,43,.72);margin-top:14px}
[data-eon-expanse-ui="objective"]{font-size:17px;font-weight:700;margin:8px 0}[data-eon-expanse-ui="detail"]{color:#b7cfdd;line-height:1.5;font-size:13px}
[data-eon-expanse-ui="stats"]{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}[data-eon-expanse-ui="stat"]{padding:12px;border-radius:12px;background:rgba(36,85,126,.18)}
[data-eon-expanse-ui="close"]{position:static;flex:0 0 auto;min-height:44px;border:1px solid rgba(120,205,255,.5);border-radius:999px;background:rgba(8,18,32,.9);color:#fff;padding:8px 13px;cursor:pointer}[data-eon-expanse-ui="close"]:focus-visible{outline:3px solid #fff;outline-offset:2px}
[data-eon-expanse-ui="actions"]{display:flex;flex-wrap:wrap;gap:10px;margin-top:14px}[data-eon-expanse-ui="action"]{border:1px solid rgba(89,200,255,.55);border-radius:999px;background:rgba(22,79,119,.5);color:#f4fbff;padding:9px 14px;font-weight:700;cursor:pointer}[data-eon-expanse-ui="action"][hidden]{display:none}
[data-eon-expanse-ui="my-frontier-planner"]{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:10px;margin-top:12px}[data-eon-expanse-ui="choice-field"]{display:grid;gap:5px;color:#b7cfdd;font-size:11px}[data-eon-expanse-ui="choice-select"]{width:100%;min-height:44px;border:1px solid rgba(89,200,255,.45);border-radius:10px;background:rgba(4,16,30,.9);color:#f4fbff;padding:8px 10px;font:inherit}[data-eon-expanse-ui="choice-select"]:focus-visible{outline:3px solid #fff;outline-offset:2px}[data-eon-expanse-ui-action="my-frontier-plan"]{grid-column:1/-1;justify-self:start}[data-eon-expanse-ui="my-frontier-planner"][hidden]{display:none}
[data-eon-expanse-ui="atlas"]{position:relative;min-height:330px;margin-top:12px;border:1px solid rgba(91,202,255,.28);border-radius:18px;overflow:hidden;background:radial-gradient(circle at 52% 18%,rgba(49,122,177,.24),transparent 35%),linear-gradient(180deg,rgba(7,19,35,.98),rgba(4,10,21,.98));box-shadow:inset 0 0 48px rgba(48,168,255,.08)}
[data-eon-expanse-ui="atlas"]::before{content:"";position:absolute;inset:0;background-image:linear-gradient(rgba(105,204,255,.055) 1px,transparent 1px),linear-gradient(90deg,rgba(105,204,255,.055) 1px,transparent 1px);background-size:28px 28px;mask-image:linear-gradient(to bottom,rgba(0,0,0,.9),rgba(0,0,0,.35))}
[data-eon-expanse-ui="atlas-route"]{position:absolute;height:3px;transform-origin:0 50%;border-radius:999px;background:linear-gradient(90deg,rgba(69,188,255,.32),rgba(112,222,255,.72));box-shadow:0 0 10px rgba(69,188,255,.18);z-index:1}[data-eon-expanse-ui="atlas-route"][data-ready="true"]{background:linear-gradient(90deg,#79e5ff,#ffe293);box-shadow:0 0 14px rgba(255,226,147,.28)}
[data-eon-expanse-ui="atlas-node"]{pointer-events:auto;position:absolute;z-index:2;transform:translate(-50%,-50%);display:grid;place-items:center;gap:3px;min-width:64px;min-height:52px;padding:6px 8px;border:1px solid rgba(111,215,255,.45);border-radius:14px;background:rgba(6,20,36,.92);color:#eaf9ff;font:inherit;cursor:pointer;box-shadow:0 7px 22px rgba(0,0,0,.36)}[data-eon-expanse-ui="atlas-node"] strong{font-size:10px;letter-spacing:.06em}[data-eon-expanse-ui="atlas-node"] span{font-size:9px;color:#9ed8f3}[data-eon-expanse-ui="atlas-node"][data-current="true"]{border-color:#ffe293;box-shadow:0 0 0 2px rgba(255,226,147,.16),0 0 24px rgba(255,226,147,.22)}[data-eon-expanse-ui="atlas-node"][data-discovered="false"]{opacity:.52;filter:saturate(.45)}[data-eon-expanse-ui="atlas-node"]:focus-visible{outline:3px solid #fff;outline-offset:3px}
[data-eon-expanse-ui="atlas-caption"]{position:absolute;left:12px;right:12px;bottom:10px;z-index:3;padding:7px 9px;border-radius:10px;background:rgba(4,12,23,.78);color:#9dcde4;font-size:10px;line-height:1.35;pointer-events:none}
[data-eon-expanse-ui="zones"]{display:grid;gap:8px;margin-top:12px}[data-eon-expanse-ui="zone"]{display:flex;justify-content:space-between;gap:10px;padding:9px 11px;border-radius:10px;background:rgba(28,58,87,.28);font-size:12px}
@media(max-width:760px){[data-eon-expanse-ui="board"]{grid-template-columns:1fr;inset:max(8px,2vh) 10px;padding:0 16px 16px}[data-eon-expanse-ui="board-header"]{margin:0 -16px;padding:12px 16px 10px}[data-eon-expanse-ui="title"]{font-size:clamp(16px,5vw,22px);letter-spacing:.1em}[data-eon-expanse-ui="guidance"]{bottom:72px;width:calc(100vw - 24px);box-sizing:border-box}[data-eon-expanse-ui="arrival"]{top:max(62px,10vh);padding:13px 16px}[data-eon-expanse-ui="companion"]{top:max(64px,env(safe-area-inset-top));left:max(10px,env(safe-area-inset-left));max-width:70vw}[data-eon-expanse-ui="onboarding"]{left:max(10px,env(safe-area-inset-left));bottom:132px;width:calc(100vw - 20px);box-sizing:border-box}[data-eon-expanse-ui="return-hub"]{top:max(10px,env(safe-area-inset-top));right:max(10px,env(safe-area-inset-right));min-height:46px;padding:9px 12px}[data-eon-expanse-ui="touch-interact"]{right:max(10px,env(safe-area-inset-right));bottom:max(12px,env(safe-area-inset-bottom));max-width:calc(100vw - 20px);min-height:50px}[data-eon-expanse-ui="hud"]{top:max(64px,env(safe-area-inset-top));max-width:calc(100vw - 24px)}[data-eon-expanse-ui="hud-objective"]{display:none}}
`;
  const accessibilityProfile = deriveEonExpanseW767QAccessibilityProfile({ reducedMotion, coarsePointer, forcedColors });
  const root = el(documentRef,'div',{'data-eon-expanse-ui':'root','data-reduced-motion':String(accessibilityProfile.reducedMotion),'data-forced-colors':String(accessibilityProfile.forcedColors)});
  const arrival = el(documentRef,'div',{'data-eon-expanse-ui':'arrival','data-active':'false','role':'status','aria-live':'polite','aria-atomic':'true','aria-hidden':'true'});
  const arrivalTitle = el(documentRef,'div',{'data-eon-expanse-ui':'arrival-title'});
  const arrivalNetwork = el(documentRef,'div',{'data-eon-expanse-ui':'arrival-network'});
  const arrivalDetail = el(documentRef,'div',{'data-eon-expanse-ui':'arrival-detail'});
  arrival.append(arrivalTitle,arrivalNetwork,arrivalDetail);
  const hud = el(documentRef,'div',{'data-eon-expanse-ui':'hud','data-active':'false','role':'status','aria-live':'polite','aria-atomic':'true','aria-hidden':'true'});
  const hudZone = el(documentRef,'span',{'data-eon-expanse-ui':'hud-zone'});
  const hudObjective = el(documentRef,'span',{'data-eon-expanse-ui':'hud-objective'});
  const hudDistance = el(documentRef,'span',{'data-eon-expanse-ui':'hud-distance'});
  const hudNetwork = el(documentRef,'span',{'data-eon-expanse-ui':'hud-network'});
  hud.append(hudZone,hudObjective,hudDistance,hudNetwork);
  const eventBanner = el(documentRef,'div',{'data-eon-expanse-ui':'event-banner','data-active':'false','role':'status','aria-live':'polite','aria-atomic':'true','aria-hidden':'true','aria-label':'Optional frontier event'});
  const labelsLayer = el(documentRef,'div',{'data-eon-expanse-ui':'labels','aria-hidden':'true'});
  const labelNodes = Array.from({ length: 3 }, (_, index) => { const node = el(documentRef,'div',{'data-eon-expanse-ui':'world-label','data-active':'false','data-index':String(index)}); labelsLayer.append(node); return node; });
  const onboarding = el(documentRef,'div',{'data-eon-expanse-ui':'onboarding','data-active':'false','role':'status','aria-live':'polite','aria-atomic':'true','aria-hidden':'true'});
  const onboardingStep = el(documentRef,'div',{'data-eon-expanse-ui':'onboarding-step'});
  const onboardingDetail = el(documentRef,'div',{'data-eon-expanse-ui':'onboarding-detail'});
  const onboardingShortcut = el(documentRef,'div',{'data-eon-expanse-ui':'onboarding-shortcut'});
  const onboardingActions = el(documentRef,'div',{'data-eon-expanse-ui':'onboarding-actions'});
  const onboardingMap = el(documentRef,'button',{'data-eon-expanse-ui':'onboarding-action','type':'button','text':'Open map'});
  const onboardingDismiss = el(documentRef,'button',{'data-eon-expanse-ui':'onboarding-action','type':'button','text':'Got it'});
  onboardingActions.append(onboardingMap,onboardingDismiss);
  onboarding.append(onboardingStep,onboardingDetail,onboardingShortcut,onboardingActions);
  const companion = el(documentRef,'div',{'data-eon-expanse-ui':'companion','data-active':'false','role':'status','aria-live':'polite','aria-atomic':'true','aria-hidden':'true'});
  const guidance = el(documentRef,'div',{'data-eon-expanse-ui':'guidance','data-active':'false'});
  const guidanceText = el(documentRef,'span',{'data-eon-expanse-ui':'guidance-text'});
  const guideObjective = el(documentRef,'button',{'data-eon-expanse-ui':'guide-objective','type':'button','text':'EONBOT, guide me','aria-label':'Ask EONBOT to guide the active objective'});
  guideObjective.hidden = true;
  const nextActionButton = el(documentRef,'button',{'data-eon-expanse-ui':'guide-objective','data-eon-expanse-primary-next-action':'true','type':'button','text':'Open Mission Board','aria-label':'Open Mission Board for the next approved action'});
  nextActionButton.hidden = true;
  const dismissAssistance = el(documentRef,'button',{'data-eon-expanse-ui':'guide-objective','type':'button','text':'Not now','aria-label':'Dismiss EONBOT route assistance'});
  dismissAssistance.hidden = true;
  guidance.append(guidanceText,guideObjective,nextActionButton,dismissAssistance);
  const returnHub = el(documentRef,'button',{'data-eon-expanse-ui':'return-hub','type':'button','text':'Return to Command Hub','aria-label':'Return safely to the Command Hub'});
  returnHub.hidden = true;
  const captureMoment = el(documentRef,'button',{'data-eon-expanse-ui':'capture-moment','type':'button','text':'Capture moment','aria-label':'Open Creator Capture for this frontier moment'});
  captureMoment.hidden = true;
  const touchInteract = el(documentRef,'button',{'data-eon-expanse-ui':'touch-interact','type':'button','text':'Interact','aria-label':'Interact with the nearest frontier object'});
  touchInteract.hidden = true;
  const board = el(documentRef,'section',{'data-eon-expanse-ui':'board','data-open':'false','role':'dialog','aria-modal':'true','aria-hidden':'true','aria-labelledby':'eon-expanse-mission-board-title','tabindex':'-1'});
  const boardHeader = el(documentRef,'div',{'data-eon-expanse-ui':'board-header'});
  const title = el(documentRef,'h2',{'data-eon-expanse-ui':'title','id':'eon-expanse-mission-board-title','text':'SIGNAL FRONTIER MISSIONS'});
  const close = el(documentRef,'button',{'data-eon-expanse-ui':'close','type':'button','text':'Close'}); boardHeader.append(title,close); board.append(boardHeader);
  const left = el(documentRef,'div'); const right = el(documentRef,'div'); board.append(left,right);
  const sub = el(documentRef,'div',{'data-eon-expanse-ui':'sub'}); left.append(sub);
  const activeCard = el(documentRef,'div',{'data-eon-expanse-ui':'card'}); const activeLabel = el(documentRef,'div',{'data-eon-expanse-ui':'sub','text':'Active objective'}); const objective = el(documentRef,'div',{'data-eon-expanse-ui':'objective'}); const detail = el(documentRef,'div',{'data-eon-expanse-ui':'detail'}); const actions = el(documentRef,'div',{'data-eon-expanse-ui':'actions'}); const confirmReceipt = el(documentRef,'button',{'data-eon-expanse-ui':'action','type':'button','text':'Confirm campaign receipt'}); const startMission = el(documentRef,'button',{'data-eon-expanse-ui':'action','type':'button','text':'Start mission'}); const guideGate = el(documentRef,'button',{'data-eon-expanse-ui':'action','type':'button','text':'Guide me to Expanse Gate'}); const retryAssets = el(documentRef,'button',{'data-eon-expanse-ui':'action','type':'button','text':'Retry world assets','aria-label':'Retry rejected authored world assets'}); retryAssets.hidden = true; actions.append(confirmReceipt,startMission,guideGate,retryAssets); activeCard.append(activeLabel,objective,detail,actions); left.append(activeCard);
  const stormSectorCard = el(documentRef,'div',{'data-eon-expanse-ui':'card','data-eon-expanse-storm-sector':'true'}); const stormSectorLabel = el(documentRef,'div',{'data-eon-expanse-ui':'sub','text':'Storm Sector field status'}); const stormSectorSummary = el(documentRef,'div',{'data-eon-expanse-ui':'detail'}); const stormSectorMissionList = el(documentRef,'div',{'data-eon-expanse-ui':'asset-repair-focus'}); const stormSectorTransitLabel = el(documentRef,'div',{'data-eon-expanse-ui':'sub','text':'Regional Transit'}); const stormSectorTransitList = el(documentRef,'div',{'data-eon-expanse-ui':'asset-repair-focus'}); stormSectorCard.append(stormSectorLabel,stormSectorSummary,stormSectorMissionList,stormSectorTransitLabel,stormSectorTransitList); stormSectorCard.hidden = true; left.append(stormSectorCard);
  const restorationCard = el(documentRef,'div',{'data-eon-expanse-ui':'card','data-eon-expanse-restoration':'true'}); const restorationLabel = el(documentRef,'div',{'data-eon-expanse-ui':'sub','text':'Regional restoration'}); const restorationObjective = el(documentRef,'div',{'data-eon-expanse-ui':'objective'}); const restorationDetail = el(documentRef,'div',{'data-eon-expanse-ui':'detail'}); const restorationZones = el(documentRef,'div',{'data-eon-expanse-ui':'zones'}); restorationCard.append(restorationLabel,restorationObjective,restorationDetail,restorationZones); restorationCard.hidden = true; left.append(restorationCard);
  const myFrontierCard = el(documentRef,'div',{'data-eon-expanse-ui':'card','data-eon-expanse-my-frontier':'true'}); const myFrontierLabel = el(documentRef,'div',{'data-eon-expanse-ui':'sub','text':'My Frontier'}); const myFrontierObjective = el(documentRef,'div',{'data-eon-expanse-ui':'objective'}); const myFrontierDetail = el(documentRef,'div',{'data-eon-expanse-ui':'detail'}); const myFrontierList = el(documentRef,'div',{'data-eon-expanse-ui':'asset-repair-focus'}); const myFrontierUnlock = el(documentRef,'button',{'data-eon-expanse-ui':'action','type':'button','text':'Open My Frontier'}); myFrontierUnlock.hidden = true; const myFrontierPlanner = el(documentRef,'div',{'data-eon-expanse-ui':'my-frontier-planner'}); const myFrontierPlotField = el(documentRef,'label',{'data-eon-expanse-ui':'choice-field','for':'eon-expanse-my-frontier-plot','text':'District plot'}); const myFrontierPlotSelect = el(documentRef,'select',{'data-eon-expanse-ui':'choice-select','id':'eon-expanse-my-frontier-plot','aria-label':'Choose a My Frontier district plot'}); myFrontierPlotField.append(myFrontierPlotSelect); const myFrontierBuildingField = el(documentRef,'label',{'data-eon-expanse-ui':'choice-field','for':'eon-expanse-my-frontier-building','text':'Approved building'}); const myFrontierBuildingSelect = el(documentRef,'select',{'data-eon-expanse-ui':'choice-select','id':'eon-expanse-my-frontier-building','aria-label':'Choose an approved building'}); myFrontierBuildingField.append(myFrontierBuildingSelect); const myFrontierPlan = el(documentRef,'button',{'data-eon-expanse-ui':'action','data-eon-expanse-ui-action':'my-frontier-plan','type':'button','text':'Plan building'}); myFrontierPlan.hidden = true; myFrontierPlanner.append(myFrontierPlotField,myFrontierBuildingField,myFrontierPlan); myFrontierPlanner.hidden = true; const myFrontierThemeControls=el(documentRef,'div',{'data-eon-expanse-ui':'my-frontier-theme'}); const myFrontierThemeField=el(documentRef,'label',{'data-eon-expanse-ui':'choice-field','for':'eon-expanse-my-frontier-theme','text':'Environmental theme'}); const myFrontierThemeSelect=el(documentRef,'select',{'data-eon-expanse-ui':'choice-select','id':'eon-expanse-my-frontier-theme','aria-label':'Choose an approved My Frontier environmental theme'}); myFrontierThemeField.append(myFrontierThemeSelect); const myFrontierThemeApply=el(documentRef,'button',{'data-eon-expanse-ui':'action','data-eon-expanse-ui-action':'my-frontier-theme','type':'button','text':'Apply theme'}); myFrontierThemeApply.hidden=true; myFrontierThemeControls.append(myFrontierThemeField,myFrontierThemeApply); myFrontierThemeControls.hidden=true; const myFrontierGuide = el(documentRef,'button',{'data-eon-expanse-ui':'action','data-eon-expanse-ui-action':'my-frontier-guide','type':'button','text':'EONBOT, guide me to My Frontier'}); myFrontierGuide.hidden = true; const myFrontierWork = el(documentRef,'button',{'data-eon-expanse-ui':'action','data-eon-expanse-ui-action':'my-frontier-work','type':'button','text':'Review required work'}); myFrontierWork.hidden = true; const myFrontierConstruct = el(documentRef,'button',{'data-eon-expanse-ui':'action','data-eon-expanse-ui-action':'my-frontier-construct','type':'button','text':'Construct foundation'}); myFrontierConstruct.hidden = true; const myFrontierUpgrade = el(documentRef,'button',{'data-eon-expanse-ui':'action','data-eon-expanse-ui-action':'my-frontier-upgrade','type':'button','text':'Upgrade district'}); myFrontierUpgrade.hidden = true; const myFrontierResidentLabel=el(documentRef,'div',{'data-eon-expanse-ui':'sub','text':'Resident stations'}); const myFrontierResidentList=el(documentRef,'div',{'data-eon-expanse-ui':'asset-repair-focus'}); const myFrontierInvite=el(documentRef,'button',{'data-eon-expanse-ui':'action','data-eon-expanse-ui-action':'my-frontier-invite-resident','type':'button','text':'Invite resident'}); myFrontierInvite.hidden=true; myFrontierCard.append(myFrontierLabel,myFrontierObjective,myFrontierDetail,myFrontierList,myFrontierUnlock,myFrontierPlanner,myFrontierThemeControls,myFrontierGuide,myFrontierWork,myFrontierConstruct,myFrontierUpgrade,myFrontierResidentLabel,myFrontierResidentList,myFrontierInvite); myFrontierCard.hidden = true; left.append(myFrontierCard);
  const dynamicEventCard = el(documentRef,'div',{'data-eon-expanse-ui':'card','data-eon-expanse-dynamic-event':'true'}); const dynamicEventLabel = el(documentRef,'div',{'data-eon-expanse-ui':'sub','text':'Active frontier event'}); const dynamicEventObjective = el(documentRef,'div',{'data-eon-expanse-ui':'objective'}); const dynamicEventDetail = el(documentRef,'div',{'data-eon-expanse-ui':'detail'}); dynamicEventCard.append(dynamicEventLabel,dynamicEventObjective,dynamicEventDetail); dynamicEventCard.hidden = true; left.append(dynamicEventCard);
  const frontierCard = el(documentRef,'div',{'data-eon-expanse-ui':'card'}); const frontierLabel = el(documentRef,'div',{'data-eon-expanse-ui':'sub','text':'Living frontier contract'}); const frontierObjective = el(documentRef,'div',{'data-eon-expanse-ui':'objective'}); const frontierDetail = el(documentRef,'div',{'data-eon-expanse-ui':'detail'}); const futureRegionReview=el(documentRef,'button',{'data-eon-expanse-ui':'action','data-eon-expanse-ui-action':'future-region-review','type':'button','text':'Review future-region programme'}); futureRegionReview.hidden=true; frontierCard.append(frontierLabel,frontierObjective,frontierDetail,futureRegionReview); frontierCard.hidden = true; left.append(frontierCard);
  const livingActivityCard = el(documentRef,'div',{'data-eon-expanse-ui':'card','data-eon-expanse-living-activities':'true'}); const livingActivityLabel = el(documentRef,'div',{'data-eon-expanse-ui':'sub','text':'Living frontier activities'}); const livingActivitySummary = el(documentRef,'div',{'data-eon-expanse-ui':'detail'}); const livingActivityList = el(documentRef,'div',{'data-eon-expanse-ui':'living-activity-list'}); const livingActivityAction = el(documentRef,'button',{'data-eon-expanse-ui':'action','data-eon-expanse-living-activity-action':'true','type':'button','text':'Guide activity'}); livingActivityAction.hidden = true; livingActivityCard.append(livingActivityLabel,livingActivitySummary,livingActivityList,livingActivityAction); livingActivityCard.hidden = true; left.append(livingActivityCard);
  const assetRepairCard = el(documentRef,'div',{'data-eon-expanse-ui':'card','data-eon-expanse-asset-repair-focus':'true'}); const assetRepairLabel = el(documentRef,'div',{'data-eon-expanse-ui':'sub','text':'Authored asset repair'}); const assetRepairSummary = el(documentRef,'div',{'data-eon-expanse-ui':'detail'}); const assetRepairItems = el(documentRef,'div',{'data-eon-expanse-ui':'asset-repair-focus'}); assetRepairCard.append(assetRepairLabel,assetRepairSummary,assetRepairItems); assetRepairCard.hidden = true; left.append(assetRepairCard);
  const stats = el(documentRef,'div',{'data-eon-expanse-ui':'stats'}); right.append(stats); const atlas = el(documentRef,'div',{'data-eon-expanse-ui':'atlas','role':'group','aria-label':'Signal Frontier spatial Atlas'}); right.append(atlas); const zones = el(documentRef,'div',{'data-eon-expanse-ui':'zones'}); right.append(zones);
  root.append(arrival,hud,eventBanner,labelsLayer,onboarding,companion,guidance,returnHub,captureMoment,touchInteract,board); host.append(style,root);
  let lastFocused = null;
  let arrivalTimer = null;
  let lastCompanionState = null;
  let lastGuidanceState = null;
  let lastLabels = [];
  let lastOnboarding = null;
  let lastInteraction = null;
  let lastAssetRecovery = null;
  let lastCaptureMoment = null;
  let lastInteractionPresentation = deriveEonExpanseW767ITouchInteraction({ coarsePointer });
  let lastBoard = null; let lastMap = null; let lastRenderSignature = '';
  const renderLabels = () => {
    const boardOpen = board.dataset.open === 'true';
    for (let index = 0; index < labelNodes.length; index += 1) {
      const node = labelNodes[index];
      const record = boardOpen ? null : lastLabels[index];
      const active = Boolean(record && Number.isFinite(Number(record.x)) && Number.isFinite(Number(record.y)));
      node.dataset.active = String(active);
      if (!active) { setText(node, ''); continue; }
      const distance = Number.isFinite(Number(record.distance)) ? ` · ${Math.round(Number(record.distance))} m` : '';
      setText(node, `${record.keyboardHint ? '[E] ' : ''}${record.label || 'Interact'}${distance}`);
      node.dataset.role = String(record.role || 'nearby-interaction');
      const safePosition = projectEonExpanseW766HLabelSafePosition({
        x: Number(record.x),
        y: Number(record.y),
        viewportWidth: Number(root.clientWidth || host.clientWidth || globalThis.innerWidth || 1280),
        viewportHeight: Number(root.clientHeight || host.clientHeight || globalThis.innerHeight || 720),
        index
      });
      node.style.left = `${safePosition.x}px`;
      node.style.top = `${safePosition.y}px`;
      node.dataset.positionAdjusted = String(safePosition.adjusted);
      node.dataset.positionReason = safePosition.reason;
    }
    return freeze({ activeCount: boardOpen ? 0 : lastLabels.slice(0, labelNodes.length).length });
  };
  const renderInteraction = () => {
    lastInteractionPresentation = deriveEonExpanseW767ITouchInteraction({
      coarsePointer,
      expanseActive: lastInteraction?.expanseActive === true,
      transitActive: lastInteraction?.transitActive === true,
      boardOpen: board.dataset.open === 'true',
      nearestInteraction: lastInteraction?.target || null
    });
    touchInteract.hidden = !lastInteractionPresentation.active;
    touchInteract.setAttribute('aria-hidden', String(!lastInteractionPresentation.active));
    touchInteract.dataset.targetId = String(lastInteractionPresentation.target?.id || '');
    setText(touchInteract, lastInteractionPresentation.buttonText || 'Interact');
    touchInteract.setAttribute('aria-label', lastInteractionPresentation.ariaLabel || 'Interact with the nearest frontier object');
    return lastInteractionPresentation;
  };
  const renderOnboarding = () => {
    const active = Boolean(lastOnboarding?.active && board.dataset.open !== 'true');
    setText(onboardingStep, active ? lastOnboarding.title || 'Signal Frontier orientation' : '');
    setText(onboardingDetail, active ? lastOnboarding.detail || '' : '');
    setText(onboardingShortcut, active ? lastOnboarding.shortcut || '' : '');
    onboarding.dataset.active = String(active);
    onboarding.setAttribute('aria-hidden', String(!active));
    onboarding.dataset.step = String(lastOnboarding?.stepId || '');
    onboardingMap.hidden = !active;
    onboardingDismiss.hidden = !active;
    return freeze({ active, stepId: lastOnboarding?.stepId || '' });
  };
  const closeBoard = ({ restoreFocus = true } = {}) => {
    board.dataset.open = 'false';
    board.setAttribute('aria-hidden', 'true');
    if (restoreFocus) lastFocused?.focus?.();
    lastFocused = null;
    renderLabels();
    renderOnboarding();
    renderInteraction();
    return freeze({ ok: true });
  };
  const onDocumentKeyDown = (event) => {
    if (board.dataset.open !== 'true') return;
    if (event.key === 'Escape') { event.preventDefault?.(); closeBoard(); return; }
    if (event.key === 'Tab') { event.preventDefault?.(); close.focus?.(); }
  };
  const onConfirmReceipt = () => {
    const result = onConfirmCampaignReceipt?.({ explicitUserAction: true }) || freeze({ ok: false, reason: 'campaign-confirmation-unavailable' });
    if (result.ok) render();
  };
  const onReviewFutureRegionProgrammeAction = () => {
    const view=lastBoard?.futureRegionProgrammeReview || null; const action=view?.action || null;
    const result=onReviewFutureRegionProgramme?.(action,{ explicitUserAction:true, expectedRegionId:action?.regionId || '', expectedGatewayId:action?.gatewayId || '', expectedReviewToken:action?.reviewToken || '' }) || freeze({ok:false,reason:'future-region-programme-review-unavailable'});
    if (result.ok) render(); else { futureRegionReview.dataset.error=String(result.reason || 'future-region-programme-review-failed'); setText(futureRegionReview,'Programme review unavailable'); }
  };
  const onUnlockMyFrontierAction = () => {
    const view = lastBoard?.myFrontier || null;
    const result = onUnlockMyFrontier?.(view, { explicitUserAction: true, expectedStage: view?.stage || '' }) || freeze({ ok: false, reason: 'my-frontier-unlock-unavailable' });
    if (result.ok) render();
    else { myFrontierUnlock.dataset.error = String(result.reason || 'my-frontier-unlock-failed'); setText(myFrontierUnlock, 'My Frontier unavailable'); }
  };
  const populateMyFrontierBuildingChoices = () => {
    const choice = lastBoard?.myFrontierChoice || null;
    const plotId = String(myFrontierPlotSelect.value || '');
    const previousBuildingId = String(myFrontierBuildingSelect.value || '');
    const plot = choice?.plotOptions?.find?.((entry) => entry.plotId === plotId && entry.selectable) || null;
    const placeholder = el(documentRef,'option',{'value':'','text':plot ? 'Select approved building' : 'Select district first'}); placeholder.disabled = true; myFrontierBuildingSelect.replaceChildren(placeholder);
    for (const building of (plot?.buildings || [])) { const option=el(documentRef,'option',{'value':building.buildingId,'text':`${building.label}${building.currentlyPlanned ? ' · currently planned' : ''}`}); option.title=building.purpose || ''; myFrontierBuildingSelect.append(option); }
    myFrontierBuildingSelect.disabled = !plot;
    myFrontierBuildingSelect.value = plot?.buildings?.some?.((entry) => entry.buildingId === previousBuildingId) ? previousBuildingId : '';
    const selected = plot?.buildings?.find?.((entry) => entry.buildingId === myFrontierBuildingSelect.value) || null;
    myFrontierPlan.hidden = !(plot && selected && selected.buildingId !== plot.currentBuildingId);
    myFrontierPlan.dataset.error = ''; setText(myFrontierPlan, 'Plan building');
    myFrontierPlan.dataset.plotId = plot?.plotId || ''; myFrontierPlan.dataset.buildingId = selected?.buildingId || ''; myFrontierPlan.dataset.currentBuildingId = plot?.currentBuildingId || '';
  };
  const onMyFrontierPlotChange = () => populateMyFrontierBuildingChoices();
  const onMyFrontierBuildingChange = () => populateMyFrontierBuildingChoices();
  const onPlanMyFrontierBuildingAction = () => {
    const plotId = String(myFrontierPlan.dataset.plotId || ''); const buildingId = String(myFrontierPlan.dataset.buildingId || ''); const expectedCurrentBuildingId = String(myFrontierPlan.dataset.currentBuildingId || '');
    const selection = freeze({ plotId, buildingId, expectedCurrentBuildingId });
    const result = onPlanMyFrontierBuilding?.(selection, { explicitUserAction: true, expectedPlotId: plotId, expectedBuildingId: buildingId, expectedCurrentBuildingId }) || freeze({ ok: false, reason: 'my-frontier-planning-unavailable' });
    if (result.ok) { myFrontierPlotSelect.value = ''; populateMyFrontierBuildingChoices(); render(); }
    else { myFrontierPlan.dataset.error = String(result.reason || 'my-frontier-planning-failed'); setText(myFrontierPlan, 'Plan unavailable'); }
  };
  const populateMyFrontierThemeChoices = () => {
    const theme = lastBoard?.myFrontierTheme || null;
    const previousThemeId = String(myFrontierThemeSelect.value || '');
    myFrontierThemeSelect.replaceChildren();
    for (const option of (theme?.options || [])) { const node=el(documentRef,'option',{'value':option.id,'text':option.label}); node.title=option.purpose || ''; myFrontierThemeSelect.append(node); }
    const selectedThemeId = theme?.options?.some?.((entry) => entry.id === previousThemeId) ? previousThemeId : String(theme?.currentThemeId || '');
    myFrontierThemeSelect.value = selectedThemeId;
    const changed = Boolean(theme?.visible && selectedThemeId && selectedThemeId !== theme.currentThemeId);
    myFrontierThemeApply.hidden = !changed; myFrontierThemeApply.dataset.themeId=changed ? selectedThemeId : ''; myFrontierThemeApply.dataset.currentThemeId=String(theme?.currentThemeId || ''); myFrontierThemeApply.dataset.error=''; setText(myFrontierThemeApply, changed ? `Apply ${(theme.options || []).find((entry)=>entry.id===selectedThemeId)?.label || 'theme'}` : 'Apply theme');
  };
  const onMyFrontierThemeChange = () => populateMyFrontierThemeChoices();
  const onSelectMyFrontierThemeAction = () => {
    const themeId=String(myFrontierThemeApply.dataset.themeId || ''); const expectedCurrentThemeId=String(myFrontierThemeApply.dataset.currentThemeId || '');
    const result=onSelectMyFrontierTheme?.(freeze({themeId,expectedCurrentThemeId}),{explicitUserAction:true,expectedThemeId:themeId,expectedCurrentThemeId}) || freeze({ok:false,reason:'my-frontier-theme-unavailable'});
    if (result.ok) render(); else { myFrontierThemeApply.dataset.error=String(result.reason || 'my-frontier-theme-failed'); setText(myFrontierThemeApply,'Theme unavailable'); }
  };
  const onOpenMyFrontierWorkAction = () => {
    const action = lastBoard?.myFrontierReadiness?.action || null;
    const result = onOpenMyFrontierWork?.(action, { explicitUserAction: true, expectedPlotId: action?.plotId || '', expectedBuildingId: action?.buildingId || '', expectedWorkspaceId: action?.workspaceId || '', expectedReason: action?.expectedReason || '' }) || freeze({ ok: false, reason: 'my-frontier-work-unavailable' });
    if (!result.ok) { myFrontierWork.dataset.error = String(result.reason || 'my-frontier-work-failed'); setText(myFrontierWork, 'Work review unavailable'); }
  };
  const onGuideMyFrontierAction = () => {
    const action = lastBoard?.myFrontierNavigation?.action || null;
    const result = onGuideMyFrontier?.(action, { explicitUserAction: true, expectedPlotId: action?.plotId || '', expectedTargetToken: action?.targetToken || '' }) || freeze({ ok: false, reason: 'my-frontier-guidance-unavailable' });
    if (result.ok) closeBoard({ restoreFocus: false });
    else { myFrontierGuide.dataset.error = String(result.reason || 'my-frontier-guidance-failed'); setText(myFrontierGuide, 'Guidance unavailable'); }
  };
  const onConfirmMyFrontierConstructionAction = () => {
    const action = lastBoard?.myFrontierConstructionAction?.action || null;
    const result = onConfirmMyFrontierConstruction?.(action, { explicitUserAction: true, expectedSiteToken: action?.siteToken || '', expectedPlotId: action?.plotId || '', expectedBuildingId: action?.buildingId || '', expectedPermitId: action?.permitId || '', expectedSourceReceiptId: action?.sourceReceiptId || '', expectedRendererSchema: action?.rendererSchema || '' }) || freeze({ ok: false, reason: 'my-frontier-construction-unavailable' });
    if (result.ok) render();
    else { myFrontierConstruct.dataset.error = String(result.reason || 'my-frontier-construction-failed'); setText(myFrontierConstruct, 'Construction unavailable'); }
  };
  const onConfirmMyFrontierDistrictUpgradeAction = () => {
    const action = lastBoard?.myFrontierDistrictUpgrade?.action || null;
    const result = onConfirmMyFrontierDistrictUpgrade?.(action, { explicitUserAction: true, expectedSiteToken: action?.siteToken || '', expectedPlotId: action?.plotId || '', expectedBuildingId: action?.buildingId || '', expectedPermitId: action?.permitId || '', expectedSourceReceiptId: action?.sourceReceiptId || '' }) || freeze({ ok: false, reason: 'my-frontier-district-upgrade-unavailable' });
    if (result.ok) render();
    else { myFrontierUpgrade.dataset.error = String(result.reason || 'my-frontier-district-upgrade-failed'); setText(myFrontierUpgrade, 'Upgrade unavailable'); }
  };
  const onInviteMyFrontierResidentAction = () => {
    const action = lastBoard?.myFrontierResidents?.action || null;
    const result = onInviteMyFrontierResident?.(action, { explicitUserAction: true, expectedSlotId: action?.slotId || '', expectedResidentId: action?.residentId || '', expectedReceiptId: action?.receiptId || '', expectedCompletedAt: action?.completedAt || 0 }) || freeze({ ok: false, reason: 'my-frontier-resident-invitation-unavailable' });
    if (result.ok) render();
    else { myFrontierInvite.dataset.error = String(result.reason || 'my-frontier-resident-invitation-failed'); setText(myFrontierInvite, 'Resident invitation unavailable'); }
  };
  const onReleaseMyFrontierResidentAction = (event) => {
    const button = event?.target?.closest?.('[data-eon-expanse-resident-release-slot]');
    if (!button || !myFrontierResidentList.contains(button)) return;
    const slotId = String(button.getAttribute('data-eon-expanse-resident-release-slot') || '');
    const action = (lastBoard?.myFrontierResidentRelease?.actions || []).find((entry) => entry.slotId === slotId) || null;
    const result = onReleaseMyFrontierResident?.(action, { explicitUserAction: true, expectedSlotId: action?.slotId || slotId, expectedResidentId: action?.residentId || '', expectedReceiptId: action?.receiptId || '', expectedReleaseToken: action?.releaseToken || '' }) || freeze({ ok: false, reason: 'my-frontier-resident-release-unavailable' });
    if (result.ok) render();
    else { button.dataset.error = String(result.reason || 'my-frontier-resident-release-failed'); setText(button, 'Release unavailable'); }
  };
  const onStartAvailableMission = () => {
    const mission = lastBoard?.availableMissions?.[0];
    if (!mission?.id) return;
    const result = onStartMission?.(mission.id, { explicitUserAction: true }) || freeze({ ok: false, reason: 'mission-start-unavailable' });
    if (result.ok) render();
  };
  const onGuideGate = () => { closeBoard({ restoreFocus: false }); onGuideToExpanseGate?.({ explicitUserAction: true }); };
  const onGuideActiveObjective = () => {
    const control = deriveEonExpanseW767VGuidanceControl({ expanseActive: lastGuidanceState?.expanseActive === true, guidanceActive: lastGuidanceState?.active === true, nearTarget: lastGuidanceState?.nearTarget === true, guideState: lastGuidanceState?.guideState });
    const result = control.mode === 'cancel'
      ? (onCancelGuide?.({ explicitUserAction: true, reason: 'explicit-user-cancel' }) || freeze({ ok: false, reason: 'objective-guidance-cancel-unavailable' }))
      : (onGuideObjective?.(lastGuidanceState || {}, { explicitUserAction: true }) || freeze({ ok: false, reason: 'objective-guidance-unavailable' }));
    if (result.ok) {
      guideObjective.disabled = false;
      setText(guideObjective, control.mode === 'cancel' ? 'EONBOT, guide me' : 'Stop guiding');
    }
  };
  const onPrimaryNextAction = () => {
    const action = lastGuidanceState?.primaryAction || null;
    if (action?.kind !== 'open-mission-board') return;
    const result = onOpenMissionMap?.({ explicitUserAction: true, source: 'persistent-next-action' }) || freeze({ ok: false, reason: 'expanse-map-unavailable' });
    if (!result.ok) {
      setText(guidanceText, `Mission Board could not open: ${String(result.reason || 'unknown error').replaceAll('-', ' ')}.`);
      guidance.dataset.active = 'true';
    }
  };
  const onDismissAssistanceAction = () => {
    const result = onDismissAssistance?.({ explicitUserAction: true }) || freeze({ ok: false, reason: 'assistance-dismiss-unavailable' });
    if (result.ok) { dismissAssistance.hidden = true; guidance.dataset.assistance = 'false'; }
  };
  const onSelectLivingActivityAction = () => {
    const items = lastBoard?.livingActivities?.items || [];
    const item = items.find((entry) => entry.verifiedResultAvailable === true)
      || items.find((entry) => entry.status !== 'completed' && ['side-mission','productive-mission','daily-signal'].includes(entry.family));
    if (!item?.activityId) return;
    const result = onSelectLivingActivity?.(item, { explicitUserAction: true, expectedActivityId: item.activityId, expectedReceiptId: item.verifiedReceiptId || '' }) || freeze({ ok: false, reason: 'living-activity-action-unavailable' });
    if (result.ok) closeBoard({ restoreFocus: false });
    else { livingActivityAction.dataset.error = String(result.reason || 'activity-action-failed'); setText(livingActivityAction, 'Activity unavailable'); }
  };
  const onOpenCaptureMomentAction = () => {
    const expectedMomentId = String(lastCaptureMoment?.momentId || '');
    if (!expectedMomentId) return;
    const result = onOpenCaptureMoment?.(captureMoment, { explicitUserAction: true, expectedMomentId }) || freeze({ ok: false, reason: 'creator-capture-unavailable' });
    if (!result.ok) { captureMoment.dataset.error = String(result.reason || 'capture-open-failed'); setText(captureMoment, 'Capture unavailable'); }
  };
  const onReturnHub = () => {
    const result = onReturnToCommandHub?.({ explicitUserAction: true }) || freeze({ ok: false, reason: 'command-hub-return-unavailable' });
    if (!result.ok) { setText(guidanceText, `Return could not start: ${String(result.reason || 'unknown error')}.`); guidance.dataset.active = 'true'; }
  };
  const onAtlasSelect = (event) => {
    const button = event?.target?.closest?.('[data-eon-expanse-atlas-zone]');
    if (!button || !atlas.contains(button)) return;
    const zoneId = String(button.getAttribute('data-eon-expanse-atlas-zone') || '');
    const result = onSelectMapZone?.(zoneId, { explicitUserAction: true }) || freeze({ ok: false, reason: 'atlas-zone-guidance-unavailable' });
    if (result.ok) closeBoard({ restoreFocus: false });
    else { button.dataset.error = String(result.reason || 'atlas-zone-guidance-failed'); button.setAttribute('aria-label', `${button.textContent || zoneId}: guidance unavailable`); }
  };
  const onOpenOnboardingMap = () => {
    const result = onOpenMissionMap?.({ explicitUserAction: true }) || freeze({ ok: false, reason: 'expanse-map-unavailable' });
    if (!result.ok) setText(onboardingDetail, `Map could not open: ${String(result.reason || 'unknown error')}.`);
  };
  const onInteractNearestAction = () => {
    const expectedTargetId = String(lastInteractionPresentation.target?.id || '');
    if (!expectedTargetId) return;
    const result = onInteractNearest?.({ explicitUserAction: true, expectedTargetId, source: 'touch-hud' }) || freeze({ ok: false, reason: 'expanse-interaction-unavailable' });
    if (!result.ok && result.reason === 'expanse-interaction-target-changed') renderInteraction();
  };
  const onDismissOnboardingAction = () => {
    const result = onDismissOnboarding?.({ explicitUserAction: true }) || freeze({ ok: false, reason: 'onboarding-dismiss-unavailable' });
    if (result.ok) { lastOnboarding = result.state || null; renderOnboarding(); }
  };
  const renderAssetRecovery = () => {
    const state = lastAssetRecovery || {};
    retryAssets.hidden = !(state.repairRequired && state.expanseActive && !state.releaseReady);
    retryAssets.disabled = state.available !== true;
    retryAssets.dataset.status = String(state.status || 'idle');
    if (state.status === 'retrying') setText(retryAssets, 'Retrying world assets…');
    else if (state.status === 'cooldown') setText(retryAssets, 'World asset retry cooling down');
    else if (state.status === 'exhausted') setText(retryAssets, 'World asset retry limit reached');
    else if (state.status === 'loading') setText(retryAssets, 'World assets loading…');
    else setText(retryAssets, 'Retry world assets');
    retryAssets.title = state.lastReason ? `Last retry: ${state.lastReason}` : `${Number(state.remainingAttempts || 0)} retry attempts available`;
    return freeze({ visible: !retryAssets.hidden, status: state.status || 'idle', available: state.available === true });
  };
  const onRetryAssetsAction = () => {
    const result = onRetryAssets?.({ explicitUserAction: true }) || freeze({ ok: false, reason: 'asset-recovery-unavailable' });
    if (result.state) lastAssetRecovery = result.state;
    renderAssetRecovery();
  };
  close.addEventListener('click',()=>closeBoard());
  confirmReceipt.addEventListener('click', onConfirmReceipt);
  startMission.addEventListener('click', onStartAvailableMission);
  guideGate.addEventListener('click', onGuideGate);
  guideObjective.addEventListener('click', onGuideActiveObjective);
  nextActionButton.addEventListener('click', onPrimaryNextAction);
  dismissAssistance.addEventListener('click', onDismissAssistanceAction);
  returnHub.addEventListener('click', onReturnHub);
  captureMoment.addEventListener('click', onOpenCaptureMomentAction);
  livingActivityAction.addEventListener('click', onSelectLivingActivityAction);
  futureRegionReview.addEventListener('click', onReviewFutureRegionProgrammeAction);
  myFrontierUnlock.addEventListener('click', onUnlockMyFrontierAction);
  myFrontierPlotSelect.addEventListener('change', onMyFrontierPlotChange);
  myFrontierBuildingSelect.addEventListener('change', onMyFrontierBuildingChange);
  myFrontierPlan.addEventListener('click', onPlanMyFrontierBuildingAction);
  myFrontierThemeSelect.addEventListener('change', onMyFrontierThemeChange);
  myFrontierThemeApply.addEventListener('click', onSelectMyFrontierThemeAction);
  myFrontierGuide.addEventListener('click', onGuideMyFrontierAction);
  myFrontierWork.addEventListener('click', onOpenMyFrontierWorkAction);
  myFrontierConstruct.addEventListener('click', onConfirmMyFrontierConstructionAction);
  myFrontierUpgrade.addEventListener('click', onConfirmMyFrontierDistrictUpgradeAction);
  myFrontierInvite.addEventListener('click', onInviteMyFrontierResidentAction);
  myFrontierResidentList.addEventListener('click', onReleaseMyFrontierResidentAction);
  touchInteract.addEventListener('click', onInteractNearestAction);
  retryAssets.addEventListener('click', onRetryAssetsAction);
  atlas.addEventListener('click', onAtlasSelect);
  onboardingMap.addEventListener('click', onOpenOnboardingMap);
  onboardingDismiss.addEventListener('click', onDismissOnboardingAction);
  documentRef.addEventListener?.('keydown', onDocumentKeyDown);

  const render = () => {
    if (!lastBoard) return;
    const signature = JSON.stringify({
      level: lastBoard.level, totalXp: lastBoard.totalXp, campaign: lastBoard.campaign, active: lastBoard.active,
      mapCompletion: lastBoard.mapCompletion, discoveries: lastBoard.discoveries, sideActivities: lastBoard.sideActivities,
      productiveActivities: lastBoard.productiveActivities, productiveTransformationStatus: lastBoard.productiveTransformationStatus, sideTransformationStatus: lastBoard.sideTransformationStatus, postCampaign: lastBoard.postCampaign, futureRegionProgramme: lastBoard.futureRegionProgramme, openWorldArtAudit: lastBoard.openWorldArtAudit, futureRegionReleaseGate: lastBoard.futureRegionReleaseGate, performanceReadiness: lastBoard.performanceReadiness, futureRegionProgrammeReview: lastBoard.futureRegionProgrammeReview, futureRegionPackageReadiness: lastBoard.futureRegionPackageReadiness, futureRegionReleaseMatrix: lastBoard.futureRegionReleaseMatrix, futureRegionReleaseReview: lastBoard.futureRegionReleaseReview, stormSector: lastBoard.stormSector, dynamicEvent: lastBoard.dynamicEvent, restorationStatus: lastBoard.restorationStatus, zoneRestorationBoard: lastBoard.zoneRestorationBoard, livingActivities: lastBoard.livingActivities, campaignObjectiveAuthority: lastBoard.campaignObjectiveAuthority, persistentNextAction: lastBoard.persistentNextAction, myFrontier: lastBoard.myFrontier, myFrontierChoice: lastBoard.myFrontierChoice, myFrontierReadiness: lastBoard.myFrontierReadiness, myFrontierConstructionAction: lastBoard.myFrontierConstructionAction, myFrontierNavigation: lastBoard.myFrontierNavigation, myFrontierResidents: lastBoard.myFrontierResidents, myFrontierResidentRelease: lastBoard.myFrontierResidentRelease, myFrontierTheme: lastBoard.myFrontierTheme, myFrontierDistrictUpgrade: lastBoard.myFrontierDistrictUpgrade, myFrontierPresentation: lastBoard.myFrontierPresentation, frontier: lastBoard.frontier, assetRepairFocus: lastBoard.assetRepairFocus, outskirts: lastMap?.outskirts, zones: (lastMap?.zones || []).map((zone) => [zone.id, zone.marker, zone.truthfulLabel])
    });
    if (signature === lastRenderSignature) return;
    lastRenderSignature = signature;
    const stormSector = lastBoard.stormSector || null;
    const stormActive = stormSector?.active === true;
    setText(title, stormActive ? stormSector.title || 'STORM SECTOR MISSIONS' : 'SIGNAL FRONTIER MISSIONS');
    setText(sub, stormActive ? stormSector.subtitle || 'Storm Sector field status' : `Level ${lastBoard.level} · ${lastBoard.totalXp} XP · Campaign ${lastBoard.campaign.completed}/${lastBoard.campaign.total}`);
    const persistentNextAction = lastBoard.persistentNextAction || null;
    setText(activeLabel, stormActive ? 'Active Storm objective' : (lastBoard.active ? 'Active objective' : 'Next action'));
    setText(objective, stormActive ? (stormSector.activeObjective?.label || stormSector.completionLabel || 'Storm Sector exploration') : (lastBoard.active?.label || persistentNextAction?.label || (lastBoard.campaign.complete ? 'Signal Restoration complete' : 'Choose a mission')));
    const objectiveDetail = stormActive ? (stormSector.activeObjective?.detail || 'The Storm Sector mission chain is complete. Use the authored return terminal when ready.') : (lastBoard.active?.prompt || lastBoard.active?.guidance || persistentNextAction?.detail || (lastBoard.campaign.complete ? 'The frontier remains open for discoveries, side missions, and Daily Signal activities.' : 'Open the Expanse Gate to begin.'));
    const authorityDetail = stormActive ? (stormSector.activeObjective ? 'Completion authority: explicit physical field interaction.' : '') : (lastBoard.campaignObjectiveAuthority?.active === true ? lastBoard.campaignObjectiveAuthority.detail : '');
    setText(detail,[objectiveDetail, authorityDetail].filter(Boolean).join(' '));
    const nextMission = lastBoard.availableMissions?.[0] || null;
    confirmReceipt.hidden = stormActive || lastBoard.active?.objective !== 'confirm-campaign-receipt';
    startMission.hidden = stormActive || !nextMission || Boolean(lastBoard.active);
    if (nextMission) setText(startMission, `Start ${nextMission.label} · ${nextMission.xp} XP`);
    guideGate.hidden = stormActive || Boolean(lastBoard.campaign.complete) || Boolean(lastBoard.active) || Boolean(nextMission);
    stormSectorCard.hidden = !stormActive;
    stormSectorMissionList.replaceChildren();
    stormSectorTransitList.replaceChildren();
    if (stormActive) {
      const stormNextAction = stormSector.complete ? 'Storm Sector restored · Next: explore, talk to a patrol, open EONBOT, or open Worlds' : stormSector.activeObjective?.label ? `Next: ${stormSector.activeObjective.label} · follow the marker → E / tap Use` : 'Next: follow the active Storm marker → E / tap Use';
      setText(stormSectorSummary, `${stormNextAction} · ${stormSector.presentedNpcCount}/${stormSector.requestedNpcCount} authored patrols · ${stormSector.authoredHeroCount} authored heroes · return ${stormSector.returnAvailable ? 'available' : 'in transition'}.`);
      for (const mission of stormSector.missionRows || []) { const row=el(documentRef,'div',{'data-eon-expanse-ui':'zone'}); row.append(el(documentRef,'span',{text:mission.label}),el(documentRef,'span',{text:`${mission.progress} · ${mission.completed ? 'complete' : mission.active ? 'active' : 'queued'}`})); row.title=`${mission.nextLabel} · ${mission.zoneId.replaceAll('-', ' ')}`; stormSectorMissionList.append(row); }
      for (const node of stormSector.transitRows || []) { const row=el(documentRef,'div',{'data-eon-expanse-ui':'zone'}); row.append(el(documentRef,'span',{text:node.label}),el(documentRef,'span',{text:node.status})); row.title=node.detail; stormSectorTransitList.append(row); }
    }
    const restoration = lastBoard.restorationStatus || null;
    restorationCard.hidden = stormActive || !restoration;
    restorationZones.replaceChildren();
    if (restoration) { setText(restorationObjective, `${restoration.onlinePercent}% online · ${restoration.currentLabel}`); setText(restorationDetail, restoration.complete ? 'Signal Frontier is fully reconnected.' : `Next verified transformation: ${restoration.nextLabel}.`); for (const zone of (lastBoard.zoneRestorationBoard?.rows || [])) { const row=el(documentRef,'div',{'data-eon-expanse-ui':'zone'}); row.append(el(documentRef,'span',{text:zone.label}),el(documentRef,'span',{text:`${zone.statusLabel} · ${zone.restorationPercent}%`})); row.title=zone.transformationLabel || zone.statusLabel; restorationZones.append(row); } }
    const myFrontier = lastBoard.myFrontier || null;
    myFrontierCard.hidden = stormActive || myFrontier?.visible !== true;
    myFrontierList.replaceChildren();
    if (myFrontier?.visible) {
      setText(myFrontierObjective, myFrontier.title || 'My Frontier');
      const readiness = lastBoard.myFrontierReadiness || null; const readinessByPlot = new Map((readiness?.rows || []).map((entry) => [entry.plotId, entry])); const presentationByPlot = new Map((lastBoard.myFrontierPresentation?.rows || []).map((entry) => [entry.plotId, entry]));
      setText(myFrontierDetail, `${myFrontier.detail || 'Fixed authored plots preserve collision-safe construction.'}${readiness?.visible ? ` · ${readiness.readyCount} permit${readiness.readyCount === 1 ? '' : 's'} ready` : ''}`);
      for (const item of (myFrontier.rows || []).slice(0, 7)) { const row=el(documentRef,'div',{'data-eon-expanse-ui':'zone'}); const building=item.constructedBuildingId || item.plannedBuildingId || 'Choose building'; const readinessItem=readinessByPlot.get(item.plotId); const presentationItem=presentationByPlot.get(item.plotId); const truthfulStatus=presentationItem?.status || readinessItem?.status || item.status; row.append(el(documentRef,'span',{text:item.label}),el(documentRef,'span',{text:`${building.replaceAll('-', ' ')} · ${truthfulStatus.replaceAll('-', ' ')}` })); row.title=presentationItem?.detail || readinessItem?.detail || (item.unavailableReason ? item.unavailableReason.replaceAll('-', ' ') : `${item.allowedBuildingIds.length} approved choice${item.allowedBuildingIds.length === 1 ? '' : 's'}`); myFrontierList.append(row); }
      myFrontierUnlock.hidden = myFrontier.action?.type !== 'unlock-my-frontier';
      myFrontierUnlock.dataset.error = '';
      setText(myFrontierUnlock, myFrontier.action?.label || 'Open My Frontier');
      const choice = lastBoard.myFrontierChoice || null; const previousPlotId = String(myFrontierPlotSelect.value || '');
      myFrontierPlanner.hidden = !(myFrontier.stage === 'planning' && choice?.visible === true && choice.plotOptions?.some?.((entry) => entry.selectable));
      if (!myFrontierPlanner.hidden) { const placeholder=el(documentRef,'option',{'value':'','text':'Select district plot'}); placeholder.disabled=true; myFrontierPlotSelect.replaceChildren(placeholder); for (const plot of choice.plotOptions.filter((entry) => entry.selectable)) myFrontierPlotSelect.append(el(documentRef,'option',{'value':plot.plotId,'text':`${plot.label}${plot.currentBuildingId ? ` · ${plot.currentBuildingId.replaceAll('-', ' ')}` : ''}`})); myFrontierPlotSelect.value = choice.plotOptions.some((entry) => entry.selectable && entry.plotId === previousPlotId) ? previousPlotId : ''; populateMyFrontierBuildingChoices(); }
      const theme=lastBoard.myFrontierTheme || null; myFrontierThemeControls.hidden=theme?.visible !== true; if (!myFrontierThemeControls.hidden) populateMyFrontierThemeChoices();
      const navigation = lastBoard.myFrontierNavigation || null; myFrontierGuide.hidden = navigation?.available !== true || navigation?.action?.type !== 'guide-my-frontier'; myFrontierGuide.dataset.error = ''; setText(myFrontierGuide, navigation?.action?.label || 'EONBOT, guide me to My Frontier');
      myFrontierWork.hidden = readiness?.action?.type !== 'open-maintained-workspace'; myFrontierWork.dataset.error = ''; setText(myFrontierWork, readiness?.action?.label || 'Review required work');
      const constructionAction = lastBoard.myFrontierConstructionAction || null; myFrontierConstruct.hidden = constructionAction?.available !== true || constructionAction?.action?.type !== 'confirm-my-frontier-construction'; myFrontierConstruct.dataset.error = ''; setText(myFrontierConstruct, constructionAction?.action?.label || 'Construct foundation');
      const districtUpgrade = lastBoard.myFrontierDistrictUpgrade || null; myFrontierUpgrade.hidden = districtUpgrade?.action?.type !== 'confirm-my-frontier-district-upgrade'; myFrontierUpgrade.dataset.error = ''; setText(myFrontierUpgrade, districtUpgrade?.action?.label || 'Upgrade district');
      const hasConstructedPlot=(lastBoard.myFrontierPresentation?.rows || []).some((entry)=>entry.status==='constructed-foundation');
      const nextBuildAction = readiness?.action?.type === 'open-maintained-workspace' ? 'Next: Review required work' : constructionAction?.available === true && constructionAction?.action?.type === 'confirm-my-frontier-construction' ? 'Next: Construct foundation' : districtUpgrade?.action?.type === 'confirm-my-frontier-district-upgrade' ? 'Next: Upgrade district' : hasConstructedPlot ? 'Next: use a building terminal or walk to another plot and Plan' : 'Next: walk to a plot → E / tap Use → choose a building → Plan';
      setText(myFrontierObjective,nextBuildAction);
      const residents=lastBoard.myFrontierResidents || null; const residentRelease=lastBoard.myFrontierResidentRelease || null; const releaseBySlot=new Map((residentRelease?.actions || []).map((entry)=>[entry.slotId,entry])); myFrontierResidentList.replaceChildren(); for (const resident of (residents?.rows || []).slice(0,6)) { const row=el(documentRef,'div',{'data-eon-expanse-ui':'zone'}); row.append(el(documentRef,'span',{text:resident.label}),el(documentRef,'span',{text:resident.status.replaceAll('-', ' ')})); const releaseAction=releaseBySlot.get(resident.slotId); if (releaseAction?.type === 'release-my-frontier-resident') row.append(el(documentRef,'button',{'data-eon-expanse-ui':'action','data-eon-expanse-resident-release-slot':releaseAction.slotId,'type':'button','text':releaseAction.label})); row.title=resident.invited ? 'Invitation verified. Release remains explicit and the character arc stays available for re-invitation.' : resident.status.replaceAll('-', ' '); myFrontierResidentList.append(row); } myFrontierResidentLabel.hidden=residents?.visible !== true; myFrontierResidentList.hidden=residents?.visible !== true; myFrontierInvite.hidden=residents?.action?.type !== 'invite-my-frontier-resident'; myFrontierInvite.dataset.error=''; setText(myFrontierInvite,residents?.action?.label || 'Invite resident');
    } else { myFrontierUnlock.hidden = true; myFrontierPlanner.hidden = true; myFrontierThemeControls.hidden = true; myFrontierGuide.hidden = true; myFrontierWork.hidden = true; myFrontierConstruct.hidden = true; myFrontierUpgrade.hidden = true; myFrontierResidentLabel.hidden=true; myFrontierResidentList.hidden=true; myFrontierInvite.hidden=true; }
    const dynamicEvent = lastBoard.dynamicEvent || null;
    dynamicEventCard.hidden = stormActive || dynamicEvent?.active !== true;
    if (dynamicEvent?.active) { setText(dynamicEventObjective, dynamicEvent.boardTitle || dynamicEvent.label || 'Frontier event'); setText(dynamicEventDetail, dynamicEvent.boardDetail || 'Optional frontier event. Return to the Command Hub remains available.'); }
    const frontier = lastBoard.frontier?.activeContract || null;
    const postCampaign = lastBoard.postCampaign || null;
    const futureRegionProgramme = lastBoard.futureRegionProgramme || null;
    const futureRegionReleaseGate = lastBoard.futureRegionReleaseGate || null;
    const performanceReadiness = lastBoard.performanceReadiness || null;
    const futureRegionProgrammeReview = lastBoard.futureRegionProgrammeReview || null;
    const futureRegionPackageReadiness = lastBoard.futureRegionPackageReadiness || null;
    const futureRegionReleaseMatrix = lastBoard.futureRegionReleaseMatrix || null;
    const futureRegionReleaseReview = lastBoard.futureRegionReleaseReview || null;
    frontierCard.hidden = stormActive || (!frontier && postCampaign?.visible !== true);
    if (frontier) { futureRegionReview.hidden=true; setText(frontierLabel, 'Living frontier contract'); setText(frontierObjective, `${frontier.label} · ${frontier.xp} XP · ${frontier.progress || '0/3'}`); setText(frontierDetail, frontier.nextStep?.label ? `Next field action: ${frontier.nextStep.label}. ${frontier.objective}` : frontier.objective); }
    else if (postCampaign?.visible) { const recommended=futureRegionProgramme?.recommendedRegion || null; const reviewed=futureRegionProgrammeReview?.reviewedRegion || null; const releaseStatus=String(futureRegionReleaseGate?.status || futureRegionProgramme?.status || postCampaign.futureRegionStatus || '').replaceAll('-', ' '); const performanceStatus=String(performanceReadiness?.status || 'performance evidence required').replaceAll('-', ' '); const proxyDetail=futureRegionReleaseGate?.blockingProxyCount > 0 ? ` ${futureRegionReleaseGate.blockingProxyCount} deterministic development proxies still require authored replacement; ${Number(lastBoard.openWorldArtAudit?.visibleDevelopmentProxyCount || 0)} remain visible in release presentation.` : ''; const packageDetail=futureRegionPackageReadiness?.visible === true ? ` Package gate: ${futureRegionPackageReadiness.status.replaceAll('-', ' ')} (${futureRegionPackageReadiness.completedRequirements}/${futureRegionPackageReadiness.totalRequirements}).` : ''; const matrixDetail=futureRegionReleaseMatrix?.visible === true ? ` Release matrix: ${futureRegionReleaseMatrix.completedGates}/${futureRegionReleaseMatrix.totalGates} gates complete.` : ''; const releaseReviewDetail=futureRegionReleaseReview?.reviewedRelease ? ' Final release package reviewed; gateway remains locked.' : futureRegionReleaseReview?.available === true ? ' Final owner release review is available through the certification runtime.' : ''; futureRegionReview.hidden=futureRegionProgrammeReview?.available !== true; futureRegionReview.dataset.error=''; if (!futureRegionReview.hidden) { futureRegionReview.dataset.regionId=futureRegionProgrammeReview.action.regionId; futureRegionReview.dataset.gatewayId=futureRegionProgrammeReview.action.gatewayId; futureRegionReview.dataset.reviewToken=futureRegionProgrammeReview.action.reviewToken; setText(futureRegionReview,futureRegionProgrammeReview.action.label); } setText(frontierLabel, 'Post-campaign frontier'); setText(frontierObjective, `${postCampaign.completedPillars}/${postCampaign.totalPillars} maintained pillars active`); setText(frontierDetail, reviewed ? `${reviewed.regionId.replaceAll('-', ' ')} programme reviewed. Gateway remains locked. Release gate: ${releaseStatus}. Performance gate: ${performanceStatus}.${proxyDetail}${packageDetail}${matrixDetail}${releaseReviewDetail}` : recommended && futureRegionProgramme?.reviewAvailable === true ? `${postCampaign.nextLabel}. Authored programme review ready: ${recommended.label}. ${recommended.promise} Release gate: ${releaseStatus}. Performance gate: ${performanceStatus}.${proxyDetail}${packageDetail}${matrixDetail}${releaseReviewDetail}` : `${postCampaign.nextLabel}. Future region status: ${releaseStatus}. Performance gate: ${performanceStatus}.${proxyDetail}${packageDetail}${matrixDetail}${releaseReviewDetail}`); }
    const livingActivities = lastBoard.livingActivities || null;
    livingActivityCard.hidden = stormActive || !livingActivities?.items?.length;
    livingActivityList.replaceChildren();
    if (livingActivities?.items?.length) {
      setText(livingActivitySummary, `${livingActivities.inProgressCount} in progress · ${livingActivities.productiveReviewCount} productive review${livingActivities.productiveReviewCount === 1 ? '' : 's'}${livingActivities.verifiedResultCount ? ` · ${livingActivities.verifiedResultCount} verified result${livingActivities.verifiedResultCount === 1 ? '' : 's'} ready` : ''} · no streak penalty.`);
      for (const item of livingActivities.items) { const row=el(documentRef,'div',{'data-eon-expanse-ui':'zone'}); row.append(el(documentRef,'span',{text:`${item.label} · ${item.progress}`}),el(documentRef,'span',{text:item.verifiedResultAvailable ? 'verified result ready' : item.status})); row.title=`${item.zoneLabel} · ${item.detail}`; livingActivityList.append(row); }
      if (livingActivities.moreCount > 0) { const row=el(documentRef,'div',{'data-eon-expanse-ui':'zone'}); row.append(el(documentRef,'span',{text:`${livingActivities.moreCount} more available`}),el(documentRef,'span',{text:'Open activity stations'})); livingActivityList.append(row); }
      const actionable = livingActivities.items.find((item) => item.verifiedResultAvailable === true)
        || livingActivities.items.find((item) => item.status !== 'completed' && ['side-mission','productive-mission','daily-signal'].includes(item.family));
      livingActivityAction.hidden = !actionable;
      livingActivityAction.dataset.activityId = actionable?.activityId || '';
      livingActivityAction.dataset.receiptId = actionable?.verifiedReceiptId || '';
      livingActivityAction.dataset.error = '';
      setText(livingActivityAction, actionable ? (actionable.verifiedResultAvailable ? 'Claim verified result' : actionable.family === 'daily-signal' ? (actionable.status === 'ready-to-claim' ? 'Claim Daily Signal' : `Review ${actionable.label}`) : actionable.family === 'productive-mission' ? `Review ${actionable.label}` : `Guide to ${actionable.zoneLabel}`) : 'Guide activity');
    } else { livingActivityAction.hidden = true; livingActivityAction.dataset.activityId = ''; livingActivityAction.dataset.receiptId = ''; }
    const repairFocus = lastBoard.assetRepairFocus || null;
    assetRepairCard.hidden = stormActive || repairFocus?.visible !== true;
    assetRepairItems.replaceChildren();
    if (repairFocus?.visible) {
      setText(assetRepairSummary, `${repairFocus.affectedZoneCount} affected zone${repairFocus.affectedZoneCount === 1 ? '' : 's'} · ${repairFocus.rejectedCount} rejected · ${repairFocus.proceduralFallbackCount} procedural fallback${repairFocus.proceduralFallbackCount === 1 ? '' : 's'}. Browser evidence is still required.`);
      for (const item of repairFocus.items || []) { const row=el(documentRef,'div',{'data-eon-expanse-ui':'zone'}); row.append(el(documentRef,'span',{text:item.label}),el(documentRef,'span',{text:item.categoryLabel})); row.title=`${item.zoneLabel} · ${item.state}`; assetRepairItems.append(row); }
      if (repairFocus.moreCount > 0) { const row=el(documentRef,'div',{'data-eon-expanse-ui':'zone'}); row.append(el(documentRef,'span',{text:`${repairFocus.moreCount} more repair item${repairFocus.moreCount === 1 ? '' : 's'}`}),el(documentRef,'span',{text:'See asset truth export'})); assetRepairItems.append(row); }
    }
    stats.replaceChildren();
    const statRows = stormActive
      ? [['Missions',`${stormSector.missionRows.filter((entry)=>entry.completed).length}/${stormSector.missionRows.length}`],['Objectives',stormSector.subtitle.split(' · ').pop() || '0/9 objectives'],['Patrols',`${stormSector.presentedNpcCount}/${stormSector.requestedNpcCount} authored`],['Hero assets',`${stormSector.authoredHeroCount}/3 presented`],['Transit',`${stormSector.unlockedTransitCount}/${stormSector.totalTransitCount} nodes`],['Return',stormSector.returnAvailable ? 'Available' : 'Transition active']]
      : [['Map',`${lastBoard.mapCompletion}%`],['Discoveries',`${lastBoard.discoveries.completed}/${lastBoard.discoveries.total} + ${lastBoard.discoveries.procedural} frontier`],['Side missions',`${lastBoard.sideActivities} · ${lastBoard.sideTransformationStatus?.activeCount || 0}/${lastBoard.sideTransformationStatus?.total || 5} memories active`],['Productive',`${lastBoard.productiveActivities} · ${lastBoard.productiveTransformationStatus?.activeCount || 0}/${lastBoard.productiveTransformationStatus?.total || 5} signals online`],['Frontier contracts',lastBoard.frontier.completedContracts],['World families',lastBoard.frontier.regionFamilies || 'Deferred']];
    for (const [label,value] of statRows) { const card=el(documentRef,'div',{'data-eon-expanse-ui':'stat'}); card.append(el(documentRef,'div',{'data-eon-expanse-ui':'sub','text':label}),el(documentRef,'strong',{text:value})); stats.append(card); }
    atlas.replaceChildren();
    const atlasView = !stormActive ? lastMap?.atlas : null;
    atlas.hidden = !atlasView?.nodes?.length;
    if (!atlas.hidden) {
      for (const route of atlasView.routes || []) {
        const dx = Number(route.to.xPct) - Number(route.from.xPct); const dy = Number(route.to.yPct) - Number(route.from.yPct);
        const line = el(documentRef,'div',{'data-eon-expanse-ui':'atlas-route','data-ready':String(route.transitReady === true),'aria-hidden':'true'});
        line.style.left = `${route.from.xPct}%`; line.style.top = `${route.from.yPct}%`; line.style.width = `${Math.hypot(dx,dy)}%`; line.style.transform = `rotate(${Math.atan2(dy,dx) * 180 / Math.PI}deg)`; atlas.append(line);
      }
      for (const node of atlasView.nodes || []) {
        const button = el(documentRef,'button',{'data-eon-expanse-ui':'atlas-node','data-eon-expanse-atlas-zone':node.id,'data-current':String(node.current === true),'data-discovered':String(node.discovered === true),'type':'button','aria-label':`${node.truthfulLabel}. ${node.promise || ''} Guide to this zone.`});
        button.style.left = `${node.xPct}%`; button.style.top = `${node.yPct}%`; button.append(el(documentRef,'strong',{text:node.symbol || node.shortLabel || node.label}),el(documentRef,'span',{text:node.current ? 'YOU ARE HERE' : node.transitUnlocked ? 'TRANSIT' : node.discovered ? node.shortLabel : 'UNKNOWN'})); atlas.append(button);
      }
      atlas.append(el(documentRef,'div',{'data-eon-expanse-ui':'atlas-caption','text':atlasView.subtitle || 'Select a discovered zone to ask EONBOT for guidance.'}));
    }
    zones.replaceChildren();
    if (stormActive) { for (const node of stormSector.transitRows || []) { const row=el(documentRef,'div',{'data-eon-expanse-ui':'zone'}); row.append(el(documentRef,'span',{text:node.label}),el(documentRef,'span',{text:node.status})); row.title=node.detail; zones.append(row); } }
    else { for (const zone of lastMap?.zones || []) { const row=el(documentRef,'div',{'data-eon-expanse-ui':'zone'}); row.append(el(documentRef,'span',{text:zone.truthfulLabel}),el(documentRef,'span',{text:zone.marker})); zones.append(row); } if (lastMap?.outskirts) { const row=el(documentRef,'div',{'data-eon-expanse-ui':'zone'}); row.append(el(documentRef,'span',{text:lastMap.outskirts.label}),el(documentRef,'span',{text:lastMap.outskirts.marker})); row.title=lastMap.outskirts.truthfulLabel; zones.append(row); } }
  };
  const resetWorldPresentation = ({ reason = 'world-presentation-reset' } = {}) => {
    if (arrivalTimer) globalThis.clearTimeout?.(arrivalTimer);
    arrivalTimer = null;
    arrival.dataset.active = 'false';
    arrival.setAttribute('aria-hidden', 'true');
    setText(arrivalTitle, ''); setText(arrivalNetwork, ''); setText(arrivalDetail, '');

    lastCompanionState = null;
    setText(companion, '');
    companion.dataset.active = 'false';
    companion.setAttribute('aria-hidden', 'true');
    companion.dataset.phase = '';
    companion.dataset.behavior = '';

    lastGuidanceState = null;
    setText(guidanceText, '');
    guidance.dataset.active = 'false';
    guidance.dataset.persistent = 'false';
    guidance.dataset.nextActionKind = '';
    guidance.dataset.assistance = 'false';
    guideObjective.dataset.assistance = 'false';
    guideObjective.hidden = true;
    nextActionButton.hidden = true;
    nextActionButton.dataset.actionKind = '';
    dismissAssistance.hidden = true;
    returnHub.hidden = true;
    returnHub.setAttribute('aria-hidden', 'true');
    hud.dataset.active = 'false';
    hud.setAttribute('aria-hidden', 'true');
    setText(hudZone, ''); setText(hudObjective, ''); setText(hudDistance, ''); setText(hudNetwork, '');
    hudNetwork.dataset.complete = 'false';

    setText(eventBanner, '');
    eventBanner.dataset.active = 'false';
    eventBanner.dataset.eventId = '';
    eventBanner.setAttribute('aria-hidden', 'true');

    lastCaptureMoment = null;
    captureMoment.hidden = true;
    captureMoment.setAttribute('aria-hidden', 'true');
    captureMoment.dataset.momentId = '';
    captureMoment.dataset.error = '';
    setText(captureMoment, 'Capture moment');

    lastOnboarding = null;
    renderOnboarding();
    lastLabels = [];
    renderLabels();
    lastInteraction = null;
    renderInteraction();
    closeBoard({ restoreFocus: false });
    root.dataset.worldActive = 'false';
    root.dataset.resetReason = String(reason || 'world-presentation-reset');
    return freeze({ ok: true, reason: root.dataset.resetReason, expanseActive: false, hudVisible: false, captureMomentVisible: false, dynamicEventVisible: false, worldLabelCount: 0, boardOpen: false });
  };

  return freeze({ ok:true, schema:EON_EXPANSE_W766H_UI_SCHEMA,
    resetWorldPresentation,
    showArrival({ title = 'SIGNAL FRONTIER', network = 'Regional network: 8% online', detail = 'Companion signal detected', durationMs = 4200 } = {}) {
      if (arrivalTimer) globalThis.clearTimeout?.(arrivalTimer);
      root.dataset.worldActive = 'true';
      setText(arrivalTitle, title); setText(arrivalNetwork, network); setText(arrivalDetail, detail);
      arrival.dataset.active = 'true'; arrival.setAttribute('aria-hidden','false');
      arrivalTimer = globalThis.setTimeout?.(() => { arrival.dataset.active = 'false'; arrival.setAttribute('aria-hidden','true'); arrivalTimer = null; }, Math.max(1200, Number(durationMs || 4200))) ?? null;
      return freeze({ ok: true });
    },
    updateCompanion(value={}) {
      lastCompanionState = value || null;
      const active = Boolean(value?.expanseActive && value?.visible);
      setText(companion, active ? `EONBOT · ${value.label || 'Companion signal'}` : '');
      companion.dataset.active = String(active); companion.setAttribute('aria-hidden',String(!active)); companion.dataset.phase = String(value?.phase || ''); companion.dataset.behavior = String(value?.behaviorMode || '');
      return freeze({ ok: true, active, phase: value?.phase || '', behaviorMode: value?.behaviorMode || '' });
    },
    updateGuidance(value={}) {
      lastGuidanceState = value || null;
      const active = Boolean(value.active);
      const persistent = value?.persistent === true && Boolean(value.prompt);
      const assistanceActive = value?.assistanceActive === true || value?.assistanceState?.active === true;
      setText(guidanceText,value.prompt || '');
      guidance.dataset.active=String(Boolean((active || persistent) && value.prompt));
      guidance.dataset.persistent=String(persistent);
      guidance.dataset.nextActionKind=String(value?.nextActionKind || '');
      guidance.dataset.assistance=String(assistanceActive);
      guideObjective.dataset.assistance=String(assistanceActive);
      const expanseActive = value?.expanseActive === true;
      root.dataset.worldActive = String(expanseActive);
      const zoneLabel = String(value.zoneLabel || value.zoneId || 'Signal Frontier').replaceAll('-', ' ');
      setText(hudZone, zoneLabel);
      const objectiveLabel = value.label || value.guidance || String(value.objective || '').replaceAll('-', ' ');
      const physicalUseHint = !['my-frontier','storm-sector'].includes(String(value.regionId || '')) && lastBoard?.campaignObjectiveAuthority?.physical === true ? ' · E / tap Use' : '';
      setText(hudObjective, `${objectiveLabel}${physicalUseHint}`);
      setText(hudDistance, Number.isFinite(Number(value.distance)) ? `${Math.round(Number(value.distance))} m` : '');
      hud.dataset.active = String(expanseActive); hud.setAttribute('aria-hidden', String(!expanseActive));
      const guideControl = deriveEonExpanseW767VGuidanceControl({ expanseActive, guidanceActive: active, nearTarget: value.nearTarget === true, guideState: value?.guideState });
      const guiding = guideControl.guiding;
      guideObjective.hidden = !guideControl.visible;
      const primaryAction = value?.primaryAction || null;
      const primaryActionVisible = Boolean(persistent && primaryAction?.kind === 'open-mission-board');
      nextActionButton.hidden = !primaryActionVisible;
      nextActionButton.dataset.actionKind = primaryActionVisible ? String(primaryAction.kind) : '';
      setText(nextActionButton, primaryActionVisible ? primaryAction.label || 'Open Mission Board' : 'Open Mission Board');
      nextActionButton.setAttribute('aria-label', primaryActionVisible ? primaryAction.label || 'Open Mission Board for the next approved action' : 'Open Mission Board for the next approved action');
      dismissAssistance.hidden = !(expanseActive && assistanceActive);
      guideObjective.disabled = guideControl.disabled;
      setText(guideObjective, guideControl.label);
      guideObjective.setAttribute('aria-label', guideControl.ariaLabel);
      guideObjective.dataset.mode = guideControl.mode;
      returnHub.hidden = !expanseActive;
      returnHub.setAttribute('aria-hidden', String(!expanseActive));
      return freeze({ ok: true, active, expanseActive, guiding, assistanceActive });
    },
    updateCaptureMoment(value=null) {
      lastCaptureMoment = value || null;
      const active = value?.available === true;
      captureMoment.hidden = !active;
      captureMoment.setAttribute('aria-hidden', String(!active));
      captureMoment.dataset.momentId = active ? String(value.momentId || '') : '';
      captureMoment.dataset.error = '';
      setText(captureMoment, active ? value.buttonLabel || 'Capture moment' : 'Capture moment');
      captureMoment.setAttribute('aria-label', active ? value.ariaLabel || 'Open Creator Capture for this frontier moment' : 'Open Creator Capture for this frontier moment');
      return freeze({ ok: true, active, momentId: active ? value.momentId || '' : '' });
    },
    updateRestorationStatus(value={}) {
      const percent = Math.max(0, Math.min(100, Number(value?.onlinePercent || 0)));
      setText(hudNetwork, value?.derivedFromVerifiedProgress ? `${percent}% online` : '');
      hudNetwork.dataset.complete = String(value?.complete === true);
      return freeze({ ok: true, onlinePercent: percent, complete: value?.complete === true });
    },
    updateDynamicEventPresentation(value={}) {
      const active = value?.active === true || value?.visible === true;
      setText(eventBanner, active ? value.text || value.markerLabel || '' : '');
      eventBanner.dataset.active = String(active);
      eventBanner.setAttribute('aria-hidden', String(!active));
      eventBanner.setAttribute('aria-label', active ? value.ariaLabel || 'Optional frontier event' : 'Optional frontier event');
      eventBanner.dataset.eventId = active ? String(value.eventId || '') : '';
      return freeze({ ok: true, active, eventId: active ? value.eventId || '' : '' });
    },
    updateBoard(value,map) { lastBoard=value; lastMap=map; render(); },
    updateOnboarding(value=null) { lastOnboarding = value || null; const summary = renderOnboarding(); return freeze({ ok: true, ...summary }); },
    updateLabels(value=[]) { lastLabels = Array.isArray(value) ? value.slice(0, labelNodes.length) : []; const summary = renderLabels(); return freeze({ ok: true, ...summary }); },
    updateInteraction(value=null) { lastInteraction = value || null; const summary = renderInteraction(); return freeze({ ok: true, ...summary }); },
    updateAssetRecovery(value=null) { lastAssetRecovery = value || null; const summary = renderAssetRecovery(); return freeze({ ok: true, ...summary }); },
    openBoard() { lastFocused = documentRef.activeElement && documentRef.activeElement !== documentRef.body ? documentRef.activeElement : null; render(); board.dataset.open='true'; board.setAttribute('aria-hidden','false'); renderLabels(); renderOnboarding(); renderInteraction(); close.focus?.(); return freeze({ok:true}); },
    openMyFrontierPlanner(plotId='') {
      lastFocused = documentRef.activeElement && documentRef.activeElement !== documentRef.body ? documentRef.activeElement : null;
      render();
      if (myFrontierPlanner.hidden) return freeze({ ok:false, reason:'my-frontier-planner-unavailable', plotId:String(plotId || ''), grantsXp:false, mutatesProgression:false });
      const requestedPlotId=String(plotId || '');
      const optionAvailable=[...myFrontierPlotSelect.options].some((option)=>option.value===requestedPlotId && !option.disabled);
      if (!optionAvailable) return freeze({ ok:false, reason:'my-frontier-plot-not-selectable', plotId:requestedPlotId, grantsXp:false, mutatesProgression:false });
      myFrontierPlotSelect.value=requestedPlotId;
      populateMyFrontierBuildingChoices();
      board.dataset.open='true';
      board.dataset.eonExpanseBoardFocus='my-frontier-planner';
      board.setAttribute('aria-hidden','false');
      renderLabels(); renderOnboarding(); renderInteraction();
      myFrontierBuildingSelect.focus?.({preventScroll:true});
      return freeze({ ok:true, plotId:requestedPlotId, plannerFocused:true, buildingSelectionRequired:true, automaticPlanning:false, automaticConstruction:false, grantsXp:false, mutatesProgression:false });
    },
    closeBoard() { return closeBoard(); },
    isBoardOpen() { return board.dataset.open==='true'; },
    dispose() { if (arrivalTimer) globalThis.clearTimeout?.(arrivalTimer); documentRef.removeEventListener?.('keydown', onDocumentKeyDown); confirmReceipt.removeEventListener('click', onConfirmReceipt); startMission.removeEventListener('click', onStartAvailableMission); guideGate.removeEventListener('click', onGuideGate); guideObjective.removeEventListener('click', onGuideActiveObjective); nextActionButton.removeEventListener('click', onPrimaryNextAction); dismissAssistance.removeEventListener('click', onDismissAssistanceAction); returnHub.removeEventListener('click', onReturnHub); captureMoment.removeEventListener('click', onOpenCaptureMomentAction); livingActivityAction.removeEventListener('click', onSelectLivingActivityAction); futureRegionReview.removeEventListener('click', onReviewFutureRegionProgrammeAction); myFrontierUnlock.removeEventListener('click', onUnlockMyFrontierAction); myFrontierPlotSelect.removeEventListener('change', onMyFrontierPlotChange); myFrontierBuildingSelect.removeEventListener('change', onMyFrontierBuildingChange); myFrontierPlan.removeEventListener('click', onPlanMyFrontierBuildingAction); myFrontierThemeSelect.removeEventListener('change', onMyFrontierThemeChange); myFrontierThemeApply.removeEventListener('click', onSelectMyFrontierThemeAction); myFrontierGuide.removeEventListener('click', onGuideMyFrontierAction); myFrontierWork.removeEventListener('click', onOpenMyFrontierWorkAction); myFrontierConstruct.removeEventListener('click', onConfirmMyFrontierConstructionAction); myFrontierUpgrade.removeEventListener('click', onConfirmMyFrontierDistrictUpgradeAction); myFrontierInvite.removeEventListener('click', onInviteMyFrontierResidentAction); myFrontierResidentList.removeEventListener('click', onReleaseMyFrontierResidentAction); touchInteract.removeEventListener('click', onInteractNearestAction); retryAssets.removeEventListener('click', onRetryAssetsAction); atlas.removeEventListener('click', onAtlasSelect); onboardingMap.removeEventListener('click', onOpenOnboardingMap); onboardingDismiss.removeEventListener('click', onDismissOnboardingAction); root.remove(); style.remove(); },
    getSummary() { return freeze({ mounted:true, worldActive:root.dataset.worldActive==='true', resetReason:root.dataset.resetReason || '', coarsePointer:Boolean(coarsePointer), reducedMotion:accessibilityProfile.reducedMotion, forcedColors:accessibilityProfile.forcedColors, touchTargetPx:accessibilityProfile.touchTargetPx, interactionControlVisible:!touchInteract.hidden, interactionTargetId:lastInteractionPresentation.target?.id || '', assetRetryVisible:!retryAssets.hidden, assetRetryStatus:String(lastAssetRecovery?.status || 'idle'), assetRepairFocusVisible:!assetRepairCard.hidden, stormSectorCardVisible:!stormSectorCard.hidden, stormSectorActive:lastBoard?.stormSector?.active===true, dynamicEventCardVisible:!dynamicEventCard.hidden, restorationCardVisible:!restorationCard.hidden, livingActivityCardVisible:!livingActivityCard.hidden, livingActivityActionVisible:!livingActivityAction.hidden, livingActivityActionId:livingActivityAction.dataset.activityId || '', livingActivityReceiptId:livingActivityAction.dataset.receiptId || '', myFrontierGuideVisible:!myFrontierGuide.hidden, myFrontierThemeVisible:!myFrontierThemeControls.hidden, myFrontierThemeId:String(lastBoard?.myFrontierTheme?.currentThemeId || ''), myFrontierConstructionVisible:!myFrontierConstruct.hidden, myFrontierResidentInviteVisible:!myFrontierInvite.hidden, myFrontierResidentReleaseCount:Number(lastBoard?.myFrontierResidentRelease?.releaseCount || 0), restorationPercent:Number(String(hudNetwork.textContent || '').replace(/[^0-9]/g,'')) || 0, boardOpen:board.dataset.open==='true', guidanceActive:guidance.dataset.active==='true', lostAssistanceVisible:guidance.dataset.assistance==='true', lostAssistanceActive:guidance.dataset.assistance==='true', onboardingVisible:onboarding.dataset.active==='true', onboardingStep:lastOnboarding?.stepId || '', returnControlVisible:!returnHub.hidden, captureMomentVisible:!captureMoment.hidden, captureMomentId:captureMoment.dataset.momentId || '', guideControlVisible:!guideObjective.hidden, guideActive:guideObjective.disabled, persistentNextActionVisible:!nextActionButton.hidden, persistentNextActionKind:String(lastGuidanceState?.nextActionKind || ''), hudVisible:hud.dataset.active==='true', dynamicEventVisible:eventBanner.dataset.active==='true', dynamicEventId:eventBanner.dataset.eventId || '', worldLabelCount:lastLabels.length, arrivalVisible:arrival.dataset.active==='true', companionVisible:companion.dataset.active==='true', companionPhase:lastCompanionState?.phase || '' }); }
  });
}
