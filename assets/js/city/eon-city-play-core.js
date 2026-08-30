/**
 * W736A active EON City entrypoint.
 *
 * The compact W731 Command Hub remains the sole active City runtime. A bounded
 * Babylon first-frame guard is installed before the exported mount function is
 * called so camera matrices and Ray side effects are available on frame one.
 */
import { installEonCityW736AFirstFrameGuard } from './w736a/eon-city-w736a-first-frame-guard.js';

installEonCityW736AFirstFrameGuard();

export {
  EON_CITY_CORE_RUNTIME_SCHEMA,
  EON_CITY_BOOT_TRACE_KEY,
  mountBabylonCityProof
} from './w731/eon-city-w731-command-hub-runtime.js';
