# Official brand logos

Brand marks identify compatibility through nominative use. All product names and trademarks remain the property of their owners. Their presence does not imply endorsement or sponsorship. Simple Icons artwork is CC0-1.0; trademark rights remain separate. Official vendor favicons are retained as vendor marks, not relicensed as project artwork.

## Sources pinned on 2026-10-09

| Mark | Source | Version or commit | Asset SHA-256 | License |
| --- | --- | --- | --- | --- |
| claude | [claude.svg](https://cdn.jsdelivr.net/npm/simple-icons@13.21.0/icons/claude.svg) | `13.21.0` | `2d6fda79eb18ddccca35b799eeb3cece0dfabc22520ce3b10abd25668df9fa93` | CC0-1.0 |
| codex | [codex_dark.svg](https://svgl.app/library/codex_dark.svg) | `f3ebffcf4bb33d5b0bfa477b45be9fa680a0f56e` | `1b156eb915f7e74443f3fc491334f1896b6650e8fb597e2f2cb71c0ff7dd1cb0` | Reused existing project asset; SVGL distribution; trademark retained |
| deepseek | [deepseek.svg](https://cdn.jsdelivr.net/npm/simple-icons@16.34.0/icons/deepseek.svg) | `16.34.0` | `7a55a0a7391d116eba7d32807d6838478f9209f6034612941e74fbb14934e2ef` | CC0-1.0 |
| cursor | [cursor.svg](https://cdn.jsdelivr.net/npm/simple-icons@16.34.0/icons/cursor.svg) | `16.34.0` | `71572a9be192cc069ec22b48d785e61d754eeed7edb7d082d615f6d5620f70ec` | CC0-1.0 |
| elevenlabs | [elevenlabs.svg](https://cdn.jsdelivr.net/npm/simple-icons@16.34.0/icons/elevenlabs.svg) | `16.34.0` | `e7bf01c62c849c3bd59eb117b7479cc8cc47daf941a3cdaaafc4791610fb2a40` | CC0-1.0 |
| libsql | [libsql.svg](https://raw.githubusercontent.com/libsql/libsql.github.io/3e0af61e03085fb7159a8d1f0a449d0feecdeac9/images/favicon/favicon.svg) | `3e0af61e03085fb7159a8d1f0a449d0feecdeac9` | `a8cdcb254997b5554d32e377790c66b3f67d2bdeb38caf5b2cb77c13dc421621` | Official vendor favicon; trademark retained |
| turso | [turso.svg](https://cdn.jsdelivr.net/npm/simple-icons@16.34.0/icons/turso.svg) | `16.34.0` | `1944fde231d3137dcf5a5601ad0078087b375e8b90ce81158b1ef120867b2b2f` | CC0-1.0 |
| ollama | [ollama.svg](https://cdn.jsdelivr.net/npm/simple-icons@16.34.0/icons/ollama.svg) | `16.34.0` | `9c62bf0159ee96c8b58c86a732f33b002b4b3bb165ec86e8ecca51ad6a82dab6` | CC0-1.0 |
| docker | [docker.svg](https://cdn.jsdelivr.net/npm/simple-icons@16.34.0/icons/docker.svg) | `16.34.0` | `65571291c261ef869c31540a38f3ca0f0ee3bb73f179c172211c8860f19a6359` | CC0-1.0 |

The machine-readable inventory is `docs/brand/logos/sources.json`. Existing Claude and Codex source bytes are preserved. Shared marks are byte-identical across Cited, the plugin and the landing wherever used. Claude matches simple-icons@13.21.0; the existing Codex asset matched the published SVGL URL on retrieval. All additional Simple Icons marks are pinned to 16.34.0 except OpenAI 13.21.0. No package dependency or lockfile is added.

## Rendering contract

Keep every viewBox, path, rectangle, transform, fill-rule and clip-rule. Render full SVG trees; never extract paths into a generic square. Inline IDs and local references receive a unique prefix. Local inline SVGs are decorative next to readable names (`aria-hidden=true`, `focusable=false`). Geometry uses equal optical containers without distortion. Groq and libSQL preserve separate foreground/background paints using the surrounding theme, with a DOM guard against collapsed paints. Brand names and verification states remain separate. Recorded transcripts, commands, URLs and hidden copy variants are not decorated.

## Maintenance

Use Node 24.21.0. Reproduce with:

```sh
node scripts/render-readme-graphics.mjs agents reason-voice voice-teaser how-it-works roadmap
```

Browser audits check every authored visible brand occurrence, expected mark inventory, readable SVG dimensions, distinct paints and unique local definition references. Source tests compare original geometry and pinned file hashes. Keep updated provenance and run the relevant unit/build/browser checks after changing marks. API contracts, runtime behavior, data models and canonical evidence are unchanged.
