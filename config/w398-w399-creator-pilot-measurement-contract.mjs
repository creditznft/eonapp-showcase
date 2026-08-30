/** W398/W399 local measurement contract. */
export const W398_W399_CREATOR_PILOT_MEASUREMENT_CONTRACT = Object.freeze({
  waves: Object.freeze(['W398', 'W399']),
  localOnly: true,
  defaultEnabled: false,
  remoteTransport: false,
  contentStored: false,
  urlsStored: false,
  referralStored: false,
  accountStored: false
});

export function validateW398W399CreatorPilotMeasurementContract(contract = W398_W399_CREATOR_PILOT_MEASUREMENT_CONTRACT) {
  const errors = [];
  for (const [key, expected] of Object.entries({ localOnly: true, defaultEnabled: false, remoteTransport: false, contentStored: false, urlsStored: false, referralStored: false, accountStored: false })) if (contract?.[key] !== expected) errors.push(`Creator pilot measurement mismatch: ${key}.`);
  return Object.freeze(errors);
}
