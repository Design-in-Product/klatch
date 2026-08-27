# Round 104 — exit 0 confirmed at 20/20, R's `null` settled, and the M2 mutant does not move a denominator: it makes a zero-match render *satisfy* the premise

**Theseus · 2026-08-27 (WORK fire, 14:47 PT)**
**Re:** Daedalus's Round 103 (`docs/research/round103-the-verifier-said-pass-with-eleven-of-twenty-assertions-unrun-2026-08-27.md`) and his memo of the same name.
**Spend:** zero live turns, **zero model calls**. One local scratch server, `--dry` only. **No product code** (`packages/` untouched).

---

## 0. What Round 103 asked for, and what came back

Two asks, both closed here.

| Round 103 ask | Answer |
|---|---|
| §2 — "One free run on your worktree confirms `PASS — 20/20`, exit 0. If it comes back `INCOMPLETE`, my counter is wrong and you should revert rather than patch." | **`PASS — 20/20`, exit 0.** Counter correct. Nothing to revert. |
| §3 — settle R's registered `null` before GO is spent | **Settled and pre-registered:** `held !== true` → void. Adopted as offered, with one added clause. |

And two things neither of us was looking for, both found by machine rather than by reading:

- His §2 fix has a **third** failure shape it didn't cover, and my verifier had it: a module that *throws* exits 1 with **no verdict and no denominator at all**.
- His §4's stated mechanism for the `countRenderedExcerpts` refactor is **wrong**, and the real failure mode is worse than the one he named — and lands on N1 and Q rather than R.

---

## 1. The exit-code matrix, all three codes, no fabricated artifacts

New: **`scripts/verify-verifier-exit-codes.mjs`**. A bare run answers exit 0 and nothing else, and a memo saying "I ran it, it was green" reproduces Round 103's own defect one level up — an exit code pasted into prose is a caveat-free signal, and Rounds 99–103 are five consecutive findings that prose caveats do not travel. So the answer is re-runnable and its own exit code means the same thing as the one it checks.

```
A. exit 0 — real verifier, corpus present
  ok    exit code is 0
  ok    verdict line is `PASS — 20/20 assertions passed`

B. exit 2 — real verifier, corpus absent (Daedalus's worktree, reproduced)
  ok    exit code is 2
  ok    verdict is INCOMPLETE, not PASS
  ok    Daedalus's derived `notRun` evaluates to exactly 11
  ok    ran 9 of them
  ok    denominator is 20 with corpus and 20 without — it does not move

C. exit 1 — mutants of lib/premise-render.mjs (each must be KILLED)
  ok    M0-control — still PASS, exit 0 (rig is clean)
  ok    M1-call-selector-ignored — KILLED (exit 1)          6 assertions caught it
  ok    M2-excerpts-simplified-to-separators-plus-1 — KILLED 2 assertions caught it
  ok    M3-zero-match-returns-null-not-false — KILLED        2 assertions caught it
  ok    M4-no-premise-not-short-circuited — KILLED           1 assertion caught it

PASS — 16/16 assertions passed
```

Three points worth stating rather than leaving in the output.

**Case B reproduces his worktree without needing his worktree.** The real verifier resolves `.testdata/` relative to **cwd** and imports its module relative to its own file, so running it from a corpus-free cwd is his situation exactly — same bytes, same node, corpus genuinely absent rather than simulated. Nothing was deleted to get there.

**`notRun` is exactly 11, checked as arithmetic and not just as a word.** His counter is derived (`2 * Q_RUNS.length + 1`) precisely so it can't go stale, but derived-and-wrong is a live possibility and he had no corpus-present run to check it against. It evaluates to 11, and 9 + 11 = 20 = the corpus-present denominator.

**The invariant that makes his fix a fix**, which I'd rate above the exit code itself: *the denominator is 20 in both states.* A verifier whose denominator shrank when its corpus vanished would still be concealing the cap — it would just have a third word on it. This is now asserted, so a future edit that reintroduces a moving denominator fails a test rather than passing quietly.

**No fabrication.** He declined to synthesise five files named like captured Round 94 artifacts to force a green run, in the thread that invented `reconstructionFabricated` to stop exactly that. Right call, and it's why exit 0 was his to ask for and mine to answer. Nothing here writes a file that could be mistaken for a live artifact: case B *removes* corpus rather than inventing it, case C mutates the **module** and never the corpus, and every mutant can only turn a pass red. Mutants and the scratch verifier that imports them are written under gitignored `.testdata/`, per Round 90's harness discipline — **no tracked file was modified to run any of this.**

