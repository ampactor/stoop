# Contributing

Small repo, strong laws. Most of them are enforced by `check.sh`; this file explains the intent behind the enforcement.

## Source layout

The rule is SQLite's: develop as parts, ship as one file. `src/` holds the parts; `build.sh` assembles the shipped artifacts; nobody edits an amalgamation.

- `src/meta.html`, `src/chrome.html`, `src/defs.html`, `src/footer.html`: the frame.
- `src/base.css`, `src/rooms.css`, `src/views.css`: tokens and shared styles, the seven room skins, the view styles.
- `src/views/NN-name.html`: one file per view, numbered in display order. A new view is a new file, never a longer one.
- `src/app.js`: the router and the interactions.
- `src/press.html`: the print kit, whole (it fits under the ceiling as one coherent piece).

Two hard rules, both checked: **no source file over 300 lines** (split at the next natural boundary: a view, a skin, a concern), and **outputs are generated** (`index.html`, `press/index.html`, `artifact/*` come from `build.sh`; editing them directly is drift, and check 1 will catch you).

Why two output shapes: the `artifact/` fragments have no doctype because the claude.ai artifact publisher wraps them; the root and `press/` documents carry their own doctype and meta so GitHub Pages and local files render in standards mode with a correct mobile viewport.

## Workflow

Edit `src/`, then:

```
bash build.sh
bash check.sh
```

Commit only when check passes. CI runs the same script on every push; there is no second, secret standard.

## The gate

No Stage 1 software gets built until a real scene ships Issue #2 (see README and `tool/SPEC.md`). Housekeeping of what exists is fine; new capability is not. If a change feels like capability, it waits.

## Commits

Kernel register: an imperative subject line naming the subsystem, a body that says what changed and why, no bullets, no emoji, no attribution trailers.

## Development tooling

This repo is developed with AI assistance (Claude Code). Architecture decisions, the charter, and the design documents are human-judged; the assistant drafts, implements, and verifies under review. Per house convention there are no AI co-author trailers; disclosure lives here instead.
