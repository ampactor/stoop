# Contributing

Small repo, strong laws. Most of them are enforced by `check.sh`; this file explains the intent behind the enforcement.

## Source layout

The rule is SQLite's: develop as parts, ship as one file. `src/` holds the parts; `build.sh` assembles the shipped artifacts; nobody edits an amalgamation.

- `src/meta.html`, `src/chrome.html`, `src/defs.html`, `src/footer.html`: the frame.
- `src/base.css`, `src/forms.css`, `src/views.css`: tokens and chrome, form and photo components, the view and sheet styles.
- `src/views/NN-name.html`: one file per view, numbered in display order. A new view is a new file, never a longer one.
- `src/js/NN-name.js`: one file per concern, in load order — `01-store` (state, migration, the photo store), `02-dither` (image intake), `03-render` (the views), `04-press` (imposition and the zine), `05-sync` (export, merge, import), `06-boot` (router, events, start). `build.sh` concatenates them inside a single IIFE, so they share one scope with no module plumbing: parts on disk, one function at rest. A new concern is a new file.
- `src/press.html`: the hand print kit, whole (it fits under the ceiling as one coherent piece).

Three hard rules, all checked: **no source file over 300 lines** (split at the next natural boundary: a view, a concern), **outputs are generated** (`index.html`, `press/index.html`, `artifact/*` come from `build.sh`; editing them directly is drift, and check 1 will catch you), and **the two presses fold the same way** (the app's `PRESET_A` and the hand kit's `presetA` must be equal; two presses that disagree is a stack of ruined paper, and check 5 will catch that too).

Why two output shapes: the `artifact/` fragments have no doctype because the claude.ai artifact publisher wraps them; the root and `press/` documents carry their own doctype and meta so GitHub Pages and local files render in standards mode with a correct mobile viewport.

## Workflow

Edit `src/`, then:

```
bash build.sh
bash check.sh
```

Commit only when check passes. Once per clone, make that automatic:

```
git config core.hooksPath .githooks
```

`.githooks/pre-commit` runs `check.sh` and refuses the commit if the laws do not hold, naming the rebuild command when the failure is drift. `git commit --no-verify` skips it deliberately.

The hosted job in `.github/workflows/check.yml` runs the same script and nothing else, so there is no second, secret standard. It is deliberately free of third-party actions: `check.sh` needs bash and the repo, and a job that enforces a page making zero external requests should not need a network dependency to start. The hook is the copy that matters, because it runs on the machine where the work happens and cannot be switched off by a hosting account.

## The gate

No Stage 1 software gets built until a real scene ships Issue #2 (see README and `tool/SPEC.md`). Stage 1 means the federation: rooms, vouching, corkboards, the protocol, anything a second scene would touch. That is what waits.

The Stage 0 app is not behind the gate — it is the thing the gate is waiting on, and it may grow whatever a scene of two needs to actually publish. But it grows under the same laws as everything else here: source in parts, outputs generated, the badge honest, and no capability that does not end in paper.

## Commits

Kernel register: an imperative subject line naming the subsystem, a body that says what changed and why, no bullets, no emoji, no attribution trailers.

## Development tooling

This repo is developed with AI assistance (Claude Code). Architecture decisions, the charter, and the design documents are human-judged; the assistant drafts, implements, and verifies under review. Per house convention there are no AI co-author trailers; disclosure lives here instead.
