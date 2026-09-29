import { NextResponse, type NextRequest } from "next/server";
import { nonceOf, policyFor } from "./lib/headers/csp.ts";

// Design decision 5 of `openspec/changes/public-page-and-widget/design.md`: the two public documents send their
// `Content-Security-Policy`, with the nonce of Next in the request so the framework scripts of the page carry it. The
// policy of `/embed` is the one that decides which sites may frame the chat.

export function proxy(request: NextRequest): NextResponse {
  const nonce = nonceOf();
  const policy = policyFor({
    pathname: request.nextUrl.pathname,
    environment: process.env,
    development: process.env.NODE_ENV !== "production",
    nonce,
  });
  const headers = new Headers(request.headers);

  headers.set("x-nonce", nonce);
  headers.set("content-security-policy", policy);

  const response = NextResponse.next({ request: { headers } });

  response.headers.set("content-security-policy", policy);

  return response;
}

export const config = {
  matcher: ["/", "/embed"],
};
