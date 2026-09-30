/**
 * The codes of the voice answers, in a module the browser may import. `tests/voice-secrets.test.ts` refuses a client
 * file that imports `@/lib/voice/*` unless the module is one of the client ones, because the rest of `lib/voice/` names
 * the variables of the server (`ELEVENLABS_API_KEY`, `VOICE_TOOL_SECRET`, `DAILY_VOICE_MINUTE_LIMIT`) and no bundle of
 * the browser may carry them.
 *
 * The two routes of the voice and the screen of the panel read the same spelling from here (`voice-owner-words`,
 * design decision 1): the owner reads a sentence, a visitor reads a status and a reason code, and the name of a
 * variable stays in the log of the server and on the page "For the installer".
 */

export const VOICE_NOT_CONFIGURED = "voice_not_configured";
export const VOICE_PROVIDER_FAILED = "voice_provider_failed";
export const VOICE_UNAVAILABLE = "voice_unavailable";
