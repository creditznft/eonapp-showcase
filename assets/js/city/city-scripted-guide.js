/**
 * W274-A0 — finite local City Guide content.
 *
 * This is not a person, a chatbot, an autonomous agent, or a remote service.
 * It derives a small read-only orientation card from the allowlisted landmark
 * registry and never opens a route or stores visitor content.
 */
import { getCityLandmark } from './city-landmark-registry.js';

export const CITY_SCRIPTED_GUIDE_SCHEMA = 'eon.city.scripted-guide.w274.v1';

const BASE_BOUNDARIES = Object.freeze([
  'This is scripted local orientation text, not a live person or autonomous guide.',
  'It does not read Chat, Vault, provider, project, profile, device, or private City data.',
  'It never opens a route, confirms a work action, or starts a background task.'
]);

function asCard({ title, message, nextStep, landmarkId = null }) {
  return Object.freeze({
    schema: CITY_SCRIPTED_GUIDE_SCHEMA,
    kind: 'scripted-local-orientation',
    landmarkId,
    title,
    message,
    nextStep,
    boundaries: BASE_BOUNDARIES
  });
}

export function getCityScriptedGuideCard(landmarkId = '') {
  const landmark = getCityLandmark(landmarkId);
  if (!landmark) {
    return asCard({
      title: 'City orientation',
      message: 'Move to a marked district signal. The visual objective and controls panel show the same information without requiring sound or a guide.',
      nextStep: 'Choose a landmark, then use Interact only if you want to prepare a route for separate review.'
    });
  }
  const routeNote = landmark.action
    ? `This landmark can prepare ${landmark.action.destinationLabel} for a separate review when you choose Interact.`
    : 'This landmark is informational only and does not prepare a route.';
  return asCard({
    landmarkId: landmark.id,
    title: `${landmark.name} orientation`,
    message: landmark.description,
    nextStep: `${routeNote} ${landmark.objective}`
  });
}
