---
name: onion-architecture
description: "Onion / ports-and-adapters layering for a backend service. Use when adding or reviewing a backend module — placing routes/services/repositories/adapters, deciding where a DB query or an external SDK call may live, wiring dependency injection at the composition root, defining a new port for an external dependency, or keeping the domain core pure. Enforces the dependency rule (imports point inward) and pairs with a dependency-cruiser-style gate. NOT for the frontend (use frontend-architecture / react-best-practices)."
version: "1.0.0"
---

# Onion Architecture — ports and adapters

This skill teaches the onion / ports-and-adapters pattern and how to
enforce it mechanically, not just by convention. Adapt the concrete paths
below to your own project's module layout — the generic shape (core →
ports → application → infrastructure → transport, composition root
outside the rings) is what's meant to transfer.

## The one rule

**All imports point inward.** A file may depend on layers more central
than itself; it may never depend on a layer further out. Coupling is
always toward the core. This is the Dependency Inversion Principle: inner
layers declare interfaces (ports); outer layers implement them; the
composition root wires them together.

```
        ┌─────────────────────────────────────────────┐
        │  Transport (HTTP routes, controllers)         │  ← outermost
        │   ┌─────────────────────────────────────┐     │
        │   │  Infrastructure / Adapters           │     │
        │   │   adapters/* · db/* · repositories   │     │
        │   │   ┌─────────────────────────────┐    │     │
        │   │   │  Application (services)      │    │     │
        │   │   │   modules/*/service.ts       │    │     │
        │   │   │   ┌─────────────────────┐    │    │     │
        │   │   │   │  Ports (interfaces) │    │    │     │
        │   │   │   │  shared contracts   │    │    │     │
        │   │   │   │   ┌─────────────┐   │    │    │     │
        │   │   │   │   │  Core       │   │    │    │     │
        │   │   │   │   │  domain     │   │    │    │     │
        │   │   │   │   │  (pure)     │   │    │    │     │
        │   │   │   │   └─────────────┘   │    │    │     │
        │   │   │   └─────────────────────┘    │    │     │
        │   │   └─────────────────────────────────┘     │
        │   └─────────────────────────────────────┘     │
        │       composition root: container.ts            │
        └─────────────────────────────────────────────┘
```

The composition root (e.g. `container.ts`) sits across the rings: it is
the **only** place allowed to know both a port and its concrete adapter,
because its job is to bind them.

## Layer map (adapt to your project)

| Layer            | Typical path                          | May import                                     | Must NOT import                                    |
|------------------|----------------------------------------|-------------------------------------------------|------------------------------------------------------|
| Core             | `domain/**`                            | itself, shared contract **types**                | any I/O: HTTP client, ORM, filesystem, adapters      |
| Ports            | `shared/contracts/**`                  | other shared types                               | anything concrete                                    |
| Application      | `modules/*/service.ts`                 | ports, the container, own `repository`/helpers   | adapters (concrete SDKs)                             |
| Infrastructure   | `adapters/**`, `db/**`, `*/repository.ts` | ports, drivers/SDKs, `db/schema`              | `modules/**` (a feature)                             |
| Composition root | `container.ts`                         | everything (binds ports ↔ adapters)              | —                                                     |
| Transport        | `modules/*/routes.ts`                  | own `service`, request/response schema           | adapters, `db/schema` (go through the service)       |

## Decision framework (placing a change)

Apply in order:

1. **Is it an external call** (HTTP, DB, filesystem, an LLM, a CLI)? It
   belongs behind a **port** (an interface in the shared-contracts layer),
   implemented by an **adapter**. Never call an SDK from a service or a
   route directly.
2. **Is it a DB query?** It lives in the module's repository, the only
   place allowed to touch the schema/ORM. Repositories return domain
   objects, not leaked query builders.
3. **Is it business orchestration?** It lives in the module's service. The
   service depends on **interfaces** via the container, never on a
   concrete adapter class.
4. **Is it HTTP wiring?** The route handler only: validate the request →
   call the service → map the result. No logic, no DB, no SDK calls.
5. **Pure domain logic?** It lives in the core and stays pure — its only
   outside contact is through injected ports.
6. **Cross-module need?** Reach the other capability through the
   container, never by importing another module's internal file directly.

## The rule judges the import *closure*, not the first hop

A violation is rarely sitting in the file you were asked to review.
Layering gets laundered through innocent-looking local helpers:
`service.ts` imports `./helpers/render.ts` (pure by its name), which
imports `./stats.ts`, which quietly queries the database. Every file in
that chain is part of the service's dependency closure — and the
dependency rule judges the closure, not just the entry point.

So when reviewing, do not declare a file clean until you have walked its
**relative** imports at least two hops out:

1. List the file's imports. Package/SDK/node imports end a chain —
   classify them by the layer map right there.
2. Relative imports (`./`, `../`) **continue** the chain — open each one
   and repeat.
3. Attribute what you find to the entry point: report the full chain
   (`service.ts → render.ts → stats.ts → db/schema`), not just the leaf,
   so the author sees why their "clean" file is implicated.

A static-analysis gate (e.g. `dependency-cruiser` for TypeScript, `import-linter`
for Python) sees the whole graph and catches these edges automatically —
but a reviewer who stops at hop one approves laundered I/O long before the
gate runs.

## Reviewing with this skill (scope & severity)

This skill is an **additional lens**, not the whole review. Layer
placement is one class of defect; a review that names every violated rule
but misses a real bug has failed the author.

- **Keep hunting functional bugs.** After the layering pass, re-read the
  code for state and data-flow errors. These matter more to the author
  than any import edge, and a layering-focused read tends to tunnel past
  them.
- **Calibrate severity.** Reserve CRITICAL for verified functional bugs,
  security holes, or data loss. Pure layering drift — an import pointing
  the wrong way with **no runtime defect** — is at most HIGH: it trips the
  enforcement gate, it does not break the user.
- **End every review by naming the gate to run** (whatever static-analysis
  tool the project uses) before merging.

## Adding a new external dependency (the canonical move)

1. **Define the port first** — an interface that speaks the application's
   language ("I need to post a comment"), with **no** vendor name in it.
2. **Implement the adapter** that wraps the concrete SDK.
3. **Add a mock/fake** so tests can inject it.
4. **Wire it in the composition root** as a lazy-bound dependency.
5. Services consume the port through the container — they never see the
   SDK directly.

## Enforcement

The dependency rule is not a convention to remember — enforce it with a
static import-graph linter (`dependency-cruiser` for TS/JS,
`import-linter` for Python, `ArchUnit` for Java/Kotlin). Configure rules
for the layer table above, run it in CI, and treat new violations as a
merge blocker. Existing violations at adoption time become a tracked
"known drift" backlog, burned down over time — not new license to add
more.
