/** W394 contract: direct City stays Babylon-first while mobile presentation remains calm and opt-in. */
export const W394_CITY_MOBILE_HUD_CONTRACT = Object.freeze({
  wave: 'W394',
  directHud: Object.freeze({ primaryActions: Object.freeze(['explore', 'menu', 'exit-city']), mapStartsHidden: true }),
  touch: Object.freeze({ primary: 'analogue-joystick', dpadDefaultVisible: false }),
  boundaries: Object.freeze({ directCity: true, cityMapFallback: true, separateThreeRoute: false, remoteTransport: false })
});

export function validateW394CityMobileHudContract(contract = W394_CITY_MOBILE_HUD_CONTRACT) {
  const errors = [];
  if (contract?.wave !== 'W394') errors.push('W394 wave identifier is invalid.');
  if (JSON.stringify(contract?.directHud?.primaryActions) !== JSON.stringify(['explore', 'menu', 'exit-city'])) errors.push('Direct HUD must expose exactly Explore, Menu and Exit City.');
  if (contract?.directHud?.mapStartsHidden !== true) errors.push('Direct entry minimap must start hidden.');
  if (contract?.touch?.primary !== 'analogue-joystick' || contract?.touch?.dpadDefaultVisible !== false) errors.push('Touch must be joystick-first with opt-in D-pad.');
  if (contract?.boundaries?.directCity !== true || contract?.boundaries?.cityMapFallback !== true || contract?.boundaries?.separateThreeRoute !== false || contract?.boundaries?.remoteTransport !== false) errors.push('W394 City boundaries are invalid.');
  return Object.freeze(errors);
}
