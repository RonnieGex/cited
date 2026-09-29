// Design decision 3 of `openspec/changes/public-page-and-widget/design.md`: the primary color of the settings becomes a
// CSS variable checked for contrast against the ink and the paper, and a color that fails AA falls back to lime.
//
// The primary color is a fill that carries text, so what has to reach AA (4.5:1) is the better of its two contrasts:
// the one against the ink and the one against the paper. `textOn` answers which of the two tokens is legible on the
// fill. Lime is the proof of the reading: 14.9:1 against the ink and 1.2:1 against the paper, so a rule that asked for
// both would refuse the very color the decision keeps as fallback.

export const INK = "#171717";
export const PAPER = "#ffffff";
export const LIME = "#ddf469";
export const DEFAULT_PRIMARY = LIME;
export const AA_CONTRAST = 4.5;

const hexPattern = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;

type Channels = [number, number, number];

function channels(color: string): Channels | null {
  const match = hexPattern.exec(color.trim());

  if (match === null) {
    return null;
  }

  const digits = (match[1] ?? "").toLowerCase();
  const full =
    digits.length === 3
      ? digits
          .split("")
          .map((digit) => `${digit}${digit}`)
          .join("")
      : digits;

  return [
    Number.parseInt(full.slice(0, 2), 16),
    Number.parseInt(full.slice(2, 4), 16),
    Number.parseInt(full.slice(4, 6), 16),
  ];
}

function normalize(color: string): string | null {
  const found = channels(color);

  if (found === null) {
    return null;
  }

  return `#${found.map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
}

function linear(octet: number): number {
  const value = octet / 255;

  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(color: string): number | null {
  const found = channels(color);

  if (found === null) {
    return null;
  }

  return 0.2126 * linear(found[0]) + 0.7152 * linear(found[1]) + 0.0722 * linear(found[2]);
}

export function contrastRatio(one: string, other: string): number {
  const first = relativeLuminance(one);
  const second = relativeLuminance(other);

  if (first === null || second === null) {
    return 0;
  }

  const [light, dark] = first > second ? [first, second] : [second, first];

  return (light + 0.05) / (dark + 0.05);
}

export function textOn(primary: string): string {
  return contrastRatio(primary, PAPER) > contrastRatio(primary, INK) ? PAPER : INK;
}

export function readablePrimary(color: string | null | undefined): string {
  if (color === null || color === undefined) {
    return DEFAULT_PRIMARY;
  }

  const normalized = normalize(color);

  if (normalized === null) {
    return DEFAULT_PRIMARY;
  }

  const best = Math.max(contrastRatio(normalized, INK), contrastRatio(normalized, PAPER));

  return best >= AA_CONTRAST ? normalized : DEFAULT_PRIMARY;
}
