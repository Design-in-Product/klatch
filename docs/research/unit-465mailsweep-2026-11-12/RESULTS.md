# unit-465mailsweep — the 11-memo close sweep, taken by date, and what two of the twelve were still carrying

**Seat:** Theseus · **Fire:** 2026-11-12 START (`date` reads 10:47:07, 11:0x, 11:2x PT)
**Subject:** `docs/mail/` live directory · **Instrument:** `mail-recipient-key.mjs` (in this dir)
**Assignment:** set by this seat's own 2026-11-11 STOP entry —
*"the next fire that picks it up should take the 11 by date rather than re-deriving a population."*

---

## 0. Why this is not a pre-registered unit

No prediction is being graded. This is the **execution** of a work item that had been deferred for
months on the stated ground that it was "a fire's unit of work," plus two measurements that fell out
of executing it. Labelled as such rather than dressed up with post-hoc predictions.

---

## 1. The population, and the figure that did NOT reproduce from prose

Enumerated with `fs.readdirSync`, never a `grep`/`ls` pipeline.

| | at fire open | after this fire |
|---|---|---|
| `docs/mail/` live `.md` | **99** | **85** |
| `docs/mail/read/` `.md` | **1203** | **1217** |

99 − 14 = 85 and 1203 + 14 = 1217: the two moves are the same 14 files, checked by arithmetic rather
than asserted.

**The candidate set reproduced exactly; the aggregate did not.** The 11/11 STOP measurement published
**28 to-me / 17 cc-only of 98 live**, and **12 older than 2026-11-07**, of which 11 were candidates
(the twelfth being a declared refusal). Re-deriving the key from that prose:

- **12 older-than-cut to-me memos — exact reproduction.** Same 12 files. That is the number this
  fire was sent to act on, and it held.
- **30 to-me / 16 cc-only of 99 live — does not reconcile with 28 / 17 for a population one
  smaller.** The 11/11 key exists only as prose; it was never committed as code, so the 2-memo gap
  **cannot be attributed** and is not attributed here. Stated as an unreconciled difference, not
  explained away.

### 1a. The finding: a prose spec recorded the guard and not the field terminator

The 11/11 prose records two things about the key — that 42 of 98 memos carry **bold-markdown**
headers rather than YAML, and that the label must be **guarded** (`in-reply-to:` contains `to:`).
Both were re-derived correctly. The key built from them still returned the wrong number: **37 to-me
/ 9 cc-only**, inflating this seat's own inbox by 7.

Cause: the bold style is **single-line and multi-field** —

```
**From:** Daedalus · **To:** Pard · **cc:** Calliope, xian, Argus, Iris, Theseus · **Date:** 2026-08-09
```

— so a `[^\n]*` capture on `to:` **swallows the `cc:` list into the `to:` value**, and every memo
where this seat is only cc'd on a single-line header reads as a `to:` recipient. Caught by printing
the captured value next to the verdict and hand-reading it, not by the count looking wrong: 37 is as
plausible a number as 30.

**The reusable form: a header key needs a guard on its label AND a terminator on its field, and the
prose that preserved the guard did not preserve the terminator.** A spelling note is not an
instrument. The cure is in this directory as code (`NEXT_LABEL` / `truncateAtNextLabel`), so the
next sweep re-runs it instead of re-deriving it from a sentence.

### 1b. Declared blindness of this key

**3 of the 85 live memos have no `to:` header at all** —
`amber-fleet-standdown-runbook-2026-08-11.md`, `calliope-to-mnemosyne-care-package-2026-03-27.md`,
`daedalus-to-xian-cc-team-carried-context-live-backfill-now-blocking-2026-08-12.md`. The key reports
them as neither to-me nor cc-me. Checked by filename: none is addressed **to** this seat (the third
is `cc-team`, so it is a cc-only false negative, which does not affect the candidate set this fire
acted on). Named rather than left to be discovered.

---

## 2. The adjudication — 12 candidates, 10 closed, 2 refused

Every verdict rests on a tool call in this fire against **live code or the live board**, not on the
memo's own claim and not on its age.

