const noise = [
  /^>/,
  /^\s*$/,
  /\.env not found/,
  /MODULE_TYPELESS_PACKAGE_JSON/,
  /Reparsing as ES module/,
  /To eliminate this warning/,
  /trace-warnings/,
];

export function withoutNpmNoise(output) {
  return output
    .split("\n")
    .filter((line) => !noise.some((pattern) => pattern.test(line)))
    .join("\n")
    .trim();
}

export function terminalLines(output, maximum) {
  const lines = output.split("\n").filter((line) => line.trim().length > 0);

  return (lines.length > maximum ? lines.slice(0, maximum) : lines).join("\n");
}

function block(command, output) {
  return ["```", `$ ${command}`, output, "```"].join("\n");
}

export function patchReadmeQuickStart(text, demo) {
  const updated = [];

  for (const [command, output] of [
    [demo.ingest.command, demo.ingest.readme],
    [demo.search.command, demo.search.readme],
  ]) {
    const lines = text.split("\n");
    const head = lines.findIndex((line) => line.trim() === `$ ${command}`);
    const start = head - 1;
    const end = lines.indexOf("```", head);

    if (head === -1 || start < 0 || end === -1) {
      throw new Error(`The quick start of the README has no block for "${command}".`);
    }

    lines.splice(start, end - start + 1, block(command, output));
    text = lines.join("\n");
    updated.push(command);
  }

  return { text, updated };
}
