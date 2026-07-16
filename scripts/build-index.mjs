#!/usr/bin/env node
// Reads .claude-plugin/marketplace.json + each plugins/<name>/.claude-plugin/plugin.json
// and writes a single JSON index that the static catalog site (site/) consumes.
// See docs/SITE-SPEC.md.

import { readFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = join(ROOT, "site", "public");
const OUT_FILE = join(OUT_DIR, "catalog.json");

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

const marketplace = readJson(join(ROOT, ".claude-plugin", "marketplace.json"));
const pluginRoot = marketplace.metadata?.pluginRoot ?? "./plugins";

const plugins = (marketplace.plugins ?? []).map((entry) => {
  const relative =
    typeof entry.source === "string"
      ? entry.source.startsWith("./")
        ? entry.source
        : join(pluginRoot, entry.source)
      : null;

  let manifest = {};
  if (relative) {
    const manifestPath = join(ROOT, relative, ".claude-plugin", "plugin.json");
    if (existsSync(manifestPath)) {
      manifest = readJson(manifestPath);
    }
  }

  return {
    name: entry.name,
    displayName: manifest.displayName ?? entry.displayName ?? entry.name,
    description: manifest.description ?? entry.description ?? "",
    version: manifest.version ?? entry.version ?? null,
    category: entry.category ?? null,
    keywords: manifest.keywords ?? entry.keywords ?? [],
    author: manifest.author ?? entry.author ?? null,
    homepage: manifest.homepage ?? entry.homepage ?? null,
    dependencies: (manifest.dependencies ?? []).map((d) => (typeof d === "string" ? d : d.name)),
  };
});

const index = {
  name: marketplace.name,
  description: marketplace.description ?? marketplace.metadata?.description ?? "",
  generatedAt: new Date().toISOString(),
  plugins,
};

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(OUT_FILE, JSON.stringify(index, null, 2) + "\n");

console.log(`✔ wrote ${plugins.length} plugin(s) to ${OUT_FILE.replace(ROOT + "/", "")}`);
