#!/usr/bin/env node
// Reads .claude-plugin/marketplace.json + plugins/**/{plugin.json, skills/*/SKILL.md,
// agents/*.md, README.md, CHANGELOG.md} and writes the static data the catalog site
// (site/) fetches at runtime: site/public/index.json + site/public/bodies/<id>.md.
// Zero-dep (Node built-ins only), matching this repo's scripts/ style.
// Broken frontmatter/JSON in one plugin degrades to a warning + skip — never aborts
// the whole build, so one bad file can't take down the site.

import { readFileSync, existsSync, readdirSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = join(ROOT, "site", "public");
const BODIES_DIR = join(OUT_DIR, "bodies");
const OUT_FILE = join(OUT_DIR, "index.json");

const REPO_SLUG = "helga-cheberakha/dev-digest-harness-marketplace";
const GH_BASE = `https://github.com/${REPO_SLUG}`;
const BODY_CAP = 4096; // keep index.json small — full text lives in bodies/<id>.md

const warnings = [];
const warn = (msg) => warnings.push(msg);

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function readText(path) {
  try {
    const c = readFileSync(path, "utf8");
    return c.includes("\0") ? null : c;
  } catch {
    return null;
  }
}

function listDirs(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name);
}

function listFiles(dir, ext) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith(ext))
    .map((e) => e.name);
}

