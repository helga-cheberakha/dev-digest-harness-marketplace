#!/usr/bin/env node
// Structural linter for the catalog. Complements `claude plugin validate`:
// this script catches catalog-wide consistency issues (duplicate names,
// mismatched plugin.json vs. marketplace.json, forbidden field shapes)
// that a per-manifest validator doesn't cross-check.

import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const KEBAB_CASE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const errors = [];
const warnings = [];

function readJson(path, label) {
  if (!existsSync(path)) {
    errors.push(`${label}: file not found at ${path}`);
    return null;
  }
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (err) {
    errors.push(`${label}: invalid JSON — ${err.message}`);
    return null;
  }
}

const marketplacePath = join(ROOT, ".claude-plugin", "marketplace.json");
const marketplace = readJson(marketplacePath, "marketplace.json");

if (marketplace) {
  if (!marketplace.name) {
    errors.push("marketplace.json: missing required field `name`");
  } else if (!KEBAB_CASE.test(marketplace.name)) {
    errors.push(`marketplace.json: name "${marketplace.name}" is not kebab-case`);
  }

  if (!marketplace.owner?.name) {
    errors.push("marketplace.json: missing required field `owner.name`");
  }

  if (!Array.isArray(marketplace.plugins)) {
    errors.push("marketplace.json: `plugins` must be an array");
  } else {
    if (marketplace.plugins.length === 0) {
      warnings.push("marketplace.json: no plugins defined yet");
    }

    const seenNames = new Set();
    const pluginRoot = marketplace.metadata?.pluginRoot ?? null;

    for (const [i, entry] of marketplace.plugins.entries()) {
      const label = `plugins[${i}]`;

      if (!entry.name) {
        errors.push(`${label}: missing required field \`name\``);
        continue;
      }
      if (!KEBAB_CASE.test(entry.name)) {
        errors.push(`${label} (${entry.name}): name is not kebab-case`);
      }
      if (seenNames.has(entry.name)) {
        errors.push(`${label} (${entry.name}): duplicate plugin name in marketplace.json`);
      }
      seenNames.add(entry.name);

      if (!entry.source) {
        errors.push(`${label} (${entry.name}): missing required field \`source\``);
        continue;
      }

      // Only local (string) sources are cross-checked against a real
      // plugin.json on disk — remote sources (github/url/npm) are not
      // fetched here.
      if (typeof entry.source === "string") {
        if (entry.source.includes("..")) {
          errors.push(`${label} (${entry.name}): source path contains ".."`);
          continue;
        }
        const relative = entry.source.startsWith("./")
          ? entry.source
          : pluginRoot
            ? join(pluginRoot, entry.source)
            : entry.source;
        const pluginDir = join(ROOT, relative);
        const pluginJsonPath = join(pluginDir, ".claude-plugin", "plugin.json");
        const pluginJson = readJson(pluginJsonPath, `${entry.name} plugin.json`);

        if (pluginJson) {
          if (pluginJson.name !== entry.name) {
            errors.push(
              `${label}: plugin.json name "${pluginJson.name}" does not match marketplace entry name "${entry.name}"`,
            );
          }
          if (!pluginJson.version) {
            errors.push(`${entry.name}: plugin.json missing required field \`version\``);
          }
          if (!pluginJson.description) {
            errors.push(`${entry.name}: plugin.json missing required field \`description\``);
          }
          if (!pluginJson.author?.name) {
            errors.push(`${entry.name}: plugin.json missing required field \`author.name\``);
          }
          if (pluginJson.repository && typeof pluginJson.repository !== "string") {
            errors.push(
              `${entry.name}: plugin.json \`repository\` must be a string URL, not an object`,
            );
          }
          if (pluginJson.dependencies && !Array.isArray(pluginJson.dependencies)) {
            errors.push(
              `${entry.name}: plugin.json \`dependencies\` must be an array, not an object map`,
            );
          }
          for (const dep of pluginJson.dependencies ?? []) {
            const depName = typeof dep === "string" ? dep : dep.name;
            if (!seenNames.has(depName) && !marketplace.plugins.some((p) => p.name === depName)) {
              warnings.push(
                `${entry.name}: depends on "${depName}", which is not (yet) registered in marketplace.json`,
              );
            }
          }
        }
      }
    }
  }

  if (marketplace.renames) {
    for (const [from, to] of Object.entries(marketplace.renames)) {
      if (to !== null && !marketplace.plugins?.some((p) => p.name === to)) {
        warnings.push(`renames: "${from}" -> "${to}", but "${to}" is not a registered plugin`);
      }
    }
  }
}

for (const w of warnings) console.warn(`⚠️  ${w}`);
for (const e of errors) console.error(`✖ ${e}`);

if (errors.length > 0) {
  console.error(`\n${errors.length} error(s) found.`);
  process.exit(1);
}

console.log(
  `✔ marketplace.json is structurally valid (${marketplace?.plugins?.length ?? 0} plugin(s), ${warnings.length} warning(s)).`,
);
