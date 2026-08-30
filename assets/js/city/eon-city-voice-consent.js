/**
 * W562 compatibility entry.
 *
 * The shared browser voice-consent authority is Core-owned so normal EONAPP
 * routes do not import City implementation. City keeps this stable entrypoint
 * for historical imports while behavior lives in ../voice/eon-voice-consent.js.
 */
export * from '../voice/eon-voice-consent.js';
