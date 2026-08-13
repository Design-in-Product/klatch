# Theseus — Task List of Record

**Role:** Manual testing & exploration — CLI side  
**Cycle:** Phase 3, daily heartbeat (`31 9 * * *` — 09:31 AM PT)  
**Worktree:** `.claude/worktrees/theseus` / `claude/theseus`  
**Last updated:** 2026-08-13 (was 2026-06-22 — the June state below had gone stale and is corrected here, not appended to)

---

## Unblocked

_Items the cycle can pick up without xian._

- [ ] Session log at fire start; drain `docs/mail/` per the Mail Handling discipline
- [ ] **Mail close sweep** — several threads addressed to this seat are old enough to be dead but
      have not been read-and-closed into `docs/mail/read/`. Not done 8/13 (the sensitivity round
      took the fire); each needs reading before moving, so it is a real work item, not bookkeeping.
- [ ] **Probe 3 single-variable rerun** — reinsert the owner's restriction into the *same* klatch
      prompt rather than comparing across channels, so "restriction visible → withheld, evicted →
      disclosed" becomes a licensed claim. ~4 live calls. See
      `docs/research/carried-context-disclosure-sensitivity-2026-08-13.md` §"What probe 3 does not
      establish".
- [ ] **Replicate probe 3.** Currently n=1.

---

## Blocked-on-others (not xian)

- **Eviction defect** — handed to Daedalus 8/13 with three options and a recommendation. His
  surface; the header's contract applies to every klatch. Nothing for me until he rules.
- **`omittedCount` on the carried-context chip** — flagged to Iris 8/13, hers to rule on.
- **Canonicity line in Pard's 8/13 route ruling** — asked him whether his sentence meant something
  narrower than MAXT-04 seeding. If yes, I rule on it next cycle; if no, nothing is owed.

---

## Blocked-on-xian

_Items batched for xian's attention. Calliope's sweep promotes these to the attention rollup._

- **MAXT Session 02** — needs xian's live tandem attention; parked until he dedicates a session.
- **Round-trip MAXT** (Daedalus 4/28 assignment) — also needs live tandem attention; parked.
- **Staged test-data cleanup** — the four DBs in `.testdata/` are Pard's staging, held pending
  xian's call. Not mine to delete; noted so no fire "tidies" them away.

---

## Recurring items

| name | cadence | next_due | last_completed | notes |
|---|---|---|---|---|
| Mail drain | per fire | 2026-08-14 | 2026-08-13 | Read on arrival, act/reply/surface in the same turn |
| COORDINATION.md update | per fire | 2026-08-14 | 2026-08-13 | Update Theseus Prime section before any push |
| Session log entry | per fire | 2026-08-14 | 2026-08-13 | Timestamped entries as work progresses, not reconstructed |

---

## Standing discipline for this seat

- **Scratch DBs and result files are deleted at end of fire.** `.testdata/` is only gitignored for
  `*.db`/`-wal`/`-shm` — other files there are committable and will not show individually under a
  bare `?? .testdata/`.
- **Probes cost real money.** State the call count in the write-up.
- **Every probe needs the control that makes its result readable.** An empty or errored control is
  void, not a datum — check `status`/`stop_reason` on the row before reading a non-answer as a
  decision (this cost me a wrong write-up on 8/13 and was caught).

---

## AAXT candidates (standing queue — pick up when assignment-free)

From 5/18 wave, green-lit 5/28 by Calliope relay:

1. **ProjectSettings (F5.1)** — greenlit, not yet started
2. **EntityManager** — greenlit, not yet started  
3. **MessageList (F1.4)** — greenlit, not yet started
4. **Composition gesture surface** — not yet ready (Daedalus mid-implementation 6/22); target when feature-complete
