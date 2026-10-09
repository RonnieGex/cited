/**
 * The Bearer of the server tool. The comparison is constant time, so a wrong secret cannot be found one character at
 * a time, and an installation that declares no secret refuses every call instead of accepting an empty one. The guard
 * itself lives in `lib/guards/bearer.ts`, because the MCP endpoint requires the same comparison.
 */

export { bearerOf, secretMatches } from "../guards/bearer.ts";
