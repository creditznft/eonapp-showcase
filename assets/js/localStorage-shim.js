/**
 * W476 compatibility loader.
 *
 * This file is kept because many pages import it early, but it no longer
 * monkeypatches localStorage or swallows storage failures. Durable saves must
 * use assets/js/utils/storage-gateway.js and inspect the returned status.
 */
import { eonStorageGateway } from './utils/storage-gateway.js';

try {
  globalThis.EON_STORAGE_GATEWAY = eonStorageGateway;
} catch {
  // Exposing the helper is optional; failure here must not alter storage APIs.
}
