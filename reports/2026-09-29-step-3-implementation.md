# Step 3 · the implementation

Contract: `openspec/changes/brand-and-design-system/tasks.md`, tasks 3.1, 3.2 and 3.3. The three tasks share this
report, as the contract asks.
Agent: deepseek-harness. Date: 2026-09-29.

Every command runs in the worktree `katalis-dev/community-ui`, quoted below as the working directory `.`; no tracked
file carries the absolute path of the machine, because `tests/personal-paths.test.ts` refuses it.

## 3.1 The flame files and the ink variants with their script and record

### The copy, byte for byte

```
$ Copy-Item <source>/katalis-logo-<size>.png ./public/brand/katalis-flame-<size>.png      # 64, 192 and 512
$ Get-FileHash ./public/brand/katalis-flame-<size>.png -Algorithm SHA256

katalis-flame-192.png 27491 aa9d25df0342edcc60caa5c62cef0d519ffc6a07cbbe29e437fb45aec1fba2dd
katalis-flame-512.png 166575 eb66069b2dc7a346a98dcee5ebbbcbfd0024880f5db0236225576d1572443c54
katalis-flame-64.png  4893  621b0996414f3576a26d563407781d2b25b793eb19efacddf78b57a9ad0e2f2f

$ Get-FileHash <source>/katalis-logo-<size>.png -Algorithm SHA256
katalis-logo-64.png  621b0996414f3576a26d563407781d2b25b793eb19efacddf78b57a9ad0e2f2f
katalis-logo-192.png aa9d25df0342edcc60caa5c62cef0d519ffc6a07cbbe29e437fb45aec1fba2dd
katalis-logo-512.png eb66069b2dc7a346a98dcee5ebbbcbfd0024880f5db0236225576d1572443c54
```

The three hashes are, character for character, the ones decision 1 of the design records (`621b0996414f3576`,
`aa9d25df0342edcc`, `eb66069b2dc7a346` as their first 16 hex). The source directory was only read: nothing in it was
written, moved or deleted. `tests/design-system.test.ts` compares the bytes of both sides when the source is on the
machine, and the hash of every file with the one recorded in `docs/design-system.md` everywhere.

### The ink variant and its record

```
$ node scripts/render-flame-variants.mjs
rendered public/brand/katalis-flame-ink-192.png (10123 bytes, 0ca17c874233dac4)
rendered public/brand/katalis-flame-ink-64.png (2735 bytes, b3e035c4e282d804)
wrote public/brand/flame-variants.json
```

What the script does, in its own words (the record it writes):

```json
{
  "source": {
    "file": "public/brand/katalis-flame-512.png",
    "width": 512,
    "height": 512,
    "bytes": 166575,
    "sha256": "eb66069b2dc7a346a98dcee5ebbbcbfd0024880f5db0236225576d1572443c54"
  },
  "color": "#171717",
  "operations": [
    "keep the alpha of every pixel of the original",
    "recolor every pixel to the ink #171717 with the shading of the original preserved as luminance",
    "resize the recolored original to 192 and 64 px"
  ],
  "outputs": [
    { "file": "public/brand/katalis-flame-ink-192.png", "width": 192, "height": 192, "bytes": 10123,
      "sha256": "0ca17c874233dac4acf304fd45083a2ce58119d8fbc29149a786cdda4f2460ae" },
    { "file": "public/brand/katalis-flame-ink-64.png", "width": 64, "height": 64, "bytes": 2735,
      "sha256": "b3e035c4e282d804e213670840ac1e94d68be336aceb117eb8cc6cd6069f0458" }
  ],
  "script": "scripts/render-flame-variants.mjs"
}
```

The script is deterministic: a second run writes the same bytes.

```
$ <hash the three files>; node scripts/render-flame-variants.mjs; <hash them again>

public/brand/katalis-flame-ink-64.png
  before b3e035c4e282d804e213670840ac1e94d68be336aceb117eb8cc6cd6069f0458
  after  b3e035c4e282d804e213670840ac1e94d68be336aceb117eb8cc6cd6069f0458
  same   True
public/brand/katalis-flame-ink-192.png
  before 0ca17c874233dac4acf304fd45083a2ce58119d8fbc29149a786cdda4f2460ae
  after  0ca17c874233dac4acf304fd45083a2ce58119d8fbc29149a786cdda4f2460ae
  same   True
public/brand/flame-variants.json
  before cb192f031aea7a42e232cd379c914843b0c5ffd543e348cd7dc68250f196cd81
  after  cb192f031aea7a42e232cd379c914843b0c5ffd543e348cd7dc68250f196cd81
  same   True
```

`tests/design-system.test.ts` runs the script itself and asserts that the bytes do not move.

### What the two marks look like

The proof was rendered with `sharp`, at 160 px, the original on the left and the ink variant on the right, on the ink
of the system and on the paper:

| Capture | What it shows |
|---|---|
| `katalis-dev/tasks/capturas-community-04/flama-sobre-tinta.png` | the silver flame on `#171717`, which is what it was made for, and the ink variant, which disappears there |
| `katalis-dev/tasks/capturas-community-04/flama-sobre-papel.png` | the silver flame on `#F7F6F2`, which almost disappears, and the ink variant, which reads |

The two files are the evidence of the reason of decision 2: one mark, two grounds, and the variant keeps every facet
of the original.

### The measurement the test makes

```
64 px ink: 1692 opaque, 1692 neutral, 0 lighter than the ink, alpha error 2.25 of 255,
           tone error 0.41 of 23, 100.0% of the tone within 8
```

Every visible pixel of the variant is a neutral gray, none is lighter than the ink of the system, the alpha is the
alpha of the 512 px original through a box filter within 2.25 of 255, and the tone follows the luminance of the
original within 0.41 of 23.

### One bound of the test corrected while implementing

The first draft of `keeps the shading of the original in ink` required **every** opaque pixel to stay within 4 of the
ink. Four pixels of the 64 px file and one of the 192 px are brighter, because the Lanczos resize of an eight bit
image rings at the edge of the mark; the brightest is 63 of 255 at 192 px, on a pixel whose alpha is 4 of 255 and
which is therefore invisible. The bound is now 8 over the ink and it is measured on the pixels a reader sees
(`alpha >= 128`), which is what "the mark is ink and never a lighter drawing" means. The measurement is in the comment
of the test.

### The document

`docs/design-system.md` is new and carries the first section, the flame: the three files with their full hashes, the
ink variant with its hashes and the command that renders it, and the three places where the flame appears. The rest of
the document (the tokens, the font and the kit) arrives with 3.3 and 9.1. The document is written where the code needs
it, because the tests of the flame read the hashes from it and the suite has to be green before step 5.

## Commits of this task

- `ecc7b26` the flame, the script, the record, the document and the bound of the test.
- `f568b76` the redaction of the machine path in the reports of steps 1 and 2.
