// @vitest-environment node
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextRequest } from "next/server";
import { afterAll, describe, expect, it, vi } from "vitest";
import AdminAi from "@/app/admin/ai/page";
import AdminBusiness from "@/app/admin/business/page";
import AdminConversations from "@/app/admin/conversations/page";
import AdminDocuments from "@/app/admin/documents/page";
import AdminLayout from "@/app/admin/layout";
import AdminSetup from "@/app/admin/page";
import { proxy } from "@/proxy";
import { ADMIN_PASSWORD, cleanup, environmentOf } from "./admin-helpers";

// Task 12.1 of the contract, the scenario "An installation that is not finished" of the requirement "The owner never
// reads a variable name in an answer of the panel" of `specs/provider-settings/spec.md` and the Major M-1 of
// `katalis-dev/tasks/revision-community-12c.md`: the common constructor of administrative errors answered `503` with
// the names of the missing variables, and the layout of `/admin` printed `guarded.missing`, so a route of
// `/api/admin/*` and a page of `/admin` other than "For the installer" could name a variable of the environment.
//
// The scenario is universal and not a corner of the providers: it holds with `ADMIN_SESSION_SECRET` missing and,
// separately, with an `ADMIN_PASSWORD` of fewer than sixteen characters. This file walks every route of
// `/api/admin/*`, every page of `/admin` through the layout the owner receives, and the proxy that answers a page
// before it is rendered. The names are read from `.env.example`, so a variable added tomorrow is covered the day it
// is written. "For the installer" (`/admin`) is the one page that names them, and this file proves that too.

const template = readFileSync(join(import.meta.dirname, "..", ".env.example"), "utf8");
const variableNames = [...template.matchAll(/^([A-Z0-9_]+)=/gm)].map((match) => match[1] as string);

const panelNotConfigured = "panel_not_configured";
const passwordTooShort = "admin_password_too_short";
const shortPassword = "doce-letras!";
const methods = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;

const routes = import.meta.glob("../app/api/admin/**/route.ts", { eager: true }) as Record<
  string,
  Record<string, unknown>
>;

const pages: Array<{ name: string; element: ReactElement }> = [
  { name: "/admin/ai", element: <AdminAi /> },
  { name: "/admin/business", element: <AdminBusiness /> },
  { name: "/admin/conversations", element: <AdminConversations /> },
  { name: "/admin/documents", element: <AdminDocuments /> },
];

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => undefined }),
}));

afterAll(cleanup);

function namesIn(text: string): string[] {
  return variableNames.filter((name) => text.includes(name));
}

function urlOf(file: string): string {
  return `http://localhost/${file.replace("../app/", "").replace(/\/route\.ts$/, "")}`;
}

async function everyRoute(code: string): Promise<string[]> {
  const walked: string[] = [];

  for (const [file, module] of Object.entries(routes)) {
    for (const method of methods) {
      const handler = module[method];

      if (typeof handler !== "function") {
        continue;
      }

      const url = urlOf(file);
      const where = `${method} ${url}`;
      const response = await (handler as (request: Request) => Promise<Response>)(
        new Request(url, {
          method,
          headers: { origin: new URL(url).origin, "content-type": "application/json" },
          ...(method === "GET" ? {} : { body: "{}" }),
        }),
      );
      const text = await response.text();
      const body = JSON.parse(text) as { status?: string; reason?: string; error?: string };

      expect(response.status, where).toBe(503);
      expect(body.status, `${where}: ${text}`).toBe(code);
      expect(body.reason, `${where}: ${text}`).toBe(code);
      expect(namesIn(text), `${where}: ${text}`).toEqual([]);
      expect((body.error ?? "").toLowerCase(), `${where}: ${text}`).toContain("install");

      walked.push(where);
    }
  }

  return walked;
}

async function htmlOf(element: ReactElement): Promise<string> {
  const props = { children: element } as unknown as Parameters<typeof AdminLayout>[0];

  return renderToStaticMarkup(await AdminLayout(props));
}

async function everyPage(): Promise<string[]> {
  const rendered: string[] = [];

  for (const page of pages) {
    const html = await htmlOf(page.element);

    expect(namesIn(html), page.name).toEqual([]);
    expect(html.toLowerCase(), page.name).toContain("install");
    expect(html, page.name).toContain('href="/admin"');

    rendered.push(page.name);
  }

  return rendered;
}

