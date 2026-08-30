#!/usr/bin/env node
import { createOsCredentialStore, getCredentialStoreTruth } from './credential-store.mjs';
const report = { schema: 'eon.creator-companion.diagnostic.w626b.v1', platform: process.platform, node: process.version, loopback: '127.0.0.1:47826', automaticInstallation: false, signedRelease: false, credentialStore: getCredentialStoreTruth(), secureStoreAvailable: false };
try { const store = createOsCredentialStore(); report.secureStoreAvailable = Boolean(store?.kind); report.secureStoreKind = store.kind; } catch (error) { report.error = String(error?.message || error); }
console.log(JSON.stringify(report, null, 2));
