import { spawnSync } from "node:child_process";

const configured = spawnSync("git", ["config", "core.hooksPath", ".githooks"], {
  stdio: "inherit",
});

if (configured.status !== 0) {
  console.error("The git hook path could not be configured.");
  process.exit(1);
}

console.log("Git hooks installed: core.hooksPath points at .githooks");

const gitleaks = spawnSync("gitleaks", ["version"], { stdio: "ignore" });
const gitleaksMissing = gitleaks.error !== undefined || gitleaks.status !== 0;

if (gitleaksMissing) {
  console.error("");
  console.error("gitleaks is not installed, so the pre-commit hook cannot scan for secrets.");
  console.error("Install it with one of these commands, then run npm run hooks:install again:");
  console.error("  Windows: winget install --id Gitleaks.Gitleaks -e");
  console.error("  macOS:   brew install gitleaks");
  console.error("  Linux:   https://github.com/gitleaks/gitleaks/releases");
  process.exit(1);
}

console.log("gitleaks is available: every commit will be scanned before it is created.");