async function everyBlockedPage(): Promise<string[]> {
  const answered: string[] = [];

  for (const path of ["/admin/ai", "/admin/business", "/admin/conversations", "/admin/documents"]) {
    const response = proxy(new NextRequest(`http://localhost${path}`));
    const text = await response.text();

    expect(response.status, path).toBe(503);
    expect(namesIn(text), `${path}: ${text}`).toEqual([]);
    expect(text.toLowerCase(), `${path}: ${text}`).toContain("install");

    answered.push(path);
  }

  return answered;
}

describe("an installation that is not finished", () => {
  it("has names to look for, taken from the template", () => {
    expect(variableNames).toContain("ADMIN_SESSION_SECRET");
    expect(variableNames).toContain("ADMIN_PASSWORD");
    expect(variableNames.length).toBeGreaterThan(20);
  });

  it("writes the names of the missing variables to the server log, once", async () => {
    const written = vi.spyOn(console, "error").mockImplementation(() => {});

    try {
      vi.resetModules();

      const { GET: setup } = await import("@/app/api/admin/setup/route");

      await environmentOf({ ADMIN_PASSWORD, ADMIN_SESSION_SECRET: "" });

      const first = await setup(new Request("http://localhost/api/admin/setup"));
      const second = await setup(new Request("http://localhost/api/admin/setup"));
      const lines = written.mock.calls
        .map((call) => call.map(String).join(" "))
        .filter((line) => line.includes("ADMIN_SESSION_SECRET"));

      expect(first.status).toBe(503);
      expect(second.status).toBe(503);
      expect(lines).toHaveLength(1);
      expect(lines[0]).toContain("ADMIN_SESSION_SECRET");
    } finally {
      written.mockRestore();
    }
  });

  it("answers every route of /api/admin with the code and never the name, without a session secret", async () => {
    await environmentOf({ ADMIN_PASSWORD, ADMIN_SESSION_SECRET: "" });

    const walked = await everyRoute(panelNotConfigured);

    expect(walked.length).toBeGreaterThanOrEqual(17);
    expect(walked).toContain("GET http://localhost/api/admin/setup");
    expect(walked).toContain("GET http://localhost/api/admin/providers");
    expect(walked).toContain("POST http://localhost/api/admin/login");
    expect(walked).toContain("DELETE http://localhost/api/admin/providers");
  });

  it("answers every route of /api/admin with the code and never the name, with a short password", async () => {
    expect(shortPassword.length).toBe(12);

    await environmentOf({ ADMIN_PASSWORD: shortPassword, ADMIN_SESSION_SECRET: "un-secreto-de-sesion-de-prueba" });

    const walked = await everyRoute(passwordTooShort);

    expect(walked.length).toBeGreaterThanOrEqual(17);
    expect(walked).toContain("GET http://localhost/api/admin/setup");
    expect(walked).toContain("POST http://localhost/api/admin/providers/test");
  });

  it("renders every page other than For the installer in the words of the owner, without a session secret", async () => {
    await environmentOf({ ADMIN_PASSWORD, ADMIN_SESSION_SECRET: "" });

    const rendered = await everyPage();

    expect(rendered).toHaveLength(4);
  });

  it("renders every page other than For the installer in the words of the owner, with a short password", async () => {
    await environmentOf({ ADMIN_PASSWORD: shortPassword, ADMIN_SESSION_SECRET: "un-secreto-de-sesion-de-prueba" });

    const rendered = await everyPage();

    expect(rendered).toHaveLength(4);
  });

  it("answers the other pages of /admin without a variable name, in both states", async () => {
    await environmentOf({ ADMIN_PASSWORD, ADMIN_SESSION_SECRET: "" });

    expect(await everyBlockedPage()).toHaveLength(4);

    await environmentOf({ ADMIN_PASSWORD: shortPassword, ADMIN_SESSION_SECRET: "un-secreto-de-sesion-de-prueba" });

    expect(await everyBlockedPage()).toHaveLength(4);
  });

  it("keeps the names on For the installer, which is the page of whoever installs", async () => {
    await environmentOf({ ADMIN_PASSWORD, ADMIN_SESSION_SECRET: "" });

    const answered = proxy(new NextRequest("http://localhost/admin"));
    const text = await answered.text();

    expect(answered.status).toBe(503);
    expect(text).toContain("ADMIN_SESSION_SECRET");

    await environmentOf({
      ADMIN_PASSWORD,
      ADMIN_SESSION_SECRET: "un-secreto-de-sesion-de-prueba",
    });

    const html = renderToStaticMarkup(await AdminSetup());

    expect(namesIn(html)).toContain("ADMIN_PASSWORD");
    expect(namesIn(html)).toContain("ADMIN_SESSION_SECRET");
  });
});
