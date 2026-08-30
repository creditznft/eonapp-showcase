export const W382B_W383B_LOCAL_FILE_VIEWER_CONTRACT = Object.freeze({
  waves: Object.freeze(['W382B', 'W383B']),
  localOnly: true,
  executeUploadedFiles: false,
  remoteUpload: false,
  viewers: Object.freeze(['image', 'text', 'markdown', 'code', 'json', 'table', 'pdf', 'audio', 'video', 'office-metadata', 'document-metadata']),
  officeBinaryParsing: false
});

export function validateW382BW383BLocalFileViewerContract(contract = W382B_W383B_LOCAL_FILE_VIEWER_CONTRACT) {
  const errors = [];
  if (contract?.localOnly !== true || contract?.remoteUpload !== false || contract?.executeUploadedFiles !== false) errors.push('File viewer must remain local-only and non-executing.');
  if (contract?.officeBinaryParsing !== false) errors.push('Office binary parsing is not approved in this wave.');
  if (!Array.isArray(contract?.viewers) || !contract.viewers.includes('pdf') || !contract.viewers.includes('table')) errors.push('Required safe local viewers are missing.');
  return Object.freeze(errors);
}
