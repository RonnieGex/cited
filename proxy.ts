import { NextResponse } from "next/server";
import { missingAdminVariables } from "@/lib/admin/guard";

export function proxy(): NextResponse {
  const missing = missingAdminVariables(process.env);

  if (missing.length > 0) {
    return new NextResponse(
      `the panel needs ${missing.join(" and ")}: fill the variable in the environment of the server and start it again\n`,
      {
        status: 503,
        headers: {
          "content-type": "text/plain; charset=utf-8",
          "cache-control": "no-store",
        },
      },
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
