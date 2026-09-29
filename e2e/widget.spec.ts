import { createServer, type Server } from "node:http";
import { expect, test } from "@playwright/test";

// The two scenarios of the requirement "A widget for the owner's site" of
// `openspec/changes/public-page-and-widget/specs/public-chat/spec.md`, with the allowed test origin the task asks for:
// the spec serves its own site from `http://127.0.0.1:3210`, which is the value of ALLOWED_ORIGINS in
// `playwright.config.ts`, and the app runs on `http://127.0.0.1:3100`. The second site, on 3211, is not in the list.

const appOrigin = "http://127.0.0.1:3100";
const allowedSite = "http://127.0.0.1:3210";
const refusedSite = "http://127.0.0.1:3211";

function shop(): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>The shop of the test</title>
  </head>
  <body>
    <h1>The shop of the test</h1>
    <p>A page of a customer of Cited.</p>
    <script src="${appOrigin}/widget.js"></script>
  </body>
</html>
`;
}

async function serve(port: number): Promise<Server> {
  const server = createServer((request, response) => {
    response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    response.end(shop());
  });

  await new Promise<void>((ready) => {
    server.listen(port, "127.0.0.1", ready);
  });

  return server;
}

test("an allowed site: the widget loads the chat and the chat answers", async ({ page }) => {
  const server = await serve(3210);

  try {
    await page.goto(allowedSite);

    await page.getByRole("button", { name: "Ask us" }).click();

    const chat = page.frameLocator("iframe");

    await expect(chat.getByLabel("Your question")).toBeVisible();
    await chat.getByLabel("Your question").fill("¿Cuánto cuesta la afinación de una bicicleta?");
    await chat.getByRole("button", { name: "Ask" }).click();
    await expect(chat.locator('[data-cited="answer"]').first()).toContainText("380 pesos");
  } finally {
    server.close();
  }
});

// The scenario "Escape inside the iframe" of the requirement "The brand color is seen and the widget closes from
// inside", and the reproduction of the review: when the focus is on the question box of `/embed`, the key event
// belongs to the document of the iframe and never reaches the listener of the host document.
test("Escape inside the iframe closes the widget and returns the focus to its button", async ({ page }) => {
  const server = await serve(3210);

  try {
    await page.goto(allowedSite);

    const button = page.getByRole("button", { name: "Ask us" });

    await button.click();

    const question = page.frameLocator("iframe").getByLabel("Your question");

    await expect(question).toBeVisible();
    await question.click();

    await page.keyboard.press("Escape");

    await expect(page.locator("iframe"), "the widget closes").toHaveCount(0);
    await expect(button, "and the focus comes back to its button").toBeFocused();
  } finally {
    server.close();
  }
});

test("a site that is not allowed cannot embed the chat", async ({ page, request }) => {
  const server = await serve(3211);

  try {
    const embed = await request.get(`${appOrigin}/embed`);
    const policy = embed.headers()["content-security-policy"] ?? "";

    console.log(`the frame-ancestors of /embed: ${policy}`);
    expect(policy).toContain("frame-ancestors 'self' http://127.0.0.1:3210");
    expect(policy).not.toContain("3211");

    const home = await request.get(`${appOrigin}/`);
    const homePolicy = home.headers()["content-security-policy"] ?? "";

    expect(homePolicy).toContain("frame-ancestors 'self'");
    expect(homePolicy).not.toContain("http://127.0.0.1:3210");
    expect(homePolicy).not.toContain("3211");

    await page.goto(refusedSite);
    await page.getByRole("button", { name: "Ask us" }).click();

    await expect(page.locator("iframe")).toHaveCount(1);
    await expect(page.frameLocator("iframe").getByLabel("Your question")).toHaveCount(0);
  } finally {
    server.close();
  }
});
