# Handoff — Calliope, 2026-09-18 (Amber reboot / fresh-session cohort)

**Seat:** writing, chronicling & coordination — primary contact for xian
**Worktree:** `/Users/xian/Development/klatch-worktrees/calliope` · **Branch:** `claude/calliope-cycle` (this seat's own artifacts — mail, rollup, COORDINATION.md, handoffs — push straight to `main`; there is no code review gate for them)
**Written for:** a **cold start** — xian intends to open new sessions and decline to import prior context. Nothing carries over except this file and the repo.
**Requested by:** `docs/mail/janus-to-all-non-pm-residents-cc-xian-pard-exec-the-gate-reads-24-red-and-you-are-on-it-2026-09-18.md` — this seat was on the 24-red list because this file did not exist until this fire. Verified that directly (`git ls-tree -r origin/main --name-only | grep handoff-calliope` showed only the 8/11 and 8/4 files) before writing anything, per this project's verify-before-asserting rule.
**Supersedes:** `docs/handoff-calliope-2026-08-11.md` — five weeks stale; all three of its open 🔴 items are resolved (the `.env`/AAXT-credentials gate → 🟢 8/12; the `#3` compaction call → ✅ 8/12, build released; "addressing, not secrecy" → ✅, found already-answered and self-corrected 8/11). None reopened since.

Every load-bearing claim below is **[VERIFIED]** (a tool call in *this* session) or **[BELIEVED]** (recalled or read from a document — a lead to check, not a citation).

---

## 0 — If you read one paragraph

I don't own code, tests, or UX. I own three things: **the attention rollup** (`docs/operations/attention-rollup.md`, xian's single skim surface, currently v138), **mail hygiene** (`docs/mail/` — sweep every new memo into the rollup, move closed threads to `docs/mail/read/`), and **`docs/COORDINATION.md`'s narrative record**. The tree is green and clean. No code work of mine is ever in flight — my "in flight" is entirely paperwork, and right now that's three items parked on xian for 40, 21, and 11 days respectively (§2), all correctly low-urgency, plus this handoff itself (§5), which is the reason this seat was on Janus's red list an hour before this fire.

## 1 — State at stand-down [VERIFIED this session]

```
npm test  →  server 119 files · 1884 passed · 1 skipped
             client  38 files ·  324 passed · 13 skipped     exit clean
git status --short  →  clean
HEAD  →  b577cdcf (origin/main, synced by the wrapper immediately before this fire)
```

These match Daedalus's and Theseus's own 9/18 figures exactly — third independent confirmation this session, not taken on either's word. **Rollup:** `docs/operations/attention-rollup.md`, v138 as of the 9/17 STOP fire, four 🔴 items open (§3), none added or closed since — Round 229 (Theseus, landed this morning, scripts-only) doesn't touch the needs-you list. **Mail:** `docs/mail/` holds roughly 85 files not yet moved to `read/`; most are cc-only threads on the Daedalus/Theseus/Argus probe-round track that I don't have standing to close unilaterally (§4). Two items have a live action naming this seat directly (§2).

## 2 — Who owes what, both directions

**Owed TO this seat:**

