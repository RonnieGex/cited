## Decisions

1. **The flame files.** Copy `katalis-logo-64.png`, `-192.png` and `-512.png` from the `public/brand/` directory of
   the Construye web app (`finanzas-katalis/web/public/brand/`, read only) to `public/brand/` as
   `katalis-flame-64.png`, `-192.png`, `-512.png`, byte for byte. Source hashes (first 16 hex of SHA-256, full values in
   `docs/design-system.md`): 64 px `621b0996414f3576`, 192 px `aa9d25df0342edcc`, 512 px `eb66069b2dc7a346`. The flame is
   silver on a transparent background, made for dark grounds.
2. **The ink variant** for light grounds is rendered by `scripts/render-flame-variants.mjs` from the 512 px original:
   the alpha is kept, the color becomes ink `#171717` with the facets' shading preserved as luminance, then resized to
   64 and 192 px. Its record (`public/brand/flame-variants.json`) names the source hash and the operation.
3. **Where the flame goes.**
   - README foot (both languages): `<picture>` with the original for `(prefers-color-scheme: dark)` and the ink variant
     as the fallback, 48 px high, beside `Built by Katalis` linked to `https://katalis.dev`.
   - Banner (both themes) and social preview: the flame to the left of `by Katalis`, at least 40 px high in the banners
     and 64 px in the social preview so it is seen (amended by Fable: at the height of the line it measured 19 px); the banner
     and the preview are re-rendered with the existing scripts, which read the flame from `public/brand/`.
   - The invented `docs/images/katalis-logo*.png` and every reference to them are removed; the graphics guard of the
     render scripts refuses a record that names them.
4. **Tokens.** `app/tokens.css` defines `--ink`, `--lime`, `--coral`, `--surface`, `--surface-dark`, `--paper`,
   `--radius` (0, square corners as in Construye), `--ease-out-expo` and exposes them in `@theme` as colors and easing.
   `app/globals.css` imports it. `docs/design-system.md` has the table of each token next to its value in Construye.
5. **Font.** Outfit variable woff2 (weights 100 to 900) from the official Google Fonts repository release, with
   `OFL.txt`; `@font-face` in `app/tokens.css`; `font-family: "Outfit", system-ui, sans-serif` on `html`. The file is
   downloaded by the implementer from the official source and its origin and hash recorded in `docs/design-system.md`.
6. **Kit.** Components are small, server-compatible React components with Tailwind classes from the tokens; focus is a
   2 px lime outline with offset; `/kit` renders them in Spanish, the language of the first market.
