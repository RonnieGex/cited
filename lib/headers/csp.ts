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

  return [
    "default-src 'self'",
    `script-src ${script}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-src 'self'",
    `frame-ancestors ${input.ancestors.join(" ")}`,
  ].join("; ");
}
