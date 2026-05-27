# Contributing to TermUI

Thanks for considering a contribution. Whether it's a bug fix, a new widget, improved docs, or a typo — it all helps.

> 🎯 **GSSoC 2026 contributors**: jump to the [GSSoC section](#gssoc-2026) below. Read it before opening any PR.

## Getting started

```bash
git clone https://github.com/Karanjot786/TermUI.git
cd TermUI
bun install
bun run build
bun run test
```

You need **Bun 1.3 or newer**. The project is a Bun workspace monorepo with 13 packages under `packages/`. Node 18+ is only required if you consume published `@termuijs/*` packages from npm — development is Bun-only.

## Project structure

```
packages/
  core/              Screen buffer, layout engine, input, events
  widgets/           Box, Text, Table, ProgressBar, Spinner, Gauge, VirtualList
  ui/                Select, Tabs, Modal, Toast, Tree, Form, CommandPalette
  jsx/               TSX runtime with hooks
  store/             Global state management
  tss/               Terminal Style Sheets
  router/            Screen routing
  motion/            Spring animations
  data/              System monitoring (CPU, memory, disk, processes)
  testing/           In-memory test renderer
  dev-server/        Hot-reload dev server (uses Bun.spawn)
  quick/             Fluent builder API
  create-termui-app/ Project scaffolding CLI
website/             Documentation site (Vite + TanStack Router)
examples/            Working example apps
```

## Before you write code

1. **Check existing issues.** Someone might already be working on it.
2. **Open an issue first** for anything larger than a small fix. Describe what you want to change and why. This saves everyone time if the approach needs discussion.
3. **One pull request per change.** Don't bundle unrelated fixes together.

## Writing code

### Style

- TypeScript strict mode. No `any` unless absolutely unavoidable (and if you use it, leave a comment explaining why).
- No external runtime dependencies in `@termuijs/core`. The core must stay dependency-free.
- Use `node:` prefix for built-in modules (`import { readFileSync } from 'node:fs'`).
- Every state-mutating method on a widget must call `this.markDirty()`.

### Tests

Every package uses [Vitest](https://vitest.dev/). Tests live next to source files (`foo.ts` → `foo.test.ts`).

```bash
# Run all tests
bun run test

# Run tests for a single package
bun vitest run packages/core

# Run a single test file
bun vitest run packages/widgets/src/data/Gauge.test.ts

# Watch mode
bun run test:watch
```

If you're adding a new widget or fixing a bug, add a test. If you don't know how to test something, look at existing tests in the same package for patterns.

### Building

```bash
# Build all packages
bun run build

# Build a single package
cd packages/core && bun run build
```

Each package uses tsup. The output goes to `dist/` with both ESM and CJS formats so published artifacts run on Node 18+ as well as Bun.

## Pull request process

1. Fork the repo and create a branch from `main`. Branch name: `type/short-description` (e.g. `fix/empty-list-crash`).
2. **⭐ Star the repo** before opening your PR. The `star-check` job will fail and block merge otherwise.
3. Make your changes.
4. Run `bun run build && bun run test && bun run typecheck` — all three must pass.
5. Write a PR title in the form `type: short description` (e.g. `fix: handle empty list in VirtualList`).
6. Link the issue you're closing: `Closes #123` in the PR body.

We review within 48 hours. Small PRs get reviewed faster.

## What we look for in reviews

- **Does it break existing tests?** If `bun run test` fails, the PR won't merge.
- **Is there a test for the change?** Bug fixes need a test that would have caught the bug. New features need coverage for the happy path and at least one edge case.
- **Does it match the existing code style?** Read a few files in the same package to get a feel for the patterns.
- **Are there `markDirty()` calls?** Any widget method that changes visible state needs to call `markDirty()` so the render loop picks it up.
- **Is the commit message clear?** Use the format: `fix(core): prevent layout overflow on zero-width box` or `feat(widgets): add BarChart widget`.

## Commit / PR title format

```
type(scope): short description

Longer explanation if needed.

Fixes #123
```

**Types:** `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `perf`, `style`, `a11y`, `ci`, `build`, `security`

**Scopes:** `core`, `widgets`, `ui`, `jsx`, `store`, `tss`, `router`, `motion`, `data`, `testing`, `dev-server`, `quick`, `create-termui-app`, `website`, `examples`

The CI workflow auto-applies a `type:*` label to your PR based on the title prefix. The label is what counts toward your GSSoC points.

## Adding a new widget

1. Create the file in the right package (`packages/widgets/src/` for base widgets, `packages/ui/src/` for compound ones).
2. Extend the `Widget` base class from `@termuijs/core`.
3. Implement `_renderSelf(screen: Screen)`.
4. Call `this.markDirty()` in every method that changes visual state.
5. Add a `caps.unicode` fallback if your widget uses any non-ASCII characters.
6. Add a `caps.motion` guard if your widget animates.
7. Export from the package's `index.ts`.
8. Add tests (see `packages/widgets/src/data/Gauge.test.ts` for the pattern).
9. Add a doc page in `website/src/content/` and register it in `pages.ts`.

## Adding a new theme

1. Create a `.tss` file in `packages/tss/src/themes/`.
2. Add the theme name to `BUILTIN_THEMES` in `packages/tss/src/themes/index.ts`.
3. Update the theme count in `packages/tss/package.json` and `packages/tss/README.md`.
4. Update the TSS docs page.

---

# GSSoC 2026

TermUI participates in **GSSoC 2026** (15 May → 14 August 2026). Below are the rules you need to follow to earn points.

## Step 1 — Star the repo

This is **required**. PRs from contributors who haven't starred the repo fail the `star-check` job and cannot be merged. The bot will comment with a reminder.

Once you star the repo, push any commit (or re-run the workflow) and the `needs-star` label lifts automatically.

## Step 2 — Pick a good first issue

Browse [open good-first-issues](https://github.com/Karanjot786/TermUI/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22).

Claim one by commenting:

> I would like to work on this

The bot will auto-assign you. You have **7 days** to open a PR. After that the issue is freed for another contributor.

## Step 3 — Open the PR

1. Branch name: `type/short-description`
2. PR title: `type: short description`
3. Link the issue in the body: `Closes #N`
4. Fill in the PR template (every section)
5. Make sure all checks pass: `build`, `test`, `typecheck`, `star-check`, `auto-label`

## Step 4 — How points are calculated

Every approved PR earns points based on labels. The admin sets `gssoc:approved` + `level:*` + `quality:*` after review; `type:*` is auto-applied from your PR title.

| Label | Effect |
|-------|--------|
| `gssoc:approved` | +50 base points (required for any credit) |
| `level:beginner` | +20 difficulty |
| `level:intermediate` | +35 difficulty |
| `level:advanced` | +55 difficulty |
| `level:critical` | +80 difficulty |
| `quality:clean` | × 1.2 multiplier |
| `quality:exceptional` | × 1.5 multiplier |
| `type:docs` | +5 |
| `type:bug`, `type:feature`, `type:testing`, `type:design`, `type:refactor` | +10 |
| `type:accessibility`, `type:performance`, `type:devops` | +15 |
| `type:security` | +20 |

**Formula:** `50 + (difficulty × quality_multiplier) + type_bonus`

**Example:** `gssoc:approved` + `level:intermediate` + `quality:clean` + `type:feature` = `50 + (35 × 1.2) + 10 = 102 pts`

## Step 5 — Avoid disqualification

These labels mean **zero points** and may lead to disqualification:

- `gssoc:invalid` — PR violates rules (e.g. no linked issue, broken build, no tests, missing template fields)
- `gssoc:spam` — duplicate, low-effort, or trivial change
- `gssoc:ai-slop` — generated content with no real engagement, broken code, or fabricated reasoning

**Don't:**
- Submit a PR without first claiming an issue
- Open multiple PRs for the same issue
- Use AI to generate code you don't understand
- Open PRs that only change whitespace or comments
- Bundle unrelated changes

**Do:**
- Engage with mentor feedback
- Test your code locally before opening the PR
- Read the existing code in the area you're modifying
- Ask questions on the [GSSoC Discord](https://gssoc.girlscript.org/getting-started) if anything is unclear

## Reaching the mentor

- **Quick questions** → GSSoC Discord, project channel, tag `@Karanjot786`
- **PR-specific questions** → comment on the PR with the exact line and error
- **Long-form / career** → LinkedIn

Format your question as: *"Hi, I'm stuck on issue #42. Tried approach Y, got error Z."* Specific = fast answer. "I'm stuck" = no answer.

## Weekly rhythm

| Day | Action |
|-----|--------|
| **Monday** | Pick one issue you can finish this week. Claim it. |
| **Wednesday** | Open the PR. Ping mentor if stuck. |
| **Sunday** | Check your rank on the GSSoC leaderboard. Plan next week. |

---

## Questions?

Open an issue or start a discussion. There are no stupid questions — the codebase has 13 packages and a lot of moving parts. Asking first is always better than guessing.
