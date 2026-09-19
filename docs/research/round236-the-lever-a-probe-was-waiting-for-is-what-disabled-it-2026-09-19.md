# Round 236 — the lever a probe was waiting for is what disabled it

**Agent:** Theseus · **Date:** 2026-09-19 (WORK fire) · **Model calls:** 0
**Predecessor:** Round 235 (Daedalus, `KLATCH_EXPORT_ROOT` built) · Round 234 (Theseus, three arms repaired)
**Subject:** the five probes Daedalus routed to my seat in
`daedalus-to-theseus-…-your-section-3-is-built-and-the-first-probe-it-broke-was-mine-2026-09-19.md` §5

---

## 0 — The one-paragraph version

Daedalus named five probes that relocate `CLAUDE_CONFIG_DIR`, hit the browse endpoint, and say
nothing about the export corpus — and explicitly declined to claim they were red, on the grounds
that his own red had surfaced three layers from its cause. Driven unmodified: **all five are red.**
Four of them for the export-corpus leak Round 234 created. But the driving turned up three things
the leak count does not capture: a probe whose two headline arms **have not run since 2026-09-04**,
disabled by the very feature they were written to work around; a probe that did not go red but
**died mid-run**, killed by a button caption that changed because a corpus in a different directory
gained a row; and, under that, a probe defect the leak had been **masking** — an arm aimed at a
control its own finding's fix had deleted.

Repaired, re-driven, and the remaining reds are deliberate: they are the live-corpus drift Daedalus
routed to xian, now confirmed independently from two further probes and two different directions.

---

## 1 — Driven before repaired: 5 of 5

I do not repair an arm I have not personally seen fail. Every probe below was driven **unmodified**
against `918283ef` first.

| probe | unmodified verdict | reds, by cause |
|---|---|---|
| `probe-browse-endpoint-second-corpus` | 3 FAIL · 2 SKIP · exit 1 | export leak ×2 · live drift ×1 · **arms C/E dead 15 days** |
| `probe-pm-corpus-cap-delta` | 5 FAIL · exit 1 | export leak ×3 · live drift ×2 |
| `probe-round171-path-b-jit-import-browser` | 2 FAIL (15/17) | export leak ×2 |
| `probe-round174-browse-route-seating-in-a-browser` | 2 FAIL (6/8) **+ threw** | export leak → run died at arm N2 |
| `probe-round177-browse-done-seating-in-a-browser` | 1 FAIL (24/25) | export leak |

Raw output for each is in `.testdata/r236-pre-*.txt`.

The export leak is one file: `exports/sessions/theseus-2026-03-22.jsonl`, 3.86 MB, the only thing
under `exports/sessions/` (`ls`, this fire). It arrives as a group named `Exported sessions` with
`isExported: true` on the session (`session-scanner.ts:661-667`).

---

## 2 — THE FINDING: `probe-browse-endpoint-second-corpus` lost its subject on 2026-09-04

Arms C and E are what this probe is *for*: C prices browse against the Piper Morgan corpus
(`~/.claude-pm/projects`), E is the delta between the two corpora. Both have been **skipping on
every run for fifteen days**, in a probe that still exited 1 for unrelated reasons — so the skip
never looked like the story.

The probe reaches the second root by patching the scanner's source literal, because when it was
written there was no environment lever. Its own header says so:

> *"Daedalus routed CLAUDE_CONFIG_DIR support to his own seat and did not build it."*

From `git log`, not from anyone's memo:

```
432c2ada  2026-09-04 10:56:59 -0700  round148: price browse against the second corpus at the endpoint
4602561d  2026-09-04 13:30:22 -0700  round149: the session scanner walks more than one Claude config root
```

`git merge-base --is-ancestor 432c2ada 4602561d` → the probe precedes the scanner change.

**`round149` built exactly the lever the probe was working around — and the same commit rewrote
`getClaudeProjectsDir()` to read `CLAUDE_CONFIG_DIR`, deleting the literal the workaround patched.**
The header sentence was true for **2 hours and 34 minutes**. The probe's skip guard then did its job
perfectly: it refused to guess at a patch that no longer matched, printed `0 occurrences of the
literal, expected 1`, and skipped — correctly, quietly, for fifteen days.

> **The rule.** A workaround is dead code the moment the thing it works around exists — but it does
> not announce that, it announces a *failed match*. A guard that degrades to a skip converts
> "this feature shipped" into "this arm is missing," and the two are indistinguishable in the output.
> **Every workaround should name the condition that would retire it**, so the skip can say *why*
> rather than only *that*.

This is a sibling of Daedalus's Round 235 rule, from the other side. His: an isolation property
nothing asserts is one you learn about from an unrelated failure. Mine: a workaround nothing
watches is one that outlives its reason and takes an arm with it.

### 2a — A second stale clause in the same probe, from the same commit

Arm E's projection of a combined browse was labelled *"no build exists that does this"* — also
falsified by `4602561d`, which is what taught the scanner to walk several roots. The projection is
now **checkable** (via `KLATCH_EXTRA_SESSION_ROOTS`) rather than unfalsifiable. Corrected in place;
the union arm is named as follow-up, not built this round.

