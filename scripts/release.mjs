#!/usr/bin/env node
// Bumps a plugin's version, runs the validators, and prints the git-tag
// command to run next. Usage:
//   node scripts/release.mjs <plugin-name> <new-version>
// Does not touch .claude-plugin/marketplace.json — see docs/RELEASES.md
// for why a version bump doesn't need a catalog edit.

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const [, , pluginName, newVersion] = process.argv;

if (!pluginName || !newVersion) {
  console.error("Usage: node scripts/release.mjs <plugin-name> <new-version>");
  process.exit(1);
}

if (!/^\d+\.\d+\.\d+$/.test(newVersion)) {
  console.error(`"${newVersion}" is not a valid SemVer (expected x.y.z)`);
  process.exit(1);
}

const manifestPath = join(ROOT, "plugins", pluginName, ".claude-plugin", "plugin.json");
if (!existsSync(manifestPath)) {
  console.error(`No plugin.json found for "${pluginName}" at ${manifestPath}`);
  process.exit(1);
}

const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const oldVersion = manifest.version;
manifest.version = newVersion;
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");

console.log(`${pluginName}: ${oldVersion ?? "(none)"} -> ${newVersion}`);
console.log(`Updated ${manifestPath.replace(ROOT + "/", "")}`);
console.log("\nNext steps:");
console.log(`  1. Add an entry to plugins/${pluginName}/CHANGELOG.md`);
console.log(`  2. claude plugin validate ./plugins/${pluginName}`);
console.log("  3. node scripts/validate-marketplace.mjs");
console.log(`  4. Commit, then: git tag ${pluginName}-v${newVersion} && git push --tags`);

try {
  execFileSync("node", [join(ROOT, "scripts", "validate-marketplace.mjs")], { stdio: "inherit" });
} catch {
  process.exitCode = 1;
}
