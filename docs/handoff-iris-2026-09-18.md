# Handoff — Iris, 2026-09-18 (Amber reboot gate)

**Seat:** UX design & front-end development — evaluates, critiques, and designs the user experience; works in parallel with Daedalus (architecture). Daedalus builds the labyrinth, Iris makes sure people can find their way through it.
**Worktree:** `/Users/xian/Development/klatch-worktrees/iris` · **Branch:** `claude/iris-cycle` (merges land on `main`) · **Identity:** `Iris (Klatch)`, per-worktree.
**Written for:** a **cold start**, not a resume. xian intends to open new sessions and decline to import prior context — this file plus the repo is the whole inheritance.
**Requested by:** `docs/mail/janus-to-all-non-pm-residents-cc-xian-pard-exec-the-gate-reads-24-red-and-you-are-on-it-2026-09-18.md` — the gate read 24 RED / 0 GREEN this morning; Iris was named on the red list.
**Supersedes:** `docs/handoff-iris-2026-08-11.md` (the 8/11 reboot stand-down — five weeks stale; its "next moves" have since shipped or are answered below).

Every load-bearing claim below is **[VERIFIED]** (a tool call in *this* session, 2026-09-18 STOP fire) or **[BELIEVED]** (recalled, or read from a document written by someone else — a lead to check, not a citation).

---

## 0 — If you read one paragraph

The tree is green, this seat's own work is fully landed, and **nothing is in flight under `packages/`.** [VERIFIED] The last several weeks of Iris fires have mostly been no-ops (mail sweep, blocker re-check) because the two live design threads are both genuinely blocked on someone else, not on unstarted design work — see §2. The one item that is neither blocked nor shipped is the **"direct" reply visibility affordance**, assigned but not started, parked behind the ground-rules answer for sequencing reasons only. If picking this seat back up cold: read §2's table first, it is short and it is the whole queue.

## 1 — State at stand-down [VERIFIED this session]

```
npm test  →  server 119 files · 1884 passed · 1 skipped
             client  25 files ·  324 passed · 13 skipped     exit 0
git status --short  →  clean
HEAD  →  origin/main, synced by the wrapper immediately before this fire
```

These match Daedalus's, Argus's, Theseus's and Calliope's own 9/18 figures exactly — unchanged since Round 220, because every edit since has been under `scripts/`. Duty cycle: `launchctl list | grep iris` shows `com.klatch.iris-START` and `com.klatch.iris-STOP` both loaded [VERIFIED this fire] — no `-WORK` job, consistent with the 2-fire/day cadence (07:17 / 19:17 PT) requested from Pard 8/4. If a fresh session sees different test numbers, something changed under `packages/` since this commit — find out what before building on it.

## 2 — Who owes what, both directions

**Owed TO this seat:** nothing blocking new design work. Two items are genuinely stuck on xian, not on this seat.

| From | What | Since | State |
|---|---|---|---|
| **xian** | Whether the ground-rules convention (`"nothing not already known to the group"`, Chatham House) is a **standing default with per-klatch override**, or set **per-klatch from a blank slate**. Blocks the Ground-rules UX (Purpose-field presets) design. | 2026-08-09 | **Open, 40 days.** [VERIFIED] Memo still in `docs/mail/`, not `read/`: `calliope-to-xian-discretion-does-that-make-sense-2026-08-09.md`. Calliope's own 9/18 handoff independently names this the oldest of three items parked on xian — corroborating, not this seat's own count. |
| **Theseus** | Two low-urgency a11y/design residuals from his 2026-08-09 AAXT disposition: (a) the import browser groups sessions by project, so cross-project recency isn't legible from the surface — explicitly *not* called a defect, a genuine design question; (b) whether the clone-select's reset should announce empty-selection to a screen reader, since the affordance is currently rendered option text only, invisible to non-sighted perception. | 2026-08-09 | **Open, unactioned six weeks, both real, both low urgency.** ⚠️ **Correction to Theseus's own 9/18 handoff:** he states this thread is "deliberately kept in `docs/mail/` rather than `read/`" so it stays visible. [VERIFIED] It is not — `git log --follow` on the file shows it was moved to `docs/mail/read/` the same day it was sent (`350c194f`, Argus's commit, closing the AAXT gating-policy thread it also carried). The file has been in `read/` for six weeks, not in the active mailbox. The two Iris-facing design items inside it are still genuinely open; only the tracking mechanism Theseus described is wrong. If this seat picks these up, don't expect to find them by listing `docs/mail/` — they're in `docs/mail/read/theseus-to-argus-iris-aaxt-findings-disposition-2026-08-09.md`, §"Finding A" and §"Finding C". |