Two false clauses, one commit, fifteen days, in a probe that ran to completion every time.

---

## 3 — What arms C and E say, now that they run

First measurement of the PM corpus at the endpoint since the probe was written:

| | shipped root | second root (PM) |
|---|---|---|
| files | 539 | 89 |
| bytes | 668 MB | 630 MB |
| sessions at the wire | 539 across 16 projects | 89 across 78 projects |
| cache-cold browse | 2907 ms / 2905 ms | 2751 ms |
| steady state | 13 ms | 4 ms |
| **cold cost per MB** | **4.35 ms/MB** | **4.37 ms/MB** |

**Per-MB cold cost agrees to 1.00×** across two corpora whose file shapes differ by 5.7× in mean
size (7.1 MB/file vs 1.24 MB/file). Cold browse cost tracks *bytes*, near-exactly, and is close to
indifferent to how those bytes are divided into files.

**Stated carefully, because it looks like it settles something it does not.**
`probe-pm-corpus-cap-delta` arm H compares the two corpora on the *cap delta* — the marginal cost of
lines above `FINGERPRINT_LINE_CAP` — and concludes lines and bytes bracket rather than agree
(PM 7.3 ms/1k lines vs shipped 9.0; PM 4.1 ms/MB vs shipped 2.8). That is a different quantity from
the whole-corpus cold browse measured here. These two results are **not** in conflict and the second
does not resolve the first: full-corpus cold cost is per-MB-stable; the above-cap marginal cost is
not, on the same two corpora. Worth its own round; not claimed as settled here.

The arm also verifies the lever **by effect** rather than by having set it: 89 sessions at the wire,
where 539 would mean `CLAUDE_CONFIG_DIR` silently did nothing. That check is the replacement for
what the old source patch's skip was protecting — measuring the wrong directory produces a number
that looks fine and means nothing.

---

## 4 — `probe-round174` did not go red. It died.

The worst outcome of the five, and the one that most vindicates Daedalus's caution.

Unmodified, the probe hung for 60 s at arm N2 and threw, with **every arm after N2 unrun and
nothing reported about them**. 6 of 8 checks, 11 measurements, then silence.

Mechanism, read out of client source rather than inferred:

1. `ImportDialog.tsx:775` picks the completion caption from the **count**:
   `composeMode && bulkResult.imported.length === 1 ? 'Use this agent' : 'Done'`.
2. The leaked export shows up in the browse panel as an importable row, with a guessed agent name
   of — literally — **"Exported sessions"**
   (`MEAS [N1] the result list rows — [… "klatch — 2026-03-11(132 messages)→ new agent: Exported sessions"]`).
3. Arm N1 imported **two**, so the caption read "Done", and N1 passed.
4. By N2 the export was already imported, so **one** landed, the caption flipped to "Use this
   agent", and `resultRows()` — which waits for the literal string `Done` — burned its timeout and
   threw.

A probe about seating an imported agent, driven against a synthetic fixture tree, was killed by a
button caption changing because a corpus in another directory gained a row.

### 4a — Green arms with contaminated witnesses

Counting reds understates this. In two probes the leak entered sets that **passing** arms assert
over:

- `probe-round171` arm D passed *"the browse+confirm path can mint an identified agent"* on the
  evidence `names=["Claude","Piper Morgan","Wren","Exported sessions"]`.
- `probe-round174` arm N1 passed *"the imported session has a clickable row in the result list"* on
  a two-row list whose second row was the export.

Both passes were true. Both were true of a world with a corpus in it that the probe's own isolation
claim said was not there. **A check that passes on a contaminated set still launders the
contamination into the record** — nothing in the output says the witness was wrong.

### 4b — The leak was masking a probe defect, and removing it surfaced one

After the export suppression landed, round174 got much further — and threw again, at a *second*
hardcoded caption, in arm M2. That arm turns out to have been aimed at a control that its own
finding's fix deleted:

```
62321b2c  2026-09-08  Round 174: the Browse route driven in a browser — the fix holds, "Done" throws it away
6742eab6  2026-09-09  Round 174: Browse-route "Done" seats the single agent it resolved, not silence
```

Arm M2 documented, on 9/8, that pressing "Done" after a single-session compose-mode import threw the
seat away. The 9/9 fix included renaming that button to **"Use this agent"** in exactly the N=1 case
the arm constructs. From the day the defect was fixed, the arm was waiting on a caption that no
longer occurs in the state it builds — and it did not throw immediately only because the Round 234
export corpus later pushed the count back to two.

**So the leak was holding a broken arm upright.** Suppressing the leak is what made the arm's real
condition visible. This is the inverse of the usual reasoning about contamination: the contaminated
run was the one that *looked* like it worked.

> **The rule.** *A fix retires the probe arm that found it.* An arm written against a defect
> describes a state that, if the fix is any good, no longer exists — and unless the arm is re-aimed
> at the **question** rather than the **symptom**, it becomes a stale assertion pointed at deleted
> UI. Worse: it usually fails by hanging rather than by failing, because the thing it waits for is
> simply absent.

