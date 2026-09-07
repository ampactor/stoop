# stoop

Folk media. The third form: mass media was made by industries for audiences; social media promised to invert that and instead industrialized us, one tiny broadcaster each, optimized by somebody else's engagement machine. Folk media is made by the people in it, for the people in it, owned like a commons, small like a scene, periodic like a zine, and pointed at the physical world. Folk music stood in the same relation to the record industry.

Stoop is a working name for a system with that shape. Where you sit with your people, facing the street. The wedge is one sentence: **your group chat deserves a zine.**

There is no feed anywhere in this system. That is not a missing feature; it is the load-bearing refusal.

## Why now

Each of these is a measured fact from mid-2026, not a mood:

- The For You page is now a literal sovereign asset. TikTok's US operation closed into an [Oracle / Silver Lake / MGX joint venture](https://www.npr.org/2026/01/22/nx-s1-5685456/nx-s1-5685456) in January 2026, algorithm retrained under new ownership.
- The open internet is majority fake: the going estimates run [51% bot traffic, most X accounts of uncertain humanity, over half of LinkedIn long-form AI-generated](https://medium.com/@ceylinzoi14/is-the-dead-internet-theory-coming-true-the-cost-of-ai-slop-a0b28c1abc42). Verified humanity is the scarce good; "everyone here is a vouched human" is a product now.
- Skin hunger is measurable: [SpaceHey passed 2M accounts](https://profiletree.com/what-is-myspace/) recreating 2005 MySpace, then had to go invite-only against the slop siege. VCs put [$19M into noplace](https://techcrunch.com/2024/07/03/noplace-a-mashup-of-twitter-and-myspace-for-gen-z-hits-no-1-on-the-app-store/) for the same hunger.
- Decentralization solved ownership, not warmth: [Bluesky ~34M accounts, ~1.6M daily; Mastodon sliding](https://fediview.com/articles/mastodon-vs-bluesky-vs-nostr-2026/). The rails work and the reason-to-be-there is missing. [Free Our Feeds](https://freeourfeeds.com/) is independently raising $30M to billionaire-proof the AT Protocol; we build on rails someone else is already defending.
- The finite, human-moderated, real-name digest is proven at twenty years' scale by [Front Porch Forum](https://en.wikipedia.org/wiki/Front_Porch_Forum), and the anti-corporate island with corporate-scale costs is disproven by [Cohost: 30K users, 2,630 payers, $17K monthly deficit, dead](https://tedium.co/2024/09/12/cohost-social-networking-postmortem/). Both lessons are structural here.
- The energy politics arrived: [70% of Americans oppose a local data center](https://time.com/article/2026/07/22/community-backlash-ai-data-centers/), electricity up 267% where they concentrate, while [Low-tech Magazine's solar server](https://solar.lowtechmagazine.com/about/the-solar-website/) proves a beloved publication runs on 1 to 2.5 watts.
- The kids are being evicted: [Australia's under-16 ban](https://www.techpolicy.press/early-lessons-from-australias-teen-social-media-ban-for-the-rest-of-the-world/) targets engagement mechanics by name. A system with none of those mechanics is a place the evicted cohort can legally exist.
- Gen Z already left for the group chat: detox rates near two-thirds, Discord and iMessage as the real social layer, [offline clubs in 19 cities](https://www.axios.com/2026/04/24/phone-free-spaces-digital-detox-retreats-gen-z). The demand side is sitting there, unserved by anything with a constitution.

## What is in this repo

Two layers, and it is worth being plain about which is which. There is a **working app** for one scene of two people, and there is a **paper design** for the federation that app would one day join. The app is real and running; the federation is an argument on paper and stays that way until the gate below opens.

### The app

- [`index.html`](index.html): the whole thing. One self-contained file, zero external requests, no accounts, no server, nothing uploaded anywhere. Six views: a daily **log** (notes, quotes, ideas, links, photos), shared **todos** and lists, **project** spaces, a **journal** for longer entries, the **zine press**, and **settings & sync**.
- **Photos are dithered to 1-bit on intake**, per the rule in `DESIGN.md`: a page-sized photo costs tens of kilobytes instead of megabytes, stays on the device, and is already in the only form a photocopier can honestly reproduce. Text and lists live in `localStorage`; photos live in IndexedDB.
- **The zine press** compiles the log, journal, lists, and projects into an eight-page, one-sheet, one-cut zine, imposed for a letter sheet in landscape. Panels are editable in place and save as you type. Print a numbered **test sheet** and fold it before committing good paper; if the numbers come out shuffled, **swap the fold** and test again. The imposition is the same one the hand kit in `press/` uses, and `check.sh` fails the build if the two ever disagree.
- **Sync is a file, not a service.** Export carries everything including photos; import **merges** by id and prefers the newer copy of anything held by both sides, so two people can each export, swap files, and end up agreeing. Replace is there when you want it and warns first.
- Entries are stored against a person (`a`, `b`, `both`), never against a spelling, so renaming either of you leaves every past note attached to the right hands.

### The paper

- [`CHARTER.md`](CHARTER.md): the law. Membership, scenes, the five unamendable clauses, governance, money, dissolution. Capture-resistance as structure rather than intention.
- [`DESIGN.md`](DESIGN.md): the machine. Every primitive (room, scene, issue, flyer, staple, vouch, guestbook, light, commons, quest), every loop, the data model, moderation, energy, economics, staging. The app above is Stage 0 of the staging plan in that file, at n=2.
- [`tool/SPEC.md`](tool/SPEC.md): the Stage 1 scene tool, specified on paper so the unlock is a start and not a planning session. Building it stays locked behind the gate.
- [`press/`](press/index.html): the hand toolchain. The same one-sheet, eight-page, one-cut layout with editable panels, fold diagrams, a test-sheet mode, and starter prompts. Print it, fold it, hand it to somebody, with no app involved at all.

### The build

[`src/`](src/) with [`build.sh`](build.sh) and [`check.sh`](check.sh): the development format. Parts under 300 lines, split at view and concern boundaries, assembled into the shipped one-file artifacts the way SQLite's hundred source files ship as one amalgamation. `check.sh` makes the laws mechanical: outputs reproducible from source, the size ceiling, the zero-external-requests rule, the page-weight badge telling the truth, and the two presses folding the same way. See [`CONTRIBUTING.md`](CONTRIBUTING.md).

## Where it lives

The app is at **[ampactor.dev/stoop/](https://ampactor.dev/stoop/)** and the hand print kit at **[ampactor.dev/stoop/press/](https://ampactor.dev/stoop/press/)**, served by GitHub Pages from `main`. Both are static; there is no backend to run and nothing to sign into.

Storage is per-origin, which is worth knowing before writing anything you want to keep: notes made against a local copy of `index.html` do not appear at the hosted address, and the other way round. Export and merge carries them across.

Hosting the page publicly does not publish what you write in it. The page is public; the words and photos are in your browser, and the zero-external-requests law is what makes that a fact about the software rather than a promise about its operators.

## Status

**The app works.** Two people can keep a log, share lists, run projects, journal, drop photos in, and print an issue. It is local-first and account-free by construction, which is the honest version of a privacy policy.

**The federation is paper.** No rooms, no vouching, no flyers, no protocol; those live in `CHARTER.md` and `DESIGN.md` and have never been built. Nothing in this repo federates with anything.

The founding gate is unchanged and is not signups or retention: it is whether the first scene ships **Issue #2**. Publication continuity is the only metric this project respects. No Stage 1 software gets built until then.

Two people are a scene. There is no minimum size anywhere in this design: vouching scales down to a founding pair, the editor's chair alternates instead of rotating, and a scene with no costs owes no dues. The first scene is expected to be two people and a copier, because two people ship on a deadline and eight people with no habit miss the first bell.

The name is provisional. Naming it is an argument to have with the people who will live in it, on principle.

Licenses, landed: software under AGPL-3.0-or-later ([LICENSE](LICENSE)), per Charter Article III; prose and design documents under CC BY-SA 4.0 ([LICENSE-docs](LICENSE-docs)). Copy this repo; that is what it is for.
