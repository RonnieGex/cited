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

// The mark of the maker is the flame of `public/brand/`, the same image every Katalis product uses. No record may
// name another drawing of a Katalis logo: the invented one of `docs/images/katalis-logo*.png` is gone and the render
// scripts refuse to write a record that brings it back.
export const intendedLogo = /katalis[\s_-]*logo/i;

const capturedSteps = ["ingest", "search"];

function capturedEvidence(record) {
  const demo = record?.[capturedOutput];
  const captured = typeof demo === "object" && demo !== null ? demo : {};
  const fields = new Set();
  const lines = new Map();

  for (const step of capturedSteps) {
    const run = captured[step] ?? {};

    if (typeof run.command === "string") {
      fields.add(`${capturedOutput}.${step}.command`);
    }

    if (typeof run.output === "string") {
      fields.add(`${capturedOutput}.${step}.output`);
      lines.set(`${capturedOutput}.drawn.${step}`, new Set(run.output.split("\n")));
    }
  }

  return { fields, lines };
}

function isCaptured(evidence, route, value) {
  if (evidence.fields.has(route)) {
    return true;
  }

  const drawn = route.endsWith("]")
    ? evidence.lines.get(route.slice(0, route.lastIndexOf("[")))
    : undefined;

  return typeof value === "string" && drawn !== undefined && drawn.has(value);
}

export function isCapturedOutput(record, route, value) {
  return isCaptured(capturedEvidence(record), route, value);
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

function statements(value, route, found, evidence) {
  if (typeof value === "string") {
    if (isCaptured(evidence, route, value) === false) {
      found.push([route, value]);
    }

    return found;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => statements(item, `${route}[${index}]`, found, evidence));

    return found;
  }

  if (typeof value === "object" && value !== null) {
    if (isRow(value)) {
      found.push([route, cell(value)]);

      return found;
    }

    for (const [key, item] of Object.entries(value)) {
      statements(item, route.length === 0 ? key : `${route}.${key}`, found, evidence);
    }
  }

  return found;
}

export function untaggedClaims(record) {
  const evidence = capturedEvidence(record);

  return statements(record, "", [], evidence)
    .filter(([, text]) => plannedMark.test(text) === false && answerWords.test(text))
    .map(([route, text]) => `${route}: ${text}`);
}

export function inventedLogos(record) {
  const found = [];

  const visit = (value, route) => {
    if (typeof value === "string") {
      if (intendedLogo.test(value)) {
        found.push(`${route}: ${value}`);
      }

      return;
    }

    if (Array.isArray(value)) {
      value.forEach((item, index) => visit(item, `${route}[${index}]`));

      return;
    }

    if (typeof value === "object" && value !== null) {
      for (const [key, item] of Object.entries(value)) {
        visit(item, route.length === 0 ? key : `${route}.${key}`);
      }
    }
  };

  visit(record, "");

  return found;
}

export function assertHonestRecord(record, label) {
  const logos = inventedLogos(record);

  if (logos.length > 0) {
    throw new Error(
      `${label} would record the invented Katalis logo; the mark of the maker is the flame of public/brand/:\n${logos.join("\n")}`,
    );
  }

  const claims = untaggedClaims(record);

  if (claims.length > 0) {
    throw new Error(
      `${label} would record a planned answer as a capability of today; mark it with Next, planned or the change that delivers it:\n${claims.join("\n")}`,
    );
  }
}