Repaired by locating the control among the captions the component can actually render and demoting
the caption itself to a measurement — a fact that changes when a product decision changes does not
belong in a locator. Arm M1's literal `'Done'` is left as-is and annotated: it imports two, which is
the branch where `Done` is correct, and the `rows === 2` check above it is what licenses the
literal.

---

## 5 — Repairs

Common to all five: `KLATCH_EXPORT_ROOT` → an export-free scratch directory per server generation.
Suppression is relocation (`paths.ts:getExportRoot`, replace semantics, no disable flag), so the
mechanism is a directory with no `exports/sessions/` beneath it. `probe-browse-endpoint-second-corpus`
additionally clears all three root variables out of the inherited fire environment before setting
any, matching `probe-multi-root-browse`.

Beyond the one-liner:

1. **Arm C uses the lever, not a source patch.** The patch machinery is deleted rather than
   re-matched. The scanner's exit handler used to *write* the original bytes back; it now only
   verifies — nothing patches the file, and a restoring handler would silently revert a concurrent
   edit by something else.
2. **Export suppression is asserted, not assumed** (`probe-browse-endpoint-second-corpus`), counting
   both `isExported === true` sessions and `Exported sessions` groups across every generation, so a
   rename of the display label cannot quietly make the check vacuous. `ran.length === 0` is an
   explicit fail, not a pass.
3. **`probe-pm-corpus-cap-delta` names unaccounted IDs** instead of counting them.
4. **`probe-round171`'s closing sentinel now asserts something.** It read
   `the real ~/.claude session tree was never scanned` from the *same* response object captured
   before the drive began, and printed `CLAUDE_CONFIG_DIR=…` as its evidence — a claim about the
   whole run, evidenced by naming where the check would have been made rather than what it found.
   (Precisely the failure in cross-pollination insight #3, 2026-09-19.) It now rescans at the wire at
   end of run and asserts on path membership, so a corpus that appears *during* a run is caught.
5. **`probe-round174` fails instead of hanging.** `resultRows()` waits for either caption and, on
   timeout, reports the buttons actually on screen.

---

## 6 — After repair

| probe | before | after |
|---|---|---|
| `probe-browse-endpoint-second-corpus` | 22 checks · 3 FAIL · 2 SKIP | **35 checks · 2 FAIL · 0 SKIP** |
| `probe-pm-corpus-cap-delta` | 39 checks · 5 FAIL | **39 checks · 2 FAIL** |
| `probe-round171-path-b-jit-import-browser` | 15/17 · exit 1 | **17/17 · exit 0** |
| `probe-round174-browse-route-seating-in-a-browser` | 6/8 · threw at N2 | see §6a |
| `probe-round177-browse-done-seating-in-a-browser` | 24/25 · exit 1 | see §6a |

**Every remaining red is the live-corpus drift, deliberately left.** Both probes now name the same
file from two directions:

- `probe-browse-endpoint-second-corpus` arm A, from **disk**: largest file across both roots is
  53,635 lines, headroom **−7%** against the 50,000 guard.
- The same probe's arm D, at the **wire**, for the first time ever on this corpus:
  `1 CAPPED: 440fe16b-46f8-4fbb-9b0d-3285c425aa37`.
- `probe-pm-corpus-cap-delta` arms E and G: `1 of 89 sessions capped at 50000`, `1 PM sessions
  exceed 50000 lines`.

`440fe16b…` is the file Daedalus named in his §3. **Independently confirmed here from a different
probe, on a different arm, by two different methods.** His diagnosis holds: this is live-corpus
drift, not a code regression, and nothing to do with Round 234.

I agree with leaving it red, and for one reason stronger than "don't widen a guard because it went
red": `probe-pm-corpus-cap-delta` arm E's own failure text, written in Round 153, says
*"THIS IS THE SIGNAL session-scanner.ts:255-263 asks to be watched for, not a probe bug."* The red
is the monitoring trigger firing as designed. Converting it to a NOTE would be switching off the
alarm because it went off.

**Worth flagging for whoever answers the cap question:** the arm that reports the cap biting at the
*wire* on the PM corpus is arm D of `probe-browse-endpoint-second-corpus` — which is one of the arms
that has not run since 2026-09-04. The endpoint-level evidence for this monitoring trigger did not
exist until this round.

---

## 7 — Open

- **For xian — the capped PM session.** `440fe16b-46f8-4fbb-9b0d-3285c425aa37`, 53,635 lines, 99 MB,
  under `~/.claude-pm/projects/-Users-xian-Development-piper-morgan-worktrees-docs/`. Four arms
  across two probes stay red until this is answered. Daedalus routed the same question; this is
  corroboration, not a second ask.
- **Mine, not done this round:** the union arm (`KLATCH_EXTRA_SESSION_ROOTS` over both roots) that
  would turn arm E's combined-browse *projection* into a measurement. Now possible; named rather
  than built.
- **Mine, unmoved:** arm O's band (Round 234 §5); why `tsx` runs `exit` listeners on a signal death
  that plain node doesn't.
- **Parked on xian:** `files/storage.ts:38`, the backfill dry run, `DELETE /entities/:id`.
</content>
