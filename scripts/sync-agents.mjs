import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";

const sourceDirectory = "ai-specs/agents";
const copyDirectories = [".claude/agents", ".codex/agents", ".cursor/agents"];

function filesUnder(directory) {
  const files = [];

  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const child = join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...filesUnder(child));
    } else {
      files.push(child);
    }
  }

  return files.sort();
}

function insideRoot(root, target) {
  const path = relative(root, target);

  return path.length > 0 && !path.startsWith("..") && !isAbsolute(path);
}

function sync(root) {
  const source = resolve(root, sourceDirectory);

  if (!existsSync(source) || !statSync(source).isDirectory()) {
    throw new Error(`${root} carries no ${sourceDirectory} folder`);
  }

  const files = filesUnder(source);

  if (files.length === 0) {
    throw new Error(`${sourceDirectory} has no file to copy`);
  }

  for (const copy of copyDirectories) {
    const target = resolve(root, copy);

    if (!insideRoot(root, target)) {
      throw new Error(`${copy} falls outside ${root}`);
    }

    rmSync(target, { recursive: true, force: true });

    for (const file of files) {
      const destination = join(target, relative(source, file));

      mkdirSync(dirname(destination), { recursive: true });
      writeFileSync(destination, readFileSync(file));
    }

    console.log(`${copy}: ${files.length} files copied from ${sourceDirectory}`);
  }
}

sync(resolve(process.argv[2] ?? join(import.meta.dirname, "..")));
