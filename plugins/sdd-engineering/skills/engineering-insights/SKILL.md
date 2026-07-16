---
name: engineering-insights
description: "Captures non-obvious engineering insights into the touched module's notes file (e.g. INSIGHTS.md), so a future agent or session doesn't relearn them. TRIGGER — invoke this skill immediately, before writing anything to a notes file yourself from memory of its format: the instant you hit something a future agent would otherwise relearn — a gotcha, a working approach, a dead-end antipattern, a codebase convention, a tool/library quirk, a recurring error+fix, or an open question. Fires mid-session on that discovery (even before tests are green) and again at session end, on \"wrap up\" / \"retro\", or when /engineering-insights is invoked. Reads the existing file first, never duplicates, writes only substantial file-grounded entries, and is strictly append-only (never overwrites)."
---

# Engineering Insights

Capture one durable engineering insight into the **notes file of the module the work
touched** (commonly named `INSIGHTS.md`, at the root of the affected package or module), so
the next session doesn't relearn it. Read what's already there, add only what's new and
substantial, never overwrite.

This skill is optional infrastructure for the SDD workflow: use it if the host project wants
to persist verified insights across sessions. If the project has no notes-file convention yet,
the first invocation establishes one (see *Where to write*).

## Where to write (module routing)

There is no fixed module list — write to the notes file of the package/module the work
actually touched:

| Work touched | File |
|---|---|
| a single module/package | `<module>/INSIGHTS.md` (create it with a minimal header + the seven section headings below, if it doesn't exist yet) |
| spans several modules | write the part relevant to each, to each module's own file |
| pure root config / CI only, or a single-package project with no module split | the project root's `INSIGHTS.md`, or skip if this genuinely isn't a module-level insight |

Never write insights into this SKILL.md itself.

## What counts (the 7 sections)

Each `INSIGHTS.md` has fixed sections — append each entry under the right one:

- **What Works** — an approach/solution that worked here.
- **What Doesn't Work** — dead ends and antipatterns. **Highest-value section, most often skipped — prioritize it.**
- **Codebase Patterns** — conventions and architectural decisions.
- **Tool & Library Notes** — dependency quirks and gotchas.
- **Recurring Errors & Fixes** — an error you'd hit again + the fix.
- **Session Notes** — dated session summaries (use a `### YYYY-MM-DD` subheading).
- **Open Questions** — what's still unresolved.

## Concrete, not banal

Test before writing: **"If this were obvious to anyone reading the code, don't write it."**

| ❌ Noise | ✅ Useful (actionable cold) |
|---|---|
| "Promises can be tricky" | "`Promise.all()` on the ingest pipeline times out after 30 items — use `Promise.allSettled()` in batches of 10" |
| "be careful with context enrichment" | "context enrichment is best-effort: on unindexed/error, omit the section, never throw — `src/...:NN`" |

## Entry format

Append a bullet under the matching `##` section:

```
- **YYYY-MM-DD** — <concrete, actionable insight>. Evidence: `path/file.ts:NN`.
```

Session Notes instead group under a dated subheading:

```
### YYYY-MM-DD
- <what the session accomplished / decided, one line per point>
```

## Workflow

Copy this checklist and work through it:

```
- [ ] 1. Gate check — was this session substantial?
- [ ] 2. Read the touched module's INSIGHTS.md
- [ ] 3. Draft ≤5 candidates, ranked by signal
- [ ] 4. Dedup against what's already there
- [ ] 5. Append automatically (append-only)
- [ ] 6. One-line summary
```

1. **Gate check.** Did the session produce something substantial — a problem solved, a decision made, a non-obvious discovery? If not → **write nothing** and stop.

   **Timing gate:** two valid moments to run this skill:
   - **Immediately on a genuine discovery** — the instant you solve a gotcha, hit a dead end, or land
     a concrete decision worth keeping, even mid-session and before tests are green. This is a
     separate, additional invocation, not a violation of "once per session."
   - **Once at session end**, as a summary pass over anything substantial not already captured.

   Do NOT run:
   - speculatively, before anything concrete has actually been learned;
   - during exploration with no finding yet, just to "check in";
   - twice for the same discovery — the end-of-session pass must dedup (step 4) against what a
     mid-session run already wrote.
2. **Read first.** Open the touched module's `INSIGHTS.md` before drafting anything. If it
   doesn't exist yet, create it with a minimal header and the seven section headings, empty.
3. **Draft ≤5 candidates**, ranked by signal (user corrections and gotchas highest; nice-to-know patterns lowest). Each candidate = the exact proposed line + its target section + `file:line` evidence.
4. **Dedup.** Drop any candidate already covered by an existing entry. If reality contradicts an old entry, add a new dated note that supersedes it — never edit the old one.
5. **Append** the survivors (automatic mode — no approval prompt). If nothing substantial survives gate + dedup, write nothing.
6. **Summary.** One line: what was written, to which file, what was skipped.

## Non-destructive write contract (hard rule)

This skill is **append-only** and must never clobber existing content:

- **Re-read the target `INSIGHTS.md` immediately before writing** — its state may have changed since the session started.
- **Insert with an anchored `Edit`** that adds the new bullet under the correct `##` heading. **Never use the `Write` tool on an existing `INSIGHTS.md`** — `Write` replaces the whole file and would destroy prior content.
- **Preserve verbatim** the `# Insights — …` header, the preamble, every section heading, and every entry already in the file. New content is only ever *added*.
- **Corrections are additive** — supersede a wrong entry with a new dated note; do not rewrite or delete the old one.
- **Idempotent** — if an equivalent entry already exists, skip it (no duplicate, no rewrite).

## Maintenance (not per-session)

Append-only keeps the file growing, so keep it lean out of band: prune periodically (drop
fixed-bug, duplicate, and never-needed entries), aim for ~30 high-value entries per file
before splitting into domain files, and treat the file as a reviewed draft — spot-check it,
since an incorrect entry propagates to every future session until corrected.