| date | memo | verdict | what was checked |
|---|---|---|---|
| 08-09 | daedalus → team, real test data on Amber | **closed** | informational; the corpus it announces is in active use (`.testdata/`, `compare-klatch-corpora.mjs`), backfill closed on the board 11/05 |
| 08-11 | pard → theseus, porous boundary adopted | **closed** | ends *"It's xian's call now"* — **xian ruled option 3 the next day** (`read/pard-to-argus-daedalus-cc-team-env-decision-option3-2026-08-12.md`), and the edit **landed in full**: `dotenv` is a real client dependency (`packages/client/package.json:30`) and the path resolves from `process.cwd()`, which was build note 2 (`__tests__/setup.ts:26`) |
| 09-03 | daedalus → theseus/iris, browse count answered | **closed** | its xian ask (the unmerged `cowork-import-hardening` merge decision) is **moot** — see §3 |
| 09-03 | daedalus → theseus/iris, cap cost measured | **closed** | its xian ask is **ruled**: `session-scanner.ts:250-251` — *"It was 1500 until 2026-09-04, when xian ruled to remove the cap"*; `FINGERPRINT_LINE_CAP = 50_000` |
| 09-04 | daedalus → theseus/iris, cache built, floor is 7 ms | **closed** | the one action on this seat — *"your Round 146 probe will now refuse to run … the on-disk equality check needs re-pinning"* — was discharged: `probe-browse-endpoint-vs-channel-count.mts:46-60` replaced the wholesale `afe0889^` restore with a transform (Round 159). **One live residual boarded, not closed with it** — see §4 |
| 09-04 | daedalus → theseus/janus/iris, cap never guarded upload | **closed** | `rejectOversizeBeforeRead` shipped; cap ruled the same week |
| 09-14 | daedalus → theseus/calliope, 208 was a coin flip | **closed** | a correction to his own number; nothing asked of this seat (*"your item 1 is still server-complete"*) |
| 09-17 | daedalus → theseus/argus, your red is green | **closed** | carried a routed action — *"take (a), `browse-latency` arm O on a corpus where the cap fires"* — **discharged by this seat the next day**: `round233-the-four-round-item-is-closed-and-arm-m-was-fingerprinting-a-corpus-the-endpoint-never-walked-2026-09-18.md`, and the instrument now takes a corpus argument and a cap env var (`probe-browse-latency-end-to-end.mts:138-159`, `:316-317`) |
| 11-05 | calliope → daedalus/theseus/iris, needs-you=1 | **closed** | asks nothing; this seat's own §6 ask is **live on the board** as rollup needs-you item 2, with the question carried verbatim (`attention-rollup.md:104`) |
| 11-06 | calliope → daedalus/theseus/argus, ma-smoke on the rollup | **closed** | *"Not asking anything new of any of you"*; the item is live as rollup needs-you item 3 |
| 10-23 | pard → theseus, capability test | **REFUSED** | re-verified: **names a live action on xian** (he runs the paste, then the keyless check, which Pard will not run himself), and `git log -1 -- docs/research/round445-capability-test/` still returns only `a93ede8d`, the commit that created it — **20 days, nothing has touched it** |
| 10-28 | daedalus → theseus/argus, the key was never the live defect | **REFUSED** | its §7 *"Yours, open, unchanged"* names **three** items on this seat (`C3` carrying its reading; re-keying the attested-round census to exclude denials; putting §1–§4 under graded legs). **Not asserting those are done without checking each** — a cure under a different subject does not close the thread |

**Four of the ten closures are paired outbound memos of this seat's own**, moved with their inbound
per the close discipline: the 08-11 porous-boundary reply, the 09-03 turncount reply, the 09-04
second-corpus reply, and the 09-04 import-at-size reply.

### 2a. One of this seat's own live memos was NOT moved, and the reason is the useful half

`theseus-to-daedalus-argus-…-the-corpus-was-never-the-cause-and-arm-p-was-writing-to-your-real-db-2026-09-17.md`
stays live: it ends with *"Still open on my side"* naming three items. **But one of those three is
itself stale** — *"§6(b) `DELETE /entities/:id` floor — parked on xian"* — and xian **ruled it**:
`attention-rollup.md:147`, *"Ruling: allow."* The memo is kept live on items (1) and (3), with the
stale line recorded here rather than silently inherited.

This is the same mechanism Daedalus named against his own task list this morning (his 11-12 §4):
**a line that names a parked decision goes stale silently the moment the decision lands.** Second
instance, different seat, same day.

---

## 3. The 09-03 memo's xian ask is moot, which unblocks a deferral of Daedalus's

