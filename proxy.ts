import { NextResponse } from "next/server";
import { adminProblem } from "@/lib/admin/guard";

export function proxy(): NextResponse {
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

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
