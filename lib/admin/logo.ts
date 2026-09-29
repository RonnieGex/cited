export const MAX_LOGO_BYTES = 512 * 1024;
export const LOGO_CACHE_CONTROL = "public, max-age=300, must-revalidate";

const pngSignature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const jpegSignature = [0xff, 0xd8, 0xff];

function startsWith(bytes: Uint8Array, signature: number[]): boolean {
  if (bytes.length < signature.length) {
    return false;
  }

  return signature.every((value, at) => bytes[at] === value);
}

function ascii(bytes: Uint8Array, from: number, to: number): string {
  return String.fromCharCode(...bytes.slice(from, to));
}

export function detectLogoMime(bytes: Uint8Array): string | null {
  if (startsWith(bytes, pngSignature)) {
    return "image/png";
  }

  if (startsWith(bytes, jpegSignature)) {
    return "image/jpeg";
  }

  if (bytes.length >= 12 && ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 12) === "WEBP") {
    return "image/webp";
  }

  return null;
}

export function logoProblem(bytes: Uint8Array, name: string): string | null {
  if (bytes.length === 0) {
    return "the logo file is empty";
  }

  if (bytes.length > MAX_LOGO_BYTES) {
    return `the logo is ${bytes.length} bytes and the maximum is ${MAX_LOGO_BYTES} bytes (512 KB)`;
  }

  if (detectLogoMime(bytes) === null) {
    return `${name} is not a PNG, JPEG or WebP image: an SVG or a file renamed to an image is refused`;
  }

  return null;
}