const unquote = (s) => s.replace(/^["']|["']$/g, "");

// Minimal YAML frontmatter parser: `key: value`, inline `[a, b]` arrays,
// `- item` block lists, and folded multi-line scalars (a `key: ...` whose
// value continues on following indented lines, as real agent frontmatter
// in this repo does for `description`). Broken/unterminated block → warn +
// treat whole file as body.
function parseFrontmatter(raw, label) {
  if (!raw.startsWith("---")) return { data: {}, body: raw };
  const end = raw.indexOf("\n---", 3);
  if (end === -1) {
    warn(`${label}: unterminated frontmatter — treated whole file as body`);
    return { data: {}, body: raw };
  }
  const head = raw.slice(3, end).replace(/^\n/, "");
  const body = raw.slice(raw.indexOf("\n", end + 1) + 1);
  const data = {};
  let curKey = null;
  let curMode = null; // 'list' | 'scalar'
  for (const line of head.split("\n")) {
    if (!line.trim()) continue;
    const listItem = /^\s*-\s+(.*)$/.exec(line);
    if (listItem && curMode === "list") {
      data[curKey].push(unquote(listItem[1].trim()));
      continue;
    }
    const kv = /^([A-Za-z0-9_-]+)\s*:\s*(.*)$/.exec(line);
    if (!kv) {
      // Continuation of a folded scalar (YAML plain-style line wrap).
      if (curMode === "scalar") data[curKey] += " " + line.trim();
      continue;
    }
    const key = kv[1];
    const val = kv[2].trim();
    if (val === "") {
      curKey = key;
      curMode = "list";
      data[key] = [];
      continue;
    }
    if (val.startsWith("[") && val.endsWith("]")) {
      data[key] = val.slice(1, -1).split(",").map((s) => unquote(s.trim())).filter(Boolean);
      curMode = null;
      curKey = null;
      continue;
    }
    data[key] = unquote(val);
    curKey = key;
    curMode = "scalar";
  }
  return { data, body };
}

// Strip Markdown to plain searchable text, capped.
function stripMarkdown(md) {
  return md
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/[*_>#~`]/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, BODY_CAP);
}

// A changelog entry's bullet often word-wraps across several indented lines
// (prose style, not one `-` per line) — fold those continuation lines back
// into the bullet they belong to instead of dropping them.
function foldBullets(section) {
  const changes = [];
  for (const raw of section.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    if (/^[-*]\s+/.test(line)) {
      changes.push(line.replace(/^[-*]\s+/, ""));
    } else if (changes.length) {
      changes[changes.length - 1] += " " + line;
    }
  }
  return changes;
}

// Parse CHANGELOG.md `## <version> — <date>` sections into structured entries.
function parseChangelog(md) {
  const out = [];
  const re = /^##\s*\[?v?(\d+\.\d+\.\d+)\]?\s*(?:[-–—]\s*)?(\d{4}-\d{2}-\d{2})?/gm;
  const matches = [...md.matchAll(re)];
  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    const start = m.index + m[0].length;
    const next = i + 1 < matches.length ? matches[i + 1].index : md.length;
    out.push({ version: m[1], date: m[2] || null, changes: foldBullets(md.slice(start, next)) });
  }
  return out;
}

const slugId = (id) => id.replace(/[:/]/g, "-");

function writeBody(id, raw) {
  const rel = `bodies/${slugId(id)}.md`;
  writeFileSync(join(OUT_DIR, rel), raw);
  return rel;
}

// ---------- main ----------

let marketplace;
try {
  marketplace = readJson(join(ROOT, ".claude-plugin", "marketplace.json"));
} catch (e) {
  console.error(`✗ cannot read marketplace.json: ${e.message}`);
  process.exit(1);
}
const marketplaceName = marketplace.name;
const pluginRoot = marketplace.metadata?.pluginRoot ?? "./plugins";
const installOf = (name) => `/plugin install ${name}@${marketplaceName}`;

// Reset output dir — bodies are regenerated every run so stale files never linger.
mkdirSync(OUT_DIR, { recursive: true });
rmSync(BODIES_DIR, { recursive: true, force: true });
mkdirSync(BODIES_DIR, { recursive: true });

const entries = [];

for (const entry of marketplace.plugins ?? []) {
  const name = entry.name;
  if (typeof entry.source !== "string") {
    warn(`${name}: non-path source — skipped (not indexed)`);
    continue;
  }
  const rawRelDir = entry.source.startsWith("./") ? entry.source : join(pluginRoot, entry.source);
  const relDir = rawRelDir.replace(/^\.\//, "");
  const dir = join(ROOT, relDir);
  const manifestPath = join(dir, ".claude-plugin", "plugin.json");
  if (!existsSync(manifestPath)) {
    warn(`${name}: no .claude-plugin/plugin.json — skipped`);
    continue;
  }

  let manifest;
  try {
    manifest = readJson(manifestPath);
  } catch (e) {
    warn(`${name}: plugin.json invalid (${e.message}) — skipped`);
    continue;
  }

  const treeUrl = (sub = "") => `${GH_BASE}/tree/main/${relDir}${sub ? "/" + sub : ""}`;
  const blobUrl = (file) => `${GH_BASE}/blob/main/${relDir}/${file}`;

  const category = entry.category ?? null;
  const status = entry.status ?? null;
  const author = manifest.author?.name ?? entry.author?.name ?? null;
  const keywords = manifest.keywords ?? entry.keywords ?? [];
  const dependencies = (manifest.dependencies ?? []).map((d) => (typeof d === "string" ? d : d.name));

  const readme = readText(join(dir, "README.md")) || "";
  const changelogRaw = readText(join(dir, "CHANGELOG.md"));
  const changelog = changelogRaw ? parseChangelog(changelogRaw) : [];

  const skillNames = listDirs(join(dir, "skills"));
  const agentFiles = listFiles(join(dir, "agents"), ".md");

  const pluginId = `plugin:${name}`;
  entries.push({
    id: pluginId,
    type: "plugin",
    name,
    displayName: manifest.displayName ?? entry.displayName ?? name,
    description: manifest.description ?? entry.description ?? "",
    pluginName: name,
    category,
    status,
    keywords,
    author,
    version: manifest.version ?? entry.version ?? null,
    license: manifest.license ?? null,
    homepage: manifest.homepage ?? null,
    repository: manifest.repository ?? null,
    dependencies,
    changelog,
    installCommand: installOf(name),
    sourcePath: relDir,
    githubUrl: treeUrl(),
    bodyText: stripMarkdown(readme),
    bodyHtmlPath: readme.trim() ? writeBody(pluginId, readme) : null,
    components: { skills: skillNames.length, agents: agentFiles.length },
  });

  for (const skillName of skillNames) {
    const raw = readText(join(dir, "skills", skillName, "SKILL.md"));
    if (raw == null) {
      warn(`${name}/${skillName}: missing SKILL.md — skipped`);
      continue;
    }
    const { data, body } = parseFrontmatter(raw, `${name}/${skillName}/SKILL.md`);
    const id = `${name}:${skillName}`;
    entries.push({
      id,
      type: "skill",
      name: skillName,
      displayName: data.displayName || data.name || skillName,
      description: data.description || "",
      pluginName: name,
      category,
      status,
      keywords,
      author,
      installCommand: installOf(name), // installing the parent plugin gets you this skill
      sourcePath: `${relDir}/skills/${skillName}/SKILL.md`,
      githubUrl: blobUrl(`skills/${skillName}/SKILL.md`),
      bodyText: stripMarkdown(body),
      bodyHtmlPath: body.trim() ? writeBody(id, body) : null,
    });
  }

  for (const file of agentFiles) {
    const raw = readText(join(dir, "agents", file));
    if (raw == null) continue;
    const agentName = file.slice(0, -3);
    const { data, body } = parseFrontmatter(raw, `${name}/agents/${file}`);
    const id = `${name}:${agentName}`;
    const tools = Array.isArray(data.tools) ? data.tools : [];
    entries.push({
      id,
      type: "agent",
      name: agentName,
      displayName: data.displayName || data.name || agentName,
      description: data.description || "",
      pluginName: name,
      category,
      status,
      keywords,
      author,
      tools,
      installCommand: installOf(name), // installing the parent plugin gets you this agent
      sourcePath: `${relDir}/agents/${file}`,
      githubUrl: blobUrl(`agents/${file}`),
      bodyText: stripMarkdown(body),
      bodyHtmlPath: body.trim() ? writeBody(id, body) : null,
    });
  }
}

const index = {
  name: marketplaceName,
  description: marketplace.description ?? marketplace.metadata?.description ?? "",
  generatedAt: new Date().toISOString(),
  entries,
};

writeFileSync(OUT_FILE, JSON.stringify(index, null, 2) + "\n");

for (const w of warnings) console.warn(`⚠ ${w}`);
const pluginCount = entries.filter((e) => e.type === "plugin").length;
console.log(`✔ wrote ${entries.length} entr${entries.length === 1 ? "y" : "ies"} (${pluginCount} plugin(s)) to ${OUT_FILE.replace(ROOT + "/", "")}`);