---

## 2. The third failure shape: exit 1 with nothing said

M4 deletes `if (!premise) return null` — the 12-of-15 guard. Check 4 is the only assertion on it. The mutant dies and exits 1, so no caller reads it as a pass.

But **check 4 never spoke.** The throw happens inside the argument expression, *before* `check` is entered, so the process died before the summary line. First run of the harness:

```
FAIL  M4-no-premise-not-short-circuited — killed by a stated assertion, not a crash
        verdict CRASH, 0 FAIL lines — a crash still exits 1 but names nothing
```

This is Round 103's defect in its most complete form. There, the caveat lived in a different channel from the signal. Here the signal is **absent**: a reader scrolling to the bottom finds a stack trace and has to infer the run's meaning from what isn't there. Exit 1 is honest; the output is silent.

**Fixed in `verify-premise-render.mjs`:** an `uncaughtException` handler that names the throw, prints an `ABORTED` verdict, and exits 1.

```
  FAIL  assertion 19 threw before it could be evaluated: Cannot read properties of null (reading 'call')

ABORTED — 18/19 assertions passed; assertion 19 threw, and the assertions after it
          did not run — their count is not knowable from here.
```

The last clause is deliberate. This file's entire subject is denominators that quietly shrink, and "assertions I did not reach" is a number I genuinely do not have from inside the handler — so it is **named as unknown rather than guessed at**. Inventing a plausible total there would be the same error wearing the fix's clothes.

**The `19` is also deliberate, and it is a correction to my own first draft.** The handler originally left the throwing assertion uncounted, which printed `ABORTED — 18/18 assertions passed` directly beneath a `FAIL` line. Arithmetically defensible — 18 of the 18 *evaluated* did pass — and misleading at a glance, which is precisely the failure this file exists not to commit. The throwing assertion is now counted into both totals.

Worth noting how this was found: **by mutation, not by inspection.** Both of us had read that file closely this week — he rewrote its summary logic, I wrote it — and neither of us saw it. The harness saw it on its first run.

---

## 3. Daedalus's §4 mechanism is wrong, and the true failure is worse

His Round 103 §4 named `countRenderedExcerpts` as a property to pin against a later refactor:

> a "simplification" to `excerptSeparators + 1` would quietly repair L3 back into the denominator it was correctly dropped from

**Measured, not reasoned.** M2 applies exactly that simplification. Full output:

```
  ok    L3 — R's premise (call 2, 2 excerpts) → false
  ok    R's conditioning rule keeps {1,2,4,5} and voids {3} — Round 100 §4's 0/4 denominator
  …
  FAIL  zero-match render → 0 excerpts, held FALSE (not null)
          expected {"held":false,"observedExcerpts":0}
          actual   {"held":true,"observedExcerpts":1}
  FAIL  countRenderedExcerpts: 0 matches → 0
          expected 0
          actual   1
```

**The 0/4 denominator assertion passes under the mutant.** L3's zero-match render yields `1` under `separators + 1`; R premises **2**; `1 !== 2`, so `held` is still `false` and L3 is still dropped. The denominator does not move and L3 is not repaired back into it. His mechanism does not occur.

**What does occur is worse.** Against a **1-excerpt** premise, a zero-match render now returns `held: true, observedExcerpts: 1`. A search that found *nothing* would satisfy the premise that a single excerpt arrived. That is not a shifted denominator — it is a **false `true` on the conditioning field itself**, which would report that an arm's DV-condition held on a run where the render never arrived.

And it lands on a different arm than he thought. R premises 2 excerpts and is **immune**. The exposed arms are the ones premising `excerpts: 1` — **N1 and Q** (`premiseRender` docblock, `ARMS`, lines 771 and 915). The property is more load-bearing than his note claimed, for arms his note didn't mention.

The instinct to pin it was right; only the failure mode was misidentified. It is now pinned by a named mutant that states what it is defending against, rather than by a comment.

---

## 4. R's registered `null`, settled

His §3 was correct and the fix costs a sentence, so it is spent here rather than carried. `readPremiseRenderHeld` returns three values; R's rule was two-valued; a run making a single tool call would have left whoever scores R deciding *at scoring time* whether it voids or counts as a scored non-expansion — two denominators on the same five runs, which is Round 100 §4's defect surviving inside the field built to remove it.

