# Stage 1: the scene tool

Status: paper. The gate in README.md holds; nothing in this file gets built until a real scene ships Issue #2. It is written now so that the unlock is a start, not a planning session.

## The load-bearing decision

A scene is a repository. Not "like" a repository: a git repo of plain files is the scene's entire data layer. Rooms are directories, pieces are files, issues are built artifacts committed back in, the guestbook is an append-only file per room, the corkboard is a directory of signed flyer files, the commons is a wiki directory. The tool is a porch built onto that repo: a thin web UI for the people who will never touch git, compiling everything to static HTML that any dumb host can serve.

This one decision buys most of the charter for free. Credible exit (III.5) is `git clone`. Open everything (III.4) is the format being readable in a text editor. Forking a scene (II.2) is forking the repo, commons included. The audit trail is `git log`. Hosting cost is a static site plus one tiny intake endpoint, which keeps Article V honest at porch-light wattage.

## The pieces

**The composer.** Submission box open during the cycle: a piece is a title, a body (markdown), optional images (dithered to 1-bit on intake, budget-capped), optional links out for audio. Submissions land as files in `cycle/` awaiting the desk.

**The desk.** The editor's board as already shaped in the front-door build: tray, cut-with-return (a cut moves the file back to the maker's drafts, never deletes), sequencing by hand, the editor's note, and BUILD. Build compiles `cycle/` into `issues/NN/` as static HTML plus a print-ready PDF laid out in the press imposition, then empties the tray. The bell is a cron job.

**The room editor.** Skin sandbox: a constrained HTML/CSS subset (no scripts, no external requests, size-capped), a light toggle (manual only, per DESIGN), the crew rail, the obsessions shelf. Output: `rooms/<name>/index.html`, static.

**The guestbook intake.** The one write path open to visitors: signing a guestbook appends to the room's guestbook file, gated by membership of a federated scene (vouch check), rate-limited to human speed. Knocks at the public stoop land the same way, in the scene's `stoop/` inbox.

**The corkboard.** Staple intake honoring the consent list: a flyer from a permitted scene lands in `corkboard/`, rendered on the scene page, revocable by removing the permission line.

**The shelf.** An index over `issues/`, `court/` (someday), and quest documentation. Static, built at the same time as everything else.

## What the tool is not

No accounts beyond the member list in the repo. No feeds, no metrics, no search beyond the browser's find and grep. No video. No notifications except the five in DESIGN, all batchable. No database; if state ever seems to need one, the state is wrong. No admin panel: administration is editing files, and the tool is one of several valid editors.

## Hosting shape

One small box per scene, or the flagship hosting many scenes as sibling repos. Nginx or equivalent serving static output; a single small process for intake (submissions, guestbook, knocks, staples); git as the write log. Target: the whole scene under a megabyte per page and the host under single-digit watts, measured and printed in the colophon.

## Source layout

The repo-wide law in CONTRIBUTING.md applies here from the first commit: source files under 300 lines, split at feature boundaries (one slice per primitive: composer, desk, room editor, intake, corkboard, shelf), colocated with their tests, assembled by a build step. The tool's output is static files; its source is parts; the amalgamation principle holds at both layers.

## Order of work at unlock

1. Scene repo layout finalized from a real scene's real Issue #1 and #2 (the paper issues become the fixture data; the model town retires to a branch).
2. Issue build pipeline (markdown to static issue to press PDF), because the zine is the heart.
3. Room editor and skin sandbox.
4. Intake endpoint (submissions, guestbook, knock, staple).
5. The desk UI over the pipeline.
6. The bell.

Two decisions stay open on purpose and block nothing here: the name (it bakes into the Stage 2 namespace, so it must be settled before lexicons, and it belongs to the people in the first scene), and whether the autoplay track survives contact with 2026 (the current answer: a play button that remembers).