The 09-03 browse-count memo closes with an open ask on xian, and a deferral built on it:

> *"I did not unify them, because that means editing `parser.ts`, which is exactly the file the
> unmerged `origin/claude/cowork-import-hardening` branch also changes. **Not creating a conflict
> there before that merge decision gets made** — which, xian, is still the open ask from my 9/2
> memo."*

Measured this fire:

```
git log -1 origin/claude/cowork-import-hardening   →  b5e1672a (2026-09-02)
git rev-list --left-right --count origin/main...origin/claude/cowork-import-hardening  →  2870  0
git merge-base --is-ancestor b5e1672a origin/main  →  rc=0
```

**The branch has zero commits not already in `origin/main`.** Its tip is an ancestor of main. There
is nothing to merge and nothing to conflict with, so the merge decision cannot be made because it no
longer exists as a decision — and **the blocker on unifying the scanner's filter with
`isHumanTurnBoundary` is dead**, 70 days after it was filed.

**Routed to Daedalus, not acted on:** the unification is his call and his file. Measured divergence
on real sessions was **0** when he filed it, so this is a latent-hazard cleanup, not a live defect.

---

## 4. Two live residuals found inside closed memos, boarded rather than closed with them

**(a) CLAUDE.md says 6 tables; the schema has 8 — and the doc's own rule triggers at 8.**
Daedalus flagged this on 2026-09-04 in the cache memo and declined to act — *"I have not edited
CLAUDE.md — shared doc, out of my lane."* **69 days later it is unchanged.** CLAUDE.md still reads
*"Add Drizzle when we hit 8+ tables (currently at 6)"* and lists six.

Counted this fire, and the naive count is wrong: `grep -c 'CREATE TABLE'` returns **9**, but `:186`
is `messages_rebuild`, a migration's temp table. The schema tables are **8** — `channels`,
`messages`, `entities`, `channel_entities`, `message_artifacts`, `projects`, `files`, `file_refs`
(`packages/server/src/db/index.ts:43,52,63,73,224,248,294,304`). **Daedalus's 09-04 figure of 8 is
exactly right today**; the drift is CLAUDE.md's, and it is 2 tables.

Not edited here either, for a different reason than his: the sentence is not merely stale, it is a
**rule with a threshold we have reached**, so correcting the number without ruling on Drizzle
publishes a doc that instructs the next agent to adopt an ORM. That is xian's and Daedalus's call
together, not a typo fix. Boarded and routed.

**(b) "What should the over-cap import heads do instead of erroring" is on no board, 69 days.**
Named by this seat in the 09-04 import memo and agreed by Daedalus in his reply (*"product, not
measurement — Theseus flagged it and I agree it isn't ours"*). Three of Piper Morgan's eleven
department heads are **offered in browse and then rejected on import**; the error is accurate and
fast, and it is a wall.

Searched `attention-rollup.md` for `over-cap`, `oversize`, `too large to import`, `MAX_IMPORT_SIZE`,
`50 MB`, `import size`, `a wall`: **zero hits.** It appears only in `COORDINATION.md`'s 9/4 fire
narrative — an agent-facing log, not xian's skim surface.

**This is the second instance of one mechanism, which is what makes it worth writing down.** On
11/11 this seat boarded the Round 445 capability test after finding it had been parked on xian for
19 days while living only in a mail file and another agent's drain line. Same shape here. **A
decision that is correctly identified as "not ours" gets named in the memo, agreed by the other
seat, and then belongs to nobody** — both seats have discharged their duty by naming it, and no step
in the protocol moves it to the board. Boarding is the cure; promotion to the rollup is Calliope's
call and is not asserted here.

---

## 5. What this fire did not do

- **No `packages/` or `scripts/` change.** `git diff --stat -- packages scripts` empty; the one new
  `.mjs` is under `docs/research/`, which `typecheck:scripts` (`-p scripts/tsconfig.json`) does not
  cover and `readdirSync('scripts')` does not see, so the probe population is unchanged and **no
  gate leg is owed**.
- **Did not verify the 10-28 memo's three items individually.** That is the refusal, stated as such.
- **Did not reconcile 30/16 against 11/11's 28/17.** The 11/11 key is not on disk; see §1.
- **Did not edit CLAUDE.md** (§4a) or the rollup (§4b).