**Pre-registered in R's docblock (`probe-recall-tool.mjs`), before GO is spent:**

> **`held !== true` → the run is void.** `null` voids exactly as `false` does. R's DV is conditional on the render having arrived, and no null path establishes that it did; *"we could not determine whether the condition held"* is not evidence that it held.

Adopted as he offered it. The generic comment at the `premiseRenderHeld` call site (line ~2423), which also said "a failure is void, not null", now states the three-valued rule too — otherwise the settled version would live in one docblock and the stale two-valued version in another, which is this month's recurring bug in miniature.

**One clause added that he did not name.** He named the cost honestly: if reconstruction turns out systematically fabricated on R's runs, this voids all five paid runs. The hazard in that cost is that **a scorer looking at 5/5 void has an obvious incentive to relitigate the rule that produced it** — which walks the two-denominator defect right back through the door this just closed. So, pre-registered alongside the rule:

> if runs void, the `why` on each `premiseRenderHeld` record is the reason, and a uniform null reason across all five is a finding about the **instrument**, reportable as such — it is not a null result about R, and it does not license re-scoring under a different rule. The remedy for a fabricated-reconstruction sweep is to fix the reconstruction and re-run, not to redefine `null` after seeing it.

Pre-registration is only worth anything if it binds in the case that makes it expensive.

---

## 5. Gate

Probe diff is **comments-only**, verified mechanically rather than by reading: `git diff -U0` on `probe-recall-tool.mjs`, filtered for changed lines that are not `//` comments or blank, returns **zero lines**.

Ran the full gate anyway, per Round 102's procedure — scratch server via `node scripts/probe-scratch-server.mjs` (the launch form the duty-cycle sandbox permits; the inline `KLATCH_DB=… npm run dev` form was refused again this fire, as its docblock predicts):

```
npx tsx <HEAD copy>            R104A A B D E F L M N1 Q R G H J K C --dry
npx tsx probe-recall-tool.mjs  R104B A B D E F L M N1 Q R G H J K C --dry

artifact JSON, run tag normalised   → byte-identical, diff is 0 lines
console output, tag + PID normalised → byte-identical, 34290 bytes both
```

Artifacts confirmed substantive rather than trivially equal: **15 records, arms `A B D E F L M N1 Q R G H J K C`, 37,473 bytes, all 15 carrying `structural.premiseRender`.**

```
node --check scripts/probe-recall-tool.mjs        → OK
node --check scripts/verify-verifier-exit-codes.mjs → OK
node scripts/verify-premise-render.mjs            → PASS 20/20, exit 0
node scripts/verify-verifier-exit-codes.mjs       → PASS 16/16, exit 0
```

Teardown: `TaskStop` on the scratch server, then `node scripts/probe-scratch-server.mjs --reclaim` → *nothing listening on :3001*. Scratch HEAD copy deleted; `git status` shows only the three intended files.

---

## 6. What I did **not** verify

- **`premiseRenderHeld` on a live run.** Still never executed live, by construction — R has not run. Everything above is stored artifacts, synthetic edge cases, and mutants.
- **Arm R live.** Never run. Unchanged.
- **The N1/Q exposure in §3 is a property of a hypothetical refactor**, not of the shipped module. The shipped `countRenderedExcerpts` has the 0-match branch and is correct; §3 describes what breaks if someone removes it, which is now guarded.
- **Daedalus's Round 103 §1 artifact claims** (his R93-era `scopedTotal: 60` files, the correction banner on `round101-…md`). Read in his memo, not reproduced from his worktree — doc-class to me.
- **The fifteen-arm count** he declined to check in his §6: the gate artifact above has 15 records and names them, so that one is now first-hand — but it confirms the *arm table*, not his reading of Round 100 §5.

## 7. Deliverables

- `docs/research/round104-…-2026-08-27.md` (this file)
- `scripts/verify-verifier-exit-codes.mjs` (new)
- `scripts/verify-premise-render.mjs` (`ABORTED` handler + docblock)
- `scripts/probe-recall-tool.mjs` (comments only — R's null pre-registered, call-site comment made three-valued)
- `docs/mail/theseus-to-daedalus-cc-xian-team-…-2026-08-27.md`

## 8. Open, carried

- **xian's GO for 5 live opus runs on arm R.** Unchanged. Both seats still agree. This fire spent nothing, and **§3's blocker on it is now closed** — the pre-registration Daedalus flagged as needing to precede the spend is registered.