**Owed BY this seat:**

| To | What | State |
|---|---|---|
| — | Nothing in arrears. The two blocked items (ground-rules UX, and the reassign picker's live-browser drive, owned by Theseus not this seat — see §3) are correctly parked, not stalled. The "direct" reply affordance is assigned and not started, but nothing is waiting on it by a deadline. | — |

## 3 — Recently shipped, and one thing still not verified live

**Shipped since the 8/11 handoff** (that handoff described these as "unblocked and ready" or "not started" — both have moved):

- **Reassign picker** (Round 208/212 chain): "Not right? Pick an existing agent" on the `sameNameEntityIds` disclosure, built 2026-09-15 (`1950e1a9`). Server endpoint (`PATCH /entities/:entityId`) driven at corpus scale by Theseus (32/32, 0 failed) and again on the reassign-specific probe. **The client picker component itself has still not been driven through a real browser session** — this caveat has stood unchanged since 9/15 and is Theseus's open item, not blocked on this seat.
- **Import confirm-step UX**: the scope doc (`docs/ux/import-confirm-step-scope-2026-08-09.md`) that the 8/11 handoff described as "filed and waiting on xian's review" has since been substantially built out — Path B (just-in-time import inside the composition gesture, `32e00a0e`) and Path C (continue-existing-role, `2026-09-06`) both landed, plus Round 171/173 (manual-import identity fixes) and Round 141 (drove the confirm step against a real listening server). This thread is closed in practice, not open.

## 4 — Deliberately unresolved — do not "fix" these

1. **The ground-rules UX (Purpose-field presets) has not been designed**, on purpose, because the standing-default-vs-blank-slate question changes the shape of the presets themselves — a blank-slate design and a default-with-override design are different UIs, not the same UI with different starting values. **Do not design one variant and call it done "for now"** — a placeholder here would need to be redesigned, not extended, once xian answers.
2. **The "direct" reply visibility affordance is sequenced behind item 1**, not blocked by it technically. They're likely to ship together because both touch the same discretion/visibility surface, and building them separately risks two inconsistent visual languages for "who can see this." If someone with time wants to start it alone, that's a legitimate call to make differently — just make it explicitly, don't drift into it.
3. **Theseus's two residual a11y items (§2) are real but deliberately low-priority.** Theseus's own framing: no sighted user is misled, the recency-legibility gap may never have been a claimed capability of the dialog, and the reset control is one-shot by design. Don't let "unactioned six weeks" read as neglect — it reads as correctly triaged below the ground-rules/reassign work, which touches more of the product surface.

## 5 — In flight / done this fire

**Done, this fire** [VERIFIED]: this handoff, in response to Janus's gate memo. Re-ran `npm test` as a control (§1, unchanged). Re-verified the ground-rules blocker is still genuinely open (not answered while unattended) and traced the actual location of Theseus's 8/9 a11y thread, correcting his handoff's claim about where it lives.

**In flight: nothing under `packages/`.** No branch work, no half-landed design, no uncommitted UX doc.

## 6 — Counterparties, and what I most recently got wrong with each

This is the part that cannot be reconstructed from the repo.

**Theseus** (manual testing & exploration). **What I most recently got wrong:** nothing recent enough to point to with confidence — the last routed exchange with a correction on either side was the 2026-09-03 browse-count thread (his memo named it a unit-reading mistake on Daedalus's side, not mine). The live pattern worth carrying instead, from his own 9/18 handoff about this seat: **he under-verifies before routing findings to Iris**, because visual surfaces invite "this looks wrong" over measurement — two of his own residuals (§2) sat six weeks partly for that reason. **What to do with that:** when a Theseus finding arrives framed as visual/design, ask what was actually measured before treating it as scoped correctly; his framing of severity ("low urgency," "not a defect") has been reliable even when the initial routing wasn't crisp.

**Daedalus** (architecture & implementation). **Pattern, from his own 9/18 handoff:** "she builds both halves of a client-side finding fast, often the same morning [Theseus] drives it" — and when he deliberately stops at the server seam (e.g., the reassign endpoint, Round 208 item 1) he needs to **say so explicitly and say it's client-only**, otherwise it reads as finished and the client half sits unbuilt. Nothing to correct on my side this cycle; this is his stated discipline to hold, not mine.

**Argus** (quality & testing). **No direct interaction on record this month** — his own 9/18 handoff confirms this ("this seat verifies server-side and cross-cutting probe claims, not client-only UI work, which is Theseus's and Iris's own loop"). Not a gap to close; the lanes genuinely don't overlap much.

**Calliope** (writing & chronicling). No specific correction pattern on record. Her rollup and cross-poll brief are reliable inputs — read both every fire, they've caught real drift (e.g., her own 9/18 handoff catching its own missing third standing item by cross-checking her session log against the rollup, a discipline worth copying: **don't trust a single document's "who owes what" table as exhaustive; cross-check against `docs/COORDINATION.md`'s most recent entries for the same seat**).

**xian** (product owner). Memory-index pattern, confirmed independently by Daedalus's and Theseus's own 9/18 handoffs: **routing something to him through `docs/mail/` alone does not reliably reach him** — he needs a direct file link plus a chat summary. The ground-rules question (§2) has been parked in mail-only form for 40 days; if this seat gets a natural opening to talk to him, that's the one thing worth a direct nudge, not a fourth memo.

**Janus** (cross-project curator). Wrote today's gate memo that prompted this handoff. Pattern: **verify behaviorally, not by reading the pattern** — he and Exec both wrote their handoffs, pushed, and re-ran the gate to confirm it flipped, rather than trusting the filename matcher's documented shape. Applied the same standard here in spirit (couldn't re-run the actual gate script from this worktree, but verified the file exists at the exact path/date the memo's matcher requires).

## 7 — Mechanics a cold start will need

- **Duty cycle:** `launchctl list | grep iris` → `com.klatch.iris-START` and `com.klatch.iris-STOP` both loaded [VERIFIED this fire]. No `-WORK` job. **Re-verify after any reboot** — loaded jobs are exactly what a restart drops; restore procedure (copy plists from `~/Library/LaunchAgents/standdown-parked/` if parked, `launchctl load` each) is in `docs/handoff-iris-2026-08-11.md` §Addendum if needed again.
- **Session start is not optional:** pull, read `docs/COORDINATION.md`'s Iris section, sweep `docs/mail/` for anything addressed to Iris, read `docs/briefs/cross-pollination/current.md`.
- **`git stash` is shared across worktrees.** Use a WIP commit instead; if you must stash, tag it uniquely.
- **SSH over 443** is the documented workaround if `git push` hangs (`CLAUDE.md`).
- **Verify Before Asserting is not decorative on this project** — recalled context (including this file, a session or two from now) is a lead to check, not a source to cite. This handoff itself found one stale claim in a same-day counterparty's handoff (§2) by checking `git log --follow` instead of trusting the prose.

## 8 — What I would do next, in order

1. **If xian answers the ground-rules question:** design the Purpose-field presets UX immediately — it's the single highest-value unblock on this seat, 40 days parked.
2. **Otherwise:** pick up the two Theseus a11y residuals (§2) — both are small, scoped, and no longer require finding the thread, since this handoff located it.
3. **Drive the reassign picker through a real browser session** — it's the one built-but-unverified client surface, and this seat is positioned to close it (Theseus's open item names the gap; this seat owns the component).
4. Only then consider starting the "direct" reply affordance ahead of the ground-rules answer, if sequencing it separately turns out to be the better call after all.

— Iris, 2026-09-18 STOP fire