| From | What | Since | State |
|---|---|---|---|
| **xian** | The logbook/STATE.md shape call — daily entries vs. several period-spanning ones. Janus weighed in with a lean (period-spanning, three reasons given) but explicitly declined to make the call final: *"the logbook is Klatch's own public record, not something DinP has standing to decide unilaterally."* | 2026-08-27 (my memo), 2026-08-28 (Janus's reply) | **Open, 21 days.** Nothing to do until he answers. `docs/logs/` (the daily transaction log) is unaffected and current the whole time — this is only about the higher-altitude synthesis document. |
| **xian** | Whether to retire `docs/operations/attention-rollup.html` (the in-repo rendered mirror, stale since 8/23 v67 against the `.md`'s v138) or have this seat catch it up and resume per-fire syncing. | 2026-09-07 | **Open, 11 days.** Flagged as low-priority, no product impact, in the original memo — correctly triaged, not stalled. |
| **xian** | One clarifying question, asked at the tail of a longer reply confirming his "direct, not private" discretion model: are a klatch's ground rules (`"nothing not already known to the group"`, Chatham House) a **standing default with per-klatch override**, or set **per-klatch from a blank slate**? The surrounding disclosure-norm decision shipped and was measured 8/13, but this specific configuration-surface question was never answered separately — checked directly, not assumed: the memo asking it is still in `docs/mail/`, not `read/`. | 2026-08-09 | **Open, 40 days — the oldest of the three, and I missed it drafting this handoff's first version.** Caught only because my own 08:32 START-fire log this same day named it and this section didn't match; fixed in place rather than left wrong (§8). |

**Owed BY this seat:** nothing in arrears. The recurring duties (rollup refresh, mail sweep, `COORDINATION.md` update) happen every fire as a matter of course, not on request. This handoff itself was the one overdue item, against Janus's 9/18 gate memo, until this fire.

## 3 — The rollup's four open 🔴 items, in enough detail to resume cold

Read `docs/operations/attention-rollup.md`'s "🔴 Needs you — FIRST, always" section directly — it is the source of truth and changes every fire; this is a compressed pointer, not a substitute. As of v138:

1. **Entity-delete floor.** `DELETE /entities/:id` can silently empty a channel (no equivalent guard to the one `DELETE /channels/:id/entities/:eid` already has). Two separable questions: (a) is an empty channel a bug or an accepted state — xian's premise call; (b) should the response name the channels it just emptied — buildable now, independent of (a). Theseus's Round 219, sharpened by Daedalus's Round 220.
2. **Backfill continuity #3 content correctness.** Reopened 9/2, reframed around a Friday target; long round-track history (Rounds 190–229 touch this thread in part). Current state: per-channel approval ratified 9/14; an escape-hatch design (Janus's approve-by-exception proposal) is on the table but not yet measured at scale — that measurement is Daedalus's, not xian's, to produce next.
3. **Carried-context eviction, option (2).** Whether Klatch should detect an owner's restriction and exempt it from eviction. Daedalus is explicit this is not his call to keep deferring; Theseus's 8/13 parking condition ("only if on-demand retrieval lands") has been met and measured.
4. **Commit live-round raw JSONs?** Whether the research track should start committing per-run result JSONs (`docs/research/raw/roundNN/`) so a published count is checkable against data rather than re-argued from prose alone.

None of these are mine to resolve. My job is keeping this list accurate and making sure nothing sits stale without the rollup saying so.

## 4 — Deliberately unresolved — do not "fix" these

1. **`attention-rollup.html` stays stale on purpose**, pending xian's call (§2). Don't silently resume syncing it, and don't silently retire it — both are his decision, not a default for whoever resumes this seat.
2. **The logbook/STATE.md gap since 6/22 is deliberate, not neglect.** Do not backfill 65 days of daily entries to make it look current — that manufactures false precision (dates, sequencing, who-did-what) for events reconstructed well after the fact, which is exactly the failure mode my own 8/27 memo named and Janus's reply agreed with.
3. **The ~85-file mail backlog in `docs/mail/` is not all mine to close.** Most of it is the Daedalus/Theseus/Argus probe-round exchange (Rounds 190–229) — I'm cc'd for visibility, not the closer. CLAUDE.md's close-discipline rule is explicit: the closer is "the agent who marks the thread done," because they have the context to know it's closed. Don't move someone else's open thread into `read/` just to make the directory shorter.

## 5 — In flight / done this fire

**Done, this fire** [VERIFIED]: this handoff. Confirmed `docs/handoff-calliope-2026-09-18.md` genuinely did not exist on `origin/main` before writing it (§0's verification). Re-ran the full suite fresh rather than cite Daedalus's or Theseus's numbers — matches both exactly.

**In flight:** nothing else. No rollup refresh needed this fire specifically — no new mail landed since my own 08:32 START-fire sweep that changes the needs-you list. Round 229 (Theseus, monotonicity-ladder instrument work, scripts-only) is real and landed but doesn't touch product or §3's list; it folds into the rollup at the next normal fire rather than forcing a detour while this gate file was the priority.

## 6 — Counterparties, and what I most recently got wrong with each

This is the part that cannot be reconstructed from the repo.

**Daedalus** (architecture & implementation). **What I most recently got wrong:** my own 9/12 "roadmap klatch: ready now" answer to Janus was wrong for about four hours on 9/14. I re-verified the mechanisms behind it rather than re-stating them from memory, and found a branch Cowork had described as merged back in August (`origin/claude/cowork-import-hardening`, the fabricated-turn parser fix) had never actually merged — 12 days after Argus explicitly asked Daedalus to pull/test/merge it. The defect it fixed was live on `main` the whole time. I filed the correction; Daedalus merged it same-day; I independently re-verified the merge myself (`git merge-base --is-ancestor`, a direct code read of the gate, an isolated test run, the full suite) rather than take his word for it, and reconfirmed the original answer for a stronger reason than I'd had that morning. **The pattern:** an answer I give xian or Janus needs to be re-derived from current state every time I restate it, not re-asserted from the last time I checked it — staleness is invisible until someone actually re-runs the verification.

**Theseus** (manual testing & exploration). No correction of my own to report, but the working pattern is load-bearing: he drives every claim at the wire and reports exact figures, and my job is to independently re-run what he reports, not transcribe it. Round 227's `klatch.db` pollution cleanup is the clearest recent case — his table named a specific worktree as contaminated (2001 channels, 2000 `probe-seed-%` rows); I didn't take that on word, checked this worktree directly (`find . -name "klatch.db*"`) and confirmed it was never exposed, and said so as a verified negative rather than a trusted one.

**Argus** (quality & testing). Pattern, not yet a correction I've caught myself in: he re-runs everything independently rather than trusting a memo. That means my own rollup figures get checked against his every time they overlap — if mine and his ever disagree, the working assumption should be that mine drifted, not that he did; that's been true in every case so far.

**Iris** (UI/UX). The thinnest relationship of the five — mostly visible through cc'd memos on client-side builds, rarely a direct exchange. Nothing to correct in either direction recently enough to be useful here; worth stating that plainly rather than inventing a pattern to fill the section.

**Janus** (cross-project curator). No specific correction, but the standing risk is treating his cross-pollination briefs as informational rather than load-bearing. His 9/18 gate memo — the reason this file exists — is the clearest possible evidence they carry real, time-sensitive asks, not just FYI context. Read `docs/briefs/cross-pollination/current.md` at session start, every time, not only when it looks relevant.

**xian.** Three threads have sat on him for 40, 21, and 11 days (§2). That is not evidence he's slow — it's evidence both were correctly triaged as low-urgency decisions rather than escalations, and I haven't resurfaced either with unwarranted pressure, which is correct as long as I keep re-checking they're still actually low-stakes rather than assuming it once and stopping. Standing pattern, memory-backed: **direct file links plus a chat summary reach him reliably; mail routing alone does not** — cite the file path, don't just route the memo.

## 7 — Mechanics a cold start will need

- **Duty cycle:** this seat has never had to check `launchctl` directly (I don't run code or hold a PID the way Daedalus/Theseus/Argus do) — **verify with `launchctl list | grep calliope` on resume** rather than trust any prior claim about schedule or cadence.
- **Session start is not optional:** pull, read `docs/COORDINATION.md` (2,400+ lines — jump to your own section header, e.g. `grep -n "^### Calliope" docs/COORDINATION.md`, rather than reading linearly; the file is dense enough that `Read`'s offset/limit tool rejects more than ~20 lines at a time), read `docs/mail/` for anything addressed to Calliope, read `docs/briefs/cross-pollination/current.md`.
- **Mail discipline:** CLAUDE.md's close-discipline rule — `git mv` both sides of a closed thread into `docs/mail/read/` at the moment of closing, but only for threads this seat is the closer of (§4.3).
- **`git stash` is shared across worktrees.** Use a WIP commit instead; if a stash is unavoidable, tag it and restore by SHA, never bare `pop`.
- **SSH over port 443** is the documented workaround if `git push`/`fetch` hangs (CLAUDE.md has the one-time setup).
- **The rollup is a trust instrument, not a status report** (Exec's framing, 6/19): every render traces to a verified sweep done *that session*, never carried from memory. Update it the moment verified facts make it stale — don't offer and wait for approval; xian confirmed this directly on 2026-06-27 after this seat once asked first.

## 8 — What I would do next, in order

1. Push this handoff, then verify the gate actually reads green for this seat — behaviorally, per Janus's memo, not by trusting the filename pattern matches. (`handoff-calliope-2026-09-18.md` matches `handoff[-_]{role}([-_.]|$)` with `role=calliope` on visual inspection, but Theseus's own memo this morning found his board title, not his roster name, nearly cost him this exact gate — worth a behavioral check, not just a read of the pattern.)
2. Resume normal fire discipline: fold Round 229 into the rollup and `COORDINATION.md` at the next scheduled fire.
3. Take no action on the three xian-parked items (§2) beyond keeping them visible — correctly low-urgency, not stalled, and manufacturing urgency where there isn't any is its own failure mode. The 40-day ground-rules question is the oldest and, now that it's actually visible again, the one worth a light one-line nudge next time there's a natural reason to be in touch with him — not an escalation, just don't let it go another 40 days unmentioned now that it's been re-surfaced.
4. **A process note on how item 3 above got missed the first time:** this handoff's own first draft named only two of the three standing threads parked on xian, because I built it from the rollup and `docs/mail/` greps rather than cross-checking my own same-day session log, which already had the full list of three. Caught it only by re-reading that log while drafting §7's mechanics section, not by any deliberate check. **If resuming this seat cold, don't assume a handoff's "who owes what" table is exhaustive just because it looks thorough — cross-check it against `docs/COORDINATION.md`'s own most recent entries for this seat, which is a second independent source of the same facts.**

— Calliope, 2026-09-18 MID fire
