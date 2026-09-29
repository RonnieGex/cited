// @vitest-environment node
import { describe, expect, it } from "vitest";
import { guardRequest, guardSession, missingAdminVariables } from "@/lib/admin/guard";
import { SESSION_COOKIE, sessionToken } from "@/lib/admin/session";

const secret = "el-secreto-de-la-sesion";
const now = new Date("2026-09-29T12:00:00.000Z");
const environment = { ADMIN_PASSWORD: "la-clave", ADMIN_SESSION_SECRET: secret };
const token = sessionToken(secret, now);

function request(method: string, url: string, headers: Record<string, string> = {}): Request {
  return new Request(url, { method, headers });
}

describe("the guard of the panel", () => {
  it("names what is missing before anything else", () => {
    expect(missingAdminVariables({})).toEqual(["ADMIN_PASSWORD", "ADMIN_SESSION_SECRET"]);
    expect(missingAdminVariables({ ADMIN_PASSWORD: " ", ADMIN_SESSION_SECRET: "" })).toEqual([
      "ADMIN_PASSWORD",
      "ADMIN_SESSION_SECRET",
    ]);
    expect(missingAdminVariables(environment)).toEqual([]);

    expect(guardRequest(request("GET", "http://localhost/api/admin/setup"), {})).toEqual({
      status: "unconfigured",
      missing: ["ADMIN_PASSWORD", "ADMIN_SESSION_SECRET"],
    });
  });

  it("refuses a request without a valid session", () => {
    expect(guardRequest(request("GET", "http://localhost/api/admin/setup"), environment)).toEqual({
      status: "unauthorized",
    });
    expect(
      guardRequest(
        request("GET", "http://localhost/api/admin/setup", { cookie: `${SESSION_COOKIE}=basura` }),
        environment,
      ),
    ).toEqual({ status: "unauthorized" });
    expect(
      guardRequest(
        request("GET", "http://localhost/api/admin/setup", {
          cookie: `${SESSION_COOKIE}=${sessionToken("otro-secreto", now)}`,
        }),
        environment,
      ),
    ).toEqual({ status: "unauthorized" });
    expect(
      guardRequest(
        request("GET", "http://localhost/api/admin/setup", {
          cookie: `${SESSION_COOKIE}=${sessionToken(secret, new Date(now.getTime() - 13 * 60 * 60 * 1000))}`,
        }),
        environment,
        now,
      ),
    ).toEqual({ status: "unauthorized" });
  });

  it("accepts a valid session and asks the mutations for their origin", () => {
    expect(
      guardRequest(
        request("GET", "http://localhost/api/admin/setup", { cookie: `${SESSION_COOKIE}=${token}` }),
        environment,
        now,
      ),
    ).toEqual({ status: "ok" });

    expect(
      guardRequest(
        request("POST", "http://localhost/api/admin/business", {
          cookie: `${SESSION_COOKIE}=${token}`,
          origin: "http://localhost",
        }),
        environment,
        now,
      ),
    ).toEqual({ status: "ok" });

    expect(
      guardRequest(
        request("POST", "http://localhost/api/admin/business", {
          cookie: `${SESSION_COOKIE}=${token}`,
          origin: "https://evil.example.com",
        }),
        environment,
        now,
      ),
    ).toEqual({ status: "forbidden" });

    expect(
      guardRequest(
        request("POST", "http://localhost/api/admin/business", {
          cookie: `${SESSION_COOKIE}=${token}`,
        }),
        environment,
        now,
      ),
    ).toEqual({ status: "forbidden" });

    expect(
      guardRequest(
        request("POST", "http://localhost/api/admin/business", {
          origin: "http://localhost",
        }),
        environment,
        now,
      ),
    ).toEqual({ status: "unauthorized" });
  });

  it("accepts the origin of the host the request carries", () => {
    expect(
      guardRequest(
        request("POST", "http://localhost/api/admin/business", {
          cookie: `${SESSION_COOKIE}=${token}`,
          origin: "http://127.0.0.1:3311",
          host: "127.0.0.1:3311",
          "x-forwarded-proto": "http",
        }),
        environment,
        now,
      ),
    ).toEqual({ status: "ok" });

    expect(
      guardRequest(
        request("POST", "http://localhost/api/admin/business", {
          cookie: `${SESSION_COOKIE}=${token}`,
          origin: "https://panel.example.com",
          host: "127.0.0.1:3311",
          "x-forwarded-proto": "https",
        }),
        environment,
        now,
      ),
    ).toEqual({ status: "forbidden" });
  });

  it("guards a page with the value of its cookie", () => {
    expect(guardSession(token, environment, now)).toEqual({ status: "ok" });
    expect(guardSession(undefined, environment, now)).toEqual({ status: "unauthorized" });
    expect(guardSession(token, {}, now)).toEqual({
      status: "unconfigured",
      missing: ["ADMIN_PASSWORD", "ADMIN_SESSION_SECRET"],
    });
  });
});
