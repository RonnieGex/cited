export function allowedOrigins(value: string | undefined): string[] {
  const found: string[] = [];

  for (const entry of (value ?? "").split(",")) {
    const trimmed = entry.trim();

    if (trimmed.length === 0) {
      continue;
    }

    let url: URL;

    try {
      url = new URL(trimmed);
    } catch {
      continue;
    }

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      continue;
    }

    if (found.includes(url.origin) === false) {
      found.push(url.origin);
    }
  }

  return found;
}

// Design decision 5 of `openspec/changes/public-page-and-widget/design.md`: `/embed` may be framed by its own origin
// and by the origins of ALLOWED_ORIGINS, and by nothing else; `/` may only be framed by itself.

export function frameAncestors(pathname: string, allowed: readonly string[]): string[] {
  return pathname === "/embed" ? ["'self'", ...allowed] : ["'self'"];
}

export function nonceOf(): string {
  return Buffer.from(crypto.randomUUID()).toString("base64");
}

export type CspEnvironment = Record<string, string | undefined>;

// The environment is read here, in `lib/`, and not in the proxy: the configuration of the README names the variables the
// code reads under `lib/`, `scripts/` or `app/`, and `ALLOWED_ORIGINS` is one of them.
export function policyFor(input: {
  pathname: string;
  environment: CspEnvironment;
  development: boolean;
  nonce: string;
}): string {
  return contentSecurityPolicy({
    nonce: input.nonce,
    ancestors: frameAncestors(
      input.pathname,
      allowedOrigins(input.environment["ALLOWED_ORIGINS"]),
    ),
    development: input.development,
  });
}

export function contentSecurityPolicy(input: {
  nonce: string;
  ancestors: readonly string[];
  development: boolean;
}): string {
  const script = [
    "'self'",
    `'nonce-${input.nonce}'`,
    "'strict-dynamic'",
    ...(input.development ? ["'unsafe-eval'"] : []),
  ].join(" ");

  // One line per directive, with its reason:
  // - `default-src 'self'`: the floor. Everything the page fetches comes from this origin unless a directive below
  //   opens something else.
  // - `script-src`: the nonce of this response with `strict-dynamic`, and no third-party host. The voice session needs
  //   no exception: its processors and the resampler are files of `public/voice/worklets/` (`AudioWorklet.addModule`
  //   answers to `script-src-elem`, which falls back to this directive), and the panel hands the SDK their paths.
  // - `style-src`: this origin, plus the inline style that declares the colours of the business (`--primary`).
  // - `img-src`: this origin, plus the `data:` and `blob:` URLs a panel paints from.
  // - `font-src`: the fonts travel with the site.
  // - `connect-src`: this origin, which is where the browser asks for a signed URL, and `wss://api.elevenlabs.io`,
  //   which is the session that URL opens. The HTTPS endpoint of the provider is not named because the browser never
  //   calls it: it is this server, from its own routes, that asks for the signed URL and provisions the agent
  //   (`openspec/changes/elevenlabs-voice-agent/design.md`, decision 2).
  // - `worker-src`: this origin. The `AudioWorklet` processors are files of `public/voice/worklets/` and the session
  //   hands the SDK their paths, so the page requests no `blob:` module.
  // - `object-src`, `base-uri`, `form-action`, `frame-src`: no plugin, no rewritten base, no form to another site, and
  //   only this origin in a frame.
  // - `frame-ancestors`: `'self'`, plus the origins of `ALLOWED_ORIGINS` for `/embed`
  //   (`openspec/changes/public-page-and-widget/design.md`, decision 5).
  // There is no `media-src`: the answer of the agent plays through the `MediaStream` the SDK assigns to the `srcObject`
  // of an audio element, which is not a fetch, so the directive would have no consumer and the floor of `default-src`
  // is stricter.
  return [
    "default-src 'self'",
    `script-src ${script}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "connect-src 'self' wss://api.elevenlabs.io",
    "worker-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-src 'self'",
    `frame-ancestors ${input.ancestors.join(" ")}`,
  ].join("; ");
}
