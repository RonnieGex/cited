export const answerWords = /\b(answers?|answered|pages?)\b|respuestas?|p[áa]ginas?/i;

export const plannedMark = new RegExp(
  [
    "\\bnext\\b(?!\\.js)",
    "\\bplanned\\b",
    "\\bplanead[oa]s?\\b",
    "\\bsiguiente\\b",
    "design-system-shared",
    "pluggable-models-and-ask",
    "admin-and-public-ui",
    "elevenlabs-voice-agent",
    "security-hardening",
    "docs-deploy-and-launch",
  ].join("|"),
  "i",
);

export const capturedOutput = "demo";

function isCaptured(route) {
  return (
    route === capturedOutput ||
    route.startsWith(`${capturedOutput}.`) ||
    route.startsWith(`${capturedOutput}[`)
  );
}

function isRow(value) {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof value.state === "string" &&
    typeof value.reference === "string"
  );
}

function cell(row) {
  return Object.values(row)
    .filter((value) => typeof value === "string")
    .join(" ");
}

function statements(value, route, found) {
  if (isCaptured(route)) {
    return found;
  }

  if (typeof value === "string") {
    found.push([route, value]);

    return found;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => statements(item, `${route}[${index}]`, found));

    return found;
  }

  if (typeof value === "object" && value !== null) {
    if (isRow(value)) {
      found.push([route, cell(value)]);

      return found;
    }

    for (const [key, item] of Object.entries(value)) {
      statements(item, route.length === 0 ? key : `${route}.${key}`, found);
    }
  }

  return found;
}

export function untaggedClaims(record) {
  return statements(record, "", [])
    .filter(([, text]) => plannedMark.test(text) === false && answerWords.test(text))
    .map(([route, text]) => `${route}: ${text}`);
}

export function assertHonestRecord(record, label) {
  const claims = untaggedClaims(record);

  if (claims.length > 0) {
    throw new Error(
      `${label} would record a planned answer as a capability of today; mark it with Next, planned or the change that delivers it:\n${claims.join("\n")}`,
    );
  }
}
