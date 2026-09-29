// Generates the noise texture the Orb samples, locally: `public/voice/perlin-noise.png`.
//
// The Orb component of ElevenLabs UI loads its texture from the ElevenLabs CDN; this repository serves its own, so the
// panel never talks to that CDN. The texture is a tileable value-noise field (four octaves over a wrapping lattice),
// deterministic: the same script writes the same bytes on every machine.
//
//   node scripts/generate-orb-texture.mjs [--size 256] [--out public/voice/perlin-noise.png]
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { deflateSync } from "node:zlib";

const SIZE = 256;
const OCTAVES = [
  { period: 4, amplitude: 0.5 },
  { period: 8, amplitude: 0.25 },
  { period: 16, amplitude: 0.15 },
  { period: 32, amplitude: 0.1 },
];

function readArg(name, fallback) {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? fallback : process.argv[index + 1];
}

/** Deterministic integer hash: the same lattice point always yields the same value. */
function hash(x, y, seed) {
  let h = Math.imul(x, 0x27d4eb2d) ^ Math.imul(y, 0x165667b1) ^ Math.imul(seed, 0x9e3779b9);
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function smoothstep(t) {
  return t * t * (3 - 2 * t);
}

function valueNoise(x, y, period, seed) {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const fx = smoothstep(x - x0);
  const fy = smoothstep(y - y0);
  const wrap = (value) => ((value % period) + period) % period;

  const v00 = hash(wrap(x0), wrap(y0), seed);
  const v10 = hash(wrap(x0 + 1), wrap(y0), seed);
  const v01 = hash(wrap(x0), wrap(y0 + 1), seed);
  const v11 = hash(wrap(x0 + 1), wrap(y0 + 1), seed);

  const top = v00 + (v10 - v00) * fx;
  const bottom = v01 + (v11 - v01) * fx;
  return top + (bottom - top) * fy;
}

function texture(size) {
  const pixels = Buffer.alloc(size * size);
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  const raw = new Float64Array(size * size);

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      let value = 0;
      let weight = 0;
      for (const [index, octave] of OCTAVES.entries()) {
        value += valueNoise((x / size) * octave.period, (y / size) * octave.period, octave.period, index + 1) * octave.amplitude;
        weight += octave.amplitude;
      }
      const normalised = value / weight;
      raw[y * size + x] = normalised;
      min = Math.min(min, normalised);
      max = Math.max(max, normalised);
    }
  }

  const span = max - min || 1;
  for (let index = 0; index < raw.length; index += 1) {
    pixels[index] = Math.round(((raw[index] - min) / span) * 255);
  }
  return pixels;
}

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c;
  }
  return table;
})();

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([length, body, crc]);
}

function png(size, pixels) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header.writeUInt8(8, 8); // bit depth
  header.writeUInt8(0, 9); // colour type: greyscale
  header.writeUInt8(0, 10); // compression
  header.writeUInt8(0, 11); // filter
  header.writeUInt8(0, 12); // interlace

  const scanlines = Buffer.alloc((size + 1) * size);
  for (let y = 0; y < size; y += 1) {
    scanlines[y * (size + 1)] = 0; // filter: none
    pixels.copy(scanlines, y * (size + 1) + 1, y * size, (y + 1) * size);
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(scanlines, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const size = Number(readArg("size", SIZE));
const destination = resolve(process.cwd(), readArg("out", "public/voice/perlin-noise.png"));
mkdirSync(dirname(destination), { recursive: true });
const bytes = png(size, texture(size));
writeFileSync(destination, bytes);
console.log(`wrote ${destination} (${size}x${size}, ${bytes.length} bytes)`);
