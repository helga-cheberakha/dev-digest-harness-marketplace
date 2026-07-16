#!/usr/bin/env node
// Re-pins a plugin's marketplace source to a prior commit SHA, so users get
// the previous good version even though `version` in plugin.json still
// reads the broken one. See docs/RELEASES.md.
// Usage:
//   node scripts/rollback.mjs <plugin-name> <sha>
//   node scripts/rollback.mjs <plugin-name> --clear   (remove a previously-set pin)

import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const [, , pluginName, sha] = process.argv;

if (!pluginName || !sha) {
  console.error("Usage: node scripts/rollback.mjs <plugin-name> <sha|--clear>");
  process.exit(1);
}

const marketplacePath = join(ROOT, ".claude-plugin", "marketplace.json");
const marketplace = JSON.parse(readFileSync(marketplacePath, "utf8"));
const entry = marketplace.plugins.find((p) => p.name === pluginName);

if (!entry) {
  console.error(`No plugin "${pluginName}" found in marketplace.json`);
  process.exit(1);
}

if (typeof entry.source === "string") {
  console.error(
    `"${pluginName}" uses a relative local source (${entry.source}) — rollback via sha pin only ` +
      "applies to git-based sources (github/url/git-subdir). Use \`git revert\` on this repo instead.",
  );
  process.exit(1);
}

if (sha === "--clear") {
  delete entry.source.sha;
  console.log(`${pluginName}: cleared sha pin, back to tracking "${entry.source.ref ?? "default branch"}"`);
} else {
  entry.source.sha = sha;
  console.log(`${pluginName}: pinned source to ${sha}`);
}

writeFileSync(marketplacePath, JSON.stringify(marketplace, null, 2) + "\n");
console.log("Run node scripts/validate-marketplace.mjs, then commit and push.");
