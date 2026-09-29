import { createHash } from "node:crypto";
import { mkdirSync, readFileSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// The ink variant of the flame of Katalis (design decision 2). The flame of `public/brand/` is silver and made for
// dark grounds; on the paper of the light theme the same mark is needed in the ink of the system. The variant is not
// drawn: it is the 512 px original respelled as ink. The alpha is kept untouched, every pixel becomes the ink of the
// system with the shading of the original preserved as luminance, and the result is resized to 192 and 64 px. The
// record names the hash of the source and every operation, and `tests/design-system.test.ts` reads it.

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = "public/brand/katalis-flame-512.png";
const recordPath = "public/brand/flame-variants.json";
const color = "#171717";
const inkValue = 0x17;
const sizes = [192, 64];
const operations = [
  "keep the alpha of every pixel of the original",
  "recolor every pixel to the ink #171717 with the shading of the original preserved as luminance",
  "resize the recolored original to 192 and 64 px",
];

const absolute = (relative) => resolve(root, relative);
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

const sharp = await import("sharp")
  .then((module) => module.default)
  .catch(() => {
    throw new Error("The ink variant needs sharp, which comes with next: run npm ci first.");
  });

const original = readFileSync(absolute(sourcePath));
const { data, info } = await sharp(original).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

for (let index = 0; index < data.length; index += 4) {
  const luminance =
    (0.2126 * (data[index] ?? 0) +
      0.7152 * (data[index + 1] ?? 0) +
      0.0722 * (data[index + 2] ?? 0)) /
    255;
  const value = Math.round(inkValue * luminance);

  data[index] = value;
  data[index + 1] = value;
  data[index + 2] = value;
}

const recolored = sharp(data, {
  raw: { width: info.width, height: info.height, channels: 4 },
});
const outputs = [];

for (const size of sizes) {
  const png = await recolored
    .clone()
    .resize(size, size, { kernel: "lanczos3" })
    .png({ compressionLevel: 9 })
    .toBuffer();
  const path = `public/brand/katalis-flame-ink-${size}.png`;

  mkdirSync(dirname(absolute(path)), { recursive: true });
  await writeFile(absolute(path), png);
  outputs.push({ file: path, width: size, height: size, bytes: png.length, sha256: sha256(png) });
  console.log(`rendered ${path} (${png.length} bytes, ${sha256(png).slice(0, 16)})`);
}

const record = {
  source: {
    file: sourcePath,
    width: info.width,
    height: info.height,
    bytes: original.length,
    sha256: sha256(original),
  },
  color,
  operations,
  outputs,
  script: "scripts/render-flame-variants.mjs",
};

await writeFile(absolute(recordPath), `${JSON.stringify(record, null, 2)}\n`);
console.log(`wrote ${recordPath}`);
