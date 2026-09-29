# Step 4: review and update of the existing tests

- Date: 2026-09-29
- Change: `public-page-and-widget`
- Branch: `feature/public-page-and-widget`
- Agent: deepseek-harness
- Commit verified against: `88e3afd` (step 3.3: the widget, the embed and the frame-ancestors)
- Verdict: the whole suite is green with the MODIFIED home page, and three existing tests changed with a reason.

## 4.1 The whole suite

### The command

```powershell
npm test
```

### The output (verbatim)

```text
 RUN  v5.0.2 <repository root>

 Test Files  26 passed (26)
      Tests  263 passed (263)
   Start at  10:12:22
   Duration  16.86s (environment 45%, tests 38%, setup 8%, import 5%, transform 3%, import 2%, worker 1%)
```

Read: 26 files and 263 tests green against the 17 files and 191 tests of the base, so this change adds 9 files and 72
tests and breaks none.

The notices of the run are the ones Vitest prints about the cost of creating the jsdom environment per file, which were
there before this change.

Full log: `katalis-dev/tasks/_community-08-step4-unit.log`.

### `npm run typecheck`

```text
> cited@0.1.0 typecheck
> next typegen && tsc --noEmit

Generating route types...
✓ Types generated successfully
```

### `npm run lint`

```text
> cited@0.1.0 lint
> eslint .

```

exit 0, no finding: the two `@next/next/no-img-element` warnings of the first version of the public page are gone
because the flame and the logo of the panel are painted with `next/image` (the logo without the optimizer, because the
panel owns the endpoint and its size is unknown).

## The existing tests that changed, and why

1. **`tests/home.test.tsx` was removed** and its two scenarios live in `tests/public-page.test.tsx`. The old test
   rendered `Home` as a synchronous component with no settings; the page is an async Server Component now, it reads the
   cookie of the language and the settings of the business, so it cannot be rendered without mocking `next/headers` and
   `lib/settings/business.ts`. The new file keeps both scenarios (`one main`, `one level one heading`) and adds the
   language, the welcome, the primary color with its fallback, the logo and the document language. The end-to-end smoke
   `e2e/home.spec.ts` was not touched: `GET /` still carries `Cited` in its level one heading, which is what it asks.

2. **`tests/readme.test.ts`, "names Cited in the places a reader sees first"**: it asked `app/page.tsx` to contain the
   literal `Cited`. The page is the chat of the business now, so the name of the product travels from
   `lib/public/brand.ts` as `PRODUCT_NAME`, is the heading when the business has no name yet and is the eyebrow of the
   business when it has one. The test asks for `PRODUCT_NAME` in the page and for `PRODUCT_NAME = "Cited"` in that
   module, which keeps the guarantee of the requirement "The product is named Cited" of `openspec/specs/product-identity`
   (the scenario reads `package.json`, `NOTICE`, `app/layout.tsx` and `app/page.tsx`) while the MODIFIED requirement
   "Home page" of the change holds: the page is the chat, and it shows `Cited` when the business has no name.

3. **`tests/readme.test.ts`, "keeps the home page as one main element with one heading that names Cited and nothing
   else"**: the "and nothing else" was the promise of the bare page of the bootstrap (`expect(page).not.toMatch(/className|<p|<section|<div/)`)
   and the MODIFIED requirement asks the opposite: the page "SHALL use the design system" and renders the chat. The test
   is now "keeps the home page as one main element with one heading and the chat of the business": one `main`, one `h1`,
   the chat of the components folder and the tokens of the system (`bg-paper`). The rest of the guarantee (the rendered
   heading, the question box, no second heading) is asserted by `tests/public-page.test.tsx` against the render.

No other existing test was touched. The removal of `tests/home.test.tsx` and the two amendments above are the whole
diff of the suite of the base.

## Commit

The commit of steps 3.3 and 4 is `88e3afd` ("Build the widget, the embed and the frame-ancestors of both public
documents") for 3.3, and the one of this step is the one that carries this report, the amendment of
`tests/readme.test.ts` and the eyebrow of the product in `app/page.tsx`.
