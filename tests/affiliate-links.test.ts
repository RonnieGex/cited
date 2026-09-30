// @vitest-environment node
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  affiliateLinks,
  affiliateUrlOf,
  chatCatalogue,
  signupLink,
  type ProviderEntry,
} from "@/lib/providers/catalog";

// Section 10.5 of the contract and the Major M-4 of `katalis-dev/tasks/revision-community-12.md`: the test that walks
// every route of `/api/admin/*` lives in `e2e/affiliate.spec.ts`, and it carries the list of the routes by hand. This
// file is the guard of that list: a route of the tree that nobody wrote in the list is a route nobody read, and this
// test fails the day one is added.
//
// It also proves the two halves of the affiliate switch that no committed link could prove in a browser: the catalogue
// resolves the link of a programme from the environment, and the switch decides whether it is used.

const repositoryRoot = join(import.meta.dirname, "..");
const spec = readFileSync(join(repositoryRoot, "e2e", "affiliate.spec.ts"), "utf8");

function routesInTree(directory: string): string[] {
  const found: string[] = [];

  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);

    if (entry.isDirectory()) {
      found.push(...routesInTree(path));
      continue;
    }

    if (entry.name === "route.ts") {
      found.push(path.slice(repositoryRoot.length).replaceAll("\\", "/"));
    }
  }

  return found;
}

describe("the list of the administrative routes of the browser suite", () => {
  it("carries every route of the tree", () => {
    const routes = routesInTree(join(repositoryRoot, "app", "api", "admin"));
    const missing = routes.filter((route) => {
      const path = route.replace(/^\/app/, "").replace(/\/route\.ts$/, "");

      return spec.includes(`"${path}"`) === false;
    });

    // The tree carries fifteen routes today, and every one of them is in the list of the browser suite.
    expect(routes.length).toBeGreaterThanOrEqual(15);
    expect(missing).toEqual([]);
  });
});

describe("the affiliate switch of the catalogue", () => {
  const deepseek = chatCatalogue({})[0] as ProviderEntry;
  const programme = "https://afiliados.example/cited";

  it("uses the link of a programme the installation has joined", () => {
    expect(affiliateUrlOf(deepseek, { DEEPSEEK_AFFILIATE_URL: programme })).toBe(programme);
    expect(affiliateUrlOf(deepseek, {})).toBe("");
  });

  it("uses it only when the switch is not off", () => {
    const environment = { DEEPSEEK_AFFILIATE_URL: programme };

    expect(affiliateLinks(environment)).toBe(true);
    expect(affiliateLinks({ ...environment, AFFILIATE_LINKS: "off" })).toBe(false);
  });

  it("keeps the plain link and hides the label when the switch is off", () => {
    const before = process.env["DEEPSEEK_AFFILIATE_URL"];

    process.env["DEEPSEEK_AFFILIATE_URL"] = programme;

    try {
      expect(signupLink(deepseek, { affiliateLinks: true })).toEqual({
        href: programme,
        paid: true,
      });
      expect(signupLink(deepseek, { affiliateLinks: false })).toEqual({
        href: deepseek.signupUrl,
        paid: false,
      });
    } finally {
      if (before === undefined) {
        delete process.env["DEEPSEEK_AFFILIATE_URL"];
      } else {
        process.env["DEEPSEEK_AFFILIATE_URL"] = before;
      }
    }
  });

  it("never uses the link of a programme of another provider", () => {
    expect(signupLink(deepseek, { affiliateLinks: true }).paid).toBe(false);
    expect(affiliateUrlOf(deepseek, { OPENAI_AFFILIATE_URL: programme })).toBe("");
  });
});
