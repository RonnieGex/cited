import { NextResponse, type NextRequest } from "next/server";
import { adminProblem } from "@/lib/admin/guard";
import { nonceOf, policyFor } from "./lib/headers/csp.ts";

// Design decision 5 of `openspec/changes/public-page-and-widget/design.md`: the two public documents send their
// `Content-Security-Policy`, with the nonce of Next in the request so the framework scripts of the page carry it. The
// policy of `/embed` is the one that decides which sites may frame the chat.
//
// The guard of the panel lives here too, and it answers before anything else: `/admin` and every page under it is a
// `503` that names the variable it needs when the configuration of the first run is incomplete.

export function proxy(request: NextRequest): NextResponse {
  const pathname = request.nextUrl.pathname;

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    const problem = adminProblem(process.env);

    if (problem !== null) {
      return new NextResponse(`${problem}\n`, {
        status: 503,
        headers: {
          "content-type": "text/plain; charset=utf-8",
          "cache-control": "no-store",
        },
      });
    }

    return NextResponse.next();
  }

  const nonce = nonceOf();
  const policy = policyFor({
    pathname,
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
  matcher: ["/", "/embed", "/admin", "/admin/:path*"],
};
