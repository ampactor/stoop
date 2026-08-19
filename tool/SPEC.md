# Stage 1: the scene tool

Status: paper. The gate in README.md holds; nothing in this file gets built until a real scene ships Issue #2. It is written now so that the unlock is a start, not a planning session.

## The load-bearing decision

A scene is a repository. Not "like" a repository: a git repo of plain files is the scene's entire data layer. Rooms are directories, pieces are files, issues are built artifacts committed back in, the guestbook is an append-only file per room, the corkboard is a directory of signed flyer files, the commons is a wiki directory. The tool is a porch built onto that repo: a thin web UI for the people who will never touch git, compiling everything to static HTML that any dumb host can serve.

This one decision buys most of the charter for free. Credible exit (III.5) is `git clone`. Open everything (III.4) is the format being readable in a text editor. Forking a scene (II.3) is forking the repo, commons included. The audit trail is `git log`. Hosting cost is a static site plus one tiny intake endpoint, which keeps Article V honest at porch-light wattage.

## Layout and addresses

The repo layout and the URL layout are the same layout, which is the property that makes a scene movable:

```
scenes/<scene>/
  scene.txt            name, bell, cycle, editors in rotation
  members.txt          the roll. private by default (CHARTER I.3)
  rooms/<member>/      index.html, guestbook.txt, skin assets
  cycle/               open submissions, awaiting the desk
  issues/03/
    pieces/*.md        the source of the issue
    index.html         reading view          -> /stoop/<scene>/03/
    sheet.html         imposed for printing  -> /stoop/<scene>/03/sheet
    issue.pdf          print-ready, same content
  corkboard/           stapled flyers, one file each, with provenance
  commons/             wiki, skill ledger, tool library, quest logs
  stoop/               the public door: who we are, how to knock
```

Built output goes to `<host>/stoop/<scene>/`, `latest/` symlinks the newest issue, and the scene root is both the stoop and the shelf. Everything under a scene links relatively, with no absolute URL anywhere in built output, so the directory survives being moved to another host, a thumb drive, or a tarball (CHARTER II.6). The checker enforces this the way `check.sh` already enforces the no-external-requests law in this repo.

Two surfaces never go public: `members.txt` and `cycle/`. A roster is a list that gets used, and a draft is a draft.

## The pieces

**The composer.** Submission box open during the cycle: a piece is a title, a body (markdown), optional images (dithered to 1-bit on intake, budget-capped), optional links out for audio. Submissions land as files in `cycle/` awaiting the desk.

**The desk.** The editor's board as already shaped in the front-door build: tray, cut-with-return (a cut moves the file back to the maker's drafts, never deletes), sequencing by hand, the editor's note, and BUILD. Build compiles `cycle/` into `issues/NN/` three ways from one source: the reading view, the imposed sheet, and the PDF. If a piece cannot be imposed, the build says so before the issue drops rather than after. The tray empties; the bell is a cron job.

Who holds the desk comes from `scene.txt`. Two members alternate, more rotate, and the rule underneath is that exactly one person owns the final cut on any given issue.

**The press.** One-sheet imposition (eight panels, one cut) is Stage 0's hand tool and already ships in `press/`. Stage 1 adds saddle-stitch imposition for issues past the eight-panel budget: four pages per sheet, folded and stapled through the spine, page order computed rather than eyeballed. Both modes print a test sheet first, because printers and folding hands vary.

**The room editor.** Skin sandbox: a constrained HTML/CSS subset (no scripts, no external requests, size-capped), a light toggle (manual only, per DESIGN), the crew rail, the obsessions shelf. Output: `rooms/<name>/index.html`, static.

**The guestbook intake.** The one write path open to visitors: signing a guestbook appends to the room's guestbook file, gated by membership of a federated scene (vouch check), rate-limited to human speed. Knocks at the public stoop land the same way, in the scene's `stoop/` inbox.

**The vouch check.** Required vouchers are `min(2, floor(members / 2))` per CHARTER I.1, so a founding pair vouches itself, a scene of three needs one name, and from four up the two-name rule binds. The tool computes it; nobody administers it.

**The corkboard.** Staple intake honoring the consent list: a flyer from a permitted scene lands in `corkboard/`, rendered on the scene page, revocable by removing the permission line.

**The shelf.** An index over `issues/`, `court/` (someday), and quest documentation. Static, built at the same time as everything else.

## What the tool is not

No accounts beyond the member list in the repo. No feeds, no metrics, no search beyond the browser's find and grep. No video. No notifications except the five in DESIGN, all batchable. No database; if state ever seems to need one, the state is wrong. No admin panel: administration is editing files, and the tool is one of several valid editors.

## Hosting shape

One small box per scene, or the flagship hosting many scenes as sibling repos. Nginx or equivalent serving static output; a single small process for intake (submissions, guestbook, knocks, staples); git as the write log. Target: the whole scene under a megabyte per page and the host under single-digit watts, measured and printed in the colophon.

Stage 0 needs none of that. Scenes are directories of hand-written static files under `ampactor.dev/stoop/`, which is a Vite site copying `public/` to `dist/` on push; the first scene ships as a folder and a commit. Nothing about the address changes when the tool arrives, because the tool writes the same directory a hand writes.

## Source layout

The repo-wide law in CONTRIBUTING.md applies here from the first commit: source files under 300 lines, split at feature boundaries (one slice per primitive: composer, desk, room editor, intake, corkboard, shelf), colocated with their tests, assembled by a build step. The tool's output is static files; its source is parts; the amalgamation principle holds at both layers.

## Order of work at unlock

1. Scene repo layout confirmed against a real scene's real Issue №01 and №02 (the paper issues become the fixture data; the model town retires to a branch). The layout above is the hypothesis; two hand-built issues are the test.
2. Issue build pipeline (markdown to reading view to imposed sheet to PDF), because the zine is the heart and the two substrates have to come from one source or they drift.
3. Room editor and skin sandbox.
4. Intake endpoint (submissions, guestbook, knock, staple), with the vouch count computed from the roll.
5. The desk UI over the pipeline.
6. The bell.

Two decisions stay open on purpose and block nothing here: the name of the system (it bakes into the Stage 2 namespace, so it must be settled before lexicons, and it belongs to the people in the first scene, though the addressing scheme means their scene can be named long before the software is), and whether the autoplay track survives contact with 2026 (the current answer: a play button that remembers).
