import { EON_D1_SCHEMA_AUTHORITY, readD1SchemaAuthority } from '../../assets/js/infrastructure/eon-d1-schema-authority.js';

const RELEASE_AUTHORITY_ID = 'a15-i21-v1';
const PLACEHOLDER = /REPLACE_WITH_|^0{8}-0{4}-0{4}-0{4}-0{12}$/;

function clean(value = '', limit = 240) {
  return String(value ?? '').replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, limit);
}

export async function readCloudflareReleaseAuthority(env = {}) {
  const environment = clean(env.EON_ENVIRONMENT || 'unknown', 40).toLowerCase();
  const configuredAuthorityId = clean(env.EON_RELEASE_AUTHORITY_ID, 80);
  const databases = [];
  for (const [domain, expected] of Object.entries(EON_D1_SCHEMA_AUTHORITY)) {
    const database = env[expected.binding];
    const status = database?.prepare
      ? await readD1SchemaAuthority(database, domain)
      : { ok: false, domain, binding: expected.binding, expectedVersion: expected.version, actualVersion: 0, reason: 'binding_missing' };
    databases.push(Object.freeze({
      domain,
      binding: expected.binding,
      expectedVersion: expected.version,
      actualVersion: Number(status.actualVersion || 0),
      ready: Boolean(status.ok && Number(status.actualVersion) === expected.version),
      reason: status.ok && Number(status.actualVersion) === expected.version ? '' : String(status.reason || 'schema_version_mismatch'),
      migrationName: clean(status.migrationName, 160)
    }));
  }
  const releaseAuthorityMatches = configuredAuthorityId === RELEASE_AUTHORITY_ID;
  const schemasReady = databases.every((item) => item.ready);
  return Object.freeze({
    schema: 'eonapp.a15.i21.cloudflare-release-authority.v1',
    releaseAuthorityId: RELEASE_AUTHORITY_ID,
    configuredAuthorityId,
    environment,
    releaseAuthorityMatches,
    schemasReady,
    ready: releaseAuthorityMatches && schemasReady,
    requestTimeDdl: false,
    databaseIdsExposed: false,
    secretsExposed: false,
    databases: Object.freeze(databases)
  });
}

export function getCloudflareReleaseAuthorityTruth() {
  return Object.freeze({
    schema: 'eonapp.a15.i21.cloudflare-release-authority-truth.v1',
    releaseAuthorityId: RELEASE_AUTHORITY_ID,
    sourceControlledConfiguration: true,
    exactSchemaVersionsRequired: true,
    requestTimeDdl: false,
    databaseIdentifiersReturnedToBrowser: false,
    secretsReturnedToBrowser: false,
    unresolvedPlaceholdersBlockDeployment: true,
    placeholderPattern: PLACEHOLDER.source
  });
}
