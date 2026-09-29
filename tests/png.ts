import { inflateSync } from "node:zlib";

export type DecodedPng = {
  width: number;
  height: number;
  /** One RGBA byte per pixel, row by row. */
  pixels: Uint8Array;
};

const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const channelsOf: Record<number, number> = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 };

function paeth(left: number, above: number, corner: number): number {
  const estimate = left + above - corner;
  const toLeft = Math.abs(estimate - left);
  const toAbove = Math.abs(estimate - above);
  const toCorner = Math.abs(estimate - corner);

  if (toLeft <= toAbove && toLeft <= toCorner) {
    return left;
  }

  return toAbove <= toCorner ? above : corner;
}

function unfilter(filter: number, line: Buffer, previous: Buffer, step: number): void {
  for (let index = 0; index < line.length; index += 1) {
    const left = index >= step ? (line[index - step] ?? 0) : 0;
    const above = previous[index] ?? 0;
    const corner = index >= step ? (previous[index - step] ?? 0) : 0;
    const value = line[index] ?? 0;

    if (filter === 1) {
      line[index] = (value + left) & 0xff;
    } else if (filter === 2) {
      line[index] = (value + above) & 0xff;
    } else if (filter === 3) {
      line[index] = (value + Math.floor((left + above) / 2)) & 0xff;
    } else if (filter === 4) {
      line[index] = (value + paeth(left, above, corner)) & 0xff;
    } else if (filter !== 0) {
      throw new Error(`Unsupported PNG row filter ${filter}.`);
    }
  }
}

function paletteEntry(line: Buffer, x: number, bitDepth: number): number {
  if (bitDepth === 8) {
    return line[x] ?? 0;
  }

  const perByte = 8 / bitDepth;
  const byte = line[Math.floor(x / perByte)] ?? 0;
  const shift = 8 - bitDepth * ((x % perByte) + 1);

  return (byte >> shift) & ((1 << bitDepth) - 1);
}

export function decodePng(bytes: Buffer): DecodedPng {
  for (const [index, expected] of signature.entries()) {
    if (bytes[index] !== expected) {
      throw new Error("The file is not a PNG.");
    }
  }

  const chunks = new Map<string, Buffer[]>();
  let offset = signature.length;

  while (offset + 12 <= bytes.length) {
    const length = bytes.readUInt32BE(offset);
    const type = bytes.toString("latin1", offset + 4, offset + 8);
    const data = bytes.subarray(offset + 8, offset + 8 + length);
    const found = chunks.get(type);

    if (found === undefined) {
      chunks.set(type, [data]);
    } else {
      found.push(data);
    }

    offset += length + 12;

    if (type === "IEND") {
      break;
    }
  }

  const header = (chunks.get("IHDR") ?? [])[0];
  const compressed = chunks.get("IDAT") ?? [];

  if (header === undefined || compressed.length === 0) {
    throw new Error("The PNG has no header or no image data.");
  }

  const width = header.readUInt32BE(0);
  const height = header.readUInt32BE(4);
  const bitDepth = header[8] ?? 8;
  const colorType = header[9] ?? 0;
  const interlace = header[12] ?? 0;
  const channels = channelsOf[colorType];

  if (interlace !== 0) {
    throw new Error("Interlaced PNGs are not supported by this reader.");
  }

  if (channels === undefined) {
    throw new Error(`Unsupported PNG color type ${colorType}.`);
  }

  if (colorType === 3 && [1, 2, 4, 8].includes(bitDepth) === false) {
    throw new Error(`Unsupported palette depth ${bitDepth}.`);
  }

  if (colorType !== 3 && bitDepth !== 8 && bitDepth !== 16) {
    throw new Error(`Unsupported PNG bit depth ${bitDepth}.`);
  }

  const palette = (chunks.get("PLTE") ?? [])[0] ?? Buffer.alloc(0);
  const transparency = (chunks.get("tRNS") ?? [])[0] ?? Buffer.alloc(0);
  const sample = bitDepth / 8;
  const stride = Math.ceil((width * channels * bitDepth) / 8);
  const step = Math.max(1, Math.ceil((channels * bitDepth) / 8));
  const raw = inflateSync(Buffer.concat(compressed));
  const pixels = new Uint8Array(width * height * 4);
  let previous = Buffer.alloc(stride);

  for (let y = 0; y < height; y += 1) {
    const start = y * (stride + 1);
    const line = Buffer.from(raw.subarray(start + 1, start + 1 + stride));

    unfilter(raw[start] ?? 0, line, previous, step);
    previous = line;

    for (let x = 0; x < width; x += 1) {
      const target = (y * width + x) * 4;
      let red = 0;
      let green = 0;
      let blue = 0;
      let alpha = 255;

      if (colorType === 3) {
        const entry = paletteEntry(line, x, bitDepth);

        red = palette[entry * 3] ?? 0;
        green = palette[entry * 3 + 1] ?? 0;
        blue = palette[entry * 3 + 2] ?? 0;
        alpha = entry < transparency.length ? (transparency[entry] ?? 255) : 255;
      } else if (colorType === 0) {
        red = line[x * sample] ?? 0;
        green = red;
        blue = red;
      } else if (colorType === 2) {
        red = line[x * channels * sample] ?? 0;
        green = line[x * channels * sample + sample] ?? 0;
        blue = line[x * channels * sample + 2 * sample] ?? 0;
      } else if (colorType === 4) {
        red = line[x * channels * sample] ?? 0;
        green = red;
        blue = red;
        alpha = line[x * channels * sample + sample] ?? 255;
      } else {
        red = line[x * 4 * sample] ?? 0;
        green = line[x * 4 * sample + sample] ?? 0;
        blue = line[x * 4 * sample + 2 * sample] ?? 0;
        alpha = line[x * 4 * sample + 3 * sample] ?? 255;
      }

      pixels[target] = red;
      pixels[target + 1] = green;
      pixels[target + 2] = blue;
      pixels[target + 3] = alpha;
    }
  }

  return { width, height, pixels };
}

export function relativeLuminance(red: number, green: number, blue: number): number {
  return (0.2126 * red + 0.7152 * green + 0.0722 * blue) / 255;
}

export function meanLuminance(image: DecodedPng): number {
  let total = 0;
  let count = 0;

  for (let index = 0; index < image.pixels.length; index += 4) {
    total += relativeLuminance(
      image.pixels[index] ?? 0,
      image.pixels[index + 1] ?? 0,
      image.pixels[index + 2] ?? 0,
    );
    count += 1;
  }

  return total / count;
}

export function transparentShare(image: DecodedPng): number {
  let transparent = 0;
  let count = 0;

  for (let index = 0; index < image.pixels.length; index += 4) {
    if ((image.pixels[index + 3] ?? 255) < 255) {
      transparent += 1;
    }

    count += 1;
  }

  return transparent / count;
}
